import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Menu, X, Zap } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "./Auth/AuthProvider";
import GoogleLoginModal from "./Auth/GoogleLoginModal";
import UserMenu from "./Auth/UserMenu";
import NotificationBell from "./NotificationBell";
import { Button } from "@/components/ui/button";

const navLinks = [
  { to: "/", label: "Home" },
  { to: "/spots", label: "Find Spots" },
  { to: "/host", label: "Become a Host" },
  { to: "/how-it-works", label: "How It Works" },
  { to: "/pricing", label: "Pricing" },
  { to: "/about", label: "About" },
  { to: "/contact", label: "Contact" },
];

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [loginModalOpen, setLoginModalOpen] = useState(false);
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMobileOpen(false);
  }, [location]);

  return (
    <header
      className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "glass py-3 shadow-lg"
          : "bg-transparent py-5"
      )}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group flex-shrink-0">
          <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl gradient-primary flex items-center justify-center shadow-lg group-hover:shadow-primary/40 transition-shadow">
            <Zap className="w-4 h-4 sm:w-5 sm:h-5 text-primary-foreground" />
          </div>
          <span className="font-display font-bold text-lg sm:text-xl text-foreground">
            ChargeNest
          </span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden lg:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.to}
              to={link.to}
              className={cn(
                "px-3 lg:px-2.5 xl:px-4 py-2 rounded-lg text-sm lg:text-[13px] xl:text-sm font-medium transition-all duration-200 hover:bg-primary/10 hover:text-primary",
                location.pathname === link.to
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        <div className="hidden lg:flex items-center gap-1.5 xl:gap-3">
          {user ? (
            <>
              <NotificationBell />
              <UserMenu />
              <Link
                to="/spots"
                className="px-3 xl:px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs lg:text-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5 animate-glow"
              >
                Find a Spot
              </Link>
            </>
          ) : (
            <>
              <Button
                variant="ghost"
                onClick={() => setLoginModalOpen(true)}
                className="font-semibold text-xs lg:text-sm xl:text-base px-2.5 xl:px-4"
              >
                Sign In
              </Button>
              <Button
                onClick={() => setLoginModalOpen(true)}
                className="px-3 xl:px-5 py-2 rounded-xl bg-primary text-primary-foreground font-semibold text-xs lg:text-sm hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/30 hover:-translate-y-0.5"
              >
                Get Started
              </Button>
            </>
          )}
        </div>

        {/* Tablet & Mobile Toggle */}
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="lg:hidden p-2 rounded-lg hover:bg-muted transition-colors"
          aria-label="Toggle menu"
        >
          {mobileOpen ? <X className="w-5 h-5 sm:w-6 sm:h-6" /> : <Menu className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 glass border-t border-border animate-slide-down">
          <nav className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className={cn(
                  "px-4 py-3 rounded-lg text-sm font-medium transition-all",
                  location.pathname === link.to
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:bg-muted"
                )}
              >
                {link.label}
              </Link>
            ))}
            {user ? (
              <div className="mt-4 sm:mt-6 flex flex-col sm:flex-row items-center gap-3 px-4">
                <div className="flex items-center gap-2">
                  <NotificationBell />
                  <UserMenu />
                </div>
                <Link
                  to="/spots"
                  className="flex-1 px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm text-center"
                >
                  Find a Spot
                </Link>
              </div>
            ) : (
              <div className="mt-4 sm:mt-6 flex flex-col gap-2 px-4">
                <Button
                  variant="ghost"
                  onClick={() => setLoginModalOpen(true)}
                  className="font-semibold text-sm sm:text-base justify-center"
                >
                  Sign In
                </Button>
                <Button
                  onClick={() => setLoginModalOpen(true)}
                  className="px-5 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
                >
                  Get Started
                </Button>
              </div>
            )}
          </nav>
        </div>
      )}

      {/* Login Modal */}
      <GoogleLoginModal isOpen={loginModalOpen} onClose={() => setLoginModalOpen(false)} />
    </header>
  );
}
