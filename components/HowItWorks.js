import Card from "./ui/Card";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";

const steps = [
  {
    step: "01",
    title: "Tell us who you are",
    body: "Your name and birth date — that's all the blueprint needs to start.",
  },
  {
    step: "02",
    title: "See a free preview",
    body: "We calculate a handful of your 13 points live and show you exactly what we found.",
  },
  {
    step: "03",
    title: "Unlock your full reading",
    body: "Once we confirm your payment on-chain, we email you a personal link to your full 13-point reading — usually within a few hours.",
  },
];

export default function HowItWorks() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
      <SectionHeading
        eyebrow="How it works"
        title="Three steps to your blueprint"
        subtitle="No app, no account — just your name, your birth date, and a few minutes."
      />

      <div className="mt-16 grid gap-6 sm:grid-cols-3">
        {steps.map((s, i) => (
          <Reveal key={s.step} delay={i * 0.1}>
            <Card className="h-full">
              <span className="font-heading text-sm text-accent-turquoise">
                {s.step}
              </span>
              <h3 className="mt-3 font-heading text-xl font-semibold">
                {s.title}
              </h3>
              <p className="mt-2 text-sm text-foreground-muted">{s.body}</p>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
