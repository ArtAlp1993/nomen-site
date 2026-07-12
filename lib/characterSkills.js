// NOMEN · Движок «растущего персонажа» (C2a, З-22).
//
// Превращает карточку клиента (lib/teaser.js → calculateReading) в конфиг
// шарика (BlueprintScene / ballFormula) и умеет показывать его РОСТ: от
// «зародыша» (мелкий, тусклый, редкий) к финальному персонажу.
//
// Модель (по уточнениям Артёма 12.07 — см.
// Nomen/01_Продукт/2026-07-12_маппинг-пунктов-в-черты-персонажа.md):
//  • Каждый из 13 пунктов = отдельная ЧЕРТА (модуль): свой параметр(ы), своя
//    функция «значение пункта → цель», свой ВЕС.
//  • ВЕС (разный у черт, но сбалансированный) задаёт ВЕЛИЧИНУ ухода от зародыша.
//    Значение пункта выбирает ВАРИАНТ (цвет/форму/повадку), не величину.
//  • Рост = один общий морфинг: прогресс p (0→1) тянет ВСЕ черты ОДНОВРЕМЕННО,
//    пропорционально. Никакого «сначала одни, потом другие».
//  • Детерминизм: всё из карточки, без Math.random — воспроизводимо.
//
// Веса вынесены в SKILL_TRAITS.weight и легко правятся (ползунки прототипа /lab).

// Относительный импорт (не "@/"): движок читается и Next.js, и node-скриптом
// проверки (scripts/verify-skills.mjs). ballFormula самодостаточен — три.js не тянет.
import { DEFAULT_CONFIG, clampPatch } from "./ballFormula.js";

// ── Утилиты ─────────────────────────────────────────────────

// Нумерологическое значение (1..9, мастер 11/22/33) → доля 0..1.
// 1→0, 9→1; мастер-числа — у верхней границы (самые «сильные»).
function numFraction(value) {
  if (value === 11 || value === 22 || value === 33) return 1;
  const v = Math.max(1, Math.min(9, value || 1));
  return (v - 1) / 8;
}

// Доля 0..1 → значение в диапазоне [lo, hi].
const lerp = (lo, hi, t) => lo + (hi - lo) * t;

// ── Цвет: hex ↔ rgb, HSL → hex, смешивание ──────────────────

