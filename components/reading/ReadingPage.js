"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { decodeReadingToken } from "@/lib/readingLink";
import { calculateReading, a10Bucket } from "@/lib/teaser";
import methodology from "@/data/methodology.json";
import bankA1 from "@/data/readings/a1.json";
import bankA2 from "@/data/readings/a2.json";
import bankA3 from "@/data/readings/a3.json";
import bankA4 from "@/data/readings/a4.json";
import bankA5 from "@/data/readings/a5.json";
import bankA7 from "@/data/readings/a7.json";
import bankA9 from "@/data/readings/a9.json";
import bankA10 from "@/data/readings/a10.json";
import bankA11 from "@/data/readings/a11.json";
import bankB1 from "@/data/readings/b1.json";
import bankC1 from "@/data/readings/c1.json";
import bankC2 from "@/data/readings/c2.json";
import bankD1 from "@/data/readings/d1.json";
import verdictBank from "@/data/readings/verdict.json";
import {
  ReadingHero,
  PointSection,
  PsychomatrixSection,
  VerdictSection,
  ReadingError,
} from "./ReadingSections";

// 3D-сцена — только на клиенте (WebGL).
const ReadingScene = dynamic(() => import("./ReadingScene"), { ssr: false });

// Цвета категорий — те же, что в MethodologyDiagram.
const BLOCK_COLOR = {
  Numerology: "#33e6e0",
  "Western Astrology": "#6c4ff6",
  "Chinese Astrology": "#c07bff",
  Tarot: "#5aa9ff",
};

const META = Object.fromEntries(methodology.map((m) => [m.code, m]));
const meta = (code) => META[code] || { title: code, block: "Numerology", about: "" };

// Собирает секции путешествия из расчёта и банка текстов.
function buildSections(reading) {
  const out = [];
  const numeric = [
    ["A1", bankA1, reading.a1, "Life Path"],
    ["A2", bankA2, reading.a2, "Birthday"],
    ["A3", bankA3, reading.a3, "Expression"],
    ["A4", bankA4, reading.a4, "Soul Urge"],
    ["A5", bankA5, reading.a5, "Personality"],
    ["A7", bankA7, reading.a7, "Maturity"],
  ];
  for (const [code, bank, r, name] of numeric) {
    if (!r) continue;
    const v = bank.values[String(r.value)];
    if (!v) continue;
    const m = meta(code);
    out.push({
      code,
      accent: BLOCK_COLOR[m.block],
      glyph: String(r.value),
      title: m.title,
      about: bank.intro || m.about,
      valueLabel: `${name} ${r.value} · ${v.heading}`,
      entries: [v],
    });
  }

  if (reading.a9) {
    const entries = [];
    if (reading.a9.lessons.length === 0) {
      if (bankA9.values.no_lessons) entries.push(bankA9.values.no_lessons);
    } else {
      for (const d of reading.a9.lessons) {
        const v = bankA9.values[`lesson_${d}`];
        if (v) entries.push({ ...v, glyph: String(d) });
      }
    }
    for (const d of reading.a9.passions) {
      const v = bankA9.values[`passion_${d}`];
      if (v) entries.push({ ...v, glyph: String(d) });
    }
    const m = meta("A9");
    out.push({
      code: "A9",
      accent: BLOCK_COLOR[m.block],
      glyph: reading.a9.lessons.length ? reading.a9.lessons.join(" ") : "✓",
      title: m.title,
      about: bankA9.intro || m.about,
      valueLabel:
        reading.a9.lessons.length === 0
          ? "The full set — no missing digits"
          : `Lessons ${reading.a9.lessons.join(", ")} · Passion ${reading.a9.passions.join(", ")}`,
      entries,
    });
  }

  if (reading.a10) {
    const entries = [];
    for (let c = 1; c <= 9; c++) {
      const v = bankA10.values[`${c}_${a10Bucket(reading.a10.cells[c])}`];
      if (v) {
        entries.push({
          ...v,
          glyph: reading.a10.cells[c] ? String(c).repeat(Math.min(reading.a10.cells[c], 4)) : `${c}: —`,
        });
      }
    }
    const m = meta("A10");
    out.push({
      code: "A10",
      kind: "matrix",
      accent: BLOCK_COLOR[m.block],
      title: m.title,
      about: bankA10.intro || m.about,
      cells: reading.a10.cells,
      entries,
    });
  }

  if (reading.a11) {
    const m = meta("A11");
    const entries = reading.a11.hasDebt
      ? reading.a11.debts
          .map((n) => bankA11.values[String(n)])
          .filter(Boolean)
      : [bankA11.values.none].filter(Boolean);
    out.push({
      code: "A11",
      accent: BLOCK_COLOR[m.block],
      glyph: reading.a11.hasDebt ? reading.a11.debts.join(" ") : "0",
      title: m.title,
      about: bankA11.intro || m.about,
      valueLabel: reading.a11.hasDebt
        ? `Karmic debt ${reading.a11.debts.join(", ")}`
        : "No karmic debt",
      entries,
    });
  }

  const singles = [
    ["B1", bankB1, reading.b1?.name, reading.b1?.glyph, `Sun in ${reading.b1?.name}`],
    ["C1", bankC1, reading.c1?.name, reading.c1?.glyph, reading.c1?.name],
    ["C2", bankC2, reading.c2?.name, reading.c2?.glyph, `${reading.c2?.name} element`],
    ["D1", bankD1, String(reading.d1?.num), reading.d1?.roman, null],
  ];
  for (const [code, bank, key, glyph, label] of singles) {
    const v = bank.values[key];
    if (!v) continue;
    const m = meta(code);
    out.push({
      code,
      accent: BLOCK_COLOR[m.block],
      glyph: glyph || key,
      title: m.title,
      about: bank.intro || m.about,
      valueLabel: label ? `${label} · ${v.heading}` : v.heading,
      entries: [v],
    });
  }
  return out;
}

