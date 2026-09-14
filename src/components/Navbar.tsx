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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

// Kept clean & focused: Home is accessed via the logo.
const primaryLinks = [
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
            ? "glass py-2 shadow-md"
            : "bg-background/80 backdrop-blur-md border-b border-border/40 py-3"
        )}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2.5 group flex-shrink-0 mr-4">
            <div className="w-8 h-8 rounded-xl bg-primary flex items-center justify-center shadow-md shadow-primary/20 group-hover:scale-105 transition-transform">
              <Zap className="w-4 h-4 text-primary-foreground fill-current" />
            </div>
            <span className="font-display font-black text-xl tracking-tight text-foreground">
              CHARGE<span className="text-primary">PUSH</span>
            </span>
          </Link>

          {/* Desktop Nav - Floating Pill Style */}
          <nav className="hidden lg:flex items-center gap-1 bg-muted/60 p-1.5 rounded-full border border-border/50 shadow-inner min-w-0">
            {primaryLinks.map((link) => {
              const isActive = location.pathname === link.to;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "px-3.5 py-1.5 rounded-full text-xs xl:text-sm font-semibold transition-all duration-200 whitespace-nowrap",
                    isActive
                      ? "text-primary bg-background shadow-xs font-bold"
                      : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                  )}
                  aria-current={isActive ? "page" : undefined}
                >
                  {t(link.key)}
                </Link>
              );
            })}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button
                  className={cn(
                    "inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs xl:text-sm font-semibold text-muted-foreground hover:text-foreground hover:bg-background/50 transition-all"
                  )}
                  aria-label="More navigation links"
                >
                  More <ChevronDown className="w-3.5 h-3.5 opacity-70" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 rounded-xl p-1.5 shadow-lg">
                {secondaryLinks.map((link) => (
                  <DropdownMenuItem key={link.to} asChild className="rounded-lg">
                    <Link
                      to={link.to}
                      className={cn(
                        "w-full font-medium text-xs xl:text-sm px-3 py-2",
                        location.pathname === link.to ? "text-primary font-bold bg-primary/10" : "text-foreground"
                      )}
                    >
                      {t(link.key)}
                    </Link>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </nav>

          {/* Right Action Bar */}
          <div className="hidden lg:flex items-center gap-2 xl:gap-2.5 min-w-0">
            <CitySelector onNavigate={navigate} />
            <InstallPwaButton />

            {user ? (
              <div className="flex items-center gap-2 ml-1">
                <NotificationBell />
                <UserMenu />
                <Link
                  to="/spots"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs xl:text-sm whitespace-nowrap hover:bg-primary/90 transition-all shadow-md shadow-primary/25 hover:shadow-primary/40 active:scale-95"
                >
                  Request Access
                </Link>
              </div>
            ) : (
              <div className="flex items-center gap-1.5 ml-1">
                <Button
                  variant="ghost"
                  onClick={() => setLoginModalOpen(true)}
                  className="font-semibold text-xs xl:text-sm px-3.5 rounded-xl hover:bg-muted"
                >
                  {t("nav.signIn")}
                </Button>
                <Link
                  to="/spots"
                  className="px-4 py-2 rounded-xl bg-primary text-primary-foreground font-bold text-xs xl:text-sm whitespace-nowrap hover:bg-primary/90 transition-all shadow-md shadow-primary/25 hover:shadow-primary/40 active:scale-95"
                >
                  Request Access
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="lg:hidden p-2 rounded-xl border border-border/60 hover:bg-muted transition-colors"
            aria-label={mobileOpen ? "Close navigation menu" : "Open navigation menu"}
            aria-expanded={mobileOpen}
            aria-controls="mobile-navigation"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Drawer */}
        {mobileOpen && (
          <div id="mobile-navigation" className="lg:hidden absolute top-full left-0 right-0 glass border-b border-border animate-slide-down shadow-xl">
            <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col gap-1.5">
              <div className="flex items-center justify-between pb-2 border-b border-border/50">
                <CitySelector onNavigate={navigate} compact />
                <button
                  type="button"
                  onClick={() => setLang(lang === "hi" ? "en" : "hi")}
                  className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border/70 bg-card text-xs font-semibold text-foreground hover:bg-muted transition-colors"
                  aria-label="Toggle language between English and Hindi"
                >
                  <span className={lang === "en" ? "text-primary font-bold" : "text-muted-foreground"}>EN</span>
                  <span className="text-muted-foreground/40">|</span>
                  <span className={lang === "hi" ? "text-primary font-bold" : "text-muted-foreground"}>हिं</span>
                </button>
              </div>

              {[...primaryLinks, ...secondaryLinks].map((link) => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={cn(
                    "px-4 py-2.5 rounded-xl text-sm font-semibold transition-all",
                    location.pathname === link.to
                      ? "text-primary bg-primary/10 font-bold"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  {t(link.key)}
                </Link>
              ))}

              <div className="pt-2">
                <InstallPwaButton />
              </div>

              {user ? (
                <div className="mt-2 pt-3 border-t border-border/50 flex flex-col gap-3">
                  <div className="flex items-center justify-between px-1">
                    <NotificationBell />
                    <UserMenu />
                  </div>
                  <Link
                    to="/spots"
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm text-center shadow-md shadow-primary/25"
                  >
                    Request Access
                  </Link>
                </div>
              ) : (
                <div className="mt-2 pt-3 border-t border-border/50 flex flex-col gap-2">
                  <Button
                    variant="ghost"
                    onClick={() => setLoginModalOpen(true)}
                    className="font-semibold text-sm justify-center w-full rounded-xl"
                  >
                    {t("nav.signIn")}
                  </Button>
                  <Link
                    to="/spots"
                    className="w-full py-3 rounded-xl bg-primary text-primary-foreground font-bold text-sm text-center shadow-md shadow-primary/25"
                  >
                    Request Access
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
 * City selector dropdown: switches between active ChargePush cities.
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
            "inline-flex items-center gap-1.5 rounded-full border border-border/70 bg-card/80 backdrop-blur-xs px-3 py-1.5 text-xs font-semibold text-foreground hover:border-primary/40 hover:bg-card transition-all shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary",
            compact && "w-auto justify-start rounded-xl text-sm"
          )}
          aria-label="Choose a city"
        >
          <MapPin className="w-3.5 h-3.5 text-primary" />
          <span>{current.name}</span>
          <ChevronDown className="w-3 h-3 opacity-60" />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-52 max-h-80 overflow-y-auto rounded-xl p-1.5 shadow-lg">
        {CITIES.map((city) =>
          city.active ? (
            <DropdownMenuItem
              key={city.slug}
              onClick={() => onNavigate(`/city/${city.slug}`)}
              className="cursor-pointer rounded-lg text-xs py-2"
            >
              <MapPin className="w-3.5 h-3.5 mr-1.5 text-primary" />
              {city.name}
              {city.launch && (
                <span className="ml-auto text-[10px] font-bold text-ev-green bg-ev-green/15 px-1.5 py-0.5 rounded-full">Active</span>
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

