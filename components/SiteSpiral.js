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

    // «Пыльца»: лёгкие светящиеся частицы, с первого кадра рассеяны по всему
    // экрану и медленно, хаотично дрейфуют. Очень прозрачные — подсвечивают
    // тёмный фон «вкраплениями», не мешая чтению.
    const DUST_COLORS = ["190,240,255", "51,230,224", "150,120,255"];
    let dust = [];
    const initDust = () => {
      const isMobile = width < 768;
      const count = Math.max(
        30,
        Math.min(isMobile ? 50 : 100, Math.round((width * height) / 20000))
      );
      dust = Array.from({ length: count }, () => {
        const angle = Math.random() * Math.PI * 2;
        const speed = 6 + Math.random() * 14; // пикселей в секунду
        return {
          x: Math.random() * width,
          y: Math.random() * height,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          size: 0.7 + Math.random() * 1.5,
          color: DUST_COLORS[(Math.random() * DUST_COLORS.length) | 0],
          tw: Math.random() * Math.PI * 2, // фаза мерцания
          wander: Math.random() * Math.PI * 2, // фаза блуждания
        };
      });
    };
    initDust();
    window.addEventListener("resize", initDust);

    // Пыль, «вытряхнутая» шариком (пасхалка в CosmicScene): рождается на его
    // кончиках, резво разлетается по экрану и за несколько секунд растворяется.
    const onBurst = (ev) => {
      const points = (ev.detail && ev.detail.points) || [];
      for (const pt of points) {
        for (let k = 0; k < 4; k++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 40 + Math.random() * 90;
          dust.push({
            x: pt.x,
            y: pt.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 0.8 + Math.random() * 1.6,
            color: DUST_COLORS[(Math.random() * DUST_COLORS.length) | 0],
            tw: Math.random() * Math.PI * 2,
            wander: Math.random() * Math.PI * 2,
            life: 7 + Math.random() * 4, // секунды до растворения
          });
        }
      }
    };
    window.addEventListener("nomen-dust-burst", onBurst);

    let prevTime = 0;
    const drawDust = (time, dt) => {
      const isMobile = width < 768;
      for (const p of dust) {
        if (!reduce) {
          // Хаотичное блуждание: курс частицы плавно и случайно меняется.
          p.wander += dt * 0.6;
          p.vx += Math.cos(p.wander) * 3 * dt;
          p.vy += Math.sin(p.wander * 0.9) * 3 * dt;
          p.vx *= 0.998;
          p.vy *= 0.998;
          p.x += p.vx * dt;
          p.y += p.vy * dt;
        }
        // Уходя за край, частица появляется с противоположной стороны.
        if (p.x < -6) p.x = width + 6;
        else if (p.x > width + 6) p.x = -6;
        if (p.y < -6) p.y = height + 6;
        else if (p.y > height + 6) p.y = -6;

        const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 + p.tw);
        let alpha = 0.05 + twinkle * 0.2;
        if (p.life !== undefined) {
          p.life -= dt;
          // Вытряхнутая пыль ярче обычной и тает в последние 3 секунды.
          alpha = (0.15 + twinkle * 0.25) * Math.max(0, Math.min(1, p.life / 3));
        }
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${alpha})`;
        if (!isMobile) {
          ctx.shadowColor = `rgba(${p.color},0.5)`;
          ctx.shadowBlur = 5;
        }
        ctx.fill();
      }
      ctx.shadowBlur = 0;
      if (dust.some((p) => p.life !== undefined && p.life <= 0)) {
        dust = dust.filter((p) => p.life === undefined || p.life > 0);
      }
    };

    const render = (time) => {
      ctx.clearRect(0, 0, width, height);

      const dt = Math.min(0.05, prevTime ? (time - prevTime) / 1000 : 0.016);
      prevTime = time;
      // Пыльца видна всегда, в том числе на первом экране (летит от шарика).
      ctx.globalAlpha = 1;
      drawDust(time, dt);

      const cx = width / 2;
      const amp = width < 768 ? 60 : 120;
      const wavelength = width < 768 ? 190 : 260;
      const step = 6;
      const scroll = window.scrollY || window.pageYOffset || 0;
      const phase = scroll * 0.006 + (reduce ? 0 : time * 0.00018);

      // Спираль скрыта на первом экране (Hero) и плавно проявляется, когда
      // пользователь уходит ниже — чуть раньше середины экрана, чтобы при
      // прокрутке не было тёмного «пробела» между Hero и первой секцией.
      const start = height * 0.35;
      const full = height * 0.8;
      const visibility = Math.max(0, Math.min(1, (scroll - start) / (full - start)));
      if (visibility <= 0) {
        rafId = requestAnimationFrame(render);
        return;
      }
      // Плавное проявление всей спирали (fade-in при уходе с первого экрана).
      ctx.globalAlpha = visibility;

      // «Дыхание»: амплитуда медленно гуляет и по длине страницы, и во времени —
      // спираль по всей длине лендинга плавно то расширяется, то сужается.
      const breatheT = reduce ? 0 : time * 0.00035;
      const ampAt = (y) => amp * (1 + 0.16 * Math.sin(y * 0.0016 + breatheT));
      const strandX = (y, offset) =>
        cx + ampAt(y) * Math.sin((y / wavelength) * Math.PI * 2 + phase + offset);

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
        grad.addColorStop(0, "rgba(51,230,224,0.37)");
        grad.addColorStop(0.5, "rgba(108,79,246,0.37)");
        grad.addColorStop(1, "rgba(51,230,224,0.37)");
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
          ctx.fillStyle = `rgba(190,240,255,${0.22 + depth * 0.45})`;
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
      window.removeEventListener("resize", initDust);
      window.removeEventListener("nomen-dust-burst", onBurst);
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
