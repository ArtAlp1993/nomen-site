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

// Короткий код заказа (#A7K2) — Артём по нему опознаёт платёж в блокчейне
// и связывает его с письмом-заказом в Telegram.
export function makeOrderCode() {
  return ("#" + Math.random().toString(36).slice(2, 6)).toUpperCase();
}
