"use client";

import { useEffect, useState } from "react";
import Button from "./ui/Button";
import DateWheel from "./DateWheel";
import TimeWheel from "./TimeWheel";
import { ymGoal } from "./Analytics";

const TOTAL_STEPS = 5;

// Движок считает имя по буквам одного алфавита (латиница ИЛИ кириллица) и
// отвергает смешанные. Валидируем это на входе, иначе мусорное имя («12»,
// «😀», «Ivan Иванов») тихо давало тизер без именных пунктов.
const LAT_RE = /[A-Za-z]/;
const CYR_RE = /[А-Яа-яЁё]/;
const countLetters = (s) => (s.match(/[A-Za-zА-Яа-яЁё]/g) || []).length;

export default function QuizWizard({ onSubmit, submitting }) {
  const [step, setStep] = useState(0);
  // Пол окрашивает «энергетическую сущность» на странице результата
  // (f — розовое свечение, m — синее) и пригодится для совместимости.
  const [gender, setGender] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  // Дата предзаполнена серединой диапазона: барабаны сразу стоят на значении.
  const [birthDate, setBirthDate] = useState("1995-06-15");
  const [birthTime, setBirthTime] = useState("");
  const [birthPlace, setBirthPlace] = useState("");
  const [brand, setBrand] = useState("");
  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [error, setError] = useState("");
  // Барабан времени — только для тач-экранов (на телефоне нативный
  // time-picker неудобен). На десктопе обычное поле ввода привычнее.
  const [touchUI, setTouchUI] = useState(false);
  useEffect(() => {
    try {
      setTouchUI(window.matchMedia("(pointer: coarse)").matches);
    } catch {
      /* нет matchMedia — остаёмся на обычном поле */
    }
  }, []);

  // Проверка имени: у каждого поля минимум 2 буквы, и весь набор — в одном
  // алфавите (не смешивать латиницу с кириллицей). Возвращает текст ошибки
  // или null, если всё ок.
  const nameError = () => {
    const f = firstName.trim();
    const l = lastName.trim();
    if (countLetters(f) < 2 || countLetters(l) < 2) {
      return "Please enter your real first and last name (letters only).";
    }
    const both = f + l;
    if (LAT_RE.test(both) && CYR_RE.test(both)) {
      return "Use one alphabet for your name — Latin or Cyrillic, not both.";
    }
    return null;
  };

  const canAdvance = () => {
    if (step === 0) return gender === "f" || gender === "m";
    if (step === 1) return !nameError();
    if (step === 2) return birthDate.length > 0;
    return true; // шаг 3 (время/место) — опциональный, можно пропустить
  };

  const handleNext = () => {
    if (!canAdvance()) {
      setError(
        step === 1
          ? nameError() || "Please fill this in before continuing."
          : "Please fill this in before continuing."
      );
      return;
    }
    setError("");
    ymGoal("quiz_step", { step: step + 1 });
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
    onSubmit({ gender, firstName, lastName, birthDate, birthTime, birthPlace, brand, email });
  };

  const inputClass =
    "rounded-lg border border-foreground-muted/60 bg-background-alt px-4 py-3 text-foreground placeholder:text-foreground-muted/60 transition-colors hover:border-foreground-muted/80 focus:border-accent-turquoise focus:outline-none focus:ring-1 focus:ring-accent-turquoise";

  return (
    <div className="relative mx-auto w-full max-w-md">
      {/* Возврат на шаг назад — еле заметный крестик, почти сливается с фоном
          (по просьбе: без явной кнопки «Back»). Появляется со 2-го шага. */}
      {step > 0 && (
        <button
          type="button"
          onClick={handleBack}
          aria-label="Go back one step"
          className="absolute -top-1 right-0 z-10 text-xl leading-none text-foreground-muted/25 transition-colors hover:text-foreground-muted/70"
        >
          ×
        </button>
      )}
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
            <h3 className="text-center font-heading text-xl font-semibold">You are…</h3>
            <div className="flex gap-4">
              {[
                { value: "f", label: "Female", symbol: "♀", ring: "focus-visible:ring-pink-400", active: "border-pink-400/80 text-pink-300 shadow-[0_0_24px_rgba(244,114,182,0.35)]" },
                { value: "m", label: "Male", symbol: "♂", ring: "focus-visible:ring-sky-400", active: "border-sky-400/80 text-sky-300 shadow-[0_0_24px_rgba(56,189,248,0.35)]" },
              ].map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setGender(opt.value);
                    setError("");
                    ymGoal("quiz_step", { step: 1 });
                    setStep(1);
                  }}
                  aria-pressed={gender === opt.value}
                  className={`flex flex-1 flex-col items-center gap-2 rounded-xl border bg-background-alt px-4 py-6 transition-all focus:outline-none focus-visible:ring-1 ${opt.ring} ${
                    gender === opt.value
                      ? opt.active
                      : "border-foreground-muted/60 text-foreground hover:border-foreground-muted"
                  }`}
                >
                  <span className="text-3xl leading-none">{opt.symbol}</span>
                  <span className="text-sm">{opt.label}</span>
                </button>
              ))}
            </div>
            <p className="text-center text-xs text-foreground-muted/70">
              This tunes the color of your reading. Nothing else changes.
            </p>
          </div>
        )}

        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-center font-heading text-xl font-semibold">What&apos;s your name?</h3>
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

        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-center font-heading text-xl font-semibold">
              When were you born?
            </h3>
            <DateWheel value={birthDate} onChange={setBirthDate} />
          </div>
        )}

        {step === 3 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-center font-heading text-xl font-semibold">
              Exact time &amp; place?{" "}
              <span className="text-sm font-normal text-foreground-muted">(optional)</span>
            </h3>
            <p className="-mt-2 text-sm text-foreground-muted">
              Skip this and your 13-point reading still works fully. Add it to
              unlock the deeper time-based layers as they arrive.
            </p>
            {touchUI ? (
              <TimeWheel value={birthTime} onChange={setBirthTime} />
            ) : (
              <input
                type="time"
                value={birthTime}
                onChange={(e) => setBirthTime(e.target.value)}
                className={inputClass}
                aria-label="Birth time (optional)"
              />
            )}
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

        {step === 4 && (
          <div className="flex flex-col gap-4">
            <h3 className="text-center font-heading text-xl font-semibold">
              Where should we send your preview?
            </h3>
            <input
              type="email"
              placeholder="you@email.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError("");
              }}
              className={inputClass}
            />
            <label className="flex items-start gap-2 text-sm text-foreground-muted">
              <input
                type="checkbox"
                checked={consent}
                onChange={(e) => {
                  setConsent(e.target.checked);
                  if (error) setError("");
                }}
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
          {/* На шаге пола Continue не нужен — тап по карточке сам ведёт дальше. */}
          {step === 0 ? null : step < TOTAL_STEPS - 1 ? (
            <Button type="button" onClick={handleNext}>
              Continue
            </Button>
          ) : (
            <Button type="submit" disabled={submitting}>
              {submitting ? "Calculating…" : "Reveal my preview"}
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
