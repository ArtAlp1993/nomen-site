import Link from "next/link";
import Footer from "@/components/Footer";
import legal from "@/data/legal.json";

// Каркас юридических страниц (Terms / Privacy / Refunds / Delivery).
// Два режима:
//   sections=[{id, title, body}] — с автооглавлением и якорями (для длинных
//     документов: проверяющему платёжной системы нужно быстро найти раздел);
//   children — плоский режим, оставлен для обратной совместимости.
export default function LegalPage({
  title,
  intro,
  updated,
  sections,
  children,
}) {
  const list = sections || [];
  const showToc = list.length >= 5;

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
          {title}
        </h1>
        <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-foreground-muted">
          Last updated: {updated || legal.updated}
        </p>

        {intro && (
          <p className="mt-6 text-base leading-relaxed text-foreground-muted">
            {intro}
          </p>
        )}

        {showToc && (
          <nav
            aria-label="Contents"
            className="mt-10 rounded-2xl border border-foreground-muted/20 bg-background-alt/60 p-6 backdrop-blur-md"
          >
            <span className="font-mono text-xs uppercase tracking-[0.3em] text-accent-turquoise">
              Contents
            </span>
            <ol className="mt-4 grid gap-2 text-sm text-foreground-muted sm:grid-cols-2">
              {list.map((section, i) => (
                <li key={section.id}>
                  <a
                    href={`#${section.id}`}
                    className="transition-colors hover:text-accent-turquoise"
                  >
                    <span className="font-mono text-xs text-foreground-muted/60">
                      {String(i + 1).padStart(2, "0")}
                    </span>{" "}
                    {section.title}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        )}

        {list.length > 0 && (
          <div className="mt-12 flex flex-col gap-10">
            {list.map((section, i) => (
              <section
                key={section.id}
                id={section.id}
                className="scroll-mt-24"
              >
                <h2 className="font-heading text-xl font-semibold sm:text-2xl">
                  <span className="mr-3 font-mono text-sm text-accent-turquoise">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {section.title}
                </h2>
                <div className="mt-4 flex flex-col gap-4 text-sm leading-relaxed text-foreground-muted sm:text-base">
                  {section.body}
                </div>
              </section>
            ))}
          </div>
        )}

        {children && (
          <div className="mt-8 flex flex-col gap-5 text-sm leading-relaxed text-foreground-muted">
            {children}
          </div>
        )}

        <div className="mt-16 rounded-2xl border border-foreground-muted/20 bg-background-alt/60 p-6 text-sm text-foreground-muted backdrop-blur-md">
          <p>
            Questions about this document? Email us at{" "}
            <a
              href={`mailto:${legal.supportEmail}`}
              className="text-accent-turquoise hover:underline"
            >
              {legal.supportEmail}
            </a>{" "}
            and a real person will answer {legal.responseTime}.
          </p>
          <div className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            <Link href="/terms/" className="hover:text-accent-turquoise">
              Terms of Service
            </Link>
            <Link href="/privacy/" className="hover:text-accent-turquoise">
              Privacy Policy
            </Link>
            <Link href="/refunds/" className="hover:text-accent-turquoise">
              Refund Policy
            </Link>
            <Link href="/delivery/" className="hover:text-accent-turquoise">
              Delivery Policy
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
