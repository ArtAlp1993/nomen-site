"use client";

import { motion, useReducedMotion } from "framer-motion";
import { EASE } from "@/lib/motion";

const LINE1 = ["You", "were", "never", "random."];
const LINE2 = ["You", "were", "coded."];

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.2 } },
};
const word = {
  hidden: { opacity: 0, y: 18, filter: "blur(8px)" },
  show: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.7, ease: EASE } },
};

export default function KineticHeadline({ className = "" }) {
  const reduce = useReducedMotion();

  const h1Class =
    "max-w-3xl font-heading text-4xl font-semibold leading-tight sm:text-5xl md:text-6xl";

  if (reduce) {
    return (
      <h1 className={`${h1Class} ${className}`}>
        You were never random.
        <br />
        <span className="bg-gradient-to-r from-accent-violet to-accent-turquoise bg-clip-text text-transparent">
          You were coded.
        </span>
      </h1>
    );
  }

  return (
    <motion.h1
      variants={container}
      initial="hidden"
      animate="show"
      className={`${h1Class} ${className}`}
    >
      <span className="inline-block">
        {LINE1.map((w, i) => (
          <motion.span key={i} variants={word} className="mr-[0.25em] inline-block">
            {w}
          </motion.span>
        ))}
      </span>
      <br />
      <span className="inline-block">
        {LINE2.map((w, i) => (
          <motion.span
            key={i}
            variants={word}
            className="mr-[0.25em] inline-block bg-gradient-to-r from-accent-violet to-accent-turquoise bg-clip-text text-transparent"
          >
            {w}
          </motion.span>
        ))}
      </span>
    </motion.h1>
  );
}
