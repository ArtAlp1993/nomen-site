"use client";

import { motion, useReducedMotion } from "framer-motion";

// Единый reveal для всего сайта: мягкий подъём + разфокус (blur→0).
// Одно и то же премиальное замедление ([0.22,1,0.36,1]) на всём лендинге.
const EASE = [0.22, 1, 0.36, 1];

export default function Reveal({ children, delay = 0, className = "" }) {
  const reduce = useReducedMotion();

  if (reduce) {
    return <div className={className}>{children}</div>;
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 28, filter: "blur(8px)" }}
      whileInView={{ opacity: 1, y: 0, filter: "blur(0px)" }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.7, delay, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
