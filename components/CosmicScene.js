"use client";

import { useEffect, useRef } from "react";

// Настоящая 3D-сцена на Canvas без внешних зависимостей: вращающийся
// каркасный икосаэдр (сакральная геометрия) со свечением рёбер и вершин,
// парящее звёздное поле и мягкие туманности. Проекция 3D→2D считается сами.
// Уважает prefers-reduced-motion и облегчается на мобильных.
//
// Перф (13.07): без дорогого canvas `shadowBlur` — свечение имитируется дешёвым
// двойным штрихом рёбер и гало-кругом вершин. Петля встаёт на паузу, когда hero
// ушёл за экран (IntersectionObserver) и когда вкладка скрыта — на нижних
// секциях эта петля больше не отъедает кадровый бюджет скролла.

const PHI = (1 + Math.sqrt(5)) / 2;

// 12 вершин икосаэдра.
const RAW_VERTICES = [
  [-1, PHI, 0], [1, PHI, 0], [-1, -PHI, 0], [1, -PHI, 0],
  [0, -1, PHI], [0, 1, PHI], [0, -1, -PHI], [0, 1, -PHI],
  [PHI, 0, -1], [PHI, 0, 1], [-PHI, 0, -1], [-PHI, 0, 1],
];

// 30 рёбер (пары вершин на расстоянии 2 в исходных координатах).
const EDGES = [];
for (let i = 0; i < RAW_VERTICES.length; i++) {
  for (let j = i + 1; j < RAW_VERTICES.length; j++) {
    const dx = RAW_VERTICES[i][0] - RAW_VERTICES[j][0];
    const dy = RAW_VERTICES[i][1] - RAW_VERTICES[j][1];
    const dz = RAW_VERTICES[i][2] - RAW_VERTICES[j][2];
    if (Math.abs(dx * dx + dy * dy + dz * dz - 4) < 0.01) EDGES.push([i, j]);
  }
}

