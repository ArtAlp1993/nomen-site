"use client";

import { useEffect } from "react";
import Lenis from "lenis";

// Плавный инерционный скролл (как на премиальных motion-лендингах).
// Уважает prefers-reduced-motion: при нём остаётся нативный скролл.
// Также сглаживает переходы по якорям (#quiz, #pricing) через lenis.scrollTo.
export default function SmoothScroll() {
  useEffect(() => {
    if (
      typeof window === "undefined" ||
      window.matchMedia("(prefers-reduced-motion: reduce)").matches
    ) {
      return;
    }

    const lenis = new Lenis({
      duration: 1.1,
      lerp: 0.1,
      smoothWheel: true,
    });

    // Инстанс наружу — им пользуется кнопка «наверх» (FloatingDock).
    window.__lenis = lenis;

    // Страница растёт после инициализации (3D-сцены, результаты квиза,
    // поэтапные раскрытия) — без пересчёта Lenis упирается в старую высоту
    // и не даёт долистать до подвала. Следим за высотой контента сами.
    const ro = new ResizeObserver(() => lenis.resize());
    ro.observe(document.body);

    let rafId;
    const raf = (time) => {
      lenis.raf(time);
      rafId = requestAnimationFrame(raf);
    };
    rafId = requestAnimationFrame(raf);

    // Плавные переходы по внутренним якорям.
    const onClick = (e) => {
      const link = e.target.closest('a[href^="#"]');
      if (!link) return;
      const id = link.getAttribute("href");
      if (id.length < 2) return;
      const target = document.querySelector(id);
      if (target) {
        e.preventDefault();
        lenis.scrollTo(target, { offset: -20 });
      }
    };
    document.addEventListener("click", onClick);

    return () => {
      cancelAnimationFrame(rafId);
      document.removeEventListener("click", onClick);
      ro.disconnect();
      if (window.__lenis === lenis) delete window.__lenis;
      lenis.destroy();
    };
  }, []);

  return null;
}
