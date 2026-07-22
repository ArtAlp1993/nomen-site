import Link from "next/link";
import Footer from "@/components/Footer";
import legal from "@/data/legal.json";
import faq from "@/data/faq.json";
import faqSupport from "@/data/faq-support.json";

export const metadata = {
  title: "FAQ · NOMEN",
  description:
    "Answers about NOMEN readings: what is included, how long delivery takes, payment methods, refunds, data security and how to reach support.",
};

// Отдельная страница FAQ — в отличие от аккордеона на главной, здесь все
// ответы раскрыты сразу: страницу читают целиком (в том числе проверяющие
// платёжных систем), и прятать текст за кликом незачем. Источник вопросов
// общий с главной (data/faq.json), сервисный блок — data/faq-support.json,
// дублей текста нет.
function Group({ heading, items }) {
  return (
    <section className="mt-14">
      <h2 className="font-heading text-xl font-semibold sm:text-2xl">
        {heading}
      </h2>
      <dl className="mt-6 flex flex-col divide-y divide-foreground-muted/15 border-t border-foreground-muted/15">
        {items.map((item) => (
          <div key={item.question} className="py-6">
            <dt className="font-heading text-base font-medium text-foreground sm:text-lg">
              {item.question}
            </dt>
            <dd className="mt-3 text-sm leading-relaxed text-foreground-muted sm:text-base">
              {item.answer}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export default function FaqPage() {
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
          Frequently asked questions
        </h1>
        <p className="mt-4 text-base leading-relaxed text-foreground-muted">
          The product, the method, and everything around an order. If your
          question is not here, write to{" "}
          <a
            href={`mailto:${legal.supportEmail}`}
            className="text-accent-turquoise hover:underline"
          >
            {legal.supportEmail}
          </a>{" "}
          — we reply {legal.responseTime}.
        </p>

        <Group heading="The reading itself" items={faq} />
        <Group heading="Orders, payment and support" items={faqSupport} />

        <div className="mt-16 rounded-2xl border border-foreground-muted/20 bg-background-alt/60 p-6 text-sm text-foreground-muted backdrop-blur-md">
          <p>The detail behind these answers lives on our policy pages:</p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/delivery/" className="hover:text-accent-turquoise">
              Delivery Policy
            </Link>
            <Link href="/refunds/" className="hover:text-accent-turquoise">
              Refund Policy
            </Link>
            <Link href="/privacy/" className="hover:text-accent-turquoise">
              Privacy Policy
            </Link>
            <Link href="/terms/" className="hover:text-accent-turquoise">
              Terms of Service
            </Link>
            <Link href="/contact/" className="hover:text-accent-turquoise">
              Contact
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  );
}
