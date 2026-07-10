"use client";

import { createContext, useContext, useState } from "react";

// Общий результат квиза: квиз кладёт сюда посчитанные пункты, а диаграмма
// и тизер их читают — так весь сайт «оживает» по данным пользователя.
const ResultContext = createContext(null);

export function ResultProvider({ children }) {
  const [result, setResult] = useState(null); // { firstName, points }

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
