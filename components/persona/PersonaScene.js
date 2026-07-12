"use client";

// ПЕРСОНАЖ — переиспользуемый «движок сцены» (C2b · З-101, курс «изображения» 13.07).
// Монтируется в двух местах: страница-лаборатория /lab/scene и КЛИЕНТСКАЯ короткая
// ссылка /r/<code> (app/not-found.js) — клиент по ссылке из письма открывает именно
// персонажа. Данные клиента берутся из ссылки (короткая /r/<code> или #c=/#r=), расчёт
// тем же движком, что /reading. Строится отдельным компонентом сознательно: движок
// пока прототип-заглушки, но уже «прикручен» к клиентскому роуту (Артём 13.07).
// БЕЗ three.js: DOM-слои картинок. Персонаж = кадры S0…S13 (nano banana, цепочка от N1):
// каждый собранный пункт переключает кадр (кроссфейд + вспышка). Пока кадра S_k нет
// на диске — рост имитируется CSS-фильтром поверх базового s0 (сцена работает на любом
// подмножестве готовых ассетов). По скроллу к телу летит СИМВОЛ КОНКРЕТНОГО
// варианта клиента (Leo, Water, 7…) из каталога data/points-catalog.json; касание =
// вспышка + новый кадр + ячейка в инвентаре. Символы вариантов сейчас — юникод-
// ЗАГЛУШКИ (♌, 水…), слот под banana: /persona/icons/{code}/{key}.png. Вариант
// клиента считается ТЕМ ЖЕ движком, что /reading — lib/teaser.calculateReading
// (от имени+даты в интро); до ввода — демо-набор. Тексты панелей — heading + первый
// абзац варианта из банка data/readings. Видео-переходы Veo — через TRANSITIONS.

import { useEffect, useMemo, useRef, useState } from "react";
import catalog from "@/data/points-catalog.json";
import { calculateReading } from "@/lib/teaser";
import { buildSections, resolveVerdict } from "@/lib/buildReading";
import { ReadingError } from "@/components/reading/ReadingSections";
import { decodeReadingToken, extractReadingCode, fetchReadingByCode } from "@/lib/readingLink";

// Имена — с заглавной каждого слова (свод правил 4.7).
const titleCase = (s) =>
  String(s || "").toLowerCase().replace(/(^|[\s-])([^\s-])/g, (_, p, c) => p + c.toUpperCase());

const BG = "#05040f";
// Единый каталог «пункт → варианты → символ/картинка/кадр тела»
// (scripts/gen-points-catalog.mjs). Порядок = порядок присоединения на сцене.
const POINTS = catalog.points;
const N = POINTS.length;

// ДЕМО-ключи (пока клиент не ввёл дату): образец, чтобы сцена была живой и до ввода.
const DEMO = { A1: "7", A2: "3", A3: "1", A4: "9", A5: "5", A7: "8", A9: "lesson_2", A10: "5_some", A11: "none", B1: "Leo", C1: "Dragon", C2: "Water", D1: "17" };

// Настоящий расчёт: тот же движок, что /reading — lib/teaser.js.calculateReading.
// Его результат → ключ варианта каталога для каждого пункта. Именные пункты
// (A3/A4/A5/A9) зависят от написания имени (алфавит), остальные — от даты.
function readingKeyFor(code, R) {
  if (!R) return null;
  const num = (x) => (x && x.value != null ? String(x.value) : null);
  switch (code) {
    case "A1": return num(R.a1);
    case "A2": return num(R.a2);
    case "A3": return num(R.a3);
    case "A4": return num(R.a4);
    case "A5": return num(R.a5);
    case "A7": return num(R.a7);
    case "A9": {
      if (!R.a9) return "no_lessons";
      const L = R.a9.lessons || [], P = R.a9.passions || [];
      if (L.length) return `lesson_${L[0]}`;
      if (P.length) return `passion_${P[0]}`;
      return "no_lessons";
    }
    case "A10": {
      const b = R.a10?.buckets || {};
      for (const lvl of ["many", "some"]) for (let c = 1; c <= 9; c++) if (b[c] === lvl) return `${c}_${lvl}`;
      return `1_${b[1] || "empty"}`;
    }
    case "A11": return R.a11?.hasDebt && R.a11.debts?.length ? String(R.a11.debts[0]) : "none";
    // B1/C1/C2 — АНГЛИЙСКИЙ ключ (.name), каталог на нём; .key был бы русским.
    case "B1": return R.b1?.name || null;
    case "C1": return R.c1?.name || null;
    case "C2": return R.c2?.name || null;
    case "D1": return R.d1?.num != null ? String(R.d1.num) : null;
    default: return null;
  }
}

// Кадры персонажа: s0 = база N1 (всегда есть), s1…s13 появляются по мере генерации.
const frameSrc = (k) => `/persona/frames/s${k}.jpg`;
// Картинка символа варианта (banana), когда будет: /persona/icons/{code}/{key}.png.
const variantImg = (p, v) => `/persona/icons/${p.code.toLowerCase()}/${v.key}.png`;
// Видео-переходы Veo: { номерКадра: "/persona/transitions/t5.webm" } — заполняется
// по мере генерации (пакет №2). Ключ k = переход S(k-1) → S(k).
const TRANSITIONS = {};

