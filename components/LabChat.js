"use client";

import { useEffect, useRef, useState } from "react";
import { applyLocalCommand, askClaude } from "@/lib/labBrain";

// Мини-чат лаборатории: скажи или напиши, что поменять в шарике, — он
// поменяется. Умеет: голос (🎤, ru-RU), картинки-референсы (📎, нужен
// API-ключ), свой ключ Claude (⚙, хранится только в браузере Артёма).

const KEY_STORAGE = "nomen-lab-key";

export default function LabChat({ cfg, setCfg }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      text: "Скажи, что поменять: «огонь», «красные тона», «крути обратно», «сплющи»… 🎤 — голос, 📎 — картинка-референс (нужен ключ в ⚙).",
    },
  ]);
  const [input, setInput] = useState("");
  const [busy, setBusy] = useState(false);
  const [image, setImage] = useState(null); // { base64, mediaType, previewUrl }
  const [hasKey, setHasKey] = useState(false);
  const [listening, setListening] = useState(false);
  const [speechOk, setSpeechOk] = useState(false);
  const listRef = useRef(null);
  const recRef = useRef(null);
  const fileRef = useRef(null);
  // cfg в ref — чтобы обработчики всегда видели свежий конфиг.
  const cfgRef = useRef(cfg);
  cfgRef.current = cfg;

  useEffect(() => {
    try {
      setHasKey(!!localStorage.getItem(KEY_STORAGE));
    } catch { /* storage недоступен */ }
    setSpeechOk(
      typeof window !== "undefined" &&
        !!(window.SpeechRecognition || window.webkitSpeechRecognition)
    );
  }, []);

  useEffect(() => {
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, open]);

  const push = (role, text) => setMessages((m) => [...m, { role, text }]);

  const send = async (rawText) => {
    const text = (rawText ?? input).trim();
    if ((!text && !image) || busy) return;
    setInput("");
    push("user", text || "(картинка)");
    setBusy(true);
    let key = null;
    try {
      key = localStorage.getItem(KEY_STORAGE);
    } catch { /* storage недоступен */ }

    let result;
    if (image && !key) {
      result = {
        patch: null,
        reply: "Чтобы разбирать картинки, вставь свой API-ключ Claude в ⚙.",
      };
    } else if (key) {
      result = await askClaude({
        text,
        imageBase64: image?.base64,
        imageMediaType: image?.mediaType,
        cfg: cfgRef.current,
        apiKey: key,
      });
    } else {
      result = applyLocalCommand(text, cfgRef.current);
    }

    if (result.patch && Object.keys(result.patch).length) {
      setCfg((c) => ({ ...c, ...result.patch }));
    }
    push("bot", result.reply);
    setImage(null);
    setBusy(false);
  };

  // Голосовой ввод: жмёшь 🎤 → говоришь → фраза уходит сама.
  const toggleVoice = () => {
    if (listening) {
      recRef.current?.stop();
      return;
    }
    const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SR) return;
    const rec = new SR();
    recRef.current = rec;
    rec.lang = "ru-RU";
    rec.interimResults = false;
    rec.maxAlternatives = 1;
    rec.onresult = (e) => {
      const phrase = e.results?.[0]?.[0]?.transcript || "";
      if (phrase) send(phrase);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    setListening(true);
    rec.start();
  };

  const onFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = String(reader.result || "");
      const base64 = dataUrl.split(",")[1] || "";
      setImage({ base64, mediaType: file.type || "image/png", previewUrl: dataUrl });
    };
    reader.readAsDataURL(file);
    e.target.value = "";
  };

  const configureKey = () => {
    let current = "";
    try {
      current = localStorage.getItem(KEY_STORAGE) || "";
    } catch { /* storage недоступен */ }
    const entered = window.prompt(
      "API-ключ Claude (console.anthropic.com → API keys).\nХранится только в этом браузере. Пусто = удалить ключ.",
      current ? "•••" + current.slice(-6) : ""
    );
    if (entered === null) return;
    try {
      if (!entered.trim()) {
        localStorage.removeItem(KEY_STORAGE);
        setHasKey(false);
        push("bot", "Ключ удалён — работаю на простых командах.");
      } else if (!entered.startsWith("•")) {
        localStorage.setItem(KEY_STORAGE, entered.trim());
        setHasKey(true);
        push("bot", "Ключ сохранён — теперь понимаю любые фразы и картинки.");
      }
    } catch { /* storage недоступен */ }
  };

  return (
    // bottom-16: не конфликтуем с виджетом Desktop/Mobile в левом нижнем углу
    <div className="pointer-events-auto absolute bottom-16 left-3 z-20">
      {!open ? (
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-label="Открыть чат"
          className="flex h-11 w-11 items-center justify-center rounded-full border border-accent-turquoise/50 bg-background/80 text-lg backdrop-blur transition-colors hover:bg-accent-turquoise/10"
        >
          💬
        </button>
      ) : (
        <div className="flex max-h-[70vh] w-72 flex-col overflow-hidden rounded-xl border border-foreground-muted/25 bg-background/85 backdrop-blur-md">
          <div className="flex items-center justify-between border-b border-foreground-muted/20 px-3 py-2">
            <span className="font-heading text-[11px] uppercase tracking-[0.2em] text-accent-turquoise">
              Чат с шариком
            </span>
            <span className="flex items-center gap-2">
              <button
                type="button"
                onClick={configureKey}
                title={hasKey ? "Ключ Claude вставлен" : "Вставить API-ключ Claude"}
                className={`text-sm ${hasKey ? "" : "opacity-50"}`}
              >
                ⚙{hasKey ? "✓" : ""}
              </button>
              <button
                type="button"
                aria-label="Свернуть чат"
                onClick={() => setOpen(false)}
                className="text-base text-foreground-muted hover:text-foreground"
              >
                ×
              </button>
            </span>
          </div>

          <div
            ref={listRef}
            data-lenis-prevent
            className="flex-1 space-y-2 overflow-y-auto px-3 py-2"
          >
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "flex justify-end" : "flex"}>
                <div
                  className={`max-w-[90%] rounded-xl px-2.5 py-1.5 text-xs ${
                    m.role === "user"
                      ? "bg-accent-violet/30 text-foreground"
                      : "border border-foreground-muted/20 bg-background/60 text-foreground-muted"
                  }`}
                >
                  {m.text}
                </div>
              </div>
            ))}
            {busy && (
              <div className="flex">
                <div className="rounded-xl border border-foreground-muted/20 px-2.5 py-1.5 text-xs text-foreground-muted">
                  …
                </div>
              </div>
            )}
          </div>

          {image && (
            <div className="flex items-center gap-2 px-3 pb-1">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={image.previewUrl}
                alt="reference"
                className="h-10 w-10 rounded object-cover"
              />
              <span className="flex-1 text-[10px] text-foreground-muted">
                референс приложен
              </span>
              <button
                type="button"
                onClick={() => setImage(null)}
                className="text-xs text-foreground-muted hover:text-foreground"
              >
                убрать
              </button>
            </div>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send();
            }}
            className="flex items-center gap-1.5 border-t border-foreground-muted/20 p-2"
          >
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              title="Приложить картинку-референс"
              className="text-sm opacity-70 hover:opacity-100"
            >
              📎
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              onChange={onFile}
              className="hidden"
            />
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={listening ? "Слушаю…" : "Что поменять?"}
              className="min-w-0 flex-1 rounded-lg border border-foreground-muted/40 bg-background px-2.5 py-1.5 text-xs text-foreground placeholder:text-foreground-muted/50 focus:border-accent-turquoise focus:outline-none"
            />
            {speechOk && (
              <button
                type="button"
                onClick={toggleVoice}
                title="Голосовой ввод"
                className={`text-sm ${listening ? "animate-pulse" : "opacity-70 hover:opacity-100"}`}
              >
                🎤
              </button>
            )}
            <button
              type="submit"
              aria-label="Отправить"
              className="rounded-lg bg-accent-turquoise/20 px-2.5 py-1.5 text-xs text-accent-turquoise hover:bg-accent-turquoise/30"
            >
              ↑
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
