// NOMEN · Сохранение лида (карточка клиента) в n8n-базу.
// Fire-and-forget: сеть/ошибки НИКОГДА не ломают сайт (как lib/notify.js).
const LEAD_WEBHOOK =
  "https://primary-production-6abb7.up.railway.app/webhook/nomen-lead";

export function notifyLead(data) {
  try {
    const body = JSON.stringify({
      gender: data.gender,
      firstName: data.firstName,
      lastName: data.lastName,
      birthDate: data.birthDate,
      birthTime: data.birthTime,
      birthPlace: data.birthPlace,
      brand: data.brand,
      email: data.email,
      source: data.source || "quiz",
    });
    fetch(LEAD_WEBHOOK, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body,
      keepalive: true, // переживает уход со страницы
    }).catch(() => {});
  } catch {
    /* захват лида не должен ломать сайт */
  }
}
