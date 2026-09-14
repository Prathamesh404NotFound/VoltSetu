import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Navigate, Route, Routes, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingButtons from "@/components/FloatingButtons";
import AdminRoute from "@/components/Admin/AdminRoute";
import AuthenticatedRoute from "@/components/AuthenticatedRoute";
import AdminLayoutPage from "@/components/Admin/AdminLayoutPage";
import { AuthProvider, useAuth } from "@/components/Auth/AuthProvider";
import { LanguageProvider } from "@/lib/i18n";

import { LazyPage } from "@/components/LazyPage";
import NotFound from "./pages/NotFound";
import '@/styles/responsive.css';

// ─────────────────────────────────────────────────────────────────────────────
// Route-level code splitting: each page below loads on demand so the initial
// JS bundle stays small. The heavy admin section gets its own chunks that
// only load for /admin routes.
// ─────────────────────────────────────────────────────────────────────────────
const lazyIndex = () => import("./pages/Index");
const lazyFindSpots = () => import("./pages/FindSpots");
const lazyBecomeHost = () => import("./pages/BecomeHost");
const lazyHowItWorks = () => import("./pages/HowItWorks");
const lazyPricing = () => import("./pages/Pricing");
const lazyCityPage = () => import("./pages/CityPage");
const lazyEmergencyRescue = () => import("./pages/EmergencyRescue");
const lazyAboutContact = () => import("./pages/AboutContact");
const lazyDashboard = () => import("./pages/Dashboard");
const lazyBookingHistory = () => import("./pages/BookingHistory");
const lazyEarnings = () => import("./pages/Earnings");
const lazySettings = () => import("./pages/Settings");
const lazySavedSpots = () => import("./pages/SavedSpots");
const lazyAdminDashboard = () => import("./pages/Admin/AdminDashboardPage");
const lazyAdminUsers = () => import("./pages/Admin/AdminUsersPage");
const lazyAdminSpots = () => import("./pages/Admin/AdminSpotsPage");
const lazyAdminRequests = () => import("./pages/Admin/AdminRequestsPage");
const lazyAdminAnalytics = () => import("./pages/Admin/AdminAnalyticsPage");
const lazyAdminPayouts = () => import("./pages/Admin/AdminPayoutsPage");
const lazyAdminVerifications = () => import("./pages/Admin/AdminVerificationsPage");
const lazyAdminListingReviews = () => import("./pages/Admin/AdminListingReviewsPage");
const lazyAdminAnomaly = () => import("./pages/Admin/AdminAnomalyPage");
const lazyAdminNetworkStations = () => import("./pages/Admin/AdminNetworkStationsPage");
const lazyReferralAdmin = () => import("./pages/admin/ReferralAdmin");
const lazyAdminHeatmap = () => import("./pages/admin/DemandHeatmap");
const lazyAdminModeration = () => import("./pages/admin/AdminModerationPage");
const lazyAdminNotifications = () => import("./pages/admin/AdminNotificationsPage");
const lazyAdminCityWaitlist = () => import("./pages/Admin/AdminCityWaitlistPage");
const lazyLoyalty = () => import("./pages/Loyalty");
const lazyTripPlanner = () => import("./pages/TripPlannerPage");
const lazyHostProfile = () => import("./pages/HostProfile");
const lazyPrivacy = () => import("./pages/Privacy");
const lazyTerms = () => import("./pages/Terms");
const lazyHelp = () => import("./pages/Help");

const queryClient = new QueryClient();

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}


