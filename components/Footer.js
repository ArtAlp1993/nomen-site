import Link from "next/link";
import legal from "@/data/legal.json";

// Футер — единственная навигация по служебным страницам сайта. Ссылки
// разложены в две группы, чтобы семь пунктов не расползались в строку на
// мобильном. Адрес поддержки стоит прямо здесь: платёжные системы при
// проверке сайта ищут рабочий контакт, не углубляясь в документы.
const COMPANY = [
  { href: "/about/", label: "About" },
  { href: "/contact/", label: "Contact" },
  { href: "/faq/", label: "FAQ" },
];

const LEGAL = [
  { href: "/terms/", label: "Terms" },
  { href: "/privacy/", label: "Privacy" },
  { href: "/refunds/", label: "Refunds" },
  { href: "/delivery/", label: "Delivery" },
];

function LinkGroup({ heading, links }) {
  return (
    <div className="flex flex-col items-center gap-3 sm:items-start">
      <span className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-turquoise">
        {heading}
      </span>
      <ul className="flex flex-wrap items-center justify-center gap-x-5 gap-y-2 sm:justify-start">
        {links.map((link) => (
          <li key={link.href}>
            <Link href={link.href} className="hover:text-accent-turquoise">
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  return (
    <footer className="border-t border-foreground-muted/15 px-6 py-12">
      <div className="mx-auto flex max-w-4xl flex-col gap-10 text-sm text-foreground-muted">
        <div className="flex flex-col items-center gap-8 text-center sm:flex-row sm:items-start sm:justify-between sm:text-left">
          <div className="flex flex-col items-center gap-3 sm:items-start">
            <Link
              href="/"
              className="font-heading tracking-widest text-foreground"
            >
              NOMEN
            </Link>
            <a
              href={`mailto:${legal.supportEmail}`}
              className="hover:text-accent-turquoise"
            >
              {legal.supportEmail}
            </a>
          </div>

          <LinkGroup heading="Company" links={COMPANY} />
          <LinkGroup heading="Legal" links={LEGAL} />
        </div>

        <span className="text-center text-xs text-foreground-muted/70">
          &copy; {new Date().getFullYear()} NOMEN. All rights reserved.
        </span>
      </div>
    </footer>
  );
}
