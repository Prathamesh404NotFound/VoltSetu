import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

const defaultFaqs = [
  {
    q: "What is ChargePush?",
    a: "ChargePush is a distributed EV charging-access network and marketplace that connects EV riders with nearby charging access from home hosts, local charging spots, and commercial charging networks.",
  },
  {
    q: "How do I find a charge?",
    a: "Open the 'Find a Charge' map to discover nearby charging spots. You can filter by distance, outlet type, price, and host rating, then navigate directly to your chosen spot.",
  },
  {
    q: "Can I charge from a home-hosted spot?",
    a: "Yes. ChargePush connects riders with verified home hosts who make their outlets or home charging setups accessible to electric riders in their neighborhood.",
  },
  {
    q: "Can I book a spot?",
    a: "Yes. You can request a charging slot in advance or reserve instant charging sessions directly through the app where host availability permits.",
  },
  {
    q: "How does pricing work?",
    a: "Pricing is transparently displayed on each listing before you charge. Rates are set by hosts or network operators per hour or session, with zero hidden fees.",
  },
  {
    q: "How do hosts join?",
    a: "Homeowners and local spot operators can click 'Power Your Neighborhood', submit basic property and outlet details, complete host verification, and start accepting charging requests.",
  },
  {
    q: "How does route charging work?",
    a: "Using ChargePush Route, enter your origin and destination to discover verified charging access points along your travel corridor before your battery gets low.",
  },
  {
    q: "What happens if I need charging urgently?",
    a: "Use ChargePush Rescue to instantly surface open, high-reliability charging options nearby when your battery percentage is critically low.",
  },
  {
    q: "How are charging spots verified?",
    a: "Every host listed on ChargePush completes identity check and outlet safety verification. Rider ratings and community reviews maintain high quality across the network.",
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
