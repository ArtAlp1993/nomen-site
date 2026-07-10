import LegalPage from "@/components/ui/LegalPage";

export const metadata = { title: "Privacy Policy — NOMEN" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="Draft — to be reviewed before launch">
      <p>
        This is an early draft of our Privacy Policy, written in plain
        language while NOMEN is in development. It should be reviewed by a
        qualified professional before the site accepts real payments.
      </p>

      <p>
        <strong>What we collect.</strong> When you use the free preview or
        purchase a reading, we collect the first and last name you provide,
        the birth date you provide, and your email address. If you purchase a
        palmistry reading, we also collect the photo(s) you send us.
      </p>

      <p>
        <strong>Why we collect it.</strong> Your name and birth date are used
        only to calculate your personality reading. Your email is used to
        send you your free preview, your paid reading, and — if you agree —
        occasional follow-up emails about NOMEN. We do not sell or rent your
        personal information to third parties.
      </p>

      <p>
        <strong>Payments.</strong> Card payments are processed by Stripe;
        crypto payments (when available) are processed by our crypto payment
        provider. We never see or store your full card details — that
        information goes directly to our payment processor.
      </p>

      <p>
        <strong>How long we keep it.</strong> We retain your reading data for
        as long as needed to deliver your purchase and respond to support
        requests. You can request deletion of your data at any time by
        emailing us.
      </p>

      <p>
        <strong>Your choices.</strong> You can unsubscribe from marketing
        emails at any time using the link in any email we send. To request
        access to, correction of, or deletion of your data, contact us at{" "}
        <a href="mailto:hello@nomen.example" className="text-accent-turquoise hover:underline">
          hello@nomen.example
        </a>
        .
      </p>
    </LegalPage>
  );
}