// Акцент-цвет пункта (тот же ряд, что был в R3F-прототипе); a — прозрачность.
const accent = (i, a = 1) =>
  `hsl(${Math.round((((i / N) * 0.8 + 0.55) % 1) * 360)} 75% 60% / ${a})`;

const easeSmooth = (t) => t * t * (3 - 2 * t);

const inputStyle = {
  width: "100%", boxSizing: "border-box", marginBottom: 12, padding: "12px 14px",
  borderRadius: 12, background: "rgba(6,4,16,.7)", border: "1px solid #2a2350",
  color: "#eaf0ff", fontSize: 15, outline: "none",
};
const ctrlBtn = {
  height: 38, minWidth: 38, borderRadius: 999, cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  background: "rgba(10,8,24,.7)", border: "1px solid #2a2350", color: "#eaf0ff",
  fontSize: 16, backdropFilter: "blur(6px)",
};

// Символ варианта: banana-картинка (когда есть) ИЛИ юникод-заглушка (♌, 水, 7…).
// Числа/метки — крупный текст; глифы/эмодзи — тоже текст, но эмодзи цветные.
function VariantGlyph({ point, variant, size, hasImg }) {
  if (hasImg) {
    return <img src={variantImg(point, variant)} alt={variant.key} style={{ width: size, height: size, objectFit: "contain" }} />;
  }
  const isNum = variant.symbolKind === "number" || variant.symbolKind === "label";
  return (
    <span style={{ fontSize: Math.round(size * (isNum ? 0.62 : 0.82)), fontWeight: isNum ? 700 : 400, lineHeight: 1, fontFamily: isNum ? "system-ui" : "system-ui, 'Apple Color Emoji', 'Segoe UI Symbol'" }}>
      {variant.symbol}
    </span>
  );
}

// Полный текст пункта — ТЕ ЖЕ entries/paragraphs, что рендерит /reading
// (единый источник lib/buildReading.buildSections). full=false → тизер (первый
// абзац первой части, во время полёта/скролла); full=true → весь текст пункта,
// как в разборе (клик по инвентарю / доработка). A9 и A10 несут несколько entries
// (уроки/страсть, 9 ячеек квадрата) — рендерятся стопкой, как в /reading.
function SectionText({ section, full }) {
  if (!section) return null;
  const entries = full ? section.entries : section.entries.slice(0, 1);
  return (
    <div style={{ textAlign: "left" }}>
      {entries.map((e, i) => (
        <div key={i} style={{ marginBottom: full ? 14 : 0 }}>
          {full && e.heading && (
            <div style={{ fontSize: 13.5, fontWeight: 600, color: "#c9b8ff", margin: "0 0 5px" }}>
              {e.glyph ? `${e.glyph} · ${e.heading}` : e.heading}
            </div>
          )}
          {(full ? e.paragraphs : e.paragraphs.slice(0, 1)).map((p, k) => (
            <p
              key={k}
              style={{
                margin: "0 0 8px", color: "#c9c3e6", fontSize: 14, lineHeight: 1.6,
                ...(full ? {} : { display: "-webkit-box", WebkitLineClamp: 5, WebkitBoxOrient: "vertical", overflow: "hidden" }),
              }}
            >
              {p}
            </p>
          ))}
        </div>
      ))}
    </div>
  );
}

// Текст пункта вслух (для кнопки «Слушать»): заголовок + метка + видимый текст.
function speakTextFor(point, section, variant, full) {
  if (section) {
    const body = (full ? section.entries : section.entries.slice(0, 1))
      .map((e) => e.paragraphs.join(" "))
      .join(" ");
    return `${point.title}. ${section.valueLabel || ""}. ${body}`;
  }
  return `${point.title}. ${variant.label}. ${variant.blurb || ""}`;
}

// Фазы внутри сегмента одного пункта (t = 0..1 по скроллу):
// 0 → TOUCH_AT: полёт иконки (текст-блока нет, сцена не затемнена);
// TOUCH_AT: касание — вспышка, персонаж меняет кадр, иконка впитывается;
// затем текст-блок плавно появляется, держится и плавно уходит к концу
// сегмента — следующий пункт начинает лететь уже без блока. Скролл назад
// отыгрывает всё в обратную сторону (всё считается от позиции скролла).
const TOUCH_AT = 0.55;
const PANEL_IN_A = 0.6, PANEL_IN_B = 0.7;   // появление блока
const PANEL_OUT_A = 0.92, PANEL_OUT_B = 1.0; // уход блока
const panelPhase = (t) => {
  if (t <= PANEL_IN_A || t >= PANEL_OUT_B) return 0;
  if (t < PANEL_IN_B) return (t - PANEL_IN_A) / (PANEL_IN_B - PANEL_IN_A);
  if (t > PANEL_OUT_A) return 1 - (t - PANEL_OUT_A) / (PANEL_OUT_B - PANEL_OUT_A);
  return 1;
};