function AppContent() {
  const location = useLocation();
  const isAdmin = location.pathname.startsWith("/admin");

  // native notification listener
  useEffect(() => {
    if (!Capacitor.isNativePlatform()) return;

    let handle: any;

    const setupListener = async () => {
      handle = await LocalNotifications.addListener('localNotificationActionPerformed', (notification) => {
        console.log('Notification action performed', notification);
        const { onClick } = notification.notification.extra || {};
        if (typeof onClick === 'function') {
          onClick();
        }
      });
    };

    setupListener();

    return () => {
      if (handle) handle.remove();
    };
  }, []);

  return (
    <>
      {!isAdmin && <Navbar />}
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LazyPage load={lazyIndex} />} />
        <Route path="/spots" element={<LazyPage load={lazyFindSpots} />} />
        <Route path="/host" element={<LazyPage load={lazyBecomeHost} />} />
        <Route path="/how-it-works" element={<LazyPage load={lazyHowItWorks} />} />
        <Route path="/pricing" element={<LazyPage load={lazyPricing} />} />
        <Route path="/kolhapur" element={<Navigate to="/city/kolhapur" replace />} />
        <Route path="/city/:slug" element={<LazyPage load={lazyCityPage} />} />
        <Route path="/rescue" element={<LazyPage load={lazyEmergencyRescue} />} />

        <Route path="/route" element={<LazyPage load={lazyTripPlanner} />} />
        {/* Legacy URL backward-compatibility redirects */}
        <Route path="/trip-planner" element={<Navigate to="/route" replace />} />
        <Route path="/emergency" element={<Navigate to="/rescue" replace />} />
        <Route path="/about-contact" element={<LazyPage load={lazyAboutContact} />} />
        <Route path="/about" element={<Navigate to="/about-contact" replace />} />
        <Route path="/contact" element={<Navigate to="/about-contact" replace />} />
        {/* Legal pages */}
        <Route path="/privacy" element={<LazyPage load={lazyPrivacy} />} />
        <Route path="/terms" element={<LazyPage load={lazyTerms} />} />
        <Route path="/help" element={<LazyPage load={lazyHelp} />} />
        <Route path="/dashboard" element={
          <AuthenticatedRoute>
            <main className="min-h-screen pt-24 responsive-container container-lg">
              <LazyPage load={lazyDashboard} />
            </main>
          </AuthenticatedRoute>
        } />
        <Route path="/dashboard/bookings" element={
          <AuthenticatedRoute>
            <main className="min-h-screen pt-24 responsive-container container-lg">
              <LazyPage load={lazyBookingHistory} />
            </main>
          </AuthenticatedRoute>
        } />
        <Route path="/dashboard/earnings" element={
          <AuthenticatedRoute>
            <main className="min-h-screen pt-24 responsive-container container-lg">
              <LazyPage load={lazyEarnings} />
            </main>
          </AuthenticatedRoute>
        } />
        <Route path="/dashboard/settings" element={
          <AuthenticatedRoute>
            <main className="min-h-screen pt-24 responsive-container container-lg">
              <LazyPage load={lazySettings} />
            </main>
          </AuthenticatedRoute>
        } />
        <Route path="/saved" element={
          <AuthenticatedRoute>
            <main className="min-h-screen pt-24 responsive-container container-lg">
              <LazyPage load={lazySavedSpots} />
            </main>
          </AuthenticatedRoute>
        } />
        <Route path="/loyalty" element={
          <AuthenticatedRoute>
            <main className="min-h-screen pt-24 responsive-container container-lg">
              <LazyPage load={lazyLoyalty} />
            </main>
          </AuthenticatedRoute>
        } />
        <Route path="/host/:hostId" element={
          <main className="min-h-screen pt-24 responsive-container container-lg">
            <LazyPage load={lazyHostProfile} />
          </main>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayoutPage />
          </AdminRoute>
        }>
          <Route index element={<LazyPage load={lazyAdminDashboard} />} />
          <Route path="users" element={<LazyPage load={lazyAdminUsers} />} />
          <Route path="spots" element={<LazyPage load={lazyAdminSpots} />} />
          <Route path="network-stations" element={<LazyPage load={lazyAdminNetworkStations} />} />
          <Route path="requests" element={<LazyPage load={lazyAdminRequests} />} />
          <Route path="analytics" element={<LazyPage load={lazyAdminAnalytics} />} />
          <Route path="payouts" element={<LazyPage load={lazyAdminPayouts} />} />
          <Route path="verifications" element={<LazyPage load={lazyAdminVerifications} />} />
          <Route path="listing-reviews" element={<LazyPage load={lazyAdminListingReviews} />} />
          <Route path="referrals" element={<LazyPage load={lazyReferralAdmin} />} />
          <Route path="moderation" element={<LazyPage load={lazyAdminModeration} />} />
          <Route path="notifications" element={<LazyPage load={lazyAdminNotifications} />} />
          <Route path="city-waitlist" element={<LazyPage load={lazyAdminCityWaitlist} />} />
          <Route path="anomaly" element={<LazyPage load={lazyAdminAnomaly} />} />
          <Route path="heatmap" element={<LazyPage load={lazyAdminHeatmap} />} />
          <Route path="settings" element={<LazyPage load={lazyAdminDashboard} />} />
        </Route>

        {/* 404 Route */}
        <Route path="*" element={
          <main className="min-h-screen pt-24 responsive-container container-lg">
            <NotFound />
          </main>
        } />
      </Routes>
      {!isAdmin && <Footer />}
      {!isAdmin && <FloatingButtons />}
    </>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <LanguageProvider>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <div id="main-content" className="min-h-screen">
            <AppContent />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
    </LanguageProvider>
  </QueryClientProvider>
);

export default App;
