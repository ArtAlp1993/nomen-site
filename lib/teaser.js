// NOMEN · Браузерный расчёт бесплатного тизера (порт nomen-engine/api.py).
//
// Считает те же 13 базовых пунктов (BASE_ORDER) по имени и дате рождения,
// что и Python-движок, и возвращает массив points в том же формате:
//   { code, label, featured, glyph?, phrase? }
// Алгоритмы перенесены из nomen-engine один в один (points/*.py, core/*.py)
// и сверены автотестом со случайными входами (scripts/verify-teaser.mjs).
// Внутренний язык значений движка — русский (знаки, животные, стихии),
// он сохранён как ключи словарей, наружу уходит английский тизерный слой.

const MASTER_NUMBERS = new Set([11, 22, 33]);
const KARMIC_DEBTS = new Set([13, 14, 16, 19]);

// ── Буквы (core/letters.py) ─────────────────────────────────

const LAT = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const CYR = "АБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ";
const PYTHAGOREAN_LAT = {};
for (let i = 0; i < LAT.length; i++) PYTHAGOREAN_LAT[LAT[i]] = (i % 9) + 1;
const PYTHAGOREAN_CYR = {};
for (let i = 0; i < CYR.length; i++) PYTHAGOREAN_CYR[CYR[i]] = (i % 9) + 1;

const VOWELS_LAT = new Set("AEIOU");
const VOWELS_CYR = new Set("АЕЁИОУЫЭЮЯ");

function normalize(text) {
  // Верхний регистр, только буквы двух алфавитов. Осознанное отличие от
  // движка: латинскую диакритику сводим к базовой букве (José → JOSE) —
  // движок такие имена отвергает, сайту важнее посчитать клиента.
  // Кириллицу NFD не трогаем: Ё и Й — самостоятельные буквы таблицы.
  const out = [];
  for (const ch of text.toUpperCase()) {
    if (PYTHAGOREAN_LAT[ch] || PYTHAGOREAN_CYR[ch]) {
      out.push(ch);
      continue;
    }
    const base = ch.normalize("NFD").replace(/[̀-ͯ]/g, "");
    if (base !== ch && (PYTHAGOREAN_LAT[base] || PYTHAGOREAN_CYR[base])) {
      out.push(base);
    }
  }
  return out.join("");
}

function detectAlphabet(text) {
  const letters = normalize(text);
  if (!letters) throw new Error("no letters");
  const hasCyr = [...letters].some((ch) => PYTHAGOREAN_CYR[ch]);
  const hasLat = [...letters].some((ch) => PYTHAGOREAN_LAT[ch]);
  if (hasCyr && hasLat) throw new Error("mixed alphabets");
  return hasCyr ? "cyr" : "lat";
}

function isVowel(letters, i, alphabet) {
  const ch = letters[i];
  if (alphabet === "cyr") return VOWELS_CYR.has(ch);
  if (VOWELS_LAT.has(ch)) return true;
  if (ch === "Y") {
    const prevVowel = i > 0 && VOWELS_LAT.has(letters[i - 1]);
    const nextVowel = i + 1 < letters.length && VOWELS_LAT.has(letters[i + 1]);
    return !(prevVowel || nextVowel);
  }
  return false;
}

function lettersSum(text, part = "all") {
  const alphabet = detectAlphabet(text);
  const letters = normalize(text);
  const table = alphabet === "cyr" ? PYTHAGOREAN_CYR : PYTHAGOREAN_LAT;
  const picked = [];
  for (let i = 0; i < letters.length; i++) {
    const vowel = isVowel(letters, i, alphabet);
    if (part === "vowels" && !vowel) continue;
    if (part === "consonants" && vowel) continue;
    picked.push(table[letters[i]]);
  }
  if (!picked.length) throw new Error("no letters for part " + part);
  return { alphabet, total: picked.reduce((a, b) => a + b, 0), values: picked };
}

// ── Арифметика (core/numerology.py) ─────────────────────────

const digitSum = (n) => String(Math.abs(n)).split("").reduce((a, d) => a + +d, 0);

function reduceNumber(n) {
  while (n > 9 && !MASTER_NUMBERS.has(n)) n = digitSum(n);
  return n;
}

