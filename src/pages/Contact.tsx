import { useState } from "react";
import { Phone, MessageCircle, Mail, MapPin, Clock, Shield, HelpCircle, ArrowRight, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import FAQAccordion from "@/components/FAQAccordion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import ResponsiveContainer from '@/components/ui/responsive-container';
import SEO from "@/components/SEO";
import { database, auth } from '@/lib/firebase-services';
import { ref, push, set as firebaseSet, serverTimestamp } from 'firebase/database';

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

export default function Contact() {
  useScrollReveal();
  const [formData, setFormData] = useState<ContactFormData>({
    fullName: '',
    phone: '',
    email: '',
    area: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation
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

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      toast.error("Please enter a valid email address");
      return;
    }

    // Phone validation (basic)
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    if (!phoneRegex.test(formData.phone.replace(/[\s\-\(\)]/g, ''))) {
      toast.error("Please enter a valid phone number");
      return;
    }

    setIsSubmitting(true);

    try {
      // Save to Firebase
      const contactsRef = ref(database, 'contacts');
      const newContactRef = push(contactsRef);

      await firebaseSet(newContactRef, {
        ...formData,
        status: 'pending',
        submittedAt: serverTimestamp(),
        userAgent: navigator.userAgent,
        source: 'contact_form'
      });

      // Send email notification (you would implement this with your email service)
      // For now, we'll just show success message

      setIsSubmitted(true);
      toast.success("Message sent successfully! We'll get back to you soon.");

      // Reset form
      setFormData({
        fullName: '',
        phone: '',
        email: '',
        area: '',
        message: ''
      });

      // Reset submitted state after 5 seconds
      setTimeout(() => setIsSubmitted(false), 5000);

    } catch (error) {
      console.error('Error submitting contact form:', error);
      toast.error("Failed to send message. Please try again or contact us directly.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="pt-24">
      <SEO 
        title="Contact VoltSetu — We're Here to Help"
        description="Have questions about charging, hosting, or technical support? Our team is available via WhatsApp, phone, and email to assist you 6 days a week."
      />
      {/* Hero */}
      <section className="py-20 gradient-hero relative overflow-hidden">
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-ev-green/15 rounded-full blur-3xl animate-blob" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <h1 className="font-display font-bold text-3xl md:text-5xl text-white mb-4">
            Get in Touch
          </h1>
          <p className="text-lg text-white/70 max-w-xl mx-auto">
            Have questions about charging, hosting, or the platform? We are here to help.
          </p>
        </div>
      </section>

      {/* Quick Contact */}
      <section className="py-12 -mt-8">
        <ResponsiveContainer size="lg" className="py-8">
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-4xl mx-auto">
            {[
              { icon: Phone, label: "Call Us", value: "+91 98765 43210", href: "tel:+919876543210", color: "primary" },
              { icon: MessageCircle, label: "WhatsApp", value: "Chat Now", href: "https://wa.me/919876543210", color: "green" },
              { icon: Mail, label: "Email", value: "hello@voltsetu.in", href: "mailto:hello@voltsetu.in", color: "primary" },
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

      {/* Form + Info */}
      <section className="py-20">
        <ResponsiveContainer size="xl" className="py-8">
          <div className="grid lg:grid-cols-5 gap-12 max-w-5xl mx-auto">
            {/* Form */}
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
                      <Label htmlFor="fullName" className="block text-sm font-medium text-foreground mb-2">
                        Full Name <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="fullName"
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
                      <Label htmlFor="phone" className="block text-sm font-medium text-foreground mb-2">
                        Phone <span className="text-destructive">*</span>
                      </Label>
                      <Input
                        id="phone"
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
                    <Label htmlFor="email" className="block text-sm font-medium text-foreground mb-2">
                      Email <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="email"
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
                    <Label htmlFor="area" className="block text-sm font-medium text-foreground mb-2">
                      Area / City <span className="text-destructive">*</span>
                    </Label>
                    <Input
                      id="area"
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
                    <Label htmlFor="message" className="block text-sm font-medium text-foreground mb-2">
                      Message <span className="text-destructive">*</span>
                    </Label>
                    <Textarea
                      id="message"
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

      {/* FAQ */}
      <section className="py-20 bg-soft-gray">
        <ResponsiveContainer size="md" className="py-8">
          <div className="text-center mb-12 reveal">
            <div className="flex items-center justify-center gap-2 mb-4">
              <HelpCircle className="w-6 h-6 text-primary" />
              <h2 className="font-display font-bold text-3xl text-foreground">Quick FAQ</h2>
            </div>
          </div>
          <div className="reveal">
            <FAQAccordion faqs={contactFaqs} />
          </div>
        </ResponsiveContainer>
      </section>
    </div>
  );
}
