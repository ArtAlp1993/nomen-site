// Озвучка страницы/персонажа (З-47, голос Gacrux). Единый источник имён файлов —
// data/audio-manifest.json (ключ «точка/вариант» → hash текста). Имя файла:
//   public/audio/reading/{точка}_{вариант}_{hash}.m4a
// Манифест содержит ВСЕ 199 вариантов (hash от текста), а реальные mp3/m4a
// подкладываются по мере записи — новый файл подхватывается без правок кода.
// Пока файла нет → <audio> отдаёт 404 → плеер откатывается на браузерный голос.
import manifest from "@/data/audio-manifest.json";

// Ключ манифеста: «a1/1», «a10/5_some», «b1/Capricorn», «verdict/7», «a1/intro».
export function audioKey(pointCode, variantKey) {
  return `${String(pointCode).toLowerCase()}/${variantKey}`;
}

// URL реального аудио для точки+варианта (или null, если такого текста нет в банке).
export function audioUrl(pointCode, variantKey) {
  if (variantKey == null) return null;
  const point = String(pointCode).toLowerCase();
  const entry = manifest.entries[`${point}/${variantKey}`];
  if (!entry) return null;
  return `/audio/reading/${point}_${variantKey}_${entry.hash}.m4a`;
}

// Допустимые скорости плеера (требование Артёма: регулировка 0.75×–1.5×).
export const SPEEDS = [0.75, 1, 1.25, 1.5];
