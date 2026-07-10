"use client";

import { useState } from "react";
import SectionHeading from "./ui/SectionHeading";
import faq from "@/data/faq.json";

function FaqItem({ item, isOpen, onToggle }) {
  return (
    <div className="border-b border-foreground-muted/15 py-5">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between text-left"
      >
        <span className="font-heading text-base font-medium sm:text-lg">
          {item.question}
        </span>
        <span className="ml-4 shrink-0 text-accent-turquoise">
          {isOpen ? "−" : "+"}
        </span>
      </button>
      {isOpen && (
        <p className="mt-3 text-sm text-foreground-muted">{item.answer}</p>
      )}
    </div>
  );
}

export default function FAQSection() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="faq" className="mx-auto max-w-3xl px-6 py-24 sm:py-32">
      <SectionHeading eyebrow="FAQ" title="Questions, answered honestly" />

      <div className="mt-12 rounded-2xl bg-background/70 backdrop-blur-md px-6 sm:px-8">
        {faq.map((item, i) => (
          <FaqItem
            key={item.question}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? -1 : i)}
          />
        ))}
      </div>
    </section>
  );
}
