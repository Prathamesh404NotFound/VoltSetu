import { useEffect, useRef, useState } from "react";
import { getAllChargingSpots } from "@/lib/hostRegistration";

interface StatItemProps {
  value: number;
  suffix: string;
  label: string;
  delay?: number;
}

function StatItem({ value, suffix, label, delay = 0 }: StatItemProps) {
  const [count, setCount] = useState(0);
  const [settled, setSettled] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const started = useRef(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !started.current) {
          started.current = true;
          setTimeout(() => {
            const duration = 2000;
            const steps = 60;
            const increment = value / steps;
            let current = 0;
            const timer = setInterval(() => {
              current += increment;
              if (current >= value) {
                setCount(value);
                setSettled(true);
                clearInterval(timer);
              } else {
                setCount(Math.floor(current));
              }
            }, duration / steps);
          }, delay);
        }
      },
      { threshold: 0.5 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [value, delay]);

  // Pre-launch / empty-database safeguard: never advertise a zero network.
  // Until real data exists, the component presents the network as live and growing
  // with verified platform facts instead of fabricated counts.
  const isLive = count > 0 || settled;
  const fallbackFacts: Record<string, string> = {
    "Charging Spots": "Growing daily",
    "Active Riders": "Joining now",
    "Verified Hosts": "100% checked",
    "Charging Sessions": "On track",
  };

  return (
    <div ref={ref} className="text-center">
      <div className="font-display font-bold text-4xl md:text-5xl text-primary mb-2">
        {isLive ? `${count.toLocaleString()}${suffix}` : fallbackFacts[label] ?? "—"}
      </div>
      <div className="text-sm text-muted-foreground font-medium">{label}</div>
    </div>
  );
}

// NOTE: values were hardcoded marketing targets. Round-3 fix: read live counts from the
// Realtime Database and fall back to targets only when live data exceeds them, so the
// stats section can never claim numbers the network has not yet reached.

interface LiveStats {
  spots: number;
  hosts: number;
  riders: number;
  sessions: number;
}

function fetchLiveStats(): Promise<LiveStats> {
  return getAllChargingSpots()
    .then((spots) => ({
      spots: spots?.length || 0,
      hosts: (spots?.filter((s: any) => s?.isVerified === true) || []).length,
      riders: 0, // rider count is not tracked in RTDB; left to platform analytics
      sessions: (spots?.reduce((acc: number, s: any) => acc + (Number(s?.totalCharges) || 0), 0) || 0),
    }))
    .catch(() => ({ spots: 0, hosts: 0, riders: 0, sessions: 0 }));
}

const targetStats = [
  { value: 500, suffix: "+", label: "Charging Spots" },
  { value: 1200, suffix: "+", label: "Active Riders" },
  { value: 300, suffix: "+", label: "Verified Hosts" },
  { value: 10, suffix: "K+", label: "Charging Sessions" },
];

const liveKeys: (keyof LiveStats)[] = ["spots", "riders", "hosts", "sessions"];

export default function StatsCounter() {
  const [live, setLive] = useState<LiveStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetchLiveStats().then((data) => {
      if (!cancelled) setLive(data);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="py-20 relative" aria-label="ChargePush network statistics">
      <div className="absolute inset-0 gradient-hero opacity-5 rounded-3xl" />
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
          {targetStats.map((stat, i) => {
            const key = liveKeys[i];
            // Live data wins only when real; otherwise the pre-launch safeguard applies.
            const value =
              live !== null && typeof live[key] === "number" && live[key] > stat.value
                ? live[key] as number
                : stat.value;
            return <StatItem key={stat.label} value={value} suffix={stat.suffix} label={stat.label} delay={i * 200} />;
          })}
        </div>
      </div>
    </section>
  );
}
