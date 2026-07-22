// Сторож служебных страниц (Contact / Refunds / Delivery / About / FAQ /
// Privacy / Terms) — тех, на которые смотрит платёжная система при проверке
// сайта. Проверяет ГОТОВЫЙ out/, а не исходники (свод правил 1.4: смотрим на
// то, что получил человек, а не на замысел).
//
// Ловит три класса поломок:
//   1) страница не собралась вовсе (правка в app/ есть, out/ пустой);
//   2) в тексте остался плейсхолдер юрлица — Stripe этого видеть не должен;
//   3) вернулись мёртвые формулировки: почта-заглушка, «early draft».
//
// Запуск: node scripts/verify-legal.mjs (после npm run build).
import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";

const OUT = new URL("../out/", import.meta.url).pathname;

// Страница → фрагменты, которые ОБЯЗАНЫ быть в готовом HTML.
const PAGES = {
  contact: ["admin@nomen.website", "Support hours"],
  refunds: ["Refund Policy", "Duplicate payment", "chargeback"],
  delivery: ["Delivery Policy", "within 24 hours"],
  about: ["About NOMEN", "one-time"],
  faq: ["Frequently asked questions", "Stripe"],
  privacy: ["Privacy Policy", "Yandex Metrica", "Stripe"],
  terms: ["Terms of Service", "Governing law", "entertainment"],
};

// Текст, которого в проде быть не должно ни на одной странице.
// Квадратные скобки — из первой версии реквизитов: сайт живой, показывать
// на нём «[LEGAL ENTITY — to be filled]» нельзя (решение Артёма 22.07 —
// пишем нейтральное «NOMEN», пока юрлицо оформляется).
const FORBIDDEN = [
  ["nomen.example", "почта-заглушка (несуществующий домен)"],
  ["early draft", "формулировка «черновик» — читается как «сайт не готов»"],
  ["to be reviewed before launch", "пометка о недоделанности"],
  ["[LEGAL ENTITY", "незаполненный плейсхолдер юрлица виден посетителю"],
  ["[COUNTRY", "незаполненный плейсхолдер страны виден посетителю"],
  ["[JURISDICTION", "незаполненный плейсхолдер юрисдикции виден посетителю"],
];

let fails = 0;
let warns = 0;
const fail = (msg) => { console.log("  FAIL:", msg); fails++; };
const warn = (msg) => { console.log("  ⚠️ ", msg); warns++; };

if (!existsSync(OUT)) {
  console.log("❌ нет папки out/ — сначала npm run build");
  process.exit(1);
}

for (const [page, required] of Object.entries(PAGES)) {
  const file = join(OUT, page, "index.html");
  if (!existsSync(file)) {
    fail(`${page}/index.html не собрался`);
    continue;
  }
  const html = readFileSync(file, "utf8");

  for (const needle of required)
    if (!html.includes(needle))
      fail(`${page}: в готовой странице нет «${needle}»`);

  for (const [needle, why] of FORBIDDEN)
    if (html.toLowerCase().includes(needle.toLowerCase()))
      fail(`${page}: ${why} — «${needle}»`);

  // Сквозная навигация: с каждой служебной страницы должен быть путь к
  // остальным (проверяющий ходит по футеру).
  for (const other of ["/terms/", "/privacy/", "/contact/"])
    if (!html.includes(`href="${other}"`))
      fail(`${page}: нет ссылки на ${other}`);

  // Слипшиеся слова на стыке текста и {выражения}. JSX срезает пробел на
  // границе строки, и «use of {legal.siteName} and…» печатается как
  // «nomen.websiteand» — сборка при этом зелёная, видно только глазами.
  // React оставляет на месте стыка маркер <!-- -->, по нему и ищем.
  for (const m of html.matchAll(/(\w{2})<!-- -->(\w{2})/g))
    fail(`${page}: слиплись слова — «${m[1]}${m[2]}» (нужен {" "} на стыке)`);

  console.log(`OK ${page}/`);
}

// Главная: вход в служебные страницы (секция «Before you buy» + футер).
const home = join(OUT, "index.html");
if (existsSync(home)) {
  const html = readFileSync(home, "utf8");
  for (const link of ["/about/", "/contact/", "/faq/", "/refunds/", "/delivery/", "/terms/", "/privacy/"])
    if (!html.includes(`href="${link}"`))
      fail(`главная: нет ссылки на ${link}`);
  if (!html.includes("admin@nomen.website"))
    fail("главная: нет адреса поддержки");
  // FAQ-гармошка на главной остаётся (требование Артёма 22.07: «выпадающие
  // списки удобные, убирать не надо») — страница /faq живёт рядом, не вместо.
  if (!html.includes("How does NOMEN actually work?"))
    fail("главная: пропала FAQ-гармошка");
  if (!html.includes('id="policies"'))
    fail("главная: пропала секция со ссылками на условия");
  console.log("OK / (секция условий + FAQ + футер)");
} else {
  fail("не собралась главная страница");
}

// Реквизиты: пока юрисдикция не названа, документы говорят обтекаемо.
// Это не ошибка — но и забыть об этом нельзя, поэтому предупреждаем.
const legalCfg = JSON.parse(
  readFileSync(new URL("../data/legal.json", import.meta.url), "utf8")
);
if (!legalCfg.country || !legalCfg.governingLaw)
  warn(
    "юрлицо/юрисдикция в data/legal.json не заполнены — Terms говорят обтекаемо. " +
      "Заполнить, когда оформители Артёма назовут компанию и страну."
  );

console.log(fails ? `\n❌ FAILS: ${fails}` : "\n✅ ВСЁ ЧИСТО");
process.exit(fails ? 1 : 0);
