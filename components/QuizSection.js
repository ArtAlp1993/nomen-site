"use client";

import { useState } from "react";
import SectionHeading from "./ui/SectionHeading";
import QuizWizard from "./QuizWizard";
import TeaserReveal from "./TeaserReveal";
import { useResult } from "./ResultProvider";
import { calculateTeaser } from "@/lib/teaser";

export default function QuizSection() {
  const { result, setResult } = useResult();
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
      setResult({ firstName: data.firstName, points });
    } catch (err) {
      setError(
        "We couldn't read that name — use letters of one alphabet and try again."
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
        subtitle="Your name and birth date — we'll calculate a real slice of your 13-point profile right now."
      />

      <div className="mt-16">
        {!result && <QuizWizard onSubmit={handleSubmit} submitting={submitting} />}
        {error && (
          <p className="mt-4 text-center text-sm text-red-400">{error}</p>
        )}
        {result && (
          <TeaserReveal firstName={result.firstName} points={result.points} />
        )}
      </div>
    </section>
  );
}
