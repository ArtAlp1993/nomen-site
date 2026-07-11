"use client";

import { usePeekFlag } from "@/lib/peekFlag";

// Видимый признак того, что режим проблеска (?peek=1) активен. Нужен Артёму как
// мгновенная диагностика: если бейдж ЕСТЬ — флаг сработал (и проблеск/peek
// включены); если бейджа НЕТ — открылась старая версия из кэша, надо обновить
// страницу (или открыть в инкогнито). Обычные посетители его не видят.
export default function PeekBadge() {
  const peek = usePeekFlag();
  if (!peek) return null;
  return (
    <div className="fixed bottom-3 left-1/2 z-[60] -translate-x-1/2 rounded-full border border-accent-turquoise/50 bg-background-alt/90 px-4 py-1.5 text-xs font-medium text-accent-turquoise shadow-lg backdrop-blur">
      ✨ Peek preview — draft
    </div>
  );
}
