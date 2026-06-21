import { Link } from "react-router-dom";
import { Zap, MapPin, Mail, Phone, Heart } from "lucide-react";

const navLinks = [
  { to: "/spots",        label: "Find Charging Spots" },
  { to: "/host",         label: "Become a Host" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/pricing",      label: "Pricing" },
  { to: "/about",        label: "About Us" },
  { to: "/contact",      label: "Contact" },
];

const legalLinks = [
  { to: "#", label: "Privacy Policy" },
  { to: "#", label: "Terms of Service" },
  { to: "#", label: "Safety Guidelines" },
];

export default function Footer() {
  return (
    <footer className="bg-navy text-navy-foreground border-t border-white/10">
      <div className="container mx-auto px-4 sm:px-6 py-10 sm:py-12">
        {/* Brand + contact row */}
        <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8 mb-10">
          {/* Brand */}
          <div className="max-w-sm">
            <Link to="/" className="flex items-center gap-2 mb-3">
              <div className="w-9 h-9 rounded-xl gradient-primary flex items-center justify-center shadow-lg">
                <Zap className="w-4 h-4 text-white" />
              </div>
              <span className="font-display font-bold text-xl">VoltSetu</span>
            </Link>
            <p className="text-white/55 text-sm leading-relaxed">
              India's hyperlocal EV charging marketplace — find nearby charging spots
              or earn passive income by listing your home outlet.
            </p>
          </div>

          {/* Contact info */}
          <div className="flex flex-col gap-2.5 text-sm text-white/55">
            <div className="flex items-center gap-2.5">
              <MapPin className="w-4 h-4 text-primary flex-shrink-0" />
              <span>Serving 50+ cities across India</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Mail className="w-4 h-4 text-primary flex-shrink-0" />
              <span>hello@voltsetu.in</span>
            </div>
            <div className="flex items-center gap-2.5">
              <Phone className="w-4 h-4 text-primary flex-shrink-0" />
              <span>+91 98765 43210</span>
            </div>
          </div>
        </div>

        {/* Nav links row */}
        <div className="border-t border-white/10 pt-8 pb-6">
          <nav className="flex flex-wrap gap-x-6 gap-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-sm text-white/55 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-xs text-white/35 flex items-center gap-1.5">
            © 2024 VoltSetu. Made with{" "}
            <Heart className="w-3 h-3 text-primary inline" fill="currentColor" /> in India.
          </p>
          <div className="flex flex-wrap gap-x-4 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.label}
                to={link.to}
                className="text-xs text-white/35 hover:text-white/70 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
