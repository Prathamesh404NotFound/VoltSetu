import { Link } from "react-router-dom";
import { ArrowRight, Phone, MessageCircle } from "lucide-react";

interface CTABannerProps {
  title?: string;
  subtitle?: string;
  variant?: "default" | "dark";
}

export default function CTABanner({
  title = "Ready to Keep Moving?",
  subtitle = "Join The ChargePush Network — find nearby charging access or power your neighborhood as a host.",
  variant = "default",
}: CTABannerProps) {
  const isDark = variant === "dark";

  return (
    <section className={`py-20 ${isDark ? "gradient-hero" : ""}`}>
      <div className="container mx-auto px-4">
        <div
          className={`relative rounded-3xl p-10 md:p-16 text-center overflow-hidden ${
            isDark
              ? ""
              : "bg-gradient-to-br from-primary/10 via-slate-900/5 to-primary/10 border border-primary/10"
          }`}
        >
          {!isDark && (
            <>
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />
            </>
          )}

          <h2
            className={`font-display font-black text-3xl md:text-5xl mb-4 relative z-10 ${
              isDark ? "text-white" : "text-foreground"
            }`}
          >
            {title}
          </h2>
          <p
            className={`max-w-xl mx-auto mb-8 relative z-10 font-medium ${
              isDark ? "text-white/70" : "text-muted-foreground"
            }`}
          >
            {subtitle}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 relative z-10">
            <Link
              to="/spots"
              className="px-8 py-3.5 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 flex items-center gap-2 btn-forward"
            >
              Find a Charge <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              to="/host"
              className={`px-8 py-3.5 rounded-xl font-bold transition-all flex items-center gap-2 ${
                isDark
                  ? "bg-white/10 text-white border border-white/20 hover:bg-white/20"
                  : "bg-card border border-border text-foreground hover:shadow-md"
              }`}
            >
              Power Your Neighborhood
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
