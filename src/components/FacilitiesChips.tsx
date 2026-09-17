import {
  Bath, Armchair, Umbrella, House, Droplets, BatteryCharging,
  Coffee, Cookie, Utensils,
  CircleParking, ParkingMeter, Tent, Video,
  Lightbulb, Cross, Accessibility, Flame,
  Wifi, Smartphone,
  BedDouble, Fuel, ShoppingBag, Wrench,
  CircleParking as DefaultIcon,
} from "lucide-react";

/**
 * Static icon map — icons are bound to facility ids here and never typed by
 * humans, so no invalid or nonsense icon data can enter the database.
 */
const ICON_MAP: Record<string, React.ComponentType<{ className?: string }>> = {
  bath: Bath, armchair: Armchair, umbrella: Umbrella, house: House,
  droplets: Droplets, "battery-charging": BatteryCharging,
  coffee: Coffee, cookie: Cookie, utensils: Utensils,
  "circle-parking": CircleParking, "parking-meter": ParkingMeter,
  tent: Tent, video: Video,
  lightbulb: Lightbulb, cross: Cross, accessibility: Accessibility,
  flame: Flame,
  wifi: Wifi, smartphone: Smartphone,
  "bed-double": BedDouble, fuel: Fuel, "shopping-bag": ShoppingBag,
  wrench: Wrench,
};

function normalizeAmenity(item: unknown): { id?: string; icon?: string; name: string } | null {
  if (!item) return null;
  if (typeof item === "string") {
    const trimmed = item.trim();
    return trimmed ? { id: trimmed, name: trimmed } : null;
  }
  if (typeof item === "object" && item !== null) {
    const obj = item as Record<string, unknown>;
    let nameStr = "";
    if (typeof obj.name === "string") {
      nameStr = obj.name.trim();
    } else if (typeof obj.name === "object" && obj.name !== null && typeof (obj.name as any).name === "string") {
      nameStr = (obj.name as any).name.trim();
    } else if (typeof obj.name === "number") {
      nameStr = String(obj.name).trim();
    } else if (typeof obj.id === "string") {
      nameStr = obj.id.trim();
    }
    if (!nameStr) return null;
    const iconStr = typeof obj.icon === "string" ? obj.icon : (typeof obj.id === "string" ? obj.id : undefined);
    const idStr = typeof obj.id === "string" ? obj.id : nameStr;
    return { id: idStr, icon: iconStr, name: nameStr };
  }
  return null;
}

/** Rider-facing display of a spot's facilities as icon chips. */
export default function FacilitiesChips({
  amenities,
  limit,
}: {
  amenities?: Array<{ id?: string; icon?: string; name?: string } | string | any>;
  limit?: number;
}) {
  if (!Array.isArray(amenities)) return null;

  const items = amenities
    .map(normalizeAmenity)
    .filter((a): a is { id?: string; icon?: string; name: string } => a !== null);

  if (items.length === 0) return null;
  const shown = limit ? items.slice(0, limit) : items;
  const extra = items.length - shown.length;
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {shown.map((a, idx) => {
        const Icon = (a.icon ? ICON_MAP[a.icon] : undefined) ?? (a.id ? ICON_MAP[a.id] : undefined) ?? DefaultIcon;
        return (
          <span
            key={a.id || a.name || idx}
            className="inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-2.5 py-1 text-[11px] sm:text-xs font-medium text-muted-foreground"
            title={a.name}
          >
            <Icon className="w-3.5 h-3.5 text-primary shrink-0" />
            {a.name}
          </span>
        );
      })}
      {extra > 0 && (
        <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">
          +{extra}
        </span>
      )}
    </div>
  );
}
