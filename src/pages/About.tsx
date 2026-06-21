import { Target, Eye, Leaf, Users, Heart, Lightbulb, Globe, TrendingUp } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import aboutImg from "@/assets/about-community.jpg";
import CTABanner from "@/components/CTABanner";
import SEO from "@/components/SEO";

export default function About() {
  useScrollReveal();

  return (
    <div className="pt-24">
      <SEO 
        title="About ChargeNest — Our Mission to Power India's EV Future"
        description="Learn how ChargeNest is building a hyperlocal EV charging network by connecting riders with unused home outlets across India's neighborhoods."
      />
      {/* Hero */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-blob" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-display font-bold text-3xl md:text-5xl text-white leading-tight mb-6">
                Powering India's EV Future,{" "}
                <span className="text-gradient">One Neighborhood at a Time</span>
              </h1>
              <p className="text-lg text-white/70 leading-relaxed">
                ChargeNest was born from a simple observation: millions of EV two-wheeler riders in India struggle to find convenient charging points, while millions of homeowners have unused electricity outlets. We connect them.
              </p>
            </div>
            <div className="hidden lg:block">
              <img src={aboutImg} alt="Community of EV riders" className="rounded-3xl shadow-2xl animate-float" loading="lazy" width={1280} height={720} />
            </div>
          </div>
        </div>
      </section>

      {/* Story */}
      <section className="py-20">
        <div className="container mx-auto px-4 max-w-3xl">
          <div className="reveal">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-6 text-center">Our Story</h2>
            <div className="prose prose-lg text-muted-foreground mx-auto text-center">
              <p>
                In cities and towns across India, EV adoption is booming. Electric scooters and two-wheelers are becoming the preferred choice for daily commuters. But the charging infrastructure has not kept up. Public charging stations are few, far, and often unreliable.
              </p>
              <p>
                We realized that the solution was already hiding in plain sight: every home, shop, and apartment building has electricity outlets that sit unused for hours each day. What if we could turn those outlets into a distributed charging network?
              </p>
              <p>
                That is how ChargeNest was born. A hyperlocal marketplace where riders find nearby charging spots and homeowners earn passive income from their existing outlets. No heavy equipment, no special installation, just community-powered charging.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Mission & Vision */}
      <section className="py-20 bg-soft-gray">
        <div className="container mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="reveal p-8 rounded-2xl bg-card border border-border shadow-sm">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-3">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To make EV charging accessible, affordable, and available in every Indian neighborhood by empowering homeowners to become part of the charging infrastructure.
              </p>
            </div>
            <div className="reveal p-8 rounded-2xl bg-card border border-border shadow-sm" style={{ transitionDelay: "0.1s" }}>
              <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-3">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                A future where every street in India has a charging point, powered by community participation and clean energy, making EV ownership seamless for everyone.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why It Matters */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Why This Matters in Indian Neighborhoods
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 reveal">
            {[
              { icon: Globe, title: "Access Gap", desc: "Most Tier 2 and Tier 3 cities lack public EV charging infrastructure." },
              { icon: TrendingUp, title: "Growing Demand", desc: "EV two-wheeler sales are growing 50%+ year-on-year in India." },
              { icon: Users, title: "Community Power", desc: "Decentralized charging builds stronger, connected neighborhoods." },
              { icon: Leaf, title: "Green Impact", desc: "Every charge on ChargeNest reduces emissions and fossil fuel dependence." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg transition-all hover:-translate-y-1" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Philosophy */}
      <section className="py-20 bg-soft-gray">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              What We Believe In
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 reveal">
            {[
              { icon: Heart, title: "Trust First", desc: "Everything we build starts with trust between riders and hosts." },
              { icon: Lightbulb, title: "Simplicity", desc: "Charging should be as easy as plugging in your phone." },
              { icon: Users, title: "Community", desc: "Neighborhoods thrive when people help each other." },
              { icon: Leaf, title: "Sustainability", desc: "Every small step toward clean mobility counts." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex gap-4 p-6 rounded-2xl bg-card border border-border" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="w-10 h-10 rounded-xl bg-ev-green/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-ev-green" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <CTABanner variant="dark" title="Join the ChargeNest Movement" subtitle="Be part of India's community-powered EV charging revolution." />
    </div>
  );
}
