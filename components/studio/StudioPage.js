"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  decodePrefill,
  encodeReadingLink,
  encodeReadingToken,
  extractReadingCode,
  saveReadingLink,
} from "@/lib/readingLink";
import { calculateReading } from "@/lib/teaser";
import methodology from "@/data/methodology.json";
import QRCode from "@/components/QRCode";
import bankA1 from "@/data/readings/a1.json";
import bankA2 from "@/data/readings/a2.json";
import bankA3 from "@/data/readings/a3.json";
import bankA4 from "@/data/readings/a4.json";
import bankA5 from "@/data/readings/a5.json";
import bankA7 from "@/data/readings/a7.json";
import bankA9 from "@/data/readings/a9.json";
import bankA10 from "@/data/readings/a10.json";
import bankA11 from "@/data/readings/a11.json";
import bankB1 from "@/data/readings/b1.json";
import bankC1 from "@/data/readings/c1.json";
import bankC2 from "@/data/readings/c2.json";
import bankD1 from "@/data/readings/d1.json";
import verdictBank from "@/data/readings/verdict.json";

// СТУДИЯ ПРОИЗВОДСТВА (скрытая страница для Артёма, /studio).
// Поток: пришла оплата в Telegram → тап по ссылке «Студия» (всё уже
// заполнено) или вставить текст заказа → проверить расчёт → (опц.)
// сгенерировать ИИ-вердикт → собрать персональную ссылку → Copy link /
// Copy email / QR → отправить клиенту на почту. Бэкенда нет: всё в браузере.

const KEY_STORAGE = "nomen-lab-key"; // тот же личный ключ Claude, что в /lab

const BANKS = {
  A1: bankA1, A2: bankA2, A3: bankA3, A4: bankA4, A5: bankA5, A7: bankA7,
  A9: bankA9, A10: bankA10, A11: bankA11, B1: bankB1, C1: bankC1, C2: bankC2,
  D1: bankD1, VERDICT: verdictBank,
};

const EMPTY = {
  g: "", fn: "", ln: "", bd: "", bt: "", bp: "", br: "", em: "", oc: "", tier: "",
};

// Краткая строка значений всех пунктов — для проверки глазами и для промпта.
function summarize(r) {
  if (!r) return [];
  const s = [];
  if (r.a1) s.push(`Life Path ${r.a1.value}${r.a1.archetype ? ` (${r.a1.archetype})` : ""}`);
  if (r.a2) s.push(`Birthday ${r.a2.value}`);
  if (r.a3) s.push(`Expression ${r.a3.value}`);
  if (r.a4) s.push(`Soul Urge ${r.a4.value}`);
  if (r.a5) s.push(`Personality ${r.a5.value}`);
  if (r.a7) s.push(`Maturity ${r.a7.value}`);
  if (r.a9)
    s.push(
      `Karmic lessons: ${r.a9.lessons.length ? r.a9.lessons.join(",") : "none"} · hidden passion ${r.a9.passions.join(",")}`
    );
  if (r.a10) {
    const strong = Object.entries(r.a10.cells)
      .filter(([, n]) => n >= 3)
      .map(([c, n]) => `${c}×${n}`);
    const empty = Object.entries(r.a10.cells)
      .filter(([, n]) => n === 0)
      .map(([c]) => c);
    s.push(`Psychomatrix: strong ${strong.join(" ") || "—"} · empty ${empty.join(" ") || "—"}`);
  }
  if (r.a11) s.push(r.a11.hasDebt ? `Karmic debt ${r.a11.debts.join(",")}` : "No karmic debt");
  if (r.b1) s.push(`Sun in ${r.b1.name}`);
  if (r.c1) s.push(`Chinese: ${r.c1.name}`);
  if (r.c2) s.push(`Element: ${r.c2.name}`);
  if (r.d1) s.push(`Tarot: ${r.d1.name} (${r.d1.roman})`);
  return s;
}

