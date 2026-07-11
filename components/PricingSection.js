"use client";

import { useState } from "react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";
import CryptoCheckout from "./CryptoCheckout";
import { useResult } from "./ResultProvider";
import pricing from "@/data/pricing.json";

export default function PricingSection() {
  const { result } = useResult();
  const [checkoutTier, setCheckoutTier] = useState(null);

  // Открыть оплату можно только после квиза — иначе нет имени/email, чтобы
  // сформировать заказ. Без результата мягко возвращаем к квизу.
  const startCheckout = (tier) => {
    if (!result) {
      const el = document.querySelector("#quiz");
      if (typeof window !== "undefined" && window.__lenis && el)
        window.__lenis.scrollTo(el, { offset: -20 });
      else el?.scrollIntoView({ behavior: "smooth" });
      return;
    }
    setCheckoutTier(tier);
  };

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Pricing"
        title="Choose your reading"
        subtitle="Pay in US dollars via Wise, or in crypto — we confirm your payment and email your reading, usually within a few hours."
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
                    <span className="whitespace-pre-line">{f}</span>
                  </li>
                ))}
              </ul>
              {/* Тариф без готового продукта (совместимость) продавать нельзя —
                  кнопка заблокирована до запуска, по паттерну demo-кошельков. */}
              <span className={`mt-6 ${tier.highlight && !tier.comingSoon ? "btn-wiggle" : "w-full"}`}>
                <Button
                  onClick={() => !tier.comingSoon && startCheckout(tier)}
                  variant={tier.highlight && !tier.comingSoon ? "primary" : "secondary"}
                  pulse={tier.highlight && !tier.comingSoon}
                  disabled={!!tier.comingSoon}
                  className={tier.highlight && !tier.comingSoon ? "" : "w-full"}
                >
                  {tier.comingSoon ? "Coming soon" : "Get started"}
                </Button>
              </span>
            </Card>
          </Reveal>
        ))}
      </div>

      <CryptoCheckout
        tier={checkoutTier}
        open={!!checkoutTier}
        onClose={() => setCheckoutTier(null)}
      />
    </section>
  );
}
