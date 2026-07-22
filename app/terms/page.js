import Link from "next/link";
import LegalPage from "@/components/ui/LegalPage";
import legal from "@/data/legal.json";
import { governingLawText, operatorLine } from "@/lib/legal";

export const metadata = {
  title: "Terms of Service · NOMEN",
  description:
    "The agreement between NOMEN and its customers: what we sell, how it is delivered, payment, refunds, acceptable use and liability.",
};

const mail = (
  <a
    href={`mailto:${legal.supportEmail}`}
    className="text-accent-turquoise hover:underline"
  >
    {legal.supportEmail}
  </a>
);

function InternalLink({ href, children }) {
  return (
    <Link href={href} className="text-accent-turquoise hover:underline">
      {children}
    </Link>
  );
}

const sections = [
  {
    id: "acceptance",
    title: "Acceptance of these terms",
    body: (
      <>
        <p>
          {/* Пунктуация сразу после {legal.siteName} — не случайность: если
              следом идёт слово через пробел, Prettier переносит строку, JSX
              срезает пробел на границе, и печатается «nomen.websiteand».
              Сторож scripts/verify-legal.mjs ловит такие стыки. */}
          These Terms of Service (the &quot;Terms&quot;) govern your use of{" "}
          {legal.siteName}, and everything we sell through it (the
          &quot;Service&quot;). The Service is operated by {operatorLine()}.
        </p>
        <p>
          By using the site, requesting a free preview or placing an order, you
          agree to these Terms. If you do not agree with them, please do not use
          the Service.
        </p>
        <p>
          We may update these Terms as the product changes. The date at the top
          of this page always shows the current version. Orders are governed by
          the version that was published when the order was placed.
        </p>
      </>
    ),
  },
  {
    id: "service",
    title: "What we provide",
    body: (
      <>
        <p>
          NOMEN produces personalised personality reports. You submit your name
          and date of birth; our system calculates a 13-point profile and writes
          it up as a report delivered to a private link by email.
        </p>
        <p>
          Every point is derived from a documented method — Pythagorean
          numerology, tropical astrology, the Chinese zodiac and tarot birth
          cards — combined with psychological frameworks. We name our sources
          rather than presenting the result as revealed truth.
        </p>
        <p>
          <strong className="text-foreground">
            Reports are provided for entertainment and self-reflection.
          </strong>{" "}
          They are interpretive by nature. They are not, and must not be used
          as, medical, psychological, financial or legal advice, and they are
          not a prediction of future events. We make no guarantee that any part
          of a report is factually accurate about you.
        </p>
        <p>
          A free preview is available on the site. It is a shortened sample of
          the paid report and is provided as-is.
        </p>
      </>
    ),
  },
  {
    id: "eligibility",
    title: "Eligibility and your responsibilities",
    body: (
      <>
        <p>
          You must be at least {legal.minimumAge} years old to purchase from
          NOMEN. By ordering, you confirm that you meet this requirement.
        </p>
        <p>
          Your report is calculated from what you type in. You are responsible
          for entering your name, date of birth and email address correctly. If
          a mistake is ours, we fix it and, if you prefer, refund you. If the
          data you supplied was wrong, write to us — we will regenerate the
          report once at no charge.
        </p>
        <p>
          If you order a report about another person, you confirm that you have
          their permission to submit their details.
        </p>
      </>
    ),
  },
  {
    id: "payment",
    title: "Prices and payment",
    body: (
      <>
        <p>
          All prices are shown in {legal.currency} and stated on the site before
          you pay. A full reading currently costs ${legal.price}. Prices may
          change, but never for an order already placed.
        </p>
        <p>
          Payments are processed by third-party providers. Card payments are
          handled by Stripe; we also accept a USD transfer via Wise and payment
          in cryptocurrency. We never receive or store your card number — it
          goes directly to the payment processor.
        </p>
        <p>
          Depending on where you live, your bank or payment provider may add
          conversion fees. Those are outside our control.
        </p>
      </>
    ),
  },
  {
    id: "delivery",
    title: "Delivery",
    body: (
      <>
        <p>
          Everything we sell is digital. Nothing is shipped physically. Once
          your payment is confirmed, we email a private link to your report at
          the address you gave at checkout — normally within a few hours, and in
          all cases within 24 hours.
        </p>
        <p>
          Full detail, including what to do if your report does not arrive, is
          in our <InternalLink href="/delivery/">Delivery Policy</InternalLink>.
        </p>
      </>
    ),
  },
  {
    id: "refunds",
    title: "Refunds",
    body: (
      <>
        <p>
          We refund duplicate payments, technical failures, orders that were
          never delivered, and reports spoiled by an error on our side. A
          delivered, correct personalised report is generally non-refundable,
          because it is produced specifically for you and cannot be returned.
        </p>
        <p>
          The full policy, including how to request a refund and how long it
          takes, is on our{" "}
          <InternalLink href="/refunds/">Refund Policy</InternalLink> page.
        </p>
      </>
    ),
  },
  {
    id: "ip",
    title: "Intellectual property",
    body: (
      <>
        <p>
          The site, its texts, visuals, calculation methods and report templates
          belong to NOMEN. You may not copy, resell, republish or redistribute
          them, or use them to build a competing service.
        </p>
        <p>
          Your report is yours: you may read it, save it, print it and share it
          with people you choose. What you may not do is sell it or present it
          as your own product.
        </p>
      </>
    ),
  },
  {
    id: "acceptable-use",
    title: "Acceptable use",
    body: (
      <>
        <p>You agree not to:</p>
        <ul className="ml-5 flex list-disc flex-col gap-2">
          <li>
            attempt to break, overload, scrape or reverse-engineer the Service;
          </li>
          <li>
            submit someone else&apos;s personal data without their permission;
          </li>
          <li>
            use NOMEN to harass, profile or make decisions about other people;
          </li>
          <li>resell our reports or present our methodology as your own;</li>
          <li>pay with a card or account you are not authorised to use.</li>
        </ul>
      </>
    ),
  },
  {
    id: "liability",
    title: "Disclaimer and limitation of liability",
    body: (
      <>
        <p>
          The Service is provided &quot;as is&quot;. We do not warrant that it
          will be uninterrupted or error-free, or that a report will meet your
          expectations.
        </p>
        <p>
          To the fullest extent permitted by law, our total liability for any
          claim connected to the Service is limited to the amount you paid for
          the order in question. We are not liable for indirect or consequential
          loss, or for decisions you make on the basis of a report.
        </p>
        <p>
          Nothing in these Terms limits any right you have under mandatory
          consumer-protection law in your country.
        </p>
      </>
    ),
  },
  {
    id: "termination",
    title: "Suspension and termination",
    body: (
      <>
        <p>
          We may refuse an order or suspend access if these Terms are broken, if
          a payment is fraudulent, or if the Service is being abused. Where an
          order is refused and payment was taken, we refund it in full.
        </p>
        <p>
          You can stop using the Service at any time and ask us to delete your
          data — see our{" "}
          <InternalLink href="/privacy/">Privacy Policy</InternalLink>.
        </p>
      </>
    ),
  },
  {
    id: "law",
    title: "Governing law",
    body: (
      <p>
        {governingLawText()} Before going anywhere else, please write to us —
        nearly everything is solved by one email.
      </p>
    ),
  },
  {
    id: "contact",
    title: "Contact",
    body: (
      <>
        <p>
          {operatorLine()}
          <br />
          Website: {legal.siteUrl}
          <br />
          Email: {mail}
        </p>
        <p>
          Support hours: {legal.supportHours}. We reply {legal.responseTime}.
        </p>
      </>
    ),
  },
];

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms of Service"
      intro="These terms describe what NOMEN sells, how a purchase works, and what you can expect from us. We have kept them in plain English on purpose."
      sections={sections}
    />
  );
}
