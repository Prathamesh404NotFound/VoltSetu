import { useEffect, useMemo, useState } from "react";
import { X, Pencil, Loader2, Zap, Clock, IndianRupee, Check } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { FACILITIES, FACILITY_CATEGORIES, facilitiesToAmenities } from "@/lib/facilities";
import { updateSpot, type SpotEditPayload } from "@/lib/spotEditService";
import type { HostProfileSpot } from "@/lib/hostProfileService";
import { cn } from "@/lib/utils";

const OUTLET_TYPES = ["Standard 3-Pin", "5-Amp Socket", "16-Amp Socket", "Type 2 EV Charger"];
const CHARGING_SPEEDS = ["Slow (2-3 kW)", "Fast (7-22 kW)", "Rapid (50+ kW)"];
const SPOT_TYPES = ["Home", "Shop", "Café / Restaurant", "Office", "Parking / Garage"];
const AVAILABLE_HOURS = [
  "24/7",
  "6am-10pm",
  "8am-8pm",
  "9am-6pm",
  "custom",
];

interface SpotEditorProps {
  spot: HostProfileSpot | null;
  hostId: string;
  onClose: () => void;
  onSaved: () => void;
}

export default function SpotEditor({ spot, hostId, onClose, onSaved }: SpotEditorProps) {
  const isOpen = Boolean(spot);
  const [name, setName] = useState("");
  const [pricePerHour, setPricePerHour] = useState("");
  const [outletType, setOutletType] = useState("");
  const [chargingSpeed, setChargingSpeed] = useState("");
  const [availableHours, setAvailableHours] = useState("");
  const [spotType, setSpotType] = useState("");
  const [facilityIds, setFacilityIds] = useState<string[]>([]);
  const [status, setStatus] = useState<"active" | "inactive">("active");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!spot) return;
    setName(spot.name || "");
    setPricePerHour(String(spot.pricePerHour ?? ""));
    setOutletType(spot.outletType ?? "");
    setChargingSpeed(spot.outletType ? "" : "");
    setAvailableHours("");
    setSpotType(spot.spotType ?? "Home");
    setStatus(spot.status === "inactive" ? "inactive" : "active");
    // Rebuild facility ids from stored amenities (curated ids) when possible.
    const ids = (spot as { amenities?: Array<{ id?: string; name?: string }> }).amenities ?? [];
    setFacilityIds(
      ids
        .map((a) => a.id ?? "")
        .filter((id) => id && Boolean(facilitiesToAmenities([id]).length))
    );
  }, [spot]);

  // Derive chargingSpeed from outlet selection context: keep the value the
  // host had; the wizard stores speeds as free strings too, so show what was saved.
  useEffect(() => {
    if (!spot) return;
    setChargingSpeed((spot as { chargingSpeed?: string }).chargingSpeed ?? "");
  }, [spot]);

  const spotAmenities = useMemo(() => facilitiesToAmenities(facilityIds), [facilityIds]);

  function toggleFacility(id: string) {
    setFacilityIds((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  }

  async function handleSave() {
    if (!spot) return;
    const payload: SpotEditPayload = {
      name,
      pricePerHour: Number.parseFloat(pricePerHour),
      outletType,
      chargingSpeed,
      availableHours,
      spotType,
      facilityIds,
      status,
    };
    setSaving(true);
    try {
      const result = await updateSpot(spot.id, hostId, payload);
      if (!result.ok) {
        toast.error(result.message);
        return;
      }
      toast.success(result.message);
      onSaved();
    } finally {
      setSaving(false);
    }
  }

  if (!spot) return null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[88vh] overflow-y-auto max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Pencil className="h-4 w-4 text-primary" /> Edit spot
          </DialogTitle>
          <DialogDescription>
            Changes are live immediately for all riders. Only you can edit this spot.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-5 py-1">
          {/* Name */}
          <div>
            <label className="block text-sm font-medium mb-1.5 text-foreground">Spot name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              maxLength={80}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Price */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5 text-foreground">
              <IndianRupee className="h-3.5 w-3.5" /> Price per hour (₹)
            </label>
            <input
              type="number"
              value={pricePerHour}
              onChange={(e) => setPricePerHour(e.target.value)}
              min="0"
              max="10000"
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          {/* Spot type */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Spot type</label>
            <div className="grid grid-cols-2 gap-2">
              {SPOT_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setSpotType(type)}
                  className={cn(
                    "rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all",
                    spotType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Outlet type */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-2 text-foreground">
              <Zap className="h-3.5 w-3.5" /> Outlet type
            </label>
            <div className="grid grid-cols-2 gap-2">
              {OUTLET_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => setOutletType(type)}
                  className={cn(
                    "rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all",
                    outletType === type
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/50"
                  )}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          {/* Charging speed */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-2 text-foreground">
              <Zap className="h-3.5 w-3.5" /> Charging speed
            </label>
            <div className="grid grid-cols-3 gap-2">
              {CHARGING_SPEEDS.map((speed) => (
                <button
                  key={speed}
                  type="button"
                  onClick={() => setChargingSpeed(speed)}
                  className={cn(
                    "rounded-xl border-2 px-2 py-2.5 text-xs font-medium transition-all",
                    chargingSpeed === speed
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border text-foreground hover:border-primary/50"
                  )}
                >
                  {speed}
                </button>
              ))}
            </div>
          </div>

          {/* Available hours */}
          <div>
            <label className="flex items-center gap-1.5 text-sm font-medium mb-1.5 text-foreground">
              <Clock className="h-3.5 w-3.5" /> Available hours
            </label>
            <select
              value={availableHours}
              onChange={(e) => setAvailableHours(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground focus:ring-2 focus:ring-primary"
            >
              <option value="">Keep current ({spot.availableHours || "24/7"})</option>
              {AVAILABLE_HOURS.map((h) => (
                <option key={h} value={h}>
                  {h === "custom" ? "Custom hours" : h}
                </option>
              ))}
            </select>
          </div>

          {/* Facilities */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">
              Facilities ({spotAmenities.length} selected)
            </label>
            <div className="space-y-3">
              {FACILITY_CATEGORIES.map((cat) => (
                <div key={cat.id}>
                  <p className="mb-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                    {cat.label}
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {FACILITIES.filter((f) => f.category === cat.id).map((f) => {
                      const selected = facilityIds.includes(f.id);
                      return (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => toggleFacility(f.id)}
                          className={cn(
                            "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-medium transition-colors",
                            selected
                              ? "border-primary bg-primary/10 text-primary"
                              : "border-border bg-muted/40 text-foreground hover:border-primary/50"
                          )}
                        >
                          {selected && <Check className="h-3 w-3" />}
                          {f.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Visibility */}
          <div>
            <label className="block text-sm font-medium mb-2 text-foreground">Visibility</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setStatus("active")}
                className={cn(
                  "rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all",
                  status === "active"
                    ? "border-ev-green bg-ev-green/10 text-ev-green"
                    : "border-border text-foreground hover:border-ev-green/50"
                )}
              >
                Live on ChargePush
              </button>
              <button
                type="button"
                onClick={() => setStatus("inactive")}
                className={cn(
                  "rounded-xl border-2 px-3 py-2.5 text-sm font-medium transition-all",
                  status === "inactive"
                    ? "border-destructive bg-destructive/10 text-destructive"
                    : "border-border text-foreground hover:border-destructive/50"
                )}
              >
                Pause listing
              </button>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving || !name.trim() || !pricePerHour}
            className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 disabled:pointer-events-none disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" /> Saving...
              </>
            ) : (
              <>
                <Check className="h-4 w-4" /> Save changes
              </>
            )}
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
