import { useState, useEffect, useMemo, type ReactNode } from "react";
import { Star, MapPin, Clock, BadgeCheck, Phone, Zap, Heart } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./Auth/AuthProvider";
import { Button } from "@/components/ui/button";
import GoogleLoginModal from "./Auth/GoogleLoginModal";
import {
  subscribeToSpotAvailability,
  SpotAvailability,
} from "@/lib/availabilityService";

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

const MAX_VISIBLE_BADGES = 2;

function BadgeCluster({ badges }: { badges: Array<{ key: string; node: ReactNode }> }) {
  if (badges.length === 0) return null;

  const visible = badges.slice(0, MAX_VISIBLE_BADGES);
  const overflow = badges.length - MAX_VISIBLE_BADGES;

  return (
    <div className="flex flex-wrap items-start gap-1.5 max-w-[calc(100%-2.5rem)]">
      {visible.map((badge) => (
        <div key={badge.key}>{badge.node}</div>
      ))}
      {overflow > 0 && (
        <span className="px-2 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium shadow-sm">
          +{overflow}
        </span>
      )}
    </div>
  );
}

function ImagePlaceholder() {
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-ev-green/20 flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-2 shadow-md">
        <Zap className="w-6 h-6 text-white" />
      </div>
      <span className="text-primary/70 font-semibold text-sm tracking-wide">VoltSetu</span>
    </div>
  );
}

const overlayBadgeClass =
  "inline-flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-md text-white text-xs font-medium shadow-sm";

