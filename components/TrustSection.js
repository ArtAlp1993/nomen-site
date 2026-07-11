import Card from "./ui/Card";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";

export default function TrustSection() {
  return (
    <section className="mx-auto max-w-4xl px-6 py-24 text-center sm:py-32">
      <SectionHeading
        eyebrow="Where we stand today"
        title="We'd rather be honest than impressive"
        subtitle="NOMEN is new. We're not going to invent reviews to prove a point. The methodology speaks for itself, and here's exactly where we are."
      />

      <Reveal delay={0.1}>
        <Card className="mt-12 text-left sm:text-center">
          <p className="text-sm text-foreground-muted">
            Our short-form breakdowns of well-known public figures run on the
            exact same 13-point method behind your reading. That's the same
            engine you just tried above, not a different one for marketing.
          </p>
        </Card>
      </Reveal>
    </section>
  );
}
