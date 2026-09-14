import { Link } from "react-router-dom";
import { Zap, MapPin, Mail, Heart } from "lucide-react";

const navLinks = [
  { to: "/spots",        label: "Find a Charge" },
  { to: "/route",        label: "ChargePush Route" },
  { to: "/host",         label: "ChargePush Host" },
  { to: "/rescue",       label: "ChargePush Rescue" },
  { to: "/loyalty",      label: "ChargePush Rewards" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/pricing",      label: "Pricing" },
  { to: "/about-contact", label: "About" },
];

const legalLinks = [
  { href: "#", label: "Privacy Policy" },
  { href: "#", label: "Terms of Service" },
  { href: "#", label: "Safety Guidelines" },
];

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-100 border-t border-slate-800/80">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Brand + contact row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
          {/* Brand */}
          <div className="max-w-md">
            <Link to="/" className="flex items-center gap-2 mb-3 group">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Zap className="w-5 h-5 text-primary-foreground fill-current" />
              </div>
              <span className="font-display font-black text-2xl tracking-tight">
                CHARGE<span className="text-primary">PUSH</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm font-medium leading-relaxed mb-3">
              Charge. Push. Go. — Distributed EV charging-access network connecting EV riders with nearby charging access from home hosts, local spots, and charging networks.
            </p>
            <p className="text-xs font-bold uppercase tracking-widest text-primary">
              Keep Moving.
            </p>
          </div>

          {/* Contact info */}
          <div className="flex flex-col gap-2.5 text-sm text-slate-400">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span>The ChargePush Network</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-primary flex-shrink-0" />
              <span>support@chargepush.com</span>
            </div>
          </div>
        </div>

        {/* Nav links row */}
        <div className="border-t border-slate-800/80 pt-8 pb-6">
          <nav className="flex flex-wrap gap-x-6 gap-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm font-semibold text-slate-400 hover:text-primary transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-slate-800/80 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-slate-500 flex items-center gap-1.5 font-medium">
            © {new Date().getFullYear()} ChargePush. Made for electric mobility.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <a
                key={link.label}
                href={link.href}
                onClick={(e) => e.preventDefault()}
                className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
              >
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
