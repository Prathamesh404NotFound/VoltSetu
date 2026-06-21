import { Phone, MessageCircle, MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function FloatingButtons() {
  const location = useLocation();
  const isSpotsPage = location.pathname === "/spots";

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3">
      {!isSpotsPage && (
        <div className="lg:hidden animate-slide-down">
          <Link
            to="/spots"
            className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 animate-glow"
            aria-label="Find a Spot"
          >
            <MapPin className="w-6 h-6 text-white" />
          </Link>
        </div>
      )}
      <a
        href="https://wa.me/919876543210?text=Hi%2C%20I%20want%20to%20know%20about%20VoltSetu"
        target="_blank"
        rel="noopener noreferrer"
        className="w-14 h-14 rounded-full gradient-green flex items-center justify-center shadow-xl hover:shadow-ev-green/40 hover:scale-110 transition-all duration-300"
        aria-label="WhatsApp"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </a>
      <a
        href="tel:+919876543210"
        className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-xl hover:shadow-primary/40 hover:scale-110 transition-all duration-300"
        aria-label="Call Now"
      >
        <Phone className="w-6 h-6 text-white" />
      </a>
    </div>
  );
}
