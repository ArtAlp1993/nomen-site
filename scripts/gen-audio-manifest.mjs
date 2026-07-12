// C0.1 (план фазы C): хэш-манифест «текст → аудио» для озвучки /reading.
// Единица озвучки = intro пункта или один вариант значения (heading + абзацы).
// Правка текста в data/readings/*.json меняет хэш → старое аудио инвалидно
// (имя аудио-файла будет включать этот хэш, рассинхрон невозможен структурно).
// Запуск: node scripts/gen-audio-manifest.mjs  → пишет data/audio-manifest.json
// и печатает статистику объёма (для оценки лимитов TTS).

import { createHash } from "node:crypto";
import { readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dir = join(root, "data", "readings");

// verdict3 — динамический банк (генерится ИИ, З-94), в озвучку не входит.
const SKIP = new Set(["verdict3.json"]);

const hash = (text) => createHash("sha256").update(text, "utf8").digest("hex").slice(0, 12);

const entries = {};
let totalChars = 0;

for (const file of readdirSync(dir).sort()) {
  if (!file.endsWith(".json") || SKIP.has(file)) continue;
  const bank = JSON.parse(readFileSync(join(dir, file), "utf8"));
  const point = file.replace(".json", "");

  const add = (key, text) => {
    const clean = text.trim();
    if (!clean) return;
    entries[`${point}/${key}`] = { hash: hash(clean), chars: clean.length };
    totalChars += clean.length;
  };

  if (bank.intro) add("intro", bank.intro);
  for (const [key, v] of Object.entries(bank.values || {})) {
    add(key, [v.heading, ...(v.paragraphs || [])].filter(Boolean).join("\n"));
  }
}

const manifest = {
  comment:
    "Автогенерация: node scripts/gen-audio-manifest.mjs. Ключ = пункт/вариант, " +
    "hash = sha256(текста) — имя аудио-файла обязано включать этот hash.",
  entries,
};

writeFileSync(join(root, "data", "audio-manifest.json"), JSON.stringify(manifest, null, 1));

const n = Object.keys(entries).length;
console.log(`entries: ${n}`);
console.log(`total chars: ${totalChars}`);
console.log(`avg chars: ${Math.round(totalChars / n)}`);
