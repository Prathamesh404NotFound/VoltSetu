/**
 * Feature Grid — VoltSetu adaptation of PrebuiltUI's "Feature Sections" component
 * from 21st.dev (https://21st.dev/@prebuiltui/components/feature-sections)
 *
 * Original structure: centered header block + flex-wrap row of 3 max-w-80 cards,
 * each with an image, a slate-700 title, and a slate-600 description.
 *
 * VoltSetu changes:
 * - Images replaced with lucide icons in tinted rounded-xl tiles (faster, offline-safe)
 * - Poppins <style> import removed — uses site's self-hosted Space Grotesk (font-display)
 * - Hardcoded slate-500/600/700 replaced with tokens: muted-foreground / text-foreground
 * - Light + dark both work via bg-background / text-foreground / primary tokens
 * - framer-motion whileInView entrance with stagger; disabled under prefers-reduced-motion
 */
import { motion, useReducedMotion } from "framer-motion";
import { Zap, MessageSquare, Siren, ShieldCheck } from "lucide-react";

const FEATURES = [
  {
    icon: Zap,
    title: "Live availability",
    description: "See whether each outlet is free right now before you ride out — no more dead ends at the destination.",
  },
  {
    icon: MessageSquare,
    title: "Book & chat with hosts",
    description: "Reserve a slot and talk to the host directly in the app. Pay at the spot, no wallet needed.",
  },
  {
    icon: Siren,
    title: "Roadside rescue mode",
    description: "Stranded with a dead battery? One tap finds the nearest open spot and books it instantly.",
  },
  {
    icon: ShieldCheck,
    title: "Verified & rated",
    description: "Every host is identity-checked and rated by riders — the community keeps itself trustworthy.",
  },
];

export default function FeatureGrid() {
  const reduceMotion = useReducedMotion();

  return (
    <section className="w-full py-20 lg:py-24 bg-background" aria-label="Why ChargePush">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 dark:bg-primary/15 text-primary text-xs font-bold uppercase tracking-[0.18em] mb-4">
            Why ChargePush
          </div>
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground">
            Everything a rider needs
          </h2>
          <p className="text-muted-foreground text-sm md:text-base mt-3 leading-relaxed">
            Find, book, and charge at trusted spots across India — live availability, one-tap booking, and a
            rescue mode when you're stranded.
          </p>
        </div>

        <div className="flex flex-wrap items-start justify-center gap-6 md:gap-10">
          {FEATURES.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                className="max-w-80 group hover:-translate-y-1.5 transition-transform duration-300"
                initial={reduceMotion ? undefined : { opacity: 0, y: 20 }}
                whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-60px" }}
                transition={{ duration: 0.45, delay: i * 0.15, ease: "easeOut" }}
              >
                <div className="rounded-xl p-5 bg-primary/10 dark:bg-primary/15 w-fit">
                  <Icon className="w-8 h-8 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground mt-4">{f.title}</h3>
                <p className="text-sm text-muted-foreground mt-2 leading-relaxed">{f.description}</p>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