// Парсер текста заказа из Telegram (формат buildOrderText в CryptoCheckout).
function parseOrderText(text) {
  const pick = (re) => (text.match(re) || [])[1]?.trim() || "";
  const out = { ...EMPTY };
  out.oc = pick(/Заказ\s+#?(\S+)/);
  out.tier = pick(/Тариф:\s*(.+)/);
  const name = pick(/Имя:\s*(.+)/);
  if (name && name !== "—") {
    const parts = name.split(/\s+/);
    out.fn = parts[0] || "";
    out.ln = parts.slice(1).join(" ");
  }
  const g = pick(/Пол:\s*(\S+)/);
  if (/жен/i.test(g)) out.g = "f";
  else if (/муж/i.test(g)) out.g = "m";
  const birth = pick(/Дата рождения:\s*(.+)/);
  if (birth) {
    const parts = birth.split(",").map((p) => p.trim());
    out.bd = parts[0] || "";
    let rest = parts.slice(1);
    if (rest[0] && /^\d{1,2}:\d{2}$/.test(rest[0])) {
      out.bt = rest[0];
      rest = rest.slice(1);
    }
    out.bp = rest.join(", ");
  }
  out.br = pick(/Бренд\/ник:\s*(.+)/);
  out.em = pick(/Email:\s*(\S+)/);
  if (out.em === "—") out.em = "";
  return out;
}

// Готовое письмо клиенту (EN).
function buildEmail(card, link) {
  const subject = `Your NOMEN full reading is ready${card.oc ? ` · ${card.oc}` : ""}`;
  const body = [
    `Hi ${card.fn},`,
    "",
    "Your payment is confirmed, and your full reading is ready.",
    "",
    "Open your personal page here:",
    link,
    "",
    "This link is yours to keep: revisit it anytime, on any device. It is personal, so share it only with people you trust to read you this closely.",
    "",
    "— NOMEN",
    "nomen.website",
  ].join("\n");
  return { subject, body };
}

// ym-disable-keys: студия — сплошные PII клиентов, Вебвизор ввод не пишет.
const inputCls =
  "ym-disable-keys w-full rounded-lg border border-foreground-muted/40 bg-background-alt px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent-turquoise focus:outline-none";
const btnCls =
  "rounded-lg border border-accent-turquoise/60 px-4 py-2 text-sm text-accent-turquoise transition-colors hover:bg-accent-turquoise/10 disabled:cursor-not-allowed disabled:opacity-40";

export default function StudioPage() {
  const [tab, setTab] = useState("make"); // make | texts
  const [card, setCard] = useState(EMPTY);
  const [orderText, setOrderText] = useState("");
  const [verdict, setVerdict] = useState("");
  const [genBusy, setGenBusy] = useState(false);
  const [genNote, setGenNote] = useState("");
  const [link, setLink] = useState("");
  const [linkNote, setLinkNote] = useState("");
  const [copied, setCopied] = useState("");
  const copyTimer = useRef(null);

  // Prefill из Telegram-ссылки (#o=…): hash доступен только на клиенте после
  // гидратации, поэтому одноразовый setState в эффекте здесь неизбежен.
  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (!alive) return;
      try {
        const pre = decodePrefill(window.location.hash);
        setCard({ ...EMPTY, ...pre });
      } catch {
        /* нет prefill — чистая форма */
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  const set = (k) => (e) => {
    setCard((c) => ({ ...c, [k]: e.target.value }));
    setLink(""); // поля изменились — прежняя ссылка неактуальна
  };

  const reading = useMemo(() => {
    if (!card.fn || !card.bd) return null;
    try {
      return calculateReading({
        name: `${card.fn} ${card.ln}`.trim(),
        date: card.bd,
      });
    } catch {
      return null;
    }
  }, [card.fn, card.ln, card.bd]);

  const summary = useMemo(() => summarize(reading), [reading]);
  const ready = Boolean(reading && card.fn && card.bd);

  const doParse = () => {
    const parsed = parseOrderText(orderText);
    setCard((c) => ({ ...EMPTY, ...parsed, g: parsed.g || c.g }));
    setLink("");
  };

  // Карточка клиента для персональной ссылки (одна на разбор И персонажа).
  const buildPayload = () => {
    const payload = {
      t: "full",
      fn: card.fn.trim(),
      ln: card.ln.trim(),
      bd: card.bd.trim(),
    };
    if (card.bt) payload.bt = card.bt.trim();
    if (card.bp) payload.bp = card.bp.trim();
    if (card.br) payload.br = card.br.trim();
    if (card.g) payload.g = card.g;
    if (card.oc) payload.oc = card.oc.trim();
    if (verdict.trim()) payload.vd = verdict.trim();
    return payload;
  };

  // Открыть ПРОДУКТ-персонажа с данными этого клиента ПО ТОЙ ЖЕ ссылке, что разбор:
  // короткая /r/<code> (сцена дотянет карточку по коду) либо длинная #r=… (само-
  // достаточна). Прототип продукта — /lab/scene. link уже собран кнопкой рядом.
  const openPersona = async () => {
    const base = `${window.location.origin}/lab/scene/`;
    let target = "";
    try {
      const u = new URL(link || "");
      const code = extractReadingCode({ pathname: u.pathname, hash: u.hash, search: u.search });
      if (code) target = `${base}#c=${code}`;
      else if (u.hash) target = `${base}${u.hash}`; // длинная #r=…
    } catch { /* link ещё пуст */ }
    if (!target) {
      const token = await encodeReadingToken(buildPayload());
      target = `${base}#r=${token}`;
    }
    window.open(target, "_blank");
  };

  const makeLink = async () => {
    const payload = buildPayload();
    // Короткая ссылка: разбор сохраняется в базе (n8n), клиенту уходит
    // nomen.website/r/имя-номерзаказа. Сервер недоступен → запасная длинная
    // #r= (самодостаточна, тоже рабочая) — студия не должна вставать колом.
    try {
      const { url } = await saveReadingLink(payload, card.em);
      setLink(url);
      setLinkNote("");
      return url;
    } catch {
      const url = await encodeReadingLink(payload, window.location.origin);
      setLink(url);
      setLinkNote("⚠️ Сервер недоступен — собрал запасную длинную ссылку (тоже рабочая).");
      return url;
    }
  };

  const copy = async (what, text) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(what);
      clearTimeout(copyTimer.current);
      copyTimer.current = setTimeout(() => setCopied(""), 1800);
    } catch {
      window.prompt("Скопируй вручную:", text);
    }
  };

  // ИИ-вердикт: значения пунктов → Claude (личный ключ из /lab) → 2-3 абзаца.
  const generateVerdict = async () => {
    let key = null;
    try {
      key = localStorage.getItem(KEY_STORAGE);
    } catch {
      /* storage недоступен */
    }
    if (!key) {
      setGenNote("Нет ключа Claude. Вставь его в ⚙ чата на /lab — хранится только в браузере.");
      return;
    }
    if (!reading) return;
    setGenBusy(true);
    setGenNote("");
    try {
      const { default: Anthropic } = await import("@anthropic-ai/sdk");
      const client = new Anthropic({ apiKey: key, dangerouslyAllowBrowser: true });
      const response = await client.messages.create({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        system:
          "You write the final verdict of a paid 13-point personality reading for the NOMEN product. Voice: confident profiler, second person, concrete and gripping, with no horoscope filler and no words like 'universe', 'cosmic', 'vibration'. Weave the given points into ONE coherent portrait: show how they reinforce and contradict each other, name the central tension and the direction. Exactly 3 paragraphs, 55-80 words each, separated by blank lines. Plain text only. Write like a person: vary sentence length, and do not use em dashes or en dashes (use periods, commas, or colons instead).",
        messages: [
          {
            role: "user",
            content: `Client: ${card.fn} ${card.ln}`.trim() +
              `${card.g ? ` (${card.g === "f" ? "female" : "male"})` : ""}, born ${card.bd}${card.bt ? ` at ${card.bt}` : ""}${card.bp ? ` in ${card.bp}` : ""}.\nPoints:\n- ${summary.join("\n- ")}`,
          },
        ],
      });
      const text = response.content.find((b) => b.type === "text")?.text?.trim();
      if (text) {
        setVerdict(text);
        setLink("");
        setGenNote("Вердикт готов — проверь текст, поправь если нужно, и собирай ссылку.");
      } else {
        setGenNote("Пустой ответ от Claude — попробуй ещё раз.");
      }
    } catch (e) {
      const msg = String(e?.message || e);
      setGenNote(
        /401|auth/i.test(msg)
          ? "Ключ не подошёл (401) — обнови его в ⚙ на /lab."
          : "Ошибка Claude: " + msg.slice(0, 120)
      );
    }
    setGenBusy(false);
  };

  const email = link ? buildEmail(card, link) : null;

  return (
    // ym-hide-content: вся студия скрыта из записей Вебвизора (PII клиентов
    // не только в полях, но и в сгенерированных текстах/ссылках).
    <main className="ym-hide-content mx-auto min-h-screen w-full max-w-3xl px-5 py-10 text-foreground">
      <header className="mb-6 flex items-end justify-between">
        <div>
          <p className="font-heading text-xs uppercase tracking-[0.3em] text-accent-turquoise">
            NOMEN · studio
          </p>
          <h1 className="mt-1 font-heading text-2xl font-semibold">
            Производство разбора
          </h1>
        </div>
        <nav className="flex gap-2">
          {[
            ["make", "Ссылка"],
            ["texts", "Тексты"],
          ].map(([k, label]) => (
            <button
              key={k}
              type="button"
              onClick={() => setTab(k)}
              className={`rounded-lg px-3 py-1.5 text-sm ${
                tab === k
                  ? "bg-accent-turquoise/15 text-accent-turquoise"
                  : "text-foreground-muted hover:text-foreground"
              }`}
            >
              {label}
            </button>
          ))}
        </nav>
      </header>

      {tab === "make" ? (
        <div className="flex flex-col gap-6">
          {/* Шаг 1: вставить заказ из Telegram (если не пришли по prefill) */}
          <section className="rounded-xl border border-foreground-muted/25 bg-background-alt/60 p-4">
            <h2 className="text-sm font-semibold text-foreground-muted">
              1 · Вставь заказ из Telegram (или открой «Студия»-ссылку из сообщения — поля заполнятся сами)
            </h2>
            <textarea
              value={orderText}
              onChange={(e) => setOrderText(e.target.value)}
              placeholder={"💰 NOMEN — клиент отметил ОПЛАТУ\nЗаказ #K7Q2M\nИмя: Anna Lee\n…"}
              rows={4}
              className={`${inputCls} mt-3 font-mono text-xs`}
            />
            <button type="button" onClick={doParse} className={`${btnCls} mt-3`}>
              Разобрать текст
            </button>
          </section>

          {/* Шаг 2: карточка клиента */}
          <section className="rounded-xl border border-foreground-muted/25 bg-background-alt/60 p-4">
            <h2 className="text-sm font-semibold text-foreground-muted">2 · Карточка клиента</h2>
            <div className="mt-3 grid grid-cols-2 gap-3">
              <input value={card.fn} onChange={set("fn")} placeholder="Имя *" className={inputCls} />
              <input value={card.ln} onChange={set("ln")} placeholder="Фамилия" className={inputCls} />
              <input value={card.bd} onChange={set("bd")} placeholder="Дата рождения * (ГГГГ-ММ-ДД)" className={inputCls} />
              <input value={card.bt} onChange={set("bt")} placeholder="Время (ЧЧ:ММ)" className={inputCls} />
              <input value={card.bp} onChange={set("bp")} placeholder="Место рождения" className={inputCls} />
              <input value={card.br} onChange={set("br")} placeholder="Бренд/ник" className={inputCls} />
              <input value={card.oc} onChange={set("oc")} placeholder="Код заказа (#XXXXX)" className={inputCls} />
              <input value={card.em} onChange={set("em")} placeholder="Email клиента (для письма)" className={inputCls} />
            </div>
            <div className="mt-3 flex items-center gap-3 text-sm">
              <span className="text-foreground-muted">Пол:</span>
              {[
                ["f", "♀ жен", "text-pink-300 border-pink-400/70"],
                ["m", "♂ муж", "text-sky-300 border-sky-400/70"],
              ].map(([v, label, active]) => (
                <button
                  key={v}
                  type="button"
                  onClick={() => {
                    setCard((c) => ({ ...c, g: v }));
                    setLink("");
                  }}
                  className={`rounded-lg border px-3 py-1 ${
                    card.g === v ? active : "border-foreground-muted/40 text-foreground-muted"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {/* Живая проверка движком */}
            <div className="mt-4 rounded-lg bg-background/60 p-3 text-xs leading-relaxed">
              {ready ? (
                <>
                  <p className="mb-1 font-semibold text-accent-turquoise">
                    Расчёт сходится — {summary.length} пунктов:
                  </p>
                  <p className="text-foreground-muted">{summary.join(" · ")}</p>
                </>
              ) : (
                <p className="text-red-400/90">
                  Нужны минимум Имя и Дата рождения (ГГГГ-ММ-ДД), имя — буквами одного
                  алфавита. Пока расчёт не сходится — ссылку собрать нельзя.
                </p>
              )}
            </div>
          </section>

          {/* Шаг 3: ИИ-вердикт */}
          <section className="rounded-xl border border-foreground-muted/25 bg-background-alt/60 p-4">
            <h2 className="text-sm font-semibold text-foreground-muted">
              3 · Персональный вердикт (Claude) — можно пропустить, тогда возьмётся запасной из банка
            </h2>
            <div className="mt-3 flex items-center gap-3">
              <button type="button" onClick={generateVerdict} disabled={!ready || genBusy} className={btnCls}>
                {genBusy ? "Генерирую…" : "Сгенерировать вердикт"}
              </button>
              {verdict && (
                <button type="button" onClick={() => { setVerdict(""); setLink(""); }} className="text-xs text-foreground-muted underline">
                  очистить
                </button>
              )}
            </div>
            {genNote && <p className="mt-2 text-xs text-foreground-muted">{genNote}</p>}
            <textarea
              value={verdict}
              onChange={(e) => {
                setVerdict(e.target.value);
                setLink("");
              }}
              placeholder="Сюда ляжет сгенерированный вердикт — его можно править руками. Пустое поле = запасной вердикт из банка."
              rows={7}
              className={`${inputCls} mt-3 text-sm leading-relaxed`}
            />
          </section>

          {/* Шаг 4: ссылка */}
          <section className="rounded-xl border border-foreground-muted/25 bg-background-alt/60 p-4">
            <h2 className="text-sm font-semibold text-foreground-muted">4 · Персональная ссылка</h2>
            <div className="mt-3 flex flex-wrap gap-3">
              <button type="button" onClick={makeLink} disabled={!ready} className={btnCls}>
                Собрать ссылку
              </button>
              {link && (
                <>
                  <button type="button" onClick={openPersona} className={btnCls}>
                    Открыть предпросмотр
                  </button>
                  <button type="button" onClick={() => copy("link", link)} className={btnCls}>
                    {copied === "link" ? "✓ Скопировано" : "Copy link"}
                  </button>
                  {email && (
                    <button
                      type="button"
                      onClick={() => copy("email", `Subject: ${email.subject}\n\n${email.body}`)}
                      className={btnCls}
                    >
                      {copied === "email" ? "✓ Скопировано" : "Copy email"}
                    </button>
                  )}
                  {email && card.em && (
                    <a
                      className={btnCls}
                      href={`mailto:${card.em}?subject=${encodeURIComponent(email.subject)}&body=${encodeURIComponent(email.body)}`}
                    >
                      Открыть в почте
                    </a>
                  )}
                </>
              )}
            </div>
            {linkNote && <p className="mt-2 text-xs text-amber-400/90">{linkNote}</p>}
            {link && (
              <div className="mt-4 flex flex-col items-start gap-4 sm:flex-row">
                <div className="rounded-lg bg-white p-2">
                  <QRCode value={link} size={148} />
                </div>
                <p className="break-all rounded-lg bg-background/60 p-3 font-mono text-[11px] leading-relaxed text-foreground-muted">
                  {link}
                </p>
              </div>
            )}
          </section>
        </div>
      ) : (
        <TextsTab />
      )}
    </main>
  );
}

// Вкладка «Тексты»: просмотр банка шаблонов для ревью.
function TextsTab() {
  const codes = Object.keys(BANKS);
  const [code, setCode] = useState("A1");
  const bank = BANKS[code];
  const title =
    code === "VERDICT"
      ? "Запасной вердикт"
      : methodology.find((m) => m.code === code)?.title || code;
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-2">
        {codes.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => setCode(c)}
            className={`rounded-lg px-3 py-1.5 text-xs ${
              code === c
                ? "bg-accent-turquoise/15 text-accent-turquoise"
                : "text-foreground-muted hover:text-foreground"
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <h2 className="font-heading text-lg font-semibold">
        {title} <span className="text-sm text-foreground-muted">· {Object.keys(bank.values).length} значений</span>
      </h2>
      {bank.intro && <p className="text-sm text-foreground-muted">{bank.intro}</p>}
      <div className="flex flex-col gap-4">
        {Object.entries(bank.values).map(([k, v]) => (
          <div key={k} className="rounded-xl border border-foreground-muted/20 bg-background-alt/50 p-4">
            <h3 className="text-sm font-semibold text-accent-turquoise">
              {k} · {v.heading}
            </h3>
            {v.paragraphs.map((p, i) => (
              <p key={i} className="mt-2 text-sm leading-relaxed text-foreground/90">
                {p}
              </p>
            ))}
          </div>
        ))}
        {bank.closing && (
          <p className="text-sm italic text-foreground-muted">closing: {bank.closing}</p>
        )}
      </div>
    </div>
  );
}
