'use client';

import Link from 'next/link';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

export interface FaqItem {
  id: string;
  question: string;
  answer: string;
}

export interface FAQsProps {
  items: FaqItem[];
  eyebrow?: string;
  title?: string;
  description?: string;
  /** Closing hint under the intro, e.g. where to read more. */
  help?: { text: string; label: string; href: string };
}

/** FAQ accordion whose answers resolve out of a blur, letter by letter. */
export default function FAQs({
  items,
  eyebrow,
  title = 'Pertanyaan Umum',
  description,
  help,
}: FAQsProps) {
  const helpLine = help && (
    <>
      {help.text}{' '}
      <Link href={help.href} className="font-semibold text-emerald-800 hover:underline">
        {help.label}
      </Link>
    </>
  );
  return (
    <section className="zf-faq py-16 md:py-24">
      <div className="mx-auto max-w-5xl px-5 md:px-6">
        <div className="grid gap-8 md:grid-cols-5 md:gap-12">
          <div className="md:col-span-2">
            {eyebrow && (
              <p className="mb-4 text-xs font-semibold uppercase tracking-[0.19em] text-muted-foreground">
                {eyebrow}
              </p>
            )}
            <h2 className="text-4xl font-bold leading-[1.08] tracking-[-0.05em] text-foreground md:text-[41px]">
              {title}
            </h2>
            {description && (
              <p className="mt-4 text-balance text-base leading-relaxed text-muted-foreground">
                {description}
              </p>
            )}
            {helpLine && (
              <p className="mt-6 hidden text-[15px] leading-relaxed text-muted-foreground md:block">
                {helpLine}
              </p>
            )}
          </div>

          <div className="md:col-span-3">
            <Accordion type="single" collapsible>
              {items.map((item) => (
                <AccordionItem key={item.id} value={item.id} className="border-b border-border">
                  <AccordionTrigger className="cursor-pointer gap-4 py-5 text-left text-base font-semibold text-foreground hover:no-underline md:text-[17px]">
                    {item.question}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5">
                    <BlurredStagger text={item.answer} />
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          {helpLine && (
            <p className="text-[15px] leading-relaxed text-muted-foreground md:hidden">
              {helpLine}
            </p>
          )}
        </div>
      </div>
    </section>
  );
}

// Huruf memudar dari blur secara bertahap; CSS murni (globals.css: .zf-letter),
// dan dimatikan otomatis oleh prefers-reduced-motion.
const STAGGER_MS = 12;

export const BlurredStagger = ({ text }: { text: string }) => {
  let index = 0;
  // Letters animate inside unbreakable word spans, so lines only wrap between words.
  return (
    <p aria-label={text} className="break-words text-[15px] leading-relaxed text-muted-foreground">
      {text.split(' ').map((word, w) => (
        <span key={w} aria-hidden="true">
          <span className="inline-block whitespace-nowrap">
            {word.split('').map((char, c) => (
              <span key={c} className="zf-letter" style={{ animationDelay: `${index++ * STAGGER_MS}ms` }}>
                {char}
              </span>
            ))}
          </span>{' '}
        </span>
      ))}
    </p>
  );
};
