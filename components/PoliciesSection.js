import Link from "next/link";
import Card from "./ui/Card";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";
import legal from "@/data/legal.json";

// Вход в служебные страницы с главной. Стоит внизу — после FAQ-гармошки,
// перед последним призывом: человек дочитал ответы, дальше хочет подробностей
// («а что с возвратом?», «а куда писать?») — и находит их здесь, не уходя
// искать по сайту. Требование Артёма 22.07: «пролистал до конца — вот условия,
// как у нормального сайта». FAQ-гармошка выше остаётся на месте.
const LINKS = [
  {
    href: "/contact/",
    title: "Contact us",
    text: `Write to ${legal.supportEmail} — a person reads it, and answers ${legal.responseTime}.`,
  },
  {
    href: "/refunds/",
    title: "Refund Policy",
    text: "What we refund and how to ask. If we took your money and you did not get your reading, you get it back.",
  },
  {
    href: "/delivery/",
    title: "Delivery Policy",
    text: "Digital delivery by email, normally within a few hours of a confirmed payment and always within 24.",
  },
  {
    href: "/faq/",
    title: "Full FAQ",
    text: "Every question above, plus payment, security, multiple readings and data deletion — all on one page.",
  },
  {
    href: "/about/",
    title: "About NOMEN",
    text: "Who runs this, how a reading is produced, and what we hold ourselves to.",
  },
];

export default function PoliciesSection() {
  return (
    <section id="policies" className="mx-auto max-w-5xl px-6 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Before you buy"
        title="Everything else you might want to check"
        subtitle="The unglamorous part, written as plainly as the rest of the site: how your reading is delivered, when we refund, what happens to your data, and where to reach us."
      />

      <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {LINKS.map((link, i) => (
          <Reveal key={link.href} delay={i * 0.05}>
            <Link href={link.href} className="block h-full">
              <Card className="h-full">
                <h3 className="font-heading text-base font-medium text-foreground">
                  {link.title}
                </h3>
                <p className="mt-2 text-sm text-foreground-muted">
                  {link.text}
                </p>
                <span className="mt-4 inline-block font-mono text-[11px] uppercase tracking-wider text-accent-turquoise">
                  Read →
                </span>
              </Card>
            </Link>
          </Reveal>
        ))}
      </div>

      <Reveal delay={0.1}>
        <p className="mt-10 text-center text-sm text-foreground-muted">
          The formal documents:{" "}
          <Link href="/terms/" className="text-accent-turquoise hover:underline">
            Terms of Service
          </Link>{" "}
          ·{" "}
          <Link
            href="/privacy/"
            className="text-accent-turquoise hover:underline"
          >
            Privacy Policy
          </Link>
        </p>
      </Reveal>
    </section>
  );
}
