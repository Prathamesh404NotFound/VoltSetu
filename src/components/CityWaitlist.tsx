/* VoltSetu city launch waitlist (Round 31).
 *
 * For cities not yet live, riders/hosts sign up to be notified.
 * RTDB layout: cityWaitlist/{slug}/{pushId} = { name, email?, phone?, role, createdAt }.
 */
import { useState } from "react";
import { BellRing, Loader2, Sparkles } from "lucide-react";
import { push, ref, serverTimestamp } from "firebase/database";
import { database } from "@/lib/firebase-services";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";

interface CityWaitlistProps {
  slug: string;
  cityName: string;
  className?: string;
  accent?: boolean;
}

export default function CityWaitlist({ slug, cityName, className = "", accent = true }: CityWaitlistProps) {
  const [name, setName] = useState("");
  const [contact, setContact] = useState("");
  const [role, setRole] = useState<"rider" | "host">("rider");
  const [submitting, setSubmitting] = useState(false);
  const [joined, setJoined] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting || joined) return;
    const cleanName = (name || "").trim();
    const cleanContact = (contact || "").trim();
    if (!cleanName) {
      toast.error("Please tell us your name.");
      return;
    }
    setSubmitting(true);
    try {
      await push(ref(database, `cityWaitlist/${encodeURIComponent(slug)}`), {
        name: cleanName,
        ...(cleanContact ? { contact: cleanContact } : {}),
        role,
        createdAt: serverTimestamp(),
      });
      setJoined(true);
      toast.success(`You're on the ${cityName} launch list! We'll notify you first.`);
    } catch (error) {
      console.error("Waitlist write failed:", error);
      toast.error("Could not join the waitlist — please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (joined) {
    return (
      <Card className={`rounded-2xl border-ev-green/40 bg-ev-green/10 ${className}`}>
        <CardContent className="p-6 text-center">
          <Sparkles className="w-8 h-8 text-ev-green mx-auto mb-2" />
          <p className="font-semibold text-foreground">You're on the list for {cityName}!</p>
          <p className="text-sm text-muted-foreground mt-1">
            We'll reach out to {role === "host" ? "launch hosts" : "early riders"} first.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`rounded-2xl border border-border ${accent ? "bg-card" : "bg-muted/40"} ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <BellRing className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-lg text-foreground">
            Notify me when ChargePush launches in {cityName}
          </h3>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="vs-wl-name" className="text-xs">Name *</Label>
              <Input
                id="vs-wl-name"
                placeholder="Your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={60}
                className="mt-1"
              />
            </div>
            <div>
              <Label htmlFor="vs-wl-contact" className="text-xs">Email or phone</Label>
              <Input
                id="vs-wl-contact"
                placeholder="you@example.com or 10-digit mobile"
                type="text"
                inputMode="text"
                value={contact}
                onChange={(e) => setContact(e.target.value)}
                maxLength={40}
                className="mt-1"
              />
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">I am a:</span>
            {(["rider", "host"] as const).map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setRole(r)}
                className={`rounded-full px-3.5 py-1 text-xs font-semibold transition-colors ${
                  role === r
                    ? "bg-primary text-primary-foreground shadow-sm"
                    : "bg-muted text-muted-foreground hover:text-foreground"
                }`}
              >
                {r === "rider" ? "EV rider" : "Future host"}
              </button>
            ))}
          </div>
          <Button
            type="submit"
            className="w-full sm:w-auto gradient-green text-white font-semibold"
            disabled={submitting}
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Join the launch list
          </Button>
          <p className="text-[11px] text-muted-foreground">
            No spam — we only notify you about ChargePush's arrival in {cityName}.
          </p>
        </form>
      </CardContent>
    </Card>
  );
}
