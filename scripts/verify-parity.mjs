// Сходимость ПЕРСОНАЖ == /reading (единый источник текста lib/buildReading).
// Две проверки:
//  1) СТРУКТУРА: и /reading, и продукт-персонаж строят пункты из ОДНОГО модуля
//     (buildSections), вердикт — из resolveVerdict; ни у кого нет своей копии.
//     Это механически гарантирует «точь-в-точь» — текст берётся из одного места.
//  2) ДАННЫЕ: для набора кейсов каждый из 13 пунктов резолвится в банк и несёт
//     ПОЛНЫЙ текст (не урезанный blurb), а вердикт всегда собирается.
// Запуск: node scripts/verify-parity.mjs
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { calculateReading, a10Bucket } from "../lib/teaser.js";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..");
const readJSON = (p) => JSON.parse(readFileSync(join(root, p), "utf8"));
const readTxt = (p) => readFileSync(join(root, p), "utf8");

let failed = 0;
const check = (label, ok) => {
  console.log(`${ok ? "ok  " : "FAIL"} · ${label}`);
  if (!ok) failed += 1;
};

// ── 1) СТРУКТУРА: единый источник ─────────────────────────────
const rp = readTxt("components/reading/ReadingPage.js");
const ps = readTxt("components/persona/PersonaScene.js");
const rs = readTxt("components/reading/ReadingSections.js");
const importsBuild = (src) =>
  /import\s*\{[^}]*\bbuildSections\b[^}]*\}\s*from\s*["']@\/lib\/buildReading["']/.test(src);

console.log("— структура (единый источник) —");
check("ReadingPage импортирует buildSections из @/lib/buildReading", importsBuild(rp));
check("PersonaScene импортирует buildSections из @/lib/buildReading", importsBuild(ps));
check("ReadingPage не содержит своей копии buildSections", !/function\s+buildSections/.test(rp));
check("PersonaScene не содержит своей копии buildSections", !/function\s+buildSections/.test(ps));
check("VerdictSection использует resolveVerdict", /resolveVerdict\(/.test(rs));
check("PersonaScene показывает текст секции (SectionText)", /<SectionText\b/.test(ps));
check("PersonaScene резолвит вердикт из единого источника", /resolveVerdict\(/.test(ps));

// ── 2) ДАННЫЕ: каждый пункт → полный текст банка ──────────────
const BANK = { A1: "a1", A2: "a2", A3: "a3", A4: "a4", A5: "a5", A7: "a7", A9: "a9", A10: "a10", A11: "a11", B1: "b1", C1: "c1", C2: "c2", D1: "d1" };
const bank = Object.fromEntries(Object.entries(BANK).map(([c, f]) => [c, readJSON(`data/readings/${f}.json`)]));
const verdictBank = readJSON("data/readings/verdict.json");

const fullText = (v) =>
  !!v && Array.isArray(v.paragraphs) && v.paragraphs.length >= 1 &&
  v.paragraphs.every((p) => typeof p === "string" && p.trim().length > 20);

const cases = readJSON("scripts/fixtures/reading-cases.json").map((c) => c.input);

console.log(`— данные (${cases.length} кейсов, полный текст всех 13 пунктов) —`);
let pass = 0;
const fails = [];
for (const input of cases) {
  const r = calculateReading(input);
  const problems = [];

  // A1,A2,A3,A4,A5,A7 — числовые: полный текст (в банке по 2 абзаца, не blurb).
  for (const [code, key] of [["A1", "a1"], ["A2", "a2"], ["A3", "a3"], ["A4", "a4"], ["A5", "a5"], ["A7", "a7"]]) {
    const v = bank[code].values[String(r[key]?.value)];
    if (!fullText(v)) problems.push(`${code} нет полного текста (value=${r[key]?.value})`);
    else if (v.paragraphs.length < 2) problems.push(`${code} текст урезан (1 абзац)`);
  }
  // Одиночные B1/C1/C2/D1 — ключи как в buildSections.
  const singles = [["B1", r.b1?.name], ["C1", r.c1?.name], ["C2", r.c2?.name], ["D1", String(r.d1?.num)]];
  for (const [code, k] of singles) {
    if (!fullText(bank[code].values[k])) problems.push(`${code} нет полного текста (key=${k})`);
  }
  // A9 — уроки/страсть.
  if (r.a9) {
    const need = r.a9.lessons.length ? r.a9.lessons.map((d) => `lesson_${d}`) : ["no_lessons"];
    for (const kk of [...need, ...r.a9.passions.map((d) => `passion_${d}`)]) {
      if (!fullText(bank.A9.values[kk])) problems.push(`A9 нет текста (${kk})`);
    }
  }
  // A10 — 9 ячеек квадрата.
  if (r.a10) {
    for (let c = 1; c <= 9; c++) {
      const kk = `${c}_${a10Bucket(r.a10.cells[c])}`;
      if (!fullText(bank.A10.values[kk])) problems.push(`A10 нет текста (${kk})`);
    }
  }
  // A11 — долги / нет.
  if (r.a11) {
    const need = r.a11.hasDebt ? r.a11.debts.map(String) : ["none"];
    for (const kk of need) if (!fullText(bank.A11.values[kk])) problems.push(`A11 нет текста (${kk})`);
  }
  // Вердикт — запасной по числу пути всегда есть.
  if (!fullText(verdictBank.values[String(r.a1?.value)])) problems.push(`Вердикт не собрался (A1=${r.a1?.value})`);

  if (!problems.length) pass += 1;
  else fails.push({ input, problems });
}

check(`данные: ${pass}/${cases.length} кейсов с полным текстом всех пунктов`, pass === cases.length);
for (const f of fails.slice(0, 5)) console.log("   ", JSON.stringify(f).slice(0, 400));

console.log(failed ? `\nПРОВАЛ: ${failed} проверок` : "\nВсё сошлось: персонаж и /reading — один источник текста");
process.exit(failed ? 1 : 0);
