"use client";

import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import faq from "@/data/faq.json";
import kb from "@/data/chat-kb.json";
import { ymGoal } from "./Analytics";

// Мини-чат без бэкенда: отвечает по базе знаний (data/chat-kb.json) и FAQ.
// Тупик (два промаха подряд или просьба позвать человека) → предлагает
// оставить email; переписка и email улетают Артёму в Telegram, если задан
// TG_TOKEN/TG_CHAT_ID (без них чат работает, просто без уведомлений).

// Бот @NOMEN_site_bot шлёт уведомления Артёму в личку. Реквизиты живут в
// секретах GitHub (NEXT_PUBLIC_TG_TOKEN / NEXT_PUBLIC_TG_CHAT_ID) и
// подставляются при сборке — в исходниках репозитория их нет. В собранном
// бандле токен всё же виден (без бэкенда иначе никак) — осознанный MVP-риск;
// при переезде на бэкенд унести отправку на сервер.
const TG_TOKEN = process.env.NEXT_PUBLIC_TG_TOKEN || null;
const TG_CHAT_ID = process.env.NEXT_PUBLIC_TG_CHAT_ID || null;

const EASE = [0.22, 1, 0.36, 1];
const STOP_WORDS = new Set(
  "a an and are as at be but by for from how i in is it my of on or the to what when where which who will with you your me do does can".split(" ")
);
const HUMAN_WORDS = ["human", "agent", "support", "operator", "real person", "help me", "manager", "somebody"];

const tokenize = (s) =>
  s.toLowerCase().replace(/[^a-zа-яё0-9\s]/gi, " ").split(/\s+/).filter((w) => w && !STOP_WORDS.has(w));

// Поиск ответа: сначала фразовые ключи базы, затем скоринг по словам KB+FAQ.
function findAnswer(text) {
  const low = text.toLowerCase();
  for (const entry of kb) {
    if (entry.keywords.some((k) => k.includes(" ") && low.includes(k))) return entry;
  }
  const words = new Set(tokenize(text));
  if (!words.size) return null;
  let best = null;
  let bestScore = 0;
  for (const entry of kb) {
    const score = entry.keywords.reduce((a, k) => a + (words.has(k) ? 2 : 0), 0);
    if (score > bestScore) { bestScore = score; best = entry; }
  }
  for (const item of faq) {
    const hay = new Set(tokenize(item.question + " " + item.answer));
    let score = 0;
    for (const w of words) if (hay.has(w)) score += 1;
    if (score > bestScore && score >= 2) { bestScore = score; best = { answer: item.answer }; }
  }
  return bestScore >= 2 ? best : null;
}

async function notifyTelegram(text) {
  if (!TG_TOKEN || !TG_CHAT_ID) return;
  try {
    await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: TG_CHAT_ID, text: text.slice(0, 3900) }),
    });
  } catch {
    /* уведомление не должно ломать чат */
  }
}

const GREETING = {
  role: "bot",
  text: "Hi! I'm the NOMEN assistant. Ask me about prices, the 13 points, delivery — or tap a question below.",
};
const FALLBACK =
  "Hmm, that one's beyond me — I'm a small assistant. The free quiz above answers most things better, and the FAQ covers the rest.";
const DEAD_END =
  "Looks like I'm not nailing it. Leave your email — our team will get back to you personally.";

