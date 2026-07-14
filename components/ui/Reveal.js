"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion";

// Единый reveal для всего сайта: мягкий подъём + проявление (opacity/transform).
// Премиальное замедление (EASE из lib/motion) — общий темп бренда на всех
// поверхностях. Без filter:blur — он даёт дорогой paint на каждом кадре reveal
// и добавляет «запинку» при входе секции; opacity и transform композитятся на GPU.

export default function Reveal({ children, delay = 0, className = "" }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 22 }}
      whileInView={{ opacity: 1, y: 0 }}
      // Без отрицательного margin: анимация стартует, едва элемент показался
      // из-за края экрана, и течёт, пока его докручивают, — без резкой вспышки.
      viewport={{ once: true, margin: "0px" }}
      transition={{ duration: 0.95, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
