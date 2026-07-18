"use client";

import { useState } from "react";
import SectionHeading from "./ui/SectionHeading";
import QuizWizard from "./QuizWizard";
import TeaserReveal from "./TeaserReveal";
import Button from "./ui/Button";
import { useResult } from "./ResultProvider";
import { calculateTeaser } from "@/lib/teaser";
import { notifyLead } from "@/lib/lead";
import { ymGoal } from "./Analytics";

export default function QuizSection() {
  const { result, setResult, resetResult } = useResult();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setError("");
    try {
      // Тизер считается прямо в браузере (порт nomen-engine, lib/teaser.js) —
      // сайт статический, сервера нет. Сверено с движком автотестом.
      const { points } = calculateTeaser({
        name: `${data.firstName} ${data.lastName}`,
        date: data.birthDate,
      });
      if (!points.length) throw new Error("empty result");
      // Небольшая пауза «калькуляции»: мгновенный ответ выглядит как заглушка.
      await new Promise((resolve) => setTimeout(resolve, 900));
      ymGoal("quiz_completed");
      // Сохраняем все поля квиза (email и пр.) — они нужны крипто-чекауту,
      // чтобы отправить заказ Артёму. Тизер читает firstName/points как раньше.
      setResult({ ...data, points });
      notifyLead({ ...data, source: "quiz" }); // лид в базу (fire-and-forget)
    } catch (err) {
      setError(
        "We couldn't read that name. Use letters of one alphabet and try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section id="quiz" className="mx-auto max-w-5xl px-6 pt-24 pb-14 sm:py-32">
      <SectionHeading
        eyebrow="Your free preview"
        title="Let's read your blueprint"
        subtitle="Give us your name and birth date, and we'll calculate a real slice of your 13-point profile right now."
      />

      <div className="mt-16">
        {!result && <QuizWizard onSubmit={handleSubmit} submitting={submitting} />}
        {error && (
          <p className="mt-4 text-center text-sm text-red-400">{error}</p>
        )}
        {result && (
          <>
            <TeaserReveal firstName={result.firstName} points={result.points} />

            {/* Постоянный видимый путь к оплате (Артём 18.07): после тизера человек
                НЕ должен искать, где платить, и должен понимать, что это платный
                серьёзный продукт. Модалка одноразовая — эта карточка остаётся всегда. */}
            <div className="mx-auto mt-12 max-w-2xl rounded-2xl border border-accent-turquoise/40 bg-accent-turquoise/[0.05] p-6 text-center sm:p-8">
              <p className="font-heading text-xs uppercase tracking-[0.3em] text-accent-turquoise">
                This was your free preview
              </p>
              <h3 className="mt-3 font-heading text-xl font-semibold sm:text-2xl">
                Your full blueprint goes far deeper
              </h3>
              <p className="mt-3 text-sm text-foreground-muted">
                The preview is a small taste. Your full reading decodes all 13
                points of who you are — every number, sign and card explained in
                depth — a real map for how to move through life. A serious,
                one-time investment in understanding yourself.
              </p>
              <div className="mt-6 flex justify-center">
                <Button
                  href="#pricing"
                  onClick={() => ymGoal("teaser_unlock")}
                  className="w-full sm:w-auto"
                >
                  Unlock my full reading →
                </Button>
              </div>
              <p className="mt-3 text-xs text-foreground-muted/80">
                One-time payment · delivered to your email, usually within a few
                hours.
              </p>
            </div>

            {/* Пересдать квиз: чистит сохранённый результат (и для тестов,
                и для клиента, который опечатался в имени). */}
            <p className="mt-8 text-center">
              <button
                type="button"
                onClick={resetResult}
                className="text-sm text-foreground-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                Start over with a different name →
              </button>
            </p>
          </>
        )}
      </div>
    </section>
  );
}
