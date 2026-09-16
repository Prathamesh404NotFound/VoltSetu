/**
 * CitySelector.tsx
 *
 * Dropdown selector for active ChargePush network cities.
 */

import { MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { CITIES, getCityBySlug } from "@/lib/cities";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export interface CitySelectorProps {
  onNavigate?: (path: string) => void;
  compact?: boolean;
  className?: string;
  variant?: "pill" | "hero" | "filter";
}

export function CitySelector({
  onNavigate,
  compact = false,
  className = "",
  variant = "pill",
}: CitySelectorProps) {
  const currentSlug =
    CITIES.find((c) => c.active && window.location.pathname === `/city/${c.slug}`)?.slug ?? "kolhapur";
  const current = getCityBySlug(currentSlug) ?? CITIES[0];

  const handleSelect = (slug: string) => {
    const path = `/city/${slug}`;
    if (onNavigate) {
      onNavigate(path);
    } else {
      window.location.href = path;
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-2 rounded-xl text-sm font-semibold transition-all shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            variant === "hero"
              ? "bg-card hover:bg-muted border border-border px-4 py-3.5 text-foreground rounded-2xl shadow-xl hover:border-primary/40"
              : variant === "filter"
              ? "bg-card border border-border px-3.5 py-2 text-foreground hover:bg-muted rounded-full"
              : "border border-border/70 bg-card/80 backdrop-blur-xs px-3 py-1.5 text-xs text-foreground hover:border-primary/40 hover:bg-card rounded-full",
            compact && "w-auto justify-start rounded-xl text-sm",
            className
          )}
          aria-label="Choose a city"
        >
          <MapPin className="w-4 h-4 text-primary shrink-0" />
          <span className="font-bold whitespace-nowrap">{current.name}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60 shrink-0" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56 max-h-80 overflow-y-auto rounded-2xl p-1.5 shadow-xl border border-border z-50">
        <div className="px-2 py-1.5 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
          Select ChargePush City
        </div>
        {CITIES.map((city) =>
          city.active ? (
            <DropdownMenuItem
              key={city.slug}
              onClick={() => handleSelect(city.slug)}
              className="cursor-pointer rounded-xl text-xs py-2.5 px-3 font-semibold flex items-center justify-between"
            >
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                <span>{city.name}</span>
              </div>
              {city.launch && (
                <span className="text-[10px] font-bold text-[#166534] bg-[#DCFCE7] px-2 py-0.5 rounded-full">Active</span>
              )}
            </DropdownMenuItem>
          ) : (
            <div key={city.slug} className="px-3 py-2 text-xs text-muted-foreground/70 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 opacity-50" />
                <span>{city.name}</span>
              </div>
              <span className="text-[10px] bg-muted px-2 py-0.5 rounded-full">Coming soon</span>
            </div>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CitySelector;
