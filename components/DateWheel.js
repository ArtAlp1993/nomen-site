"use client";

import { useEffect, useRef } from "react";

// Барабанный выбор даты (месяц · день · год) вместо системного календаря.
// Каждая колонка крутится по кругу: дошёл до края — список бесшовно
// продолжается с начала (значения повторены REPEAT раз, при уходе от центра
// позиция незаметно возвращается на средний повтор).
// Значение наружу — строка YYYY-MM-DD, как у <input type="date">.

const ITEM_H = 40; // высота строки, px
const VISIBLE = 5; // строк в окне (нечётное)
const REPEAT = 7; // повторов списка (нечётное, старт в середине)

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

const YEARS = [];
for (let y = 1930; y <= 2020; y++) YEARS.push(y);

const daysInMonth = (m, y) => new Date(y, m, 0).getDate();

export function Wheel({ values, value, onChange, format = String, ariaLabel }) {
  const ref = useRef(null);
  const emitted = useRef(value);
  const idleTimer = useRef(null);
  const n = values.length;
  const period = n * ITEM_H;
  const mid = Math.floor(REPEAT / 2) * period;
  const padding = ((VISIBLE - 1) / 2) * ITEM_H;

  // Стартовая позиция и реакция на ВНЕШНЕЕ изменение значения (например,
  // 31-е число схлопнулось в 28 из-за смены месяца). Изменения, которые
  // породил сам скролл (value === emitted.current), позицию не трогают —
  // иначе колесо «подтягивало» бы палец к засечке во время прокрутки.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const idx = Math.max(0, values.indexOf(value));
    const target = mid + idx * ITEM_H;
    if (el.scrollTop === 0) {
      el.scrollTop = target; // первый маунт
    } else if (value !== emitted.current) {
      emitted.current = value;
      el.scrollTop = target; // значение поменяли снаружи
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    // Ушли от середины больше чем на период — бесшовно перескакиваем назад.
    if (el.scrollTop < mid - period || el.scrollTop > mid + period) {
      const offset = ((el.scrollTop % period) + period) % period;
      el.scrollTop = mid + offset;
    }
    const sel = ((Math.round(el.scrollTop / ITEM_H) % n) + n) % n;
    const v = values[sel];
    if (v !== emitted.current) {
      emitted.current = v;
      onChange(v);
    }
    // Дощёлкивание к ближайшей строке после остановки.
    clearTimeout(idleTimer.current);
    idleTimer.current = setTimeout(() => {
      const snapped = Math.round(el.scrollTop / ITEM_H) * ITEM_H;
      if (Math.abs(el.scrollTop - snapped) > 1) {
        el.scrollTo({ top: snapped, behavior: "smooth" });
      }
    }, 120);
  };

  useEffect(() => () => clearTimeout(idleTimer.current), []);

  return (
    <div
      className="relative flex-1"
      style={{ height: VISIBLE * ITEM_H }}
      aria-label={ariaLabel}
    >
      <div
        ref={ref}
        onScroll={onScroll}
        // Доступность: колонку можно сфокусировать и крутить стрелками ↑/↓.
        tabIndex={0}
        role="listbox"
        aria-label={ariaLabel}
        onKeyDown={(e) => {
          const el = ref.current;
          if (!el) return;
          if (e.key === "ArrowDown") {
            e.preventDefault();
            el.scrollBy({ top: ITEM_H, behavior: "smooth" });
          } else if (e.key === "ArrowUp") {
            e.preventDefault();
            el.scrollBy({ top: -ITEM_H, behavior: "smooth" });
          }
        }}
        // data-lenis-prevent: иначе Lenis (плавный скролл страницы)
        // перехватывает колесо мыши, и барабан на десктопе не крутится.
        data-lenis-prevent
        className="h-full overflow-y-scroll overscroll-contain outline-none focus-visible:ring-1 focus-visible:ring-accent-turquoise/50 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        <div style={{ height: padding }} />
        {Array.from({ length: REPEAT }).map((_, r) =>
          values.map((v, i) => (
            <button
              type="button"
              key={`${r}-${i}`}
              tabIndex={-1}
              onClick={() => {
                const el = ref.current;
                if (el) {
                  el.scrollTo({
                    top: (r * n + i) * ITEM_H,
                    behavior: "smooth",
                  });
                }
              }}
              className={`flex w-full items-center justify-center font-heading text-base transition-colors ${
                v === value ? "text-foreground" : "text-foreground-muted/50"
              }`}
              style={{ height: ITEM_H }}
            >
              {format(v)}
            </button>
          ))
        )}
        <div style={{ height: padding }} />
      </div>
      {/* Маски сверху/снизу и рамка выбранной строки */}
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[80px] bg-gradient-to-b from-background-alt to-transparent" />
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-[80px] bg-gradient-to-t from-background-alt to-transparent" />
      <div
        className="pointer-events-none absolute inset-x-1 border-y border-accent-turquoise/40"
        style={{ top: padding, height: ITEM_H }}
      />
    </div>
  );
}

export default function DateWheel({ value, onChange }) {
  // value: "YYYY-MM-DD" (или "" — тогда дефолт).
  const [y, m, d] = (value || "1995-06-15").split("-").map(Number);

  const set = (ny, nm, nd) => {
    const dim = daysInMonth(nm, ny);
    const day = Math.min(nd, dim);
    onChange(
      `${String(ny).padStart(4, "0")}-${String(nm).padStart(2, "0")}-${String(day).padStart(2, "0")}`
    );
  };

  const days = [];
  for (let i = 1; i <= daysInMonth(m, y); i++) days.push(i);
  const months = MONTHS.map((_, i) => i + 1);

  return (
    <div className="mx-auto flex w-full max-w-xs gap-1 rounded-xl border border-foreground-muted/40 bg-background-alt px-2 py-1">
      <Wheel
        ariaLabel="Month of birth"
        values={months}
        value={m}
        onChange={(nm) => set(y, nm, d)}
        format={(v) => MONTHS[v - 1]}
      />
      <Wheel
        ariaLabel="Day of birth"
        values={days}
        value={d}
        onChange={(nd) => set(y, m, nd)}
      />
      <Wheel
        ariaLabel="Year of birth"
        values={YEARS}
        value={y}
        onChange={(ny) => set(ny, m, d)}
      />
    </div>
  );
}
