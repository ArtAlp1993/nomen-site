"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import dynamic from "next/dynamic";
import { decodeReadingToken, extractReadingCode, fetchReadingByCode } from "@/lib/readingLink";
import { calculateReading } from "@/lib/teaser";
import { buildSections } from "@/lib/buildReading";
import {
  ReadingHero,
  PointSection,
  PsychomatrixSection,
  VerdictSection,
  ReadingError,
} from "./ReadingSections";

// 3D-сцена — только на клиенте (WebGL).
const ReadingScene = dynamic(() => import("./ReadingScene"), { ssr: false });

export default function ReadingPage() {
  const [state, setState] = useState("loading"); // loading | ok | invalid
  const [card, setCard] = useState(null);
  const sceneRef = useRef(null);
  const sectionRefs = useRef({});

  // Разбор ссылки. Два формата:
  //  · короткая /r/<code> (или ?c=) — карточка тянется с сервера по коду;
  //  · длинная #r=… (или ?r=) — карточка зашита в самой ссылке (самодостаточна).
  // Без useSearchParams — совместимо со статическим экспортом.
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const code = extractReadingCode(window.location);
        const c = code
          ? await fetchReadingByCode(code)
          : await decodeReadingToken(window.location.hash || window.location.search);
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
        innerRef={(el) => (sectionRefs.current.VERDICT = el)}
      />

      <footer className="ym-hide-content pb-10 text-center text-[11px] text-foreground-muted/50">
        NOMEN · this reading is personal to {card.fn} · the link opens it anytime
      </footer>
    </div>
  );
}
