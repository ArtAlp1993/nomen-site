"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

// Переиспользуемый info-попап: значок-триггер (голый ⓘ или ⓘ + подпись через
// triggerLabel) и модалка с крестиком. Закрытие — по крестику, фону, Escape.
// z-[70] выше шапки (z-50) и прогресс-бара (z-60). Паттерн модалки — как у
// CTA-окна в TeaserReveal.
export default function InfoPopover({
  title,
  eyebrow,
  children,
  triggerLabel,
  className = "",
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const openIt = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setOpen(true);
  };

  return (
    <>
      {triggerLabel ? (
        <button
          type="button"
          onClick={openIt}
          className={`inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-[0.15em] text-foreground-muted transition-colors hover:text-accent-turquoise ${className}`}
        >
          <span className="flex h-4 w-4 items-center justify-center rounded-full border border-current text-[9px] leading-none">
            i
          </span>
          {triggerLabel}
        </button>
      ) : (
        <button
          type="button"
          aria-label={`About ${title}`}
          onClick={openIt}
          className={`inline-flex h-4 w-4 shrink-0 items-center justify-center rounded-full border border-foreground-muted/40 font-mono text-[9px] leading-none text-foreground-muted transition-colors hover:border-accent-turquoise hover:text-accent-turquoise ${className}`}
        >
          i
        </button>
      )}

      {open && typeof document !== "undefined" && createPortal(
        <div
          className="fixed inset-0 z-[70] flex items-center justify-center px-6"
          onClick={() => setOpen(false)}
        >
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <div
            role="dialog"
            aria-modal="true"
            onClick={(e) => e.stopPropagation()}
            className="nomen-pop relative w-full max-w-sm rounded-2xl border border-accent-turquoise/40 bg-background-alt p-6 text-left shadow-2xl"
            style={{ animation: "nomenPopIn 0.3s ease-out" }}
          >
            <button
              type="button"
              aria-label="Close"
              onClick={() => setOpen(false)}
              className="absolute right-3 top-2 text-2xl leading-none text-foreground-muted transition-colors hover:text-foreground"
            >
              ×
            </button>
            {eyebrow && (
              <p className="font-mono text-[11px] uppercase tracking-[0.3em] text-accent-turquoise">
                {eyebrow}
              </p>
            )}
            <h4 className="mt-2 font-heading text-lg font-semibold text-foreground">
              {title}
            </h4>
            <p className="mt-3 text-sm leading-relaxed text-foreground-muted">
              {children}
            </p>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
