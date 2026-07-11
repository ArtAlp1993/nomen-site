import LegalPage from "@/components/ui/LegalPage";

export const metadata = { title: "Privacy Policy · NOMEN" };

export default function PrivacyPage() {
  return (
    <LegalPage title="Privacy Policy" updated="Draft, to be reviewed before launch">
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
        send you your free preview, your paid reading, and, if you agree,
        occasional follow-up emails about NOMEN. We do not sell or rent your
        personal information to third parties.
      </p>

      <p>
        <strong>Payments.</strong> You can pay either in cryptocurrency directly
        to our wallets, or in US dollars through Wise, a third-party payment
        service. We never see or store your card details. To match your payment
        to your order, we use the order details you provide (name, email)
        together with the payment amount and reference shown at checkout.
      </p>

      <p>
        <strong>Analytics.</strong> We use Yandex Metrica to understand how
        visitors use the site: pages viewed, clicks, scrolling, and anonymised
        session replays. Metrica sets cookies and processes this data on
        Yandex servers. We configure it so that anything you type into forms
        (your name, birth details, email) and your personal reading details
        are masked and never included in analytics data. You can opt out of
        Metrica tracking at{" "}
        <a
          href="https://yandex.com/support/metrica/general/opt-out.html"
          className="text-accent-turquoise hover:underline"
        >
          yandex.com/support/metrica
        </a>
        .
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
