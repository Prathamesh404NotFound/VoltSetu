import { useState } from "react";
import { Star, MapPin, Clock, BadgeCheck, Phone, MessageCircle, Zap, IndianRupee } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./Auth/AuthProvider";
import { Button } from "@/components/ui/button";
import GoogleLoginModal from "./Auth/GoogleLoginModal";

interface SpotCardProps {
  id?: string;
  name: string;
  host: string;
  hostPhone?: string;
  distance?: string;
  pricePerHour: number;
  rating: number | null;
  reviews: number;
  isOpen?: boolean;
  isVerified: boolean;
  isFeatured?: boolean;
  image?: string;
  outletType?: string;
  availableHours?: string;
  onBook?: () => void;
}

export default function SpotCard({
  id, name, host, hostPhone, distance, pricePerHour, rating, reviews,
  isOpen, isVerified, isFeatured, image, outletType, availableHours, onBook
}: SpotCardProps) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);

  const handleBookNow = () => {
    if (!user) {
      setShowLoginModal(true);
    } else if (onBook) {
      onBook();
    }
  };

  const getWhatsAppLink = () => {
    if (!hostPhone) return "#";
    // strip non-numeric
    const num = hostPhone.replace(/\D/g, "");
    return `https://wa.me/${num}`;
  };

  const getPhoneLink = () => {
    if (!hostPhone) return "#";
    const num = hostPhone.replace(/\D/g, "");
    return `tel:+${num}`;
  };

  return (
    <div
      className={cn(
        "group relative bg-card rounded-2xl border border-border overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 flex flex-col h-full",
        isFeatured && "ring-2 ring-primary/30"
      )}
    >
      {isFeatured && (
        <div className="absolute top-4 left-4 z-10 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-semibold">
          Recommended
        </div>
      )}

      {/* Image */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        {image ? (
          <img src={image} alt={name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-ev-green/20 flex flex-col items-center justify-center">
            <Zap className="w-10 h-10 text-primary/40 mb-2" />
            <span className="text-primary/60 font-medium text-sm">Charging Spot</span>
          </div>
        )}
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2">
          {isVerified && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-ev-green/90 backdrop-blur-md text-white text-xs font-medium shadow-sm">
              <BadgeCheck className="w-3 h-3" /> Verified
            </span>
          )}
          {outletType && (
            <span className="flex items-center gap-1 px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium shadow-sm">
              <Zap className="w-3 h-3 text-yellow-400" /> {outletType}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <div className="flex justify-between items-start mb-1 gap-2">
          <h3 className="font-display font-semibold text-lg text-card-foreground group-hover:text-primary transition-colors leading-tight">
            {name}
          </h3>
          {isOpen !== undefined && (
            <span
              className={cn(
                "px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider whitespace-nowrap",
                isOpen ? "bg-ev-green/10 text-ev-green" : "bg-destructive/10 text-destructive"
              )}
            >
              {isOpen ? "Open" : "Closed"}
            </span>
          )}
        </div>

        <p className="text-sm text-muted-foreground mb-4">Hosted by {host}</p>

        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-muted-foreground mb-5 mt-auto">
          {distance && (
            <span className="flex items-center gap-1.5" title="Distance">
              <MapPin className="w-4 h-4 text-primary/70 shrink-0" /> <span className="truncate">{distance}</span>
            </span>
          )}
          {rating && reviews > 0 ? (
            <span className="flex items-center gap-1.5" title="Rating">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
              <span>{rating} <span className="text-xs">({reviews})</span></span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5" title="New">
              <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-bold uppercase tracking-wider">New</span>
            </span>
          )}
          <span className="flex items-center gap-1.5" title="Availability">
            <Clock className="w-4 h-4 text-primary/70 shrink-0" />
            <span className="truncate">{availableHours || "24/7"}</span>
          </span>
          <span className="flex items-center gap-1.5 font-semibold text-foreground" title="Price">
            <span>₹{pricePerHour}</span><span className="text-xs text-muted-foreground font-normal">/hr</span>
          </span>
          <span className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Payment">
            <IndianRupee className="w-3.5 h-3.5 text-primary/70 shrink-0" /> Pay at spot
          </span>
        </div>

        <div className="flex gap-2 mt-auto">
          <Button
            onClick={handleBookNow}
            className="flex-1 rounded-xl font-semibold shadow-md hover:-translate-y-0.5 transition-all"
          >
            Book Now
          </Button>
          {hostPhone && (
            <>
              <a
                href={getPhoneLink()}
                className="flex items-center justify-center p-2.5 rounded-xl border border-border hover:bg-muted transition-colors shrink-0"
                title="Call Host"
              >
                <Phone className="w-4 h-4 text-foreground" />
              </a>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center p-2.5 rounded-xl border border-green-200 bg-green-50 hover:bg-green-100 transition-colors shrink-0 dark:border-green-900/50 dark:bg-green-900/20 dark:hover:bg-green-900/40"
                title="WhatsApp Host"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-green-600 dark:fill-green-500">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                </svg>
              </a>
            </>
          )}
        </div>
      </div>

      {showLoginModal && (
        <GoogleLoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
}
