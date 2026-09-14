import { Link } from "react-router-dom";
import { HelpCircle, Mail, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";
import SEO from "@/components/SEO";

const faqs = [
  {
    q: "How do I find a charging spot?",
    a: `Go to Find a Charge (/spots) or tap the "Find a Charge" button on the homepage. You can browse spots on a map or list view. Grant location access to see spots nearest to you, or search by city or area.`,
  },
  {
    q: "What does 'Verified' mean?",
    a: "A Verified badge means the ChargePush team has reviewed the host's identity, confirmed their location, and checked that their charging access matches the listing description. It does not guarantee availability at any given time.",
  },
  {
    q: "How do I become a host?",
    a: `Visit the Become a Host page (/host) and start the registration form. You'll provide details about your charging access, set your availability and price, and go through our verification process before your listing goes live.`,
  },
  {
    q: "How long does host verification take?",
    a: "Host verification is reviewed manually by our team. This typically takes a few business days. We'll notify you by email once your listing is verified and live.",
  },
  {
    q: "What happens if a host cancels?",
    a: "If a host cancels a confirmed booking, you will be notified immediately. We recommend using ChargePush Rescue (/rescue) to find the nearest alternative spot quickly.",
  },
  {
    q: "Is my payment secure?",
    a: "Payments are processed through a third-party payment provider. ChargePush does not store your full card details. All transactions are encrypted.",
  },
  {
    q: "What is ChargePush Rescue?",
    a: "ChargePush Rescue (/rescue) is the emergency charging flow for riders at critically low battery. It surfaces the nearest available spots and helps you find and request a charge as quickly as possible.",
  },
  {
    q: "How do I plan a route with charging stops?",
    a: `Use the Trip Planner (/route). Enter your origin and destination and ChargePush will suggest corridor charging stops along your route.`,
  },
  {
    q: "How do I contact support?",
    a: "Email us at hello@chargepush.com. We aim to respond within one business day.",
  },
  {
    q: "How do I delete my account?",
    a: "To request account deletion and data removal, email hello@chargepush.com with your registered email address. We will process your request within 14 business days.",
  },
];

function FAQItem({ q, a }: { q: string; a: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="border border-border rounded-xl overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/50 transition-colors"
        aria-expanded={open}
      >
        <span className="font-semibold text-foreground text-sm">{q}</span>
        {open ? (
          <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>
      {open && (
        <div className="px-5 pb-4 pt-1 text-sm text-muted-foreground leading-relaxed border-t border-border">
          {a}
        </div>
      )}
    </div>
  );
}

export default function Help() {
  return (
    <>
      <SEO
        title="Help & Safety — ChargePush"
        description="Frequently asked questions, safety guidelines, and support for ChargePush riders and hosts. Find answers about booking, verification, and more."
        noindex={false}
      />
      <main className="min-h-screen pt-28 pb-24">
        <div className="page-shell">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <HelpCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Support</p>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Help & Safety</h1>
              </div>
            </div>
            <p className="text-foreground/70 mb-10 leading-relaxed">
              Find answers to common questions about ChargePush, or contact us directly.
            </p>

            {/* FAQ */}
            <section className="mb-14">
              <h2 className="text-lg font-bold text-foreground mb-5">Frequently Asked Questions</h2>
              <div className="space-y-3">
                {faqs.map((faq) => (
                  <FAQItem key={faq.q} q={faq.q} a={faq.a} />
                ))}
              </div>
            </section>

            {/* Safety guidelines */}
            <section className="mb-14">
              <h2 className="text-lg font-bold text-foreground mb-5">Safety Guidelines</h2>
              <div className="rounded-2xl border border-border bg-card p-6 space-y-4 text-sm text-foreground/80 leading-relaxed">
                <div>
                  <h3 className="font-semibold text-foreground mb-1">For Riders</h3>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li>Only use the connector type shown in the listing</li>
                    <li>Confirm your booking before travelling to a spot</li>
                    <li>Contact the host via the platform if you are running late</li>
                    <li>Leave the host's premises as you found them</li>
                    <li>Report any safety concerns to hello@chargepush.com immediately</li>
                  </ul>
                </div>
                <div>
                  <h3 className="font-semibold text-foreground mb-1">For Hosts</h3>
                  <ul className="space-y-1.5 list-disc list-inside">
                    <li>Only list charging access that is safe, functional, and in your ownership or authorised control</li>
                    <li>Ensure your availability reflects actual access — update it when unavailable</li>
                    <li>Do not share personal contact information outside the platform with new users</li>
                    <li>Report any misuse by a Rider to hello@chargepush.com</li>
                  </ul>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section>
              <h2 className="text-lg font-bold text-foreground mb-5">Contact Us</h2>
              <div className="rounded-2xl border border-border bg-card p-6 flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Mail className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground mb-1">Email Support</p>
                  <a
                    href="mailto:hello@chargepush.com"
                    className="text-primary font-medium hover:underline"
                  >
                    hello@chargepush.com
                  </a>
                  <p className="text-sm text-muted-foreground mt-1.5">
                    We aim to respond within one business day.
                  </p>
                </div>
              </div>
            </section>

            <div className="mt-12 pt-8 border-t border-border flex gap-4 text-sm">
              <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>
              <Link to="/terms" className="text-primary hover:underline font-medium">Terms of Service</Link>
              <Link to="/" className="text-muted-foreground hover:text-foreground">Back to Home</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
