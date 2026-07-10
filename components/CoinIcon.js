"use client";

// Узнаваемые значки монет как inline-SVG (без внешних загрузок — CSP-safe,
// работает офлайн, чётко на любом размере). Бренд-цвет кружка + белый символ:
// цвет считывается мгновенно, символ подтверждает. По coin из data/wallets.json.

const BRAND = {
  USDT: "#26A17B",
  BTC: "#F7931A",
  ETH: "#627EEA",
  TON: "#0098EA",
  XRP: "#23292F",
};

// Цвет бейджа сети — чтобы сеть считывалась глазом, а не только текстом.
const NETWORK_COLOR = {
  "TRC-20": "#EF0027",
  TON: "#0098EA",
  "BEP-20": "#F3BA2F",
  Bitcoin: "#F7931A",
  "ERC-20": "#627EEA",
  "XRP Ledger": "#33E6E0",
};

export function networkColor(network) {
  return NETWORK_COLOR[network] || "#a6a0c6";
}

// Белый символ монеты (внутри бренд-кружка). viewBox 0 0 32 32.
function Glyph({ coin }) {
  switch (coin) {
    case "USDT":
      // Стилизованный ₮: стойка + верхняя перекладина + вторая планка.
      return (
        <g fill="#fff">
          <rect x="8" y="8.5" width="16" height="3.2" rx="1" />
          <rect x="14.2" y="8.5" width="3.6" height="15.5" rx="1" />
          <rect x="10.3" y="14.5" width="11.4" height="2.6" rx="1" />
        </g>
      );
    case "BTC":
      // ₿: две антенны + жирная B с двумя просветами (evenodd).
      return (
        <g fill="#fff">
          <rect x="13.6" y="5.5" width="1.7" height="21" rx="0.8" />
          <rect x="17.4" y="5.5" width="1.7" height="21" rx="0.8" />
          <path
            fillRule="evenodd"
            d="M11 8 H18.6 C21.5 8 23.1 9.8 23.1 12.3 C23.1 14 22.2 15.1 20.8 15.6 C22.7 16 24.1 17.3 24.1 19.6 C24.1 22.5 22 24 18.8 24 H11 Z M14.6 11 V14.3 H18.1 C19.4 14.3 20.1 13.6 20.1 12.6 C20.1 11.6 19.4 11 18.1 11 Z M14.6 17.4 V21 H18.7 C20.1 21 20.9 20.3 20.9 19.2 C20.9 18.1 20.1 17.4 18.7 17.4 Z"
          />
        </g>
      );
    case "ETH":
      // Классический ромб Ethereum (верхние и нижние грани).
      return (
        <g fill="#fff">
          <path d="M16 4 L9 16 L16 12.2 Z" fillOpacity="0.75" />
          <path d="M16 4 L23 16 L16 12.2 Z" />
          <path d="M16 20.4 L9 17.3 L16 13.6 Z" fillOpacity="0.75" />
          <path d="M16 20.4 L23 17.3 L16 13.6 Z" />
          <path d="M16 27.5 L9 18.7 L16 15 Z" fillOpacity="0.6" />
          <path d="M16 27.5 L23 18.7 L16 15 Z" fillOpacity="0.85" />
        </g>
      );
    case "TON":
      // Кристалл TON: ромб + внутренние грани (стойка вниз из центра верха).
      return (
        <g fill="#fff">
          <path d="M8 13 L16 25.5 L24 13 Z" fillOpacity="0.95" />
          <path d="M8 13 H24 L16 10 Z" fillOpacity="0.6" />
          <rect x="15.1" y="12.5" width="1.8" height="12" rx="0.9" fill={BRAND.TON} />
        </g>
      );
    case "XRP":
      // Метка XRP: две «галочки», образующие X (из bowtie-логотипа).
      return (
        <g
          fill="none"
          stroke="#fff"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M9 9 L16 15.5 L23 9" />
          <path d="M9 23 L16 16.5 L23 23" />
        </g>
      );
    default:
      return null;
  }
}

export default function CoinIcon({ coin, size = 24, className = "" }) {
  const brand = BRAND[coin] || "#444";
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      className={className}
      aria-hidden="true"
    >
      <circle cx="16" cy="16" r="16" fill={brand} />
      <Glyph coin={coin} />
    </svg>
  );
}
