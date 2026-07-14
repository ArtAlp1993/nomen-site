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
import dynamic from "next/dynamic";
import catalog from "@/data/points-catalog.json";
import { calculateReading } from "@/lib/teaser";
import { buildSections, resolveVerdict, BLOCK_COLOR } from "@/lib/buildReading";
import PointIcon from "@/components/PointIcon";
import ValueRail from "./ValueRail";
import methodology from "@/data/methodology.json";
import { audioUrl, audioKey, SPEEDS } from "@/lib/audio";
import { composeCharacter } from "@/lib/characterSkills";
import { ReadingError } from "@/components/reading/ReadingSections";
import { decodeReadingToken, extractReadingCode, fetchReadingByCode } from "@/lib/readingLink";
import { EASE_CSS } from "@/lib/motion";

// Брендовые шрифты — те же, что на сайте и в видео (next/font задаёт переменные
// на <html>): заголовки Space Grotesk, метки/эйбрау/номера Space Mono, тело Inter.
// Раньше сцена шла на system-ui и визуально выпадала из бренда.
const FONT = {
  heading: "var(--font-space-grotesk), system-ui, sans-serif",
  body: "var(--font-inter), system-ui, sans-serif",
  mono: "var(--font-space-mono), ui-monospace, monospace",
};
// Тёмный ореол за текстом поверх светящейся сцены (класс .readable-on-spiral сайта,
// инлайном): нити/свечение не «прожигают» буквы панелей.
const HALO = "0 0 6px rgba(5,4,15,.95), 0 0 16px rgba(5,4,15,.9), 0 0 30px rgba(5,4,15,.8)";

// Аура-радужка — ТОТ ЖЕ WebGL-движок нитей, что центральный образ сайта
// (components/BlueprintScene ← lib/ballFormula, свод 4.3). Здесь он живёт как
// «аура» ЗА фигурой: параметры берём из морфинга клиента (composeCharacter),
// так что 13 черт лепят живую радужку, а она растёт от «зародыша» к полному
// свечению по мере собранных пунктов. Курс «гибрид» (решение Артёма 14.07):
// кадр-фигура остаётся персонажем, радужка сводит его с сайтом и видео.
const AuraScene = dynamic(() => import("@/components/BlueprintScene"), {
  ssr: false,
  loading: () => null,
});

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
// Видео-переходы Veo: { номерКадра: "/persona/transitions/t5.webm" } — заполняется
// по мере генерации (пакет №2). Ключ k = переход S(k-1) → S(k).
const TRANSITIONS = {};

// Акцент-цвет пункта (тот же ряд, что был в R3F-прототипе); a — прозрачность.
const accent = (i, a = 1) =>
  `hsl(${Math.round((((i / N) * 0.8 + 0.55) % 1) * 360)} 75% 60% / ${a})`;

// Цвет ТРАДИЦИИ пункта — как на сайте (Numerology/Astrology/Chinese/Tarot),
// чтобы иконки инвентаря были в одной системе с MethodologyDiagram/BlueprintDial.
const BLOCK_OF = Object.fromEntries(methodology.map((m) => [m.code, m.block]));
const pointColor = (code) => BLOCK_COLOR[BLOCK_OF[code]] || "#33e6e0";
// Короткое «что это» — одна фраза из methodology (не длинный интро банка).
const ABOUT_OF = Object.fromEntries(methodology.map((m) => [m.code, m.about]));


const inputStyle = {
  width: "100%", boxSizing: "border-box", marginBottom: 12, padding: "12px 14px",
  borderRadius: 12, background: "rgba(6,4,16,.7)", border: "1px solid rgba(108,79,246,.35)",
  color: "var(--foreground)", fontSize: 15, outline: "none", fontFamily: FONT.body,
};
const ctrlBtn = {
  height: 38, minWidth: 38, borderRadius: 999, cursor: "pointer",
  display: "inline-flex", alignItems: "center", justifyContent: "center",
  background: "rgba(10,8,24,.7)", border: "1px solid rgba(108,79,246,.35)", color: "var(--foreground)",
  fontSize: 14, backdropFilter: "blur(6px)", fontFamily: FONT.mono,
};
// Кнопки окон разбора: призрачная (вторичная) и градиентная (основная).
const btnGhost = {
  padding: "9px 16px", borderRadius: 999, cursor: "pointer", background: "transparent",
  border: "1px solid rgba(108,79,246,.4)", color: "#cfc9ec", fontSize: 13, fontFamily: FONT.mono,
};
const btnPrimary = (c) => ({
  padding: "9px 18px", borderRadius: 999, cursor: "pointer", border: "none",
  background: `linear-gradient(90deg, var(--accent-violet), ${c})`,
  color: "#0a0818", fontSize: 13, fontWeight: 700, fontFamily: FONT.heading,
});

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

// Фазы внутри сегмента одного пункта (t = 0..1 по скроллу):
// 0 → TOUCH_AT: полёт иконки (текст-блока нет, сцена не затемнена);
// TOUCH_AT: касание — вспышка, персонаж меняет кадр, иконка впитывается;
// затем текст-блок плавно появляется, держится и плавно уходит к концу
// сегмента — следующий пункт начинает лететь уже без блока. Скролл назад
// отыгрывает всё в обратную сторону (всё считается от позиции скролла).
const TOUCH_AT = 0.55; // доля сегмента до момента касания пункта

