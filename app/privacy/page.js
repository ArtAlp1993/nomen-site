import Link from "next/link";
import LegalPage from "@/components/ui/LegalPage";
import legal from "@/data/legal.json";

export const metadata = {
  title: "Privacy Policy · NOMEN",
  description:
    "What data NOMEN collects, why we collect it, who processes it, how long we keep it, and how to exercise your rights over it.",
};

const mail = (
  <a
    href={`mailto:${legal.supportEmail}`}
    className="text-accent-turquoise hover:underline"
  >
    {legal.supportEmail}
  </a>
);

const sections = [
  {
    id: "who-we-are",
    title: "Who we are",
    body: (
      <>
        <p>
          {legal.siteName} is operated by {legal.company}, {legal.country}. We
          sell personalised personality reports, and this policy explains what
          happens to the data you give us along the way.
        </p>
        <p>
          For questions about your data, or to exercise any of the rights
          described below, write to {mail}. We answer {legal.responseTime}.
        </p>
      </>
    ),
  },
  {
    id: "what-we-collect",
    title: "What we collect",
    body: (
      <>
        <ul className="ml-5 flex list-disc flex-col gap-2">
          <li>
            <strong className="text-foreground">
              Your name and date of birth.
            </strong>{" "}
            These are the inputs to your report — without them there is nothing
            to calculate.
          </li>
          <li>
            <strong className="text-foreground">Your email address.</strong>{" "}
            Used to send your free preview and the private link to your paid
            report, and to answer you if you contact support.
          </li>
          <li>
            <strong className="text-foreground">Order information.</strong> The
            order code, amount, payment method and the date of purchase, so we
            can match a payment to an order.
          </li>
          <li>
            <strong className="text-foreground">
              Photographs, only if you send them.
            </strong>{" "}
            Some add-ons in development read a photo of your hand. Nothing of
            the kind is collected unless you deliberately send it.
          </li>
          <li>
            <strong className="text-foreground">Technical data.</strong> Pages
            viewed, clicks, approximate location by IP, browser and device type,
            and the campaign or link that brought you to the site.
          </li>
        </ul>
        <p>
          We never ask for your card number, government ID, address or phone
          number, and we have no way to receive them.
        </p>
      </>
    ),
  },
  {
    id: "why",
    title: "Why we use it, and on what basis",
    body: (
      <>
        <ul className="ml-5 flex list-disc flex-col gap-2">
          <li>
            <strong className="text-foreground">
              To deliver what you ordered
            </strong>{" "}
            — calculating and sending your report. Legal basis: performance of a
            contract with you.
          </li>
          <li>
            <strong className="text-foreground">To support you</strong> —
            answering emails, reissuing links, handling refunds. Legal basis:
            performance of a contract and our legitimate interest in running a
            working service.
          </li>
          <li>
            <strong className="text-foreground">
              To keep the site working and improve it
            </strong>{" "}
            — anonymised analytics and error diagnosis. Legal basis: legitimate
            interest.
          </li>
          <li>
            <strong className="text-foreground">
              To send occasional emails about NOMEN
            </strong>{" "}
            — only if you asked for them. Legal basis: your consent,
            withdrawable at any time from the unsubscribe link in every email.
          </li>
        </ul>
        <p>
          We do not sell, rent or trade your personal information, and we do not
          use it for automated decisions with legal effects on you.
        </p>
      </>
    ),
  },
  {
    id: "payments",
    title: "Payment information",
    body: (
      <>
        <p>
          Card payments are processed by Stripe. Your card details are entered
          on Stripe&apos;s own payment form and go straight to Stripe — they
          never pass through our site and we never see or store them. We receive
          only the confirmation that a payment succeeded, the amount, and the
          last digits of the card.
        </p>
        <p>
          We also accept a USD transfer via Wise and payment in cryptocurrency.
          In those cases we see what the payment network shows us: the sender
          reference, the amount, and, for crypto, the public wallet address of
          the transaction.
        </p>
        <p>
          Stripe and Wise are independent controllers of the data they collect
          and apply their own privacy policies.
        </p>
      </>
    ),
  },
  {
    id: "cookies-analytics",
    title: "Cookies and analytics",
    body: (
      <>
        <p>
          We use Yandex Metrica to understand how visitors use the site: pages
          viewed, clicks, scrolling and anonymised session replays. Metrica sets
          cookies and processes this data on Yandex servers.
        </p>
        <p>
          It is configured so that anything you type into a form — your name,
          birth details, email — and the contents of your personal reading are
          masked, and never included in analytics data. You can opt out of
          Metrica tracking entirely at{" "}
          <a
            href="https://yandex.com/support/metrica/general/opt-out.html"
            className="text-accent-turquoise hover:underline"
          >
            yandex.com/support/metrica
          </a>
          .
        </p>
        <p>
          The site also stores small amounts of data in your browser
          (localStorage) — your quiz answers and order code — so you do not lose
          your progress when you reload the page. That data stays on your device
          and you can clear it through your browser settings.
        </p>
      </>
    ),
  },
  {
    id: "third-parties",
    title: "Who else processes your data",
    body: (
      <>
        <p>
          We keep this list short deliberately. Every service below processes
          data only to make NOMEN work:
        </p>
        <ul className="ml-5 flex list-disc flex-col gap-2">
          <li>
            <strong className="text-foreground">Stripe</strong> — card payment
            processing.
          </li>
          <li>
            <strong className="text-foreground">Wise</strong> — USD bank
            transfers.
          </li>
          <li>
            <strong className="text-foreground">Resend</strong> — sending your
            report and support email.
          </li>
          <li>
            <strong className="text-foreground">Yandex Metrica</strong> — site
            analytics (masked, as described above).
          </li>
          <li>
            <strong className="text-foreground">GitHub Pages</strong> — hosting
            of the website itself.
          </li>
          <li>
            <strong className="text-foreground">
              Our own order system, and Telegram
            </strong>{" "}
            — a new order creates an internal record and a private notification
            so a human can confirm the payment and send your report.
          </li>
        </ul>
        <p>
          These providers operate in different countries, so your data may be
          processed outside your own. We rely on the providers&apos; standard
          contractual safeguards for those transfers.
        </p>
      </>
    ),
  },
  {
    id: "retention",
    title: "How long we keep it",
    body: (
      <>
        <ul className="ml-5 flex list-disc flex-col gap-2">
          <li>
            Report data and the report itself: kept for at least 24 months after
            your purchase, so your private link keeps working and you can
            revisit it.
          </li>
          <li>
            Order and payment records: kept as long as required for accounting
            and dispute resolution, typically up to 5 years.
          </li>
          <li>
            Support correspondence: up to 24 months after the conversation ends.
          </li>
          <li>
            Analytics data: retained by Yandex Metrica according to its own
            retention schedule.
          </li>
        </ul>
        <p>You can ask us to delete your data sooner — see the next section.</p>
      </>
    ),
  },
  {
    id: "your-rights",
    title: "Your rights",
    body: (
      <>
        <p>You can ask us at any time to:</p>
        <ul className="ml-5 flex list-disc flex-col gap-2">
          <li>tell you what data about you we hold, and give you a copy;</li>
          <li>correct anything that is wrong;</li>
          <li>
            delete your data (we will do so unless we are legally required to
            keep a payment record);
          </li>
          <li>
            restrict or object to a particular use, including direct marketing;
          </li>
          <li>send your data to you or another provider in a portable form;</li>
          <li>withdraw a consent you gave earlier.</li>
        </ul>
        <p>
          Write to {mail} — one email is enough, no special form. We respond{" "}
          {legal.responseTime}, and complete the request within 30 days. If you
          are in the EU or UK and believe we have handled your data badly, you
          also have the right to complain to your national data-protection
          authority.
        </p>
      </>
    ),
  },
  {
    id: "security",
    title: "Security",
    body: (
      <>
        <p>
          The site is served over HTTPS only, and a Content Security Policy
          restricts where the page may send data. Access to order data is
          limited to the people who run NOMEN. Card data never reaches our
          systems at all.
        </p>
        <p>
          No service can promise perfect security. If a breach ever affects your
          data, we will tell you and the relevant authority without undue delay.
        </p>
      </>
    ),
  },
  {
    id: "children",
    title: "Children",
    body: (
      <p>
        NOMEN is not intended for anyone under {legal.minimumAge}. We do not
        knowingly collect data from children. If you believe a child has sent us
        their data, write to {mail} and we will delete it.
      </p>
    ),
  },
  {
    id: "changes",
    title: "Changes to this policy",
    body: (
      <p>
        When this policy changes, we update the date at the top of the page. If
        a change materially affects how we use your data, we will say so on the
        site before it takes effect.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <p>
          {legal.company}, {legal.country}
          <br />
          Website: {legal.siteUrl}
          <br />
          Email: {mail}
        </p>
        <p>
          Prefer a wider overview of how to reach us? See our{" "}
          <Link
            href="/contact/"
            className="text-accent-turquoise hover:underline"
          >
            Contact page
          </Link>
          .
        </p>
      </>
    ),
  },
];

export default function PrivacyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      intro="We collect as little as the product allows: your name, your date of birth, and an email address to send the result to. This page explains exactly what happens to it."
      sections={sections}
    />
  );
}