export default function CosmicScene({ className = "" }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    let width = 0;
    let height = 0;
    let dpr = Math.min(window.devicePixelRatio || 1, 2);
    let stars = [];

    const seedStars = () => {
      const count = width < 768 ? 70 : 140;
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * width,
        y: Math.random() * height,
        z: Math.random() * 0.8 + 0.2, // глубина → размер/скорость
        t: Math.random() * Math.PI * 2, // фаза мерцания
      }));
    };

    const resize = () => {
      const parent = canvas.parentElement;
      width = parent.clientWidth;
      height = parent.clientHeight;
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      canvas.width = width * dpr;
      canvas.height = height * dpr;
      canvas.style.width = width + "px";
      canvas.style.height = height + "px";
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      seedStars();
    };

    resize();
    window.addEventListener("resize", resize);

    // Пасхалка: быстрые тапы по шарику «заряжают» его кончики (с 4-го тапа
    // свечение нарастает), на пике шарик пугается — сжимается, встряхивается
    // и вытряхивает пыль, которая разлетается по всему экрану (ловит SiteSpiral).
    let taps = 0;
    let lastTap = 0;
    let charge = 0; // 0..1 — насколько «заряжены» кончики
    let fx = null; // {phase: "cower" | "shake" | "release", t0}
    let orbScale = 1;
    let explodes = 0; // пасхалку можно активировать максимум 3 раза подряд

    const project = (v, ax, ay) => {
      // Поворот вокруг Y и X, затем перспективная проекция.
      const cosY = Math.cos(ay), sinY = Math.sin(ay);
      const cosX = Math.cos(ax), sinX = Math.sin(ax);
      let x = v[0] * cosY - v[2] * sinY;
      let z = v[0] * sinY + v[2] * cosY;
      let y = v[1] * cosX - z * sinX;
      z = v[1] * sinX + z * cosX;
      const scale = (width < 768 ? 74 : 104) * orbScale;
      const persp = 4 / (4 + z);
      return {
        x: width / 2 + x * scale * persp,
        y: height / 2 + y * scale * persp,
        depth: z,
      };
    };

    const onTap = (e) => {
      if (fx) return;
      if (explodes >= 3) return; // лимит: не более 3 активаций пасхалки подряд
      // Кнопки и ссылки работают как обычно — их тапы не считаем.
      if (e.target.closest && e.target.closest("a,button,input,label")) return;
      const rect = canvas.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > window.innerHeight) return;
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      // Щедрая зона вокруг центра: на десктопе центр шарика перекрыт заголовком
      // и кнопкой, поэтому берём широкий радиус, чтобы клики мышью попадали.
      const r = (width < 768 ? 74 : 104) * 3.2;
      const dx = x - width / 2;
      const dy = y - height / 2;
      if (dx * dx + dy * dy > r * r) return;
      const now = performance.now();
      if (now - lastTap > 800) taps = 0; // серия прервана — начинаем заново
      lastTap = now;
      taps += 1;
      // Полный заряд к 5-му быстрому тапу (мягче: мышью на десктопе 7 кликов
      // подряд неочевидны). Первые два «будят», с 3-го свечение нарастает.
      if (taps >= 3) charge = Math.min(1, (taps - 2) / 3);
      // Тактильный отклик (Android; iOS Safari вибрацию из веба не даёт):
      // ощутимый импульс на КАЖДЫЙ тап, нарастающий по мере заряда.
      if (navigator.vibrate) {
        navigator.vibrate(Math.min(120, 25 + taps * 16));
      }
      if (charge >= 1) fx = { phase: "cower", t0: now };
    };
    if (!reduce) window.addEventListener("pointerdown", onTap);

    // Вытряхнутая пыль: координаты кончиков в системе окна → событие,
    // которое подхватывает полноэкранный слой пыльцы (SiteSpiral).
    const burst = (ax, ay) => {
      const rect = canvas.getBoundingClientRect();
      const points = RAW_VERTICES.map((v) => project(v, ax, ay)).map((p) => ({
        x: rect.left + p.x,
        y: rect.top + p.y,
      }));
      window.dispatchEvent(
        new CustomEvent("nomen-dust-burst", { detail: { points } })
      );
    };

    const drawNebula = () => {
      const blobs = [
        { x: 0.32, y: 0.38, r: 0.55, c: "108,79,246", a: 0.22 },
        { x: 0.7, y: 0.62, r: 0.5, c: "51,230,224", a: 0.14 },
      ];
      for (const b of blobs) {
        const g = ctx.createRadialGradient(
          b.x * width, b.y * height, 0,
          b.x * width, b.y * height, b.r * Math.max(width, height)
        );
        g.addColorStop(0, `rgba(${b.c},${b.a})`);
        g.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = g;
        ctx.fillRect(0, 0, width, height);
      }
    };

    const drawStars = (time) => {
      for (const s of stars) {
        const twinkle = 0.5 + 0.5 * Math.sin(time * 0.001 + s.t);
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.z * 1.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220,225,255,${0.15 + twinkle * 0.5 * s.z})`;
        ctx.fill();
        if (!reduce) {
          s.y += s.z * 0.06; // медленный дрейф вниз
          if (s.y > height) s.y = 0;
        }
      }
    };

    const drawGeometry = (ax, ay) => {
      const pts = RAW_VERTICES.map((v) => project(v, ax, ay));
      // Рёбра: свечение имитируем двойным штрихом (широкий бледный «глоу» +
      // узкая яркая линия) вместо дорогого shadowBlur.
      for (const [i, j] of EDGES) {
        const a = pts[i], b = pts[j];
        const depth = (a.depth + b.depth) / 2;
        const alpha = 0.38 + (1 - (depth + PHI) / (2 * PHI)) * 0.55;
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        const glowGrad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        glowGrad.addColorStop(0, `rgba(108,79,246,${alpha * 0.3})`);
        glowGrad.addColorStop(1, `rgba(51,230,224,${alpha * 0.3})`);
        ctx.strokeStyle = glowGrad;
        ctx.lineWidth = 3.4;
        ctx.stroke();
        const grad = ctx.createLinearGradient(a.x, a.y, b.x, b.y);
        grad.addColorStop(0, `rgba(108,79,246,${alpha})`);
        grad.addColorStop(1, `rgba(51,230,224,${alpha})`);
        ctx.strokeStyle = grad;
        ctx.lineWidth = 1.25;
        ctx.stroke();
      }
      // Вершины — светящиеся узлы (гало-круг + ядро). Заряд от тапов усиливает.
      const glow = 1 + charge * 1.4;
      for (const p of pts) {
        const front = (p.depth + PHI) / (2 * PHI);
        const rCore = (1.6 + front * 2.2) * (1 + charge * 0.7);
        ctx.beginPath();
        ctx.arc(p.x, p.y, rCore * (2.4 + charge * 1.4), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(51,230,224,${Math.min(0.6, 0.16 * glow)})`;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(p.x, p.y, rCore, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(180,240,255,${Math.min(1, (0.4 + front * 0.6) * glow)})`;
        ctx.fill();
      }
    };

    let raf;
    let running = false;
    let inView = true;
    let ax = -0.3;
    let ay = 0;
    const easeOut = (k) => 1 - (1 - k) * (1 - k);
    const render = (time) => {
      if (!running) return;
      ctx.clearRect(0, 0, width, height);
      drawNebula();
      drawStars(time);

      // Сценарий испуга: сжаться → задрожать → вытряхнуть пыль и вернуться.
      let shX = 0;
      let shY = 0;
      orbScale = 1;
      if (fx) {
        const t = time - fx.t0;
        if (fx.phase === "cower") {
          // Сжимается почти в точку у зрачка — «собирается перед взрывом».
          orbScale = 1 - 0.85 * easeOut(Math.min(1, t / 460));
          if (t >= 460) fx = { phase: "shake", t0: time };
        } else if (fx.phase === "shake") {
          const k = Math.min(1, t / 360);
          orbScale = 0.15;
          shX = Math.sin(t * 0.12) * 3 * (1 - k);
          shY = Math.cos(t * 0.16) * 2.5 * (1 - k);
          if (t >= 360) {
            // Взрыв: золотые искры (пыль), белая вспышка + меню (React-оверлей),
            // мощная вибрация.
            explodes += 1;
            burst(ax, ay);
            window.dispatchEvent(new CustomEvent("nomen-orb-explode"));
            if (navigator.vibrate) navigator.vibrate([60, 40, 130, 40, 260]);
            fx = { phase: "release", t0: time };
          }
        } else {
          // Из почти-точки резко расправляется с перелётом, затем оседает.
          if (t < 220) {
            orbScale = 0.15 + 1.15 * easeOut(t / 220); // 0.15 → 1.30
          } else {
            orbScale = 1.3 - 0.3 * easeOut(Math.min(1, (t - 220) / 440));
          }
          if (t >= 660) {
            fx = null;
            charge = 0;
            taps = 0;
          }
        }
      } else if (charge > 0 && performance.now() - lastTap > 2500) {
        // Серию бросили на полпути — заряд плавно стекает.
        charge = Math.max(0, charge - 0.008);
        if (charge === 0) taps = 0;
      }

      ctx.save();
      ctx.translate(shX, shY);
      drawGeometry(ax, ay);
      ctx.restore();

      if (!reduce) {
        ay += 0.0032;
        ax += 0.0011;
      }
      raf = requestAnimationFrame(render);
    };

    const drawStill = () => {
      ctx.clearRect(0, 0, width, height);
      drawNebula();
      drawStars(0);
      drawGeometry(ax, ay);
    };

    // Петля крутится только когда hero виден и вкладка активна.
    const startLoop = () => {
      if (running || reduce) return;
      if (!inView || document.hidden) return;
      running = true;
      raf = requestAnimationFrame(render);
    };
    const stopLoop = () => {
      running = false;
      cancelAnimationFrame(raf);
    };

    let io;
    if (reduce) {
      drawStill();
    } else {
      startLoop();
      io = new IntersectionObserver(([entry]) => {
        inView = entry.isIntersecting;
        if (inView) startLoop();
        else stopLoop();
      });
      io.observe(canvas);
    }
    const onVis = () => {
      if (reduce) return;
      if (document.hidden) stopLoop();
      else startLoop();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      stopLoop();
      window.removeEventListener("resize", resize);
      if (!reduce) window.removeEventListener("pointerdown", onTap);
      document.removeEventListener("visibilitychange", onVis);
      if (io) io.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className={className}
      aria-hidden="true"
    />
  );
}
