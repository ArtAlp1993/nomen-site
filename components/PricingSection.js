import Button from "./ui/Button";
import Card from "./ui/Card";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";
import pricing from "@/data/pricing.json";

export default function PricingSection() {
  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Pricing"
        title="Choose your reading"
        subtitle="Every tier is generated the moment you pay and lands in your inbox as a PDF. Pay with crypto today — card coming soon."
      />

      {/* Два тарифа по $9.90 в ряд, комбо Best Value — во всю ширину под ними */}
      <div className="mx-auto mt-16 grid max-w-4xl gap-6 sm:grid-cols-2">
        {pricing.map((tier) => (
          <Reveal key={tier.id} className={tier.highlight ? "sm:col-span-2" : ""}>
            <Card
              glow={tier.highlight}
              className={`flex h-full flex-col items-center text-center ${
                tier.highlight ? "border-accent-turquoise/60" : ""
              }`}
            >
              {tier.highlight && (
                <span className="mb-3 inline-block w-fit rounded-full bg-accent-turquoise/15 px-3 py-1 text-xs font-semibold text-accent-turquoise">
                  Best Value
                </span>
              )}
              <h3 className="font-heading text-lg font-semibold">{tier.name}</h3>
              <p className="mt-2 font-heading text-3xl font-semibold">
                ${tier.price}
              </p>
              <p className="mt-3 text-sm text-foreground-muted">
                {tier.description}
              </p>
              <ul className="mt-4 flex flex-1 flex-col items-start gap-2 text-sm text-foreground-muted">
                {tier.features.map((f) => (
                  <li key={f} className="flex items-start gap-2 text-left">
                    <span className="shrink-0 text-accent-turquoise">✓</span>
                    {f}
                  </li>
                ))}
              </ul>
              <span className={`mt-6 ${tier.highlight ? "btn-wiggle" : "w-full"}`}>
                <Button
                  href={`#quiz`}
                  variant={tier.highlight ? "primary" : "secondary"}
                  pulse={tier.highlight}
                  className={tier.highlight ? "" : "w-full"}
                >
                  Get started
                </Button>
              </span>
            </Card>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
