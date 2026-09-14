/* VoltSetu i18n (Round 13) — English + Hindi toggle.
 *
 * Design notes:
 * - Lightweight React context; dictionaries are flat key maps with optional
 *   template interpolation ("{{value}}").
 * - The language choice is persisted to localStorage (key "vs-lang") and the
 *   default follows the system/browser Hindi preference.
 * - All visible rider/host UI strings go through useT(); untranslated keys
 *   fall back to English (the source-language dictionary), so adding a key
 *   never breaks a screen.
 */
import React, { createContext, useCallback, useContext, useMemo, useState } from "react";

export type Lang = "en" | "hi";

export const EN: Record<string, string> = {
  // App shell & master brand
  "app.name": "ChargePush",
  "app.tagline": "Charge. Push. Go.",
  "app.promise": "Keep Moving.",
  "nav.home": "Home",
  "nav.findSpots": "Find a Charge",
  "nav.loyalty": "Rewards",
  "nav.becomeHost": "Become a Host",
  "nav.howItWorks": "How It Works",
  "nav.pricing": "Pricing",
  "nav.aboutContact": "About",
  "nav.about": "About",
  "nav.contact": "Contact",
  "nav.signIn": "Sign In",
  "nav.getStarted": "Find a Charge",
  "nav.rescue": "Rescue",
  "nav.rescueLong": "ChargePush Rescue",
  "nav.installApp": "Install App",
  "nav.chooseCity": "Select City",
  "nav.more": "More",
  "nav.tripPlanner": "Route",
  "trip.fromMyLocation": "Start from current location",
  "trip.locDenied": "Location access denied — enter a location name",
  // Spot status
  "spot.available": "Available",
  "spot.occupied": "Occupied",
  "spot.verified": "Verified Host",
  "spot.waitlist": "Join Waitlist",
  "spot.waitlistJoined": "You're on the waitlist",
  "spot.waitlistPosition": "position",
  "spot.leaveWaitlist": "Leave Waitlist",
  "spot.waitlistFull": "Waitlist Full",
  "spot.perKm": "/km",
  "spot.bookNow": "Book Now",
  "spot.minutes": "min",
  "booking.busy": "Outlet currently occupied",
  "booking.waitlistPrompt": "This charging access point is currently occupied. Join waitlist for instant notification when free.",
  "booking.joinWaitlist": "Join Waitlist",
  "booking.signInToWaitlist": "Sign in to join",
  "booking.leaveWaitlist": "Leave Waitlist",
  "spot.hour": "hr",
  "spot.rating": "rating",
  "spot.reviews": "reviews",
  "spot.facilities": "Facilities",
  "spot.type.home": "Home Host",
  "spot.type.shop": "Local Spot",
  "spot.type.cafe": "Café",
  "spot.type.office": "Office Spot",
  "spot.type.parking": "Station",
  "spot.seeMore": "See details",
  "spot.seeLess": "Show less",
  "spot.distance": "away",
  // ChargePush Route
  "trip.title": "ChargePush Route",
  "trip.subtitle": "Plan your charge along your travel route",
  "trip.start": "Start",
  "trip.destination": "Destination",
  "trip.plan": "Plan Your Charge",
  "trip.spotsFound": "charging spots on your route",
  "trip.noSpots": "No charging spots found on this route corridor — try widening the corridor",
  "trip.corridor": "Corridor radius",
  "trip.distance": "Total distance",
  // Dashboard & Host
  "dash.title": "ChargePush Host Dashboard",
  "dash.live": "Charging access available",
  "dash.liveOff": "Charging access busy",
  "dash.pause.title": "Pause listing",
  "dash.pause.on": "Listing paused",
  "dash.pause.off": "Listing live",
  "dash.pause.hint": "Temporarily hide your spot from the network until unpaused",
  "dash.sessionsToday": "Sessions today",
  "dash.earnings": "Host Earnings",
  "dash.trend.7d": "7-day activity",
  "dash.requests": "Requests",
  "dash.ratings": "Host Ratings",
  "dash.refer.title": "Power Your Neighborhood — Invite a Host",
  "dash.refer.subtitle": "Invite neighboring hosts to join The ChargePush Network. Earn ₹50 credit per verified host.",
  "dash.refer.code": "Your host invite code",
  "dash.refer.copy": "Copy code",
  "dash.refer.copied": "Copied!",
  "dash.refer.message": "Power your neighborhood with ChargePush Host — sign up with my invite code",
  "dash.refer.credits": "Host credits",
  "dash.refer.referred": "hosts verified",
  // Notifications & Alerts
  "notify.spotFree": "Charging Access Available",
  "notify.spotFreeBody": "The spot you were waiting for is now open. Book now and keep moving.",
  // Ratings
  "rate.title": "Rate your charging session",
  "rate.rider.title": "Rate rider",
  "rate.punctuality": "Punctuality",
  "rate.courtesy": "Courtesy",
  "rate.submit": "Submit Rating",
  "rate.thanks": "Thank you for building trust on ChargePush!",
  // Shared Actions
  "common.loading": "Loading...",
  "common.error": "Something went wrong",
  "common.tryAgain": "Try again",
  "common.save": "Save",
  "common.cancel": "Cancel",
  "common.close": "Close",
  "common.learnMore": "Learn More",
  "common.findASpot": "Find a Charge",
  "common.becomeHost": "Power Your Neighborhood",
  "common.planRoute": "Plan Your Charge",
  "common.getEmergency": "Get Emergency Charge",
  "common.viewAll": "View All",
  "common.map": "Network Map",
};

