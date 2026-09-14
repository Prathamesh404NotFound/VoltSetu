import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Heart, MapPin, Star, Trash2, ExternalLink } from "lucide-react";
import { getFavorites, unsaveSpot } from "@/lib/favoritesService";
import { useAuth } from "@/components/Auth/AuthProvider";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";
import AuthenticatedRoute from "@/components/AuthenticatedRoute";

export default function SavedSpots() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [version, setVersion] = useState(0);

  const favorites = useMemo(() => {
    void version;
    return getFavorites(user?.uid ?? "");
  }, [user, version]);

  const handleRemove = (id: string) => {
    unsaveSpot(user?.uid ?? "", id);
    setVersion((v) => v + 1);
    toast({ title: "Spot removed from saved" });
  };

  return (
    <AuthenticatedRoute>
      <SEO
        title="Saved Charging Spots | ChargePush"
        description="Your saved EV charging spots, ready for quick booking. ChargePush keeps your favorite neighborhood charging points in one place."
      />
      <div className="pt-24 pb-16 min-h-[80vh]">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="font-display font-bold text-3xl md:text-4xl text-foreground tracking-squish mb-2 flex items-center gap-3">
              <Heart className="w-7 h-7 text-primary fill-primary/20" />
              Saved Spots
            </h1>
            <p className="text-muted-foreground max-w-xl">
              Your bookmarked charging spots. They stay here across sessions so your favorite
              neighborhood outlets are one tap away from booking.
            </p>
          </div>

          {favorites.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border bg-muted/40 p-12 text-center">
              <Heart className="w-10 h-10 text-muted-foreground/50 mx-auto mb-4" />
              <h2 className="font-display font-semibold text-xl text-foreground mb-2">No saved spots yet</h2>
              <p className="text-muted-foreground mb-6">
                Tap the heart on any spot card to save it here for quick access.
              </p>
              <Button onClick={() => navigate("/spots")} className="gradient-primary text-white border-0">
                <MapPin className="w-4 h-4" /> Browse charging spots
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {favorites.map((spot) => (
                <div
                  key={spot.id}
                  className="group rounded-2xl border border-border bg-card p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all flex flex-col"
                >
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <h3 className="font-display font-semibold text-lg text-foreground leading-tight">
                      {spot.name}
                    </h3>
                    <button
                      type="button"
                      onClick={() => handleRemove(spot.id)}
                      aria-label={`Remove ${spot.name} from saved`}
                      className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="text-sm text-muted-foreground mb-1">Hosted by {spot.host}</div>
                  <div className="flex items-center gap-2 text-sm mb-4 mt-auto">
                    {spot.pricePerHour ? (
                      <span className="font-bold text-foreground">₹{spot.pricePerHour}/hr</span>
                    ) : null}
                    {spot.city ? <span className="text-muted-foreground">· {spot.city}</span> : null}
                    {spot.lat && spot.lng ? (
                      <a
                        href={`https://www.google.com/maps?q=${spot.lat},${spot.lng}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline ml-auto"
                      >
                        <ExternalLink className="w-3.5 h-3.5" /> Map
                      </a>
                    ) : null}
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => {
                      localStorage.setItem("voltsetu:returnToSaved", "1");
                      navigate("/spots");
                    }}
                    className="w-full rounded-xl"
                  >
                    <Star className="w-4 h-4" /> Find on map
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AuthenticatedRoute>
  );
}
