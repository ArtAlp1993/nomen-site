// ⚠️ IntroPreloader СНЯТ 21.07 (З-391). Артём: «когда заходишь на наш сайт, сначала
// что-то перекрывает, плашка в начале — нужно, чтобы клиент попадал на оплату удобно
// и быстро». Заставка держала ВЕСЬ экран 1.4 с плюс 0.6 с затухания. Для холодного
// трафика с TikTok это две секунды пустоты до первого слова о продукте — самая дорогая
// пара секунд на всём пути, потому что решение «остаться или уйти» принимается там.
// Файл components/IntroPreloader.js оставлен на месте: удалять нечего, он рабочий,
// просто не нужен на входе.
import { ResultProvider } from "@/components/ResultProvider";
import Hero from "@/components/Hero";
import Marquee from "@/components/Marquee";
import Hook from "@/components/Hook";
import HowItWorks from "@/components/HowItWorks";
import QuizSection from "@/components/QuizSection";
import MethodologyDiagram from "@/components/MethodologyDiagram";
import AuthoritySection from "@/components/AuthoritySection";
import PricingSection from "@/components/PricingSection";
import TrustSection from "@/components/TrustSection";
import FAQSection from "@/components/FAQSection";
import PoliciesSection from "@/components/PoliciesSection";
import FinalCta from "@/components/FinalCta";
import OrbBurstMenu from "@/components/OrbBurstMenu";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <>
      <ResultProvider>
        <main className="flex-1">
          <Hero />
          <Marquee />
          <Hook />
          <HowItWorks />
          <QuizSection />
          <MethodologyDiagram />
          <AuthoritySection />
          <PricingSection />
          <TrustSection />
          <FAQSection />
          <PoliciesSection />
          <FinalCta />
        </main>
        <OrbBurstMenu />
      </ResultProvider>
      <Footer />
    </>
  );
}
