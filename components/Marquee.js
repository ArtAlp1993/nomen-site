// Бегущая строка методов (фишка редизайна): бесшовный marquee из двух
// одинаковых дорожек. Чистый CSS (@keyframes marquee в globals.css) — нагрузки
// на скролл нет. Декоративная, aria-hidden.
const ITEMS = [
  "NUMEROLOGY · 9 POINTS",
  "WESTERN ASTROLOGY",
  "CHINESE ZODIAC",
  "TAROT · MAJOR ARCANA",
  "13 POINTS · NAMED METHODS",
  "FREE PREVIEW IN UNDER A MINUTE",
];

function Track() {
  return (
    <div className="flex shrink-0 items-center">
      {ITEMS.map((t, i) => (
        <span
          key={i}
          className="flex items-center whitespace-nowrap font-mono text-xs tracking-[0.28em] text-foreground-muted/70"
        >
          {t}
          <span className="mx-10 text-accent-turquoise/70">✦</span>
        </span>
      ))}
    </div>
  );
}

export default function Marquee() {
  return (
    <div
      aria-hidden
      className="overflow-hidden border-y border-foreground-muted/10 bg-background-alt/25 py-4"
    >
      <div className="flex w-max animate-marquee">
        <Track />
        <Track />
      </div>
    </div>
  );
}
