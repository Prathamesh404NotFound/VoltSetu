import { useState } from "react";
import {
  Target, Eye, Leaf, Users, Heart, Lightbulb, Globe, TrendingUp,
  Phone, MessageCircle, Mail, MapPin, Clock, Shield, ArrowRight, Loader2, CheckCircle2,
} from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import FAQAccordion from "@/components/FAQAccordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ResponsiveContainer from "@/components/ui/responsive-container";
import aboutImg from "@/assets/about-community.jpg";
import CTABanner from "@/components/CTABanner";
import SEO from "@/components/SEO";
import { database } from "@/lib/firebase-services";
import { ref, push, set as firebaseSet, serverTimestamp } from "firebase/database";

const contactFaqs = [
  { q: "How quickly do you respond?", a: "We aim to respond within 2-4 hours during business hours. WhatsApp queries typically get faster responses." },
  { q: "Can I visit your office?", a: "We operate as a digital-first company. For in-person queries, please schedule a meeting through our contact form." },
  { q: "I have a complaint about a host/rider", a: "Please use the contact form with the subject 'Complaint' and include the session details. We take safety and trust very seriously." },
];

interface ContactFormData {
  fullName: string;
  phone: string;
  email: string;
  area: string;
  message: string;
}

export default function AboutContact() {
  useScrollReveal();
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: "",
    phone: "",
    email: "",
    area: "",
    message: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.fullName.trim()) {
      toast.error("Please enter your full name");
      return;
    }
    if (!formData.phone.trim()) {
      toast.error("Please enter your phone number");
      return;
    }
    if (!formData.email.trim()) {
      toast.error("Please enter your email address");
      return;
    }
    if (!formData.area.trim()) {
      toast.error("Please enter your area or city");
      return;
    }
    if (!formData.message.trim()) {
      toast.error("Please enter your message");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ""))) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsSubmitting(true);
    try {
      const contactsRef = ref(database, "contacts");
      const newContactRef = push(contactsRef);
      await firebaseSet(newContactRef, {
        ...formData,
        status: "pending",
        submittedAt: serverTimestamp(),
        userAgent: navigator.userAgent,
        source: "about_contact_form",
      });
      setIsSubmitted(true);
      toast.success("Message sent successfully! We'll get back to you soon.");
      setFormData({ fullName: "", phone: "", email: "", area: "", message: "" });
      setTimeout(() => setIsSubmitted(false), 5000);
    } catch {
      toast.error("Failed to send message. Please try again or contact us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24">
      <SEO
        title="About & Contact ChargePush — Keep Moving"
        description="Learn how ChargePush is building a distributed EV charging access network across India, and get in touch with our team via phone, WhatsApp, email or contact form."
      />

      {/* ── About: Hero ── */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute top-20 right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl animate-blob" />
        <div className="container mx-auto px-4 relative z-10">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-display font-bold text-3xl md:text-5xl text-white leading-tight mb-6">
                Powering Electric Mobility,{" "}
                <span className="text-gradient">One Neighborhood at a Time</span>
              </h1>
              <p className="text-lg text-white/70 leading-relaxed">
                ChargePush was born from a simple observation: EV riders struggle to find nearby charging access, while homeowners and local businesses have unused electricity outlets. We connect them so everyone can keep moving.
              </p>
            </div>
            <div className="hidden lg:block">
              <img src={aboutImg} alt="Community of EV riders" className="rounded-3xl shadow-2xl animate-float" loading="lazy" width={1280} height={720} />
            </div>
          </div>
        </div>
      </section>

      {/* ── About: Story ── */}
      <section className="py-20">
        <ResponsiveContainer size="md" className="py-8">
          <div className="max-w-3xl mx-auto">
            <div className="reveal">
              <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-6 text-center">Our Philosophy</h2>
              <div className="prose prose-lg text-muted-foreground mx-auto text-center">
                <p>
                  The battery is not the destination. Charging is what keeps the journey moving. In cities and towns across India, EV adoption is booming, but accessible charging options haven't kept pace.
                </p>
                <p>
                  We realized the solution was already in place: homes, local shops, and community spots with existing power outlets sitting idle. By uniting them into a single accessible network, charging becomes effortless.
                </p>
                <p>
                  That is how ChargePush was born. A distributed EV charging network where riders quickly locate, book, and charge, while hosts earn from sharing power and supporting their local neighborhood.
                </p>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* ── About: Mission & Vision ── */}
      <section className="py-20 bg-soft-gray">
        <ResponsiveContainer size="md" className="py-8">
          <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <div className="reveal p-8 rounded-2xl bg-card border border-border shadow-sm">
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <Target className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-3">Our Mission</h3>
              <p className="text-muted-foreground leading-relaxed">
                To make EV charging accessible, affordable, and available in every Indian neighborhood by empowering homeowners to become part of the charging infrastructure.
              </p>
            </div>
            <div className="reveal p-8 rounded-2xl bg-card border border-border shadow-sm" style={{ transitionDelay: "0.1s" }}>
              <div className="w-12 h-12 rounded-xl gradient-green flex items-center justify-center mb-4">
                <Eye className="w-6 h-6 text-white" />
              </div>
              <h3 className="font-display font-bold text-xl text-foreground mb-3">Our Vision</h3>
              <p className="text-muted-foreground leading-relaxed">
                A future where every street in India has a charging point, powered by community participation and clean energy, making EV ownership seamless for everyone.
              </p>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* ── About: Why It Matters ── */}
      <section className="py-20">
        <ResponsiveContainer size="xl" className="py-8">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              Why This Matters in Indian Neighborhoods
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6 reveal">
            {[
              { icon: Globe, title: "Access Gap", desc: "Most Tier 2 and Tier 3 cities lack accessible public EV charging points." },
              { icon: TrendingUp, title: "Growing Demand", desc: "EV adoption is accelerating rapidly across India." },
              { icon: Users, title: "Community Power", desc: "Distributed charging networks empower host communities." },
              { icon: Leaf, title: "Green Impact", desc: "Every charge on ChargePush reduces emissions and keeps electric mobility moving." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="p-6 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg transition-all hover:-translate-y-1" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-2">{item.title}</h3>
                  <p className="text-sm text-muted-foreground">{item.desc}</p>
                </div>
              );
            })}
          </div>
        </ResponsiveContainer>
      </section>

      {/* ── About: Philosophy ── */}
      <section className="py-20 bg-soft-gray">
        <ResponsiveContainer size="md" className="py-8">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
              What We Believe In
            </h2>
          </div>
          <div className="grid sm:grid-cols-2 gap-6 reveal">
            {[
              { icon: Heart, title: "Trust First", desc: "Everything we build starts with trust between riders and hosts." },
              { icon: Lightbulb, title: "Simplicity", desc: "Charging should be as easy as plugging in your phone." },
              { icon: Users, title: "Community", desc: "Neighborhoods thrive when people help each other." },
              { icon: Leaf, title: "Sustainability", desc: "Every small step toward clean mobility counts." },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <div key={i} className="flex gap-4 p-6 rounded-2xl bg-card border border-border" style={{ transitionDelay: `${i * 0.1}s` }}>
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-foreground mb-1">{item.title}</h3>
                    <p className="text-sm text-muted-foreground">{item.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </ResponsiveContainer>
      </section>

      {/* ── Contact: Quick contact cards ── */}
      <section className="py-12">
        <ResponsiveContainer size="lg" className="py-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Phone, label: "Call Us", value: "+91 98765 43210", href: "tel:+919876543210", color: "primary" },
              { icon: MessageCircle, label: "WhatsApp", value: "Chat Now", href: "https://wa.me/919876543210", color: "green" },
              { icon: Mail, label: "Email", value: "support@chargepush.com", href: "mailto:support@chargepush.com", color: "primary" },
              { icon: Clock, label: "Hours", value: "Mon-Sat, 9am-7pm", href: "#", color: "primary" },
            ].map((item, i) => {
              const Icon = item.icon;
              return (
                <a
                  key={i}
                  href={item.href}
                  target={item.href.startsWith("http") ? "_blank" : undefined}
                  rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                  className="reveal flex items-center gap-4 p-5 rounded-2xl bg-card border border-border shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all"
                  style={{ transitionDelay: `${i * 0.1}s` }}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color === "green" ? "gradient-green" : "gradient-primary"}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">{item.label}</div>
                    <div className="text-sm font-semibold text-foreground">{item.value}</div>
                  </div>
                </a>
              );
            })}
          </div>
        </ResponsiveContainer>
      </section>

      {/* ── Contact: Form + sidebar ── */}
      <section className="py-20">
        <ResponsiveContainer size="xl" className="py-8">
          <div className="grid lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
            <div className="lg:col-span-3 reveal">
              <h2 className="font-display font-bold text-2xl text-foreground mb-6">Send Us a Message</h2>

              {isSubmitted ? (
                <div className="text-center py-12">
                  <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-foreground mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-6">
                    Thank you for contacting us. We'll get back to you within 2-4 hours.
                  </p>
                  <Button
                    onClick={() => setIsSubmitted(false)}
                    className="px-8 py-4 rounded-xl bg-primary text-primary-foreground font-semibold text-sm"
                  >
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-5">
                  <div className="grid sm:grid-cols-2 gap-5">
                    <div>
                      <Label htmlFor="ac-fullName" className="block text-sm font-medium text-foreground mb-2">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="ac-fullName"
                        name="fullName"
                        type="text"
                        placeholder="Your name"
                        value={formData.fullName}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                    <div>
                      <Label htmlFor="ac-phone" className="block text-sm font-medium text-foreground mb-2">
                        Phone <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="ac-phone"
                        name="phone"
                        type="tel"
                        placeholder="+91 98765 43210"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                        disabled={isSubmitting}
                        required
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="ac-email" className="block text-sm font-medium text-foreground mb-2">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="ac-email"
                      name="email"
                      type="email"
                      placeholder="you@example.com"
                      value={formData.email}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ac-area" className="block text-sm font-medium text-foreground mb-2">
                      Area / City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="ac-area"
                      name="area"
                      type="text"
                      placeholder="Your area, city"
                      value={formData.area}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="ac-message" className="block text-sm font-medium text-foreground mb-2">
                      Message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="ac-message"
                      name="message"
                      rows={4}
                      placeholder="How can we help you?"
                      value={formData.message}
                      onChange={handleInputChange}
                      className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-primary"
                      disabled={isSubmitting}
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-8 py-4 rounded-xl gradient-primary text-white font-semibold text-sm shadow-lg hover:opacity-90 transition-all flex items-center gap-2"
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        Send Message <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </Button>
                </form>
              )}
            </div>

            {/* Sidebar */}
            <div className="lg:col-span-2 space-y-6 reveal-right">
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <MapPin className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-foreground">Service Areas</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Currently serving Bangalore, Pune, Hyderabad, Chennai, Mumbai, Delhi NCR, and 45+ other cities across India. Expanding daily.
                </p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Clock className="w-5 h-5 text-primary" />
                  <h3 className="font-display font-semibold text-foreground">Support Hours</h3>
                </div>
                <p className="text-sm text-muted-foreground">Monday - Saturday: 9 AM - 7 PM IST</p>
                <p className="text-sm text-muted-foreground">Sunday: Emergency support only</p>
              </div>
              <div className="p-6 rounded-2xl bg-card border border-border">
                <div className="flex items-center gap-3 mb-3">
                  <Shield className="w-5 h-5 text-ev-green" />
                  <h3 className="font-display font-semibold text-foreground">Trust & Safety</h3>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Your safety is our priority. All hosts are verified. All transactions are secure. Report any concerns and we act within 24 hours.
                </p>
              </div>
            </div>
          </div>
        </ResponsiveContainer>
      </section>

      {/* ── Contact: FAQ ── */}
      <section className="py-20 bg-soft-gray">
        <ResponsiveContainer size="md" className="py-8">
          <div className="text-center mb-12 reveal">
            <h2 className="font-display font-bold text-3xl text-foreground">Quick FAQ</h2>
          </div>
          <div className="max-w-2xl mx-auto reveal">
            <FAQAccordion faqs={contactFaqs} />
          </div>
        </ResponsiveContainer>
      </section>

      <CTABanner variant="dark" title="The ChargePush Network" subtitle="Be part of India's distributed EV charging access network." />
    </div>
  );
}
