// Курс криптовалют для не-стейблов (BTC/ETH/TON/XRP): считаем, сколько монеты
// эквивалентно сумме в долларах. Сайт статический, поэтому берём курс прямо
// в браузере с публичного API CoinGecko.
//
// Риски (осознанные для MVP):
// - CSP: сейчас Content-Security-Policy в проекте нет (next.config.mjs без
//   заголовков), запрос не блокируется. Если позже добавят CSP — внести
//   https://api.coingecko.com в connect-src.
// - Rate-limit публичного API (~10-30 req/min). На MVP-трафике приемлемо.
// - Сбой/офлайн: возвращаем null, а UI показывает «эквивалент $X» без точной
//   суммы. Курс здесь — лишь удобство; идентификатор платежа — код заказа.

const ENDPOINT = "https://api.coingecko.com/api/v3/simple/price";

// Возвращает количество монеты за usdAmount долларов, либо null при ошибке.
export async function fetchCryptoAmount(coingeckoId, usdAmount) {
  if (!coingeckoId) return null;
  try {
    const res = await fetch(
      `${ENDPOINT}?ids=${encodeURIComponent(coingeckoId)}&vs_currencies=usd`
    );
    if (!res.ok) return null;
    const data = await res.json();
    const price = data?.[coingeckoId]?.usd;
    if (!price || price <= 0) return null;
    return usdAmount / price;
  } catch {
    return null;
  }
}
