import { useEffect, useState } from "react";
import { Smartphone } from "lucide-react";
import { consumePwaInstallEvent, type BeforeInstallPromptEvent } from "@/main";

/**
 * Install CTA for the VoltSetu PWA. Appears only when the browser offers a
 * native install prompt (Chrome/Edge/Opera on desktop and Android) and hides
 * after the user installs or dismisses.
 */
export function InstallPwaButton() {
  const [event, setEvent] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Capture any install prompt that fires after mount (common on first load).
    const handler = (e: Event) => {
      e.preventDefault();
      setEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    const pending = consumePwaInstallEvent();
    if (pending) setEvent(pending);

    const alreadyInstalled =
      window.matchMedia("(display-mode: standalone)").matches ||
      (navigator as Navigator & { standalone?: boolean }).standalone === true;
    if (alreadyInstalled) return;

    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  if (!event) return null;

  const handleInstall = async () => {
    await event.prompt();
    const choice = await event.userChoice;
    if (choice.outcome === "accepted") {
      setEvent(null);
    }
  };

  return (
    <button
      type="button"
      onClick={handleInstall}
      className="inline-flex items-center gap-1.5 rounded-lg bg-ev-green px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-all hover:bg-ev-green/90 hover:-translate-y-px"
      aria-label="Install ChargePush app"
    >
      <Smartphone className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">Install app</span>
      <span className="sm:hidden">Install</span>
    </button>
  );
}
