import PersonaScene from "@/components/persona/PersonaScene";

// Страница-лаборатория персонажа. Сам «движок сцены» вынесен в переиспользуемый
// компонент components/persona/PersonaScene.js — тот же компонент открывает и
// клиентская короткая ссылка /r/<code> (app/not-found.js). Одна страница на всех,
// персональные данные приходят из ссылки → noindex.
export const metadata = {
  title: "Персонаж · NOMEN",
  robots: { index: false, follow: false },
};

export default function Page() {
  return <PersonaScene />;
}
