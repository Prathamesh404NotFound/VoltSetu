/**
 * ChargePush Admin — City Waitlist panel
 *
 * Manages cityWaitlist/{slug}/{entryId} entries collected from /city/:slug
 * launch pages. Provides per-city counts, filtering, CSV export for outreach,
 * and entry deletion.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import ResponsiveContainer from "@/components/ui/responsive-container";
import { get, off, onValue, push, ref, remove } from "firebase/database";
import { database } from "@/lib/firebase-services";
import {
  BellRing,
  ArrowLeft,
  Loader2,
  Download,
  Trash2,
  MapPin,
  Users,
  Rocket,
  AlertCircle,
  Bike,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import SEO from "@/components/SEO";
import { CITIES, type CityInfo } from "@/lib/cities";

interface WaitlistEntry {
  entryId: string;
  name: string;
  contact?: string;
  role?: "rider" | "host";
  createdAt?: string | number;
}

function fmtDate(v?: string | number): string {
  if (!v) return "—";
  const d = new Date(typeof v === "number" ? v : Number(v));
  if (isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" });
}

function toCsv(rows: WaitlistEntry[], city: CityInfo): string {
  const esc = (s?: string) => `"${(s ?? "").replace(/"/g, '""')}"`;
  const header = "city,slug,name,contact,role,signed_at\n";
  const body = rows.map((r) => [city.name, city.slug, esc(r.name), esc(r.contact), r.role ?? "", esc(fmtDate(r.createdAt))].join(",")).join("\n");
  return header + body;
}

function downloadCsv(text: string, filename: string) {
  const blob = new Blob(["\ufeff" + text], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function AdminCityWaitlistPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [total, setTotal] = useState(0);
  const [selectedCity, setSelectedCity] = useState<string | null>(null);
  const [entries, setEntries] = useState<WaitlistEntry[]>([]);
  const [entriesLoading, setEntriesLoading] = useState(false);
  const [roleFilter, setRoleFilter] = useState<"all" | "rider" | "host">("all");
  const [deleting, setDeleting] = useState<string | null>(null);

  useEffect(() => {
    const root = ref(database, "cityWaitlist");
    const handle = onValue(root, (snap) => {
      const data = snap.val() as Record<string, Record<string, any>> | null;
      const next: Record<string, number> = {};
      let sum = 0;
      if (data) {
        for (const [slug, entries] of Object.entries(data)) {
          const n = Object.keys(entries).length;
          next[slug] = n;
          sum += n;
        }
      }
      setCounts(next);
      setTotal(sum);
      setLoading(false);
    }, (err) => {
      console.error("cityWaitlist listen failed:", err);
      setError(true);
      setLoading(false);
    });
    return () => off(root, "value", handle);
  }, []);

  const entriesToShow = useMemo(
    () =>
      entries
        .filter((e) => roleFilter === "all" || e.role === roleFilter)
        .sort((a, b) => Number(b.createdAt ?? 0) - Number(a.createdAt ?? 0)),
    [entries, roleFilter],
  );

  const selectedCityInfo = CITIES.find((c) => c.slug === selectedCity);

  async function loadEntries(slug: string) {
    setSelectedCity(slug);
    setEntries([]);
    setRoleFilter("all");
    setEntriesLoading(true);
    try {
      const snap = await get(ref(database, `cityWaitlist/${encodeURIComponent(slug)}`));
      const data = snap.val() as Record<string, any> | null;
      const list: WaitlistEntry[] = data
        ? Object.entries(data).map(([entryId, v]: [string, any]) => ({
            entryId,
            name: v.name ?? "Unnamed",
            contact: v.contact,
            role: v.role === "host" ? "host" : v.role === "rider" ? "rider" : undefined,
            createdAt: v.createdAt,
          }))
        : [];
      setEntries(list);
    } catch (err) {
      console.error("load entries failed:", err);
      toast.error("Could not load waitlist entries.");
    } finally {
      setEntriesLoading(false);
    }
  }

  async function exportCity() {
    if (!selectedCityInfo) return;
    downloadCsv(toCsv(entries, selectedCityInfo), `chargepush-waitlist-${selectedCity}.csv`);
    toast.success(`Exported ${entries.length} ${selectedCityInfo.name} waitlist entr${entries.length === 1 ? "y" : "ies"}.`);
  }

  async function deleteEntry(entryId: string) {
    if (!selectedCity) return;
    if (!window.confirm("Delete this waitlist entry? This cannot be undone.")) return;
    setDeleting(entryId);
    try {
      await remove(ref(database, `cityWaitlist/${encodeURIComponent(selectedCity)}/${entryId}`));
      setEntries((prev) => prev.filter((e) => e.entryId !== entryId));
      toast.success("Entry deleted.");
    } catch (err) {
      console.error("delete failed:", err);
      toast.error("Could not delete entry.");
    } finally {
      setDeleting(null);
    }
  }

  const cityRows = CITIES.map((c) => ({ ...c, count: counts[c.slug] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  return (
    <div className="pt-24 pb-12">
      <SEO title="City Waitlist — ChargePush Admin" description="Upcoming-city rider and host waitlist signups." />
      <ResponsiveContainer size="xl" className="py-6">
        <div className="mb-6">
          <Link to="/admin" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-3">
            <ArrowLeft className="w-4 h-4" /> Back to Admin
          </Link>
          <h1 className="font-display font-bold text-2xl md:text-3xl text-foreground flex items-center gap-2">
            <BellRing className="w-6 h-6 text-primary" /> City Waitlist
          </h1>
          <p className="text-muted-foreground mt-1">
            Riders and hosts signing up from upcoming-city launch pages. Open a city to manage entries.
          </p>
        </div>

        {/* Summary + city grid */}
        {loading ? (
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading waitlist…
          </div>
        ) : error ? (
          <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-destructive">
            <AlertCircle className="w-5 h-5" /> Could not read waitlist data. Check Firebase access.
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <Card className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <Users className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">{total}</p>
                    <p className="text-xs text-muted-foreground">Total signups</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <Rocket className="w-6 h-6 text-ev-green" />
                  <div>
                    <p className="text-2xl font-bold">{cityRows.filter((c) => c.count > 0).length}</p>
                    <p className="text-xs text-muted-foreground">Cities with interest</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <MapPin className="w-6 h-6 text-amber-500" />
                  <div>
                    <p className="text-2xl font-bold">{CITIES.filter((c) => !c.active).length}</p>
                    <p className="text-xs text-muted-foreground">Upcoming cities</p>
                  </div>
                </CardContent>
              </Card>
              <Card className="rounded-2xl">
                <CardContent className="p-4 flex items-center gap-3">
                  <Bike className="w-6 h-6 text-primary" />
                  <div>
                    <p className="text-2xl font-bold">
                      {CITIES.filter((c) => !c.active && (counts[c.slug] ?? 0) > 0).length}
                    </p>
                    <p className="text-xs text-muted-foreground">Cities with demand signal</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {selectedCity ? (
              <Card className="rounded-2xl overflow-hidden mb-6">
                <CardHeader className="bg-primary/5 flex flex-row items-center justify-between gap-4">
                  <div className="min-w-0">
                    <CardTitle className="text-lg truncate">
                      {selectedCityInfo?.name} — {(counts[selectedCity] ?? 0)} entr{entries.length === 1 ? "y" : "ies"}
                    </CardTitle>
                    <p className="text-xs text-muted-foreground mt-0.5 truncate">
                      {selectedCityInfo?.tagline}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <div className="flex items-center gap-1 text-xs">
                      {(["all", "rider", "host"] as const).map((r) => (
                        <button
                          key={r}
                          onClick={() => setRoleFilter(r)}
                          className={`rounded-full px-3 py-1 font-semibold transition-colors ${
                            roleFilter === r
                              ? "bg-primary text-primary-foreground shadow-sm"
                              : "bg-muted text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          {r === "all" ? `All (${entries.length})` : r === "rider" ? "Riders" : "Hosts"}
                        </button>
                      ))}
                    </div>
                    <Button size="sm" onClick={exportCity} disabled={entries.length === 0}>
                      <Download className="w-4 h-4 mr-1" /> Export CSV
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setSelectedCity(null)}>
                      All cities
                    </Button>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {entriesLoading ? (
                    <div className="flex items-center justify-center py-16 text-muted-foreground">
                      <Loader2 className="w-5 h-5 animate-spin mr-2" /> Loading entries…
                    </div>
                  ) : entriesToShow.length === 0 ? (
                    <div className="py-16 text-center text-sm text-muted-foreground">
                      {roleFilter === "all"
                        ? "No entries yet for this city."
                        : `No ${roleFilter === "rider" ? "rider" : "host"} entries matching the filter.`}
                    </div>
                  ) : (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Name</TableHead>
                          <TableHead className="hidden md:table-cell">Contact</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead className="hidden md:table-cell">Signed up</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {entriesToShow.map((e) => (
                          <TableRow key={e.entryId}>
                            <TableCell className="font-medium">{e.name}</TableCell>
                            <TableCell className="hidden md:table-cell">{e.contact ?? "—"}</TableCell>
                            <TableCell>
                              <Badge variant={e.role === "host" ? "default" : "secondary"} className={e.role === "host" ? "bg-ev-green text-white" : ""}>
                                {e.role === "host" ? "Future host" : e.role === "rider" ? "Rider" : "Unspecified"}
                              </Badge>
                            </TableCell>
                            <TableCell className="hidden md:table-cell text-xs text-muted-foreground">{fmtDate(e.createdAt)}</TableCell>
                            <TableCell className="text-right">
                              <Button
                                size="icon"
                                variant="ghost"
                                className="text-destructive hover:text-destructive"
                                onClick={() => deleteEntry(e.entryId)}
                                disabled={deleting === e.entryId}
                              >
                                {deleting === e.entryId ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            ) : (
              <Card className="rounded-2xl overflow-hidden">
                <CardHeader className="bg-primary/5">
                  <CardTitle className="text-lg">Signups by City</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>City</TableHead>
                        <TableHead>State</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Signups</TableHead>
                        <TableHead className="text-right">Manage</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {cityRows.map((c) => (
                        <TableRow key={c.slug} className="cursor-pointer hover:bg-muted/50" onClick={() => loadEntries(c.slug)}>
                          <TableCell className="font-medium">{c.name}</TableCell>
                          <TableCell>{c.state}</TableCell>
                          <TableCell>
                            <Badge variant={c.active ? "default" : "secondary"} className={c.active ? "bg-ev-green text-white" : ""}>
                              {c.active ? "Live" : "Coming soon"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <span className={`font-semibold ${c.count > 0 ? "text-ev-green" : "text-muted-foreground"}`}>{c.count}</span>
                          </TableCell>
                          <TableCell className="text-right">
                            <Button size="sm" variant="outline" onClick={(ev) => { ev.stopPropagation(); loadEntries(c.slug); }} disabled={c.count === 0}>
                              View {c.count > 0 && `(${c.count})`}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            )}
          </>
        )}
      </ResponsiveContainer>
    </div>
  );
}
