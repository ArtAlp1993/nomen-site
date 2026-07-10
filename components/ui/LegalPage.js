import Link from "next/link";

export default function LegalPage({ title, updated, children }) {
  return (
    <main className="mx-auto max-w-2xl px-6 py-20">
      <Link href="/" className="text-sm text-accent-turquoise hover:underline">
        ← Back to NOMEN
      </Link>
      <h1 className="mt-6 font-heading text-3xl font-semibold">{title}</h1>
      <p className="mt-2 text-sm text-foreground-muted">Last updated: {updated}</p>
      <div className="mt-8 flex flex-col gap-5 text-sm leading-relaxed text-foreground-muted">
        {children}
      </div>
    </main>
  );
}
