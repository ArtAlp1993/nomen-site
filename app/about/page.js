import Link from "next/link";
import Card from "@/components/ui/Card";
import Footer from "@/components/Footer";
import legal from "@/data/legal.json";
import { operatorLine } from "@/lib/legal";

export const metadata = {
  title: "About NOMEN",
  description:
    "NOMEN is a digital platform that produces personalised personality reports from a name and a date of birth, using documented methods and named sources.",
};

const STEPS = [
  {
    n: "01",
    title: "You submit two things",
    text: "Your full name and your date of birth. Nothing else is required — no account, no address, no phone number.",
  },
  {
    n: "02",
    title: "The system calculates 13 points",
    text: "Nine numerology points, your sun sign, your Chinese zodiac animal and year element, and your tarot birth card. The arithmetic is deterministic: the same input always produces the same result.",
  },
  {
    n: "03",
    title: "Each point is interpreted",
    text: "The calculated values are written up into a readable profile — strengths, blind spots, work and money, relationships, the shape of your path.",
  },
  {
    n: "04",
    title: "You receive a private link",
    text: "The finished report is emailed to you as a private page on the site, normally within a few hours of a confirmed payment.",
  },
];

const VALUES = [
  {
    title: "Named sources, not mystique",
    text: "Every point traces back to a documented school: Pythagorean numerology, tropical astrology, the Chinese zodiac, tarot's major arcana, and psychological frameworks from Jung, Berne, Liz Greene and Gottman. We show the source instead of claiming the universe told us.",
  },
  {
    title: "No invented social proof",
    text: "NOMEN is a young product, and we do not publish reviews we did not receive or numbers we cannot back up. When we have real customer feedback, it will appear as real customer feedback.",
  },
  {
    title: "Entertainment and self-reflection",
    text: "A report is a structured way to think about yourself. It is not medical, psychological, financial or legal advice, and it does not predict the future. We say this before you pay, not in the small print afterwards.",
  },
  {
    title: "The least data we can work with",
    text: "A name, a date, an email. We never ask for card numbers or documents, and we do not sell data to anyone.",
  },
  {
    title: "Support that answers",
    text: `One address, ${legal.supportEmail}, read by a person. If something goes wrong with an order, we fix it or refund it.`,
  },
];

export default function AboutPage() {
  return (
    <>
      <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-20">
        <Link
          href="/"
          className="text-sm text-accent-turquoise hover:underline"
        >
          ← Back to NOMEN
        </Link>

        <h1 className="mt-6 font-heading text-3xl font-semibold sm:text-4xl">
          About NOMEN
        </h1>

        <div className="mt-6 flex flex-col gap-4 text-base leading-relaxed text-foreground-muted">
          <p>
            NOMEN is a digital platform that produces personalised personality
            reports. A customer submits their name and date of birth; our system
            calculates a 13-point profile using documented methods and delivers
            a written report to a private link by email.
          </p>
          <p>
            It is a single one-time purchase of ${legal.price} {legal.currency}{" "}
            — no subscription, no recurring charge, nothing physical to ship.
          </p>
          <p>
            Our mission is narrow and deliberate: take a field usually sold with
            vague promises, and run it like a software product — the same method
            for everyone, sources you can look up, a clear price, and a refund
            when we get it wrong.
          </p>
        </div>

        <h2 className="mt-16 font-heading text-xl font-semibold sm:text-2xl">
          How a report is produced
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {STEPS.map((step) => (
            <Card key={step.n}>
              <span className="font-mono text-sm text-accent-turquoise">
                {step.n}
              </span>
              <h3 className="mt-2 font-heading text-base font-medium text-foreground">
                {step.title}
              </h3>
              <p className="mt-2 text-sm text-foreground-muted">{step.text}</p>
            </Card>
          ))}
        </div>

        <h2 className="mt-16 font-heading text-xl font-semibold sm:text-2xl">
          What we hold ourselves to
        </h2>
        <div className="mt-6 flex flex-col gap-4">
          {VALUES.map((value) => (
            <Card key={value.title}>
              <h3 className="font-heading text-base font-medium text-foreground">
                {value.title}
              </h3>
              <p className="mt-2 text-sm text-foreground-muted">{value.text}</p>
            </Card>
          ))}
        </div>

        <h2 className="mt-16 font-heading text-xl font-semibold sm:text-2xl">
          Business details
        </h2>
        <div className="mt-4 rounded-2xl border border-foreground-muted/20 bg-background-alt/60 p-6 text-sm text-foreground-muted backdrop-blur-md">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground-muted/70">
                Operated by
              </dt>
              <dd className="mt-1">{operatorLine()}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground-muted/70">
                Category
              </dt>
              <dd className="mt-1">Personal development — digital reports</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground-muted/70">
                Website
              </dt>
              <dd className="mt-1">{legal.siteUrl}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground-muted/70">
                Support
              </dt>
              <dd className="mt-1">
                <a
                  href={`mailto:${legal.supportEmail}`}
                  className="hover:text-accent-turquoise"
                >
                  {legal.supportEmail}
                </a>
              </dd>
            </div>
          </dl>
          <div className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/contact/" className="hover:text-accent-turquoise">
              Contact
            </Link>
            <Link href="/faq/" className="hover:text-accent-turquoise">
              FAQ
            </Link>
            <Link href="/terms/" className="hover:text-accent-turquoise">
              Terms of Service
            </Link>
            <Link href="/privacy/" className="hover:text-accent-turquoise">
              Privacy Policy
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
