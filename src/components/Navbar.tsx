import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { Menu, X, Zap, MapPin, ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./Auth/AuthProvider";
import GoogleLoginModal from "./Auth/GoogleLoginModal";
import UserMenu from "./Auth/UserMenu";
import NotificationBell from "./NotificationBell";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { useT, useLang } from "@/lib/i18n";
import { requestNotificationPermission } from "@/lib/browserNotifications";
import { CITIES, getCityBySlug } from "@/lib/cities";
import { InstallPwaButton } from "@/components/InstallPwaButton";
import ThemeToggle from "@/components/ThemeToggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Kept lean by design: Trip Planner lives in the profile menu,
// and About + Contact are merged into a single About & Contact page.
const primaryLinks = [
  { to: "/", key: "nav.home" },
  { to: "/spots", key: "nav.findSpots" },
  { to: "/route", key: "nav.tripPlanner" },
  { to: "/host", key: "nav.becomeHost" },
  { to: "/how-it-works", key: "nav.howItWorks" },
];

const secondaryLinks = [
  { to: "/pricing", key: "nav.pricing" },
  { to: "/rescue", key: "nav.rescue" },
  { to: "/about-contact", key: "nav.aboutContact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const t = useT();
  const { lang, setLang } = useLang();

  // Auto-open the sign-in modal when a deep link arrives with ?signin
  useEffect(() => {
    if (searchParams.get("signin") && !loginModalOpen) {
      setLoginModalOpen(true);
      if (location.pathname === "/") {
        window.history.replaceState(null, "", "/");
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("signin")]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  // ── Browser Notification Permission Prompt ──────────────────────────────
  useEffect(() => {
    if (!user) return;
    if (!("Notification" in window)) return;

    if (Notification.permission === "default") {
      const toastId = toast("Get notified about your charging status", {
        description: "Enable notifications to receive updates when your charging spot or waitlist is ready.",
        action: {
          label: "Enable",
          onClick: async (e) => {
            e.preventDefault();
            const granted = await requestNotificationPermission();
            if (granted) {
              toast.success("Notifications enabled!", { id: toastId });
            } else {
              toast.error("Permission denied", { id: toastId });
            }
          },
        },
        duration: Infinity,
      });
    }
  }, [user]);

  return (
    <>
      <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-lg focus:bg-card focus:px-4 focus:py-3 focus:text-sm focus:font-semibold focus:text-foreground focus:shadow-xl">
        Skip to main content
      </a>
      <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "glass py-2 shadow-lg"
          : "bg-transparent py-2.5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 rounded-lg gradient-primary flex items-center justify-center shadow-lg group-hover:scale-105 transition-transform">
            <Zap className="w-4 h-4 text-primary-foreground fill-current" />
          </div>
          <span className="font-display font-black text-xl sm:text-2xl tracking-tight text-foreground">
            CHARGE<span className="text-primary">PUSH</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1 xl:gap-1.5 min-w-0">
          {primaryLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "px-2.5 py-2 rounded-lg text-xs xl:text-sm font-semibold transition-all duration-200 hover:bg-primary/10 hover:text-primary whitespace-nowrap",
                location.pathname === link.to
                  ? "text-primary bg-primary/10 shadow-sm"
                  : "text-muted-foreground"
              )}
              aria-current={location.pathname === link.to ? "page" : undefined}
            >
              {t(link.key)}
            </Link>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "inline-flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs xl:text-sm font-semibold text-muted-foreground transition-all hover:bg-primary/10 hover:text-primary"
                )}
                aria-label="More navigation links"
              >
                More <ChevronDown className="w-3.5 h-3.5 opacity-70" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {secondaryLinks.map((link) => (
                <DropdownMenuItem key={link.to} asChild>
                  <Link
                    to={link.to}
                    className={cn(
                      "w-full font-medium",
                      location.pathname === link.to ? "text-primary" : "text-foreground"
                    )}
                  >
                    {t(link.key)}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <div className="hidden lg:flex items-center gap-2 xl:gap-3 min-w-0">
          <InstallPwaButton />
          <CitySelector onNavigate={navigate} />
          {user ? (
            <>
              <NotificationBell />
              <UserMenu />
              <Link
                to="/spots"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs xl:text-sm whitespace-nowrap hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 btn-forward"
              >
                {t("common.findASpot")}
              </Link>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setLoginModalOpen(true)}
                className="font-semibold text-xs xl:text-sm px-3 whitespace-nowrap"
              >
                {t("nav.signIn")}
              </Button>
              <Link
                to="/spots"
                className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs xl:text-sm whitespace-nowrap hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 btn-forward"
              >
                {t("common.findASpot")}
              </Link>
            </>
          )}
        </div>

        {/* Tablet & Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={mobileOpen}
          aria-controls="mobile-navigation"
        >
          {mobileOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div id="mobile-navigation" className="lg:hidden absolute top-full left-0 right-0 glass border-t border-border animate-slide-down">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-1">
            <div className="flex items-center justify-end gap-2 mb-1">
              <button
                type="button"
                onClick={() => setLang(lang === "hi" ? "en" : "hi")}
                className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-border/70 bg-background/80 text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                aria-label="Toggle language between English and Hindi"
              >
                <span className={lang === "en" ? "text-primary" : "text-muted-foreground/70"}>EN</span>
                <span className="text-muted-foreground/50">|</span>
                <span className={lang === "hi" ? "text-primary" : "text-muted-foreground/70"}>हिं</span>
              </button>
            </div>
            {[...primaryLinks, ...secondaryLinks].map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-semibold transition-all",
                  location.pathname === link.to
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {t(link.key)}
              </Link>
            ))}
            <div className="px-4 py-2">
              <CitySelector onNavigate={navigate} compact />
            </div>
            <div className="px-4 py-2">
              <InstallPwaButton />
            </div>
            {user ? (
              <div className="mt-4 flex flex-col gap-3 px-4">
                <div className="flex items-center justify-between">
                  <NotificationBell />
                  <UserMenu />
                </div>
                <Link
                  to="/spots"
                  className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm text-center shadow-lg btn-forward"
                >
                  {t("common.findASpot")}
                </Link>
              </div>
            ) : (
              <div className="mt-4 flex flex-col gap-2 px-4">
                <Button
                  variant="ghost"
                  onClick={() => setLoginModalOpen(true)}
                  className="font-semibold text-sm justify-center"
                >
                  {t("nav.signIn")}
                </Button>
                <Link
                  to="/spots"
                  className="w-full px-5 py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm text-center shadow-lg btn-forward"
                >
                  {t("common.findASpot")}
                </Link>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Login Modal */}
      <GoogleLoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
      </header>
    </>
  );
}

/**
 * City selector dropdown: switches between active VoltSetu cities.
 * Highlighting inactive "coming soon" cities keeps the expansion roadmap
 * visible without routing to unavailable pages.
 */
export function CitySelector({
  onNavigate,
  compact = false,
}: {
  onNavigate: (path: string) => void;
  compact?: boolean;
}) {
  const currentSlug = CITIES.find((c) => c.active && window.location.pathname === `/city/${c.slug}`)?.slug ?? "kolhapur";
  const current = getCityBySlug(currentSlug) ?? CITIES[0];

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          className={cn(
            "inline-flex items-center gap-1.5 rounded-xl border border-border bg-card px-2.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:border-primary/40 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            compact && "w-full justify-start rounded-lg"
          )}
          aria-label="Choose a city"
        >
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>{current.name}</span>
          <ChevronDown className="w-3.5 h-3.5 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 max-h-80 overflow-y-auto">
        {CITIES.map((city) =>
          city.active ? (
            <DropdownMenuItem
              key={city.slug}
              onClick={() => onNavigate(`/city/${city.slug}`)}
              className="cursor-pointer"
            >
              <MapPin className="w-4 h-4 mr-1 text-primary" />
              {city.name}
              {city.launch && (
                <span className="ml-auto text-[10px] font-semibold text-ev-green bg-ev-green/15 px-1.5 py-0.5 rounded-full">Launch</span>
              )}
            </DropdownMenuItem>
          ) : (
            <div key={city.slug} className="px-2 py-1.5 text-xs text-muted-foreground/70 flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 opacity-60" />
              {city.name}
              <span className="ml-auto text-[10px] bg-muted px-1.5 py-0.5 rounded-full">Coming soon</span>
            </div>
          )
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
