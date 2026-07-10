"use client";

import { useState } from "react";
import Button from "./ui/Button";

const TOTAL_STEPS = 4;

export default function QuizWizard({ onSubmit, submitting }) {
  const [step, setStep] = useState(0);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [brand, setBrand] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");

  const canAdvance = () => {
    if (step === 0) return firstName.trim().length > 1 && lastName.trim().length > 1;
    if (step === 1) return birthDate.length > 0;
    return true; // шаг 2 (время/место) — опциональный, можно пропустить
  };

  const handleNext = () => {
    if (!canAdvance()) {
      setError("Please fill this in before continuing.");
      return;
    }
    setError("");
    setStep((s) => Math.min(s + 1, TOTAL_STEPS - 1));
  };

  const handleBack = () => {
    setError("");
    setStep((s) => Math.max(s - 1, 0));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!email.includes("@") || !consent) {
      setError("An email and consent to our Privacy Policy are required.");
      return;
    }
    setError("");
    onSubmit({ firstName, lastName, birthDate, birthTime, birthPlace, brand, email });
  };

  const inputClass =
    "rounded-lg border border-foreground-muted/60 bg-background-alt px-4 py-3 text-foreground placeholder:text-foreground-muted/60 transition-colors hover:border-foreground-muted/80 focus:border-accent-turquoise focus:outline-none focus:ring-1 focus:ring-accent-turquoise";

  return (
    <div className="mx-auto w-full max-w-md">
      <div className="mb-8 flex gap-2">
        {Array.from({ length: TOTAL_STEPS }).map((_, i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i <= step ? "bg-accent-turquoise" : "bg-foreground-muted/20"
            }`}
          />
        ))}
      </div>

      <form onSubmit={handleSubmit}>
        {step === 0 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-heading text-xl font-semibold">What&apos;s your name?</h3>
            <input
              type="text"
              placeholder="First name"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Last name"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-heading text-xl font-semibold">When were you born?</h3>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-heading text-xl font-semibold">
              Exact time &amp; place?{" "}
              <span className="text-sm font-normal text-foreground-muted">(optional)</span>
            </h3>
            <p className="-mt-2 text-sm text-foreground-muted">
              Skip this and your 13-point reading still works fully. Add it to
              unlock the deeper time-based layers as they arrive.
            </p>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className={inputClass}
              aria-label="Birth time (optional)"
            />
            <input
              type="text"
              placeholder="City of birth (optional)"
              value={birthPlace}
              onChange={(e) => setBirthPlace(e.target.value)}
              className={inputClass}
            />
            <input
              type="text"
              placeholder="Brand / nickname (optional)"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              className={inputClass}
            />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h3 className="font-heading text-xl font-semibold">
              Where should we send your preview?
            </h3>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={inputClass}
            />
            <label className="flex items-start gap-2 text-sm text-foreground-muted">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => setConsent(e.target.checked)}
                className="mt-1"
              />
              <span>
                I agree to NOMEN&apos;s{" "}
                <a href="/privacy" className="underline hover:text-accent-turquoise">
                  Privacy Policy
                </a>{" "}
                and to receive my reading by email.
              </span>
            </label>
          </div>
        )}

        {error && <p className="mt-3 text-sm text-red-400">{error}</p>}

        <div className="mt-8 flex flex-col items-center gap-3">
          {step < TOTAL_STEPS - 1 ? (
            <Button type="button" onClick={handleNext}>
              {step === 2 ? "Skip / Continue" : "Continue"}
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? "Calculating…" : "Reveal my preview"}
            </Button>
          )}

          {step > 0 && (
            <button
              type="button"
              onClick={handleBack}
              className="text-sm text-foreground-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
            >
              Back
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
