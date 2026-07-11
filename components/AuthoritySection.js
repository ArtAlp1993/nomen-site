import Card from "./ui/Card";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";

const topRow = [
  {
    name: "Carl Jung",
    field: "Analytical psychology",
    body: "Archetypes and the shadow self: the parts of you that shape behavior from below awareness.",
  },
  {
    name: "Eric Berne",
    field: "Transactional analysis",
    body: "How you relate, react, and repeat patterns in your closest relationships.",
  },
  {
    name: "Liz Greene",
    field: "Psychological astrology",
    body: "Reading the chart as a map of psychology, not just prediction.",
  },
];

const bottomRow = [
  {
    name: "Pythagoras",
    field: "Numerology",
    body: "The number system behind your life path, expression, and personal cycles.",
  },
  {
    name: "John Gottman",
    field: "Relationship science",
    body: "Evidence-based patterns behind compatibility and conflict style.",
  },
];

function SchoolCard({ s, delay, centered = false }) {
  return (
    <Reveal delay={delay}>
      <Card
        className={`h-full ${
          // На широких экранах карточка центрирована, на узких (мобильных)
          // содержимое перестраивается по левому краю.
          centered ? "sm:flex sm:flex-col sm:items-center sm:text-center" : ""
        }`}
      >
        <h3 className="font-heading text-lg font-semibold">{s.name}</h3>
        <p className="mt-1 text-xs uppercase tracking-wide text-accent-turquoise">
          {s.field}
        </p>
        <p className="mt-3 text-sm text-foreground-muted">{s.body}</p>
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
