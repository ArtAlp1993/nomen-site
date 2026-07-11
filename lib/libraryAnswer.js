// Ответы «доказательной библиотеки» (задача Z-25): на вопрос «как посчитан
// пункт» и на спор клиента с трактовкой («вы говорите так, а это не так») чат
// отвечает, опираясь на источники из data/library.json — автор, книга,
// (страница, когда сверена) и наш общий вердикт. Без бэкенда: индекс статичен.
//
// Функция libraryAnswer(text[, context]) → { answer, cta? } | null.
// Возвращает не-null ТОЛЬКО когда в вопросе распознан конкретный пункт и намерение
// (как посчитано / спор). Иначе null — и ChatWidget идёт дальше по chat-kb/FAQ.

import library from "@/data/library.json";

// Слова-зацепки для каждого пункта. Порядок массива = приоритет: более
// специфичные фразы проверяем раньше общих (karmic debt раньше karmic).
const POINT_HINTS = [
  ["A11", ["karmic debt"]],
  ["A9", ["karmic lesson", "hidden passion", "karmic lessons"]],
  ["A10", ["pythagorean square", "psychomatrix", "magic square"]],
  ["A1", ["life path", "lifepath", "life-path"]],
  ["A2", ["birthday number", "birth day number"]],
  ["A3", ["expression number", "destiny number"]],
  ["A4", ["soul urge", "heart's desire", "hearts desire", "soul number"]],
  ["A5", ["personality number"]],
  ["A7", ["maturity number", "maturity"]],
  ["B1", ["sun sign", "zodiac sign", "star sign", "sun-sign"]],
  ["C1", ["chinese zodiac", "zodiac animal", "chinese animal", "animal sign"]],
  ["C2", ["year element", "chinese element"]],
  ["D1", ["tarot", "birth card", "arcana", "arcanum"]],
];

// Намерение «как это посчитано / на чём основано».
const METHOD_MARKERS = [
  "how is", "how do you", "how did you", "how was", "how are",
  "calculat", "work out", "worked out", "derive", "comput",
  "on what basis", "the source", "which source", "what source", "sources for",
  "where does", "where do", "based on", "why is my", "why am i", "prove", "evidence",
];

// Намерение «спорю с трактовкой».
const DISPUTE_MARKERS = [
  "disagree", "don't agree", "dont agree", "that's wrong", "thats wrong",
  "not true", "isn't true", "incorrect", "not correct", "not right", "wrong about",
  "dispute", "that's not me", "thats not me", "not me", "doesn't fit", "doesnt fit",
  "you say", "you're saying", "youre saying", "i'm not", "im not", "that's not right",
];

const has = (low, arr) => arr.some((m) => low.includes(m));

// Найти код пункта, упомянутого в тексте (первое совпадение по приоритету).
function detectPoint(low) {
  for (const [code, hints] of POINT_HINTS) {
    if (hints.some((h) => low.includes(h))) return code;
  }
  return null;
}

// Достать «значение» пункта из явного числа в тексте или из контекста разбора.
// Для нумерологии значения — 1–9 и мастер-числа 11/22/33.
function detectValue(text, point, context) {
  if (context && context[point.point_code] != null) {
    const v = String(context[point.point_code]);
    if (point.values && point.values[v]) return v;
  }
  const m = text.match(/\b(11|22|33|[1-9])\b/);
  if (m && point.values && point.values[m[1]]) return m[1];
  return null;
}

// Строка источника для вывода: «Author, Title, p. N» либо без страницы, если
// она ещё не сверена (page:"verify") — тогда честно без номера.
function citation(s) {
  const page =
    s.page && s.page !== "verify" ? `, p. ${s.page}` : "";
  return `${s.author}, ${s.title}${page}`;
}

const cite = (s) => `• ${citation(s)} — ${s.says}`;

// Ответ «как посчитано».
function methodAnswer(point) {
  const lines = point.method.sources.map(cite).join("\n");
  return {
    answer:
      `How we calculate your ${point.point_name}: ${point.method.verdict}\n\n` +
      `What this is based on:\n${lines}`,
  };
}

// Ответ на спор о трактовке для конкретного значения.
function disputeAnswer(point, value) {
  const v = point.values[value];
  const lines = v.sources.map(cite).join("\n");
  return {
    answer:
      `Your ${point.point_name} reads as ${value}. We don't just assert it — here's what we read it from:\n${lines}\n\n` +
      `Our verdict: ${v.verdict}\n\n` +
      `If that still doesn't fit you, tell us why — we'll adjust your reading for you.`,
  };
}

// Спор, но значение не распознали — показываем метод и просим уточнить.
function disputeNeedValue(point) {
  return {
    answer:
      `Happy to show the sources behind your ${point.point_name}. ` +
      `Tell me the value from your reading (for example, "life path 7") and I'll show exactly which books it comes from, page by page, plus our verdict.`,
  };
}

export function libraryAnswer(text, context) {
  const low = (text || "").toLowerCase();
  const code = detectPoint(low);
  if (!code) return null;
  const point = library.points.find((p) => p.point_code === code);
  if (!point) return null;

  const disputing = has(low, DISPUTE_MARKERS);
  const askingMethod = has(low, METHOD_MARKERS);
  if (!disputing && !askingMethod) return null;

  if (disputing && point.values && Object.keys(point.values).length) {
    const value = detectValue(text, point, context);
    return value ? disputeAnswer(point, value) : disputeNeedValue(point);
  }
  return methodAnswer(point);
}
