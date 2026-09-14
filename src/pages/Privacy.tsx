import { Link } from "react-router-dom";
import { Shield, Mail } from "lucide-react";
import SEO from "@/components/SEO";

export default function Privacy() {
  return (
    <>
      <SEO
        title="Privacy Policy — ChargePush"
        description="ChargePush Privacy Policy. How we collect, use, and protect your personal data on the ChargePush EV charging network."
        noindex={false}
      />
      <main className="min-h-screen pt-28 pb-24">
        <div className="page-shell">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Shield className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Legal</p>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Privacy Policy</h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-10">Last updated: September 2026</p>

            <div className="space-y-10 text-foreground/80 leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">Who We Are</h2>
                <p>
                  ChargePush ("we", "our", "us") operates the ChargePush distributed EV charging-access
                  network and marketplace. We connect EV riders with charging access from home hosts, local
                  spots, and charging networks across India.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">Information We Collect</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Account information:</strong> Name and email address via Google Sign-In (managed by Google)</li>
                  <li><strong>Location data:</strong> Used only when you grant permission, to find nearby charging spots</li>
                  <li><strong>Booking and session history:</strong> Records of your charging requests and completed sessions</li>
                  <li><strong>Host information:</strong> For hosts, charging access details, availability settings, and payout information</li>
                  <li><strong>Device information:</strong> Browser type, PWA install status, for service delivery and support</li>
                  <li><strong>Notification preferences:</strong> If you grant notification permission, we send charging status updates</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">How We Use Your Information</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>To provide the ChargePush service — matching riders with available charging access</li>
                  <li>To process and manage booking requests between riders and hosts</li>
                  <li>To send important service notifications (booking confirmations, status updates)</li>
                  <li>To improve and personalise your experience on the platform</li>
                  <li>To calculate and display host earnings within the dashboard</li>
                  <li>To prevent fraud and maintain platform safety</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">Data Storage and Processors</h2>
                <p>
                  ChargePush uses <strong>Firebase (Google)</strong> for authentication, real-time database,
                  and hosting. Your data is stored on Google's infrastructure subject to Google's data
                  processing terms.
                </p>
                <p className="mt-3">
                  Payment processing (where applicable) is handled by third-party payment processors.
                  We do not store full card numbers.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">What We Do Not Do</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>We do not sell your personal data to third parties</li>
                  <li>We do not share your location history with advertisers</li>
                  <li>We do not use your data for purposes unrelated to the ChargePush service</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">Your Rights</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li><strong>Access:</strong> Request a copy of the personal data we hold about you</li>
                  <li><strong>Correction:</strong> Request correction of inaccurate data</li>
                  <li><strong>Deletion:</strong> Request deletion of your account and associated data</li>
                  <li><strong>Withdrawal of consent:</strong> Revoke location or notification permissions at any time via your device settings</li>
                </ul>
                <p className="mt-3">
                  To exercise these rights, email us at{" "}
                  <a href="mailto:hello@chargepush.com" className="text-primary font-medium hover:underline">
                    hello@chargepush.com
                  </a>
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">Cookies</h2>
                <p>
                  ChargePush uses essential cookies and local storage for authentication session management
                  and app preferences. We do not use third-party advertising cookies.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">Children's Privacy</h2>
                <p>
                  ChargePush is not directed at children under 18. We do not knowingly collect personal
                  data from minors.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">Changes to This Policy</h2>
                <p>
                  We may update this policy as the platform evolves. We will notify you of significant
                  changes via the app or email.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">Contact</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <a href="mailto:hello@chargepush.com" className="text-primary font-medium hover:underline">
                    hello@chargepush.com
                  </a>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-border flex gap-4 text-sm">
              <Link to="/terms" className="text-primary hover:underline font-medium">Terms of Service</Link>
              <Link to="/help" className="text-primary hover:underline font-medium">Help & Safety</Link>
              <Link to="/" className="text-muted-foreground hover:text-foreground">Back to Home</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