export default function PersonaScene() {
  const [frame, setFrame] = useState(0);          // собрано пунктов = номер кадра
  const [active, setActive] = useState(-1);       // пункт в фокусе текста (-1/-2 = края)
  const [hudIdx, setHudIdx] = useState(-1);       // пункт для HUD-строки (летит или читается)
  const [flash, setFlash] = useState(null);       // { i, ts } — вспышка касания
  const [panelIdx, setPanelIdx] = useState(null); // клик из инвентаря
  const [haveFrame, setHaveFrame] = useState({}); // какие s1…s13 существуют
  const [haveIcon, setHaveIcon] = useState({});   // какие PNG-иконки существуют
  const [haveBg, setHaveBg] = useState(false);    // фон Ф1

  const [intro, setIntro] = useState(true);       // экран ввода имя+дата (перед сценой)
  const [loadError, setLoadError] = useState(false); // ссылка есть, но не открылась → ошибка
  const [name, setName] = useState("");
  const [birth, setBirth] = useState("");
  const [reading, setReading] = useState(null);   // результат calculateReading (или null=демо)
  const [card, setCard] = useState(null);         // карточка из ссылки (для вердикта card.vd)

  // Ключ варианта на пункт: из настоящего расчёта, иначе демо.
  const keymap = useMemo(() => {
    if (!reading) return DEMO;
    const m = {};
    for (const p of POINTS) m[p.code] = readingKeyFor(p.code, reading) ?? DEMO[p.code];
    return m;
  }, [reading]);
  const variantOf = (p) => p.variants.find((v) => v.key === keymap[p.code]) || p.variants[0];

  // ЕДИНЫЙ ИСТОЧНИК ТЕКСТА: те же секции и вердикт, что на /reading (lib/buildReading).
  // Текст пункта берём по КОДУ (не по индексу — секция выпадает, если значение null).
  const sections = useMemo(() => (reading ? buildSections(reading) : []), [reading]);
  const byCode = useMemo(() => new Map(sections.map((s) => [s.code, s])), [sections]);
  const verdict = useMemo(() => resolveVerdict({ card, reading }), [card, reading]);

  // Загрузка клиента ИЗ ССЫЛКИ (как /reading): короткая /r/<code> или #c=…
  // тянется с сервера; длинная #r=… самодостаточна. Есть данные → пропускаем интро.
  useEffect(() => {
    let alive = true;
    (async () => {
      const code = extractReadingCode(window.location);
      const linked = !!code || /[#?&]r=/.test(window.location.hash + window.location.search);
      // Нет ссылки → это /lab/scene (dev): оставляем интро с ручным вводом и демо.
      // Есть ссылка → это клиентский /r/<code>: разбор ОБЯЗАН собраться, иначе ошибка
      // (никакого DEMO у оплатившего клиента).
      if (!linked) return;
      try {
        const c = code
          ? await fetchReadingByCode(code)
          : await decodeReadingToken(window.location.hash || window.location.search);
        if (!alive) return;
        if (!c) { setLoadError(true); setIntro(false); return; }
        const fullName = `${c.fn} ${c.ln || ""}`.trim();
        let R = null;
        try { R = calculateReading({ name: fullName, date: c.bd }); } catch { R = null; }
        if (!R) { setLoadError(true); setIntro(false); return; } // клиентский разбор не собрался
        setCard(c);
        setName(fullName);
        setBirth(c.bd || "");
        setReading(R);
        setIntro(false);
      } catch {
        if (alive) { setLoadError(true); setIntro(false); } // битая ссылка на клиентском роуте
      }
    })();
    return () => { alive = false; };
  }, []);
  const [musicOn, setMusicOn] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [endReveal, setEndReveal] = useState(0);  // 0..1 — проявление блока вердикта

  const iconRefs = useRef([]);
  const videoRef = useRef(null);
  const panelBoxRef = useRef(null); // opacity текст-блока — напрямую, без ре-рендеров
  const dimRef = useRef(null);      // затемнение сцены — привязано к блоку
  const panelIdxRef = useRef(null); // зеркало panelIdx для скролл-хендлера
  const collectedRef = useRef(new Array(N).fill(false));
  const musicRef = useRef(null);    // Web Audio: генеративный ambient (заглушка)
  const speakingRef = useRef(false);

  const displayName = titleCase((name || "Traveler").trim());

  // ── Прослушать текст. Заглушка: браузерный голос (SpeechSynthesis) — ВРЕМЕННО,
  // реальный банк озвучен голосом Gacrux (C3b) и подключится по audio-manifest. ──
  function listen(text) {
    try {
      const synth = window.speechSynthesis;
      if (!synth || !text) return;
      if (speakingRef.current) { synth.cancel(); speakingRef.current = false; setSpeaking(false); return; }
      synth.cancel();
      const u = new SpeechSynthesisUtterance(text);
      u.rate = 0.96; u.pitch = 0.95;
      u.onend = () => { speakingRef.current = false; setSpeaking(false); };
      speakingRef.current = true; setSpeaking(true); synth.speak(u);
    } catch { /* нет TTS в браузере — молча */ }
  }

  // ── Фоновая музыка: мягкий генеративный ambient (Web Audio) с выключением.
  // ЗАГЛУШКА до реального трека (слот public/audio/ambient.*). ──
  function toggleMusic() {
    if (musicRef.current) { musicRef.current.stop(); musicRef.current = null; setMusicOn(false); return; }
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      const ctx = new AC();
      const master = ctx.createGain();
      master.gain.value = 0.0001; master.connect(ctx.destination);
      master.gain.exponentialRampToValueAtTime(0.09, ctx.currentTime + 2.5);
      const freqs = [110, 164.81, 220, 329.63]; // A-мягкий аккорд
      const nodes = freqs.map((f, i) => {
        const o = ctx.createOscillator(); o.type = i % 2 ? "sine" : "triangle"; o.frequency.value = f;
        const g = ctx.createGain(); g.gain.value = 0.22 / (i + 1);
        const lfo = ctx.createOscillator(); lfo.frequency.value = 0.05 + i * 0.02;
        const lg = ctx.createGain(); lg.gain.value = 0.08;
        lfo.connect(lg); lg.connect(g.gain);
        o.connect(g); g.connect(master); o.start(); lfo.start();
        return { o, lfo };
      });
      musicRef.current = {
        stop() {
          try { master.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 1); } catch { /* noop */ }
          nodes.forEach(({ o, lfo }, idx) => { try { o.stop(ctx.currentTime + 1.1 + idx * 0); lfo.stop(ctx.currentTime + 1.1); } catch { /* noop */ } });
        },
      };
      setMusicOn(true);
    } catch { /* нет Web Audio — молча */ }
  }

  function toVerdict() {
    const el = document.scrollingElement || document.documentElement;
    el.scrollTo({ top: el.scrollHeight, behavior: "smooth" });
  }
  function restart() { window.scrollTo({ top: 0, behavior: "smooth" }); }

  // Прелоад ассетов: отмечаем, что уже сгенерено и лежит на диске.
  useEffect(() => {
    for (let k = 1; k <= N; k++) {
      const im = new Image();
      im.onload = () => setHaveFrame((h) => ({ ...h, [k]: true }));
      im.src = frameSrc(k);
    }
    POINTS.forEach((p) => {
      const v = variantOf(p);
      const im = new Image();
      im.onload = () => setHaveIcon((h) => ({ ...h, [p.code]: true }));
      im.src = variantImg(p, v);
    });
    const bg = new Image();
    bg.onload = () => setHaveBg(true);
    bg.src = "/persona/frames/bg.jpg";
  }, []);

  // Скролл-механика прилёта (перенесена из R3F-прототипа без изменений логики).
  useEffect(() => {
    let raf = 0;
    const onScroll = () => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const el = document.scrollingElement || document.documentElement;
        const max = el.scrollHeight - el.clientHeight;
        const p = max > 0 ? el.scrollTop / max : 0;
        const scaled = p * (N + 0.5);
        const vw = window.innerWidth, vh = window.innerHeight;
        const vmin = Math.min(vw, vh);
        const cx = vw / 2;
        let collected = 0;

        for (let i = 0; i < N; i++) {
          const t = Math.max(0, Math.min(1, scaled - i));
          const flight = Math.min(1, t / TOUCH_AT); // полёт занимает первую часть сегмента
          const node = iconRefs.current[i];
          if (node) {
            // Прилёт с боков попеременно; уровни распределены по телу.
            const side = i % 2 === 0 ? -1 : 1;
            const level = 0.60 + (i % 5) * 0.05;
            const e = easeSmooth(flight);
            const xTouch = cx + side * vmin * 0.14;
            const xFrom = cx + side * (vw / 2 + 90);
            const x = xFrom + (xTouch - xFrom) * e;
            const y = vh * level + Math.sin(e * Math.PI) * -vh * 0.05;
            const scale = 0.55 + e * 0.45;
            node.style.transform = `translate(${x}px, ${y}px) translate(-50%,-50%) scale(${scale})`;
            node.style.opacity = t <= 0.001 ? 0 : flight >= 1 ? 0 : Math.min(1, flight * 1.8);
          }
          if (flight >= 1) {
            collected++;
            if (!collectedRef.current[i]) {
              collectedRef.current[i] = true;
              setFlash({ i, ts: Date.now() });
              // Видео-переход S(i)→S(i+1), если сгенерён.
              const src = TRANSITIONS[i + 1];
              if (src && videoRef.current) {
                videoRef.current.src = src;
                videoRef.current.style.opacity = 1;
                videoRef.current.play().catch(() => {});
              }
            }
          } else {
            collectedRef.current[i] = false;
          }
        }

        setFrame(collected);
        // Текст-блок: появляется ПОСЛЕ касания, плавно уходит к концу сегмента
        // (следующий пункт летит уже без блока). Скролл назад возвращает блок.
        const cur = Math.min(N - 1, Math.floor(scaled));
        const tCur = Math.max(0, Math.min(1, scaled - cur));
        const op = p >= 0.998 ? 0 : panelPhase(tCur);
        if (panelIdxRef.current === null) {
          if (panelBoxRef.current) panelBoxRef.current.style.opacity = op;
          if (dimRef.current) dimRef.current.style.opacity = op * 0.45;
        }
        setActive(op > 0 ? cur : p >= 0.998 ? -2 : -1);
        setHudIdx(p >= 0.998 ? -2 : scaled > 0.2 ? cur : -1);
        // Блок вердикта проявляется на последнем экране (p 0.965..1).
        setEndReveal(p > 0.965 ? Math.min(1, (p - 0.965) / 0.03) : 0);
      });
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  // Блокируем скролл страницы под интро-экраном + гасим музыку/речь при уходе.
  useEffect(() => {
    document.body.style.overflow = intro ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [intro]);
  useEffect(() => () => {
    if (musicRef.current) musicRef.current.stop();
    try { window.speechSynthesis?.cancel(); } catch { /* noop */ }
  }, []);

  // Лучший ДОСТУПНЫЙ кадр ≤ frame (сцена живёт на любом подмножестве кадров).
  let shownFrame = 0;
  for (let k = frame; k >= 1; k--) if (haveFrame[k]) { shownFrame = k; break; }
  // Имитация «крепчания» фильтром — на сколько собранных пунктов нет своего кадра.
  const growSteps = frame - shownFrame;
  const growFilter = `brightness(${1 + growSteps * 0.055}) saturate(${1 + growSteps * 0.04})`;

  const full = panelIdx !== null; // клик по инвентарю → полный текст пункта (как /reading)
  const textIdx = panelIdx !== null ? panelIdx : active >= 0 ? active : null;
  const cur = textIdx !== null ? POINTS[textIdx] : null;
  const curSection = cur ? byCode.get(cur.code) : null;

  // Клиентская ссылка есть, но не открылась → та же панель ошибки, что на /reading.
  if (loadError) return <ReadingError />;

  return (
    <div style={{ background: BG, minHeight: "100vh", fontFamily: "system-ui" }}>
      {/* ── Интро-экран: имя + дата рождения (фирменный стиль) ── */}
      {intro && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 40, background: "radial-gradient(120% 90% at 50% 30%, #120a2e 0%, #05040f 70%)",
            display: "flex", alignItems: "center", justifyContent: "center", padding: 20,
          }}
        >
          <div
            style={{
              width: "100%", maxWidth: 380, textAlign: "center",
              padding: "34px 28px", borderRadius: 22,
              background: "rgba(12,10,28,.72)", border: "1px solid #2a2350",
              boxShadow: "0 0 60px rgba(120,90,255,.22)", backdropFilter: "blur(10px)",
            }}
          >
            <div style={{ fontSize: 13, letterSpacing: "0.34em", color: "#8a6bff", marginBottom: 6 }}>NOMEN</div>
            <h1 style={{ margin: "0 0 6px", fontSize: 24, color: "#eaf0ff", fontWeight: 600 }}>Собери своего персонажа</h1>
            <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "#9aa0c0", lineHeight: 1.5 }}>
              13 граней твоей карты присоединятся к энергетическому образу. Введи данные — и листай.
            </p>
            <input
              value={name} onChange={(e) => setName(e.target.value)} placeholder="Имя"
              style={inputStyle}
            />
            <input
              value={birth} onChange={(e) => setBirth(e.target.value)} type="date"
              style={{ ...inputStyle, colorScheme: "dark" }}
            />
            <button
              onClick={() => {
                // Настоящий расчёт тем же движком, что /reading (lib/teaser.js).
                if (birth) {
                  try { setReading(calculateReading({ name: name || "", date: birth })); }
                  catch { setReading(null); /* дата не распозналась → демо */ }
                }
                setIntro(false);
              }}
              disabled={!birth}
              style={{
                width: "100%", marginTop: 8, padding: "13px 0", borderRadius: 12,
                cursor: birth ? "pointer" : "not-allowed", opacity: birth ? 1 : 0.5,
                border: "none", fontSize: 15, fontWeight: 700, color: "#0a0818",
                background: "linear-gradient(90deg,#8a6bff,#33e6e0)",
              }}
            >
              Раскрыть меня →
            </button>
            <div style={{ marginTop: 12, fontSize: 11.5, color: "#6c7095", lineHeight: 1.4 }}>
              Расчёт — движком сайта (тот же, что в разборе). Число пути, знак, стихия, аркан
              считаются от даты; выражение/душа/личность — от написания имени.
            </div>
          </div>
        </div>
      )}

      {/* ── Имя клиента (чип) + контролы: музыка, к вердикту ── */}
      {!intro && (
        <>
          <div style={{ position: "fixed", zIndex: 30, top: 16, left: 16, fontSize: 13, color: "#c9b8ff", letterSpacing: "0.06em", pointerEvents: "none" }}>
            <span style={{ opacity: 0.6 }}>NOMEN · </span>{displayName}
          </div>
          <div style={{ position: "fixed", zIndex: 30, top: 12, right: 14, display: "flex", gap: 8 }}>
            <button onClick={toggleMusic} title="Фоновая музыка" style={ctrlBtn}>
              {musicOn ? "🔊" : "🎵"}
            </button>
            <button onClick={toVerdict} title="К вердикту" style={{ ...ctrlBtn, width: "auto", padding: "0 14px", gap: 6, fontSize: 13, color: "#33e6e0", borderColor: "#33e6e0" }}>
              К вердикту ↓
            </button>
          </div>
        </>
      )}

      {/* ── Слой 0: фон Ф1 (когда сгенерён) — расплывается на весь экран ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 0, background: BG }}>
        {haveBg && (
          <img
            src="/persona/frames/bg.jpg" alt=""
            style={{
              position: "absolute", inset: 0, width: "100%", height: "100%",
              objectFit: "cover", opacity: 0.45, filter: "blur(26px) brightness(0.8)",
            }}
          />
        )}
      </div>

      {/* ── Слой 1: персонаж (стопка кадров + видео-переход) ── */}
      <div
        style={{
          position: "fixed", left: "50%", top: "44%", zIndex: 1,
          transform: `translate(-50%,-50%) scale(${1 + frame * 0.012})`,
          height: "82vh", aspectRatio: "893 / 1600",
          transition: "transform .6s ease",
          // Растворяем края JPEG-кадра в фон страницы (фон кадра не идеально чёрный).
          WebkitMaskImage: "radial-gradient(ellipse 62% 55% at 50% 46%, #000 60%, transparent 82%)",
          maskImage: "radial-gradient(ellipse 62% 55% at 50% 46%, #000 60%, transparent 82%)",
        }}
      >
        {/* База s0 — всегда на месте; фильтр имитирует рост без своих кадров */}
        <img
          src={frameSrc(0)} alt="Энергетический персонаж"
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "contain", filter: growFilter, transition: "filter .6s ease",
          }}
        />
        {/* Текущий сгенерённый кадр — кроссфейдом поверх базы */}
        {[...Array(N).keys()].map((k0) => {
          const k = k0 + 1;
          if (!haveFrame[k]) return null;
          return (
            <img
              key={k} src={frameSrc(k)} alt=""
              style={{
                position: "absolute", inset: 0, width: "100%", height: "100%",
                objectFit: "contain", filter: growFilter,
                opacity: k === shownFrame ? 1 : 0,
                transition: "opacity .55s ease, filter .6s ease",
              }}
            />
          );
        })}
        {/* Видео-переход Veo: играет один раз поверх кадра */}
        <video
          ref={videoRef} muted playsInline preload="none"
          onEnded={(e) => { e.currentTarget.style.opacity = 0; }}
          style={{
            position: "absolute", inset: 0, width: "100%", height: "100%",
            objectFit: "contain", opacity: 0, transition: "opacity .3s",
            pointerEvents: "none",
          }}
        />
        {/* Дыхание-свечение вокруг фигуры */}
        <div
          style={{
            position: "absolute", inset: "-8%", borderRadius: "50%",
            background: `radial-gradient(closest-side, rgba(90,80,255,${0.08 + frame * 0.012}), transparent 70%)`,
            pointerEvents: "none",
          }}
        />
      </div>

      {/* ── Слой 2: летящие иконки пунктов ── */}
      <div style={{ position: "fixed", inset: 0, zIndex: 2, pointerEvents: "none" }}>
        {POINTS.map((p, i) => (
          <div
            key={p.code}
            ref={(el) => (iconRefs.current[i] = el)}
            style={{
              position: "absolute", left: 0, top: 0, opacity: 0,
              width: 64, height: 64, borderRadius: 16,
              display: "flex", alignItems: "center", justifyContent: "center",
              color: accent(i), background: "rgba(10,8,24,.55)",
              border: `1px solid ${accent(i)}`,
              boxShadow: `0 0 22px ${accent(i, 0.4)}`,
              backdropFilter: "blur(4px)",
              willChange: "transform, opacity",
              transition: "opacity .35s ease",
            }}
          >
            <VariantGlyph point={p} variant={variantOf(p)} size={46} hasImg={haveIcon[p.code]} />
          </div>
        ))}
      </div>

      {/* ── Слой 3: вспышка касания ── */}
      {flash && (
        <div
          key={flash.ts}
          style={{
            position: "fixed", inset: 0, zIndex: 3, pointerEvents: "none",
            background: `radial-gradient(circle at 50% 44%, ${accent(flash.i, 0.33)}, transparent 55%)`,
            animation: "sceneFlash .8s ease-out forwards",
          }}
        />
      )}

      {/* ── Затемнение под текст (opacity ведёт скролл-хендлер) ── */}
      <div ref={dimRef} style={{ position: "fixed", inset: 0, zIndex: 4, background: BG, opacity: 0, pointerEvents: "none", transition: "opacity .15s linear" }} />

      {/* ── Слой 5: текст пункта (банк студии data/readings); появляется ПОСЛЕ касания ── */}
      <div ref={panelBoxRef} style={{ position: "fixed", zIndex: 5, left: 0, right: 0, top: "16%", display: "flex", justifyContent: "center", pointerEvents: "none", opacity: 0, transition: "opacity .15s linear" }}>
        {cur && (
          <div
            style={{
              maxWidth: 460, margin: "0 20px", padding: "22px 26px", borderRadius: 16,
              background: "rgba(10,8,24,.78)", border: "1px solid #241d3e",
              backdropFilter: "blur(8px)", color: "#eaf0ff", textAlign: "center",
              pointerEvents: "auto",
              ...(full ? { maxHeight: "74vh", overflowY: "auto" } : {}),
            }}
          >
            <div style={{ color: accent(textIdx), display: "flex", justifyContent: "center", height: 44, alignItems: "center" }}>
              <VariantGlyph point={cur} variant={variantOf(cur)} size={40} hasImg={haveIcon[cur.code]} />
            </div>
            <div style={{ margin: "10px 0 2px", fontSize: 12, letterSpacing: "0.14em", color: "#8f95b3" }}>
              {cur.code} · POINT {textIdx + 1} OF {N}
            </div>
            <h2 style={{ margin: "4px 0 4px", fontSize: 21 }}>{cur.title}</h2>
            <div style={{ margin: "0 0 10px", fontSize: 14, color: "#c9b8ff", fontWeight: 600 }}>
              {curSection?.valueLabel || variantOf(cur).label}
            </div>
            {/* Текст пункта — точь-в-точь как на /reading (единый источник buildReading).
                Полный текст по клику из инвентаря (full), иначе тизер-абзац при скролле. */}
            {curSection ? (
              <SectionText section={curSection} full={full} />
            ) : (
              <p
                style={{
                  margin: 0, color: "#9aa0c0", fontSize: 14, lineHeight: 1.55,
                  display: "-webkit-box", WebkitLineClamp: 6, WebkitBoxOrient: "vertical", overflow: "hidden",
                }}
              >
                {variantOf(cur).blurb || ""}
              </p>
            )}
            {!full && curSection && (
              <div style={{ marginTop: 8, fontSize: 12, color: "#6c7095" }}>
                Полный разбор пункта — по клику в инвентаре ниже
              </div>
            )}
            {/* Кнопка «слушать» (заглушка: браузерный голос; реальный — Gacrux) */}
            <button
              onClick={() => listen(speakTextFor(cur, curSection, variantOf(cur), full))}
              style={{
                marginTop: 14, padding: "8px 18px", borderRadius: 999, cursor: "pointer",
                display: "inline-flex", alignItems: "center", gap: 8, pointerEvents: "auto",
                background: "rgba(51,230,224,.1)", border: "1px solid #33e6e0", color: "#33e6e0", fontSize: 13, fontWeight: 600,
              }}
            >
              {speaking ? "⏸ Остановить" : "▶ Слушать"}
            </button>
            {panelIdx !== null && (
              <button
                onClick={() => {
                  setPanelIdx(null);
                  panelIdxRef.current = null;
                  if (panelBoxRef.current) panelBoxRef.current.style.opacity = 0;
                  if (dimRef.current) dimRef.current.style.opacity = 0;
                }}
                style={{
                  marginTop: 14, padding: "7px 18px", borderRadius: 10, cursor: "pointer",
                  background: "transparent", border: "1px solid #3a3160", color: "#bfc6ea", fontSize: 13,
                }}
              >
                Close
              </button>
            )}
          </div>
        )}
      </div>

      {/* ── HUD-подсказка ── */}
      <div style={{ position: "fixed", zIndex: 5, bottom: 86, left: 0, right: 0, textAlign: "center", color: "#8f95b3", fontSize: 13, pointerEvents: "none" }}>
        {hudIdx === -1 && panelIdx === null && (
          <div style={{ fontSize: 15, color: "#33e6e0" }}>Листай вниз — пункты присоединяются к персонажу ↓</div>
        )}
        {hudIdx === -2 && panelIdx === null && endReveal < 0.3 && (
          <div style={{ fontSize: 15, color: "#33e6e0" }}>Все {N} пунктов собраны ✦ инвентарь кликабелен</div>
        )}
        {hudIdx >= 0 && panelIdx === null && <div>Пункт {hudIdx + 1} из {N} · персонаж крепчает</div>}
      </div>

      {/* ── Слой 6: инвентарь-бар (13 ячеек, кликабельные) ── */}
      <div
        style={{
          position: "fixed", zIndex: 6, bottom: 18, left: "50%", transform: "translateX(-50%)",
          display: "flex", gap: 8, padding: "10px 12px", borderRadius: 16,
          background: "rgba(10,8,24,.7)", border: "1px solid #241d3e", backdropFilter: "blur(8px)",
          maxWidth: "94vw", overflowX: "auto",
        }}
      >
        {POINTS.map((p, i) => {
          const got = i < frame;
          return (
            <button
              key={p.code}
              onClick={() => {
                const next = panelIdx === i ? null : i;
                setPanelIdx(next);
                panelIdxRef.current = next;
                if (panelBoxRef.current) panelBoxRef.current.style.opacity = next === null ? 0 : 1;
                if (dimRef.current) dimRef.current.style.opacity = next === null ? 0 : 0.45;
              }}
              title={p.title}
              style={{
                width: 42, height: 42, borderRadius: 11, cursor: "pointer", flex: "none",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: got ? accent(i) : "#3c3a55",
                background: got ? "rgba(20,16,44,.9)" : "rgba(12,10,28,.6)",
                border: `1px solid ${got ? accent(i) : "#241d3e"}`,
                boxShadow: got ? `0 0 14px ${accent(i, 0.33)}` : "none",
                transition: "all .35s ease",
              }}
            >
              <span style={{ opacity: got ? 1 : 0.4 }}>
                <VariantGlyph point={p} variant={variantOf(p)} size={26} hasImg={haveIcon[p.code]} />
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Блок ВЕРДИКТА (финал): проявляется на последнем экране, снизу ── */}
      <div
        style={{
          position: "fixed", zIndex: 7, left: 0, right: 0, bottom: 78,
          display: "flex", justifyContent: "center",
          padding: "0 20px", opacity: endReveal,
          pointerEvents: endReveal > 0.5 ? "auto" : "none", transition: "opacity .2s linear",
        }}
      >
        <div
          style={{
            maxWidth: 480, textAlign: "center", padding: "30px 28px", borderRadius: 20,
            background: "rgba(10,8,24,.82)", border: "1px solid #2a2350",
            boxShadow: "0 0 50px rgba(120,90,255,.2)", backdropFilter: "blur(10px)",
          }}
        >
          <div style={{ fontSize: 12, letterSpacing: "0.28em", color: "#33e6e0", marginBottom: 8 }}>ВЕРДИКТ</div>
          <h2 style={{ margin: "0 0 4px", fontSize: 23, color: "#eaf0ff" }}>{displayName}, in one thread</h2>
          {birth && <div style={{ fontSize: 12.5, color: "#8f95b3", marginBottom: 6 }}>рождён(а) {birth}</div>}
          {verdict.heading && !verdict.isAi && (
            <div style={{ fontSize: 13.5, color: "#c9b8ff", fontWeight: 600, marginBottom: 12 }}>{verdict.heading}</div>
          )}
          {/* Сводный вердикт — единый источник (resolveVerdict): ИИ-текст из ссылки
              (card.vd) → монолит по 3 пунктам → запасной по числу пути. */}
          <div style={{ maxHeight: "42vh", overflowY: "auto", textAlign: "left", margin: "6px 0 18px" }}>
            {verdict.paragraphs.length ? (
              verdict.paragraphs.map((p, k) => (
                <p key={k} style={{ margin: "0 0 10px", fontSize: 14.5, color: "#c9c3e6", lineHeight: 1.6 }}>{p}</p>
              ))
            ) : (
              <p style={{ margin: 0, fontSize: 14.5, color: "#c9c3e6", lineHeight: 1.6, textAlign: "center" }}>
                Все 13 граней собраны — путь, дар, знак, стихия и аркан сплелись в один рисунок.
              </p>
            )}
          </div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              onClick={() => listen(verdict.paragraphs.length ? `Вердикт. ${verdict.heading || ""}. ${verdict.paragraphs.join(" ")}` : `Вердикт для ${displayName}. Все тринадцать граней собраны.`)}
              style={{ padding: "11px 22px", borderRadius: 999, cursor: "pointer", background: "rgba(51,230,224,.12)", border: "1px solid #33e6e0", color: "#33e6e0", fontSize: 14, fontWeight: 600 }}
            >
              {speaking ? "⏸ Остановить" : "▶ Слушать вердикт"}
            </button>
            <button
              onClick={restart}
              style={{ padding: "11px 22px", borderRadius: 999, cursor: "pointer", background: "transparent", border: "1px solid #3a3160", color: "#bfc6ea", fontSize: 14 }}
            >
              ↑ Заново
            </button>
          </div>
        </div>
      </div>

      {/* ── Скролл-контейнер: 1 экран на пункт + финал ── */}
      <div style={{ height: `${(N + 2) * 100}vh`, position: "relative", zIndex: 5, pointerEvents: "none" }} />

      <style>{`
        @keyframes sceneFlash {
          0% { opacity: 0; }
          18% { opacity: 1; }
          100% { opacity: 0; }
        }
        @media (prefers-reduced-motion: reduce) {
          @keyframes sceneFlash {
            0% { opacity: 0.5; }
            100% { opacity: 0; }
          }
        }
      `}</style>
    </div>
  );
}
