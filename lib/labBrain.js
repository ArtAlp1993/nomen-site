// Мозг чата лаборатории: понимает команды про шарик.
// Два режима: локальные правила (без сети, всегда работают) и настоящий
// Claude (когда Артём вставил свой API-ключ) — тот умеет и картинки-референсы.

import { DEFAULT_CONFIG } from "@/components/BlueprintScene";
import { PRESETS, clampPatch, formulaPromptRu } from "./ballFormula";

// ── Локальный разбор русских команд (rule-based) ────────────────────

const COLOR_WORDS = {
  "красн": ["#ff2b2b", "#ff5714", "#ff8a5c", "#d90429", "#ffd9c0"],
  "оранж": ["#ff6d00", "#ff9e00", "#ffb700", "#e85d04", "#ffe8c2"],
  "жёлт": ["#ffd500", "#ffea00", "#ffc300", "#e6b800", "#fff8cc"],
  "желт": ["#ffd500", "#ffea00", "#ffc300", "#e6b800", "#fff8cc"],
  "зелён": ["#00c853", "#2bff88", "#00e676", "#1b998b", "#d7ffe0"],
  "зелен": ["#00c853", "#2bff88", "#00e676", "#1b998b", "#d7ffe0"],
  "голуб": ["#00b4d8", "#48cae4", "#90e0ef", "#0096c7", "#e0fbff"],
  "син": ["#2b3bff", "#4a3df0", "#2b6bff", "#1d3557", "#dbe4ff"],
  "фиолет": ["#6c4ff6", "#8338ec", "#b967ff", "#5a189a", "#f0e6ff"],
  "розов": ["#ff5da2", "#ff7bdb", "#ff9ecd", "#f72585", "#ffe3f1"],
  "бирюз": ["#33e6e0", "#0ad3ce", "#7ff7ff", "#2ec4b6", "#e0fffd"],
  "бел": ["#e8ecf5", "#f5f3ff", "#dfe7ff", "#cfd8ea", "#ffffff"],
};

// Шаг изменения на «чуть-чуть» для каждого типа команды.
const nudge = (v, delta, min, max) =>
  Math.round(Math.min(max, Math.max(min, v + delta)) * 1000) / 1000;

