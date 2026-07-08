import { useState, useRef, useEffect, useCallback } from "react";
import { MapPin, Loader2, Navigation } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Destination {
  lat: number;
  lng: number;
  label: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
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
  const [suggestions, setSuggestions] = useState<NominatimResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
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

  const handleInput = useCallback(
    (text: string) => {
      setQuery(text);
      onChange(null);
      setShowSuggestions(false);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (text.trim().length < 4) {
        setSuggestions([]);
        return;
      }
      debounceRef.current = setTimeout(async () => {
        setLoading(true);
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&format=json&addressdetails=1&limit=6&countrycodes=in`,
            { headers: { "Accept-Language": "en" } }
          );
          const data: NominatimResult[] = await res.json();
          setSuggestions(data);
          setShowSuggestions(data.length > 0);
        } catch {
          setSuggestions([]);
        } finally {
          setLoading(false);
        }
      }, 400);
    },
    [onChange]
  );

  const pickSuggestion = (result: NominatimResult) => {
    const dest: Destination = {
      lat: parseFloat(result.lat),
      lng: parseFloat(result.lon),
      label: result.display_name,
    };
    setQuery(result.display_name);
    setShowSuggestions(false);
    setSuggestions([]);
    onChange(dest);
  };

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <div className="relative">
        <Navigation className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-primary" />
        <input
          type="text"
          value={query}
          onChange={(e) => handleInput(e.target.value)}
          onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
          placeholder={placeholder}
          className="w-full pl-12 pr-10 py-3.5 rounded-2xl bg-card border border-border text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary shadow-sm"
          aria-label="Destination search"
          autoComplete="off"
        />
        {loading && (
          <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-muted-foreground" />
        )}
      </div>

      {showSuggestions && suggestions.length > 0 && (
        <ul className="absolute z-50 mt-2 w-full rounded-xl border border-border bg-card shadow-xl overflow-hidden max-h-60 overflow-y-auto">
          {suggestions.map((s) => (
            <li key={s.place_id}>
              <button
                type="button"
                onClick={() => pickSuggestion(s)}
                className="w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors flex items-start gap-2"
              >
                <MapPin className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <span className="line-clamp-2">{s.display_name}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
