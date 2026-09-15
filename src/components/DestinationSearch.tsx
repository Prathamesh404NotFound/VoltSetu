/**
 * ChargePush Destination Search Component
 *
 * Consumes geocodingService to provide debounced (650ms), cancelable location search
 * with clean labels (Name + Subtitle) for destination routing.
 */

import { useState, useRef, useEffect } from "react";
import { MapPin, Loader2, Navigation, X } from "lucide-react";
import { searchLocationDebounced, type SearchResultItem } from "@/lib/geocodingService";
import { cn } from "@/lib/utils";

export interface Destination {
  lat: number;
  lng: number;
  label: string;
}

interface DestinationSearchProps {
  value: Destination | null;
  onChange: (destination: Destination | null) => void;
  placeholder?: string;
  className?: string;
}

export default function DestinationSearch({
  value,
  onChange,
  placeholder = "Where are you headed? (e.g. Rankala Lake, Kolhapur)",
  className,
}: DestinationSearchProps) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<SearchResultItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(value?.label ?? "");
  }, [value?.label]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleInput = (text: string) => {
    setQuery(text);
    if (!text.trim()) {
      onChange(null);
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoading(true);
    searchLocationDebounced(
      text,
      (results) => {
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
        setLoading(false);
      },
      650
    );
  };

  const pickSuggestion = (item: SearchResultItem) => {
    const dest: Destination = {
      lat: item.lat,
      lng: item.lng,
      label: item.fullLabel,
    };
    setQuery(item.fullLabel);
    setShowSuggestions(false);
    setSuggestions([]);
    onChange(dest);
  };

  const clearInput = () => {
    setQuery("");
    onChange(null);
    setSuggestions([]);
    setShowSuggestions(false);
  };

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <div className="relative">
        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-primary" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-11 pr-10 py-3 rounded-2xl bg-card border border-border text-foreground text-xs xl:text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          aria-label="Destination search"
          autoComplete="off"
        />
        {loading ? (
          <Loader2 className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        ) : query ? (
          <button
            type="button"
            onClick={clearInput}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-muted-foreground hover:text-foreground rounded-full"
            aria-label="Clear destination"
          >
            <X className="w-4 h-4" />
          </button>
        ) : null}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full rounded-2xl border border-border bg-card shadow-xl overflow-hidden max-h-60 overflow-y-auto p-1.5">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => pickSuggestion(s)}
                className="w-full text-left px-3.5 py-2.5 rounded-xl text-xs xl:text-sm hover:bg-muted transition-colors flex items-start gap-2.5"
              >
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-foreground truncate">{s.name}</span>
                  <span className="text-[11px] text-muted-foreground truncate">{s.subtitle}</span>
                </div>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
