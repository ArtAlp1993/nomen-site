import Link from "next/link";
import LegalPage from "@/components/ui/LegalPage";
import legal from "@/data/legal.json";

export const metadata = {
  title: "Delivery Policy · NOMEN",
  description:
    "How NOMEN reports are delivered: digital only, by email, as a private link — normally within a few hours and always within 24 hours of a confirmed payment.",
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
    id: "digital-only",
    title: "Digital delivery only",
    body: (
      <>
        <p>
          Everything NOMEN sells is digital. Nothing is printed, packed or
          shipped, there are no delivery charges, no customs and no address to
          enter at checkout.
        </p>
        <p>
          Your report is delivered as a private link on {legal.siteName},
          emailed to the address you gave when ordering. The link stays yours:
          you can reopen it whenever you like, on any device.
        </p>
      </>
    ),
  },
  {
    id: "timing",
    title: "How long it takes",
    body: (
      <>
        <p>
          Delivery starts once your payment is confirmed. In practice that
          means:
        </p>
        <ul className="ml-5 flex list-disc flex-col gap-2">
          <li>
            <strong className="text-foreground">
              Free preview — immediately.
            </strong>{" "}
            It appears on screen as soon as you finish the form, before any
            payment.
          </li>
          <li>
            <strong className="text-foreground">
              Paid report — usually within a few hours.
            </strong>{" "}
            Each payment is checked before the report is sent, so delivery is
            not instantaneous.
          </li>
          <li>
            <strong className="text-foreground">
              In every case, within 24 hours.
            </strong>{" "}
            If 24 hours pass without your report arriving, that counts as
            non-delivery and you are entitled to a full refund.
          </li>
        </ul>
        <p>
          We would rather promise a few hours and beat it than promise
          &quot;instant&quot; and miss.
        </p>
      </>
    ),
  },
  {
    id: "delays",
    title: "What can delay a delivery",
    body: (
      <>
        <ul className="ml-5 flex list-disc flex-col gap-2">
          <li>
            <strong className="text-foreground">
              A mistyped email address
            </strong>{" "}
            — the most common cause by far. The report is generated, but goes
            nowhere.
          </li>
          <li>
            <strong className="text-foreground">Spam filtering.</strong> Our
            email can land in Spam or Promotions, particularly with corporate
            mailboxes.
          </li>
          <li>
            <strong className="text-foreground">
              A payment awaiting confirmation.
            </strong>{" "}
            Bank transfers and some crypto networks take longer to settle than a
            card payment.
          </li>
          <li>
            <strong className="text-foreground">
              Incomplete order details
            </strong>{" "}
            — if the name or date is missing, we email you to ask before we can
            calculate anything.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "not-arrived",
    title: "If your report has not arrived",
    body: (
      <>
        <ol className="ml-5 flex list-decimal flex-col gap-2">
          <li>
            Check your Spam and Promotions folders, and search your mailbox for
            &quot;NOMEN&quot;.
          </li>
          <li>
            Email {mail} with your order code (#XXXXX) or the email address you
            paid with.
          </li>
          <li>
            We reissue the link at no extra cost — or refund you in full if you
            prefer. Your choice, not ours. To protect your report, we resend it
            to the address the order was placed with.
          </li>
        </ol>
        <p>
          Support is available {legal.supportHours}, and we reply{" "}
          {legal.responseTime}.
        </p>
      </>
    ),
  },
  {
    id: "keeping-access",
    title: "Keeping access to your report",
    body: (
      <>
        <p>
          Bookmark your private link and it keeps working — we keep reports
          available for at least 24 months after purchase (retention detail is
          in our{" "}
          <Link
            href="/privacy/"
            className="text-accent-turquoise hover:underline"
          >
            Privacy Policy
          </Link>
          ). Treat the link as personal: anyone who has it can read the report.
        </p>
        <p>
          Lost the link? Write to {mail} from the address you ordered with and
          we will send it again.
        </p>
      </>
    ),
  },
  {
    id: "related",
    title: "Related pages",
    body: (
      <p>
        Refund conditions are set out in our{" "}
        <Link
          href="/refunds/"
          className="text-accent-turquoise hover:underline"
        >
          Refund Policy
        </Link>
        ; the full agreement is in our{" "}
        <Link href="/terms/" className="text-accent-turquoise hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    ),
  },
];

export default function DeliveryPage() {
  return (
    <LegalPage
      title="Delivery Policy"
      intro="NOMEN reports are digital and arrive by email as a private link — normally within a few hours of a confirmed payment, and always within 24 hours."
      sections={sections}
    />
  );
}
