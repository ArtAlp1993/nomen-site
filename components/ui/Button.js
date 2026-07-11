"use client";

import { useRef, useState } from "react";
import Link from "next/link";

const base =
  "inline-flex items-center justify-center rounded-full px-8 py-3 font-heading text-sm font-semibold tracking-wide transition-transform duration-200 ease-out will-change-transform disabled:cursor-not-allowed disabled:opacity-45";

const variants = {
  primary:
    "text-background bg-gradient-to-r from-accent-violet to-accent-turquoise glow-violet",
  secondary:
    "text-foreground border border-foreground-muted/40 hover:border-accent-turquoise hover:text-accent-turquoise",
};

// Магнитный эффект: кнопка мягко тянется к курсору (только transform),
// возвращается пружиной. Отключается при prefers-reduced-motion.
const STRENGTH = 0.35; // доля смещения от расстояния до центра
const MAX = 10; // максимум пикселей

export default function Button({
  children,
  href,
  variant = "primary",
  className = "",
  pulse = false,
  ...props
}) {
  const ref = useRef(null);
  const [t, setT] = useState({ x: 0, y: 0, s: 1 });

  const reduce =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  const onMove = (e) => {
    if (reduce || !ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2);
    const dy = e.clientY - (r.top + r.height / 2);
    setT({
      x: Math.max(-MAX, Math.min(MAX, dx * STRENGTH)),
      y: Math.max(-MAX, Math.min(MAX, dy * STRENGTH)),
      s: 1.03,
    });
  };
  const onLeave = () => setT({ x: 0, y: 0, s: 1 });

  const classes = `${base} ${variants[variant]} ${
    pulse ? "btn-pulse" : ""
  } ${className}`;
  const style = {
    transform: `translate(${t.x}px, ${t.y}px) scale(${t.s})`,
  };
  const handlers = { onMouseMove: onMove, onMouseLeave: onLeave, style };

  if (href) {
    return (
      <Link ref={ref} href={href} className={classes} {...handlers} {...props}>
        {children}
      </Link>
    );
  }

  return (
    <button ref={ref} className={classes} {...handlers} {...props}>
      {children}
    </button>
  );
}
