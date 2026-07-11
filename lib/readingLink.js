// NOMEN · Персональная ссылка на полный разбор (/reading).
//
// Вся карточка клиента зашита в саму ссылку — бэкенда нет, страница одна:
//   https://nomen.website/reading/#r=<enc>.<payload>.<sig>
// enc: "d" — payload сжат deflate-raw, "j" — чистый JSON (fallback).
// payload: base64url(UTF-8 JSON) карточки {v,t,fn,ln,bd,bt,bp,br,g,oc,vd}.
// sig: HMAC-SHA256 от `${enc}.${payload}` с солью, усечённый до 22 символов.
//
// ЧЕСТНО ПРО ЗАЩИТУ (принятый MVP-риск, правила проекта п.4):
// соль NEXT_PUBLIC_READING_SALT инлайнится в бандл — это обфускация от
// случайного подбора, а не криптозащита пейвола. Поле v — рельсы к
// серверному подписанту (v:2), формат ссылки при миграции не меняется.
//
// Email в ссылку НЕ кладём (лишний PII). points не кладём — пересчёт
// движком lib/teaser.js на клиенте. Кириллица — через TextEncoder
// (btoa на не-Latin1 падает).

const SALT = process.env.NEXT_PUBLIC_READING_SALT || "nomen-dev-salt";
const SIG_LEN = 22;

// ── base64url ────────────────────────────────────────────────

function bytesToB64url(bytes) {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function b64urlToBytes(s) {
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/");
  const bin = atob(b64 + "=".repeat((4 - (b64.length % 4)) % 4));
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

// ── deflate (CompressionStream; при отсутствии — чистый JSON) ─

async function deflate(bytes) {
  const cs = new CompressionStream("deflate-raw");
  const stream = new Blob([bytes]).stream().pipeThrough(cs);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

async function inflate(bytes) {
  const ds = new DecompressionStream("deflate-raw");
  const stream = new Blob([bytes]).stream().pipeThrough(ds);
  return new Uint8Array(await new Response(stream).arrayBuffer());
}

// ── подпись ──────────────────────────────────────────────────

async function sign(message, salt) {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw", enc.encode(salt), { name: "HMAC", hash: "SHA-256" }, false, ["sign"],
  );
  const mac = new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(message)));
  return bytesToB64url(mac).slice(0, SIG_LEN);
}

// ── публичный API ────────────────────────────────────────────

// card: { t, fn, ln, bd, bt?, bp?, br?, g?, oc, vd? }
// Возвращает token "enc.payload.sig" (хвост после #r=).
export async function encodeReadingToken(card, salt = SALT) {
  if (!card || !card.fn || !card.bd) throw new Error("card: fn and bd required");
  const json = JSON.stringify({ v: 1, t: card.t || "full", ...card });
  const raw = new TextEncoder().encode(json);

  let enc = "j";
  let bytes = raw;
  if (typeof CompressionStream !== "undefined") {
    try {
      const packed = await deflate(raw);
      if (packed.length < raw.length) {
        enc = "d";
        bytes = packed;
      }
    } catch {
      /* fallback на чистый JSON */
    }
  }
  const payload = bytesToB64url(bytes);
  const sig = await sign(`${enc}.${payload}`, salt);
  return `${enc}.${payload}.${sig}`;
}

export async function encodeReadingLink(card, origin = "https://nomen.website", salt = SALT) {
  const token = await encodeReadingToken(card, salt);
  return `${origin}/reading/#r=${token}`;
}

// ── Prefill для /studio (без подписи: это черновик карточки для Артёма,
// а не выдача продукта; PII в нём то же, что уже лежит в TG-сообщении) ──

export function encodePrefill(obj) {
  return bytesToB64url(new TextEncoder().encode(JSON.stringify(obj)));
}

export function decodePrefill(input) {
  const m = String(input || "").match(/(?:^|[#?&]o=)([A-Za-z0-9_-]+)/);
  if (!m) throw new Error("bad-prefill");
  try {
    return JSON.parse(new TextDecoder().decode(b64urlToBytes(m[1])));
  } catch {
    throw new Error("bad-prefill");
  }
}

// Принимает location.hash ("#r=..."), location.search ("?r=...") или сам token.
// Возвращает карточку или бросает Error("bad-link" | "bad-signature").
export async function decodeReadingToken(input, salt = SALT) {
  const m = String(input || "").match(/(?:^|[#?&]r=)([A-Za-z0-9_.-]+)/);
  const token = m ? m[1] : "";
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("bad-link");
  const [enc, payload, sig] = parts;
  if (!["d", "j"].includes(enc) || !payload) throw new Error("bad-link");

  const expected = await sign(`${enc}.${payload}`, salt);
  if (sig !== expected) throw new Error("bad-signature");

  let bytes;
  try {
    bytes = b64urlToBytes(payload);
    if (enc === "d") bytes = await inflate(bytes);
    const card = JSON.parse(new TextDecoder().decode(bytes));
    if (!card || card.v !== 1 || !card.fn || !card.bd) throw new Error("bad-link");
    return card;
  } catch (e) {
    throw e.message === "bad-link" ? e : new Error("bad-link");
  }
}
