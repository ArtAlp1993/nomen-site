// Ответы «доказательной библиотеки» (задача Z-25): на вопрос «как посчитан
// пункт» и на спор клиента с трактовкой («вы говорите так, а это не так») чат
// отвечает, опираясь на источники из data/library.json — автор, книга,
// (страница, когда сверена) и наш общий вердикт. Без бэкенда: индекс статичен.
//
// libraryAnswer(text[, context]) → { answer, cta? } | null.
// Возвращает не-null ТОЛЬКО когда распознан конкретный пункт и намерение
// (как посчитано / спор). Иначе null — ChatWidget идёт дальше по chat-kb/FAQ.

import library from "@/data/library.json";

// Слова-зацепки для каждого пункта (специфичные фразы — раньше общих).
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

// Имена старших арканов Таро → номер (ключи values D1 — числа 0..21).
const ARCANA = {
  fool: "0", magician: "1", "high priestess": "2", priestess: "2", empress: "3",
  emperor: "4", hierophant: "5", lovers: "6", chariot: "7", strength: "8",
  hermit: "9", "wheel of fortune": "10", wheel: "10", justice: "11",
  "hanged man": "12", death: "13", temperance: "14", devil: "15", tower: "16",
  star: "17", moon: "18", sun: "19", judgement: "20", judgment: "20", world: "21",
};

const METHOD_MARKERS = [
  "how is", "how do you", "how did you", "how was", "how are",
  "calculat", "work out", "worked out", "derive", "comput",
  "on what basis", "the source", "which source", "what source", "sources for",
  "where does", "where do", "based on", "why is my", "why am i", "prove", "evidence",
];
const DISPUTE_MARKERS = [
  "disagree", "don't agree", "dont agree", "that's wrong", "thats wrong",
  "not true", "isn't true", "incorrect", "not correct", "not right", "wrong about",
  "dispute", "that's not me", "thats not me", "not me", "doesn't fit", "doesnt fit",
  "you say", "you're saying", "youre saying", "i'm not", "im not", "that's not right",
];

const has = (low, arr) => arr.some((m) => low.includes(m));
const wordHit = (low, w) =>
  new RegExp("\\b" + w.replace(/[.*+?^${}()|[\]\\]/g, "\\$&") + "\\b").test(low);

const pointByCode = (code) => library.points.find((p) => p.point_code === code);

function detectPoint(low) {
  for (const [code, hints] of POINT_HINTS) {
    if (hints.some((h) => low.includes(h))) return code;
  }
  return null;
}

// Если пункт не назван явно, но упомянуто значение словом (знак/животное/
// стихия/аркан), опознаём пункт по этому значению.
function detectPointByValue(low) {
  for (const p of library.points) {
    for (const key of Object.keys(p.values || {})) {
      if (/^[a-z]/i.test(key) && !key.includes("_") && wordHit(low, key.toLowerCase())) {
        return { code: p.point_code, value: key };
      }
    }
  }
  for (const [name, num] of Object.entries(ARCANA)) {
    if (wordHit(low, name)) return { code: "D1", value: num };
  }
  return null;
}

// Значение пункта: из контекста разбора, из явного слова-ключа, из аркана, из числа.
function detectValue(text, point, context, preset) {
  if (preset && point.values && point.values[preset]) return preset;
  if (context && context[point.point_code] != null) {
    const v = String(context[point.point_code]);
    if (point.values && point.values[v]) return v;
  }
  const low = text.toLowerCase();
  for (const key of Object.keys(point.values || {})) {
    if (/^[a-z]/i.test(key) && !key.includes("_") && wordHit(low, key.toLowerCase())) return key;
  }
  if (point.point_code === "D1") {
    for (const [name, num] of Object.entries(ARCANA)) if (wordHit(low, name)) return num;
  }
  const nums = text.match(/\b\d{1,2}\b/g) || [];
  for (const n of nums) if (point.values && point.values[n]) return n;
  return null;
}

function citation(s) {
  let ref = "";
  if (s.page && s.page !== "verify") {
    ref = /^\d/.test(String(s.page)) ? `, p. ${s.page}` : `, ${s.page}`;
  }
  return `${s.author}, ${s.title}${ref}`;
}
const cite = (s) => `• ${citation(s)}: ${s.says}`;

function methodAnswer(point) {
  const lines = point.method.sources.map(cite).join("\n");
  return {
    answer:
      `How we calculate your ${point.point_name}: ${point.method.verdict}\n\n` +
      `What this is based on:\n${lines}`,
  };
}
// Обратный маппинг номер аркана → имя (для человекочитаемого ответа по D1).
const ARCANA_REV = {};
for (const [name, num] of Object.entries(ARCANA)) {
  if (!ARCANA_REV[num]) ARCANA_REV[num] = name.replace(/\b\w/g, (c) => c.toUpperCase());
}

function disputeAnswer(point, value) {
  const v = point.values[value];
  const lines = v.sources.map(cite).join("\n");
  const label = point.point_code === "D1" && ARCANA_REV[value]
    ? `${ARCANA_REV[value]} (arcanum ${value})` : value;
  return {
    answer:
      `Your ${point.point_name} reads as ${label}. We don't just assert it. Here's what we read it from:\n${lines}\n\n` +
      `Our verdict: ${v.verdict}\n\n` +
      `If that still doesn't fit you, tell us why, and we'll adjust your reading for you.`,
  };
}
function disputeNeedValue(point) {
  return {
    answer:
      `Happy to show the sources behind your ${point.point_name}. ` +
      `Tell me the value from your reading and I'll show exactly which books it comes from, page by page, plus our verdict.`,
  };
}

export function libraryAnswer(text, context) {
  const low = (text || "").toLowerCase();
  let code = detectPoint(low);
  let preset = null;
  if (!code) {
    const byVal = detectPointByValue(low);
    if (byVal) { code = byVal.code; preset = byVal.value; }
  }
  if (!code) return null;
  const point = pointByCode(code);
  if (!point) return null;

  const disputing = has(low, DISPUTE_MARKERS);
  const askingMethod = has(low, METHOD_MARKERS);
  if (!disputing && !askingMethod) return null;

  if (disputing && point.values && Object.keys(point.values).length) {
    const value = detectValue(text, point, context, preset);
    return value ? disputeAnswer(point, value) : disputeNeedValue(point);
  }
  return methodAnswer(point);
}
