import Button from "./ui/Button";
import Reveal from "./ui/Reveal";
import CosmicScene from "./CosmicScene";
import KineticHeadline from "./KineticHeadline";

export default function Hero() {
  return (
    <section className="relative flex min-h-[86svh] sm:min-h-screen flex-col items-center justify-center overflow-hidden px-6 text-center">
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
          A 13-point personality blueprint built from your name and birth date
          — numerology, astrology, Chinese zodiac and tarot. Free preview in
          under a minute.
        </p>
      </Reveal>

      <Reveal delay={0.3} className="relative mt-10">
        <Button href="#quiz">Reveal my blueprint</Button>
      </Reveal>
    </section>
  );
}