export function applyLocalCommand(text, cfg) {
  const t = (text || "").toLowerCase();
  const has = (...words) => words.some((w) => t.includes(w));
  let patch = {};
  let reply = "";

  // Пресеты и сброс
  for (const [name, preset] of Object.entries(PRESETS)) {
    if (t.includes(name)) {
      return { patch: { ...preset }, reply: `Готово — пресет «${name}».` };
    }
  }
  if (has("сброс", "исходн", "заново", "верни как было", "по умолчанию")) {
    return { patch: { ...DEFAULT_CONFIG }, reply: "Вернул исходный вид." };
  }

  // Цвета
  for (const [word, colors] of Object.entries(COLOR_WORDS)) {
    if (t.includes(word)) {
      patch.colors = colors;
      reply = "Перекрасил.";
    }
  }

  // Движение
  if (has("стоп", "останови", "не крути")) {
    patch.rotSpeed = 0;
    reply = "Остановил вращение.";
  } else if (has("обратн", "в другую сторону", "наоборот")) {
    patch.rotSpeed = -(cfg.rotSpeed || 0.05) || -0.05;
    reply = "Кручу в обратную сторону.";
  } else if (has("быстрее", "разгони", "шустрее")) {
    patch.rotSpeed = nudge(cfg.rotSpeed, cfg.rotSpeed >= 0 ? 0.08 : -0.08, -0.6, 0.6);
    reply = "Ускорил.";
  } else if (has("медленн", "плавнее", "тише")) {
    patch.rotSpeed = Math.round(cfg.rotSpeed * 0.5 * 1000) / 1000;
    reply = "Замедлил.";
  }
  if (has("дыши", "дыхание", "пульсируй")) {
    patch.breathe = nudge(cfg.breathe, 0.03, 0, 0.15);
    reply = "Дышит сильнее.";
  }

  // Размер и лепка
  if (has("больше", "крупнее", "увеличь")) {
    patch.zoom = nudge(cfg.zoom, 0.25, 0.3, 2.5);
    reply = "Увеличил.";
  } else if (has("меньше", "мельче", "уменьши")) {
    patch.zoom = nudge(cfg.zoom, -0.25, 0.3, 2.5);
    reply = "Уменьшил.";
  }
  if (has("длинн", "растяни", "вытяни")) {
    patch.scaleX = nudge(cfg.scaleX, 0.4, 0.2, 3);
    reply = "Растянул в длину.";
  }
  if (has("шире", "выше")) {
    patch.scaleY = nudge(cfg.scaleY, 0.4, 0.2, 3);
    reply = "Растянул в ширину.";
  }
  if (has("площе", "сплющи", "плоск")) {
    patch.scaleY = nudge(cfg.scaleY, -0.4, 0.2, 3);
    patch.depth = nudge(cfg.depth, -0.5, 0, 3);
    reply = "Сплющил.";
  }
  if (has("глубже", "объёмн", "объемн")) {
    patch.depth = nudge(cfg.depth, 0.5, 0, 3);
    reply = "Добавил объёма.";
  }

  // Свет
  if (has("ярче", "свети", "неон")) {
    patch.bloom = nudge(cfg.bloom, 0.4, 0, 3);
    patch.opacity = nudge(cfg.opacity, 0.08, 0.1, 1);
    reply = "Ярче.";
  } else if (has("тусклее", "приглуши", "темнее")) {
    patch.bloom = nudge(cfg.bloom, -0.4, 0, 3);
    patch.opacity = nudge(cfg.opacity, -0.08, 0.1, 1);
    reply = "Приглушил.";
  }

  // Форма
  if (has("гуще", "плотнее", "больше волокон", "больше нитей")) {
    patch.fibers = nudge(cfg.fibers, 600, 100, 3000);
    reply = "Гуще.";
  } else if (has("реже", "меньше волокон", "меньше нитей", "воздушнее")) {
    patch.fibers = nudge(cfg.fibers, -600, 100, 3000);
    reply = "Реже.";
  }
  if (has("закрути", "спираль", "заверни")) {
    patch.twist = nudge(cfg.twist, 1.5, 0, 6);
    reply = "Закрутил.";
  }
  if (has("зрачок больше", "центр больше")) {
    patch.pupil = nudge(cfg.pupil, 0.25, 0.05, 1.6);
    reply = "Зрачок больше.";
  } else if (has("зрачок меньше", "центр меньше")) {
    patch.pupil = nudge(cfg.pupil, -0.25, 0.05, 1.6);
    reply = "Зрачок меньше.";
  }

  if (!Object.keys(patch).length) {
    return {
      patch: null,
      reply:
        "Не разобрал. Попробуй: «огонь», «красный», «быстрее», «стоп», «больше», «сплющи», «ярче», «гуще», «сброс». Или вставь API-ключ (⚙) — тогда пойму любую фразу и картинки.",
    };
  }
  return { patch: clampPatch(patch), reply };
}

// ── Настоящий Claude (нужен API-ключ Артёма) ────────────────────────

// Схема structured output: патч (все поля опциональны) + короткий ответ.
function patchSchema() {
  const num = { type: "number" };
  return {
    type: "object",
    properties: {
      patch: {
        type: "object",
        properties: {
          fibers: num, pupil: num, spread: num, spreadVar: num, twist: num,
          depth: num, scaleX: num, scaleY: num, scaleZ: num, zoom: num,
          rotSpeed: num, breathe: num, tilt: num, opacity: num, tipSize: num,
          bloom: num,
          colors: { type: "array", items: { type: "string" } },
        },
        additionalProperties: false,
      },
      reply: { type: "string" },
    },
    required: ["patch", "reply"],
    additionalProperties: false,
  };
}

export async function askClaude({ text, imageBase64, imageMediaType, cfg, apiKey }) {
  try {
    const { default: Anthropic } = await import("@anthropic-ai/sdk");
    const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true });

    const content = [];
    if (imageBase64) {
      content.push({
        type: "image",
        source: {
          type: "base64",
          media_type: imageMediaType || "image/png",
          data: imageBase64,
        },
      });
    }
    content.push({
      type: "text",
      text: text || "Собери пресет шарика по этой картинке-референсу.",
    });

    const response = await client.messages.create({
      model: "claude-opus-4-8",
      max_tokens: 2048,
      system: formulaPromptRu(cfg),
      messages: [{ role: "user", content }],
      output_config: { format: { type: "json_schema", schema: patchSchema() } },
    });

    const textBlock = response.content.find((b) => b.type === "text");
    const parsed = JSON.parse(textBlock?.text || "{}");
    return {
      patch: clampPatch(parsed.patch || {}),
      reply: parsed.reply || "Готово.",
    };
  } catch (e) {
    const msg = String(e?.message || e);
    if (/401|auth/i.test(msg)) {
      return { patch: null, reply: "Ключ не подошёл (401). Проверь его в ⚙." };
    }
    return {
      patch: null,
      reply: "Не смог связаться с Claude: " + msg.slice(0, 120),
    };
  }
}
