import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
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
import AdminLayoutPage from "@/components/Admin/AdminLayoutPage";
import { AuthProvider } from "@/components/Auth/AuthProvider";
import Index from "./pages/Index";
import FindSpots from "./pages/FindSpots";
import BecomeHost from "./pages/BecomeHost";
import HowItWorks from "./pages/HowItWorks";
import Pricing from "./pages/Pricing";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Dashboard from "./pages/Dashboard";
import BookingHistory from "./pages/BookingHistory";
import Earnings from "./pages/Earnings";
import Settings from "./pages/Settings";
import NotFound from "./pages/NotFound";
import AdminDashboardPage from "./pages/Admin/AdminDashboardPage";
import AdminUsersPage from "./pages/Admin/AdminUsersPage";
import AdminSpotsPage from "./pages/Admin/AdminSpotsPage";
import AdminRequestsPage from "./pages/Admin/AdminRequestsPage";
import AdminAnalyticsPage from "./pages/Admin/AdminAnalyticsPage";
import AdminGovernmentStationsPage from "./pages/Admin/AdminGovernmentStationsPage";
import '@/styles/responsive.css';

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
        <Route path="/" element={<Index />} />
        <Route path="/spots" element={<FindSpots />} />
        <Route path="/host" element={<BecomeHost />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/about" element={<About />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/dashboard" element={
          <main className="min-h-screen pt-24 responsive-container container-lg">
            <Dashboard />
          </main>
        } />
        <Route path="/dashboard/bookings" element={
          <main className="min-h-screen pt-24 responsive-container container-lg">
            <BookingHistory />
          </main>
        } />
        <Route path="/dashboard/earnings" element={
          <main className="min-h-screen pt-24 responsive-container container-lg">
            <Earnings />
          </main>
        } />
        <Route path="/dashboard/settings" element={
          <main className="min-h-screen pt-24 responsive-container container-lg">
            <Settings />
          </main>
        } />

        {/* Admin Routes */}
        <Route path="/admin" element={
          <AdminRoute>
            <AdminLayoutPage />
          </AdminRoute>
        }>
          <Route index element={<AdminDashboardPage />} />
          <Route path="users" element={<AdminUsersPage />} />
          <Route path="spots" element={<AdminSpotsPage />} />
          <Route path="government-stations" element={<AdminGovernmentStationsPage />} />
          <Route path="requests" element={<AdminRequestsPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="settings" element={<AdminDashboardPage />} />
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
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <ScrollToTop />
          <div className="min-h-screen">
            <AppContent />
          </div>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
