// ЕДИНЫЙ ИСТОЧНИК ТЕКСТА разбора. И страница /reading (components/reading/*),
// и продукт-персонаж (components/persona/PersonaScene) строят пункты ОТСЮДА —
// одной функцией buildSections + одним resolveVerdict. Так текст пунктов внутри
// персонажа гарантированно точь-в-точь совпадает с /reading (единый банк, единый
// расчёт lib/teaser.calculateReading). Раньше buildSections жил в ReadingPage.js,
// а персонаж тянул урезанный blurb из points-catalog — этот модуль убирает дубль.

import { a10Bucket } from "@/lib/teaser";
import methodology from "@/data/methodology.json";
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
import verdict3Bank from "@/data/readings/verdict3.json";

// Банки вердикта переэкспортируем — чтобы у /reading и персонажа был один источник.
export { verdictBank, verdict3Bank };

// Цвета категорий — те же, что в MethodologyDiagram.
export const BLOCK_COLOR = {
  Numerology: "#33e6e0",
  "Western Astrology": "#6c4ff6",
  "Chinese Astrology": "#c07bff",
  Tarot: "#5aa9ff",
};

const META = Object.fromEntries(methodology.map((m) => [m.code, m]));
const meta = (code) => META[code] || { title: code, block: "Numerology", about: "" };

// Собирает секции путешествия из расчёта и банка текстов.
// Каждая секция: { code, accent, glyph, title, about, valueLabel, entries[] }
// (entry = { heading, paragraphs[], glyph? }); A10 — { kind:"matrix", cells, entries[] }.
export function buildSections(reading) {
  const out = [];
  const numeric = [
    ["A1", bankA1, reading.a1, "Life Path"],
    ["A2", bankA2, reading.a2, "Birthday"],
    ["A3", bankA3, reading.a3, "Expression"],
    ["A4", bankA4, reading.a4, "Soul Urge"],
    ["A5", bankA5, reading.a5, "Personality"],
    ["A7", bankA7, reading.a7, "Maturity"],
  ];
  for (const [code, bank, r, name] of numeric) {
    if (!r) continue;
    const v = bank.values[String(r.value)];
    if (!v) continue;
    const m = meta(code);
    out.push({
      code,
      accent: BLOCK_COLOR[m.block],
      glyph: String(r.value),
      title: m.title,
      about: bank.intro || m.about,
      valueLabel: `${name} ${r.value} · ${v.heading}`,
      entries: [v],
    });
  }

  if (reading.a9) {
    const entries = [];
    if (reading.a9.lessons.length === 0) {
      if (bankA9.values.no_lessons) entries.push(bankA9.values.no_lessons);
    } else {
      for (const d of reading.a9.lessons) {
        const v = bankA9.values[`lesson_${d}`];
        if (v) entries.push({ ...v, glyph: String(d) });
      }
    }
    for (const d of reading.a9.passions) {
      const v = bankA9.values[`passion_${d}`];
      if (v) entries.push({ ...v, glyph: String(d) });
    }
    const m = meta("A9");
    out.push({
      code: "A9",
      accent: BLOCK_COLOR[m.block],
      glyph: reading.a9.lessons.length ? reading.a9.lessons.join(" ") : "✓",
      title: m.title,
      about: bankA9.intro || m.about,
      valueLabel:
        reading.a9.lessons.length === 0
          ? "The full set, no missing digits"
          : `Lessons ${reading.a9.lessons.join(", ")} · Passion ${reading.a9.passions.join(", ")}`,
      entries,
    });
  }

  if (reading.a10) {
    const entries = [];
    for (let c = 1; c <= 9; c++) {
      const v = bankA10.values[`${c}_${a10Bucket(reading.a10.cells[c])}`];
      if (v) {
        entries.push({
          ...v,
          glyph: reading.a10.cells[c] ? String(c).repeat(Math.min(reading.a10.cells[c], 4)) : `${c}: —`,
        });
      }
    }
    const m = meta("A10");
    out.push({
      code: "A10",
      kind: "matrix",
      accent: BLOCK_COLOR[m.block],
      title: m.title,
      about: bankA10.intro || m.about,
      cells: reading.a10.cells,
      entries,
    });
  }

  if (reading.a11) {
    const m = meta("A11");
    const entries = reading.a11.hasDebt
      ? reading.a11.debts
          .map((n) => bankA11.values[String(n)])
          .filter(Boolean)
      : [bankA11.values.none].filter(Boolean);
    out.push({
      code: "A11",
      accent: BLOCK_COLOR[m.block],
      glyph: reading.a11.hasDebt ? reading.a11.debts.join(" ") : "0",
      title: m.title,
      about: bankA11.intro || m.about,
      valueLabel: reading.a11.hasDebt
        ? `Karmic debt ${reading.a11.debts.join(", ")}`
        : "No karmic debt",
      entries,
    });
  }

  // ︎ — текстовый вариант символа знака (без него ♑ и т.п. рендерятся
  // цветным эмодзи и выбиваются из неонового стиля).
  const b1Glyph = reading.b1?.glyph ? reading.b1.glyph + "︎" : null;
  const singles = [
    ["B1", bankB1, reading.b1?.name, b1Glyph, `Sun in ${reading.b1?.name}`],
    ["C1", bankC1, reading.c1?.name, reading.c1?.glyph, reading.c1?.name],
    ["C2", bankC2, reading.c2?.name, reading.c2?.glyph, `${reading.c2?.name} element`],
    ["D1", bankD1, String(reading.d1?.num), reading.d1?.roman, null],
  ];
  for (const [code, bank, key, glyph, label] of singles) {
    const v = bank.values[key];
    if (!v) continue;
    const m = meta(code);
    out.push({
      code,
      accent: BLOCK_COLOR[m.block],
      glyph: glyph || key,
      title: m.title,
      about: bank.intro || m.about,
      valueLabel: label ? `${label} · ${v.heading}` : v.heading,
      entries: [v],
    });
  }
  return out;
}

// Финальный вердикт — ЕДИНАЯ резолюция для /reading и персонажа.
// Приоритет: (1) персональный ИИ-текст из ссылки (card.vd); (2) монолит по 3 пунктам
// A1×B1×A3 из verdict3.json (ключ «7-leo-3», банк наполняется офлайн, З-94);
// (3) запасной по числу пути (verdict.json). Пока банк-3 пуст (кроме пилота),
// почти всегда работает п.3. Возвращает { heading, paragraphs[], source, isAi }.
export function resolveVerdict({ card, reading }) {
  const sign = reading?.b1?.name ? String(reading.b1.name).toLowerCase() : null;
  const key3 =
    reading?.a1?.value != null && sign && reading?.a3?.value != null
      ? `${reading.a1.value}-${sign}-${reading.a3.value}`
      : null;
  const monolith = (key3 && verdict3Bank?.values?.[key3]) || null;
  const fallback = monolith || verdictBank.values[String(reading?.a1?.value)] || null;
  const vd = card?.vd;
  const paragraphs = vd
    ? String(vd).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
    : fallback
      ? fallback.paragraphs
      : [];
  return {
    heading: fallback ? fallback.heading : null,
    paragraphs,
    source: vd ? "ai" : monolith ? "trio" : fallback ? "path" : "none",
    isAi: !!vd,
  };
}
