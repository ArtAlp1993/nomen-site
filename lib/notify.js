// Общий канал уведомлений Артёму в Telegram — используется и чатом
// (ChatWidget), и крипто-чекаутом (CryptoCheckout). Держим в одном месте,
// чтобы не дублировать токен-логику.
//
// Бот @NOMEN_site_bot шлёт уведомления Артёму в личку. Реквизиты живут в
// секретах GitHub (NEXT_PUBLIC_TG_TOKEN / NEXT_PUBLIC_TG_CHAT_ID) и
// подставляются при сборке — в исходниках репозитория их нет. В собранном
// бандле токен всё же виден (без бэкенда иначе никак) — осознанный MVP-риск;
// при переезде на бэкенд унести отправку на сервер.
const TG_TOKEN = process.env.NEXT_PUBLIC_TG_TOKEN || null;
const TG_CHAT_ID = process.env.NEXT_PUBLIC_TG_CHAT_ID || null;

// Отправка сообщения Артёму. Молчит, если реквизиты не заданы; ошибки
// сети глотает — уведомление никогда не должно ломать сайт.
export async function notifyTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text: text.slice(0, 3900) }),
    });
  } catch {
    /* уведомление не должно ломать сайт */
  }
}

// Криптостойкое случайное целое [0, max) — чтобы коды заказов/теги не
// повторялись предсказуемо (Math.random даёт коллизии и предсказуем).
function randInt(max) {
  try {
    const a = new Uint32Array(1);
    crypto.getRandomValues(a);
    return a[0] % max;
  } catch {
    return Math.floor(Math.random() * max);
  }
}

// Короткий код заказа (#A7K2X) — Артём по нему опознаёт платёж в блокчейне
// и связывает его с письмом-заказом в Telegram. 5 символов base36 → ~60M
// вариантов (меньше шанс коллизии при разборе платежей).
export function makeOrderCode() {
  const CH = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  let s = "";
  for (let i = 0; i < 5; i++) s += CH[randInt(CH.length)];
  return "#" + s;
}

// Числовой тег (для XRP Destination Tag) — 9 цифр, крипто-RNG.
export function makeNumericTag() {
  return String(100000000 + randInt(900000000));
}

// Очистка пользовательского поля перед вставкой в Telegram-сообщение:
// убираем переносы строк (иначе можно подделать строки «Адрес:/Сумма:»),
// схлопываем пробелы и ограничиваем длину.
export function cleanField(v, max = 120) {
  return String(v || "")
    .replace(/[\r\n]+/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

// Имя с заглавной буквы каждого слова (свод правил 4.7): «джеймс стивен» →
// «Джеймс Стивен». Разделители (пробел/дефис/апостроф) сохраняем, работает и
// для кириллицы, и для латиницы. Клиент мог ввести как попало — нормализуем на
// выводе (разбор, письма, карточки, Telegram). Пустое → "".
export function titleCaseName(v) {
  return cleanField(v)
    .toLowerCase()
    .replace(/(^|[\s\-'’])(\p{L})/gu, (_, sep, ch) => sep + ch.toUpperCase());
}
