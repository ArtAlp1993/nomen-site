"use client";

import { useEffect, useState } from "react";
import Button from "./ui/Button";
import Card from "./ui/Card";
import SectionHeading from "./ui/SectionHeading";
import Reveal from "./ui/Reveal";
import CryptoCheckout from "./CryptoCheckout";
import { useResult } from "./ResultProvider";
import pricing from "@/data/pricing.json";

// Событие «открой оплату прямо сейчас» (21.07, З-391). Артём: «после того как
// заблюрится — чтобы ему подтянулось, что типа давай оплачивай, нажимает кнопку и его
// подтягивает туда». Раньше кнопки после блюра и после теста вели на якорь `#pricing`:
// человек долистывал до тарифов и должен был нажать ЕЩЁ раз, уже выбрав тариф. Два
// клика на самом горячем месте пути.
//
// Почему событие, а не общий стейт: чекаут живёт внутри этой секции и знает про тарифы,
// а звать его нужно из двух чужих компонентов (тизер и квиз). Событие связывает их, не
// растаскивая состояние оплаты по всему дереву.
export const СОБЫТИЕ_ОПЛАТЫ = "nomen:открыть-оплату";
export function открытьОплату() {
  if (typeof window !== "undefined") window.dispatchEvent(new CustomEvent(СОБЫТИЕ_ОПЛАТЫ));
}

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

  // Слушаем зов извне и открываем оплату на ЖИВОМ тарифе. `comingSoon` пропускаем:
  // открыть чекаут на том, чего ещё нет, значит собрать деньги за непроданное.
  useEffect(() => {
    const наЗов = () => {
      const живой = pricing.find((t) => !t.comingSoon);
      if (!живой) return;
      // Прокручиваем к тарифам ТОЖЕ: если человек закроет чекаут, он окажется там,
      // где решение принимают, а не посреди тизера.
      const el = document.querySelector("#pricing");
      if (typeof window !== "undefined" && window.__lenis && el) window.__lenis.scrollTo(el, { offset: -20 });
      else el?.scrollIntoView({ behavior: "smooth" });
      startCheckout(живой);
    };
    window.addEventListener(СОБЫТИЕ_ОПЛАТЫ, наЗов);
    return () => window.removeEventListener(СОБЫТИЕ_ОПЛАТЫ, наЗов);
    // startCheckout зависит от result: без него оплату открывать нельзя — нет имени и почты.
  }, [result]);

  return (
    <section id="pricing" className="mx-auto max-w-6xl px-6 py-24 sm:py-32">
      <SectionHeading
        eyebrow="Pricing"
        title="Choose your reading"
        subtitle="Pay in US dollars via Wise, or in crypto. We confirm your payment and email your reading, usually within a few hours."
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
              {tier.badge && (
                <span className="mb-3 inline-block w-fit rounded-full bg-accent-turquoise/15 px-3 py-1 text-xs font-semibold text-accent-turquoise">
                  {tier.badge}
                </span>
              )}
              <h3 className="font-heading text-lg font-semibold">{tier.name}</h3>
              <p className="mt-2 font-heading text-3xl font-semibold">
                {/* Якорь цены: честная стартовая цена рядом с будущей
                    (Артём 12.07: поднимем до $15 по мере спроса). */}
                {tier.anchorPrice && (
                  <span className="mr-2 align-middle text-xl font-normal text-foreground-muted/50 line-through">
                    ${tier.anchorPrice}
                  </span>
                )}
                ${tier.price}
              </p>
              {tier.priceNote && !tier.comingSoon && (
                <p className="mt-1 text-xs font-medium text-accent-turquoise">
                  {tier.priceNote}
                </p>
              )}
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
                  {tier.comingSoon ? "Coming soon" : tier.cta || "Get started"}
                </Button>
              </span>

              {/* Снятие риска прямо в точке решения: гарантия из FAQ вынесена
                  на карточку живого оффера (skill: offers — risk reversal). */}
              {tier.guarantee && !tier.comingSoon && (
                <p className="mt-4 max-w-xs text-xs leading-relaxed text-foreground-muted/80">
                  {tier.guarantee}
                </p>
              )}
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