function parseDate(iso) {
  // Из <input type="date">: YYYY-MM-DD.
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  if (dt.getUTCFullYear() !== y || dt.getUTCMonth() !== m - 1 || dt.getUTCDate() !== d) {
    throw new Error("invalid date");
  }
  return { day: d, month: m, year: y };
}

// ── Пункты (points/*.py, только расчётный слой) ─────────────

function calcA1(d) {
  const dayV = reduceNumber(d.day);
  const monthV = reduceNumber(d.month);
  const yearSum = digitSum(d.year);
  const yearV = reduceNumber(yearSum);
  const total = dayV + monthV + yearV;
  return { value: reduceNumber(total), yearSum, preFinal: total, dayV, monthV, yearV };
}

function calcA2(d) {
  // Мастер-статус только у самих дней 11 и 22; остальное — до однозначного.
  if (d.day === 11 || d.day === 22) return { value: d.day };
  let v = d.day;
  while (v > 9) v = digitSum(v);
  return { value: v };
}

const calcA3 = (name) => ({ value: reduceNumber(lettersSum(name, "all").total) });
const calcA4 = (name) => ({ value: reduceNumber(lettersSum(name, "vowels").total) });
const calcA5 = (name) => ({ value: reduceNumber(lettersSum(name, "consonants").total) });

const calcA7 = (d, name) => ({
  value: reduceNumber(calcA1(d).value + calcA3(name).value),
});

function calcA9(name) {
  const counts = {};
  for (let i = 1; i <= 9; i++) counts[i] = 0;
  for (const v of lettersSum(name, "all").values) counts[v] += 1;
  const lessons = [];
  for (let i = 1; i <= 9; i++) if (counts[i] === 0) lessons.push(i);
  return { karmic_lessons: lessons };
}

function calcA11(d, name) {
  const a1 = calcA1(d);
  const debts = [];
  if (KARMIC_DEBTS.has(d.day)) debts.push({ number: d.day });
  if (KARMIC_DEBTS.has(a1.yearSum)) debts.push({ number: a1.yearSum });
  if (KARMIC_DEBTS.has(a1.preFinal)) debts.push({ number: a1.preFinal });
  try {
    const total = lettersSum(name, "all").total;
    if (KARMIC_DEBTS.has(total)) debts.push({ number: total });
  } catch {
    // имя без букв — слой имени просто пропускается (как в движке)
  }
  return { has_debt: debts.length > 0, debts };
}

// B1 · Солнечный знак (границы — как в движке, тропический зодиак).
const SIGNS = [
  ["Овен", [3, 21], [4, 19]], ["Телец", [4, 20], [5, 20]],
  ["Близнецы", [5, 21], [6, 20]], ["Рак", [6, 21], [7, 22]],
  ["Лев", [7, 23], [8, 22]], ["Дева", [8, 23], [9, 22]],
  ["Весы", [9, 23], [10, 22]], ["Скорпион", [10, 23], [11, 21]],
  ["Стрелец", [11, 22], [12, 21]], ["Козерог", [12, 22], [1, 19]],
  ["Водолей", [1, 20], [2, 18]], ["Рыбы", [2, 19], [3, 20]],
];

function calcB1(d) {
  const ge = (m1, d1, m2, d2) => m1 > m2 || (m1 === m2 && d1 >= d2);
  const le = (m1, d1, m2, d2) => m1 < m2 || (m1 === m2 && d1 <= d2);
  for (const [name, [sm, sd], [em, ed]] of SIGNS) {
    if (sm <= em) {
      if (ge(d.month, d.day, sm, sd) && le(d.month, d.day, em, ed)) return { value: name };
    } else if (ge(d.month, d.day, sm, sd) || le(d.month, d.day, em, ed)) {
      return { value: name };
    }
  }
  return { value: "Козерог" };
}

// C1/C2 · Китайский зодиак (по григорианскому году, как в движке).
const ANIMALS = [
  "Крыса", "Бык", "Тигр", "Кролик", "Дракон", "Змея",
  "Лошадь", "Коза", "Обезьяна", "Петух", "Собака", "Свинья",
];
const calcC1 = (d) => ({ value: ANIMALS[(((d.year - 2020) % 12) + 12) % 12] });

