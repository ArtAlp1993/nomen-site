import Link from "next/link";
import LegalPage from "@/components/ui/LegalPage";
import legal from "@/data/legal.json";

export const metadata = {
  title: "Refund Policy · NOMEN",
  description:
    "When NOMEN refunds a purchase, when it does not, and exactly how to request a refund. Digital reports, one-time payments, no subscriptions.",
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
    id: "what-you-buy",
    title: "What you are buying",
    body: (
      <>
        <p>
          NOMEN sells digital reports. Each one is generated specifically from
          the name and date of birth you submit, delivered by email as a private
          link, and cannot be returned or resold once it has been produced.
        </p>
        <p>
          Every purchase is a single one-time payment of ${legal.price}{" "}
          {legal.currency}. There are no subscriptions, no recurring charges and
          no automatic renewals, so there is nothing to cancel.
        </p>
      </>
    ),
  },
  {
    id: "we-refund",
    title: "When we refund you",
    body: (
      <>
        <p>We refund in full, without argument, in all of these cases:</p>
        <ul className="ml-5 flex list-disc flex-col gap-2">
          <li>
            <strong className="text-foreground">Duplicate payment.</strong> You
            were charged twice for the same order — we return the extra charge.
          </li>
          <li>
            <strong className="text-foreground">
              Payment taken without an order.
            </strong>{" "}
            A charge you do not recognise, or a payment that went through while
            the order failed.
          </li>
          <li>
            <strong className="text-foreground">Report never delivered.</strong>{" "}
            More than 24 hours have passed since your payment cleared and no
            report reached you.
          </li>
          <li>
            <strong className="text-foreground">Technical failure.</strong> The
            report is broken, incomplete, unreadable, or the private link does
            not open — and we cannot fix it for you.
          </li>
          <li>
            <strong className="text-foreground">
              Our mistake in your data.
            </strong>{" "}
            The report was calculated from the wrong name or date because of an
            error on our side. We will regenerate it, and refund instead if you
            prefer.
          </li>
        </ul>
      </>
    ),
  },
  {
    id: "we-dont-refund",
    title: "When we normally cannot refund",
    body: (
      <>
        <p>
          Because a report is written specifically for you and delivered as a
          private link, a correct, successfully delivered report is generally
          non-refundable. In particular:
        </p>
        <ul className="ml-5 flex list-disc flex-col gap-2">
          <li>
            you read the report and disagreed with the interpretation — reports
            are interpretive by nature, and we say so before you buy;
          </li>
          <li>
            you mistyped your own name or birth date — write to us instead and
            we will regenerate the report once, free of charge;
          </li>
          <li>you changed your mind after reading the full report;</li>
          <li>
            the request arrives more than 60 days after the purchase, which is
            beyond what our payment providers allow us to reverse.
          </li>
        </ul>
        <p>
          This is not a hard wall. If your situation sits somewhere between the
          two lists, write to us and describe it — we would rather resolve a
          genuine complaint than win an argument over ${legal.price}.
        </p>
      </>
    ),
  },
  {
    id: "how-to-request",
    title: "How to request a refund",
    body: (
      <>
        <p>Send one email to {mail} with:</p>
        <ul className="ml-5 flex list-disc flex-col gap-2">
          <li>
            your order code (the #XXXXX shown at checkout), or the email address
            you paid with;
          </li>
          <li>the date and amount of the payment;</li>
          <li>one line about what went wrong.</li>
        </ul>
        <p>
          We reply {legal.responseTime}. Approved refunds are returned through
          the original payment method — the same card, the same Wise account, or
          the same crypto wallet the payment came from. Card refunds usually
          appear within 5–10 business days, depending on your bank.
        </p>
        <p>
          Refunds are issued in {legal.currency} for the amount you paid. If
          your bank applied a currency conversion, the converted amount may
          differ slightly from what you originally saw — that part is outside
          our control.
        </p>
      </>
    ),
  },
  {
    id: "before-chargeback",
    title: "Please write to us before a chargeback",
    body: (
      <>
        <p>
          If something went wrong, one email fixes it faster than a bank dispute
          — usually the same day. A chargeback takes weeks, and it stops us from
          helping you in the meantime.
        </p>
        <p>
          Every request is read by a person and judged on its merits. If you are
          owed money back, you get it back.
        </p>
      </>
    ),
  },
  {
    id: "related",
    title: "Related pages",
    body: (
      <p>
        Delivery times and what to do if your report has not arrived are covered
        in the{" "}
        <Link
          href="/delivery/"
          className="text-accent-turquoise hover:underline"
        >
          Delivery Policy
        </Link>
        . The full agreement is in our{" "}
        <Link href="/terms/" className="text-accent-turquoise hover:underline">
          Terms of Service
        </Link>
        .
      </p>
    ),
  },
];

export default function RefundsPage() {
  return (
    <LegalPage
      title="Refund Policy"
      intro="Short version: if we took your money and you did not get what you paid for, you get it back. Here is the detail, including the cases where we cannot refund and what to do instead."
      sections={sections}
    />
  );
}
