"use client";

import { useEffect, useRef } from "react";

// Светящаяся двойная ДНК-спираль, идущая через весь сайт.
// НЕ видна на первом экране (Hero): проявляется плавно, когда пользователь
// проскроллил ниже Hero (к секции Hook). Ниже — шире/объёмнее.
// Фиксирована за контентом, «течёт» при скролле. Canvas, без зависимостей.
// Уважает prefers-reduced-motion (без авто-дрейфа, только реакция на скролл).
export default function SiteSpiral() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0, height = 0, dpr = 1;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    window.addEventListener("resize", resize);

    const render = (time) => {
      ctx.clearRect(0, 0, width, height);

      const cx = width / 2;
      const amp = width < 768 ? 60 : 120;
      const wavelength = width < 768 ? 190 : 260;
      const step = 6;
      const scroll = window.scrollY || window.pageYOffset || 0;
      const phase = scroll * 0.006 + (reduce ? 0 : time * 0.00018);

      // Спираль скрыта на первом экране (Hero) и плавно проявляется, когда
      // пользователь уходит ниже. Порог — ~85% высоты первого экрана; к началу
      // следующей секции (Hook) спираль уже полностью видна.
      const start = height * 0.55;
      const full = height * 1.0;
      const visibility = Math.max(0, Math.min(1, (scroll - start) / (full - start)));
      if (visibility <= 0) {
        rafId = requestAnimationFrame(render);
        return;
      }
      // Плавное проявление всей спирали (fade-in при уходе с первого экрана).
      ctx.globalAlpha = visibility;

      const strandX = (y, offset) =>
        cx + amp * Math.sin((y / wavelength) * Math.PI * 2 + phase + offset);

      // Перекладины между двумя нитями
      for (let y = -amp; y < height + amp; y += 26) {
        const x1 = strandX(y, 0);
        const x2 = strandX(y, Math.PI);
        const depth = (Math.sin((y / wavelength) * Math.PI * 2 + phase) + 1) / 2;
        ctx.strokeStyle = `rgba(108,79,246,${0.05 + depth * 0.22})`;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(x1, y);
        ctx.lineTo(x2, y);
        ctx.stroke();
      }

      // Две нити со свечением
      for (const offset of [0, Math.PI]) {
        ctx.beginPath();
        for (let y = -amp; y < height + amp; y += step) {
          const x = strandX(y, offset);
          if (y === -amp) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const grad = ctx.createLinearGradient(0, 0, 0, height);
        grad.addColorStop(0, "rgba(51,230,224,0.32)");
        grad.addColorStop(0.5, "rgba(108,79,246,0.32)");
        grad.addColorStop(1, "rgba(51,230,224,0.32)");
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.6;
        ctx.shadowColor = "rgba(51,230,224,0.5)";
        ctx.shadowBlur = 10;
        ctx.stroke();
      }

      // Светящиеся точки на нитях
      for (const offset of [0, Math.PI]) {
        for (let y = -amp; y < height + amp; y += 26) {
          const x = strandX(y, offset);
          const depth = (Math.sin((y / wavelength) * Math.PI * 2 + phase + offset) + 1) / 2;
          ctx.beginPath();
          ctx.arc(x, y, 1.2 + depth * 1.8, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(190,240,255,${0.2 + depth * 0.4})`;
          ctx.shadowColor = "rgba(51,230,224,0.8)";
          ctx.shadowBlur = 8;
          ctx.fill();
        }
      }
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(render);
    };

    let rafId = requestAnimationFrame(render);
    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: -10 }}
    />
  );
}