export const HI: Record<string, string> = {
  "app.name": "ChargePush",
  "app.tagline": "Charge. Push. Go.",
  "app.promise": "Keep Moving.",
  "nav.home": "होम",
  "nav.findSpots": "चार्ज ढूंढें",
  "nav.loyalty": "रिवॉर्ड्स",
  "nav.becomeHost": "होस्ट बनें",
  "nav.howItWorks": "यह कैसे काम करता है",
  "nav.pricing": "मूल्य",
  "nav.aboutContact": "हमारे बारे में",
  "nav.about": "परिचय",
  "nav.contact": "संपर्क",
  "nav.signIn": "साइन इन",
  "nav.getStarted": "चार्ज ढूंढें",
  "nav.rescue": "रेस्क्यू",
  "nav.rescueLong": "ChargePush Rescue",
  "nav.installApp": "ऐप इन्स्टॉल करें",
  "nav.chooseCity": "शहर चुनें",
  "nav.more": "और",
  "nav.tripPlanner": "रूट",
  "trip.fromMyLocation": "वर्तमान स्थान से शुरू करें",
  "trip.locDenied": "लोकेशन एक्सेस अस्वीकृत — कृपया स्थान नाम दर्ज करें",
  "spot.available": "उपलब्ध",
  "spot.occupied": "व्यस्त",
  "spot.verified": "प्रमाणित होस्ट",
  "spot.waitlist": "वेटलिस्ट में जुड़ें",
  "spot.waitlistJoined": "आप वेटलिस्ट में हैं",
  "spot.waitlistPosition": "स्थान",
  "spot.leaveWaitlist": "वेटलिस्ट छोड़ें",
  "spot.waitlistFull": "वेटलिस्ट भरी हुई",
  "spot.perKm": "/किमी",
  "spot.bookNow": "अभी बुक करें",
  "spot.minutes": "मिनट",
  "booking.busy": "आउटलेट अभी व्यस्त है",
  "booking.waitlistPrompt": "यह चार्जिंग एक्सेस पॉइंट अभी व्यस्त है। जब यह खाली होगा तो सूचना पाने के लिए वेटलिस्ट में जुड़ें।",
  "booking.joinWaitlist": "वेटलिस्ट में जुड़ें",
  "booking.signInToWaitlist": "साइन इन करें",
  "booking.leaveWaitlist": "वेटलिस्ट छोड़ें",
  "spot.hour": "घंटा",
  "spot.rating": "रेटिंग",
  "spot.reviews": "रिव्यू",
  "spot.facilities": "सुविधाएँ",
  "spot.type.home": "होम होस्ट",
  "spot.type.shop": "लोकल स्पॉट",
  "spot.type.cafe": "कैफे",
  "spot.type.office": "ऑफिस",
  "spot.type.parking": "चार्जिंग स्टेशन",
  "spot.seeMore": "विवरण देखें",
  "spot.seeLess": "कम देखें",
  "spot.distance": "दूर",
  "trip.title": "ChargePush Route",
  "trip.subtitle": "अपने रास्ते पर चार्जिंग प्लान करें",
  "trip.start": "शुरुआत",
  "trip.destination": "गंतव्य",
  "trip.plan": "चार्ज प्लान करें",
  "trip.spotsFound": "चार्जिंग स्पॉट रास्ते पर मिले",
  "trip.noSpots": "इस रूट पर कोई स्पॉट नहीं मिला",
  "trip.corridor": "कॉरिडोर दायरा",
  "trip.distance": "कुल दूरी",
  "dash.title": "ChargePush Host डैशबोर्ड",
  "dash.live": "चार्जिंग उपलब्ध",
  "dash.liveOff": "चार्जिंग व्यस्त",
  "dash.pause.title": "लिस्टिंग रोकें",
  "dash.pause.on": "लिस्टिंग रोकी गई",
  "dash.pause.off": "लिस्टिंग लाइव",
  "dash.pause.hint": "अनपॉज़ करने तक नेटवर्क से छुपाएँ",
  "dash.sessionsToday": "आज के सेशन",
  "dash.earnings": "होस्ट कमाई",
  "dash.trend.7d": "7-दिन की गतिविधि",
  "dash.requests": "अनुरोध",
  "dash.ratings": "होस्ट रेटिंग",
  "dash.refer.title": "अपने पड़ोस को पावर दें — होस्ट आमंत्रित करें",
  "dash.refer.subtitle": "ChargePush Network से जुड़ने के लिए नए होस्ट्स को आमंत्रित करें। प्रत्येक सत्यापित होस्ट पर ₹50 क्रेडिट पाएँ।",
  "dash.refer.code": "आपका होस्ट कोड",
  "dash.refer.copy": "कोड कॉपी करें",
  "dash.refer.copied": "कॉपी हो गया!",
  "dash.refer.message": "ChargePush Host के साथ अपने पड़ोस को पावर दें — मेरे कोड से साइन अप करें",
  "dash.refer.credits": "होस्ट क्रेडिट",
  "dash.refer.referred": "सत्यापित होस्ट",
  "notify.spotFree": "चार्जिंग एक्सेस उपलब्ध",
  "notify.spotFreeBody": "आप जिस स्थान का इंतजार कर रहे थे वह अब खाली है। अभी बुक करें और आगे बढ़ते रहें।",
  "rate.title": "चार्जिंग अनुभव रेट करें",
  "rate.rider.title": "राइडर को रेट करें",
  "rate.punctuality": "समयबद्धता",
  "rate.courtesy": "शिष्टाचार",
  "rate.submit": "रेटिंग दें",
  "rate.thanks": "ChargePush पर भरोसा बनाने के लिए धन्यवाद!",
  "common.loading": "लोड हो रहा है...",
  "common.error": "कुछ गड़बड़ हो गई",
  "common.tryAgain": "दोबारा कोशिश करें",
  "common.save": "सेव करें",
  "common.cancel": "रद्द करें",
  "common.close": "बंद करें",
  "common.learnMore": "और जानें",
  "common.findASpot": "चार्ज ढूंढें",
  "common.becomeHost": "अपने पड़ोस को पावर दें",
  "common.planRoute": "चार्ज प्लान करें",
  "common.getEmergency": "आपातकालीन चार्ज पाएँ",
  "common.viewAll": "सभी देखें",
  "common.map": "नेटवर्क मैप",
};

