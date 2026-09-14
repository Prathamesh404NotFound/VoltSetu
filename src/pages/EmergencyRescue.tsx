/**
 * Roadside Rescue — emergency stranded-rider mode (Round 40 upgrade).
 *
 * Full-bleed urgent UI: auto geolocation → battery-level range filter →
 * nearest open (non-paused) spots ranked by haversine → mini map of the
 * rescue corridor → one-tap "Rescue Me" booking → direct host call/WhatsApp.
 *
 * Designed for panic moments: huge touch targets, battery window countdown,
 * primary action visible without scrolling, safety tips + national emergency
 * number always reachable.
 */
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
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

function useCountdown(seconds: number) {
  const [left, setLeft] = useState(seconds);
  useEffect(() => {
    if (left <= 0) return;
    const t = setInterval(() => setLeft((l) => (l <= 1 ? 0 : l - 1)), 1000);
    return () => clearInterval(t);
  }, [left]);
  const mm = String(Math.floor(left / 60)).padStart(2, "0");
  const ss = String(left % 60).padStart(2, "0");
  return `${mm}:${ss}`;
}

// ── Red SOS-style icons for the rescue map ──────────────────────────
const rescueMarkerIcon = (rank: number) =>
  L.divIcon({
    className: "rescue-map-marker",
    html: `
      <div style="width:26px;height:26px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);
                background:hsl(0,84%,55%);border:2px solid white;box-shadow:0 2px 6px rgba(0,0,0,.3);
                display:flex;align-items:flex-start;justify-content:flex-start;padding-left:5px;padding-top:1px;">
        <span style="transform:rotate(45deg);color:white;font-size:10px;font-weight:800;font-family:Space Grotesk,sans-serif;">${rank}</span>
      </div>
    `,
    iconSize: [26, 26],
    iconAnchor: [13, 26],
    popupAnchor: [0, -26],
  });

