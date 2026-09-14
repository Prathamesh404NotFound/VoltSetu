/* ChargePush admin notification inbox.
 *
 * One-stop queue: new content flags, pending listing reviews, and pending
 * host verifications, categorized by system domain.
 */
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  Bell,
  Flag,
  ClipboardList,
  ShieldCheck,
  Loader2,
  Inbox,
  ArrowUpRight,
  Filter,
} from "lucide-react";
import {
  getAdminNotificationSummary,
  getAdminNotifications,
  type AdminNotificationItem,
} from "@/lib/adminNotificationsService";
import { cn } from "@/lib/utils";
import ResponsiveContainer from "@/components/ui/responsive-container";
import SEO from "@/components/SEO";

const KIND_META = {
  flag: { icon: Flag, label: "Flag", href: "/admin/moderation", accent: "text-red-500", category: "System" },
  listing_review: { icon: ClipboardList, label: "Listing Review", href: "/admin/listing-reviews", accent: "text-primary", category: "Host" },
  verification: { icon: ShieldCheck, label: "Verification", href: "/admin/verifications", accent: "text-ev-green", category: "Host" },
} as const;

const SEVERITY_DOT = {
  high: "bg-red-500",
  medium: "bg-amber-500",
  low: "bg-muted-foreground",
} as const;

const CATEGORIES = ["All", "Booking", "Host", "Availability", "Payments", "System"] as const;

function formatDate(t: number): string {
  if (!t) return "unknown time";
  const d = new Date(t);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" });
}

export default function AdminNotificationsPage() {
  const [summary, setSummary] = useState({ openFlags: 0, pendingListingReviews: 0, pendingVerifications: 0, total: 0 });
  const [items, setItems] = useState<AdminNotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<string>("All");

  useEffect(() => {
    Promise.all([getAdminNotificationSummary(), getAdminNotifications()])
      .then(([s, it]) => {
        setSummary(s);
        setItems(it);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filteredItems = items.filter((item) => {
    if (activeCategory === "All") return true;
    const cat = KIND_META[item.kind]?.category || "System";
    return cat === activeCategory;
  });

  return (
    <ResponsiveContainer size="xl" className="py-6">
      <SEO title="Notifications | ChargePush Operations" noindex />
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="font-display font-bold text-2xl">ChargePush Operations Inbox</h1>
              <p className="text-sm text-muted-foreground">
                {summary.total > 0
                  ? `${summary.total} item${summary.total === 1 ? "" : "s"} requiring operational attention`
                  : "All caught up — no pending operational flags"}
              </p>
            </div>
          </div>
        </div>

        {/* Summary tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link to="/admin/moderation" className="block rounded-xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Open Content Flags</p>
              <Flag className="w-4 h-4 text-red-500" />
            </div>
            <p className="text-3xl font-bold mt-1">{summary.openFlags}</p>
          </Link>
          <Link to="/admin/listing-reviews" className="block rounded-xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pending Listing Reviews</p>
              <ClipboardList className="w-4 h-4 text-primary" />
            </div>
            <p className="text-3xl font-bold mt-1">{summary.pendingListingReviews}</p>
          </Link>
          <Link to="/admin/verifications" className="block rounded-xl border border-border bg-card p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Pending Verifications</p>
              <ShieldCheck className="w-4 h-4 text-ev-green" />
            </div>
            <p className="text-3xl font-bold mt-1">{summary.pendingVerifications}</p>
          </Link>
        </div>

        {/* Category filter tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          <Filter className="w-4 h-4 text-muted-foreground flex-shrink-0" />
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all",
                activeCategory === cat
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Inbox feed */}
        <div className="rounded-xl border border-border bg-card">
          <div className="px-5 py-3 border-b border-border flex items-center gap-2">
            <Inbox className="w-4 h-4 text-muted-foreground" />
            <h2 className="text-sm font-semibold">Operational Inbox</h2>
          </div>
          {loading ? (
            <div className="py-16 flex justify-center">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="py-16 text-center">
              <Inbox className="w-10 h-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-sm text-muted-foreground">No notifications in {activeCategory} category.</p>
            </div>
          ) : (
            <ul>
              {filteredItems.map((item) => {
                const meta = KIND_META[item.kind];
                return (
                  <li key={`${item.kind}-${item.id}`}>
                    <Link
                      to={meta.href}
                      className="flex items-start gap-3 px-5 py-3.5 hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                    >
                      <span className={cn("w-2 h-2 rounded-full mt-1.5 flex-shrink-0", SEVERITY_DOT[item.severity])} />
                      <meta.icon className={cn("w-4 h-4 mt-0.5 flex-shrink-0", meta.accent)} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{item.detail}</p>
                      </div>
                      <div className="text-right flex-shrink-0 hidden sm:block">
                        <span className="inline-block px-2 py-0.5 rounded-full bg-muted text-[10px] font-bold uppercase text-muted-foreground mb-1">
                          {meta.category}
                        </span>
                        <p className="text-xs text-muted-foreground">{formatDate(item.createdAt)}</p>
                      </div>
                      <ArrowUpRight className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </ResponsiveContainer>
  );
}