export default function ReadingPage() {
  const [state, setState] = useState("loading"); // loading | ok | invalid
  const [card, setCard] = useState(null);
  const sceneRef = useRef(null);
  const sectionRefs = useRef({});

  // Разбор ссылки: фрагмент (#r=) или query (?r=) — по паттерну OrderRef,
  // без useSearchParams (совместимо со статическим экспортом).
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const raw = window.location.hash || window.location.search;
        const c = await decodeReadingToken(raw);
        if (alive) {
          setCard(c);
          setState("ok");
        }
      } catch {
        if (alive) setState("invalid");
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  const reading = useMemo(() => {
    if (!card) return null;
    try {
      return calculateReading({
        name: `${card.fn} ${card.ln || ""}`.trim(),
        date: card.bd,
      });
    } catch {
      return null;
    }
  }, [card]);

  const sections = useMemo(
    () => (reading ? buildSections(reading) : []),
    [reading]
  );

  // Скролл → прогресс сцены (туннель течёт мимо сущности).
  useEffect(() => {
    if (state !== "ok") return undefined;
    const onScroll = () => {
      const max = document.documentElement.scrollHeight - window.innerHeight;
      sceneRef.current?.setProgress(max > 0 ? (window.scrollY || 0) / max : 0);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [state]);

  // Контакт с пунктом: секция у центра экрана → акцент категории + вспышка.
  useEffect(() => {
    if (state !== "ok" || !sections.length) return undefined;
    let current = "";
    const io = new IntersectionObserver(
      (recs) => {
        for (const r of recs) {
          if (!r.isIntersecting) continue;
          const code = r.target.dataset.code;
          if (code === current) continue;
          current = code;
          const s = sections.find((x) => x.code === code);
          const accent = s?.accent || "#eaf6ff";
          sceneRef.current?.setAccent(accent);
          sceneRef.current?.pulse(accent);
        }
      },
      { rootMargin: "-42% 0px -42% 0px" }
    );
    for (const el of Object.values(sectionRefs.current)) {
      if (el) io.observe(el);
    }
    return () => io.disconnect();
  }, [state, sections]);

  if (state === "invalid" || (state === "ok" && !reading)) {
    return <ReadingError />;
  }
  if (state === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center text-sm text-foreground-muted">
        Opening your reading…
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Сцена: сущность + туннель, фиксирована за контентом. */}
      <div className="pointer-events-none fixed inset-0" style={{ zIndex: -5 }}>
        <ReadingScene ref={sceneRef} gender={card.g} />
      </div>

      <ReadingHero card={card} reading={reading} />

      {sections.map((s) =>
        s.kind === "matrix" ? (
          <PsychomatrixSection
            key={s.code}
            section={s}
            innerRef={(el) => (sectionRefs.current[s.code] = el)}
          />
        ) : (
          <PointSection
            key={s.code}
            section={s}
            innerRef={(el) => (sectionRefs.current[s.code] = el)}
          />
        )
      )}

      <VerdictSection
        card={card}
        reading={reading}
        verdictBank={verdictBank}
        innerRef={(el) => (sectionRefs.current.VERDICT = el)}
      />

      <footer className="pb-10 text-center text-[11px] text-foreground-muted/50">
        NOMEN · this reading is personal to {card.fn} — the link opens it anytime
      </footer>
    </div>
  );
}
