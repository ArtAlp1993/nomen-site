import Link from "next/link";
import Card from "@/components/ui/Card";
import Footer from "@/components/Footer";
import legal from "@/data/legal.json";

export const metadata = {
  title: "Contact · NOMEN",
  description:
    "Reach NOMEN support at admin@nomen.website — questions about an order, a missing report, payments, refunds or your data. We reply within 24 hours.",
};

const REASONS = [
  {
    title: "Your report has not arrived",
    text: "Send your order code (#XXXXX) or the email you paid with. We reissue the private link, or refund you.",
  },
  {
    title: "Something in your data is wrong",
    text: "A misspelled name or the wrong birth date. We regenerate the report once, free of charge.",
  },
  {
    title: "A question about a payment",
    text: "A charge you do not recognise, a duplicate payment, or a payment that did not go through.",
  },
  {
    title: "A refund request",
    text: "See the Refund Policy for what we cover, then write to us — one email is enough, no form to fill in.",
  },
  {
    title: "Your personal data",
    text: "Ask for a copy of what we hold, a correction, or full deletion. We complete requests within 30 days.",
  },
  {
    title: "Anything else",
    text: "Questions about the methodology, press, partnerships, or a bug you spotted on the site.",
  },
];

export default function ContactPage() {
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
          Contact us
        </h1>
        <p className="mt-4 text-base leading-relaxed text-foreground-muted">
          NOMEN is a small team, and support is handled by a person, not a bot.
          Write to us about anything — before, during or after a purchase.
        </p>

        <Card className="mt-10">
          <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent-turquoise">
            Support email
          </span>
          <a
            href={`mailto:${legal.supportEmail}`}
            className="mt-3 block break-all font-heading text-2xl font-semibold text-foreground hover:text-accent-turquoise sm:text-3xl"
          >
            {legal.supportEmail}
          </a>
          <dl className="mt-6 grid gap-4 text-sm text-foreground-muted sm:grid-cols-3">
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground-muted/70">
                Support hours
              </dt>
              <dd className="mt-1">{legal.supportHours}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground-muted/70">
                Response time
              </dt>
              <dd className="mt-1">We reply {legal.responseTime}</dd>
            </div>
            <div>
              <dt className="font-mono text-[11px] uppercase tracking-[0.2em] text-foreground-muted/70">
                Website
              </dt>
              <dd className="mt-1">
                <a href={legal.siteUrl} className="hover:text-accent-turquoise">
                  {legal.siteName}
                </a>
              </dd>
            </div>
          </dl>
          <p className="mt-6 text-sm text-foreground-muted">
            Emails arriving outside support hours are answered on the next
            working day. Nothing goes unread.
          </p>
        </Card>

        <h2 className="mt-16 font-heading text-xl font-semibold sm:text-2xl">
          What people write to us about
        </h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {REASONS.map((reason) => (
            <Card key={reason.title}>
              <h3 className="font-heading text-base font-medium text-foreground">
                {reason.title}
              </h3>
              <p className="mt-2 text-sm text-foreground-muted">
                {reason.text}
              </p>
            </Card>
          ))}
        </div>

        <div className="mt-12 rounded-2xl border border-foreground-muted/20 bg-background-alt/60 p-6 text-sm text-foreground-muted backdrop-blur-md">
          <p>
            To make an answer faster, include your{" "}
            <strong className="text-foreground">order code (#XXXXX)</strong>{" "}
            from the checkout screen, or the email address you paid with.
          </p>
          <p className="mt-3">
            Business details: {legal.company}, {legal.country}.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/faq/" className="hover:text-accent-turquoise">
              FAQ
            </Link>
            <Link href="/refunds/" className="hover:text-accent-turquoise">
              Refund Policy
            </Link>
            <Link href="/delivery/" className="hover:text-accent-turquoise">
              Delivery Policy
            </Link>
            <Link href="/about/" className="hover:text-accent-turquoise">
              About us
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
