// Проверка кодека персональной ссылки (lib/readingLink.js):
// roundtrip (лат/кир), сжатие вердикта, битая подпись/пейлоад, fallback ?r=.
// Запуск: node scripts/verify-link.mjs
import {
  encodeReadingToken,
  encodeReadingLink,
  decodeReadingToken,
} from "../lib/readingLink.js";

let pass = 0;
let fail = 0;
const ok = (name, cond) => {
  if (cond) pass += 1;
  else {
    fail += 1;
    console.log("FAIL:", name);
  }
};

const CARDS = [
  { t: "full", fn: "Anna", ln: "Lee", bd: "1993-08-19", bt: "07:30", bp: "Bangkok", g: "f", oc: "K7Q2M" },
  { t: "full", fn: "Артём", ln: "Ивичев", bd: "1993-08-19", bp: "Санкт-Петербург", g: "m", oc: "ЖЗ12Й" },
  {
    t: "full", fn: "Ёлкина", ln: "Юлия", bd: "1996-02-29", g: "f", oc: "AB123",
    vd: "Your chart is a rare braid: the 7's depth, the Leo sun's need to be seen, ".repeat(6),
  },
];

for (const card of CARDS) {
  const token = await encodeReadingToken(card);
  const back = await decodeReadingToken(token);
  const { v, t, ...orig } = { ...card };
  ok(`roundtrip ${card.fn}`, JSON.stringify({ ...back }) === JSON.stringify({ v: 1, t: "full", ...card }));
  ok(`token url-safe ${card.fn}`, /^[jd]\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]{22}$/.test(token));
}

// Ссылка целиком + разбор из hash и из query.
const link = await encodeReadingLink(CARDS[0]);
ok("link shape", link.startsWith("https://nomen.website/reading/#r="));
const token = link.split("#r=")[1];
ok("decode from hash", (await decodeReadingToken(`#r=${token}`)).fn === "Anna");
ok("decode from query", (await decodeReadingToken(`?r=${token}`)).fn === "Anna");
ok("decode from query 2nd param", (await decodeReadingToken(`?utm=1&r=${token}`)).fn === "Anna");

// Сжатие: длинный вердикт должен дать enc "d" и ссылку разумной длины.
const longToken = await encodeReadingToken(CARDS[2]);
ok("long verdict compressed", longToken.startsWith("d."));
ok("long verdict fits", longToken.length < 900);

// Битая подпись.
const tampered = token.slice(0, -3) + (token.endsWith("AAA") ? "BBB" : "AAA");
ok("tampered sig rejected", await decodeReadingToken(`#r=${tampered}`).then(() => false, (e) => e.message === "bad-signature"));

// Подменённый payload (подпись не совпадёт).
const [encPart, payload, sig] = token.split(".");
const forged = `${encPart}.${payload.slice(0, -4)}Zm9v.${sig}`;
ok("forged payload rejected", await decodeReadingToken(forged).then(() => false, (e) => e.message === "bad-signature"));

// Мусор.
for (const junk of ["", "#r=", "#r=abc", "j.only", "x.aaa.bbb", "#r=j..sig"]) {
  ok(`junk rejected: "${junk}"`, await decodeReadingToken(junk).then(() => false, () => true));
}

// Чужая соль (эмуляция другого окружения) — подпись не совпадает.
const foreign = await encodeReadingToken(CARDS[0], "other-salt");
ok("foreign salt rejected", await decodeReadingToken(foreign).then(() => false, (e) => e.message === "bad-signature"));
ok("foreign salt accepted with same salt", (await decodeReadingToken(foreign, "other-salt")).fn === "Anna");

console.log(`PASS ${pass}/${pass + fail}`);
if (fail) process.exit(1);
