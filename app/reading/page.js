import ReadingPage from "@/components/reading/ReadingPage";

// Страница выдачи оплаченного разбора. Персональные данные живут в самой
// ссылке (#r=…, lib/readingLink.js) — сервер/хостинг их не видит. Страница
// одна на всех клиентов, поэтому обязательно noindex.
export const metadata = {
  title: "Your Full Reading — NOMEN",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <ReadingPage />;
}
