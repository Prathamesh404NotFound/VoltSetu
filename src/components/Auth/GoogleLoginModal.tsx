import { useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useAuth } from "./AuthProvider";
import { Button } from "@/components/ui/button";

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function GoogleLoginModal({ isOpen, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  const { loginWithGoogle } = useAuth();

  const handleGoogleSignIn = async () => {
    setLoading(true);
    setError("");

    try {
      await loginWithGoogle();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Sign in to ChargePush"
      className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9999] overflow-y-auto animate-in fade-in-0 duration-200"
    >
      {/* Centering wrapper fills the full scrollable height so the card is always visible */}
      <div
        className="flex min-h-full items-center justify-center p-4 sm:p-6"
        onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      >
        <div className="bg-background rounded-3xl shadow-2xl w-full max-w-md relative border border-border/80 p-6 sm:p-8 animate-in zoom-in-95 duration-200">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted/80 transition-colors"
            aria-label="Close sign in dialog"
          >
            <X className="w-5 h-5" />
          </button>

          <div className="text-center mb-6">
            <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-500/25">
              <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            </div>
            <h2 className="font-display font-bold text-2xl text-foreground mb-1.5">
              Welcome to ChargePush
            </h2>
            <p className="text-sm text-muted-foreground">
              Sign in with Google to book charging spots &amp; manage host listings
            </p>
          </div>

          <div className="space-y-4">
            <Button
              onClick={handleGoogleSignIn}
              disabled={loading}
              className="w-full bg-white hover:bg-slate-50 text-slate-900 border border-slate-300 font-semibold py-3 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-md active:scale-98 cursor-pointer"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? "Signing in..." : "Continue with Google"}
            </Button>

            {error && (
              <div className="text-xs font-medium text-destructive bg-destructive/10 border border-destructive/20 p-3 rounded-xl">
                {error}
              </div>
            )}

            <div className="text-center pt-2">
              <p className="text-xs text-muted-foreground">
                By signing in, you agree to our Terms of Service and Privacy Policy
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}
