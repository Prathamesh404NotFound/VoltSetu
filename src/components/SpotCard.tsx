import { useState, useEffect, useMemo, type ReactNode } from "react";
import { Star, MapPin, Clock, BadgeCheck, Phone, Zap, Heart, Pause, Home } from "lucide-react";
import FacilitiesChips from "@/components/FacilitiesChips";
import { cn } from "@/lib/utils";
import { isFavorite, toggleFavorite } from "@/lib/favoritesService";
import { aggregateRating, getSpotReviews } from "@/lib/reviewsService";
import type { Review } from "@/types";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "./Auth/AuthProvider";
import { Button } from "@/components/ui/button";
import GoogleLoginModal from "./Auth/GoogleLoginModal";
import {
  subscribeToSpotAvailability,
  SpotAvailability,
} from "@/lib/availabilityService";
import {
  subscribeLiveStatus,
  type LiveStatus,
} from "@/lib/liveStatusService";
import { subscribeWaitingCount } from "@/lib/waitlistService";
import { pricePerKmRs, sessionCostRs } from "@/lib/rideCostService";
import { useT } from "@/lib/i18n";
import { Users } from "lucide-react";

interface SpotCardProps {
  id?: string;
  name: string;
  host: string;
  /** Optional host id — enables the host name to link to the public host profile. */
  hostId?: string;
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
  amenities?: Array<{ id?: string; icon?: string; name?: string }>;
  suggestedStop?: boolean;
  /** Rider-side pause flag from hostSettings (Round 34). */
  isPaused?: boolean;
  /** Explicit source tag: ChargePush Host vs Network Station */
  isNetworkStation?: boolean;
  onBook?: () => void;
  /** Live toggle overlay: host's "outlet available now" status. */
  showLiveStatus?: boolean;
  /** ₹/km cost line shown under the price. */
  showCostPerKm?: boolean;
  /** Optional direct Google Maps navigation URL. */
  googleMapsUrl?: string;
  googleMapsLink?: string;
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
    <div className="w-full h-full bg-gradient-to-br from-primary/20 to-cyan-500/20 flex flex-col items-center justify-center">
      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-2 shadow-md">
        <Zap className="w-6 h-6 text-white" />
      </div>
      <span className="text-primary font-black text-sm tracking-wide uppercase">ChargePush</span>
    </div>
  );
}

const overlayBadgeClass =
  "inline-flex items-center gap-1 px-2 py-1 rounded-full backdrop-blur-md text-white text-xs font-medium shadow-sm";

