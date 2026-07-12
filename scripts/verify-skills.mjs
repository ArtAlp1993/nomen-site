// Проверка движка «растущего персонажа» (lib/characterSkills.js, З-22).
// Гоняем без браузера: детерминизм + валидные диапазоны + выраженность роста
// + различие персонажей у разных клиентов. Запуск: node scripts/verify-skills.mjs
import { calculateReading } from "../lib/teaser.js";
import { composeCharacter, SKILL_TRAITS } from "../lib/characterSkills.js";
import { FORMULA } from "../lib/ballFormula.js";

// Пределы параметров из формулы (единый источник, свод 4.3).
const LIMITS = {};
for (const items of Object.values(FORMULA))
  for (const [key, , min, max] of items) LIMITS[key] = { min, max };

const HEX = /^#[0-9a-f]{6}$/i;
const isHex = (c) => typeof c === "string" && HEX.test(c);

// Набор разнообразных клиентов (имя, дата, пол).
const CASES = [
  { name: "James Steven", date: "1988-03-21", gender: "m" },
  { name: "Emma Woods", date: "1995-11-02", gender: "f" },
  { name: "Chen Wei", date: "1972-07-19", gender: "m" },
  { name: "Sofia Ramirez", date: "2001-12-30", gender: "f" },
  { name: "Alexander Ford", date: "1966-01-13", gender: "m" }, // 13 — кармдолг
  { name: "No Name", date: "1990-05-05", gender: "n" },
];

let fails = 0;
const fail = (msg) => { console.log("  FAIL:", msg); fails++; };

// Расстояние между двумя конфигами (нормированное по диапазонам) — грубая мера
// «насколько персонаж другой».
function configDistance(a, b) {
  let sum = 0, n = 0;
  for (const [k, lim] of Object.entries(LIMITS)) {
    if (typeof a[k] !== "number" || typeof b[k] !== "number") continue;
    const span = lim.max - lim.min || 1;
    sum += Math.abs(a[k] - b[k]) / span;
    n++;
  }
  return sum / n;
}

for (const c of CASES) {
  const reading = calculateReading({ name: c.name, date: c.date });

  // 1. Детерминизм: два вызова = байт-в-байт одинаково.
  const f1 = composeCharacter(reading, c.gender, 1);
  const f2 = composeCharacter(reading, c.gender, 1);
  if (JSON.stringify(f1) !== JSON.stringify(f2)) fail(`${c.name}: не детерминирован`);

  // 2. Диапазоны всех числовых ручек.
  for (const [k, lim] of Object.entries(LIMITS)) {
    const v = f1[k];
    if (typeof v !== "number" || !isFinite(v)) fail(`${c.name}: ${k} не число (${v})`);
    else if (v < lim.min - 1e-6 || v > lim.max + 1e-6)
      fail(`${c.name}: ${k}=${v} вне [${lim.min}, ${lim.max}]`);
  }

  // 3. Палитра: ровно 5 валидных hex.
  if (!Array.isArray(f1.colors) || f1.colors.length !== 5 || !f1.colors.every(isHex))
    fail(`${c.name}: colors невалидны: ${JSON.stringify(f1.colors)}`);

  // 4. Рост выражен: финал заметно отличается от зародыша (p=0).
  const seed = composeCharacter(reading, c.gender, 0);
  const dist = configDistance(seed, f1);
  if (dist < 0.12) fail(`${c.name}: рост слабый (dist=${dist.toFixed(3)})`);

  // 5. Монотонность старта: p=0 мельче/тусклее финала (zoom и opacity растут).
  if (seed.zoom > f1.zoom + 1e-6) fail(`${c.name}: зародыш не мельче по zoom`);

  console.log(`OK ${c.name} (${c.gender}): рост dist=${dist.toFixed(3)}, fibers ${Math.round(seed.fibers)}→${Math.round(f1.fibers)}, zoom ${seed.zoom.toFixed(2)}→${f1.zoom.toFixed(2)}`);
}

// 6. Разные клиенты → разные персонажи (попарные расстояния > 0).
const finals = CASES.map((c) =>
  composeCharacter(calculateReading({ name: c.name, date: c.date }), c.gender, 1)
);
let minPair = Infinity;
for (let i = 0; i < finals.length; i++)
  for (let j = i + 1; j < finals.length; j++)
    minPair = Math.min(minPair, configDistance(finals[i], finals[j]));
if (minPair < 0.02) fail(`клиенты слишком похожи (minPair=${minPair.toFixed(3)})`);
console.log(`\nмин. различие между клиентами: ${minPair.toFixed(3)}`);
console.log(`черт в движке: ${SKILL_TRAITS.length}`);

console.log(fails ? `\n❌ FAILS: ${fails}` : "\n✅ ВСЁ ЧИСТО");
process.exit(fails ? 1 : 0);
