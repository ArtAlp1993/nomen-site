import Card from "./ui/Card";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";
import InfoPopover from "./InfoPopover";

// cred — текст попапа «почему ему верить» (закрывает сомнения лида в авторитете).
// Написан через copywriting + humanizer: конкретика, честность, без ИИ-штампов.
const topRow = [
  {
    name: "Carl Jung",
    field: "Analytical psychology",
    body: "Archetypes and the shadow self: the parts of you that shape behavior from below awareness.",
    cred: "The psychiatrist who gave psychology the ideas we still use to talk about personality: archetypes, the shadow, the unconscious. We read you through his lens, not a horoscope column.",
  },
  {
    name: "Eric Berne",
    field: "Transactional analysis",
    body: "How you relate, react, and repeat patterns in your closest relationships.",
    cred: "He founded Transactional Analysis and wrote 'Games People Play,' a book therapists still hand out. His model is about how you connect and where you clash.",
  },
  {
    name: "Liz Greene",
    field: "Psychological astrology",
    body: "Reading the chart as a map of psychology, not just prediction.",
    cred: "A psychologist with a PhD who spent her career treating the birth chart as a map of the mind instead of a fortune. Her books are why psychological astrology is taken seriously.",
  },
];

const bottomRow = [
  {
    name: "Pythagoras",
    field: "Numerology",
    body: "The number system behind your life path, expression, and personal cycles.",
    cred: "The mathematician whose number system numerology still runs on, roughly 2,500 years later. We use the source, not a watered-down copy.",
  },
  {
    name: "John Gottman",
    field: "Relationship science",
    body: "Evidence-based patterns behind compatibility and conflict style.",
    cred: "A relationship researcher who watched thousands of couples in a lab and could call a divorce years ahead with about 90% accuracy. His work is data, not opinion.",
  },
];

function SchoolCard({ s, delay, centered = false }) {
  return (
    <Reveal delay={delay}>
      <Card
        className={`relative h-full ${
          // На широких экранах карточка центрирована, на узких (мобильных)
          // содержимое перестраивается по левому краю.
          centered ? "sm:flex sm:flex-col sm:items-center sm:text-center" : ""
        }`}
      >
        {/* Печать авторитета — декоративная (не рейтинг ★, свод З-27). */}
        <span
          aria-hidden
          className="absolute right-4 top-4 flex h-7 w-7 items-center justify-center rounded-full border border-accent-turquoise/40 bg-accent-turquoise/[0.08] text-sm text-accent-turquoise"
        >
          ✦
        </span>
        <h3 className="font-heading text-lg font-semibold">{s.name}</h3>
        <p className="mt-1 font-mono text-[11px] uppercase tracking-[0.18em] text-accent-turquoise">
          {s.field}
        </p>
        <p className="mt-3 text-sm text-foreground-muted">{s.body}</p>
        {/* ⓘ — попап «почему ему верить». */}
        <div className={`mt-4 ${centered ? "sm:flex sm:justify-center" : ""}`}>
          <InfoPopover title={s.name} eyebrow="Why trust this" triggerLabel="Why trust this">
            {s.cred}
          </InfoPopover>
        </div>
      </Card>
    </Reveal>
  );
}

export default function AuthoritySection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Built on real schools of thought"
        title="A named method behind every point"
        subtitle="No vague 'the universe says.' Every one of the 13 points traces back to a documented framework."
      />

      {/* Оба ряда: на десктопе содержимое карточек по центру,
          на мобильном — по левому краю. */}
      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {topRow.map((s, i) => (
          <SchoolCard key={s.name} s={s} delay={i * 0.06} centered />
        ))}
      </div>
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {bottomRow.map((s, i) => (
          <SchoolCard key={s.name} s={s} delay={(topRow.length + i) * 0.06} centered />
        ))}
      </div>
    </section>
  );
}