export default function SpotCard({
  id, name, host, hostId, hostPhone, distance, pricePerHour, rating, reviews,
  isOpen, isVerified, isFeatured, image, outletType, availableHours, amenities, suggestedStop, onBook,
  isPaused, isNetworkStation,
  showLiveStatus = true,
  showCostPerKm = true,
  googleMapsUrl, googleMapsLink,
}: SpotCardProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [saved, setSaved] = useState<boolean>(() =>
    user ? isFavorite(user.id, id ?? "") : false
  );
  const [imgError, setImgError] = useState(false);
  const [spotReviews, setSpotReviews] = useState<Review[]>([]);
  const t = useT();
  const [liveStatus, setLiveStatus] = useState<LiveStatus | null>(null);
  const [waitlistCount, setWaitlistCount] = useState(0);

  useEffect(() => {
    if (!id) return;
    let mounted = true;
    getSpotReviews(id).then((list) => mounted && setSpotReviews(list)).catch(() => mounted && setSpotReviews([]));
    return () => {
      mounted = false;
    };
  }, [id]);

  const displayRating = useMemo(() => {
    const { rating: avg, count } = aggregateRating(spotReviews, rating ?? 0);
    return { avg, count };
  }, [spotReviews, rating]);
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
    if (!id || !showLiveStatus) return;
    const unsubStatus = subscribeLiveStatus(id, (st) => setLiveStatus(st));
    const unsubWait = subscribeWaitingCount(id, (count) => setWaitlistCount(count));
    return () => {
      unsubStatus();
      unsubWait();
    };
  }, [id, showLiveStatus]);

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

    if (suggestedStop) {
      badges.push({
        key: "suggested",
        node: (
          <span className={cn(overlayBadgeClass, "bg-ev-green text-white")}>
            Suggested stop
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

    if (isPaused) {
      badges.push({
        key: "paused",
        node: (
          <span className={cn(overlayBadgeClass, "bg-amber-500/90 text-white")}>
            <Pause className="w-3 h-3" /> On break
          </span>
        ),
      });
    } else if (isOpen !== undefined) {
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

    // Live host toggle: "Outlet available now" beats the schedule-derived badge.
    if (liveStatus !== null) {
      badges.push({
        key: "live",
        node: (
          <span className={cn(overlayBadgeClass, liveStatus.available ? "bg-ev-green/90" : "bg-rose-600/90")}>
            <span className={cn("w-1.5 h-1.5 rounded-full bg-white/90", liveStatus.available ? "animate-pulse" : "")} />
            {liveStatus.available ? t("spot.available") : t("spot.occupied")}
          </span>
        ),
      });
    }

    if (liveStatus !== null && !liveStatus.available && waitlistCount > 0) {
      badges.push({
        key: "waitlist",
        node: (
          <span className={cn(overlayBadgeClass, "bg-amber-500/90")}>
            <Users className="w-3 h-3" /> {waitlistCount} {t("spot.waitlist").toLowerCase().includes("join") ? "waiting" : "on waitlist"}
          </span>
        ),
      });
    }

    return badges;
  }, [isFeatured, suggestedStop, isPaused, isVerified, availability, isOpen, isNew, outletType, liveStatus, waitlistCount, t]);

  const handleBookNow = () => {
    if (isPaused) {
      toast.info("This host is on a short break — their listing will be back soon.");
      return;
    }
    if (!user) {
      setShowLoginModal(true);
    } else if (onBook) {
      onBook();
    }
  };

  // Popup press animation — a short scale-up pulse on tap/click so the card
  // feels responsive on both touch and mouse.
  const [popping, setPopping] = useState(false);
  const handleCardPress = () => {
    if (popping) return;
    setPopping(true);
    window.setTimeout(() => setPopping(false), 180);
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
      onClick={handleCardPress}
      onPointerDown={handleCardPress}
      className={cn(
        "group relative bg-gradient-to-b from-white via-white to-slate-50/70 rounded-2xl border border-slate-200/90 overflow-hidden shadow-[0_2px_8px_-2px_rgba(15,23,42,0.06),0_10px_24px_-6px_rgba(15,23,42,0.06)] hover:shadow-[0_20px_40px_-10px_rgba(37,99,235,0.16)] transition-all duration-500 hover:-translate-y-1.5 flex flex-col h-full",
        isPaused && "opacity-70 hover:translate-y-0",
        isFeatured && "ring-2 ring-primary/40 border-primary/30",
        popping && "scale-[1.03] -translate-y-1 shadow-2xl duration-150 z-10"
      )}
      style={{ transformOrigin: "center center" }}
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
              if (!user) {
                setShowLoginModal(true);
                toast({ title: "Sign in to save spots", description: "Your saved spots travel with your account." });
                return;
              }
              const result = toggleFavorite(user.id, {
                id: id ?? "",
                name,
                host,
                pricePerHour,
              });
              setSaved(result === "saved");
              toast({ title: result === "saved" ? "Spot saved" : "Spot removed" });
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
        {/* Source label + status badge header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          {isNetworkStation ? (
            <span className="px-2.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-600 dark:text-cyan-400 border border-cyan-500/20 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Zap className="w-3 h-3 text-cyan-500" /> Network Station
            </span>
          ) : (
            <span className="px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20 text-[11px] font-bold uppercase tracking-wider flex items-center gap-1">
              <Home className="w-3 h-3 text-primary" /> ChargePush Host
            </span>
          )}

          {/* 4-tier status indicator */}
          {isOpen === false ? (
            <span className="px-2 py-0.5 rounded-full bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 text-[11px] font-bold flex items-center gap-1">
              UNAVAILABLE
            </span>
          ) : isPaused ? (
            <span className="px-2 py-0.5 rounded-full bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 text-[11px] font-bold flex items-center gap-1">
              PAUSED
            </span>
          ) : availability?.isOccupied || liveStatus?.available === false ? (
            <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 text-[11px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-ping" /> OCCUPIED
            </span>
          ) : (
            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[11px] font-bold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> READY
            </span>
          )}
        </div>

        {amenities && amenities.length > 0 && (
          <div className="mb-3">
            <FacilitiesChips amenities={amenities.slice(0, 4)} />
          </div>
        )}
        <h3 className="font-display font-semibold text-lg text-card-foreground group-hover:text-primary transition-colors leading-tight mb-3">
          {name}
        </h3>

        {/* Host trust + price emphasis in sunken slate panel */}
        <div className="mb-4 bg-slate-100/70 p-3.5 rounded-xl border border-slate-200/70 shadow-inner-xs">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1.5">
            {hostId ? (
              <a
                href={`/host/${encodeURIComponent(hostId)}`}
                onClick={(e) => e.stopPropagation()}
                className="font-medium text-foreground/80 hover:text-primary transition-colors underline-offset-2 hover:underline"
              >
                {hostFirstName}
              </a>
            ) : (
              <span className="font-medium text-foreground/80">{hostFirstName}</span>
            )}
            {isVerified && (
              <BadgeCheck className="w-3.5 h-3.5 text-ev-green shrink-0" aria-label="Verified host" />
            )}
          </div>
          <div className="flex items-baseline gap-1">
            {isNetworkStation && (!pricePerHour || pricePerHour === 0) ? (
              <>
                <span className="text-lg font-black text-cyan-600 dark:text-cyan-400 tracking-tight">
                  Pay at Station
                </span>
                <span className="ml-auto text-[10px] uppercase font-bold tracking-wider text-cyan-700 dark:text-cyan-300 bg-cyan-50 dark:bg-cyan-950/50 px-2 py-0.5 rounded-md border border-cyan-200 dark:border-cyan-800">
                  Network Rates
                </span>
              </>
            ) : !pricePerHour || pricePerHour === 0 ? (
              <>
                <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tracking-tight">
                  Free Charging
                </span>
                <span className="ml-auto text-[10px] uppercase font-bold tracking-wider text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-md border border-emerald-200 dark:border-emerald-800">
                  No Charge
                </span>
              </>
            ) : (
              <>
                <span className="text-2xl font-black text-foreground tracking-tight">
                  ₹{pricePerHour}
                </span>
                <span className="text-xs font-semibold text-muted-foreground">/hr</span>
                <span className="ml-auto text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-background px-2 py-0.5 rounded-md border border-border">
                  {isNetworkStation ? "Network Rates" : "Pay at spot"}
                </span>
              </>
            )}
          </div>
          {showCostPerKm && (() => {
            const perKm = pricePerKmRs(pricePerHour);
            const session = sessionCostRs(pricePerHour);
            if (perKm === null) return null;
            return (
              <p className="text-[11px] font-semibold text-ev-green mt-1">
                ₹{perKm.toFixed(2)}{t("spot.perKm")} · ₹{session.toFixed(2)}/10 {t("spot.minutes")}
              </p>
            );
          })()}
        </div>

        <div className="grid grid-cols-2 gap-y-3 gap-x-2 text-xs font-medium text-muted-foreground mb-5 mt-auto bg-background/60 p-2.5 rounded-xl border border-border/50">
          {distance && (
            <span className="flex items-center gap-1.5" title="Distance">
              <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
              <span className="truncate font-semibold text-foreground">{distance}</span>
            </span>
          )}

          {displayRating.count > 0 ? (
            <span className="flex items-center gap-1.5" title="Rating">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
              <span>
                {displayRating.avg.toFixed(1)} <span className="text-xs">({displayRating.count})</span>
              </span>
            </span>
          ) : rating && rating > 0 ? (
            <span className="flex items-center gap-1.5" title="Rating">
              <Star className="w-4 h-4 text-yellow-500 fill-yellow-500 shrink-0" />
              <span>
                {rating.toFixed(1)} <span className="text-xs">({reviews}+)</span>
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
            <span className="truncate">
              {availableHours || "24/7"}
              {isOpen !== undefined && (
                <span
                  className={cn(
                    "ml-1.5 inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[11px] font-semibold",
                    isOpen ? "bg-ev-green/10 text-ev-green" : "bg-destructive/10 text-destructive"
                  )}
                >
                  <span className={cn("w-1.5 h-1.5 rounded-full", isOpen ? "bg-ev-green" : "bg-destructive")} />
                  {isOpen ? "Open" : "Closed"}
                </span>
              )}
            </span>
          </span>
        </div>

        <div className="flex gap-2 mt-auto">
          {isNetworkStation && (googleMapsUrl || googleMapsLink) ? (
            <a
              href={googleMapsUrl || googleMapsLink}
              target="_blank"
              rel="noopener noreferrer"
              onClick={(e) => e.stopPropagation()}
              className="flex-1 inline-flex items-center justify-center gap-2 rounded-xl font-bold text-xs py-2.5 px-3 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md hover:shadow-lg transition-all hover:-translate-y-0.5"
            >
              <Navigation className="w-3.5 h-3.5 fill-current" /> Navigate on Maps
            </a>
          ) : (
            <Button
              onClick={handleBookNow}
              disabled={isOpen === false}
              aria-disabled={isOpen === false}
              className={cn(
                "flex-1 rounded-xl font-semibold shadow-md gradient-primary text-white border-0 hover:opacity-90 hover:-translate-y-0.5 transition-all",
                isOpen === false && "opacity-60 cursor-not-allowed hover:translate-y-0"
              )}
            >
              {isOpen === false ? "Currently Closed" : isPaused ? "Temporarily Paused" : "Book / Request"}
            </Button>
          )}

          {isNetworkStation && !(googleMapsUrl || googleMapsLink) && (
            <Button
              onClick={handleBookNow}
              disabled={isOpen === false}
              className="flex-1 rounded-xl font-semibold shadow-md bg-gradient-to-r from-cyan-600 to-blue-600 text-white border-0 hover:opacity-90"
            >
              Station Details
            </Button>
          )}

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
