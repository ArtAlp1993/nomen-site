import Link from "next/link";
import Button from "@/components/ui/Button";

export const metadata = { title: "You're in — NOMEN" };

export default function ThankYouPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="font-heading text-xs uppercase tracking-[0.4em] text-accent-turquoise">
        Payment received
      </span>
      <h1 className="mt-6 font-heading text-3xl font-semibold sm:text-4xl">
        Your blueprint is on its way.
      </h1>
      <p className="mt-4 text-foreground-muted">
        Your full reading is generated the moment your payment clears and lands
        in your inbox within minutes. If you don&apos;t see it, check your spam
        folder — or reach out and we&apos;ll help.
      </p>
      <Link href="/" className="mt-8">
        <Button variant="secondary">Back to NOMEN</Button>
      </Link>
    </main>
  );
}
