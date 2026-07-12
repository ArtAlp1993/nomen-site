"use client";

import { useEffect, useState } from "react";
import PersonaScene from "@/components/persona/PersonaScene";

// Статический экспорт (output:export) кладёт этот компонент в out/404.html.
// GitHub Pages отдаёт 404.html для любого несуществующего пути — в т.ч. для
// клиентской короткой ссылки /r/<code>. Ловим её здесь и открываем ПЕРСОНАЖА
// (решение Артёма 13.07: клиент по ссылке из письма открывает персонажа, не
// текст-разбор). Адрес в строке остаётся коротким — /r/anna-lee-k7q2m.
// PersonaScene сам возьмёт код из pathname (extractReadingCode) и подтянет
// карточку с сервера. Текст-разбор остаётся доступен на /reading и длинных #r=.
export default function NotFound() {
  const [isReading, setIsReading] = useState(null); // null=до гидратации

  useEffect(() => {
    setIsReading(/\/r\/[A-Za-z0-9_-]+/.test(window.location.pathname || ""));
  }, []);

  if (isReading === null) return null;
  if (isReading) return <PersonaScene />;

  return (
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "12px",
        background: "#080b11",
        color: "#9fabbb",
        fontFamily: "Arial, Helvetica, sans-serif",
        textAlign: "center",
        padding: "24px",
      }}
    >
      <div
        style={{
          fontFamily: "Georgia, 'Times New Roman', serif",
          fontSize: "13px",
          letterSpacing: "7px",
          color: "#5fe3cf",
          textTransform: "uppercase",
        }}
      >
        N O M E N
      </div>
      <p style={{ margin: 0, fontSize: "15px" }}>This page could not be found.</p>
      <a href="/" style={{ color: "#5fe3cf", textDecoration: "none", fontSize: "14px" }}>
        nomen.website
      </a>
    </main>
  );
}
