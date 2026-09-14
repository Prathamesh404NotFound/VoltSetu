import { useEffect, useState } from "react";
import { Lock, MessageSquare, Sparkles, Flag } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/components/Auth/AuthProvider";
import { StarRating } from "@/components/StarRating";
import {
  aggregateRating,
  getSpotReviews,
  submitSpotReview,
} from "@/lib/reviewsService";
import { submitFlag, REASON_OPTIONS } from "@/lib/moderationService";
import type { Review } from "@/types";

interface ReviewsSectionProps {
  spotId: string;
  spotRating?: number;
  hostId?: string;
}

function relativeTime(ts: number | null | undefined): string {
  if (!ts) return "";
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(ts).toLocaleDateString();
}

export function ReviewsSection({ spotId, spotRating = 0, hostId }: ReviewsSectionProps) {
  const { user } = useAuth();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    let mounted = true;
    if (!spotId) return;
    getSpotReviews(spotId)
      .then((list) => mounted && setReviews(list))
      .catch(() => mounted && setReviews([]))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, [spotId]);

  const { rating: avg, count } = aggregateRating(reviews, spotRating);
  const ownsSpot = Boolean(user && hostId === user.id);
  const [flaggingReviewId, setFlaggingReviewId] = useState<string | null>(null);

  async function handleFlagReview(review: Review, reason: string) {
    if (!user) return;
    const result = await submitFlag({
      targetType: "review",
      targetId: `${spotId}:${review.id}`,
      targetOwnerId: hostId ?? "",
      reason,
      reporterId: user.id,
      reporterName: (user as { displayName?: string }).displayName || "ChargePush rider",
    });
    setFlaggingReviewId(null);
    toast[result.ok ? "success" : "error"](result.message);
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    if (!user) return;
    if (!comment.trim()) {
      toast.error("Please write a short review before submitting.");
      return;
    }
    if (comment.trim().length > 500) {
      toast.error("Review text is limited to 500 characters.");
      return;
    }
    setSubmitting(true);
    try {
      const newReview = await submitSpotReview({
        spotId,
        userId: user.id,
        userName: (user as { displayName?: string }).displayName || "ChargePush rider",
        userPhoto: (user as { photoURL?: string }).photoURL || undefined,
        rating,
        comment: comment.trim(),
      });
      setReviews((prev) => [newReview, ...prev]);
      setComment("");
      toast.success("Review posted — thank you for helping other riders!");
    } catch (error) {
      console.error("Review submission failed:", error);
      toast.error(error instanceof Error ? error.message : "Could not submit review. Please try again.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <StarRating rating={avg} size="md" />
        <p className="text-sm font-medium text-foreground">
          {count > 0 ? avg.toFixed(1) : spotRating > 0 ? spotRating.toFixed(1) : "New"}
          {count > 0 && <span className="text-muted-foreground"> · {count} review{count === 1 ? "" : "s"}</span>}
        </p>
      </div>

      {reviews.length === 0 && !loading && (
        <div className="flex items-center gap-3 rounded-lg border border-dashed border-border bg-muted/40 px-4 py-5">
          <Sparkles className="h-5 w-5 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            No reviews yet — be the first rider to share how this spot performed for you.
          </p>
        </div>
      )}

      {loading && (
        <div className="h-16 animate-pulse rounded-lg bg-muted" />
      )}

      {!user && (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-muted/40 px-4 py-4">
          <Lock className="h-4 w-4 text-muted-foreground" />
          <p className="text-sm text-muted-foreground">
            Sign in to share a review. Reviews keep the marketplace honest for every rider.
          </p>
        </div>
      )}

      {user && (
        <form onSubmit={handleSubmit} className="space-y-3 rounded-xl border border-border bg-card p-4 shadow-sm">
          <p className="text-sm font-semibold text-foreground">Share your experience</p>
          <StarRating rating={rating} size="lg" interactive onChange={setRating} />
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder="How was the charging experience? Availability, outlet condition, host hospitality..."
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">{comment.length}/500 characters</p>
            <button
              type="submit"
              disabled={submitting || !comment.trim()}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
            >
              {submitting ? "Posting..." : "Post review"}
            </button>
          </div>
        </form>
      )}

      {reviews.length > 0 && (
        <div className="space-y-3">
          {(expanded ? reviews : reviews.slice(0, 2)).map((review) => (
            <article key={review.id} className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-2 flex items-center justify-between gap-2">
                <div className="flex items-center gap-2.5">
                  {review.userPhoto ? (
                    <img
                      src={review.userPhoto}
                      alt={review.userName}
                      className="h-7 w-7 rounded-full object-cover"
                    />
                  ) : (
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {review.userName.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="text-sm font-medium text-foreground">{review.userName}</p>
                    {review.userId === hostId && (
                      <p className="text-xs text-muted-foreground">Spot host</p>
                    )}
                  </div>
                </div>
                <time className="text-xs text-muted-foreground" dateTime={String(review.createdAt)}>
                  {relativeTime(review.createdAt as number)}
                </time>
              </div>
              <StarRating rating={review.rating} size="sm" />
              {review.comment && (
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{review.comment}</p>
              )}
              {review.response && (
                <p className="mt-2 rounded-lg bg-muted/50 px-3 py-2 text-sm text-muted-foreground">
                  <span className="font-semibold text-foreground">Host reply: </span>
                  {review.response}
                </p>
              )}
              {user && review.userId !== user.id && !ownsSpot && (
                <div className="mt-2">
                  {flaggingReviewId === review.id ? (
                    <div className="flex flex-wrap gap-1.5 rounded-lg border border-border bg-background p-2">
                      {REASON_OPTIONS.map((r) => (
                        <button
                          key={r}
                          type="button"
                          onClick={() => handleFlagReview(review, r)}
                          className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground transition-colors hover:bg-primary/10 hover:text-primary"
                        >
                          {r}
                        </button>
                      ))}
                      <button
                        type="button"
                        onClick={() => setFlaggingReviewId(null)}
                        className="rounded-md px-2 py-1 text-[10px] font-medium text-muted-foreground underline-offset-2 hover:underline"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setFlaggingReviewId(review.id)}
                      className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground transition-colors hover:text-destructive"
                      aria-label="Report this review"
                    >
                      <Flag className="h-3 w-3" /> Report
                    </button>
                  )}
                </div>
              )}
            </article>
          ))}
          {reviews.length > 2 && (
            <button
              type="button"
              onClick={() => setExpanded((v) => !v)}
              className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
            >
              <MessageSquare className="h-4 w-4" />
              {expanded ? "Show fewer reviews" : `Show all ${reviews.length} reviews`}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
