import { Link } from "react-router-dom";
import { Zap, MapPin, Mail } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-100 border-t border-slate-800/80">
      <div className="container mx-auto px-4 sm:px-6 py-12 lg:py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-8 lg:gap-12 mb-12">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <Link to="/" className="inline-flex items-center gap-2 group">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
                <Zap className="w-6 h-6 text-primary-foreground fill-current" />
              </div>
              <span className="font-display font-black text-2xl tracking-tight">
                CHARGE<span className="text-primary">PUSH</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm font-medium leading-relaxed max-w-sm">
              Charge. Push. Go. — Distributed EV charging-access network connecting EV riders with nearby charging access from home hosts, local charging spots, and charging networks.
            </p>
            <div className="pt-2">
              <span className="text-xs font-bold uppercase tracking-widest text-primary px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
                Keep Moving.
              </span>
            </div>
          </div>

          {/* Column 1: Rider Experience */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-slate-200">Rider</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/spots" className="hover:text-primary transition-colors">Find a Charge</Link></li>
              <li><Link to="/trip-planner" className="hover:text-primary transition-colors">ChargePush Route</Link></li>
              <li><Link to="/emergency" className="hover:text-primary transition-colors">ChargePush Rescue</Link></li>
              <li><Link to="/pricing" className="hover:text-primary transition-colors">Pricing</Link></li>
              <li><Link to="/loyalty" className="hover:text-primary transition-colors">Rewards</Link></li>
            </ul>
          </div>

          {/* Column 2: Host Experience */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-slate-200">Host</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/host" className="hover:text-primary transition-colors">Become a Host</Link></li>
              <li><Link to="/how-it-works" className="hover:text-primary transition-colors">How It Works</Link></li>
              <li><Link to="/dashboard/earnings" className="hover:text-primary transition-colors">Host Earnings</Link></li>
              <li><Link to="/about" className="hover:text-primary transition-colors">About Us</Link></li>
            </ul>
          </div>

          {/* Column 3: Contact & Legal */}
          <div className="space-y-3">
            <h4 className="font-display font-bold text-sm uppercase tracking-wider text-slate-200">Support & Legal</h4>
            <ul className="space-y-2 text-sm text-slate-400">
              <li><Link to="/contact" className="hover:text-primary transition-colors">Contact</Link></li>
              <li><a href="mailto:hello@chargepush.com" className="hover:text-primary transition-colors flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-primary" /> hello@chargepush.com</a></li>
              <li><span className="text-slate-500 text-xs hover:text-slate-400 cursor-pointer">Privacy Policy</span></li>
              <li><span className="text-slate-500 text-xs hover:text-slate-400 cursor-pointer">Terms of Service</span></li>
              <li><span className="text-slate-500 text-xs hover:text-slate-400 cursor-pointer">Help & Safety</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="border-t border-slate-800/80 pt-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-slate-500 font-medium">
            © {new Date().getFullYear()} ChargePush Network. Charge. Push. Go.
          </p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin className="w-3.5 h-3.5 text-primary" />
            <span>Distributed Charging Network — Indian Cities</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
