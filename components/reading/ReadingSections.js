"use client";

import Link from "next/link";
import { motion } from "framer-motion";

// Секции страницы /reading: hero, пункт, психоматрица, вердикт, ошибка.
// Текст лежит на полупрозрачных панелях поверх туннеля — читается, но сцена
// просвечивает. Появление — мягкий подъём при входе во вьюпорт.

const rise = {
  initial: { opacity: 0, y: 46 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-15% 0px" },
  transition: { duration: 0.7, ease: [0.22, 0.61, 0.36, 1] },
};

const panelClass =
  "rounded-2xl border border-foreground-muted/25 bg-background/60 p-6 backdrop-blur-md sm:p-10";

// Крупный светящийся глиф значения (число / знак / иероглиф / римский аркан).
// Слот под PNG-сигилы: когда появятся public/sigils/<code>.png — сюда.
export function Glyph({ children, accent, small }) {
  return (
    <span
      aria-hidden
      className={`font-heading font-semibold leading-none ${
        small ? "text-4xl sm:text-5xl" : "text-6xl sm:text-7xl"
      }`}
      style={{
        color: accent,
        textShadow: `0 0 18px ${accent}88, 0 0 60px ${accent}55`,
      }}
    >
      {children}
    </span>
  );
}

export function ReadingHero({ card, reading }) {
  const birthLine = [card.bd, card.bt, card.bp].filter(Boolean).join(" · ");
  return (
    <section className="relative flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <motion.p
        {...rise}
        className="font-heading text-xs uppercase tracking-[0.35em] text-accent-turquoise"
      >
        Full reading
      </motion.p>
      <motion.h1
        {...rise}
        transition={{ ...rise.transition, delay: 0.08 }}
        className="mt-4 font-heading text-4xl font-semibold sm:text-6xl"
        style={{ textShadow: "0 0 26px rgba(51,230,224,0.35)" }}
      >
        {card.fn} {card.ln || ""}
      </motion.h1>
      <motion.p
        {...rise}
        transition={{ ...rise.transition, delay: 0.16 }}
        className="mt-3 text-sm text-foreground-muted sm:text-base"
      >
        {birthLine}
        {card.br ? ` · ${card.br}` : ""}
      </motion.p>
      <motion.div
        {...rise}
        transition={{ ...rise.transition, delay: 0.24 }}
        className="mt-8 flex items-center gap-8"
      >
        {reading.b1?.glyph && <Glyph accent="#6c4ff6" small>{reading.b1.glyph}</Glyph>}
        <Glyph accent="#33e6e0" small>{reading.a1?.value}</Glyph>
        {reading.d1?.roman && <Glyph accent="#5aa9ff" small>{reading.d1.roman}</Glyph>}
      </motion.div>
      <motion.p
        {...rise}
        transition={{ ...rise.transition, delay: 0.32 }}
        className="mt-10 max-w-md text-sm text-foreground-muted"
      >
        Thirteen points, one thread. Scroll — and descend through your own
        blueprint.
      </motion.p>
      {card.oc && (
        <p className="absolute bottom-16 text-[11px] tracking-widest text-foreground-muted/50">
          Reading {card.oc}
        </p>
      )}
      <div className="absolute bottom-6 animate-bounce text-foreground-muted/60">↓</div>
    </section>
  );
}

// Обычный пункт: глиф + заголовок + intro + один или несколько текстов банка.
export function PointSection({ section, innerRef }) {
  const { accent, glyph, title, about, entries, valueLabel } = section;
  return (
    <section
      ref={innerRef}
      data-code={section.code}
      className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-24"
    >
      <motion.div {...rise} className="flex flex-col items-center text-center">
        <Glyph accent={accent}>{glyph}</Glyph>
        <p
          className="mt-5 font-heading text-xs uppercase tracking-[0.3em]"
          style={{ color: accent }}
        >
          {title}
        </p>
        {valueLabel && (
          <h2 className="mt-2 font-heading text-2xl font-semibold sm:text-4xl">
            {valueLabel}
          </h2>
        )}
        {about && (
          <p className="mt-3 max-w-xl text-sm text-foreground-muted">{about}</p>
        )}
      </motion.div>

      <div className="mt-10 flex w-full flex-col gap-6">
        {entries.map((e, i) => (
          <motion.div
            key={i}
            {...rise}
            transition={{ ...rise.transition, delay: 0.05 * i }}
            className={panelClass}
          >
            {e.heading && (
              <h3
                className="font-heading text-lg font-semibold sm:text-xl"
                style={{ color: accent }}
              >
                {e.glyph ? `${e.glyph} · ${e.heading}` : e.heading}
              </h3>
            )}
            {e.paragraphs.map((p, k) => (
              <p
                key={k}
                className="mt-4 text-[15px] leading-relaxed text-foreground/90 sm:text-base"
              >
                {p}
              </p>
            ))}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Психоматрица: неоновая сетка 3×3 (классическая раскладка колонками
// 1-2-3 / 4-5-6 / 7-8-9) + разбор всех девяти ячеек.
export function PsychomatrixSection({ section, innerRef }) {
  const { accent, cells, entries, title, about } = section;
  const order = [1, 4, 7, 2, 5, 8, 3, 6, 9]; // строки классического квадрата
  return (
    <section
      ref={innerRef}
      data-code="A10"
      className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-24"
    >
      <motion.div {...rise} className="flex flex-col items-center text-center">
        <p
          className="font-heading text-xs uppercase tracking-[0.3em]"
          style={{ color: accent }}
        >
          {title}
        </p>
        {about && (
          <p className="mt-3 max-w-xl text-sm text-foreground-muted">{about}</p>
        )}
        <div className="mt-8 grid grid-cols-3 gap-2 sm:gap-3">
          {order.map((c) => (
            <div
              key={c}
              className="flex h-24 w-24 flex-col items-center justify-center rounded-xl border sm:h-28 sm:w-28"
              style={{
                borderColor: `${accent}${cells[c] ? "77" : "26"}`,
                boxShadow: cells[c]
                  ? `0 0 ${8 + cells[c] * 7}px ${accent}44, inset 0 0 14px ${accent}22`
                  : "none",
                background: "rgba(5,4,15,0.55)",
              }}
            >
              <span
                className="font-heading text-xl font-semibold sm:text-2xl"
                style={{
                  color: cells[c] ? accent : "rgba(166,160,198,0.45)",
                  textShadow: cells[c] ? `0 0 14px ${accent}88` : "none",
                }}
              >
                {cells[c] ? String(c).repeat(Math.min(cells[c], 4)) : "—"}
              </span>
              {cells[c] > 4 && (
                <span className="text-[10px] text-foreground-muted">×{cells[c]}</span>
              )}
            </div>
          ))}
        </div>
      </motion.div>

      <div className="mt-10 flex w-full flex-col gap-6">
        {entries.map((e, i) => (
          <motion.div
            key={i}
            {...rise}
            transition={{ ...rise.transition, delay: 0.04 * i }}
            className={panelClass}
          >
            <h3
              className="font-heading text-lg font-semibold sm:text-xl"
              style={{ color: accent }}
            >
              {e.glyph} · {e.heading}
            </h3>
            {e.paragraphs.map((p, k) => (
              <p
                key={k}
                className="mt-4 text-[15px] leading-relaxed text-foreground/90 sm:text-base"
              >
                {p}
              </p>
            ))}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

// Финальный вердикт: персональный ИИ-текст из ссылки (vd) или запасной из
// банка по числу пути. Мини-презентация: крупный заголовок, панель, финал.
export function VerdictSection({ card, reading, verdictBank, innerRef }) {
  const fallback = verdictBank.values[String(reading.a1?.value)] || null;
  const paragraphs = card.vd
    ? String(card.vd).split(/\n\s*\n/).map((s) => s.trim()).filter(Boolean)
    : fallback
      ? fallback.paragraphs
      : [];
  return (
    <section
      ref={innerRef}
      data-code="VERDICT"
      className="relative mx-auto flex min-h-screen max-w-3xl flex-col items-center justify-center px-6 py-24"
    >
      <motion.div {...rise} className="flex flex-col items-center text-center">
        <Glyph accent="#eaf6ff">✦</Glyph>
        <p className="mt-5 font-heading text-xs uppercase tracking-[0.3em] text-accent-turquoise">
          {verdictBank.title}
        </p>
        <h2 className="mt-2 font-heading text-3xl font-semibold sm:text-5xl">
          {card.fn}, in one thread
        </h2>
        {!card.vd && fallback && (
          <p className="mt-3 text-sm text-foreground-muted">{fallback.heading}</p>
        )}
      </motion.div>
      <motion.div
        {...rise}
        transition={{ ...rise.transition, delay: 0.1 }}
        className={`mt-10 w-full ${panelClass}`}
      >
        {paragraphs.map((p, k) => (
          <p
            key={k}
            className="mt-4 first:mt-0 text-[15px] leading-relaxed text-foreground/95 sm:text-lg"
          >
            {p}
          </p>
        ))}
        {verdictBank.closing && (
          <p className="mt-8 border-t border-foreground-muted/20 pt-6 text-sm italic text-foreground-muted">
            {verdictBank.closing}
          </p>
        )}
      </motion.div>
      <motion.p
        {...rise}
        transition={{ ...rise.transition, delay: 0.2 }}
        className="mt-10 text-center text-sm text-foreground-muted"
      >
        Compatibility readings — coming soon. This link is yours: revisit it,
        reread it, share it with someone who should understand you better.
      </motion.p>
    </section>
  );
}

export function ReadingError() {
  return (
    <section className="flex min-h-screen flex-col items-center justify-center px-6 text-center">
      <p className="font-heading text-xs uppercase tracking-[0.3em] text-accent-turquoise">
        NOMEN
      </p>
      <h1 className="mt-4 font-heading text-3xl font-semibold sm:text-4xl">
        This link looks incomplete
      </h1>
      <p className="mt-4 max-w-md text-sm text-foreground-muted sm:text-base">
        The reading couldn&apos;t be opened from this address — it may have been
        cut when copied or forwarded. Open the exact link from your email, or
        reply to that email and we&apos;ll send a fresh one.
      </p>
      <Link
        href="/"
        className="mt-8 rounded-full border border-accent-turquoise/60 px-6 py-2 text-sm text-accent-turquoise transition-colors hover:bg-accent-turquoise/10"
      >
        Back to nomen.website
      </Link>
    </section>
  );
}
