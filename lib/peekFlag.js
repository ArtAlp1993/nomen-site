"use client";

import { useEffect, useState } from "react";

// Флаг «проблеск/peek» (З-37/З-81): черновой вариант раскрытия тизера показываем
// ТОЛЬКО по ссылке nomen.website/?peek=1 — обычные посетители видят прод как есть.
// Когда Артём утвердит вживую — поведение станет дефолтным, а флаг уберём.
//
// ЛИПКОСТЬ: как только ?peek=1 замечен один раз, запоминаем его в sessionStorage
// на всю вкладку. Иначе флаг терялся при переходах внутри сайта (клик по логотипу/
// «/», прохождение квиза с внутренними якорями) — пользователь открывал ?peek=1,
// а к моменту результата параметр из URL уже пропадал.
const KEY = "nomen-peek";

// Синхронное чтение (без стейта) — нужно компонентам, которые решают режим прямо
// в обработчике/observer, а не только при рендере.
export function readPeek() {
  try {
    const q = new URLSearchParams(window.location.search);
    const v = q.get("peek");
    if (v === "1" || v === "true") {
      window.sessionStorage.setItem(KEY, "1");
      return true;
    }
    return window.sessionStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

// Читаем флаг в useEffect (не при рендере): на статике window нет на сервере,
// и синхронное чтение дало бы рассинхрон гидратации. До монтирования — false
// (старое поведение), поэтому обычный посетитель никогда не увидит проблеск.
export function usePeekFlag() {
  const [peek, setPeek] = useState(false);
  useEffect(() => {
    setPeek(readPeek());
  }, []);
  return peek;
}
