"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import ChatWidget from "./ChatWidget";
import { ymGoal } from "./Analytics";

// Плавающий док справа снизу: кнопка чата (всегда) и кнопка «наверх»
// (появляется после ~одного экрана прокрутки). Едут вместе.

const btnClass =
  "flex h-11 w-11 items-center justify-center rounded-full border border-foreground-muted/30 bg-background-alt/80 text-foreground-muted shadow-lg backdrop-blur-md transition-colors hover:border-accent-turquoise/60 hover:text-foreground";

export default function FloatingDock() {
  const [showTop, setShowTop] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    const onScroll = () =>
      setShowTop((window.scrollY || 0) > window.innerHeight * 0.9);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const scrollTop = () => {
    if (window.__lenis) window.__lenis.scrollTo(0);
    else window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      <ChatWidget open={chatOpen} onClose={() => setChatOpen(false)} />

      <div className="fixed bottom-4 right-4 z-40 flex flex-col items-center gap-2">
        <AnimatePresence>
          {showTop && (
            <motion.button
              type="button"
              aria-label="Scroll to top"
              onClick={scrollTop}
              initial={{ opacity: 0, y: 10, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 10, scale: 0.9 }}
              transition={{ duration: 0.25 }}
              className={btnClass}
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden>
                <path d="M8 13V3M8 3L3.5 7.5M8 3l4.5 4.5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </motion.button>
          )}
        </AnimatePresence>

        <button
          type="button"
          aria-label={chatOpen ? "Close chat" : "Open chat"}
          onClick={() => {
            setChatOpen((v) => {
              if (!v) ymGoal("chat_opened");
              return !v;
            });
          }}
          className={`${btnClass} ${chatOpen ? "border-accent-turquoise/60 text-accent-turquoise" : ""}`}
        >
          <svg width="17" height="17" viewBox="0 0 17 17" fill="none" aria-hidden>
            <path d="M8.5 14.5c3.6 0 6.5-2.6 6.5-5.9S12.1 2.8 8.5 2.8 2 5.4 2 8.6c0 1.5.6 2.8 1.6 3.9l-.5 2.4 2.6-1a7.4 7.4 0 0 0 2.8.6Z" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round" />
            <circle cx="5.9" cy="8.6" r="0.8" fill="currentColor" />
            <circle cx="8.5" cy="8.6" r="0.8" fill="currentColor" />
            <circle cx="11.1" cy="8.6" r="0.8" fill="currentColor" />
          </svg>
        </button>
      </div>
    </>
  );
}
