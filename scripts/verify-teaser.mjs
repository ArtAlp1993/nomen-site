// Сверка браузерного расчёта тизера (lib/teaser.js) с эталоном Python-движка.
// Эталон готовит scratchpad/gen-cases.py (см. сессию), сюда передаётся путь к JSON.
import { readFileSync } from "node:fs";
import { calculateTeaser } from "../lib/teaser.js";

const casesPath = process.argv[2];
const cases = JSON.parse(readFileSync(casesPath, "utf8"));

let pass = 0;
const fails = [];
for (const { input, expected } of cases) {
  let actual;
  try {
    actual = calculateTeaser(input);
  } catch (e) {
    fails.push({ input, error: String(e) });
    continue;
  }
  if (JSON.stringify(actual) === JSON.stringify(expected)) {
    pass += 1;
  } else {
    fails.push({ input, expected, actual });
  }
}

console.log(`PASS ${pass}/${cases.length}`);
if (fails.length) {
  console.log("FIRST FAILS:");
  for (const f of fails.slice(0, 3)) {
    console.log(JSON.stringify(f, null, 1).slice(0, 1500));
  }
  process.exit(1);
}