const ELEMENT_BY_LAST_DIGIT = {
  0: "Металл", 1: "Металл", 2: "Вода", 3: "Вода", 4: "Дерево",
  5: "Дерево", 6: "Огонь", 7: "Огонь", 8: "Земля", 9: "Земля",
};
const calcC2 = (d) => ({ value: ELEMENT_BY_LAST_DIGIT[d.year % 10] });

// D1 · Карта рождения (старшие арканы; 19/20/21 не редуцируются).
const ROMAN = ["0", "I", "II", "III", "IV", "V", "VI", "VII", "VIII", "IX", "X",
  "XI", "XII", "XIII", "XIV", "XV", "XVI", "XVII", "XVIII", "XIX", "XX", "XXI"];
const NON_REDUCED = new Set([19, 20, 21]);

function calcD1(d) {
  const dd = String(d.day).padStart(2, "0");
  const mm = String(d.month).padStart(2, "0");
  let n = digitSum(Number(`${dd}${mm}${d.year}`));
  while (n > 21) n = digitSum(n);
  let soul = n;
  if (n >= 10 && n <= 21 && !NON_REDUCED.has(n)) soul = digitSum(n);
  return { soul: { num: soul, roman: ROMAN[soul] } };
}

// ── Английский тизерный слой (api.py, дословно) ─────────────

const LIFE_PATH_EN = {
  1: "You're wired to go first, not to follow — independence is your engine.",
  2: "Your power lives in connection, not force — you read a room before you speak.",
  3: "You're built to express — words, images, ideas move through you easily.",
  4: "You turn chaos into structure — discipline is your natural state, not a chore.",
  5: "Freedom and change aren't a phase for you — they're the whole point.",
  6: "You hold things together for others — responsibility finds you early.",
  7: "You go deeper than most people are comfortable going — truth over comfort.",
  8: "You think in scale — resources, results, and the systems that produce them.",
  9: "You see past the personal — your instinct is to give, finish, and let go.",
  11: "You pick up on things before they're visible to anyone else — a master intuitive.",
  22: "You can turn a huge vision into something real — rare, and heavy to carry.",
  33: "You lead by example, not instruction — the rarest path on the chart.",
};

const EXPRESSION_EN = {
  1: "Your mission is to lead and break new ground — to start what others finish.",
  2: "Your mission is to connect and mediate — to hold people together.",
  3: "Your mission is to create and communicate — to give the world your voice.",
  4: "Your mission is to build systems that last — to bring order to chaos.",
  5: "Your mission is to move, adapt, and master change itself.",
  6: "Your mission is to protect and guide — to be the one others lean on.",
  7: "Your mission is to seek truth and become the one who truly understands.",
  8: "Your mission is to lead, build, and wield influence at scale.",
  9: "Your mission is to serve something bigger than yourself.",
  11: "Your mission is to inspire — to turn intuition into light for many.",
  22: "Your mission is to turn a vast vision into something real and lasting.",
  33: "Your mission is to heal and uplift through unconditional care.",
};

const SUN_SIGN_EN = {
  "Овен": { name: "Aries", phrase: "Fire, cardinal — you move first and figure out the rest on the way." },
  "Телец": { name: "Taurus", phrase: "Earth, fixed — you build for the long run and rarely let go of what's yours." },
  "Близнецы": { name: "Gemini", phrase: "Air, mutable — your mind runs fast, curious, and rarely sits still." },
  "Рак": { name: "Cancer", phrase: "Water, cardinal — you protect what you love, deeply and quietly." },
  "Лев": { name: "Leo", phrase: "Fire, fixed — you were built to be seen, and to lead from the front." },
  "Дева": { name: "Virgo", phrase: "Earth, mutable — you notice what everyone else misses, and fix it." },
  "Весы": { name: "Libra", phrase: "Air, cardinal — balance and connection aren't ideals for you, they're instinct." },
  "Скорпион": { name: "Scorpio", phrase: "Water, fixed — you go to the bottom of things, and come back changed." },
  "Стрелец": { name: "Sagittarius", phrase: "Fire, mutable — you're chasing meaning, not just the next destination." },
  "Козерог": { name: "Capricorn", phrase: "Earth, cardinal — status and discipline aren't pressure, they're purpose." },
  "Водолей": { name: "Aquarius", phrase: "Air, fixed — you think in futures other people haven't imagined yet." },
  "Рыбы": { name: "Pisces", phrase: "Water, mutable — you feel what words can't say, and create from it." },
};

