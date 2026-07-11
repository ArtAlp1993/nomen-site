import StudioPage from "@/components/studio/StudioPage";

// Скрытая студия производства разборов (для Артёма). Нигде не залинкована,
// прячем от индексации. Данные клиента приходят prefill-ссылкой из Telegram
// (#o=…) или вставкой текста заказа — на сервер ничего не уходит.
export const metadata = {
  title: "NOMEN Studio",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <StudioPage />;
}
