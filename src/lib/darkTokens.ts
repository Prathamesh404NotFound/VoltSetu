import { isDark } from "@/lib/theme";

// Booking / payout / status text colors — works in light AND dark mode.
export function statusTextColor(status: string): string {
  const dark = isDark();
  switch (status) {
    case "completed":
    case "approved":
    case "paid_out":
      return dark ? "text-[#16A34A]" : "text-[#16A34A]";
    case "pending":
    case "requested":
    case "processing":
      return dark ? "text-[#D97706]" : "text-[#D97706]";
    case "cancelled":
    case "rejected":
      return dark ? "text-[#DC2626]" : "text-[#DC2626]";
    default:
      return "text-muted-foreground";
  }
}

// Danger button outline (cancel payout / reject) — works in light AND dark mode.
export function dangerOutlineClasses(): string {
  return "border-[#DC2626]/40 text-[#DC2626] hover:bg-[#FEE2E2]";
}

// Success money amounts (earnings, CO2, refunds) — works in light AND dark mode.
export function successTextClasses(): string {
  return "text-[#16A34A]";
}

// Small red notification dot — works in light AND dark mode.
export function dotRedClasses(): string {
  return "bg-[#DC2626] text-white";
}
