import { Star, Quote } from "lucide-react";
import { useState, useEffect } from "react";

const testimonials = [
  {
    name: "Priya Sharma",
    role: "EV Rider, Pune",
    text: "VoltSetu has been a game-changer for my daily commute. I no longer worry about running out of charge. Found three spots within walking distance of my office!",
    rating: 5,
  },
  {
    name: "Rajesh Kumar",
    role: "Host, Bangalore",
    text: "I earn around Rs 3,000 per month just by letting riders charge at my home outlet. The setup was simple and the verification process gave me confidence.",
    rating: 5,
  },
  {
    name: "Anjali Desai",
    role: "EV Rider, Mumbai",
    text: "The pricing is transparent and very affordable. I love the QR code scanning feature - it makes the whole process super quick and hassle-free.",
    rating: 4,
  },
  {
    name: "Vikram Patel",
    role: "Host, Hyderabad",
    text: "As a retired professional, this is the easiest passive income I have ever earned. Riders are respectful and the platform handles everything smoothly.",
    rating: 5,
  },
];

export default function TestimonialCarousel() {
  const [active, setActive] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setActive((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <section className="py-20">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-foreground mb-4">
            Trusted by Riders and Hosts
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Real stories from real people powering India's EV charging revolution.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {testimonials.map((t, i) => (
            <div
              key={i}
              className={`group p-6 rounded-2xl border transition-all duration-500 cursor-pointer ${
                i === active
                  ? "bg-primary/5 border-primary/20 shadow-lg scale-[1.02]"
                  : "bg-card border-border hover:shadow-md hover:-translate-y-1"
              }`}
              onClick={() => setActive(i)}
            >
              <Quote className="w-8 h-8 text-primary/30 mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed mb-4">
                "{t.text}"
              </p>
              <div className="flex items-center gap-1 mb-3">
                {Array.from({ length: 5 }).map((_, s) => (
                  <Star
                    key={s}
                    className={`w-3.5 h-3.5 ${s < t.rating ? "text-yellow-500 fill-yellow-500" : "text-muted"}`}
                  />
                ))}
              </div>
              <div>
                <div className="font-semibold text-sm text-card-foreground">{t.name}</div>
                <div className="text-xs text-muted-foreground">{t.role}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
