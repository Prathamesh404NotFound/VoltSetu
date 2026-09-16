/**
 * Roadside Rescue — emergency stranded-rider mode.
 *
 * Full-bleed urgent UI: auto geolocation → battery-level range filter →
 * nearest open spots ranked by haversine → MapLibre GL rescue map →
 * one-tap "Get Emergency Charge" booking → direct host call/WhatsApp.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "sonner";
import { ChargePushMap } from "@/components/map/ChargePushMap";
import {
  BatteryWarning,
  Battery,
  MapPin,
  Phone,
  MessageCircle,
  Zap,
  Loader2,
  ShieldCheck,
  Clock,
  X,
  Navigation,
  AlertTriangle,
  LifeBuoy,
  PhoneCall,
} from "lucide-react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { getAllChargingSpots } from "@/lib/hostRegistration";
import { getAllNetworkStations, mergeNetworkStations } from "@/lib/networkStationsService";
import {
  resolveRiderPosition,
  rankSpotsByDistance,
  RESCUE_WINDOW_MINUTES,
  type RescueSpot,
} from "@/lib/rescueService";
import { getHostSettings, isHostPaused } from "@/lib/hostSettingsService";
import { getActiveCities, type CityInfo } from "@/lib/cities";
import { submitEmergencyBooking } from "@/lib/bookingService";
import type { ChargingSpot } from "@/types";

/** Approximate range (km) a two-wheeler can travel per 10% battery left. */
const KM_PER_10_PERCENT = 8;

const BATTERY_LEVELS = [5, 10, 20, 30, 40] as const;

/**
 * Robust countdown hook using persistent target timestamp.
 * Prevents re-renders from glitching or resetting the 15:00 countdown.
 */
