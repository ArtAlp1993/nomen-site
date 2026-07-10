"use client";

import { useState } from "react";
import SectionHeading from "./ui/SectionHeading";
import QuizWizard from "./QuizWizard";
import TeaserReveal from "./TeaserReveal";
import { useResult } from "./ResultProvider";

export default function QuizSection() {
  const { result, setResult } = useResult();
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (data) => {
    setSubmitting(true);
    setError("");
    try {
      const res = await fetch("/api/quiz", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Request failed");
      const json = await res.json();
      setResult({ firstName: data.firstName, points: json.points });
    } catch (err) {
      setError(
        "Something went wrong on our end — please try again in a moment."
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
