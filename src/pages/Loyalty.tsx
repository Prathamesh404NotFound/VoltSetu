/* ChargePush Rewards page.
 *
 * Shows points, level, badges and streak. Pure read-side derivation — no
 * loyalty database, so nothing can be corrupted or abused.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Zap, Leaf, Flame, Star, Trophy, Loader2, Award, Share2 } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isDark } from "@/lib/theme";
import { Badge } from "@/components/ui/badge";
import { getLoyaltyProfile, BADGES, type LoyaltyProfile } from "@/lib/loyaltyService";
import { useAuth } from "@/components/Auth/AuthProvider";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import SEO from "@/components/SEO";

const BADGE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  zap: Zap,
  leaf: Leaf,
  fire: Flame,
  star: Star,
  trophy: Trophy,
};

async function shareImpact(co2Kg: number, level: number) {
  const text = `I've saved ${co2Kg} kg of CO₂ charging my EV on ChargePush — find charging access near you at https://chargepush.com #ChargePush #KeepMoving ⚡`;
  if (navigator.share) {
    try {
      await navigator.share({ title: "My ChargePush Impact", text });
      return;
    } catch {
      /* cancelled / unsupported */
    }
  }
  try {
    await navigator.clipboard.writeText(text);
    toast.success("Impact message copied — paste it anywhere!");
  } catch {
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank", "noopener");
  }
}

export default function Loyalty() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<LoyaltyProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    getLoyaltyProfile(user.id)
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [user]);

  return (
    <div className="container mx-auto px-4 py-8">
      <SEO
        title="ChargePush Rewards — Earn Points & Level Up"
        description="Track your ChargePush rewards, badges, and charging streak."
        noindex
      />
      <div className="mb-8 flex items-end justify-between">
        <div>
          <h1 className="font-display font-bold text-3xl">ChargePush Rewards</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Earn points for every session. Charge often, save CO₂, collect badges.
          </p>
        </div>
        {profile && (
          <Badge className="gradient-primary text-white px-3 py-1 text-sm rounded-full">
            Level {profile.level} Rider
          </Badge>
        )}
      </div>

      {loading || !profile ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <div className="space-y-6">
          {/* Points + streak row */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="rounded-2xl">
              <CardContent className="p-5 flex flex-col gap-1">
                <Zap className="w-5 h-5 text-primary mb-1" />
                <p className="text-3xl font-bold">{profile.points}</p>
                <p className="text-xs text-muted-foreground">Loyalty points</p>
                <p className="text-[10px] text-muted-foreground">10/session · +5 for on-time ratings</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-5 flex flex-col gap-1">
                <Award className="w-5 h-5 text-ev-green mb-1" />
                <p className="text-3xl font-bold">{profile.badges.length}</p>
                <p className="text-xs text-muted-foreground">Badges earned</p>
                <p className="text-[10px] text-muted-foreground">of {Object.keys(BADGES).length} available</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-5 flex flex-col gap-1">
                <Leaf className={`w-5 h-5 mb-1 ${isDark() ? "text-[hsl(var(--ev-green))]" : "text-green-600"}`} />
                <p className="text-3xl font-bold">{profile.co2Kg} kg</p>
                <p className="text-xs text-muted-foreground">CO₂ saved vs petrol</p>
                <p className="text-[10px] text-muted-foreground">~4 kg per completed session</p>
              </CardContent>
            </Card>
            <Card className="rounded-2xl">
              <CardContent className="p-5 flex flex-col gap-1">
                <Flame className="w-5 h-5 text-orange-500 mb-1" />
                <p className="text-3xl font-bold">{profile.streakWeeks}</p>
                <p className="text-xs text-muted-foreground">Week streak</p>
                <p className="text-[10px] text-muted-foreground">Consecutive weeks with a session</p>
              </CardContent>
            </Card>
          </div>

          {/* Badge grid */}
          <Card className="rounded-2xl">
            <CardHeader className="bg-primary/5">
              <CardTitle className="text-lg">Badge Collection</CardTitle>
            </CardHeader>
            <CardContent className="p-4">
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                {Object.values(BADGES).map((badge) => {
                  const earned = profile.badges.some((b) => b.id === badge.id);
                  const Icon = BADGE_ICONS[badge.icon];
                  return (
                    <div
                      key={badge.id}
                      className={`relative flex flex-col items-center text-center p-4 rounded-xl border transition-all duration-300 ${
                        earned
                          ? (isDark() ? "border-[hsl(var(--ev-green))]/50 bg-[hsl(var(--ev-green))]/10 shadow-sm hover:-translate-y-0.5" : "border-ev-green bg-ev-green/5 shadow-sm hover:-translate-y-0.5")
                          : "border-border bg-muted/30 opacity-50 grayscale"
                      }`}
                    >
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 ${earned ? "gradient-green" : "bg-muted"}`}>
                        <Icon className={`w-5 h-5 ${earned ? "text-white" : "text-muted-foreground"}`} />
                      </div>
                      <p className="text-xs font-semibold">{badge.label}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{badge.description}</p>
                      {!earned && <span className="absolute top-2 right-2 text-[9px] font-bold text-muted-foreground">LOCKED</span>}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Round 20: shareable CO2 impact card */}
          {profile.co2Kg > 0 && (
            <Card className="rounded-2xl overflow-hidden">
              <CardContent className="p-5 flex flex-col items-center text-center gap-2">
                <div className="w-12 h-12 rounded-full gradient-green flex items-center justify-center">
                  <Leaf className="w-6 h-6 text-white" />
                </div>
                <h3 className="font-display font-bold text-lg">Your green impact</h3>
                <p className="text-sm text-muted-foreground max-w-sm">
                  You've saved <span className={`font-bold ${isDark() ? "text-[hsl(var(--ev-green))]" : "text-green-600"}`}>{profile.co2Kg} kg of CO₂</span> versus a petrol scooter — that's {profile.co2Kg >= 50 ? "a whole tree's worth of cleaning" : "a real dent in pollution"}.
                </p>
                <Button variant="outline" size="sm" className="gap-1.5 mt-1" onClick={() => shareImpact(profile.co2Kg, profile.level)}>
                  <Share2 className="w-3.5 h-3.5" /> Share my impact
                </Button>
              </CardContent>
            </Card>
          )}
          <p className="text-center text-xs text-muted-foreground">
            Points and badges are calculated automatically from your completed sessions and host ratings.
            Charge more to level up — every 100 points = 1 level.
          </p>
        </div>
      )}
    </div>
  );
}
