#!/usr/bin/env node
// NOMEN · Генератор банка «монолитных» вердиктов по 3 пунктам (З-94, компонент D З-45).
//
// Пишет data/readings/verdict3.json — цельный EN-вердикт на каждую комбинацию
// Life Path (A1) × Sun Sign (B1) × Expression (A3) = 12×12×12 = 1728. В рантайме
// сайт подставляет его по числам (VerdictSection), без ИИ и без ключей.
//
// ⚠️ Массовый прогон ОТЛОЖЕН (лимиты/бюджет ИИ) — см. задачник З-94. По умолчанию
// скрипт работает в DRY-RUN: печатает план и 2 примера промптов, НИЧЕГО не вызывает
// и не пишет. Реальная генерация — только с флагом --run и заданным ключом ИИ.
//
// Запуск:
//   node scripts/gen-verdicts3.mjs                 # dry-run (по умолчанию)
//   node scripts/gen-verdicts3.mjs --limit 3       # dry-run, показать 3 комбинации
//   node scripts/gen-verdicts3.mjs --run --provider gemini   # реальная генерация
//   node scripts/gen-verdicts3.mjs --run --provider claude --limit 10
//
// Ключи ИИ (при --run): GEMINI_API_KEY или ANTHROPIC_API_KEY в окружении.
// Идемпотентно: уже заполненные ключи в verdict3.json пропускаются (докидывает).

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = join(__dirname, "..", "data", "readings", "verdict3.json");

// ── Домены значений (совпадают с lib/teaser.js) ─────────────────────────────
const A_VALUES = [1, 2, 3, 4, 5, 6, 7, 8, 9, 11, 22, 33];
const SIGNS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];

// Короткие смысловые опоры для промпта (из tie­зер-слоя lib/teaser.js: LIFE_PATH_EN,
// EXPRESSION_EN, SUN_SIGN_EN). Держим здесь, чтобы скрипт был самодостаточным.
const LIFE_PATH = {
  1: "goes first, independent, a starter", 2: "connector, diplomat, reads the room",
  3: "expressive, creative, verbal", 4: "builder, disciplined, turns chaos into structure",
  5: "freedom, change, movement", 6: "responsible, holds others together, caretaker",
  7: "seeker, analytical, depth over comfort, needs solitude", 8: "power, scale, resources, results",
  9: "gives, finishes, lets go, sees past the personal", 11: "intuitive, senses before it's visible",
  22: "master builder, turns vision into reality", 33: "leads by example, rarest path",
};
const EXPRESSION = {
  1: "mission: lead and break new ground", 2: "mission: connect and mediate",
  3: "mission: express, create, communicate", 4: "mission: build lasting structure",
  5: "mission: explore and free others", 6: "mission: nurture and take responsibility",
  7: "mission: seek truth and teach it", 8: "mission: build and manage at scale",
  9: "mission: serve and uplift the whole", 11: "mission: inspire through vision",
  22: "mission: manifest something huge and real", 33: "mission: heal and teach by example",
};
const SUN = {
  aries: "Fire, cardinal — moves first", taurus: "Earth, fixed — builds for the long run",
  gemini: "Air, mutable — fast, curious mind", cancer: "Water, cardinal — protective, deep",
  leo: "Fire, fixed — born to be seen, leads from the front", virgo: "Earth, mutable — precise, fixes what others miss",
  libra: "Air, cardinal — balance and connection by instinct", scorpio: "Water, fixed — goes to the bottom of things",
  sagittarius: "Fire, mutable — chases meaning", capricorn: "Earth, cardinal — status and discipline as purpose",
  aquarius: "Air, fixed — thinks in futures", pisces: "Water, mutable — feels what words can't say",
};

