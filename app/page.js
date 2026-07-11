import IntroPreloader from "@/components/IntroPreloader";
import { ResultProvider } from "@/components/ResultProvider";
import Hero from "@/components/Hero";
import Hook from "@/components/Hook";
import HowItWorks from "@/components/HowItWorks";
import QuizSection from "@/components/QuizSection";
import MethodologyDiagram from "@/components/MethodologyDiagram";
import AuthoritySection from "@/components/AuthoritySection";
import PricingSection from "@/components/PricingSection";
import TrustSection from "@/components/TrustSection";
import FAQSection from "@/components/FAQSection";
import FinalCta from "@/components/FinalCta";
import Footer from "@/components/Footer";
import PeekBadge from "@/components/PeekBadge";

export default function Home() {
  return (
    <>
      <IntroPreloader />
      <ResultProvider>
        <main className="flex-1">
          <Hero />
          <Hook />
          <HowItWorks />
          <QuizSection />
          <MethodologyDiagram />
          <AuthoritySection />
          <PricingSection />
          <TrustSection />
          <FAQSection />
          <FinalCta />
        </main>
      </ResultProvider>
      <Footer />
      <PeekBadge />
    </>
  );
}
