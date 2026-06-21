import { MapPin } from "lucide-react";
import { Link, useLocation } from "react-router-dom";

export default function FloatingButtons() {
  const location = useLocation();
  const isSpotsPage = location.pathname === "/spots";

  if (isSpotsPage) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 lg:hidden animate-slide-down">
      <Link
        to="/spots"
        className="w-14 h-14 rounded-full gradient-primary flex items-center justify-center shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 animate-glow"
        aria-label="Find a Spot"
      >
        <MapPin className="w-6 h-6 text-white" />
      </Link>
    </div>
  );
}
