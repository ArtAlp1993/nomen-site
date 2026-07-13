"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

// Светящаяся двойная ДНК-спираль, идущая через весь сайт.
// НЕ видна на первом экране (Hero): проявляется плавно, когда пользователь
// проскроллил ниже Hero (к секции Hook). Ниже — шире/объёмнее.
// Фиксирована за контентом, «течёт» при скролле. Canvas, без зависимостей.
// Уважает prefers-reduced-motion (без авто-дрейфа, только реакция на скролл).
//
// Перф (13.07): без дорогого canvas `shadowBlur` — свечение имитируется дешёвым
// двойным штрихом (широкий бледный + узкий яркий). dpr ограничен 1.5 (фон не
// требует retina). Петля встаёт на паузу, когда вкладка скрыта.
export default function SiteSpiral() {
  const canvasRef = useRef(null);
  // На страницах с собственной полноэкранной сценой (/reading — туннель,
  // /studio — рабочий инструмент) фоновая спираль не нужна: экономим GPU.
  const pathname = usePathname() || "";
  const hidden = pathname.startsWith("/reading") || pathname.startsWith("/studio");

  useEffect(() => {
    if (hidden) return undefined;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0, height = 0, dpr = 1;
    const resize = () => {
      width = window.innerWidth;
      height = window.innerHeight;
      // Фон не требует retina-чёткости — держим dpr до 1.5 ради кадрового бюджета.
      dpr = Math.min(window.devicePixelRatio || 1, 1.5);
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
    // Цвета взрыва пасхалки: золото + энергия (ярче обычной пыльцы).
    const BURST_COLORS = ["255,210,90", "255,180,60", "190,240,255", "51,230,224"];
    const onBurst = (ev) => {
      const points = (ev.detail && ev.detail.points) || [];
      for (const pt of points) {
        for (let k = 0; k < 9; k++) {
          const angle = Math.random() * Math.PI * 2;
          const speed = 90 + Math.random() * 190; // резвее обычной пыли
          dust.push({
            x: pt.x,
            y: pt.y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            size: 1 + Math.random() * 2.2, // крупнее
            color: BURST_COLORS[(Math.random() * BURST_COLORS.length) | 0],
            tw: Math.random() * Math.PI * 2,
            wander: Math.random() * Math.PI * 2,
            life: 6 + Math.random() * 4, // секунды до растворения
          });
        }
      }
    };
    window.addEventListener("nomen-dust-burst", onBurst);

    let prevTime = 0;
    const drawDust = (time, dt) => {
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
        // Без shadowBlur: лёгкий «гало»-круг под ядром даёт мягкое свечение дёшево.
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size * 2.1, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${alpha * 0.32})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${p.color},${alpha})`;
        ctx.fill();
      }
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

      // Две нити: широкий бледный «глоу»-проход + узкая яркая линия.
      // Заменяет дорогой shadowBlur дешёвым двойным штрихом (тот же вид, легче).
      for (const offset of [0, Math.PI]) {
        ctx.beginPath();
        for (let y = -amp; y < height + amp; y += step) {
          const x = strandX(y, offset);
          if (y === -amp) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        const glow = ctx.createLinearGradient(0, 0, 0, height);
        glow.addColorStop(0, "rgba(51,230,224,0.12)");
        glow.addColorStop(0.5, "rgba(108,79,246,0.12)");
        glow.addColorStop(1, "rgba(51,230,224,0.12)");
        ctx.strokeStyle = glow;
        ctx.lineWidth = 3.6;
        ctx.stroke();

        const core = ctx.createLinearGradient(0, 0, 0, height);
        core.addColorStop(0, "rgba(51,230,224,0.4)");
        core.addColorStop(0.5, "rgba(108,79,246,0.4)");
        core.addColorStop(1, "rgba(51,230,224,0.4)");
        ctx.strokeStyle = core;
        ctx.lineWidth = 1.4;
        ctx.stroke();
      }

      // Светящиеся точки на нитях (гало-круг + ядро вместо shadowBlur).
      for (const offset of [0, Math.PI]) {
        for (let y = -amp; y < height + amp; y += 26) {
          const x = strandX(y, offset);
          const depth = (Math.sin((y / wavelength) * Math.PI * 2 + phase + offset) + 1) / 2;
          const r = 1.2 + depth * 1.8;
          ctx.beginPath();
          ctx.arc(x, y, r * 2.2, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(51,230,224,${(0.22 + depth * 0.45) * 0.28})`;
          ctx.fill();
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(190,240,255,${0.22 + depth * 0.45})`;
          ctx.fill();
        }
      }
      ctx.globalAlpha = 1;

      rafId = requestAnimationFrame(render);
    };

    let rafId = requestAnimationFrame(render);

    // Скрытая вкладка — глушим петлю (кадры в фоне не нужны, экономим батарею/CPU).
    const onVisibility = () => {
      if (document.hidden) {
        cancelAnimationFrame(rafId);
      } else {
        prevTime = 0;
        rafId = requestAnimationFrame(render);
      }
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      cancelAnimationFrame(rafId);
      window.removeEventListener("resize", resize);
      window.removeEventListener("resize", initDust);
      window.removeEventListener("nomen-dust-burst", onBurst);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [hidden]);

  if (hidden) return null;
  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="pointer-events-none fixed inset-0 h-full w-full"
      style={{ zIndex: -10 }}
    />
  );
}