const TAROT_EN = {
  0: { name: "The Fool", phrase: "Your core archetype is the leap of faith — you begin before you're ready." },
  1: { name: "The Magician", phrase: "Your core archetype is will made real — you turn intention into action." },
  2: { name: "The High Priestess", phrase: "Your core archetype is inner knowing — you trust what you sense before what you're told." },
  3: { name: "The Empress", phrase: "Your core archetype is nurture and growth — you make things flourish." },
  4: { name: "The Emperor", phrase: "Your core archetype is structure and authority — you build order others can stand on." },
  5: { name: "The Hierophant", phrase: "Your core archetype is tradition and teaching — you pass on what you've learned." },
  6: { name: "The Lovers", phrase: "Your core archetype is the meaningful choice — connection defines your path." },
  7: { name: "The Chariot", phrase: "Your core archetype is willpower in motion — you push through by sheer drive." },
  8: { name: "Strength", phrase: "Your core archetype is quiet power — you master things by patience, not force." },
  9: { name: "The Hermit", phrase: "Your core archetype is inner wisdom — you find your answers alone, first." },
  10: { name: "Wheel of Fortune", phrase: "Your core archetype is cycles and timing — you move with change, not against it." },
  11: { name: "Justice", phrase: "Your core archetype is balance and truth — fairness matters to you, deeply." },
  12: { name: "The Hanged Man", phrase: "Your core archetype is the shift in perspective — you grow by seeing differently." },
  13: { name: "Death", phrase: "Your core archetype is transformation — endings clear space for what's next." },
  14: { name: "Temperance", phrase: "Your core archetype is harmony — you blend extremes into something that works." },
  15: { name: "The Devil", phrase: "Your core archetype is confronting what binds you — freedom comes through facing it." },
  16: { name: "The Tower", phrase: "Your core archetype is sudden change — what falls apart makes room for the real thing." },
  17: { name: "The Star", phrase: "Your core archetype is hope after hardship — you keep faith when it's hard to." },
  18: { name: "The Moon", phrase: "Your core archetype is the unconscious — you sense what hasn't surfaced yet." },
  19: { name: "The Sun", phrase: "Your core archetype is clarity and joy — you bring warmth wherever you go." },
  20: { name: "Judgement", phrase: "Your core archetype is the reckoning — you rise by facing what you've avoided." },
  21: { name: "The World", phrase: "Your core archetype is completion — you finish what you start, fully." },
};

const ARCHETYPE_EN = {
  1: "The Leader", 2: "The Diplomat", 3: "The Creator", 4: "The Builder",
  5: "The Seeker", 6: "The Caretaker", 7: "The Sage", 8: "The Executive",
  9: "The Humanitarian", 11: "The Visionary", 22: "The Master Builder",
  33: "The Master Teacher",
};

const CHINESE_ANIMAL_EN = {
  "Крыса": "Rat", "Бык": "Ox", "Тигр": "Tiger", "Кролик": "Rabbit",
  "Дракон": "Dragon", "Змея": "Snake", "Лошадь": "Horse", "Коза": "Goat",
  "Обезьяна": "Monkey", "Петух": "Rooster", "Собака": "Dog", "Свинья": "Pig",
};

const CHINESE_ELEMENT_EN = {
  "Дерево": "Wood", "Огонь": "Fire", "Земля": "Earth", "Металл": "Metal", "Вода": "Water",
};

const ZODIAC_GLYPH = {
  "Овен": "♈", "Телец": "♉", "Близнецы": "♊", "Рак": "♋",
  "Лев": "♌", "Дева": "♍", "Весы": "♎", "Скорпион": "♏",
  "Стрелец": "♐", "Козерог": "♑", "Водолей": "♒", "Рыбы": "♓",
};
const ANIMAL_GLYPH = {
  "Крыса": "鼠", "Бык": "牛", "Тигр": "虎", "Кролик": "兔", "Дракон": "龙",
  "Змея": "蛇", "Лошадь": "马", "Коза": "羊", "Обезьяна": "猴", "Петух": "鸡",
  "Собака": "狗", "Свинья": "猪",
};
const ELEMENT_GLYPH = { "Дерево": "木", "Огонь": "火", "Земля": "土", "Металл": "金", "Вода": "水" };

