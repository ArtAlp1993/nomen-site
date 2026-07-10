// Сверка полного расчёта (lib/teaser.js calculateReading) с эталоном
// Python-движка. Эталон готовит scratchpad/gen-reading-cases.py,
// сюда передаётся путь к JSON: node scripts/verify-reading.mjs cases.json
import { readFileSync } from "node:fs";
import { calculateReading } from "../lib/teaser.js";

const casesPath = process.argv[2];
const cases = JSON.parse(readFileSync(casesPath, "utf8"));

const eq = (a, b) => JSON.stringify(a) === JSON.stringify(b);

let pass = 0;
const fails = [];
for (const { input, expected: e } of cases) {
  let r;
  try {
    r = calculateReading(input);
  } catch (err) {
    fails.push({ input, error: String(err) });
    continue;
  }
  const diffs = [];
  const check = (key, actual, exp) => {
    if (!eq(actual, exp)) diffs.push({ key, actual, exp });
  };
  check("a1", r.a1?.value, e.a1);
  check("a2", r.a2?.value, e.a2);
  check("a3", r.a3?.value, e.a3);
  check("a4", r.a4?.value, e.a4);
  check("a5", r.a5?.value, e.a5);
  check("a7", r.a7?.value, e.a7);
  check("a9_lessons", r.a9?.lessons, e.a9_lessons);
  check("a9_passions", r.a9?.passions, e.a9_passions);
  check("a9_counts", r.a9?.counts, Object.fromEntries(Object.entries(e.a9_counts).map(([k, v]) => [k, v])));
  check("a10_working", r.a10?.working, e.a10_working);
  check("a10_cells", r.a10?.cells, e.a10_cells);
  check("a11_has_debt", r.a11?.hasDebt, e.a11_has_debt);
  check("a11_debts", r.a11?.debts, e.a11_debts);
  check("b1", r.b1?.key, e.b1);
  check("c1", r.c1?.key, e.c1);
  check("c2", r.c2?.key, e.c2);
  check("d1", r.d1?.num, e.d1);

  if (!diffs.length) pass += 1;
  else fails.push({ input, diffs });
}

console.log(`PASS ${pass}/${cases.length}`);
if (fails.length) {
  console.log("FIRST FAILS:");
  for (const f of fails.slice(0, 5)) console.log(JSON.stringify(f).slice(0, 800));
  process.exit(1);
}
