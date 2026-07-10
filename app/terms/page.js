import LegalPage from "@/components/ui/LegalPage";

export const metadata = { title: "Terms of Service — NOMEN" };

export default function TermsPage() {
  return (
    <LegalPage title="Terms of Service" updated="Draft — to be reviewed before launch">
      <p>
        This is an early draft of our Terms of Service, written while NOMEN
        is in development. It should be reviewed by a qualified professional
        before the site accepts real payments.
      </p>

      <p>
        <strong>What NOMEN is.</strong> NOMEN provides personality readings
        based on numerology, astrology, psychology and palmistry, generated
        from the name, birth date and (optionally) hand photos you provide.
        Readings are offered for entertainment and self-reflection purposes.
        They are not a substitute for professional medical, psychological,
        financial or legal advice.
      </p>

      <p>
        <strong>Accuracy.</strong> We aim to calculate every point using a
        documented, named methodology, and we're transparent about our
        sources. That said, personality readings are interpretive by nature —
        we make no guarantee that any reading is fully accurate for you.
      </p>

      <p>
        <strong>Delivery.</strong> Paid readings are delivered by email after
        your payment is confirmed. Because payments are settled and verified
        manually, delivery typically takes a few hours rather than minutes. If
        you haven&apos;t received your reading, contact us and we&apos;ll follow up.
      </p>

      <p>
        <strong>Payments and refunds.</strong> All prices are in US dollars and
        paid in cryptocurrency directly to our wallets — there is no third-party
        payment provider, and we never take custody of your card or bank details.
        Each payment is confirmed manually before your reading is sent. If
        something goes wrong with your order, email us before requesting a
        refund so we can make it right.
      </p>

      <p>
        <strong>Age.</strong> NOMEN is intended for users 18 years and older.
      </p>

      <p>
        <strong>Contact.</strong> Questions about these terms can be sent to{" "}
        <a href="mailto:hello@nomen.example" className="text-accent-turquoise hover:underline">
          hello@nomen.example
        </a>
        .
      </p>
    </LegalPage>
  );
}
