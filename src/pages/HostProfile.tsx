import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  BadgeCheck,
  Star,
  Loader2,
  Zap,
  AlertTriangle,
  Home as HomeIcon,
  Store,
  Briefcase,
  Building2,
  Pencil,
  Flag,
} from "lucide-react";
import { toast } from "sonner";
import { LazyPage } from "@/components/LazyPage";
import SEO from "@/components/SEO";
import { getHostProfile, aggregateHostRating, type HostProfileSpot } from "@/lib/hostProfileService";
import { submitFlag, REASON_OPTIONS } from "@/lib/moderationService";
import SpotCard from "@/components/SpotCard";
import SpotEditor from "@/components/SpotEditor";
import { cn } from "@/lib/utils";
import { useAuth } from "@/components/Auth/AuthProvider";

function spotTypeIcon(spotType?: string) {
  switch ((spotType ?? "").toLowerCase()) {
    case "shop":
    case "café":
    case "cafe":
      return <Store className="h-3.5 w-3.5" />;
    case "office":
      return <Briefcase className="h-3.5 w-3.5" />;
    case "parking garage":
      return <Building2 className="h-3.5 w-3.5" />;
    default:
      return <HomeIcon className="h-3.5 w-3.5" />;
  }
}

function HostProfileInner() {
  const { hostId } = useParams<{ hostId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<Awaited<ReturnType<typeof getHostProfile>> | null>(null);
  const [loading, setLoading] = useState(true);
  const [editingSpot, setEditingSpot] = useState<HostProfileSpot | null>(null);
  const [reportingHost, setReportingHost] = useState(false);

  const isOwner = Boolean(user && user.id === hostId);

  async function handleReportHost(reason: string) {
    if (!user) return;
    const result = await submitFlag({
      targetType: "user",
      targetId: hostId,
      reason,
      reporterId: user.id,
      reporterName: (user as { displayName?: string }).displayName || "ChargePush rider",
    });
    setReportingHost(false);
    toast[result.ok ? "success" : "error"](result.message);
  }

  useEffect(() => {
    let mounted = true;
    if (!hostId) return;
    setLoading(true);
    getHostProfile(hostId)
      .then((p) => mounted && setProfile(p))
      .catch(() => mounted && setProfile(null))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [hostId]);

  const { average: hostAvg, totalReviews } = useMemo(() => {
    if (!profile) return { average: 0, totalReviews: 0 };
    return aggregateHostRating(profile.spots);
  }, [profile]);

  if (loading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-[50vh] flex-col items-center justify-center gap-3 text-center">
        <AlertTriangle className="h-10 w-10 text-muted-foreground" />
        <h2 className="text-lg font-semibold text-foreground">Host not found</h2>
        <p className="text-sm text-muted-foreground">
          This host profile doesn't exist or has been removed.
        </p>
        <button
          onClick={() => navigate("/find-spots")}
          className="mt-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
        >
          Browse charging spots
        </button>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {profile && (
        <SEO
          title={`${profile.displayName} — EV Charging Host${profile.city ? ` in ${profile.city}` : ""} | ChargePush`}
          description={`Browse ${profile.activeSpotCount} verified charging spot${profile.activeSpotCount === 1 ? "" : "s"} by ${profile.displayName}${profile.city ? ` in ${profile.city}` : ""}. See pricing, reviews, and book a session instantly with ChargePush.`}
          canonical={`/host/${hostId}`}
          schema={{
            "@context": "https://schema.org",
            "@type": "Person",
            name: profile.displayName,
            url: `https://volt-setu.vercel.app/host/${hostId}`,
            jobTitle: "EV Charging Spot Host",
            description: `${profile.activeSpotCount} EV charging spot${profile.activeSpotCount === 1 ? "" : "s"} listed${profile.city ? ` in ${profile.city}` : ""}`,
            knowsAbout: ["EV two-wheeler charging", "home charging points"],
          }}
        />
      )}
      {/* Profile header */}
      <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
        <div className="gradient-primary h-24 relative">
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
        </div>
        <div className="relative px-6 pb-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            {profile.photoURL ? (
              <img
                src={profile.photoURL}
                alt={profile.displayName}
                className="h-20 w-20 -mt-10 rounded-full border-4 border-card object-cover shadow-md"
              />
            ) : (
              <div className="flex h-20 w-20 -mt-10 items-center justify-center rounded-full border-4 border-card bg-primary/10 text-2xl font-bold text-primary shadow-md">
                {profile.displayName.charAt(0).toUpperCase()}
              </div>
            )}
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-2xl font-display font-bold text-foreground">
                  {profile.displayName}
                </h1>
                {(profile.isVerified || profile.hostStatus === "approved") && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-ev-green/10 px-2.5 py-0.5 text-xs font-semibold text-ev-green">
                    <BadgeCheck className="h-3.5 w-3.5" /> Verified host
                  </span>
                )}
                {isOwner && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
                    You
                  </span>
                )}
                {user && !isOwner && (
                  <button
                    type="button"
                    onClick={() => setReportingHost((v) => !v)}
                    className="inline-flex items-center gap-1 rounded-full border border-border px-2.5 py-0.5 text-xs font-medium text-muted-foreground transition-colors hover:border-destructive/40 hover:text-destructive"
                    aria-label="Report this host"
                  >
                    <Flag className="h-3 w-3" /> Report host
                  </button>
                )}
              </div>
              {reportingHost && (
                <div className="mt-3 flex flex-wrap gap-1.5 rounded-lg border border-border bg-muted/40 p-2">
                  {REASON_OPTIONS.map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => handleReportHost(r)}
                      className="rounded-md bg-background px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                    >
                      {r}
                    </button>
                  ))}
                  <button
                    type="button"
                    onClick={() => setReportingHost(false)}
                    className="rounded-md px-2.5 py-1 text-[11px] font-medium text-muted-foreground underline-offset-2 hover:underline"
                  >
                    Cancel
                  </button>
                </div>
              )}
              <div className="mt-1.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                {profile.city && (
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="h-3.5 w-3.5" /> {profile.city}, India
                  </span>
                )}
                {profile.joinedAt > 0 && (
                  <span className="inline-flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5" /> Host since{" "}
                    {new Date(profile.joinedAt).toLocaleDateString("en-IN", { month: "short", year: "numeric" })}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5" /> {profile.activeSpotCount} active spot
                  {profile.activeSpotCount === 1 ? "" : "s"}
                </span>
              </div>
            </div>
          </div>

          {/* Reputation row */}
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Spot rating</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {hostAvg > 0 ? hostAvg.toFixed(1) : "—"}
                {totalReviews > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    ({totalReviews} review{totalReviews === 1 ? "" : "s"})
                  </span>
                )}
              </p>
            </div>
            <div className="rounded-xl border border-border bg-muted/40 px-4 py-3">
              <p className="text-xs font-medium text-muted-foreground">Rider rating</p>
              <p className="mt-1 flex items-center gap-1.5 text-lg font-bold text-foreground">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                {profile.riderRating.count > 0
                  ? profile.riderRating.average.toFixed(1)
                  : "—"}
                {profile.riderRating.count > 0 && (
                  <span className="text-xs font-medium text-muted-foreground">
                    ({profile.riderRating.count} booking{profile.riderRating.count === 1 ? "" : "s"})
                  </span>
                )}
              </p>
            </div>
            <div className="col-span-2 rounded-xl border border-border bg-muted/40 px-4 py-3 sm:col-span-1">
              <p className="text-xs font-medium text-muted-foreground">Spot types</p>
              <p className="mt-1 flex flex-wrap gap-1.5 text-sm font-semibold text-foreground">
                {[...new Set(profile.spots.map((s) => s.spotType ?? "Home"))].map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1 rounded-full bg-background px-2.5 py-0.5 text-xs font-medium text-foreground/80"
                  >
                    {spotTypeIcon(t)} {t}
                  </span>
                ))}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Spots */}
      <div className="mt-8">
        <h2 className="mb-4 flex items-center justify-between gap-2 text-xl font-display font-bold text-foreground">
          <span>
            {isOwner ? "Your spots" : `${profile.displayName}'s spots`}
          </span>
        </h2>
        {profile.spots.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border bg-muted/40 px-5 py-8 text-center text-sm text-muted-foreground">
            This host doesn't have any spots listed yet.
          </p>
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {profile.spots.map((spot) => (
              <div key={spot.id} className="relative">
                <SpotCard
                  id={spot.id}
                  name={spot.name}
                  host={profile.displayName}
                  distance={spot.city ? `${spot.city}` : undefined}
                  pricePerHour={spot.pricePerHour}
                  rating={spot.rating}
                  reviews={spot.reviews}
                  isVerified={spot.isVerified}
                  outletType={spot.outletType}
                />
                {isOwner && (
                  <button
                    onClick={() => setEditingSpot(spot)}
                    className="absolute right-3 top-3 z-10 inline-flex items-center gap-1 rounded-full bg-black/60 px-2.5 py-1 text-xs font-medium text-white backdrop-blur-md hover:bg-black/75"
                  >
                    <Pencil className="h-3 w-3" /> Edit
                  </button>
                )}
                {spot.status === "inactive" && (
                  <span className="absolute left-3 top-3 z-10 inline-flex items-center rounded-full bg-destructive/90 px-2.5 py-1 text-xs font-medium text-white">
                    Paused
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <SpotEditor
        spot={editingSpot}
        hostId={user?.id ?? ""}
        onClose={() => setEditingSpot(null)}
        onSaved={() => {
          toast.success("Spot updated — changes are live now.");
          setEditingSpot(null);
          // Refresh the profile so edits show immediately.
          if (hostId) {
            getHostProfile(hostId).then(setProfile);
          }
        }}
      />
    </div>
  );
}

export default function HostProfile() {
  return (
    <LazyPage>
      <HostProfileInner />
    </LazyPage>
  );
}
