"use client";

import { useEffect, useState } from "react";

// Показывает код заказа, переданный в URL (?order=A7K2) после «I've paid».
// Читаем из window.location, чтобы не тянуть Suspense/useSearchParams в
// статический экспорт. Если кода нет — ничего не рендерим.
export default function OrderRef() {
  const [code, setCode] = useState("");

  useEffect(() => {
    try {
      const params = new URLSearchParams(window.location.search);
      const order = params.get("order");
      if (order) setCode(order);
    } catch {
      /* нет доступа к location — просто не показываем */
    }
  }, []);

  if (!code) return null;

  return (
    <p className="mt-4 text-sm text-foreground-muted">
      Your order reference:{" "}
      <span className="font-mono text-foreground">#{code}</span>
    </p>
  );
}
