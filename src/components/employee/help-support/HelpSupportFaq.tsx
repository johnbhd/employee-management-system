"use client";

import { useState } from "react";

import { Icon } from "@/components/ui/Icon";
import type { EmployeeFaq } from "@/data/employee-help";

type HelpSupportFaqProps = {
  faqs: readonly EmployeeFaq[];
};

export function HelpSupportFaq({ faqs }: HelpSupportFaqProps) {
  const [openFaqId, setOpenFaqId] = useState<string | null>(faqs[0]?.id ?? null);

  function toggleFaq(faqId: string) {
    setOpenFaqId((currentFaqId) => (currentFaqId === faqId ? null : faqId));
  }

  return (
    <div className="employee-help-faq-list">
      {faqs.map((faq) => {
        const isOpen = openFaqId === faq.id;
        const answerId = `employee-help-faq-answer-${faq.id}`;

        return (
          <article className={`employee-help-faq-item ${isOpen ? "is-open" : ""}`} key={faq.id}>
            <h3>
              <button
                type="button"
                className="employee-help-faq-trigger"
                onClick={() => toggleFaq(faq.id)}
                aria-expanded={isOpen}
                aria-controls={answerId}
              >
                <span>{faq.question}</span>
                <Icon name="chevron" />
              </button>
            </h3>
            <div
              id={answerId}
              className="employee-help-faq-answer"
              role="region"
              aria-hidden={!isOpen}
            >
              <p>{faq.answer}</p>
            </div>
          </article>
        );
      })}
    </div>
  );
}
