// Генератор единого каталога «пункт → варианты → символ/картинка/изменение тела».
// Источник вариантов — банк разборов data/readings/{code}.json (ключи values =
// реальные варианты, что видит клиент). Символы вариантов сейчас = осмысленные
// юникод-ЗАГЛУШКИ (♌, 水, 7…); слот image пуст — заполнится banana-картинками,
// когда будет API (кладём в public/persona/icons/{code}/{key}.png).
//
// Уровни (решение 13.07): ИКОНКА-символ — на ВАРИАНT (прилетает именно тот, что
// у клиента); ИЗМЕНЕНИЕ ТЕЛА (кадр S) — на ПУНКТ (13 штук, одинаковы для всех),
// у C2 добавляется цвет стихии. Запуск: node scripts/gen-points-catalog.mjs
// → data/points-catalog.json.

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA = path.join(__dirname, "..", "data");
const READINGS = path.join(DATA, "readings");

// Порядок = порядок присоединения на сцене. bodyChange = кадр S тела (пунктовый).
// pointIcon = код в PointIcon.js (значок пункта, канон сайта). vtype = тип вариантов.
const POINTS = [
  { code: "A1", body: "s1", frame: "compass-rose", icon: "A1", vtype: "number" },
  { code: "A2", body: "s2", frame: "gift", icon: "A2", vtype: "number" },
  { code: "A3", body: "s3", frame: "star", icon: "A3", vtype: "number" },
  { code: "A4", body: "s4", frame: "heart", icon: "A4", vtype: "number" },
  { code: "A5", body: "s5", frame: "outline", icon: "A5", vtype: "number" },
  { code: "A7", body: "s6", frame: "tree", icon: "A7", vtype: "number" },
  { code: "A9", body: "s7", frame: "book", icon: "A9", vtype: "lessons" },
  { code: "A10", body: "s8", frame: "grid", icon: "A10", vtype: "grid" },
  { code: "A11", body: "s9", frame: "chain", icon: "A11", vtype: "debt" },
  { code: "B1", body: "s10", frame: "sun", icon: "B1", vtype: "zodiac" },
  { code: "C1", body: "s11", frame: "paw", icon: "C1", vtype: "animal" },
  { code: "C2", body: "s12", frame: "element", icon: "C2", vtype: "element" },
  { code: "D1", body: "s13", frame: "crown-open", icon: "D1", vtype: "tarot" },
];

// Юникод-заглушки символов вариантов (пока нет banana-картинок).
const ZODIAC = { Aries: "♈", Taurus: "♉", Gemini: "♊", Cancer: "♋", Leo: "♌", Virgo: "♍", Libra: "♎", Scorpio: "♏", Sagittarius: "♐", Capricorn: "♑", Aquarius: "♒", Pisces: "♓" };
const ANIMAL = { Rat: "🐀", Ox: "🐂", Tiger: "🐅", Rabbit: "🐇", Dragon: "🐉", Snake: "🐍", Horse: "🐎", Goat: "🐐", Monkey: "🐒", Rooster: "🐓", Dog: "🐕", Pig: "🐖" };
const ELEMENT = { Wood: { g: "木", color: "#4fd08a" }, Fire: { g: "火", color: "#ff6b5a" }, Earth: { g: "土", color: "#e0b060" }, Metal: { g: "金", color: "#d8dbe6" }, Water: { g: "水", color: "#4aa9ff" } };
const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X", "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];

// Первая строка heading варианта из банка → человекочитаемый label/tooltip.
function headingOf(values, key) {
  const v = values?.[key];
  if (v && typeof v === "object" && v.heading) return String(v.heading);
  return null;
}

// Первый абзац варианта → короткий текст для панели сцены (заглушка контента).
function blurbOf(values, key) {
  const v = values?.[key];
  const p = v && typeof v === "object" && Array.isArray(v.paragraphs) ? v.paragraphs[0] : null;
  return p ? String(p) : null;
}

function symbolFor(vtype, key, values) {
  switch (vtype) {
    case "number": return { stub: key, kind: "number" };
    case "zodiac": return { stub: ZODIAC[key] || "☉", kind: "glyph" };
    case "animal": return { stub: ANIMAL[key] || "🐾", kind: "emoji" };
    case "element": {
      const e = ELEMENT[key] || {};
      return { stub: e.g || "⬠", kind: "glyph", color: e.color || null };
    }
    case "tarot": return { stub: ROMAN[Number(key)] ?? key, kind: "roman" };
    case "debt": return { stub: key === "none" ? "∅" : key, kind: "number" };
    case "lessons": {
      if (key === "no_lessons") return { stub: "✓", kind: "glyph" };
      const [type, n] = key.split("_");
      return { stub: (type === "passion" ? "P" : "L") + n, kind: "label" };
    }
    case "grid": {
      // Чистый значок психоматрицы (какая ячейка сильна — видно в панели разбора);
      // «1●●●» как летящая иконка читался мусором. ▦ = квадрат Пифагора.
      return { stub: "▦", kind: "glyph" };
    }
    default: return { stub: key, kind: "label" };
  }
}

const points = POINTS.map((p) => {
  const reading = JSON.parse(fs.readFileSync(path.join(READINGS, `${p.code.toLowerCase()}.json`), "utf8"));
  const values = reading.values || {};
  const keys = Object.keys(values);
  const variants = keys.map((key) => {
    const sym = symbolFor(p.vtype, key, values);
    return {
      key,
      label: headingOf(values, key) || key,
      blurb: blurbOf(values, key), // первый абзац разбора (для панели сцены)
      symbol: sym.stub,        // юникод-заглушка (до картинок)
      symbolKind: sym.kind,
      color: sym.color || null,
      image: null,              // слот: /persona/icons/{code}/{key}.png когда будет
    };
  });
  return {
    code: p.code,
    title: reading.title,
    pointIcon: p.icon,          // значок пункта (PointIcon.js, канон сайта)
    bodyFrame: p.body,          // кадр тела S (пунктовый, /persona/frames/{body}.jpg)
    bodyChange: p.frame,        // словесное имя изменения тела
    variantType: p.vtype,
    variantCount: variants.length,
    variants,
  };
});

const catalog = {
  _meta: {
    generated_by: "scripts/gen-points-catalog.mjs",
    note: "Символы вариантов сейчас — юникод-заглушки. Картинки banana кладутся в public/persona/icons/{code}/{key}.png и подхватываются полем image.",
    levels: "icon=на вариант (прилетает символ клиента); bodyFrame=на пункт (13 кадров S).",
    points_total: points.length,
    variants_total: points.reduce((s, p) => s + p.variantCount, 0),
  },
  points,
};

fs.writeFileSync(path.join(DATA, "points-catalog.json"), JSON.stringify(catalog, null, 2) + "\n");
console.log(`points-catalog.json: ${points.length} пунктов, ${catalog._meta.variants_total} вариантов`);
for (const p of points) console.log(`  ${p.code.padEnd(4)} ${String(p.variantCount).padStart(3)}  ${p.title}`);
