"use client";

import { createContext, useContext, useEffect, useState } from "react";

// Общий результат квиза: квиз кладёт сюда все введённые поля + посчитанные
// пункты, а диаграмма, тизер и крипто-чекаут их читают — так весь сайт
// «оживает» по данным пользователя, а оплата знает, кому и что выставлять.
// Форма: { firstName, lastName, birthDate, birthTime, birthPlace, brand, email, points }
const ResultContext = createContext(null);

// Храним в sessionStorage: результат переживает обновление страницы (та же
// вкладка), но чистится при закрытии вкладки — не держим имя/email/дату
// рождения в браузере бессрочно (меньше следов PII на общем устройстве).
const STORAGE_KEY = "nomen-result";
const store =
  typeof window !== "undefined" ? window.sessionStorage : undefined;

export function ResultProvider({ children }) {
  const [result, setResult] = useState(null);

  // Ленивое восстановление из localStorage после монтирования (не в
  // инициализаторе useState — иначе рассинхрон гидрации SSR/клиента).
  useEffect(() => {
    try {
      const saved = store?.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed && Array.isArray(parsed.points) && parsed.points.length) {
          setResult(parsed);
        }
      }
    } catch {
      /* повреждённый storage игнорируем */
    }
  }, []);

  useEffect(() => {
    try {
      if (result) store?.setItem(STORAGE_KEY, JSON.stringify(result));
    } catch {
      /* переполненный storage не критичен */
    }
  }, [result]);

  return (
    <ResultContext.Provider value={{ result, setResult }}>
      {children}
    </ResultContext.Provider>
  );
}

export function useResult() {
  const ctx = useContext(ResultContext);
  if (!ctx) {
    throw new Error("useResult must be used within a ResultProvider");
  }
  return ctx;
}
