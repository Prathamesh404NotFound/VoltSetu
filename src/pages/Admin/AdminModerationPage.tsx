import ResponsiveContainer from "@/components/ui/responsive-container";
import { useEffect, useMemo, useState } from "react";
import { Flag, FlagOff, UserX, Trash2, Loader2, Search, ShieldAlert, Ban } from "lucide-react";
import { toast } from "sonner";
import { listFlags, resolveFlag, type ContentFlag } from "@/lib/moderationService";
import { cn } from "@/lib/utils";

type StatusFilter = "open" | "dismissed" | "resolved" | "all";

export default function AdminModerationPage() {
  const [flags, setFlags] = useState<ContentFlag[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("open");
  const [query, setQuery] = useState("");
  const [busyFlags, setBusyFlags] = useState<Record<string, string>>({});
  const [notes, setNotes] = useState<Record<string, string>>({});

  useEffect(() => {
    let mounted = true;
    listFlags()
      .then((f) => mounted && setFlags(f))
      .catch(() => toast.error("Could not load the moderation queue."))
      .finally(() => mounted && setLoading(false));
    return () => {
      mounted = false;
    };
  }, []);

  const filtered = useMemo(() => {
    let result = statusFilter === "all" ? flags : flags.filter((f) => f.status === statusFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      result = result.filter(
        (f) =>
          f.reason.toLowerCase().includes(q) ||
          f.reporterName.toLowerCase().includes(q) ||
          f.targetId.toLowerCase().includes(q) ||
          (f.adminNote || "").toLowerCase().includes(q)
      );
    }
    return result;
  }, [flags, statusFilter, query]);

  async function handleResolve(flag: ContentFlag, resolution: ContentFlag["resolution"]) {
    setBusyFlags((prev) => ({ ...prev, [flag.id]: resolution }));
    try {
      const params: Parameters<typeof resolveFlag>[0] = {
        flagId: flag.id,
        resolution,
        adminNote: notes[flag.id] ?? "",
      };
      if (resolution === "removed_review") {
        params.reviewSpotId = flag.targetId;
        params.reviewId = flag.targetId;
      }
      if (resolution === "muted_user" && flag.targetType === "review") {
        params.userId = flag.targetOwnerId;
      }
      const result = await resolveFlag(params);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      setFlags((prev) =>
        prev.map((f) => (f.id === flag.id ? { ...f, status: "resolved", resolution, resolvedAt: Date.now() } : f))
      );
    } finally {
      setBusyFlags((prev) => {
        const next = { ...prev };
        delete next[flag.id];
        return next;
      });
    }
  }

  const counts = useMemo(() => {
    const c = { open: 0, dismissed: 0, resolved: 0, all: flags.length };
    flags.forEach((f) => {
      if (f.status === "open") c.open += 1;
      else if (f.status === "dismissed") c.dismissed += 1;
      else c.resolved += 1;
    });
    return c;
  }, [flags]);

  return (
    <ResponsiveContainer size="xl" className="py-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-display font-bold text-foreground flex items-center gap-2">
            <ShieldAlert className="h-6 w-6 text-primary" /> Moderation Queue
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Rider and host reports of abusive reviews, spam, and abusive behavior. Mute users or
            remove content to keep the community self-cleaning.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex flex-wrap gap-1.5">
          {(
            [
              { id: "open", label: `Open (${counts.open})` },
              { id: "resolved", label: `Resolved (${counts.resolved})` },
              { id: "dismissed", label: `Dismissed (${counts.dismissed})` },
              { id: "all", label: `All (${counts.all})` },
            ] as { id: StatusFilter; label: string }[]
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStatusFilter(tab.id)}
              className={cn(
                "rounded-full px-3.5 py-1.5 text-xs font-semibold transition-colors",
                statusFilter === tab.id
                  ? "bg-primary text-primary-foreground"
                  : "bg-card border border-border text-muted-foreground hover:bg-muted"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="relative sm:ml-auto">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search reports..."
            className="w-full rounded-full border border-border bg-background py-2 pl-9 pr-4 text-sm text-foreground focus:ring-2 focus:ring-primary sm:w-64"
          />
        </div>
      </div>

      {/* Queue */}
      {loading ? (
        <div className="flex min-h-[40vh] items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-14 text-center">
          <FlagOff className="mx-auto h-10 w-10 text-muted-foreground" />
          <p className="mt-3 text-sm font-medium text-foreground">Nothing in this queue</p>
          <p className="mt-1 text-xs text-muted-foreground">
            {statusFilter === "open"
              ? "No open reports — the community looks clean."
              : "Try a different filter or search term."}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="hidden overflow-x-auto md:block">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="px-4 py-3">When</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">Target</th>
                  <th className="px-4 py-3">Reason</th>
                  <th className="px-4 py-3">Reported by</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((flag) => (
                  <FlagRow
                    key={flag.id}
                    flag={flag}
                    busy={busyFlags[flag.id]}
                    note={notes[flag.id] ?? ""}
                    onNote={(v) => setNotes((prev) => ({ ...prev, [flag.id]: v }))}
                    onResolve={(resolution) => handleResolve(flag, resolution)}
                  />
                ))}
              </tbody>
            </table>
          </div>
          {/* Mobile cards */}
          <div className="divide-y divide-border md:hidden">
            {filtered.map((flag) => (
              <FlagRow
                key={flag.id}
                flag={flag}
                busy={busyFlags[flag.id]}
                note={notes[flag.id] ?? ""}
                onNote={(v) => setNotes((prev) => ({ ...prev, [flag.id]: v }))}
                onResolve={(resolution) => handleResolve(flag, resolution)}
                compact
              />
            ))}
          </div>
        </div>
      )}
    </ResponsiveContainer>
  );
}

function FlagRow({
  flag,
  busy,
  note,
  onNote,
  onResolve,
  compact = false,
}: {
  flag: ContentFlag;
  busy?: string;
  note: string;
  onNote: (v: string) => void;
  onResolve: (resolution: ContentFlag["resolution"]) => void;
  compact?: boolean;
}) {
  const when = flag.createdAt
    ? new Date(flag.createdAt).toLocaleString("en-IN", {
        day: "numeric",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "—";

  const statusChip = {
    open: "bg-amber-500/10 text-amber-600",
    resolved: "bg-ev-green/10 text-ev-green",
    dismissed: "bg-muted text-muted-foreground",
  }[flag.status];

  if (compact) {
    return (
      <div className="p-4">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
              {flag.targetType}
            </span>
            <span className="text-xs text-muted-foreground">{when}</span>
          </div>
          <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusChip)}>
            {flag.status}
          </span>
        </div>
        <p className="mt-2 text-sm font-medium text-foreground">
          <code className="rounded bg-muted px-1.5 py-0.5 text-xs">{flag.targetId}</code>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">{flag.reason}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <ResolveButtons
            flag={flag}
            busy={busy}
            onResolve={onResolve}
          />
        </div>
      </div>
    );
  }

  return (
    <tr className="align-top hover:bg-muted/30">
      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">{when}</td>
      <td className="px-4 py-3">
        <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase text-primary">
          {flag.targetType}
        </span>
      </td>
      <td className="px-4 py-3">
        <code className="break-all rounded bg-muted px-1.5 py-0.5 text-xs text-foreground">
          {flag.targetId}
        </code>
        {flag.targetOwnerId ? (
          <p className="mt-1 text-[10px] text-muted-foreground">
            Owner: <code className="break-all">{flag.targetOwnerId}</code>
          </p>
        ) : null}
      </td>
      <td className="px-4 py-3 text-sm text-foreground">{flag.reason}</td>
      <td className="whitespace-nowrap px-4 py-3 text-xs text-muted-foreground">
        {flag.reporterName}
        <br />
        <code className="break-all text-[10px]">{flag.reporterId}</code>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-bold uppercase", statusChip)}>
          {flag.status}
          {flag.resolution ? ` · ${flag.resolution}` : ""}
        </span>
      </td>
      <td className="whitespace-nowrap px-4 py-3">
        {flag.status === "open" ? (
          <ResolveButtons flag={flag} busy={busy} onResolve={onResolve} />
        ) : (
          <div className="flex flex-col gap-2">
            <input
              value={note}
              onChange={(e) => onNote(e.target.value)}
              placeholder="Admin note (optional)"
              className="w-40 rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs text-foreground"
            />
          </div>
        )}
      </td>
    </tr>
  );
}

function ResolveButtons({
  flag,
  busy,
  onResolve,
}: {
  flag: ContentFlag;
  busy?: string;
  onResolve: (resolution: ContentFlag["resolution"]) => void;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-1.5">
        {flag.targetType === "user" && (
          <button
            onClick={() => onResolve("muted_user")}
            disabled={Boolean(busy)}
            className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
            title={`Mute user ${flag.targetId}`}
          >
            <UserX className="h-3 w-3" />
            {busy === "muted_user" ? <Loader2 className="h-3 w-3 animate-spin" /> : <Ban className="h-3 w-3" />}
            Mute user
          </button>
        )}
        {flag.targetType === "review" && (
          <>
            <button
              onClick={() => onResolve("removed_review")}
              disabled={Boolean(busy)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-destructive hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              title={`Remove review ${flag.targetId}`}
            >
              {busy === "removed_review" ? (
                <Loader2 className="h-3 w-3 animate-spin" />
              ) : (
                <Trash2 className="h-3 w-3" />
              )}
              Remove review
            </button>
            <button
              onClick={() => onResolve("muted_user")}
              disabled={Boolean(busy)}
              className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
              title={`Mute the review's reported user ${flag.targetOwnerId}`}
            >
              <UserX className="h-3 w-3" />
              Mute user
            </button>
          </>
        )}
        <button
          onClick={() => onResolve("dismissed")}
          disabled={Boolean(busy)}
          className="inline-flex items-center gap-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[11px] font-semibold text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-50"
        >
          <FlagOff className="h-3 w-3" />
          Dismiss
        </button>
      </div>
      <p className="text-[10px] leading-tight text-muted-foreground">
        {flag.targetType === "review"
          ? "Removing a review hides it from the spot's review section."
          : "Muting blocks the user from booking and posting reviews."}
      </p>
    </div>
  );
}