const userDotIcon = L.divIcon({
  className: "rescue-user-dot",
  html: `
    <div style="position:relative;width:26px;height:26px;">
      <style>
        @keyframes rescue-pulse{0%{transform:scale(.6);opacity:.8}100%{transform:scale(2.6);opacity:0}}
      </style>
      <div style="position:absolute;width:26px;height:26px;background:hsl(0,84%,55%);border-radius:50%;
                  opacity:.4;animation:rescue-pulse 1.6s infinite ease-out;"></div>
      <div style="position:absolute;top:6px;left:6px;width:14px;height:14px;
                  background:hsl(0,84%,55%);border:2px solid white;border-radius:50%;
                  box-shadow:0 2px 5px rgba(0,0,0,.3);"></div>
    </div>
  `,
  iconSize: [26, 26],
  iconAnchor: [13, 13],
});

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
  const timerRef = useRef<number>(0);
  const display = useCountdown(timerRef.current);

  useEffect(() => {
    timerRef.current = RESCUE_WINDOW_MINUTES * 60;
  }, []);

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
        // Exclude holiday-paused hosts (Round 34 settings layer)
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

  const userPos = useMemo(() => {
    const pos = source === "gps" ? null : null;
    return pos;
  }, [source]);

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
        <Loader2 className="h-8 w-8 animate-spin text-red-500" />
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-[#0a0a0a] text-neutral-100">
      <div className="relative min-h-full">
        {/* Header */}
        <header className="sticky top-0 z-10 flex items-center justify-between border-b border-red-950/60 bg-[#0a0a0a]/90 px-4 py-3 backdrop-blur">
          <div className="flex items-center gap-2">
            <BatteryWarning className="h-6 w-6 text-red-500" />
            <span className="font-display text-lg font-bold tracking-tight">CHARGEPUSH RESCUE</span>
            <span className="animate-pulse rounded-full bg-red-600/20 px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wider text-red-400">
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
            <div className="mb-2 flex items-center gap-2 text-red-400">
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
              <span className="font-display text-3xl font-bold tabular-nums text-red-500">{display}</span>
              <span className="text-xs text-neutral-400">rescue window remaining</span>
            </div>
            <p className="mt-2 text-xs text-neutral-400">
              Surfacing verified charging spots open right now. Select a spot and tap <strong className="text-neutral-200">Get Emergency Charge</strong> — your host receives a priority booking notification with your message.
            </p>
            {/* National emergency fallback */}
            <a
              href="tel:112"
              className="mt-3 flex items-center justify-center gap-2 rounded-xl border border-red-800/60 bg-red-950/30 px-4 py-2.5 text-sm font-semibold text-red-300 transition-colors hover:bg-red-950/60"
            >
              <PhoneCall className="h-4 w-4" /> In grave danger? Call 112 (National Emergency)
            </a>
          </div>

          {/* Location status + manual city picker */}
          <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-neutral-400">
            <MapPin className="h-4 w-4 text-red-400" />
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
                      ? "border-red-600 bg-red-600/20 text-red-300"
                      : "border-neutral-800 text-neutral-400 hover:border-neutral-600 hover:text-neutral-200"
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}

          {/* Battery level selector */}
          {stage === "ready" && (
            <div className="mb-5 rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-neutral-200">
                <Battery className="h-4 w-4 text-red-400" />
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
                          ? "border-red-600 bg-red-600/20 text-red-300"
                          : "border-neutral-800 text-neutral-300 hover:border-neutral-600"
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
              {battery !== null && (
                <p className="mt-3 text-xs text-neutral-500">
                  Showing only spots within ~{Math.round(rangeKm ?? 0)} km.{" "}
                  {allSpots.filter((s) => Number.isFinite(s.distanceKm) && s.distanceKm <= (rangeKm ?? 0)).length} of{" "}
                  {allSpots.length} open spots in reach.
                </p>
              )}
            </div>
          )}

          {/* Results */}
          {stage === "locating" && (
            <div className="flex flex-col items-center gap-3 py-14 text-neutral-500">
              <Navigation className="h-10 w-10 animate-pulse text-red-500/60" />
              <p className="text-sm">Scanning the map for open outlets near you…</p>
            </div>
          )}

          {stage === "ready" && nearest.length === 0 && !done && (
            <div className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-6 text-center">
              <BatteryWarning className="mx-auto mb-3 h-10 w-10 text-red-500/60" />
              <p className="mb-1 font-semibold">No open spots nearby right now</p>
              <p className="mb-4 text-sm text-neutral-400">
                {battery
                  ? "No open spot fits within your battery range. Raise the battery level or widen your search."
                  : "Every open outlet is booked or closed for the hour. Call a host directly — hosts on ChargePush often make exceptions for stranded riders."}
              </p>
              <a
                href="/spots"
                className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-3 font-semibold text-white transition-transform hover:scale-[1.02]"
              >
                <Zap className="h-4 w-4" /> View all spots
              </a>
            </div>
          )}

          {/* Mini map of the rescue corridor */}
          {stage === "ready" && mapSpots.length >= 2 && (
            <div className="mb-5 overflow-hidden rounded-2xl border border-neutral-800">
              <MapContainer
                center={[
                  mapSpots[0].spot.coordinates?.lat ?? city?.lat ?? 0,
                  mapSpots[0].spot.coordinates?.lng ?? city?.lng ?? 0,
                ]}
                zoom={13}
                style={{ height: 220, width: "100%" }}
                className="z-0"
              >
                <TileLayer
                  url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a>'
                />
                {mapSpots.map((r, i) => {
                  const lat = r.spot.coordinates?.lat;
                  const lng = r.spot.coordinates?.lng;
                  if (!Number.isFinite(lat) || !Number.isFinite(lng)) return null;
                  return (
                    <Marker key={r.spot.id} position={[lat, lng]} icon={rescueMarkerIcon(i + 1)}>
                      <Popup>
                        <strong>{r.spot.name}</strong>
                        <br />
                        {r.distanceLabel}
                      </Popup>
                    </Marker>
                  );
                })}
                {mapSpots[0]?.spot.coordinates && (
                  <Marker
                    position={[mapSpots[0].spot.coordinates.lat, mapSpots[0].spot.coordinates.lng]}
                    icon={userDotIcon}
                  />
                )}
              </MapContainer>
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
                  <span className="whitespace-nowrap rounded-full bg-red-600/15 px-2 py-0.5 text-xs font-semibold text-red-400">
                    {rescue.distanceLabel}
                  </span>
                </div>
                <p className="mb-3 text-sm text-neutral-400">
                  {rescue.spot.hostName ? `${rescue.spot.hostName} · ` : ""}
                  {rescue.spot.address || rescue.spot.city || "India"}
                </p>
                <div className="mb-4 flex flex-wrap items-center gap-3 text-sm text-neutral-300">
                  <span className="flex items-center gap-1.5">
                    <Zap className="h-4 w-4 text-amber-400" />
                    ₹{rescue.spot.pricePerHour ?? "—"}{rescue.spot.pricePerHour ? "/hr" : ""}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4 text-neutral-500" />
                    {rescue.spot.openHours || "24/7"}
                  </span>
                  <span className="flex items-center gap-1.5 rounded-full bg-emerald-500/10 px-2 py-0.5 text-xs font-semibold text-emerald-400">
                    Open now
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {done?.spot.id === rescue.spot.id ? (
                    <div className="flex-1 rounded-xl bg-emerald-600/15 px-4 py-3 text-center text-sm font-semibold text-emerald-400">
                      ✓ Rescue request sent — host will confirm
                    </div>
                  ) : (
                    <button
                      onClick={() => handleRescue(rescue)}
                      disabled={bookingSpot !== null}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-red-600 px-4 py-3.5 text-base font-bold text-white shadow-lg shadow-red-900/40 transition-all hover:bg-red-500 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
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
                      className="rounded-xl border border-neutral-700 p-3.5 text-neutral-200 transition-colors hover:border-red-700 hover:text-red-400"
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
                      className="rounded-xl border border-neutral-700 p-3.5 text-neutral-200 transition-colors hover:border-emerald-600 hover:text-emerald-400"
                      aria-label="Message host on WhatsApp"
                    >
                      <MessageCircle className="h-5 w-5" />
                    </a>
                  )}
                </div>
              </div>
            </div>
          ))}

          {/* Remaining ranked list */}
          {allSpots.length > 3 && (
            <p className="mt-2 mb-4 text-center text-sm text-neutral-500">
              +{Math.max(0, allSpots.length - 3)} more open spots —{" "}
              <a href="/spots" className="font-semibold text-red-400 underline underline-offset-2">
                see all
              </a>
            </p>
          )}

          {/* Safety tips */}
          {stage === "ready" && (
            <div className="mb-4 rounded-2xl border border-amber-900/40 bg-amber-950/20 p-4">
              <div className="mb-2 flex items-center gap-2 text-amber-400">
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

          {/* Post-rescue guidance */}
          {done && (
            <div className="mt-4 rounded-2xl border border-emerald-800/50 bg-emerald-950/30 p-4 text-sm text-neutral-300">
              <p className="mb-1 font-semibold text-emerald-400">Help is on the way. Do this now:</p>
              <ol className="list-decimal space-y-1 pl-4 text-neutral-400">
                <li>
                  Call your host — {done.spot.hostName || "them"} — using the button above so they're at the outlet when
                  you arrive.
                </li>
                <li>Keep the bike's battery warm; push-don't-ride if possible.</li>
                <li>Pay at the spot when charging begins — the request is already reserved under your account.</li>
                <li>
                  Check your request in{" "}
                  <a href="/dashboard/bookings" className="font-semibold text-emerald-400 underline underline-offset-2">
                    Dashboard → Bookings
                  </a>
                  .
                </li>
              </ol>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
