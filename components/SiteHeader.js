"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

// Фиксированная шапка-навигация (фишка редизайна): логотип + постоянная
// кнопка-CTA. Нужна только на главной — её кнопка ведёт к якорю #quiz; на
// /reading, /studio, /lab со своими сценами шапка не показывается.
export default function SiteHeader() {
  const pathname = usePathname() || "";
  if (pathname !== "/") return null;

  return (
    <header className="fixed inset-x-0 top-0 z-50 bg-gradient-to-b from-background/85 to-transparent backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-6">
        <Link
          href="#top"
          className="font-heading text-sm font-bold tracking-[0.42em] text-foreground"
        >
          NOMEN
        </Link>
        <Link
          href="#quiz"
          className="rounded-full bg-gradient-to-r from-accent-violet to-accent-turquoise px-4 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-background transition-transform duration-300 ease-out hover:-translate-y-0.5"
        >
          Reveal my blueprint
        </Link>
      </div>
    </header>
  );
}
