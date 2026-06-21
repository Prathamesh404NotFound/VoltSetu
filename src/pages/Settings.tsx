import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import {
  ArrowLeft, User as UserIcon, Bell, LogOut, Save, Loader2,
  Phone, Mail, Shield, Trash2, CheckCircle2
} from "lucide-react";
import { useAuth } from "@/components/Auth/AuthProvider";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getUserProfile, updateUserProfile, updateNotificationPrefs, UserProfile } from "@/lib/userService";
import { toast } from "sonner";
import { updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase-services";
import GoogleLoginModal from "@/components/Auth/GoogleLoginModal";
import SEO from "@/components/SEO";
import type { User } from "@/types";

export default function Settings() {
  const { user, logout } = useAuth() as { user: User | null; logout: () => Promise<void> };
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

  // Local editable state
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [notifPrefs, setNotifPrefs] = useState<UserProfile["preferences"]["notifications"]>({
    email: true, push: true, sms: false,
    newSpots: true, requestUpdates: true, promotions: false,
  });

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    getUserProfile(user.id)
      .then((p) => {
        setProfile(p);
        setDisplayName(p.displayName || user.displayName || "");
        setPhone(p.phone || "");
        setNotifPrefs(p.preferences?.notifications ?? notifPrefs);
      })
      .catch(() => toast.error("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [user]);

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      // Update Firebase Auth display name
      if (auth.currentUser && displayName !== user.displayName) {
        await updateProfile(auth.currentUser, { displayName });
      }
      // Update RTDB profile
      await updateUserProfile(user.id, { displayName, phone });
      toast.success("Profile updated successfully!");
    } catch {
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const saveNotifications = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateNotificationPrefs(user.id, notifPrefs);
      toast.success("Notification preferences saved!");
    } catch {
      toast.error("Failed to save preferences.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
      toast.success("Signed out successfully.");
    } catch {
      toast.error("Sign out failed.");
    }
  };

  if (!user) return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <div className="text-center space-y-4">
        <Shield className="w-16 h-16 text-muted-foreground mx-auto" />
        <h2 className="font-display font-bold text-2xl text-foreground">Sign in to access settings</h2>
        <Button onClick={() => setShowLogin(true)}>Sign In</Button>
      </div>
      <GoogleLoginModal isOpen={showLogin} onClose={() => setShowLogin(false)} />
    </div>
  );

  if (loading) return (
    <div className="pt-24 pb-16 min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  return (
    <div className="pt-24 pb-16">
      <SEO 
        title="Account Settings | VoltSetu"
        description="Update your profile, phone number, and notification preferences. Manage your security and account details."
        noindex={true}
      />
      <div className="container mx-auto px-4 max-w-2xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="w-5 h-5" /></Link>
          </Button>
          <div>
            <h1 className="font-display font-bold text-3xl text-foreground">Settings</h1>
            <p className="text-muted-foreground text-sm">Manage your account preferences</p>
          </div>
        </div>

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid grid-cols-3 w-full">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="notifications">Notifications</TabsTrigger>
            <TabsTrigger value="account">Account</TabsTrigger>
          </TabsList>

          {/* ── Profile Tab ── */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserIcon className="w-5 h-5 text-primary" />Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-5">
                {/* Avatar */}
                <div className="flex items-center gap-4">
                  {user.photoURL ? (
                    <img src={user.photoURL} alt={user.displayName || ""} className="w-16 h-16 rounded-full object-cover border-2 border-border" />
                  ) : (
                    <div className="w-16 h-16 rounded-full gradient-green flex items-center justify-center text-white font-bold text-2xl">
                      {(user.displayName || user.email || "U")[0].toUpperCase()}
                    </div>
                  )}
                  <div>
                    <p className="font-semibold text-foreground">{user.displayName || "User"}</p>
                    <p className="text-sm text-muted-foreground">{user.email}</p>
                    {profile?.role && (
                      <span className="inline-block mt-1 text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium capitalize">{profile.role}</span>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Display Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input type="text" value={displayName} onChange={e => setDisplayName(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground text-sm"
                      placeholder="Your name" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Email Address</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input type="email" value={user.email || ""} disabled
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl bg-muted text-muted-foreground text-sm cursor-not-allowed" />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Email is managed by your Google account.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                    <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                      className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground text-sm"
                      placeholder="+91 98765 43210" />
                  </div>
                </div>

                <Button onClick={saveProfile} disabled={saving} className="w-full gradient-green hover:opacity-90">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : <><Save className="w-4 h-4 mr-2" />Save Profile</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Notifications Tab ── */}
          <TabsContent value="notifications">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5 text-primary" />Notification Preferences
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {([
                  { key: "email", label: "Email Notifications", desc: "Receive updates via email" },
                  { key: "push", label: "Push Notifications", desc: "Browser push alerts" },
                  { key: "sms", label: "SMS Alerts", desc: "Text messages to your phone" },
                  { key: "newSpots", label: "New Spots Nearby", desc: "When new charging spots open near you" },
                  { key: "requestUpdates", label: "Request Updates", desc: "Booking approval / rejection alerts" },
                  { key: "promotions", label: "Promotions", desc: "Special offers and discounts" },
                ] as { key: keyof typeof notifPrefs; label: string; desc: string }[]).map(({ key, label, desc }) => (
                  <div key={key} className="flex items-center justify-between p-4 rounded-xl border border-border hover:bg-muted/30 transition-colors">
                    <div>
                      <p className="text-sm font-medium text-foreground">{label}</p>
                      <p className="text-xs text-muted-foreground">{desc}</p>
                    </div>
                    <button
                      onClick={() => setNotifPrefs(prev => ({ ...prev, [key]: !prev[key] }))}
                      className={`relative w-11 h-6 rounded-full transition-colors focus:outline-none ${notifPrefs[key] ? "bg-primary" : "bg-muted"}`}>
                      <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${notifPrefs[key] ? "translate-x-5" : "translate-x-0"}`} />
                    </button>
                  </div>
                ))}
                <Button onClick={saveNotifications} disabled={saving} className="w-full gradient-green hover:opacity-90">
                  {saving ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Saving...</> : <><CheckCircle2 className="w-4 h-4 mr-2" />Save Preferences</>}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Account Tab ── */}
          <TabsContent value="account">
            <div className="space-y-4">
              <Card>
                <CardContent className="p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-foreground">Account type</p>
                      <p className="text-sm text-muted-foreground capitalize">{profile?.role ?? "user"} account</p>
                    </div>
                    <span className="text-xs px-2.5 py-1 rounded-full bg-primary/10 text-primary font-medium capitalize">
                      {profile?.role ?? "user"}
                    </span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-foreground">Session</h3>
                  <Button variant="outline" className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={handleLogout}>
                    <LogOut className="w-4 h-4" />Sign Out
                  </Button>
                </CardContent>
              </Card>

              <Card className="border-red-200 dark:border-red-900">
                <CardContent className="p-5 space-y-3">
                  <h3 className="font-semibold text-red-600">Danger Zone</h3>
                  <p className="text-sm text-muted-foreground">Deleting your account is permanent and cannot be undone. All your data will be removed.</p>
                  <Button variant="outline" className="w-full justify-start gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    onClick={() => toast.error("Account deletion not available yet. Please contact support.")}>
                    <Trash2 className="w-4 h-4" />Delete Account
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
