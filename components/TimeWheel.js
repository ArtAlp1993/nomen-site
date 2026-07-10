"use client";

import { Wheel } from "./DateWheel";

// Барабанный выбор времени рождения (часы · минуты) вместо системного
// time-picker. Тот же крутящийся барабан, что и у даты. Значение наружу —
// строка "HH:MM", как у <input type="time">. Поле опциональное: пока
// пользователь не тронул барабан, наверх ничего не уходит (birthTime = "").

const HOURS = Array.from({ length: 24 }, (_, i) => i);
const MINUTES = Array.from({ length: 60 }, (_, i) => i);
const pad = (v) => String(v).padStart(2, "0");

export default function TimeWheel({ value, onChange }) {
  // value: "HH:MM" или "" — тогда показываем 12:00 как нейтральный старт,
  // но наверх не эмитим, пока не покрутили.
  const [h, m] = (value || "12:00").split(":").map(Number);

  const set = (nh, nm) => onChange(`${pad(nh)}:${pad(nm)}`);

  return (
    <div className="mx-auto flex w-full max-w-[10rem] gap-1 rounded-xl border border-foreground-muted/40 bg-background-alt px-2 py-1">
      <Wheel
        ariaLabel="Hour of birth"
        values={HOURS}
        value={h}
        onChange={(nh) => set(nh, m)}
        format={pad}
      />
      <Wheel
        ariaLabel="Minute of birth"
        values={MINUTES}
        value={m}
        onChange={(nm) => set(h, nm)}
        format={pad}
      />
    </div>
  );
}
