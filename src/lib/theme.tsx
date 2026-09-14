/**
 * ChargePush — permanent light-theme stub.
 *
 * Dark mode has been removed from ChargePush by design.
 * This file keeps the original export surface intact so existing imports
 * compile without changes, but all runtime behaviour is hard-coded to light.
 */
import type { ReactNode } from "react";

export type ThemeMode = "light";

export function applyStoredTheme(): void {
  // No-op: the app is permanently light, no class toggling needed.
}

export function effectiveDark(_mode: ThemeMode): boolean {
  return false;
}

interface ThemeContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  isDark: boolean;
}

const _noop = () => undefined;

// Keep useTheme importable but always return light state.
export function useTheme(): ThemeContextValue {
  return { theme: "light", setTheme: _noop, isDark: false };
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  // Transparent passthrough — no context or effect needed.
  return <>{children}</>;
}

// Imperative helper kept for any call sites that imported it directly.
export function isDark(): boolean {
  return false;
}
