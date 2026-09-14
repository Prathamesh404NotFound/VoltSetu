import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "./Auth/AuthProvider";

/**
 * Shared authentication guard used by authenticated pages.
 *
 * Unauthenticated visitors are redirected to /?signin=1 so the Navbar
 * auto-opens the sign-in modal, with the original path encoded as
 * ?redirect=X so the user can be returned after successful login.
 */
export default function AuthenticatedRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" aria-live="polite">
        Loading your account…
      </div>
    );
  }

  if (!user) {
    const redirect = encodeURIComponent(location.pathname + location.search);
    return <Navigate to={`/?signin=1&redirect=${redirect}`} replace />;
  }

  return <>{children}</>;
}
