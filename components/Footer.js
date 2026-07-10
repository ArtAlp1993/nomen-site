import Link from "next/link";

export default function Footer() {
  return (
    <footer className="border-t border-foreground-muted/15 px-6 py-10">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-center gap-4 text-center text-sm text-foreground-muted">
        <span className="font-heading tracking-widest text-foreground">
          NOMEN
        </span>

        <div className="flex flex-wrap items-center justify-center gap-6">
          <Link href="/privacy" className="hover:text-accent-turquoise">
            Privacy
          </Link>
          <Link href="/terms" className="hover:text-accent-turquoise">
            Terms
          </Link>
          {/* Ссылка Contact вернётся, когда появится реальный почтовый ящик
              (hello@nomen.example был заглушкой — письма туда не доходили). */}
        </div>

        <span>&copy; {new Date().getFullYear()} NOMEN. All rights reserved.</span>
      </div>
    </footer>
  );
}