const NUM_PREFIX = {
  A1: "Life Path", A2: "Birthday", A3: "Expression",
  A4: "Soul Urge", A5: "Personality", A7: "Maturity",
};

const BASE_ORDER = ["A1", "A2", "A3", "A4", "A5", "A7", "A9", "A10", "A11", "B1", "C1", "C2", "D1"];
const FEATURED = new Set(["A1", "A3", "B1", "D1"]);

// ── Сборка тизера (эквивалент POST /teaser) ─────────────────

export function calculateTeaser({ name, date }) {
  const d = parseDate(date);

  // Каждый пункт считаем независимо: упавший пункт пропускается, как в движке.
  const results = {};
  const tryPoint = (code, fn) => {
    try {
      results[code] = fn();
    } catch {
      /* пункт пропущен */
    }
  };
  tryPoint("A1", () => calcA1(d));
  tryPoint("A2", () => calcA2(d));
  tryPoint("A3", () => calcA3(name));
  tryPoint("A4", () => calcA4(name));
  tryPoint("A5", () => calcA5(name));
  tryPoint("A7", () => calcA7(d, name));
  tryPoint("A9", () => calcA9(name));
  tryPoint("A10", () => ({}));
  tryPoint("A11", () => calcA11(d, name));
  tryPoint("B1", () => calcB1(d));
  tryPoint("C1", () => calcC1(d));
  tryPoint("C2", () => calcC2(d));
  tryPoint("D1", () => calcD1(d));

  const label = (code, r) => {
    if (NUM_PREFIX[code]) {
      const arch = ARCHETYPE_EN[r.value];
      return arch ? `${NUM_PREFIX[code]} ${r.value} · ${arch}` : `${NUM_PREFIX[code]} ${r.value}`;
    }
    if (code === "A9") {
      const l = r.karmic_lessons;
      return "Karmic lessons: " + (l.length ? l.join(", ") : "none missing");
    }
    if (code === "A10") return "Your nine-cell psychomatrix";
    if (code === "A11") {
      if (r.has_debt) return `Karmic debt: ${r.debts.map((x) => x.number).join(", ")}`;
      return "No karmic debt";
    }
    if (code === "B1") {
      const meta = SUN_SIGN_EN[r.value];
      return meta ? `Sun in ${meta.name}` : `Sun in ${r.value}`;
    }
    if (code === "C1") return CHINESE_ANIMAL_EN[r.value] || r.value;
    if (code === "C2") return `${CHINESE_ELEMENT_EN[r.value] || r.value} element`;
    if (code === "D1") {
      const meta = TAROT_EN[r.soul.num];
      return meta ? meta.name : String(r.soul.num);
    }
    return null;
  };

  const glyph = (code, r) => {
    if (NUM_PREFIX[code]) return String(r.value);
    if (code === "A11") return r.has_debt && r.debts.length ? String(r.debts[0].number) : "0";
    if (code === "B1") return ZODIAC_GLYPH[r.value] || null;
    if (code === "C1") return ANIMAL_GLYPH[r.value] || null;
    if (code === "C2") return ELEMENT_GLYPH[r.value] || null;
    if (code === "D1") return r.soul.roman;
    return null;
  };

  const phrase = (code, r) => {
    if (code === "A1") return LIFE_PATH_EN[r.value] || null;
    if (code === "A3") return EXPRESSION_EN[r.value] || null;
    if (code === "B1") return SUN_SIGN_EN[r.value]?.phrase || null;
    if (code === "D1") return TAROT_EN[r.soul.num]?.phrase || null;
    return null;
  };

  const points = [];
  for (const code of BASE_ORDER) {
    const r = results[code];
    if (!r) continue;
    const l = label(code, r);
    if (l == null) continue;
    const item = { code, label: l, featured: FEATURED.has(code) };
    const g = glyph(code, r);
    if (g) item.glyph = g;
    if (FEATURED.has(code)) {
      const p = phrase(code, r);
      if (p) item.phrase = p;
    }
    points.push(item);
  }
  return { points };
}