const LANG_KEY = "vs-lang";

function defaultLang(): Lang {
  try {
    const stored = localStorage.getItem(LANG_KEY);
    if (stored === "en" || stored === "hi") return stored;
    const nav = (navigator.language || "").toLowerCase();
    if (nav.startsWith("hi")) return "hi";
    return "en";
  } catch {
    return "en";
  }
}

interface LangContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const LangContext = createContext<LangContextValue | null>(null);

function renderTemplate(template: string, vars?: Record<string, string | number>): string {
  if (!vars) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (_match, name: string) =>
    Object.prototype.hasOwnProperty.call(vars, name) ? String(vars[name]) : _match
  );
}

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLangState] = useState<Lang>(defaultLang);

  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem(LANG_KEY, l);
    } catch {
      /* ignore */
    }
  }, []);

  const value = useMemo<LangContextValue>(() => {
    const dicts = lang === "hi" ? { primary: HI, fallback: EN } : { primary: EN, fallback: EN };
    const t = (key: string, vars?: Record<string, string | number>) => {
      const primary = dicts.primary[key];
      const raw =
        primary !== undefined && primary !== "" ? primary : dicts.fallback[key] ?? key;
      return renderTemplate(raw, vars);
    };
    return { lang, setLang, t };
  }, [lang]);

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export function useT() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useT must be used inside LanguageProvider");
  return ctx.t;
}

export function useLang() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLang must be used inside LanguageProvider");
  return { lang: ctx.lang, setLang: ctx.setLang };
}
