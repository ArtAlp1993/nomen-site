import Link from "next/link";
import Button from "@/components/ui/Button";
import OrderRef from "@/components/OrderRef";

export const metadata = { title: "You're in — NOMEN" };

export default function ThankYouPage() {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="font-heading text-xs uppercase tracking-[0.4em] text-accent-turquoise">
        Order received
      </span>
      <h1 className="mt-6 font-heading text-3xl font-semibold sm:text-4xl">
        Thanks — we&apos;re on it.
      </h1>
      <p className="mt-4 text-foreground-muted">
        We&apos;ve received your order. Once your crypto payment is confirmed
        on-chain, we&apos;ll email you a personal link to your full reading —
        usually within a few hours. The link is yours to keep and revisit. If
        you don&apos;t see it, check your spam folder — or reach out and
        we&apos;ll help.
      </p>
      <OrderRef />
      <Link href="/" className="mt-8">
        <Button variant="secondary">Back to NOMEN</Button>
      </Link>
    </main>
  );
}
