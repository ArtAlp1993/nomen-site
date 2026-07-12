"use client";

// Боевая страница ГЕНЕРАЦИИ картинок персонажа (nano banana, ручной цикл).
// Читает data/persona-assets.json (чек-лист кадров S1–S13 + иконок вариантов +
// готовых промптов) и даёт по каждому кнопку «Копировать». Приоритет —
// несделанные (present=false). Скрытая, нигде не залинкована, noindex через
// глобальные настройки лаборатории. Файлы кладём по указанному пути → сцена
// подхватывает авто-детектом (код не трогаем). Обновлять список:
//   node scripts/gen-persona-assets.mjs  (пересобирает persona-assets.json)
import { useMemo, useState } from "react";
import assets from "@/data/persona-assets.json";

const BG = "#05040f";
const card = {
  border: "1px solid #241d3e", borderRadius: 12, background: "rgba(12,10,28,.7)",
  padding: "12px 14px", marginBottom: 12,
};
const btn = {
  cursor: "pointer", borderRadius: 999, border: "1px solid #33e6e0",
  background: "rgba(51,230,224,.1)", color: "#33e6e0", fontSize: 12.5,
  fontWeight: 600, padding: "6px 14px",
};
const badge = (ok) => ({
  fontSize: 11, padding: "2px 8px", borderRadius: 999,
  border: `1px solid ${ok ? "#33e6a0" : "#8a6bff"}`,
  color: ok ? "#33e6a0" : "#c9b8ff", background: ok ? "rgba(51,230,160,.08)" : "rgba(138,107,255,.08)",
});

function CopyBtn({ text, id, copied, setCopied }) {
  return (
    <button
      style={btn}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); }
        catch {
          const ta = document.createElement("textarea");
          ta.value = text; document.body.appendChild(ta); ta.select();
          try { document.execCommand("copy"); } catch { /* noop */ }
          document.body.removeChild(ta);
        }
        setCopied(id);
        setTimeout(() => setCopied((c) => (c === id ? null : c)), 1400);
      }}
    >
      {copied === id ? "Скопировано ✓" : "Копировать"}
    </button>
  );
}

function AssetCard({ item, id, copied, setCopied }) {
  return (
    <div style={card}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 8 }}>
        <span style={badge(item.present)}>{item.present ? "готово" : "нужно"}</span>
        <span style={{ fontSize: 13, color: "#eaf0ff", fontWeight: 600 }}>
          {item.kind === "body-frame" ? `Кадр ${String(item.frame).toUpperCase()} · ${item.code}` : `Иконка ${item.code} · ${item.variant}`}
        </span>
        {item.label && item.label !== item.variant && (
          <span style={{ fontSize: 12, color: "#9aa0c0" }}>{item.label}</span>
        )}
      </div>
      <div style={{ fontSize: 11.5, color: "#6c7095", marginBottom: 8, wordBreak: "break-all" }}>→ {item.path}</div>
      <textarea
        readOnly value={item.prompt}
        style={{
          width: "100%", minHeight: item.kind === "body-frame" ? 120 : 84, boxSizing: "border-box",
          background: "rgba(6,4,16,.7)", border: "1px solid #2a2350", borderRadius: 8,
          color: "#cdd3ee", fontSize: 12.5, lineHeight: 1.5, padding: 10, resize: "vertical", marginBottom: 8,
        }}
      />
      <CopyBtn text={item.prompt} id={id} copied={copied} setCopied={setCopied} />
    </div>
  );
}

export default function PromptsPage() {
  const [todoOnly, setTodoOnly] = useState(true);
  const [copied, setCopied] = useState(null);

  const frames = useMemo(
    () => assets.frames.filter((f) => (todoOnly ? !f.present : true)),
    [todoOnly]
  );
  const icons = useMemo(
    () => assets.icons.filter((i) => (todoOnly ? !i.present : true)),
    [todoOnly]
  );
  // Иконки — по пунктам, для навигации.
  const iconGroups = useMemo(() => {
    const m = new Map();
    for (const i of icons) { if (!m.has(i.code)) m.set(i.code, []); m.get(i.code).push(i); }
    return [...m.entries()];
  }, [icons]);

  const meta = assets._meta;

  return (
    <div style={{ background: BG, minHeight: "100vh", color: "#eaf0ff", fontFamily: "system-ui", padding: "28px 18px 80px" }}>
      <div style={{ maxWidth: 720, margin: "0 auto" }}>
        <div style={{ fontSize: 12.5, letterSpacing: "0.28em", color: "#8a6bff", marginBottom: 6 }}>NOMEN · ГЕНЕРАЦИЯ</div>
        <h1 style={{ margin: "0 0 6px", fontSize: 24, fontWeight: 700 }}>Промпты картинок персонажа</h1>
        <p style={{ margin: "0 0 14px", fontSize: 13.5, color: "#9aa0c0", lineHeight: 1.5 }}>
          Копируй промпт → генери на nano banana → клади PNG по указанному пути.
          Сцена подхватит сама. Стиль общий (nebula-энергия, #05040f, неон).
        </p>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center", marginBottom: 18 }}>
          <span style={badge(false)}>кадры: осталось {meta.frames_total - meta.frames_present}/{meta.frames_total}</span>
          <span style={badge(false)}>иконки: осталось {meta.icons_total - meta.icons_present}/{meta.icons_total}</span>
          <label style={{ fontSize: 13, color: "#c9b8ff", display: "flex", alignItems: "center", gap: 6, cursor: "pointer" }}>
            <input type="checkbox" checked={todoOnly} onChange={(e) => setTodoOnly(e.target.checked)} />
            только несделанные
          </label>
        </div>

        <h2 style={{ fontSize: 16, color: "#33e6e0", margin: "8px 0 12px" }}>
          Кадры тела S1–S13 {frames.length ? `(${frames.length})` : ""} · приоритет
        </h2>
        {frames.length === 0 && <p style={{ color: "#6c7095", fontSize: 13, marginBottom: 20 }}>Все кадры готовы ✓</p>}
        {frames.map((f) => (
          <AssetCard key={f.path} item={f} id={f.path} copied={copied} setCopied={setCopied} />
        ))}

        <h2 style={{ fontSize: 16, color: "#33e6e0", margin: "22px 0 12px" }}>
          Иконки вариантов {icons.length ? `(${icons.length})` : ""}
        </h2>
        {icons.length === 0 && <p style={{ color: "#6c7095", fontSize: 13 }}>Все иконки готовы ✓</p>}
        {iconGroups.map(([code, list]) => (
          <details key={code} style={{ marginBottom: 10 }}>
            <summary style={{ cursor: "pointer", fontSize: 14, color: "#c9b8ff", padding: "6px 0" }}>
              {code} — {list.length} шт.
            </summary>
            <div style={{ marginTop: 8 }}>
              {list.map((i) => (
                <AssetCard key={i.path} item={i} id={i.path} copied={copied} setCopied={setCopied} />
              ))}
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
