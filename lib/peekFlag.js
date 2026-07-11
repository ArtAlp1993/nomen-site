"use client";

import { useEffect, useState } from "react";

// Флаг «проблеск/peek» (З-37/З-81): черновой вариант раскрытия тизера показываем
// ТОЛЬКО по ссылке nomen.website/?peek=1 — обычные посетители видят прод как есть.
// Когда Артём утвердит вживую — поведение станет дефолтным, а флаг уберём.
//
// Читаем флаг в useEffect (не при рендере): на статике window нет на сервере,
// и синхронное чтение дало бы рассинхрон гидратации. До монтирования — false
// (старое поведение), поэтому обычный посетитель никогда не увидит проблеск.
export function usePeekFlag() {
  const [peek, setPeek] = useState(false);
  useEffect(() => {
    try {
      const q = new URLSearchParams(window.location.search);
      const v = q.get("peek");
      setPeek(v === "1" || v === "true");
    } catch {
      /* нет window/URLSearchParams — остаёмся на проде-поведении */
    }
  }, []);
  return peek;
}
