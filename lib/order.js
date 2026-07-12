// NOMEN · Отправка ЗАКАЗА (факт «оплатил» + карточка клиента) в n8n для
// автовыдачи разбора. Дублирует Telegram-уведомление Артёму отдельным
// structured-каналом: сайт статический, поэтому весь автомат живёт в n8n
// (webhook nomen-order → журнал + база + письмо-подтверждение + кнопка выдачи).
//
// Fire-and-forget: сеть/ошибки НИКОГДА не ломают сайт (как lib/lead.js). Событие
// оплаты уже защищено paidRef в CryptoCheckout — вызывается один раз за заказ.
//
// ВАЖНО (свод 5.2): это НЕ выдаёт разбор. n8n лишь регистрирует заказ и шлёт
// Артёму кнопку; сам разбор уходит клиенту только после ручного подтверждения
// оплаты Артёмом (он сверяет платёж on-chain).
import { titleCaseName, cleanField } from "@/lib/notify";

const ORDER_WEBHOOK =
  "https://primary-production-6abb7.up.railway.app/webhook/nomen-order";

export function notifyOrder(data) {
  try {
    const body = JSON.stringify({
      // заказ
      code: data.code, // #XXXXX
      tierName: data.tierName,
      price: data.price,
      method: data.method, // "crypto" | "wise"
      // способ оплаты (для ручной сверки Артёмом)
      coin: data.coin,
      network: data.network,
      address: data.address,
      memo: data.memo || "", // memo/тег или ""
      amount: data.amount, // строка суммы как в UI
      amountUsd: data.amountUsd, // стабильная сумма в $ (цена + хвостик)
      // карточка клиента (имена — TitleCase, свод 4.7)
      firstName: titleCaseName(data.firstName),
      lastName: titleCaseName(data.lastName),
      gender: data.gender, // "f" | "m"
      birthDate: data.birthDate,
      birthTime: data.birthTime,
      birthPlace: cleanField(data.birthPlace),
      brand: cleanField(data.brand),
      email: cleanField(data.email),
      source: data.source || "checkout",
    });
    fetch(ORDER_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true, // переживает уход со страницы (redirect на /thank-you)
    }).catch(() => {});
  } catch {
    /* отправка заказа не должна ломать сайт */
  }
}
