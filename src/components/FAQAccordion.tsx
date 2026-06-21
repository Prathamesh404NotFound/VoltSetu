import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const defaultFaqs = [
  {
    q: "How does VoltSetu work?",
    a: "VoltSetu connects EV two-wheeler riders with nearby home charging spots. Riders search for a spot, navigate to it, plug in, and pay based on charging time. Homeowners list their outlet and earn money each time a rider charges.",
  },
  {
    q: "How much does it cost to charge?",
    a: "Pricing is set by individual hosts, typically ranging from Rs 5 to Rs 15 per 10 minutes. You can see the exact price on each charging spot listing before you book.",
  },
  {
    q: "Is it safe to charge at someone's home?",
    a: "Yes. All hosts go through a verification process. We verify identity, outlet safety, and location details. Riders and hosts both have rating systems to maintain community trust.",
  },
  {
    q: "How much can I earn as a host?",
    a: "Earnings depend on your area's demand and pricing. On average, hosts earn Rs 2,000 to Rs 5,000 per month with minimal effort. You set your own rates and availability.",
  },
];

interface FAQAccordionProps {
  faqs?: { q: string; a: string }[];
}

export default function FAQAccordion({ faqs = defaultFaqs }: FAQAccordionProps) {
  return (
    <Accordion type="single" collapsible className="w-full">
      {faqs.map((faq, i) => (
        <AccordionItem key={i} value={`faq-${i}`} className="border-border">
          <AccordionTrigger className="text-left font-display font-semibold text-foreground hover:text-primary hover:no-underline py-5">
            {faq.q}
          </AccordionTrigger>
          <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
            {faq.a}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
