import Link from "next/link";
import Button from "@/components/ui/Button";
import OrderRef from "@/components/OrderRef";
import Footer from "@/components/Footer";
import legal from "@/data/legal.json";

export const metadata = { title: "You're in · NOMEN" };

export default function ThankYouPage() {
  return (
    <>
      <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
        <span className="font-heading text-xs uppercase tracking-[0.4em] text-accent-turquoise">
          Order received
        </span>
        <h1 className="mt-6 font-heading text-3xl font-semibold sm:text-4xl">
          Thanks. We&apos;re on it.
        </h1>
        <p className="mt-4 text-foreground-muted">
          We&apos;ve received your order. Once your payment is confirmed,
          we&apos;ll email you a personal link to your full reading, usually
          within a few hours and always within 24 hours. The link is yours to
          keep and revisit. If you don&apos;t see it, check your spam folder,
          then write to{" "}
          <a
            href={`mailto:${legal.supportEmail}`}
            className="text-accent-turquoise hover:underline"
          >
            {legal.supportEmail}
          </a>{" "}
          and we&apos;ll help.
        </p>
        <OrderRef />
        <Link href="/" className="mt-8">
          <Button variant="secondary">Back to NOMEN</Button>
        </Link>
      </main>
      <Footer />
    </>
  );
}
