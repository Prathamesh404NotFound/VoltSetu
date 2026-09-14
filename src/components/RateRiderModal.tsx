/* VoltSetu two-way ratings (Round 13) — hosts rate riders (punctuality +
 * courtesy) after a completed booking. Submitted via riderRatingService,
 * which verifies the booking actually belongs to the rider before writing. */
import { useState } from "react";
import { Star, X, MessageSquare } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { submitRiderRating } from "@/lib/riderRatingService";
import { toast } from "sonner";

interface RateRiderModalProps {
  isOpen: boolean;
  onClose: () => void;
  booking: {
    id: string;
    spotId?: string;
    spotName?: string;
    hostId?: string;
    hostName?: string;
    userName?: string;
    userId?: string;
  };
  hostUid: string;
  riderUid: string;
  riderName?: string;
}

function StarRow({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div>
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex gap-1 mt-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => onChange(n)}
            aria-label={`${label} ${n} star${n > 1 ? "s" : ""}`}
            className="p-0.5 transition-transform hover:scale-110"
          >
            <Star
              className={`w-6 h-6 ${n <= value ? "text-amber-400 fill-amber-400" : "text-muted-foreground/40"}`}
            />
          </button>
        ))}
      </div>
    </div>
  );
}

export default function RateRiderModal({ isOpen, onClose, booking, hostUid, riderUid, riderName }: RateRiderModalProps) {
  const [punctuality, setPunctuality] = useState(5);
  const [courtesy, setCourtesy] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit() {
    if (!booking.id || !riderUid) {
      toast.error("Missing booking details.");
      return;
    }
    setSubmitting(true);
    try {
      const res = await submitRiderRating({
        riderUid,
        hostUid,
        hostName: booking.hostName || "ChargePush Host",
        spotId: booking.spotId || "",
        spotName: booking.spotName || "ChargePush Spot",
        bookingId: booking.id,
        punctuality,
        courtesy,
        comment: comment.trim() || undefined,
      });
      if (!res.ok) {
        toast.error(res.message);
        return;
      }
      toast.success(res.message);
      onClose();
    } catch {
      toast.error("Could not submit the rating. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Rate this rider
            <Button variant="ghost" size="icon" onClick={onClose} className="h-6 w-6">
              <X className="w-4 h-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Your feedback keeps the ChargePush community trustworthy. {riderName ? `Feedback about ${riderName}:` : ""}
        </p>
        <div className="space-y-4 py-2">
          <StarRow value={punctuality} onChange={setPunctuality} label="Punctuality — arrived on time?" />
          <StarRow value={courtesy} onChange={setCourtesy} label="Courtesy — respectful and easy to work with?" />
          <div>
            <Label htmlFor="rider-comment" className="text-sm font-medium">Comment (optional)</Label>
            <div className="relative mt-1">
              <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Textarea
                id="rider-comment"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                placeholder="e.g. Arrived 5 minutes early, very polite."
                maxLength={280}
                className="pl-9"
              />
            </div>
          </div>
        </div>
        <Button onClick={handleSubmit} disabled={submitting} className="w-full">
          {submitting ? "Submitting…" : `Submit rating (${((punctuality + courtesy) / 2).toFixed(1)} avg)`}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