export default function SpotCard({
  id, name, host, hostPhone, distance, pricePerHour, rating, reviews,
  isOpen, isVerified, isFeatured, image, outletType, availableHours, onBook
}: SpotCardProps) {
  const { user } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [saved, setSaved] = useState(false);
  const [imgError, setImgError] = useState(false);
  // null = no record yet (omit badge), non-null = live data
  const [availability, setAvailability] = useState<SpotAvailability | null | undefined>(undefined);

  useEffect(() => {
    if (!id) return;
    const unsub = subscribeToSpotAvailability(id, (av) => {
      setAvailability(av);
    });
    return unsub;
  }, [id]);

  useEffect(() => {
    setImgError(false);
  }, [image]);

  const hostFirstName = host.trim().split(/\s+/)[0] || host;
  const isNew = !rating || reviews === 0;
  const showImage = Boolean(image) && !imgError;

  const statusBadges = useMemo(() => {
    const badges: Array<{ key: string; node: ReactNode }> = [];

    if (isFeatured) {
      badges.push({
        key: "featured",
        node: (
          <span className={cn(overlayBadgeClass, "bg-primary text-primary-foreground")}>
            Recommended
          </span>
        ),
      });
    }

    if (isVerified) {
      badges.push({
        key: "verified",
        node: (
          <span className={cn(overlayBadgeClass, "bg-ev-green/90")}>
            <BadgeCheck className="w-3 h-3" /> Verified
          </span>
        ),
      });
    }

    if (availability !== undefined && availability !== null) {
      badges.push({
        key: "occupancy",
        node: (
          <span
            className={cn(
              overlayBadgeClass,
              availability.isOccupied ? "bg-amber-600/90" : "bg-ev-green/90"
            )}
          >
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full bg-white/90",
                availability.isOccupied && "animate-pulse"
              )}
            />
            {availability.isOccupied ? "Occupied" : "Available"}
          </span>
        ),
      });
    }

    if (isOpen !== undefined) {
      badges.push({
        key: "hours",
        node: (
          <span
            className={cn(
              overlayBadgeClass,
              isOpen ? "bg-ev-green/90" : "bg-destructive/90"
            )}
          >
            {isOpen ? "Open" : "Closed"}
          </span>
        ),
      });
    }

    if (isNew) {
      badges.push({
        key: "new",
        node: (
          <span className={cn(overlayBadgeClass, "bg-primary/90")}>
            New
          </span>
        ),
      });
    }

    if (outletType) {
      badges.push({
        key: "outlet",
        node: (
          <span className={cn(overlayBadgeClass, "bg-black/60")}>
            <Zap className="w-3 h-3 text-yellow-400" /> {outletType}
          </span>
        ),
      });
    }

    return badges;
  }, [isFeatured, isVerified, availability, isOpen, isNew, outletType]);

  const handleBookNow = () => {
    if (!user) {
      setShowLoginModal(true);
    } else if (onBook) {
      onBook();
    }
  };

  const getWhatsAppLink = () => {
    if (!hostPhone) return "#";
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
      {/* Image */}
      <div className="relative h-44 overflow-hidden flex-shrink-0">
        {showImage ? (
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        ) : (
          <ImagePlaceholder />
        )}

        {/* Gradient for badge legibility */}
        <div
          className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent pointer-events-none"
          aria-hidden="true"
        />

        {/* Top-left: status badges */}
        <div className="absolute top-3 left-3 z-10">
          <BadgeCluster badges={statusBadges} />
        </div>

        {/* Top-right: save / heart */}
        <div className="absolute top-3 right-3 z-10">
          <button
            type="button"
            aria-label="Save spot"
            aria-pressed={saved}
            onClick={(e) => {
              e.stopPropagation();
              setSaved((prev) => !prev);
            }}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-black/50 backdrop-blur-md text-white shadow-sm hover:bg-black/65 transition-colors"
          >
            <Heart
              className={cn("w-4 h-4", saved && "fill-red-400 text-red-400")}
            />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex flex-col flex-1">
        <h3 className="font-display font-semibold text-lg text-card-foreground group-hover:text-primary transition-colors leading-tight mb-3">
          {name}
        </h3>

        {/* Host trust + price emphasis */}
        <div className="mb-4">
          <div className="flex items-center gap-1.5 text-sm text-muted-foreground mb-2">
            <span className="font-medium text-foreground/80">{hostFirstName}</span>
            {isVerified && (
              <BadgeCheck className="w-3.5 h-3.5 text-ev-green shrink-0" aria-label="Verified host" />
            )}
          </div>
          <div className="flex items-baseline gap-1">
            <span className="text-2xl font-bold text-foreground tracking-tight">
              ₹{pricePerHour}
            </span>
            <span className="text-sm font-medium text-muted-foreground">/hr</span>
          </div>
          <p className="text-[11px] text-muted-foreground mt-0.5">Pay at spot</p>
        </div>

        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-sm text-muted-foreground mb-5 mt-auto">
          {distance && (
            <span className="flex items-center gap-1.5" title="Distance">
              <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
              <span className="truncate">{distance}</span>
            </span>
          )}
          {rating && reviews > 0 ? (
            <span className="flex items-center gap-1.5" title="Rating">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
              <span>
                {rating} <span className="text-xs">({reviews})</span>
              </span>
            </span>
          ) : (
            <span className="flex items-center gap-1.5 text-xs text-muted-foreground" title="Rating">
              <Star className="w-4 h-4 text-muted-foreground/40 shrink-0" />
              <span>No reviews yet</span>
            </span>
          )}
          <span className="flex items-center gap-1.5 col-span-2 sm:col-span-1" title="Availability">
            <Clock className="w-4 h-4 text-primary/70 shrink-0" />
            <span className="truncate">{availableHours || "24/7"}</span>
          </span>
        </div>

        <div className="flex gap-2 mt-auto">
          <Button
            onClick={handleBookNow}
            className="flex-1 rounded-xl font-semibold shadow-md gradient-primary text-white border-0 hover:opacity-90 hover:-translate-y-0.5 transition-all"
          >
            Book Now
          </Button>
          {hostPhone && (
            <>
              <a
                href={getPhoneLink()}
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-transparent hover:bg-muted transition-colors shrink-0"
                aria-label="Call host"
              >
                <Phone className="w-4 h-4 text-muted-foreground" />
              </a>
              <a
                href={getWhatsAppLink()}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center w-10 h-10 rounded-xl border border-border bg-transparent hover:bg-muted transition-colors shrink-0"
                aria-label="Message host on WhatsApp"
              >
                <svg viewBox="0 0 24 24" className="w-4 h-4 fill-muted-foreground" aria-hidden="true">
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