function hexToRgb(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
function rgbToHex([r, g, b]) {
  const h = (x) => Math.round(Math.max(0, Math.min(255, x))).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}
function mixHex(a, b, t) {
  const ra = hexToRgb(a);
  const rb = hexToRgb(b);
  return rgbToHex([lerp(ra[0], rb[0], t), lerp(ra[1], rb[1], t), lerp(ra[2], rb[2], t)]);
}
function hslToHex(h, s, l) {
  h = ((h % 360) + 360) % 360;
  const c = (1 - Math.abs(2 * l - 1)) * s;
  const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
  const m = l - c / 2;
  let r = 0, g = 0, b = 0;
  if (h < 60) [r, g, b] = [c, x, 0];
  else if (h < 120) [r, g, b] = [x, c, 0];
  else if (h < 180) [r, g, b] = [0, c, x];
  else if (h < 240) [r, g, b] = [0, x, c];
  else if (h < 300) [r, g, b] = [x, 0, c];
  else [r, g, b] = [c, 0, x];
  return rgbToHex([(r + m) * 255, (g + m) * 255, (b + m) * 255]);
}

// ── Гаммы пола и палитра A1 ─────────────────────────────────
// Пол задаёт базовый тон (hue/saturation), число пути A1 сдвигает оттенок
// ВНУТРИ гаммы. 4 «тела» волокон — по светлоте; 5-й слот (искры) красит C2.

const GENDER_GAMMA = {
  m: { hue: 225, sat: 0.85 }, // мужской — синий/индиго
  f: { hue: 330, sat: 0.8 }, // женский — розовый/маджента
  n: { hue: 255, sat: 0.8 }, // нейтраль — индиго-фиолет
};

// Сдвиг оттенка по числу пути (в пределах ±45° от базы гаммы).
const A1_HUE_OFFSET = {
  1: -40, 2: 30, 3: 15, 4: -25, 5: 45, 6: 0,
  7: -15, 8: -35, 9: 20, 11: 40, 22: -45, 33: 10,
};
const BODY_LIGHTNESS = [0.5, 0.58, 0.66, 0.72];

function a1Palette(number, gender) {
  const g = GENDER_GAMMA[gender] || GENDER_GAMMA.n;
  const off = A1_HUE_OFFSET[number] ?? 0;
  return BODY_LIGHTNESS.map((l) => hslToHex(g.hue + off, g.sat, l));
}

// «Зародыш»: цвета гаммы, но тусклые и низкой насыщенности.
function seedColors(gender) {
  const g = GENDER_GAMMA[gender] || GENDER_GAMMA.n;
  const body = [0.28, 0.32, 0.36, 0.4].map((l) => hslToHex(g.hue, g.sat * 0.4, l));
  return [...body, hslToHex(g.hue, g.sat * 0.4, 0.5)]; // 5-й — искры (тусклые)
}

// ── Стихии, знаки, животные ─────────────────────────────────

const SIGN_ELEMENT = {
  "Овен": "fire", "Лев": "fire", "Стрелец": "fire",
  "Телец": "earth", "Дева": "earth", "Козерог": "earth",
  "Близнецы": "air", "Весы": "air", "Водолей": "air",
  "Рак": "water", "Скорпион": "water", "Рыбы": "water",
};
// Лепка тела по стихии знака: [scaleX, scaleY, scaleZ].
const ELEMENT_SHAPE = {
  fire: [0.8, 1.6, 0.9], // вытянут вверх
  earth: [1.45, 0.7, 1.2], // приземист и широк
  air: [1.25, 1.2, 0.8], // распахнут, лёгкий
  water: [0.9, 1.35, 1.05], // текучая капля
};
// Темперамент (модальность знака) → скорость вращения.
const SIGN_MODALITY = {
  "Овен": "card", "Рак": "card", "Весы": "card", "Козерог": "card",
  "Телец": "fix", "Лев": "fix", "Скорпион": "fix", "Водолей": "fix",
  "Близнецы": "mut", "Дева": "mut", "Стрелец": "mut", "Рыбы": "mut",
};
const MODALITY_ROT = { card: 0.16, fix: 0.05, mut: 0.1 };

// Повадка животного года → [tilt, breathe].
const ANIMAL_MOTION = {
  "Крыса": [1.4, 0.06], "Бык": [0.5, 0.03], "Тигр": [2.0, 0.07],
  "Кролик": [1.7, 0.06], "Дракон": [2.4, 0.09], "Змея": [0.35, 0.03],
  "Лошадь": [2.1, 0.08], "Коза": [1.2, 0.05], "Обезьяна": [2.3, 0.08],
  "Петух": [1.5, 0.05], "Собака": [1.0, 0.05], "Свинья": [0.7, 0.04],
};

// Цвет искр по стихии года (5-й цвет палитры).
const YEAR_ELEMENT_SPARK = {
  "Дерево": "#33e6a0", "Огонь": "#ff5a2a", "Земля": "#ffc04a",
  "Металл": "#d8e0f0", "Вода": "#33a0ff",
};

// ── Зародыш ─────────────────────────────────────────────────
// Малый, тусклый, редкий: старт роста. Все черты тянут форму от него.

function seedConfig(gender) {
  return {
    ...DEFAULT_CONFIG,
    fibers: 420,
    pupil: 0.5,
    spread: 1.3,
    spreadVar: 0.35,
    twist: 0.3,
    depth: 0.35,
    scaleX: 1, scaleY: 1, scaleZ: 1,
    zoom: 0.55,
    rotSpeed: 0.02,
    breathe: 0.01,
    tilt: 0.4,
    opacity: 0.28,
    tipSize: 0.02,
    bloom: 0.5,
    colors: seedColors(gender),
  };
}

// ── 13 черт-модулей ─────────────────────────────────────────
// target(reading, gender) → частичный конфиг (полная «цель» черты).
// Если пункт не посчитан (reading[...] == null) — target возвращает null,
// черта остаётся на зародыше (её параметр не двигается).
// weight — величина ухода от зародыша (0..1), правится легко (прототип /lab).

export const SKILL_TRAITS = [
  {
    code: "A1", label: "Число пути → цвет тела", weight: 1.0,
    target: (r, g) => ({ colorsBody: a1Palette(r.a1.value, g) }),
  },
  {
    code: "A2", label: "День рождения → размер", weight: 0.7,
    target: (r) => ({ zoom: lerp(0.8, 1.3, numFraction(r.a2.value)) }),
  },
  {
    code: "A3", label: "Экспрессия → размах", weight: 0.85,
    target: (r) => (r.a3 ? { spread: lerp(1.8, 3.4, numFraction(r.a3.value)) } : null),
  },
  {
    code: "A4", label: "Число души → зрачок", weight: 0.55,
    target: (r) => (r.a4 ? { pupil: lerp(0.35, 1.0, numFraction(r.a4.value)) } : null),
  },
  {
    code: "A5", label: "Личность → яркость", weight: 0.75,
    target: (r) => (r.a5 ? { opacity: lerp(0.55, 0.95, numFraction(r.a5.value)) } : null),
  },
  {
    code: "A7", label: "Зрелость → объём 3D", weight: 0.7,
    target: (r) => (r.a7 ? { depth: lerp(0.6, 2.2, numFraction(r.a7.value)) } : null),
  },
  {
    code: "A9", label: "Страсть/уроки → искры+кромка", weight: 0.6,
    target: (r) => {
      if (!r.a9) return null;
      const maxCount = Math.max(...Object.values(r.a9.counts));
      const passionT = Math.min(1, (maxCount - 1) / 5); // сила скрытой страсти
      const lessonsT = Math.min(1, (r.a9.lessons?.length || 0) / 6); // пробелы
      return { tipSize: lerp(0.03, 0.13, passionT), spreadVar: lerp(0.5, 1.9, lessonsT) };
    },
  },
  {
    code: "A10", label: "Психоматрица → густота", weight: 0.9,
    target: (r) => {
      const filled = Object.values(r.a10.cells).filter((c) => c > 0).length; // 0..9
      return { fibers: Math.round(lerp(900, 2500, filled / 9)) };
    },
  },
  {
    code: "A11", label: "Кармдолг → закрутка", weight: 0.65,
    target: (r) => (r.a11 ? { twist: r.a11.hasDebt ? 2.4 : 0.4 } : { twist: 0.4 }),
  },
  {
    code: "B1", label: "Знак → лепка+вращение", weight: 0.95,
    target: (r) => {
      const [sx, sy, sz] = ELEMENT_SHAPE[SIGN_ELEMENT[r.b1.key]] || [1, 1, 1];
      const rot = MODALITY_ROT[SIGN_MODALITY[r.b1.key]] ?? 0.05;
      return { scaleX: sx, scaleY: sy, scaleZ: sz, rotSpeed: rot };
    },
  },
  {
    code: "C1", label: "Животное → пластика", weight: 0.6,
    target: (r) => {
      const [tilt, breathe] = ANIMAL_MOTION[r.c1.key] || [1, 0.05];
      return { tilt, breathe };
    },
  },
  {
    code: "C2", label: "Стихия года → цвет искр", weight: 0.8,
    target: (r) => ({ spark: YEAR_ELEMENT_SPARK[r.c2.key] || "#33e6e0" }),
  },
  {
    code: "D1", label: "Аркан → свечение", weight: 0.75,
    target: (r) => ({ bloom: lerp(0.8, 2.4, (r.d1.num || 0) / 21) }),
  },
];

// ── Сборка персонажа ────────────────────────────────────────
// composeCharacter(reading, gender, progress, weights?)
//  progress 0..1 — рост (скролл). 0 = зародыш, 1 = финал.
//  weights — переопределение весов { A1: 0.8, ... } (для прототипа /lab).
// Возвращает конфиг для BlueprintScene (16 ручек + colors[5]).

export function composeCharacter(reading, gender = "n", progress = 1, weights = null) {
  const seed = seedConfig(gender);
  const cfg = { ...seed };
  const p = Math.max(0, Math.min(1, progress));
  const bodySeed = seed.colors.slice(0, 4);
  let bodyTarget = bodySeed;
  let sparkTarget = seed.colors[4];

  for (const trait of SKILL_TRAITS) {
    const raw = trait.target(reading, gender);
    if (!raw) continue;
    const w = weights && weights[trait.code] != null ? weights[trait.code] : trait.weight;
    const k = w * p; // общая доля этой черты сейчас

    for (const [param, value] of Object.entries(raw)) {
      if (param === "colorsBody") {
        bodyTarget = value.map((c, i) => mixHex(bodySeed[i], c, w)); // цель при p=1
      } else if (param === "spark") {
        sparkTarget = mixHex(seed.colors[4], value, w);
      } else {
        cfg[param] = seed[param] + (value - seed[param]) * k;
      }
    }
  }

  // Цвета морфятся тем же прогрессом p (все черты одновременно).
  cfg.colors = [
    ...bodySeed.map((c, i) => mixHex(c, bodyTarget[i], p)),
    mixHex(seed.colors[4], sparkTarget, p),
  ];

  // Гарантируем валидные диапазоны (clampPatch не трогает то, что и так в норме).
  const clamped = clampPatch(cfg);
  return { ...cfg, ...clamped, colors: cfg.colors };
}

// Финальный персонаж (progress=1) — удобный шорткат.
export const finalCharacter = (reading, gender, weights) =>
  composeCharacter(reading, gender, 1, weights);
