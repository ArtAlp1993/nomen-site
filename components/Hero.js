import Button from "./ui/Button";
import Reveal from "./ui/Reveal";
import CosmicScene from "./CosmicScene";
import KineticHeadline from "./KineticHeadline";

export default function Hero() {
  return (
    <section id="top" className="relative flex min-h-[86svh] sm:min-h-screen flex-col items-center justify-center overflow-hidden px-6 pt-10 sm:pt-0 text-center">
      {/* Живая 3D-сцена: вращающаяся сакральная геометрия + звёздное поле (Canvas). */}
      <CosmicScene className="pointer-events-none absolute inset-0 h-full w-full" />
      {/* Затемнение снизу — для читаемости текста поверх сцены. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-background/40 via-background/10 to-background"
      />

      <Reveal className="relative">
        <span className="font-heading text-sm sm:text-base uppercase tracking-[0.4em] text-accent-turquoise">
          NOMEN
        </span>
      </Reveal>

      <KineticHeadline className="relative mt-6" />

      <Reveal delay={0.2} className="relative">
        <p className="mt-6 max-w-xl text-sm text-foreground-muted sm:text-lg">
          A 13-point map of how you&apos;re wired, read from your name and the
          day you were born. Numerology, astrology, Chinese zodiac, and tarot:
          each point from a named method, not a horoscope generator. See a real
          slice free, in under a minute.
        </p>
      </Reveal>

      <Reveal delay={0.3} className="relative mt-10">
        <Button href="#quiz">Reveal my blueprint</Button>
      </Reveal>

      {/* Подсказка листать вниз (фишка редизайна): «SCROLL» + линия, мягко
          плавает. Чистый CSS (animate-scroll-cue), нагрузки на скролл нет. */}
      <div
        aria-hidden
        className="animate-scroll-cue pointer-events-none absolute bottom-6 left-1/2 flex -translate-x-1/2 flex-col items-center gap-2"
      >
        <span className="font-mono text-[10px] tracking-[0.4em] text-foreground-muted/60">
          SCROLL
        </span>
        <span className="block h-8 w-px bg-gradient-to-b from-accent-turquoise/70 to-transparent" />
      </div>
    </section>
  );
}
