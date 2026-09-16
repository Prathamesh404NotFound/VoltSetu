import { type LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  icon: LucideIcon;
  title: string;
  description: string;
  variant?: "default" | "glass" | "gradient";
}

export default function FeatureCard({ icon: Icon, title, description, variant = "default" }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "group p-6 rounded-2xl transition-all duration-500 hover:-translate-y-1.5",
        variant === "default" && "bg-gradient-to-b from-white via-white to-slate-50/80 border border-slate-200/90 shadow-[0_2px_8px_-2px_rgba(15,23,42,0.05),0_8px_20px_-6px_rgba(15,23,42,0.05)] hover:shadow-xl hover:border-primary/30",
        variant === "glass" && "bg-white/85 backdrop-blur-md border border-slate-200/80 shadow-md hover:shadow-xl",
        variant === "gradient" && "bg-gradient-to-br from-primary/10 via-blue-50/40 to-cyan-50/20 border border-primary/20 shadow-md hover:shadow-xl hover:border-primary/40"
      )}
    >
      <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300 shadow-md">
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>
      <h3 className="font-display font-semibold text-lg text-card-foreground mb-2">
        {title}
      </h3>
      <p className="text-sm text-muted-foreground leading-relaxed">
        {description}
      </p>
    </div>
  );
}