// ── Промпт для одной комбинации ─────────────────────────────────────────────
function buildPrompt(a1, sign, a3) {
  return [
    "You are NOMEN, writing the final VERDICT of a personal reading. Voice: sharp, warm,",
    "specific, second person (\"you\"), English, no mysticism-cliché, no numerology jargon.",
    "Weave THREE traits into ONE cohesive verdict (not a list): find the real tension or",
    "synergy between them and resolve it. 3 short paragraphs, ~60-90 words each.",
    "",
    `- Life Path ${a1}: ${LIFE_PATH[a1]}`,
    `- Sun in ${sign[0].toUpperCase() + sign.slice(1)}: ${SUN[sign]}`,
    `- Expression ${a3}: ${EXPRESSION[a3]}`,
    "",
    "Return JSON only: {\"heading\": \"<3-4 word title>\", \"paragraphs\": [\"...\",\"...\",\"...\"]}",
  ].join("\n");
}

// ── Вызов ИИ (при --run). Заглушка-каркас под два провайдера. ────────────────
async function callAI(prompt, provider) {
  if (provider === "gemini") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) throw new Error("GEMINI_API_KEY не задан");
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${key}`;
    const res = await fetch(url, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
    });
    const j = await res.json();
    return j?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  }
  if (provider === "claude") {
    const key = process.env.ANTHROPIC_API_KEY;
    if (!key) throw new Error("ANTHROPIC_API_KEY не задан");
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": key,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-5", max_tokens: 700,
        messages: [{ role: "user", content: prompt }],
      }),
    });
    const j = await res.json();
    return j?.content?.[0]?.text || "";
  }
  throw new Error(`Неизвестный провайдер: ${provider}`);
}

function parseVerdict(raw) {
  const m = raw.match(/\{[\s\S]*\}/);
  if (!m) throw new Error("ИИ не вернул JSON");
  const obj = JSON.parse(m[0]);
  if (!obj.heading || !Array.isArray(obj.paragraphs)) throw new Error("Плохая форма вердикта");
  return { heading: String(obj.heading), paragraphs: obj.paragraphs.map(String) };
}

// ── main ────────────────────────────────────────────────────────────────────
async function main() {
  const args = process.argv.slice(2);
  const run = args.includes("--run");
  const pIdx = args.indexOf("--provider");
  const provider = pIdx >= 0 ? args[pIdx + 1] : "gemini";
  const limitIdx = args.indexOf("--limit");
  const limit = limitIdx >= 0 ? Number(args[limitIdx + 1]) : Infinity;

  const bank = JSON.parse(readFileSync(OUT, "utf8"));
  bank.values = bank.values || {};

  // Полный перебор ключей
  const keys = [];
  for (const a1 of A_VALUES) for (const sign of SIGNS) for (const a3 of A_VALUES) {
    keys.push([`${a1}-${sign}-${a3}`, a1, sign, a3]);
  }
  const todo = keys.filter(([k]) => !bank.values[k]);
  const total = keys.length;

  console.log(`verdict3: всего комбинаций ${total}, заполнено ${total - todo.length}, осталось ${todo.length}`);

  if (!run) {
    console.log("\n[DRY-RUN] генерация не запускалась (нет флага --run). Примеры:");
    for (const [k, a1, sign, a3] of todo.slice(0, Math.min(2, limit))) {
      console.log(`\n── key ${k} ──\n${buildPrompt(a1, sign, a3)}`);
    }
    console.log(`\nЗапуск реальной генерации: node scripts/gen-verdicts3.mjs --run --provider ${provider} [--limit N]`);
    return;
  }

  let done = 0;
  for (const [k, a1, sign, a3] of todo) {
    if (done >= limit) break;
    try {
      const raw = await callAI(buildPrompt(a1, sign, a3), provider);
      bank.values[k] = parseVerdict(raw);
      writeFileSync(OUT, JSON.stringify(bank, null, 2) + "\n");
      done++;
      console.log(`✓ ${k} (${done})`);
    } catch (e) {
      console.error(`✗ ${k}: ${e.message}`);
    }
  }
  console.log(`Готово: сгенерировано ${done}.`);
}

main().catch((e) => { console.error(e); process.exit(1); });