function useCountdown(initialSeconds: number) {
  const [endTime] = useState(() => Date.now() + initialSeconds * 1000);
  const [left, setLeft] = useState(initialSeconds);

  useEffect(() => {
    const timer = setInterval(() => {
      const remaining = Math.max(0, Math.ceil((endTime - Date.now()) / 1000));
      setLeft(remaining);
      if (remaining <= 0) clearInterval(timer);
    }, 1000);
    return () => clearInterval(timer);
  }, [endTime]);

  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

export default function EmergencyRescue() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [stage, setStage] = useState<"locating" | "ready" | "booking">("locating");
  const [source, setSource] = useState<"gps" | "city">("gps");
  const [error, setError] = useState<string | null>(null);
  const [allSpots, setAllSpots] = useState<RescueSpot[]>([]);
  const [battery, setBattery] = useState<number | null>(null);
  const [city, setCity] = useState<CityInfo | null>(null);
  const [manualCity, setManualCity] = useState(false);
  const [bookingSpot, setBookingSpot] = useState<RescueSpot | null>(null);
  const [done, setDone] = useState<RescueSpot | null>(null);
  const display = useCountdown(RESCUE_WINDOW_MINUTES * 60);

  useEffect(() => {
    if (loading) return;
    let cancelled = false;
    (async () => {
      try {
        const pos = await resolveRiderPosition();
        if (cancelled) return;
        setSource(pos.source);
        if (pos.error) setError(pos.error);
        if (pos.source === "city") {
          setManualCity(true);
          const found = getActiveCities().find(
            (c) => Math.abs(c.lat - pos.lat) < 0.01 && Math.abs(c.lng - pos.lng) < 0.01
          );
          if (found) setCity(found);
        }
        const all = await getAllChargingSpots();
        const net = await getAllNetworkStations();
        if (cancelled) return;
        const merged = mergeNetworkStations(all, net);
        const hostIds = Array.from(new Set(merged.map((s: any) => s.hostId).filter(Boolean)));
        const settings = await Promise.all(hostIds.map(getHostSettings));
        const settingsByHost = Object.fromEntries(hostIds.map((h, i) => [h, settings[i]]));
        const filtered = merged.filter(
          (s: any) => !isHostPaused(settingsByHost[s.hostId ?? ""] ?? null)
        );
        const ranked = rankSpotsByDistance(filtered, pos.lat, pos.lng);
        setAllSpots(ranked);
        setStage("ready");
      } catch (err) {
        if (cancelled) return;
        setError(err instanceof Error ? err.message : "Rescue finder failed.");
        setStage("ready");
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [loading]);

  const rangeKm = battery ? (battery / 10) * KM_PER_10_PERCENT : null;

  const nearest = useMemo(() => {
    const list = rangeKm
      ? allSpots.filter((s) => Number.isFinite(s.distanceKm) && s.distanceKm <= rangeKm)
      : allSpots;
    return list.slice(0, 3);
  }, [allSpots, rangeKm]);

  const mapSpots = useMemo(() => nearest, [nearest]);

  const handleRescue = async (rescue: RescueSpot) => {
    if (!user) {
      toast.error("Sign in first — we need to know who to rescue.");
      navigate("/?signin=rescue");
      return;
    }
    setBookingSpot(rescue);
    try {
      await submitEmergencyBooking(rescue.spot as ChargingSpot);
      setDone(rescue);
      toast.success(`Rescue request sent to ${rescue.spot.hostName || "your host"}!`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Rescue booking failed — please call the host directly.");
    } finally {
      setBookingSpot(null);
    }
  };

  if (loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#0a0a0a] text-neutral-100">
        <Loader2 className="h-8 w-8 animate-spin text-[#DC2626]" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0a0a0a] text-neutral-100">
      <div className="relative min-h-full">
        {/* Header */}
          <header className="sticky top-0 z-10 flex items-center justify-between border-b border-[#991B1B]/60 bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur">
            <div className="flex items-center gap-2">
              <BatteryWarning className="h-6 w-6 text-[#DC2626]" />
              <span className="font-display text-lg font-bold tracking-tight">CHARGEPUSH RESCUE</span>
              <span className="animate-pulse rounded-full bg-[#DC2626]/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-[#FECACA]">
              SOS
            </span>
          </div>
          <button
            onClick={() => navigate(-1)}
            className="rounded-full border border-neutral-800 p-2 text-neutral-400 transition-colors hover:bg-neutral-900 hover:text-neutral-100"
            aria-label="Exit rescue mode"
          >
            <X className="h-5 w-5" />
          </button>
        </header>

        <div className="mx-auto max-w-xl px-4 pb-24 pt-6">
          {/* Urgency panel */}
          <div className="mb-5 rounded-2xl border border-red-950/60 bg-gradient-to-b from-red-950/40 to-transparent p-5">
            <div className="mb-2 flex items-center gap-2 text-[#FECACA]">
              <AlertTriangle className="h-4 w-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">ChargePush Rescue</span>
            </div>
            <h1 className="font-display text-3xl font-black tracking-tight text-white mb-1">
              Battery almost empty?
            </h1>
            <p className="text-sm font-medium text-neutral-300 mb-4">
              Find a nearby charging option when you need one most.
            </p>
            <div className="flex items-baseline gap-3 pt-2 border-t border-red-950/60">
              <span className="font-display text-3xl font-bold tabular-nums text-[#DC2626]">{display}</span>
              <span className="text-xs text-neutral-400">rescue window remaining</span>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Surfacing verified charging spots open right now. Select a spot and tap <strong className="text-neutral-200">Get Emergency Charge</strong> — your host receives a priority booking notification with your message.
            </p>
            <a
              href="tel:112"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-[#991B1B]/60 bg-[#991B1B]/30 px-4 py-2.5 text-sm font-semibold text-[#FECACA] transition-colors hover:bg-[#991B1B]/60"
            >
              <PhoneCall className="h-4 w-4" /> In grave danger? Call 112 (National Emergency)
            </a>
          </div>

          {/* Location status + manual city picker */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
            <MapPin className="h-4 w-4 text-[#DC2626]" />
            {stage === "locating" ? (
              <span>Locating you…</span>
            ) : (
              <span>
                {source === "gps" ? "Using your location" : "Location unavailable — pick your city"}
                {error ? ` (${error})` : ""}
              </span>
            )}
            {stage === "locating" && <Loader2 className="h-4 w-4 animate-spin text-red-400" />}
          </div>

          {manualCity && stage === "ready" && (
            <div className="mb-4 flex flex-wrap gap-2">
              {getActiveCities().map((c) => (
                <button
                  key={c.slug}
                  onClick={() => setCity(c)}
                  className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                    city?.slug === c.slug
                      ? "border-[#DC2626] bg-[#DC2626]/20 text-[#FECACA]"
                      : "border-[#1E293B] text-[#94A3B8] hover:border-[#475569] hover:text-[#CBD5E1]"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Battery level selector */}
          {stage === "ready" && (
            <div className="mb-5 rounded-2xl border border-[#1E293B] bg-[#0F172A]/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-[#E2E8F0]">
                <Battery className="h-4 w-4 text-[#DC2626]" />
                How much battery is left?
                <span className="text-xs font-normal text-neutral-500">(we'll only show spots within reach)</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {BATTERY_LEVELS.map((pct) => {
                  const km = Math.round((pct / 10) * KM_PER_10_PERCENT);
                  return (
                    <button
                      key={pct}
                      onClick={() => setBattery(pct)}
                      className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold transition-all ${
                        battery === pct
                          ? "border-[#DC2626] bg-[#DC2626]/20 text-[#FECACA]"
                          : "border-[#1E293B] text-[#CBD5E1] hover:border-[#475569]"
                      }`}
                    >
                      <span>{pct}%</span>
                      <span className="text-xs font-normal text-neutral-500">≈ {km} km</span>
                    </button>
                  );
                })}
                {battery !== null && (
                  <button
                    onClick={() => setBattery(null)}
                    className="flex items-center gap-1 rounded-xl border border-neutral-800 px-3 py-2 text-xs text-neutral-500 hover:text-neutral-300"
                  >
                    <X className="h-3 w-3" /> clear
                  </button>
                )}
              </div>
            </div>
          )}

          {/* MapLibre GL Rescue Map */}
          {stage === "ready" && mapSpots.length >= 1 && (
            <div className="mb-5 overflow-hidden rounded-2xl border border-[#1E293B] shadow-lg">
              <ChargePushMap
                spots={mapSpots.map((r) => r.spot)}
                height="220px"
                emergencyMode={true}
              />
            </div>
          )}

          {/* Nearest cards */}
          {nearest.map((rescue, idx) => (
            <div
              key={rescue.spot.id}
              className={`mb-4 overflow-hidden rounded-2xl border bg-neutral-950/60 ${
                idx === 0 ? "border-red-700/60" : "border-neutral-800"
              }`}
            >
              {idx === 0 && (
                <div className="flex items-center gap-1.5 bg-red-600/15 px-4 py-1.5 text-[11px] font-bold uppercase tracking-wider text-red-400">
                  <ShieldCheck className="h-3.5 w-3.5" /> Nearest open spot — priority pick
                </div>
              )}
              <div className="p-4">
                <div className="mb-1 flex items-start justify-between gap-2">
                  <h3 className="font-display text-lg font-semibold leading-tight">
                    {rescue.spot.name || "Charging spot"}
                  </h3>
                  <span className="whitespace-nowrap rounded-full bg-[#DC2626]/15 px-2 py-0.5 text-xs font-semibold text-[#FECACA]">
                    {rescue.distanceLabel}
                  </span>
                </div>
                <p className="mb-3 text-sm text-[#94A3B8]">
                  {rescue.spot.hostName ? `${rescue.spot.hostName} · ` : ""}
                  {rescue.spot.address || rescue.spot.city || "India"}
                </p>
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-[#CBD5E1]">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-[#D97706]" />
                    ₹{rescue.spot.pricePerHour ?? "—"}{rescue.spot.pricePerHour ? "/hr" : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-[#64748B]" />
                    {rescue.spot.openHours || "24/7"}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-[#16A34A]/10 px-2 py-0.5 text-xs font-semibold text-[#16A34A]">
                    Open now
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {done?.spot.id === rescue.spot.id ? (
                    <div className="flex-1 rounded-xl bg-[#16A34A]/15 px-4 py-3 text-center text-sm font-semibold text-[#16A34A]">
                      ✓ Rescue request sent — host will confirm
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRescue(rescue)}
                      disabled={bookingSpot !== null}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#DC2626] px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-[#991B1B]/40 transition-all hover:bg-[#DC2626] active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {bookingSpot?.spot.id === rescue.spot.id ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Zap className="h-5 w-5" />
                      )}
                      Get Emergency Charge — {rescue.spot.name || "Book Now"}
                    </button>
                  )}
                  {rescue.spot.hostPhone && (
                    <a
                      href={`tel:${rescue.spot.hostPhone}`}
                      className="rounded-xl border border-[#1E293B] p-3.5 text-[#E2E8F0] transition-colors hover:border-[#991B1B]/60 hover:text-[#FECACA]"
                      aria-label={`Call ${rescue.spot.hostName || "host"}`}
                    >
                      <Phone className="h-5 w-5" />
                    </a>
                  )}
                  {rescue.spot.hostPhone && (
                    <a
                      href={`https://wa.me/${rescue.spot.hostPhone.replace(/[^0-9]/g, "")}?text=${encodeURIComponent(
                        "EMERGENCY — stranded rider on ChargePush, coming to your spot now!"
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-xl border border-[#1E293B] p-3.5 text-[#E2E8F0] transition-colors hover:border-[#16A34A] hover:text-[#16A34A]"
                      aria-label="Message host on WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Safety tips */}
          {stage === "ready" && (
            <div className="mb-4 rounded-2xl border border-[#D97706]/30 bg-[#D97706]/10 p-4">
              <div className="mb-2 flex items-center gap-2 text-[#D97706]">
                <LifeBuoy className="h-4 w-4" />
                <span className="text-xs font-bold uppercase tracking-wider">While you wait — safety first</span>
              </div>
              <ul className="list-disc space-y-1 pl-4 text-sm text-neutral-400">
                <li>Push your scooter instead of riding it on fumes — protect the battery.</li>
                <li>Never charge in rain or standing water; ask your host to check the outlet.</li>
                <li>Use your helmet and park facing the street so help can reach you.</li>
                <li>Share your live location with a friend or family member.</li>
              </ul>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
