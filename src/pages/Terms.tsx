import { Link } from "react-router-dom";
import { FileText, Mail } from "lucide-react";
import SEO from "@/components/SEO";

export default function Terms() {
  return (
    <>
      <SEO
        title="Terms of Service — ChargePush"
        description="ChargePush Terms of Service. Rules and obligations for riders and hosts using the ChargePush EV charging access network."
        noindex={false}
      />
      <main className="min-h-screen pt-28 pb-24">
        <div className="page-shell">
          <div className="max-w-3xl mx-auto">
            {/* Header */}
            <div className="flex items-center gap-3 mb-8">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <FileText className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-primary mb-1">Legal</p>
                <h1 className="text-3xl font-black tracking-tight text-foreground">Terms of Service</h1>
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-10">Last updated: September 2026</p>

            <div className="space-y-10 text-foreground/80 leading-relaxed">
              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">1. The ChargePush Platform</h2>
                <p>
                  ChargePush operates a marketplace platform connecting EV riders ("Riders") with people
                  who provide charging access ("Hosts"). ChargePush is a platform intermediary — we
                  facilitate connections between Riders and Hosts but are not the provider of the charging
                  access itself.
                </p>
                <p className="mt-3">
                  By creating an account and using ChargePush, you agree to these Terms. If you do not
                  agree, do not use the platform.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">2. Eligibility</h2>
                <p>
                  You must be at least 18 years old to use ChargePush. By signing in, you confirm that
                  you meet this requirement.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">3. Rider Obligations</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Provide accurate information when requesting a charge</li>
                  <li>Arrive within the agreed booking window</li>
                  <li>Use only the connector/outlet type agreed in the booking</li>
                  <li>Leave the host's premises respectfully</li>
                  <li>Do not misrepresent vehicle type or connector requirements</li>
                  <li>Pay session fees as agreed through the platform</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">4. Host Obligations</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Provide accurate information about your charging access (location, outlet type, availability)</li>
                  <li>Maintain your availability settings to reflect actual availability</li>
                  <li>Respond to booking requests promptly</li>
                  <li>Ensure the charging access is safe, functional, and as described</li>
                  <li>Complete the ChargePush verification process before your listing becomes visible</li>
                  <li>Not discriminate against Riders on prohibited grounds</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">5. Booking and Cancellation</h2>
                <p>
                  Booking requests are confirmed only when a Host accepts the request. A pending request
                  is not a guarantee of availability.
                </p>
                <p className="mt-3">
                  Cancellation policies are set at the platform level. Either party may cancel before
                  the session begins. Repeated cancellations may result in account review.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">6. Payments</h2>
                <p>
                  Session fees are charged through the ChargePush platform. ChargePush charges a platform
                  fee on completed sessions. Exact fee percentages are available on the{" "}
                  <Link to="/pricing" className="text-primary hover:underline">Pricing page</Link>.
                </p>
                <p className="mt-3">
                  ChargePush does not guarantee any specific earnings for Hosts. Earnings depend on
                  session volume, pricing set by the Host, and platform fees.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">7. Verification</h2>
                <p>
                  ChargePush reviews Host listings before they are marked as Verified. Verification
                  confirms identity, location accuracy, and charging access suitability as described.
                  Verification does not constitute an endorsement or safety guarantee.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">8. Prohibited Conduct</h2>
                <ul className="space-y-2 list-disc list-inside">
                  <li>Fraudulent bookings or misrepresentation</li>
                  <li>Using the platform to circumvent fees</li>
                  <li>Harassment of Riders or Hosts</li>
                  <li>Creating multiple accounts to abuse platform policies</li>
                  <li>Listing charging access you do not own or have permission to list</li>
                </ul>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">9. Limitation of Liability</h2>
                <p>
                  ChargePush is not liable for damage to vehicles, disputes between Riders and Hosts,
                  charging equipment failure, or losses arising from unavailable charging access.
                  Use the platform at your own risk.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">10. Changes to Terms</h2>
                <p>
                  We may update these Terms. Continued use of ChargePush after changes constitutes
                  acceptance of the updated Terms.
                </p>
              </section>

              <section>
                <h2 className="text-xl font-bold text-foreground mb-3">11. Contact</h2>
                <div className="flex items-center gap-2 mt-2">
                  <Mail className="w-4 h-4 text-primary" />
                  <a href="mailto:hello@chargepush.com" className="text-primary font-medium hover:underline">
                    hello@chargepush.com
                  </a>
                </div>
              </section>
            </div>

            <div className="mt-12 pt-8 border-t border-border flex gap-4 text-sm">
              <Link to="/privacy" className="text-primary hover:underline font-medium">Privacy Policy</Link>
              <Link to="/help" className="text-primary hover:underline font-medium">Help & Safety</Link>
              <Link to="/" className="text-muted-foreground hover:text-foreground">Back to Home</Link>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}
