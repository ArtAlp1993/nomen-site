"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Card from "./ui/Card";
import Button from "./ui/Button";
import PointIcon from "./PointIcon";

// Поэтапная выдача результата: каждый избранный пункт «вычисляется» на глазах
// (колёсико + подпись, что именно считаем), затем раскрывается. После
// последнего — короткая пауза на дочитать и всплывающее предложение полного
// разбора. При prefers-reduced-motion всё показывается сразу.

const CALC_TEXT = {
  A1: "Calculating your Life Path from your birth date…",
  A3: "Reading the letters of your name…",
  B1: "Charting where the Sun stood when you were born…",
  D1: "Drawing your birth card from the Major Arcana…",
};
const STEP_MS = 2600; // «вычисление» одного пункта
const REST_MS = 900; // пауза перед остальными пунктами
const CTA_MS = 3500; // пауза после всего — и предложение

const EASE = [0.22, 1, 0.36, 1];

export default function TeaserReveal({ firstName, points }) {
  const reduce = useReducedMotion();
  const featured = points.filter((p) => p.featured);
  const rest = points.filter((p) => !p.featured);

  const [revealed, setRevealed] = useState(reduce ? featured.length : 0);
  const [showRest, setShowRest] = useState(!!reduce);
  const [cta, setCta] = useState(false);
  const [ctaClosed, setCtaClosed] = useState(false);

  useEffect(() => {
    let t;
    if (revealed < featured.length) {
      t = setTimeout(() => setRevealed((r) => r + 1), STEP_MS);
    } else if (!showRest) {
      t = setTimeout(() => setShowRest(true), REST_MS);
    } else if (!cta && !ctaClosed) {
      t = setTimeout(() => setCta(true), CTA_MS);
    }
    return () => clearTimeout(t);
  }, [revealed, showRest, cta, ctaClosed, featured.length]);

  const calcNow = revealed < featured.length ? featured[revealed] : null;

  return (
    <div className="mx-auto mt-16 max-w-4xl">
      <p className="text-center font-heading text-sm uppercase tracking-[0.3em] text-accent-turquoise">
        {firstName ? `${firstName}'s` : "Your"} blueprint
      </p>

      {/* Избранные пункты — раскрываются по одному, после «вычисления» */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {featured.slice(0, revealed).map((p) => (
          <motion.div
            key={p.code}
            initial={reduce ? false : { opacity: 0, y: 18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.7, ease: EASE }}
          >
            <Card glow className="h-full">
              <div className="flex items-start gap-3">
                <span className="text-accent-turquoise">
                  <PointIcon code={p.code} size={26} />
                </span>
                <div>
                  <span className="font-heading text-sm font-semibold">
                    {p.label}
                  </span>
                  <p className="mt-1 text-sm text-foreground-muted">{p.phrase}</p>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}

        {calcNow && (
          <motion.div
            key={`calc-${calcNow.code}`}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4 }}
          >
            <Card className="flex h-full min-h-[96px] items-center justify-center">
              <div className="flex items-center gap-3 text-sm text-foreground-muted">
                <span
                  aria-hidden
                  className="h-5 w-5 shrink-0 animate-spin rounded-full border-2 border-foreground-muted/30 border-t-accent-turquoise"
                />
                {CALC_TEXT[calcNow.code] || "Calculating…"}
              </div>
            </Card>
          </motion.div>
        )}
      </div>

      {/* Остальные пункты — одним мягким блоком после избранных */}
      {showRest && rest.length > 0 && (
        <motion.div
          initial={reduce ? false : { opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: EASE }}
        >
          <p className="mt-10 text-center text-sm text-foreground-muted">
            We calculated the rest of your chart too — here&apos;s what came
            back. The full interpretation of each is in your complete reading.
          </p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {rest.map((p) => (
              <div
                key={p.code}
                className="flex items-center gap-3 rounded-xl border border-foreground-muted/20 bg-background-alt/75 backdrop-blur-md px-4 py-3"
              >
                <span className="text-foreground-muted">
                  <PointIcon code={p.code} size={22} />
                </span>
                <span className="text-sm text-foreground">{p.label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Всплывающее предложение полного разбора */}
      <AnimatePresence>
        {cta && !ctaClosed && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center px-6"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.35 }}
          >
            <div
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
              onClick={() => setCtaClosed(true)}
            />
            <motion.div
              className="relative w-full max-w-md rounded-2xl border border-accent-turquoise/40 bg-background-alt p-8 text-center shadow-2xl"
              initial={{ opacity: 0, y: 26, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.97 }}
              transition={{ duration: 0.45, ease: EASE }}
            >
              <button
                type="button"
                aria-label="Close"
                onClick={() => setCtaClosed(true)}
                className="absolute right-4 top-3 text-xl text-foreground-muted transition-colors hover:text-foreground"
              >
                ×
              </button>
              <p className="font-heading text-sm uppercase tracking-[0.3em] text-accent-turquoise">
                {firstName ? `${firstName},` : "Ready?"}
              </p>
              <h3 className="mt-3 font-heading text-2xl font-semibold">
                Your full reading is already calculated
              </h3>
              <p className="mt-3 text-sm text-foreground-muted">
                What you see above is a real slice. The complete 13-point
                interpretation — every number, sign and card explained — is one
                step away.
              </p>
              <div className="mt-6 flex flex-col items-center gap-3">
                <Button href="#pricing" onClick={() => setCtaClosed(true)}>
                  Unlock my full reading
                </Button>
                <button
                  type="button"
                  onClick={() => setCtaClosed(true)}
                  className="text-sm text-foreground-muted underline-offset-4 transition-colors hover:text-foreground hover:underline"
                >
                  Not now — keep reading
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