export default function PersonaScene() {
  const [frame, setFrame] = useState(0);          // собрано пунктов = номер кадра
  const [hudIdx, setHudIdx] = useState(-1);       // пункт для HUD-строки (летит или читается)
  const [flash, setFlash] = useState(null);       // { i, ts } — вспышка касания
  const [panelIdx, setPanelIdx] = useState(null); // клик из инвентаря
  const [haveFrame, setHaveFrame] = useState({}); // какие s1…s13 существуют
  const [haveBg, setHaveBg] = useState(false);    // фон Ф1
  const [haveAudio, setHaveAudio] = useState({}); // какие озвучки Gacrux записаны (кнопка «Слушать» только там)
  const [haveMusic, setHaveMusic] = useState(false); // есть ли реальный фон-трек public/audio/ambient.*

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
  // Морфинг персонажа из карточки (та же механика скиллов, что 3D-прототип, З-22):
  // progress = доля собранных пунктов → цвета/свечение/яркость тянутся детерминированно.
  // Персонаж тут DOM-картинки → берём из конфига цвет тела (colors[0]), искр (colors[4])
  // и bloom, красим ими свечение и фильтр роста. reading нет (демо) → null, откат на CSS.
  const morph = useMemo(() => {
    if (!reading) return null;
    const p = N > 0 ? Math.min(1, frame / N) : 0;
    try { return composeCharacter(reading, card?.g || "n", p); } catch { return null; }
  }, [reading, card, frame]);

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
  const [speed, setSpeed] = useState(1);           // скорость озвучки (0.75×–1.5×, З-47)
  const [modalFull, setModalFull] = useState(false); // окно пункта: false=короткое, true=полное
  const [verdictOpen, setVerdictOpen] = useState(false); // окно вердикта (после 13/13)
  const [connecting, setConnecting] = useState(null); // индекс пункта в фазе «определения значения»
  const [audioOpen, setAudioOpen] = useState(false); // сжимаемая аудио-панель (в полном окне)

  const videoRef = useRef(null);
  const panelIdxRef = useRef(null); // зеркало panelIdx для скролл-хендлера
  const collectedRef = useRef(new Array(N).fill(false));
  const seenRef = useRef(new Array(N).fill(false)); // авто-окно уже показано (1×/пункт)
  const maxFrameRef = useRef(0); // НАКОПИТЕЛЬНО: собранные пункты не «опустошаются» при скролле вверх
  const connectingRef = useRef(null); // зеркало connecting для скролл-хендлера
  const musicRef = useRef(null);    // Web Audio: генеративный ambient (заглушка)
  const speakingRef = useRef(false);
  const audioElRef = useRef(null);  // реальная озвучка Gacrux (public/audio/reading)
  const musicElRef = useRef(null);  // реальный фон-трек (public/audio/ambient.*)
  const speedRef = useRef(1);       // зеркало speed для обработчиков вне ре-рендера

  const displayName = titleCase((name || "Traveler").trim());

  const stopFlag = () => { speakingRef.current = false; setSpeaking(false); };
  function stopAll() {
    try { const el = audioElRef.current; if (el) { el.pause(); el.removeAttribute("src"); } } catch { /* noop */ }
    stopFlag();
  }
  // ── Прослушать. ТОЛЬКО реальный голос Gacrux (public/audio/reading по audio-
  // manifest). Браузерного голоса НЕТ (решение Артёма 13.07 — он ужасный, лучше
  // читать глазами): где файла ещё нет, кнопки «Слушать» не показываем (haveAudio). ──
  function listen({ pointCode = null, variantKey = null } = {}) {
    if (speakingRef.current) { stopAll(); return; }   // повторный клик = стоп
    const url = pointCode != null ? audioUrl(pointCode, variantKey) : null;
    const el = audioElRef.current;
    if (!url || !el) return;
    try {
      el.src = url;
      el.playbackRate = speedRef.current;
      speakingRef.current = true; setSpeaking(true);
      el.play().catch(() => stopAll());
    } catch { stopAll(); }
  }

  // ── Фоновая музыка: мягкий генеративный ambient (Web Audio) с выключением.
  // ЗАГЛУШКА до реального трека (слот public/audio/ambient.*). ──
  function toggleMusic() {
    // Уже играет → стоп (и реальный трек, и генеративный).
    if (musicOn) {
      if (musicRef.current) { musicRef.current.stop(); musicRef.current = null; }
      try { musicElRef.current?.pause(); } catch { /* noop */ }
      setMusicOn(false);
      return;
    }
    // Есть реальный фон-трек (public/audio/ambient.*) → играем аккуратную музыку.
    if (haveMusic && musicElRef.current) {
      try {
        musicElRef.current.src = haveMusic;
        musicElRef.current.volume = 0.5;
        musicElRef.current.play().catch(() => {});
        setMusicOn(true);
        return;
      } catch { /* нет трека → мягкий генеративный ниже */ }
    }
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

  function restart() {
    setVerdictOpen(false);
    setPanelIdx(null); panelIdxRef.current = null; setModalFull(false);
    seenRef.current = new Array(N).fill(false);
    maxFrameRef.current = 0; setFrame(0);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  // Лента «определила» значение → залетело в инвентарь → открываем короткое окно.
  function finishConnect() {
    const i = connectingRef.current;
    if (i === null) return;
    connectingRef.current = null;
    setConnecting(null);
    panelIdxRef.current = i; setPanelIdx(i); setModalFull(false);
  }

  // Открыть окно пункта (короткое) — из инвентаря/касания.
  function openWindow(i, full = false) {
    stopAll();
    panelIdxRef.current = i; setPanelIdx(i); setModalFull(full);
  }
  // Закрыть окно пункта.
  function closeWindow() {
    stopAll();
    panelIdxRef.current = null; setPanelIdx(null); setModalFull(false);
  }
  // «Дальше»: закрыть окно, снять блокировку скролла и плавно доехать до
  // следующего касания (там откроется его окно). На последнем пункте → вердикт.
  function goNext() {
    const i = panelIdxRef.current;
    closeWindow();
    if (i === null) return;
    if (frame >= N && i >= N - 1) { setTimeout(() => setVerdictOpen(true), 60); return; }
    setTimeout(() => {
      const el = document.scrollingElement || document.documentElement;
      const max = el.scrollHeight - el.clientHeight;
      const targetScaled = i + 1 + TOUCH_AT + 0.03;
      const targetP = Math.min(1, targetScaled / (N + 0.5));
      el.scrollTo({ top: Math.round(targetP * max), behavior: "smooth" });
    }, 60);
  }
  // «Подробнее о расчёте» → открыть чат с вопросом (FloatingDock слушает событие).
  function askInChat(point) {
    try {
      window.dispatchEvent(new CustomEvent("nomen-open-chat", {
        detail: { q: `How is my ${point.title} calculated?` },
      }));
    } catch { /* noop */ }
  }
  // Короткая фраза «как считается»: по дате (астро/число пути/аркан) или по имени.
  const NAME_BASED = new Set(["A3", "A4", "A5", "A9", "A10", "A11"]);
  function howLine(section) {
    const base = NAME_BASED.has(section.code)
      ? "По буквам вашего имени"
      : "По вашей дате рождения";
    return `${base} → ${section.valueLabel || section.title}`;
  }

  // Какие реальные озвучки Gacrux уже записаны — кнопку «Слушать» показываем ТОЛЬКО там.
  useEffect(() => {
    let alive = true;
    const probe = (key, url) => {
      if (!url) return;
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => { if (alive) setHaveAudio((h) => ({ ...h, [key]: true })); };
      a.src = url;
    };
    for (const p of POINTS) probe(audioKey(p.code, keymap[p.code]), audioUrl(p.code, keymap[p.code]));
    if (reading?.a1?.value != null) {
      const vk = String(reading.a1.value);
      probe(audioKey("verdict", vk), audioUrl("verdict", vk));
    }
    return () => { alive = false; };
  }, [keymap, reading]);

  // Реальный фоновый трек (public/audio/ambient.mp3|m4a|ogg) — если есть, музыка играет его.
  useEffect(() => {
    let alive = true;
    for (const ext of ["mp3", "m4a", "ogg"]) {
      const url = `/audio/ambient.${ext}`;
      const a = new Audio();
      a.preload = "metadata";
      a.onloadedmetadata = () => { if (alive) setHaveMusic((cur) => cur || url); };
      a.src = url;
    }
    return () => { alive = false; };
  }, []);

  // Прелоад ассетов: отмечаем, что уже сгенерено и лежит на диске.
  useEffect(() => {
    for (let k = 1; k <= N; k++) {
      const im = new Image();
      im.onload = () => setHaveFrame((h) => ({ ...h, [k]: true }));
      im.src = frameSrc(k);
    }
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
        // Окно открыто → скролл заблокирован эффектом, onScroll сюда не заходит.
        const scaled = p * (N + 0.5);
        let collected = 0;

        for (let i = 0; i < N; i++) {
          const t = Math.max(0, Math.min(1, scaled - i));
          const flight = Math.min(1, t / TOUCH_AT); // полёт занимает первую часть сегмента
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
              // Касание пункта → фаза «определения» (лента бежит, знаки мелькают,
              // фиксируется твоё значение ~1с), скролл замирает; по завершении
              // ленты (onLand) значение залетает в инвентарь и открывается окно.
              if (!seenRef.current[i] && panelIdxRef.current === null && connectingRef.current === null) {
                seenRef.current[i] = true;
                connectingRef.current = i;
                setConnecting(i);
              }
            }
          } else {
            collectedRef.current[i] = false;
          }
        }

        // Инвентарь накопительный: пункт, раз собранный, остаётся (персонаж не
        // «раздевается» при скролле вверх); это же делает вердикт достижимым.
        if (collected > maxFrameRef.current) maxFrameRef.current = collected;
        setFrame(maxFrameRef.current);
        setHudIdx(scaled > 0.2 ? Math.min(N - 1, Math.floor(scaled)) : -1);
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
    const lock = intro || verdictOpen || panelIdx !== null || connecting !== null;
    // Блокируем и body, и html: реальный скроллер сцены — documentElement,
    // иначе оверлей «стоит», а сцена прокручивается за ним (скролл будто не работает).
    document.body.style.overflow = lock ? "hidden" : "";
    document.documentElement.style.overflow = lock ? "hidden" : "";
    return () => { document.body.style.overflow = ""; document.documentElement.style.overflow = ""; };
  }, [intro, verdictOpen, panelIdx, connecting]);
  useEffect(() => () => {
    if (musicRef.current) musicRef.current.stop();
    try { audioElRef.current?.pause(); } catch { /* noop */ }
    try { musicElRef.current?.pause(); } catch { /* noop */ }
  }, []);

  // Скорость озвучки применяется вживую (и к реальному аудио, и к следующему TTS).
  useEffect(() => {
    speedRef.current = speed;
    if (audioElRef.current) audioElRef.current.playbackRate = speed;
  }, [speed]);

  // Лучший ДОСТУПНЫЙ кадр ≤ frame (сцена живёт на любом подмножестве кадров).
  let shownFrame = 0;
  for (let k = frame; k >= 1; k--) if (haveFrame[k]) { shownFrame = k; break; }
  const growSteps = frame - shownFrame;
  // Морф-производные (composeCharacter → цвет тела/искр + bloom; иначе нейтрально).
  const progress = N > 0 ? Math.min(1, frame / N) : 0;
  const bloom = morph ? morph.bloom : 1;                  // 0.5..2.4 (аркан D1 → свечение)
  const glowHex = morph ? morph.colors[0] : "#5a50ff";    // цвет тела (A1 → цвет)
  const sparkHex = morph ? morph.colors[4] : "#33e6e0";   // искры (C2 → стихия года)
  // Аура-конфиг: морфинг клиента (растёт от зародыша) с лёгким подъёмом яркости
  // и свечения, чтобы радужка читалась и на ранних пунктах. Демо (нет reading) →
  // undefined = дефолтная живая радужка (как на сайте).
  const auraCfg = morph
    ? { ...morph, opacity: Math.min(1, morph.opacity + 0.22), bloom: morph.bloom + 0.5 }
    : undefined;
  const hexA = (hex, a) => `${hex}${Math.max(0, Math.min(255, Math.round(a * 255))).toString(16).padStart(2, "0")}`;
  // «Крепчание»: недостающие кадры компенсируем фильтром, свечение растёт с bloom/прогрессом.
  const growFilter = `brightness(${(1 + growSteps * 0.05 + (bloom - 1) * 0.05).toFixed(3)}) saturate(${(1 + growSteps * 0.03 + progress * 0.25).toFixed(3)})`;

  const full = modalFull;         // false = короткое окно, true = полное
  const textIdx = panelIdx;       // какой пункт открыт в окне
  const cur = textIdx !== null ? POINTS[textIdx] : null;
  const curSection = cur ? byCode.get(cur.code) : null;
  const curColor = cur ? pointColor(cur.code) : "#33e6e0";

  // Фокус ленты: пункт, который сейчас ищется (connecting) или следующий к сбору.
  const focusIdx = connecting !== null ? connecting : Math.min(frame, N - 1);
  const focusPt = POINTS[focusIdx];
  const focusVariants = focusPt.variants;
  const railSymbolsRaw = focusVariants.map((v) => v.symbol).filter(Boolean);
  const railSymbols = railSymbolsRaw.length ? railSymbolsRaw : ["·"];
  const railSel = Math.max(0, focusVariants.findIndex((v) => v.key === keymap[focusPt.code]));
  const railColor = pointColor(focusPt.code);

  // Клиентская ссылка есть, но не открылась → та же панель ошибки, что на /reading.
  if (loadError) return <ReadingError />;

  return (
    <div style={{ background: "var(--background)", minHeight: "100vh", fontFamily: FONT.body }}>
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
            <div style={{ fontSize: 12, letterSpacing: "0.4em", color: "var(--accent-turquoise)", marginBottom: 8, fontFamily: FONT.mono, textTransform: "uppercase" }}>NOMEN</div>
            <h1 style={{ margin: "0 0 6px", fontSize: 26, color: "var(--foreground)", fontWeight: 600, fontFamily: FONT.heading, textShadow: HALO }}>Собери своего персонажа</h1>
            <p style={{ margin: "0 0 22px", fontSize: 13.5, color: "var(--foreground-muted)", lineHeight: 1.5 }}>
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
                width: "100%", marginTop: 8, padding: "13px 0", borderRadius: 999,
                cursor: birth ? "pointer" : "not-allowed", opacity: birth ? 1 : 0.5,
                border: "none", fontSize: 15, fontWeight: 700, color: "#0a0818",
                fontFamily: FONT.heading,
                background: "linear-gradient(90deg, var(--accent-violet), var(--accent-turquoise))",
                boxShadow: "0 0 40px -10px rgba(51,230,224,.6)",
              }}
            >
              Раскрыть меня →
            </button>
            <div style={{ marginTop: 12, fontSize: 11.5, color: "var(--foreground-muted)", lineHeight: 1.4 }}>
              Расчёт — движком сайта (тот же, что в разборе). Число пути, знак, стихия, аркан
              считаются от даты; выражение/душа/личность — от написания имени.
            </div>
          </div>
        </div>
      )}

      {/* ── Верхний бар: только имя персонажа «Имя · Nomen» (аудио — в полном окне) ── */}
      {!intro && (
        <>
          <div style={{ position: "fixed", zIndex: 30, top: 16, left: 16, fontSize: 13, color: "#c9b8ff", letterSpacing: "0.18em", pointerEvents: "none", fontFamily: FONT.mono, textShadow: HALO }}>
            <span style={{ color: "var(--foreground)" }}>{displayName}</span>
            <span style={{ opacity: 0.55 }}> · Nomen</span>
          </div>
          {/* Реальная озвучка Gacrux (только записанные файлы, без браузерного голоса). */}
          <audio ref={audioElRef} onEnded={stopFlag} preload="none" style={{ display: "none" }} />
          {/* Реальный фон-трек (если положен public/audio/ambient.*). */}
          <audio ref={musicElRef} loop preload="none" style={{ display: "none" }} />
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

      {/* ── Слой 0.5: аура-радужка — тот же WebGL, что на сайте; параметры из
           морфинга клиента (composeCharacter), растёт с собранными пунктами.
           Живёт ЗА фигурой, края тают маской-кругом, аддитивное свечение. ── */}
      <div
        aria-hidden="true"
        style={{
          position: "fixed", left: "64%", top: "46%", zIndex: 0,
          transform: "translate(-50%,-50%)",
          // Вертикальный эллипс — «намёк на форму тела», аура обтягивает стоящую фигуру.
          width: "min(90vh, 820px)", aspectRatio: "0.82 / 1",
          pointerEvents: "none", opacity: 1,
          WebkitMaskImage: "radial-gradient(ellipse 58% 62% at 50% 48%, #000 52%, transparent 92%)",
          maskImage: "radial-gradient(ellipse 58% 62% at 50% 48%, #000 52%, transparent 92%)",
        }}
      >
        <AuraScene accent={sparkHex} config={auraCfg} dpr={[1, 1.5]} />
      </div>

      {/* ── Слой 1: персонаж (стопка кадров + видео-переход) ── */}
      <div
        style={{
          position: "fixed", left: "64%", top: "46%", zIndex: 1,
          transform: `translate(-50%,-50%) scale(${1 + frame * 0.012})`,
          height: "62vh", aspectRatio: "893 / 1600",
          transition: `transform .6s ${EASE_CSS}`,
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
            objectFit: "contain", filter: growFilter, transition: `filter .6s ${EASE_CSS}`,
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
                transition: `opacity .55s ${EASE_CSS}, filter .6s ${EASE_CSS}`,
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
        {/* Дыхание-свечение вокруг фигуры — цвет тела+искр из composeCharacter (З-22) */}
        <div
          style={{
            position: "absolute", inset: "-8%", borderRadius: "50%",
            background: `radial-gradient(closest-side, ${hexA(glowHex, 0.06 + progress * 0.16 + (bloom - 1) * 0.03)}, ${hexA(sparkHex, 0.04 + progress * 0.05)} 46%, transparent 72%)`,
            pointerEvents: "none",
            transition: `background .6s ${EASE_CSS}`,
          }}
        />
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

      {/* ── ПОСТОЯННАЯ лента значений: слева от фигуры, над аурой. В покое медленно
           крутит значения текущего пункта; при касании (connecting) ускоряется,
           садится на твоё значение и вызывает onLand → окно. ── */}
      {!intro && !loadError && (
        <div style={{ position: "fixed", zIndex: 2, left: "46%", top: "46%", transform: "translate(-50%,-50%)", pointerEvents: "none", display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
          {connecting !== null && (
            <div style={{ fontFamily: FONT.mono, fontSize: 10, letterSpacing: "0.24em", textTransform: "uppercase", color: "#9aa0c0", textShadow: HALO, whiteSpace: "nowrap" }}>Определяем {focusPt.title}…</div>
          )}
          <div style={{ padding: "6px 8px", borderRadius: 14, transition: "background .3s, border-color .3s, box-shadow .3s", background: connecting !== null ? "rgba(10,8,24,.5)" : "rgba(10,8,24,.14)", border: `1px solid ${connecting !== null ? railColor + "44" : "rgba(108,79,246,.12)"}`, boxShadow: connecting !== null ? `0 0 34px ${railColor}22` : "none" }}>
            <ValueRail symbols={railSymbols} selectedIdx={railSel} color={railColor} seekKey={connecting} onLand={finishConnect} />
          </div>
        </div>
      )}

      {/* ── КОРОТКОЕ окно пункта: слева, НЕ перекрывает фигуру справа.
           «Что это и для чего» + «как считается» одной фразой (+ ссылка в чат). ── */}
      {cur && !full && (
        <div onClick={closeWindow} style={{ position: "fixed", zIndex: 20, inset: 0, display: "flex", alignItems: "center", justifyContent: "center", padding: 20, background: "rgba(5,4,15,.5)", backdropFilter: "blur(2px)" }}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: "100%", maxWidth: 430, maxHeight: "86vh", overflowY: "auto", overscrollBehavior: "contain", padding: "18px 22px 20px", borderRadius: 18, background: "rgba(10,8,24,.96)", border: `1px solid ${curColor}66`, boxShadow: `0 0 60px ${curColor}2e`, backdropFilter: "blur(10px)", animation: "nomenPopIn .3s ease" }}>
            {/* Шапка: иконка + код + закрыть */}
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 10 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 10, color: curColor }}>
                <PointIcon code={cur.code} size={26} />
                <span style={{ fontFamily: FONT.mono, fontSize: 10.5, letterSpacing: "0.24em", textTransform: "uppercase", opacity: 0.85 }}>{cur.code} · {textIdx + 1}/{N}</span>
              </div>
              <button onClick={closeWindow} title="Закрыть" style={{ background: "transparent", border: "none", color: "#8f95b3", fontSize: 16, cursor: "pointer", padding: 2, lineHeight: 1 }}>✕</button>
            </div>

            {/* Главное: ЧТО определяли + ЧТО получилось + краткий смысл */}
            <h2 style={{ margin: "6px 0 2px", fontSize: 20, fontFamily: FONT.heading, color: "var(--foreground)" }}>{cur.title}</h2>
            <div style={{ margin: "0 0 10px", fontSize: 15, color: curColor, fontWeight: 700 }}>{curSection?.valueLabel || variantOf(cur).label}</div>
            <p style={{ margin: "0 0 6px", fontSize: 13.5, lineHeight: 1.5, color: "#d7d2ee" }}>{ABOUT_OF[cur.code] || cur.title}</p>
            {curSection?.entries?.[0]?.paragraphs?.[0] && (
              <p style={{ margin: "0 0 12px", fontSize: 13, lineHeight: 1.55, color: "#a6a0c6", display: "-webkit-box", WebkitLineClamp: 3, WebkitBoxOrient: "vertical", overflow: "hidden" }}>
                {curSection.entries[0].paragraphs[0]}
              </p>
            )}

            <div style={{ borderTop: "1px solid rgba(108,79,246,.18)", margin: "6px 0 12px" }} />

            {/* Действия — аккуратными ссылками. Полный разбор — первым. */}
            <button onClick={() => setModalFull(true)} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: "2px 0 8px", color: curColor, fontFamily: FONT.heading, fontSize: 16, fontWeight: 700 }}>
              Полный разбор пункта →
            </button>
            <button onClick={goNext} style={{ display: "block", width: "100%", textAlign: "left", background: "transparent", border: "none", cursor: "pointer", padding: "2px 0 10px", color: "#c9b8ff", fontFamily: FONT.mono, fontSize: 13.5 }}>
              {frame >= N && textIdx >= N - 1 ? "К вердикту ↓" : "Продолжить поиск →"}
            </button>
            {/* Мелко: методика расчёта → в чат */}
            <div style={{ fontSize: 11.5, lineHeight: 1.45, color: "#7c7fa0" }}>
              {curSection ? `${howLine(curSection)}. ` : ""}Как посчитано, по какой формуле —{" "}
              <button onClick={() => askInChat(cur)} style={{ background: "transparent", border: "none", color: curColor, fontSize: 11.5, cursor: "pointer", padding: 0, fontFamily: FONT.mono, textDecoration: "underline", opacity: 0.9 }}>спросить в чате</button>.
            </div>
          </div>
        </div>
      )}

      {/* ── ПОЛНОЕ окно пункта: на весь экран, фигуры не видно; имя+Nomen сверху ── */}
      {cur && full && (
        <div style={{ position: "fixed", inset: 0, zIndex: 40, background: "rgba(5,4,15,0.97)", overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}>
          <div style={{ maxWidth: 640, margin: "0 auto", padding: "0 20px 72px" }}>
            <div style={{ position: "sticky", top: 0, background: "rgba(5,4,15,0.97)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 12px", zIndex: 1 }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 12.5, letterSpacing: "0.18em", color: "#c9b8ff" }}><span style={{ color: "var(--foreground)" }}>{displayName}</span> · Nomen</span>
              <div style={{ display: "flex", gap: 6, alignItems: "center" }}>
                {/* Аудио-панель (сжимаемая): динамик с волнами → голос/музыка/скорость */}
                <button onClick={() => setAudioOpen((o) => !o)} title="Звук" aria-label="Звук"
                  style={{ ...ctrlBtn, width: "auto", padding: "0 10px", color: audioOpen ? "var(--accent-turquoise)" : "var(--foreground)", borderColor: audioOpen ? "var(--accent-turquoise)" : "rgba(108,79,246,.35)" }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M4 9v6h4l5 4V5L8 9H4z" />
                    <path d="M16.5 9a3.5 3.5 0 0 1 0 6" />
                    <path d="M19 6.5a7 7 0 0 1 0 11" />
                  </svg>
                </button>
                {audioOpen && (
                  <div style={{ display: "flex", gap: 6, alignItems: "center", animation: "nomenPopIn .2s ease" }}>
                    {haveAudio[audioKey(cur.code, keymap[cur.code])] ? (
                      <button onClick={() => listen({ pointCode: cur.code, variantKey: keymap[cur.code] })} style={{ height: 34, padding: "0 12px", borderRadius: 999, cursor: "pointer", background: "rgba(51,230,224,.1)", border: "1px solid var(--accent-turquoise)", color: "var(--accent-turquoise)", fontSize: 11.5, fontFamily: FONT.mono }}>{speaking ? "⏸ голос" : "▶ голос"}</button>
                    ) : (
                      <span style={{ fontSize: 10.5, color: "#6c7095", fontFamily: FONT.mono, whiteSpace: "nowrap" }}>голос скоро</span>
                    )}
                    <button onClick={toggleMusic} title="Фоновая музыка" style={{ height: 34, padding: "0 12px", borderRadius: 999, cursor: "pointer", background: "rgba(10,8,24,.6)", border: `1px solid ${musicOn ? "var(--accent-violet)" : "rgba(108,79,246,.3)"}`, color: musicOn ? "#c9b8ff" : "#9aa0c0", fontSize: 11.5, fontFamily: FONT.mono }}>♪ {musicOn ? "вкл" : "выкл"}</button>
                    <button onClick={() => setSpeed((s) => SPEEDS[(SPEEDS.indexOf(s) + 1) % SPEEDS.length])} title="Скорость озвучки" style={{ height: 34, padding: "0 12px", borderRadius: 999, cursor: "pointer", background: "rgba(10,8,24,.6)", border: "1px solid rgba(108,79,246,.3)", color: "#cfc9ec", fontSize: 11.5, fontFamily: FONT.mono }}>{speed}×</button>
                  </div>
                )}
                <button onClick={() => setModalFull(false)} style={{ ...ctrlBtn, width: "auto", padding: "0 12px", fontSize: 12 }}>◀ Назад</button>
                <button onClick={closeWindow} style={{ ...ctrlBtn, width: "auto", padding: "0 12px", fontSize: 12 }}>Закрыть ✕</button>
              </div>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "22px 0 8px", color: curColor }}>
              <PointIcon code={cur.code} size={34} />
              <div>
                <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.22em", textTransform: "uppercase", opacity: 0.8 }}>{cur.code} · POINT {textIdx + 1} OF {N}</div>
                <h2 style={{ margin: "2px 0 0", fontSize: 26, fontFamily: FONT.heading, color: "var(--foreground)" }}>{cur.title}</h2>
              </div>
            </div>
            {curSection?.valueLabel && <div style={{ fontSize: 15, fontWeight: 600, color: "#c9b8ff", marginBottom: 12 }}>{curSection.valueLabel}</div>}
            {curSection ? <SectionText section={curSection} full /> : <p style={{ color: "#9aa0c0", fontSize: 14, lineHeight: 1.6 }}>{variantOf(cur).blurb || ""}</p>}
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              <button onClick={() => setModalFull(false)} style={btnGhost}>◀ Назад</button>
              <button onClick={goNext} style={btnPrimary(curColor)}>{frame >= N && textIdx >= N - 1 ? "К вердикту ↓" : "Дальше ↓"}</button>
            </div>
          </div>
        </div>
      )}

      {/* ── HUD: подсказка / кнопка вердикта (когда все 13 собраны) ── */}
      {panelIdx === null && !verdictOpen && (
        <div style={{ position: "fixed", zIndex: 8, bottom: 22, left: 0, right: 0, textAlign: "center", pointerEvents: "none", fontFamily: FONT.mono, textShadow: HALO }}>
          {frame >= N ? (
            <button onClick={() => setVerdictOpen(true)} style={{ ...btnPrimary("var(--accent-turquoise)"), pointerEvents: "auto", padding: "12px 26px", fontSize: 14 }}>Показать вердикт ✦</button>
          ) : hudIdx < 0 ? (
            <div style={{ fontSize: 14, color: "var(--accent-turquoise)" }}>Листай вниз — грани присоединяются к персонажу ↓</div>
          ) : (
            <div style={{ fontSize: 13, color: "#8f95b3" }}>Грань {hudIdx + 1} из {N} · персонаж крепчает</div>
          )}
        </div>
      )}

      {/* ── Инвентарь: вертикальная колонка СЛЕВА (13 ячеек, PointIcon в цвете
           традиции — одна система иконок с сайтом; заполняется сверху вниз) ── */}
      <div
        style={{
          position: "fixed", zIndex: 6, left: 12, top: "50%", transform: "translateY(-50%)",
          display: "flex", flexDirection: "column", gap: 4, padding: "8px 6px", borderRadius: 16,
          background: "rgba(10,8,24,.55)", border: "1px solid rgba(108,79,246,.22)", backdropFilter: "blur(8px)",
          maxHeight: "94vh", overflowY: "auto",
        }}
      >
        {POINTS.map((p, i) => {
          const got = i < frame;
          const col = pointColor(p.code);
          const v = variantOf(p);
          return (
            <button
              key={p.code}
              onClick={() => (got ? openWindow(i, false) : null)}
              title={p.title}
              style={{
                width: 44, borderRadius: 10, cursor: "pointer", flex: "none",
                display: "flex", flexDirection: "column", alignItems: "center", gap: 1, padding: "4px 2px",
                color: got ? col : "#4a4766",
                background: got ? "rgba(20,16,44,.85)" : "rgba(12,10,28,.5)",
                border: `1px solid ${got ? col : "rgba(108,79,246,.18)"}`,
                boxShadow: got ? `0 0 12px ${col}44` : "none",
                transition: `all .35s ${EASE_CSS}`,
                opacity: got ? 1 : 0.55,
              }}
            >
              <PointIcon code={p.code} size={19} />
              <span style={{ fontFamily: FONT.mono, fontSize: 8, lineHeight: 1, letterSpacing: "0.02em", maxWidth: 40, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {got ? (v.symbolKind === "number" || v.symbolKind === "label" ? v.symbol : v.key) : "·"}
              </span>
            </button>
          );
        })}
      </div>

      {/* ── Окно ВЕРДИКТА (после 13/13): сгенерированный итог + все 13 граней
           ссылками-раскрытиями (клик открывает полный разбор пункта). ── */}
      {verdictOpen && (
        <div style={{ position: "fixed", inset: 0, zIndex: 50, background: "rgba(5,4,15,0.98)", overflowY: "auto", overscrollBehavior: "contain", WebkitOverflowScrolling: "touch" }}>
          <div style={{ maxWidth: 680, margin: "0 auto", padding: "0 20px 72px" }}>
            <div style={{ position: "sticky", top: 0, background: "rgba(5,4,15,0.98)", display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0 12px", zIndex: 1 }}>
              <span style={{ fontFamily: FONT.mono, fontSize: 12.5, letterSpacing: "0.18em", color: "#c9b8ff" }}><span style={{ color: "var(--foreground)" }}>{displayName}</span> · Nomen · Verdict</span>
              <button onClick={() => setVerdictOpen(false)} style={{ ...ctrlBtn, width: "auto", padding: "0 14px", fontSize: 13 }}>Закрыть ✕</button>
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.32em", color: "var(--accent-turquoise)", textTransform: "uppercase", margin: "8px 0 4px" }}>Вердикт</div>
            <h2 style={{ margin: "0 0 4px", fontSize: 27, fontFamily: FONT.heading, color: "var(--foreground)", textShadow: HALO }}>{displayName}, in one thread</h2>
            {birth && <div style={{ fontSize: 12.5, color: "#8f95b3", marginBottom: 8, fontFamily: FONT.mono }}>born {birth}</div>}
            {verdict.heading && !verdict.isAi && <div style={{ fontSize: 14, color: "#c9b8ff", fontWeight: 600, marginBottom: 12 }}>{verdict.heading}</div>}
            <div style={{ margin: "6px 0 24px" }}>
              {verdict.paragraphs.length ? verdict.paragraphs.map((p, k) => (
                <p key={k} style={{ margin: "0 0 10px", fontSize: 15, color: "#c9c3e6", lineHeight: 1.6 }}>{p}</p>
              )) : (
                <p style={{ fontSize: 15, color: "#c9c3e6", lineHeight: 1.6 }}>Все 13 граней собраны — путь, дар, знак, стихия и аркан сплелись в один рисунок.</p>
              )}
            </div>
            <div style={{ fontFamily: FONT.mono, fontSize: 11, letterSpacing: "0.22em", color: "#8f95b3", textTransform: "uppercase", marginBottom: 10 }}>13 граней — открыть разбор</div>
            <div style={{ display: "grid", gap: 8 }}>
              {POINTS.map((p, i) => {
                const s = byCode.get(p.code);
                const col = pointColor(p.code);
                return (
                  <button key={p.code} onClick={() => { setVerdictOpen(false); openWindow(i, true); }}
                    style={{ display: "flex", alignItems: "center", gap: 12, textAlign: "left", padding: "10px 14px", borderRadius: 12, cursor: "pointer", background: "rgba(20,16,44,.6)", border: `1px solid ${col}33`, color: "var(--foreground)" }}>
                    <span style={{ color: col, flex: "none", display: "inline-flex" }}><PointIcon code={p.code} size={22} /></span>
                    <span style={{ flex: 1, minWidth: 0 }}>
                      <span style={{ display: "block", fontSize: 14, fontWeight: 600 }}>{p.title}</span>
                      <span style={{ display: "block", fontSize: 12, color: "#9aa0c0", fontFamily: FONT.mono, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{s?.valueLabel || variantOf(p).label}</span>
                    </span>
                    <span style={{ color: col, opacity: 0.7 }}>→</span>
                  </button>
                );
              })}
            </div>
            <div style={{ display: "flex", gap: 10, marginTop: 24, flexWrap: "wrap" }}>
              <button onClick={restart} style={btnGhost}>↑ Заново</button>
            </div>
          </div>
        </div>
      )}

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
