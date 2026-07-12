// ЧЕК-ЛИСТ КАРТИНОК ПЕРСОНАЖА + ПРОМПТЫ (Фаза 2 nano banana, drop-in).
// Читает data/points-catalog.json (символы вариантов + кадры S тела) и печатает
// data/persona-assets.json: перечень КАЖДОГО нужного файла с {path, kind, present,
// symbol, prompt}. `present` = лежит ли файл на диске (рантайм подхватывает авто-
// детектом Image().onload — этот файл ТОЛЬКО производственный чек-лист/банк промптов).
// Артём читает prompt, генерит на nano banana, кладёт PNG по path — без правок кода.
// Промпт-канон символа (З-102, первый проход): для зодиака/животного/стихии/таро —
// известный глиф+имя; для чисел — нумерологический архетип (heading варианта); для
// уроков/квадрата/долга — смысловой предмет. Запуск: node scripts/gen-persona-assets.mjs
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const DATA = path.join(ROOT, "data");
const PUBLIC = path.join(ROOT, "public");
const catalog = JSON.parse(fs.readFileSync(path.join(DATA, "points-catalog.json"), "utf8"));

const exists = (rel) => fs.existsSync(path.join(PUBLIC, rel));

// Единый визуальный стиль (шапка каждого промпта) — держим один язык образа.
const STYLE =
  "NOMEN style: luminous nebula-energy being on near-black cosmic background (#05040f), " +
  "soft volumetric glow, fine particle filaments, neon indigo/turquoise palette, " +
  "no text, no letters, centered, symmetrical, high detail, painterly-sci-fi.";

// Кадры тела S1..S13 — словесное изменение из каталога → мотив роста от базы N1.
const FRAME_MOTIF = {
  "compass-rose": "a glowing compass-rose forming at the core (sense of direction, life path)",
  gift: "a small radiant gift/seed of light cradled at the chest (innate talent)",
  star: "an emitting star opening outward from the sternum (expression, mission)",
  heart: "a deep inner heart-glow pulsing from within (soul's desire)",
  outline: "a crisp luminous outline/aura sharpening around the silhouette (persona, facade)",
  tree: "branching tree-like light structures maturing through the body (maturity)",
  book: "open pages of light unfolding beside the figure (lessons, hidden passion)",
  grid: "a 3x3 lattice of light nodes overlaid on the torso (Pythagorean square)",
  chain: "faint broken/looping light-chains dissolving (karmic debt released)",
  sun: "a solar corona igniting behind the head (sun sign, core will)",
  paw: "an animal-spirit silhouette merging with the aura (Chinese zodiac temperament)",
  element: "the aura tinted by an elemental hue and flow (year element)",
  "crown-open": "an open crown of arcana-light rising, hands opening outward (tarot fate, the reveal)",
};

function iconSubject(v, variantType) {
  const label = v.label || v.key;
  switch (variantType) {
    case "number":
      return `an emblem/sigil for the numerological archetype "${label}" (life number ${v.key}) — an abstract symbolic mark evoking its meaning, not the printed digit`;
    case "zodiac":
      return `the zodiac sign ${label} (glyph ${v.symbol}) as a glowing celestial sigil`;
    case "animal":
      return `the Chinese zodiac ${label} (${v.symbol}) as a luminous spirit-emblem`;
    case "element":
      return `the Chinese element ${label} (${v.symbol}) as an elemental sigil${v.color ? `, tinted ${v.color}` : ""}`;
    case "tarot":
      return `the Tarot Major Arcana "${label}" (${v.symbol}) as a mystical arcana sigil`;
    case "debt":
      return v.key === "none"
        ? "a single clean unbroken circle of light (no karmic debt)"
        : `a broken/looping chain-sigil for karmic debt number ${v.key}`;
    case "lessons": {
      const [type, n] = String(v.key).split("_");
      if (v.key === "no_lessons") return "a complete radiant nine-pointed mandala (a full set, no gaps)";
      return type === "passion"
        ? `a bright driving sigil for hidden passion of ${n}`
        : `a subtle developing sigil for the karmic lesson of ${n}`;
    }
    case "grid": {
      const [n, fill] = String(v.key).split("_");
      const strength = fill === "many" ? "strongly lit" : fill === "some" ? "softly lit" : "dim/empty";
      return `Pythagorean-square cell ${n}, ${strength} — a single node-glyph of that trait`;
    }
    default:
      return `a symbolic sigil for "${label}"`;
  }
}

const frames = [];
const icons = [];

for (const p of catalog.points) {
  // Кадр тела S (пунктовый). s0 = база N1 (есть всегда). Порядок цепочки: от N1/предыдущего.
  const rel = `persona/frames/${p.bodyFrame}.jpg`;
  const kStep = p.bodyFrame; // s1..s13
  frames.push({
    code: p.code,
    frame: kStep,
    path: `public/${rel}`,
    kind: "body-frame",
    present: exists(rel),
    change: p.bodyChange,
    prompt:
      `${STYLE}\n[КАДР ${kStep.toUpperCase()} для пункта ${p.code} · ${p.title}] ` +
      `Прикрепить: базу N1 (нейбула-человек) и предыдущий кадр. ` +
      `EN: Same being, same identity/pose/framing as the base — evolve it one step: ${FRAME_MOTIF[p.bodyChange] || p.bodyChange}. ` +
      `KEEP: identity, silhouette, camera, palette, background. CHANGE: only add the described growth so the figure looks one step more "complete".`,
  });

  // Иконки вариантов (символ клиента прилетает к телу).
  for (const v of p.variants) {
    const irel = `persona/icons/${p.code.toLowerCase()}/${v.key}.png`;
    icons.push({
      code: p.code,
      variant: v.key,
      path: `public/${irel}`,
      kind: "variant-icon",
      present: exists(irel),
      symbol: v.symbol,        // канон-глиф/заглушка (текущий якорь символа)
      label: v.label,
      variantType: p.variantType,
      prompt:
        `${STYLE}\n[ИКОНКА пункт ${p.code} · вариант "${v.key}"] ` +
        `Transparent background PNG, single centered emblem, ~512px, glowing neon line-sigil. ` +
        `EN: ${iconSubject(v, p.variantType)}.`,
    });
  }
}

const framesPresent = frames.filter((f) => f.present).length;
const iconsPresent = icons.filter((i) => i.present).length;

const out = {
  _meta: {
    generated_by: "scripts/gen-persona-assets.mjs",
    note:
      "Производственный чек-лист картинок персонажа + промпты (nano banana). Рантайм НЕ читает этот файл — " +
      "он авто-детектит ассеты по Image().onload; здесь список того, ЧТО сгенерить и КУДА положить.",
    style: STYLE,
    frames_total: frames.length,
    frames_present: framesPresent,
    icons_total: icons.length,
    icons_present: iconsPresent,
    todo: frames.length + icons.length - framesPresent - iconsPresent,
  },
  frames,
  icons,
};

fs.writeFileSync(path.join(DATA, "persona-assets.json"), JSON.stringify(out, null, 2) + "\n");
console.log(
  `persona-assets.json: кадры ${framesPresent}/${frames.length}, иконки ${iconsPresent}/${icons.length}, ` +
  `осталось сгенерить ${out._meta.todo}`
);
