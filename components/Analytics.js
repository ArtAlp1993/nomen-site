"use client";

import { useEffect } from "react";

// Яндекс.Метрика. Счётчик Артёма, включён 12.07.2026.
export const YM_ID = 110604454;

// Безопасная отправка цели: молчит, если Метрики нет (ID не задан,
// скрипт ещё не загрузился или зарезан блокировщиком).
export function ymGoal(name, params) {
  try {
    if (YM_ID && typeof window !== "undefined" && typeof window.ym === "function") {
      window.ym(YM_ID, "reachGoal", name, params);
    }
  } catch {
    /* аналитика никогда не должна ломать сайт */
  }
}

export default function Analytics() {
  useEffect(() => {
    if (!YM_ID || window.ym) return;
    // Официальный тег Метрики (вставка скриптом, чтобы жить в статике).
    (function (m, e, t, r, i, k, a) {
      m[i] =
        m[i] ||
        function () {
          (m[i].a = m[i].a || []).push(arguments);
        };
      m[i].l = 1 * new Date();
      k = e.createElement(t);
      a = e.getElementsByTagName(t)[0];
      k.async = 1;
      k.src = r;
      a.parentNode.insertBefore(k, a);
    })(
      window,
      document,
      "script",
      `https://mc.yandex.ru/metrika/tag.js?id=${YM_ID}`,
      "ym"
    );

    // ВНИМАНИЕ (безопасность/PII): webvisor записывает ввод в поля, поэтому
    // на PII-инпутах квиза (имя/дата/email) стоит class "ym-disable-keys" —
    // без него персональные данные уйдут в записи сессий на mc.yandex.ru.
    // Новый инпут с личными данными → тоже вешать этот класс.
    window.ym(YM_ID, "init", {
      ssr: true,
      webvisor: true,
      clickmap: true,
      ecommerce: "dataLayer",
      referrer: document.referrer,
      url: location.href,
      accurateTrackBounce: true,
      trackLinks: true,
    });
  }, []);

  if (!YM_ID) return null;
  return (
    <noscript>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={`https://mc.yandex.ru/watch/${YM_ID}`}
        style={{ position: "absolute", left: "-9999px" }}
        alt=""
      />
    </noscript>
  );
}
