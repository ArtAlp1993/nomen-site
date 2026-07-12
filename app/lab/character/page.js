"use client";

// Прототип «растущего персонажа» (C2a, З-22) — скрытая страница /lab/character.
// Вводишь карточку (имя + дата + пол) → ползунок «Рост 0→100%» тянет ВСЕ черты
// одновременно от зародыша к финалу. Ползунки ВЕСОВ — у каждой черты свой, легко
// крутится баланс (какая черта меняет больше/меньше). Всё детерминированно из
// карточки. Движок — lib/characterSkills.js, шарик — тот же BlueprintScene.

import { useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { calculateReading } from "@/lib/teaser";
import { composeCharacter, SKILL_TRAITS } from "@/lib/characterSkills";

const BlueprintScene = dynamic(() => import("@/components/BlueprintScene"), {
  ssr: false,
});

const panelCls =
  "pointer-events-auto rounded-xl border border-foreground-muted/25 bg-background/80 backdrop-blur-md";

// Дефолтные веса из движка (правим ползунками).
const DEFAULT_WEIGHTS = Object.fromEntries(
  SKILL_TRAITS.map((t) => [t.code, t.weight])
);

export default function CharacterLabPage() {
  const [name, setName] = useState("James Steven");
  const [date, setDate] = useState("1988-03-21");
  const [gender, setGender] = useState("m");
  const [progress, setProgress] = useState(1);
  const [weights, setWeights] = useState(DEFAULT_WEIGHTS);

  // Карточка — детерминированно из имени+даты. Может бросить (кривая дата) → null.
  const reading = useMemo(() => {
    try {
      return calculateReading({ name, date });
    } catch {
      return null;
    }
  }, [name, date]);

  const cfg = useMemo(
    () => (reading ? composeCharacter(reading, gender, progress, weights) : null),
    [reading, gender, progress, weights]
  );

  const setWeight = (code, v) => setWeights((w) => ({ ...w, [code]: v }));
  const resetWeights = () => setWeights(DEFAULT_WEIGHTS);

  return (
    <main className="h-screen overflow-hidden">
      {/* Персонаж — фоном по центру */}
      <div className="fixed inset-0 z-0">
        {cfg && <BlueprintScene config={cfg} accent="#33e6e0" />}
      </div>

      <div className="pointer-events-none fixed inset-0 z-10">
        {/* Верх: заголовок + ввод карточки */}
        <div className="pointer-events-auto absolute inset-x-0 top-0 flex flex-wrap items-center gap-2 px-4 py-3">
          <h1 className="font-heading text-sm font-semibold text-foreground/90">
            Растущий персонаж
          </h1>
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Имя"
            className="w-40 rounded-md border border-foreground-muted/30 bg-background/70 px-2 py-1 text-xs text-foreground"
          />
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-md border border-foreground-muted/30 bg-background/70 px-2 py-1 text-xs text-foreground"
          />
          <select
            value={gender}
            onChange={(e) => setGender(e.target.value)}
            className="rounded-md border border-foreground-muted/30 bg-background/70 px-2 py-1 text-xs text-foreground"
          >
            <option value="m">муж</option>
            <option value="f">жен</option>
            <option value="n">нейтр</option>
          </select>
          {!reading && (
            <span className="text-xs text-accent-coral">проверь дату/имя</span>
          )}
        </div>

        {/* Левый столбец: веса черт */}
        <div
          className="absolute left-3 top-14 bottom-20 flex w-64 flex-col gap-1 overflow-y-auto pr-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          data-lenis-prevent
        >
          <div className={`${panelCls} px-3 py-2`}>
            <div className="mb-1 flex items-center justify-between">
              <span className="font-heading text-[11px] uppercase tracking-[0.18em] text-accent-turquoise">
                Веса черт
              </span>
              <button
                type="button"
                onClick={resetWeights}
                className="text-[10px] text-foreground-muted hover:text-foreground"
              >
                сброс
              </button>
            </div>
            {SKILL_TRAITS.map((t) => (
              <label key={t.code} className="mb-1.5 block text-[11px]">
                <span className="flex justify-between text-foreground-muted">
                  <span>
                    <b className="text-foreground">{t.code}</b> {t.label}
                  </span>
                  <span className="font-mono text-foreground">
                    {weights[t.code].toFixed(2)}
                  </span>
                </span>
                <input
                  type="range"
                  min={0}
                  max={1.5}
                  step={0.05}
                  value={weights[t.code]}
                  onChange={(e) => setWeight(t.code, parseFloat(e.target.value))}
                  className="mt-0.5 w-full accent-[#33e6e0]"
                />
              </label>
            ))}
          </div>
        </div>

        {/* Низ по центру: ползунок роста + быстрые кнопки */}
        <div className="pointer-events-auto absolute inset-x-0 bottom-0 flex flex-col items-center gap-1 px-4 pb-3">
          <div className={`${panelCls} w-full max-w-md px-4 py-2`}>
            <div className="flex items-center justify-between text-[11px] text-foreground-muted">
              <span className="font-heading uppercase tracking-[0.18em] text-accent-turquoise">
                Рост персонажа
              </span>
              <span className="font-mono text-foreground">
                {Math.round(progress * 100)}%
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={progress}
              onChange={(e) => setProgress(parseFloat(e.target.value))}
              className="mt-1 w-full accent-[#33e6e0]"
            />
            <div className="mt-1 flex justify-center gap-2 text-[10px]">
              {[0, 0.25, 0.5, 0.75, 1].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setProgress(p)}
                  className="rounded-full border border-foreground-muted/30 px-2 py-0.5 text-foreground-muted hover:border-foreground hover:text-foreground"
                >
                  {p === 0 ? "зародыш" : `${p * 100}%`}
                </button>
              ))}
            </div>
          </div>
          <p className="text-center text-[10px] text-foreground-muted/70">
            0% = зародыш · 100% = собранный персонаж. Все черты растут
            одновременно; вес слева задаёт, какая меняет сильнее.
          </p>
        </div>
      </div>
    </main>
  );
}