export default function ChatWidget({ open, onClose }) {
  const reduce = useReducedMotion();
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [misses, setMisses] = useState(0);
  const [leadMode, setLeadMode] = useState(false);
  const [leadSent, setLeadSent] = useState(false);
  const listRef = useRef(null);
  const alerted = useRef(false); // уведомление Артёму — не чаще раза за диалог
  // Метка посетителя (#a7k2) — чтобы в Telegram различать одновременные
  // диалоги разных людей. Живёт на всю сессию.
  const visitorTag = useRef("");
  useEffect(() => {
    try {
      let tag = sessionStorage.getItem("nomen-chat-tag");
      if (!tag) {
        tag = Math.random().toString(36).slice(2, 6);
        sessionStorage.setItem("nomen-chat-tag", tag);
      }
      visitorTag.current = tag;
    } catch {
      visitorTag.current = "anon";
    }
  }, []);

  // Восстановление/сохранение диалога на время сессии.
  useEffect(() => {
    try {
      const saved = sessionStorage.getItem("nomen-chat");
      if (saved) {
        const s = JSON.parse(saved);
        if (Array.isArray(s.messages) && s.messages.length) {
          setMessages(s.messages);
          setLeadSent(!!s.leadSent);
        }
      }
    } catch { /* повреждённый storage игнорируем */ }
  }, []);
  useEffect(() => {
    try {
      sessionStorage.setItem(
        "nomen-chat",
        JSON.stringify({ messages, leadSent })
      );
    } catch { /* переполненный storage не критичен */ }
  }, [messages, leadSent]);

  const transcriptOf = (msgs) =>
    msgs.map((m) => `${m.role === "bot" ? "🤖" : "🧑"} ${m.text}`).join("\n");

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open, leadMode]);

  const pushBot = (text, cta) =>
    setMessages((m) => [...m, { role: "bot", text, cta: cta || null }]);

  // Одно уведомление Артёму на диалог — с меткой гостя и всей перепиской.
  // Шлём в двух случаях: (1) тупик; (2) длинный диалог (>5 вопросов), где
  // человек всё ещё что-то спрашивает — значит бот не справляется.
  const notifyArtem = (reason, msgs) => {
    if (alerted.current) return;
    alerted.current = true;
    notifyTelegram(
      `⚠️ NOMEN — нужна ваша помощь (${reason})\nГость #${visitorTag.current}\n\nПереписка:\n${transcriptOf(msgs)}`
    );
  };

  const ask = (text) => {
    if (!text.trim()) return;
    const withUser = [...messages, { role: "user", text }];
    setMessages(withUser);
    ymGoal("chat_question");
    const userCount = withUser.filter((m) => m.role === "user").length;

    const wantsHuman = HUMAN_WORDS.some((w) => text.toLowerCase().includes(w));
    const hit = wantsHuman ? null : findAnswer(text);
    setTimeout(() => {
      if (hit) {
        setMisses(0);
        pushBot(hit.answer, hit.cta);
        // Диалог затянулся (>5 вопросов), а человек продолжает спрашивать —
        // пересылаем всё Артёму, даже если бот вроде бы отвечает.
        if (userCount > 5) {
          notifyArtem("длинный диалог", [...withUser, { role: "bot", text: hit.answer }]);
        }
      } else {
        const missCount = misses + 1;
        setMisses(missCount);
        if (wantsHuman || missCount >= 2) {
          setLeadMode(true);
          pushBot(DEAD_END);
          notifyArtem("тупик", [...withUser, { role: "bot", text: DEAD_END }]);
        } else {
          pushBot(FALLBACK, { label: "Open the free quiz", href: "#quiz" });
          if (userCount > 5) {
            notifyArtem("длинный диалог", [...withUser, { role: "bot", text: FALLBACK }]);
          }
        }
      }
    }, reduce ? 0 : 550);
  };

  const submitLead = (email) => {
    if (!email.includes("@")) return;
    setLeadSent(true);
    setLeadMode(false);
    ymGoal("chat_lead");
    notifyTelegram(
      `🔥 NOMEN — гость #${visitorTag.current} оставил контакт!\nEmail: ${email}\n\nПереписка:\n${transcriptOf(messages)}`
    );
    pushBot("Done — our team will reach out to you soon. Meanwhile, the free quiz above is worth a try.");
  };

  const chips = faq.slice(0, 4).map((f) => f.question);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.97 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ duration: 0.35, ease: EASE }}
          className="fixed bottom-32 right-4 z-40 flex max-h-[62vh] w-[22rem] max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-foreground-muted/30 bg-background-alt/95 shadow-2xl backdrop-blur-md"
        >
          <div className="flex items-center justify-between border-b border-foreground-muted/20 px-4 py-3">
            <span className="font-heading text-sm font-semibold tracking-wide">
              NOMEN Assistant
            </span>
            <button
              type="button"
              aria-label="Close chat"
              onClick={onClose}
              className="text-lg text-foreground-muted transition-colors hover:text-foreground"
            >
              ×
            </button>
          </div>

          <div ref={listRef} data-lenis-prevent className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-sm ${
                    m.role === "user"
                      ? "bg-accent-violet/30 text-foreground"
                      : "border border-foreground-muted/20 bg-background/60 text-foreground-muted"
                  }`}
                >
                  {m.text}
                  {m.cta && (
                    <a
                      href={m.cta.href}
                      onClick={onClose}
                      className="mt-2 block text-accent-turquoise underline underline-offset-4"
                    >
                      {m.cta.label} →
                    </a>
                  )}
                </div>
              </div>
            ))}

            {leadMode && !leadSent && (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  submitLead(new FormData(e.currentTarget).get("email") || "");
                }}
                className="flex gap-2"
              >
                <input
                  type="email"
                  name="email"
                  required
                  placeholder="you@email.com"
                  className="min-w-0 flex-1 rounded-lg border border-foreground-muted/40 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent-turquoise focus:outline-none"
                />
                <button
                  type="submit"
                  className="rounded-lg bg-accent-turquoise/20 px-3 py-2 text-sm text-accent-turquoise transition-colors hover:bg-accent-turquoise/30"
                >
                  Send
                </button>
              </form>
            )}
          </div>

          {messages.length <= 1 && (
            <div className="flex flex-wrap gap-2 px-4 pb-2">
              {chips.map((q) => (
                <button
                  key={q}
                  type="button"
                  onClick={() => ask(q)}
                  className="rounded-full border border-foreground-muted/30 px-3 py-1.5 text-xs text-foreground-muted transition-colors hover:border-accent-turquoise hover:text-foreground"
                >
                  {q}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              ask(input);
              setInput("");
            }}
            className="flex gap-2 border-t border-foreground-muted/20 p-3"
          >
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a question…"
              className="min-w-0 flex-1 rounded-lg border border-foreground-muted/40 bg-background px-3 py-2 text-sm text-foreground placeholder:text-foreground-muted/50 focus:border-accent-turquoise focus:outline-none"
            />
            <button
              type="submit"
              aria-label="Send"
              className="rounded-lg bg-accent-turquoise/20 px-3 py-2 text-sm text-accent-turquoise transition-colors hover:bg-accent-turquoise/30"
            >
              ↑
            </button>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
