import { useState, useEffect, useRef, useCallback } from "react";
import {
  X, ArrowLeft, ArrowRight, Home, MapPin, Zap, DollarSign,
  Check, Phone, Mail, User, Navigation, Loader2, CheckCircle2,
  FileText, AlertTriangle, Search, Locate, Copy, ExternalLink,
  ShieldCheck, Trash2, Plus, Eye, Gift,
} from "lucide-react";
import { useAuth } from "../Auth/AuthProvider";
import { Button } from "@/components/ui/button";
import StepIndicator from "@/components/StepIndicator";
import FacilityPicker from "@/components/FacilityPicker";
import FacilitiesChips from "@/components/FacilitiesChips";
import { sanitizeFacilityIds, FACILITIES as FACILITY_LIST, type Facility } from "@/lib/facilities";
import { submitHostRegistration } from "@/lib/hostRegistration";
import {
  submitHostVerification,
  getOwnVerificationCase,
  setVerificationContactPhone,
} from "@/lib/hostVerificationService";
import { toast } from "sonner";
import LocationPickerMap from "../LocationPickerMap";
import { Capacitor } from "@capacitor/core";
import { Geolocation } from "@capacitor/geolocation";

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────
interface HostRegistrationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Coords { lat: number; lng: number }

interface WizardDoc {
  type: string;
  label: string;
  detail: string;
}

interface FormData {
  // Step 1 – Personal
  fullName: string;
  email: string;
  phone: string;
  // Step 2 – Location (address + GPS merged)
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: Coords | null;
  locationLabel: string;
  addressCoords: Coords | null;   // coords resolved from typed address
  gpsCoords: Coords | null;       // coords from browser GPS
  coordSource: "address" | "gps" | null;
  googleMapsLink: string;
  // Step 3 – Charging
  spotType: string;
  outletType: string;
  chargingSpeed: string;
  availableHours: string;
  pricePerHour: string;
  facilities: string[];
  // Step 4 – Identity documents
  documents: WizardDoc[];
  // Step 5 – Confirm
  agreeToTerms: boolean;
  referralCode: string;
}

interface NominatimResult {
  place_id: number;
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    suburb?: string;
    city?: string;
    town?: string;
    village?: string;
    state?: string;
    postcode?: string;
  };
}

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
const haversineKm = (a: Coords, b: Coords): number => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const s =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) *
      Math.cos((b.lat * Math.PI) / 180) *
      Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(s), Math.sqrt(1 - s));
};

const defaultFormData = (user: any): FormData => ({
  fullName: user?.displayName || "",
  email: user?.email || "",
  phone: "",
  address: "",
  city: "",
  state: "",
  pincode: "",
  coordinates: null,
  locationLabel: "",
  addressCoords: null,
  gpsCoords: null,
  coordSource: null,
  googleMapsLink: "",
  spotType: "",
  outletType: "",
  chargingSpeed: "",
  availableHours: "",
  pricePerHour: "",
  facilities: [],
  documents: [],
  agreeToTerms: false,
  referralCode: "",
});

const STEPS = [
  { label: "Personal Info",    icon: User            },
  { label: "Location Details", icon: Home            },
  { label: "Charging Setup",   icon: Zap             },
  { label: "Identity Docs",    icon: FileText        },
  { label: "Confirm & Submit", icon: CheckCircle2    },
];
const TOTAL_STEPS = 5;

const FACILITY_MAP = new Map<string, Facility>(FACILITY_LIST.map((f) => [f.id, f]));

const DOC_TYPE_META: { type: string; label: string; hint: string }[] = [
  { type: "aadhaar", label: "Aadhaar Card", hint: "First 4 + last 4 digits only — never full number" },
  { type: "pan", label: "PAN Card", hint: "Masked number, e.g. ••••••ABCD" },
  { type: "photo_id", label: "Driving Licence / Voter ID", hint: "Any government photo ID number" },
  { type: "electricity_bill", label: "Electricity Bill", hint: "Shareable link or recent bill ref." },
  { type: "other", label: "Other Document", hint: "Business licence, property proof, etc." },
];

// ─────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────
const HostRegistrationModal = ({ isOpen, onClose }: HostRegistrationModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormData>(() => defaultFormData(user));
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Document form state (step 4)
  const [docType, setDocType] = useState("aadhaar");
  const [docDetail, setDocDetail] = useState("");

  // ── Autocomplete state ──
  const [addressQuery, setAddressQuery]         = useState("");
  const [suggestions, setSuggestions]           = useState<NominatimResult[]>([]);
  const [suggestLoading, setSuggestLoading]     = useState(false);
  const [showSuggestions, setShowSuggestions]   = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const suggBoxRef  = useRef<HTMLDivElement>(null);

  // ── GPS state ──
  const [gpsLoading,  setGpsLoading]  = useState(false);
  const [gpsError,    setGpsError]    = useState("");
  const [gpsSuccess,  setGpsSuccess]  = useState(false);
  const [locationAccuracy, setLocationAccuracy] = useState<number | null>(null);
  const [gpsQuality, setGpsQuality]   = useState<"reliable" | "approximate" | "imprecise" | null>(null);

  // ── Google Maps link state ──
  const [gmapsError,        setGmapsError]        = useState("");
  const [linkCopied,        setLinkCopied]        = useState(false);
  const [gmapsLinkLoading,  setGmapsLinkLoading]  = useState(false);
  const generateLinkOnGpsRef = useRef(false);

  // ── Live preview toggle ──
  const [previewOpen, setPreviewOpen] = useState(true);

  const update = useCallback(<K extends keyof FormData>(field: K, value: FormData[K]) => {
    setForm(prev => ({ ...prev, [field]: value }));
  }, []);

  // ── Pre-fill phone onto the verification contact when the modal opens ──
  useEffect(() => {
    if (!isOpen || !user) return;
    setForm(prev => (prev.documents.length === 0 ? defaultFormData(user) : prev));
    setDocType("aadhaar");
    setDocDetail("");
    setStep(1);
    setPreviewOpen(true);
  }, [isOpen, user]);

  // ── Dismiss suggestion list when clicking outside ──
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (suggBoxRef.current && !suggBoxRef.current.contains(e.target as Node)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Debounced Nominatim forward geocoding ──
  const handleAddressInput = (value: string) => {
    setAddressQuery(value);
    setShowSuggestions(false);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (value.trim().length < 4) { setSuggestions([]); return; }
    debounceRef.current = setTimeout(async () => {
      setSuggestLoading(true);
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(value)}&format=json&addressdetails=1&limit=6&countrycodes=in`,
          { headers: { "Accept-Language": "en" } }
        );
        const data: NominatimResult[] = await res.json();
        setSuggestions(data);
        setShowSuggestions(data.length > 0);
      } catch {
        setSuggestions([]);
      } finally {
        setSuggestLoading(false);
      }
    }, 400);
  };

  const pickSuggestion = (result: NominatimResult) => {
    const lat = parseFloat(result.lat);
    const lng = parseFloat(result.lon);
    const addr = result.address;
    const addrCoords: Coords = { lat, lng };

    const newSource = form.gpsCoords
      ? (haversineKm(form.gpsCoords, addrCoords) > 2 ? "address" : form.coordSource)
      : "address";

    setForm(prev => ({
      ...prev,
      address:       result.display_name.split(",")[0] || prev.address,
      city:          addr.city || addr.town || addr.village || prev.city,
      state:         addr.state || prev.state,
      pincode:       addr.postcode || prev.pincode,
      addressCoords: addrCoords,
      coordinates:   addrCoords,
      locationLabel: result.display_name,
      coordSource:   newSource,
    }));
    setAddressQuery(result.display_name);
    setShowSuggestions(false);
  };

  // ── Manual pin placement (click-on-map) ──
  const handleManualPin = async (lat: number, lng: number) => {
    const gps: Coords = { lat, lng };
    let label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    try {
      const res  = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
        { headers: { "Accept-Language": "en" } }
      );
      const json = await res.json();
      label = json.display_name || label;
      const a = json.address || {};
      const parts: string[] = [];
      if (a.house_number) parts.push(a.house_number);
      if (a.road)         parts.push(a.road);
      if (a.suburb || a.neighbourhood) parts.push(a.suburb || a.neighbourhood);
      const detectedAddress = parts.length > 0 ? parts.join(", ") : (json.display_name?.split(",")[0] || "");
      setAddressQuery(json.display_name || label);
      setForm(prev => ({
        ...prev,
        address:       detectedAddress || prev.address,
        city:          a.city || a.town || a.village || prev.city,
        state:         a.state || prev.state,
        pincode:       a.postcode || prev.pincode,
        gpsCoords:     gps,
        coordinates:   gps,
        locationLabel: label,
        coordSource:   "gps",
      }));
    } catch {
      setForm(prev => ({ ...prev, gpsCoords: gps, coordinates: gps, locationLabel: label, coordSource: "gps" }));
    }
    setLocationAccuracy(null);
    setGpsQuality("reliable");
    setGpsSuccess(true);
    setGpsError("");
  };

  // ── GPS detection (with accuracy tiers + high-accuracy fallback) ──
  const handleGetGps = () => {
    if (!navigator.geolocation) { setGpsError("Geolocation not supported."); return; }
    setGpsLoading(true);
    setGpsError("");
    setGpsSuccess(false);
    setLocationAccuracy(null);
    setGpsQuality(null);

    const applyGpsResult = async (pos: { coords: { latitude: number; longitude: number; accuracy: number } }) => {
      const lat      = pos.coords.latitude;
      const lng      = pos.coords.longitude;
      const accuracy = Math.round(pos.coords.accuracy);
      const gps: Coords = { lat, lng };
      let label = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;

      setLocationAccuracy(accuracy);
      const quality: "reliable" | "approximate" | "imprecise" =
        accuracy <= 100  ? "reliable" :
        accuracy <= 1000 ? "approximate" : "imprecise";
      setGpsQuality(quality);

      if (quality !== "imprecise") {
        let detectedAddress = "";
        let detectedCity    = "";
        let detectedState   = "";
        let detectedPincode = "";
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&addressdetails=1`,
            { headers: { "Accept-Language": "en" } }
          );
          const json = await res.json();
          label = json.display_name || label;
          const a = json.address || {};
          const parts: string[] = [];
          if (a.house_number) parts.push(a.house_number);
          if (a.road)         parts.push(a.road);
          if (a.suburb || a.neighbourhood) parts.push(a.suburb || a.neighbourhood);
          detectedAddress = parts.length > 0
            ? parts.join(", ")
            : (json.display_name?.split(",")[0] || "");
          detectedCity    = a.city  || a.town  || a.village || "";
          detectedState   = a.state || "";
          detectedPincode = a.postcode || "";
          setAddressQuery(json.display_name || label);
        } catch { /* keep defaults on network error */ }

        setForm(prev => {
          const mismatch = prev.addressCoords && haversineKm(prev.addressCoords, gps) > 2;
          return {
            ...prev,
            address:       detectedAddress || prev.address,
            city:          detectedCity    || prev.city,
            state:         detectedState   || prev.state,
            pincode:       detectedPincode || prev.pincode,
            gpsCoords:     gps,
            coordinates:   mismatch ? prev.coordinates : gps,
            locationLabel: mismatch ? prev.locationLabel : label,
            coordSource:   mismatch ? "address" : "gps",
          };
        });
      } else {
        setForm(prev => ({
          ...prev,
          gpsCoords:     gps,
          coordinates:   gps,
          locationLabel: label,
          coordSource:   "gps",
        }));
      }

      setGpsLoading(false);
      setGpsSuccess(true);
    };

    const runNativeGeolocation = async () => {
      try {
        const permission = await Geolocation.requestPermissions();
        if (permission.location !== 'granted' && permission.coarseLocation !== 'granted') {
          throw new Error("Location permission denied");
        }
        const position = await Geolocation.getCurrentPosition({
          enableHighAccuracy: true,
          timeout: 10000
        });
        applyGpsResult(position);
      } catch (err: any) {
        setGpsLoading(false);
        setGpsError(err.message || "Could not detect location.");
      }
    };

    const runWebGeolocation = () => {
      const onError = (highAccuracy: boolean) => (err: GeolocationPositionError) => {
        if (highAccuracy && err.code !== 1) {
          navigator.geolocation.getCurrentPosition(
            applyGpsResult,
            (err2) => {
              setGpsLoading(false);
              setGpsError(
                err2.code === 1
                  ? "Location access denied. Please allow location permissions and try again."
                  : "Could not detect location. Please try again or enter your address manually."
              );
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
          );
        } else {
          setGpsLoading(false);
          setGpsError(
            err.code === 1
              ? "Location access denied. Please allow location permissions and try again."
              : "Could not detect location. Please try again or enter your address manually."
          );
        }
      };

      navigator.geolocation.getCurrentPosition(
        applyGpsResult,
        onError(true),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    };

    if (Capacitor.isNativePlatform()) {
      runNativeGeolocation();
    } else {
      runWebGeolocation();
    }
  };

  const hasMismatch =
    !!form.addressCoords &&
    !!form.gpsCoords &&
    haversineKm(form.addressCoords, form.gpsCoords) > 2;

  // ── Google Maps link handlers ──
  const handleGenerateGmapsLink = () => {
    if (form.coordinates) {
      const { lat, lng } = form.coordinates;
      const link = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
      update("googleMapsLink", link);
      setGmapsError("");
      return;
    }
    setGmapsLinkLoading(true);
    generateLinkOnGpsRef.current = true;
    handleGetGps();
  };

  const handleCopyGmapsLink = async () => {
    if (!form.googleMapsLink) return;
    try {
      await navigator.clipboard.writeText(form.googleMapsLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    } catch {
      const el = document.createElement("textarea");
      el.value = form.googleMapsLink;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleParseGmapsLink = async (raw: string) => {
    const url = raw.trim();
    if (!url) { setGmapsError(""); return; }

    if (/maps\.app\.goo\.gl|goo\.gl\/maps/i.test(url)) {
      setGmapsError(
        "Shortened links can't be read automatically — please open the link, then copy the full URL from your browser's address bar (it will contain numbers like '18.5204,73.8567'), or use GPS / map-click instead."
      );
      return;
    }

    const qMatch  = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    const match   = qMatch || atMatch;

    if (!match) {
      setGmapsError(
        "This doesn't look like a Google Maps link. Try GPS detection or click your location on the map instead."
      );
      return;
    }

    setGmapsError("");
    const lat = parseFloat(match[1]);
    const lng = parseFloat(match[2]);
    await handleManualPin(lat, lng);
  };

  // ── Step validation ──
  const canProceed = () => {
    switch (step) {
      case 1: return !!(form.fullName.trim() && form.email.trim() && form.phone.trim());
      case 2: return !!(form.city.trim() && form.coordinates);
      case 3: return !!(form.outletType && form.availableHours && form.pricePerHour && form.coordinates);
      case 4: return form.documents.length >= 1;
      case 5: return form.agreeToTerms;
      default: return true;
    }
  };

  useEffect(() => {
    if (generateLinkOnGpsRef.current && form.coordinates && !gpsLoading) {
      generateLinkOnGpsRef.current = false;
      setGmapsLinkLoading(false);
      const { lat, lng } = form.coordinates;
      const link = `https://www.google.com/maps?q=${lat.toFixed(6)},${lng.toFixed(6)}`;
      update("googleMapsLink", link);
    }
  }, [form.coordinates, gpsLoading, update]);

  // ── Submit registration + verification documents ──
  const handleSubmit = async () => {
    if (!user) return;
    setIsSubmitting(true);
    let registrationId: string | undefined;
    try {
      // 1. Submit the host registration (spot listing application)
      const regResult = await submitHostRegistration({
        fullName:       form.fullName,
        email:          form.email,
        phone:          form.phone,
        address:        form.address,
        city:           form.city,
        state:          form.state,
        pincode:        form.pincode,
        spotType:       form.spotType,
        outletType:     form.outletType,
        chargingSpeed:  form.chargingSpeed,
        availableHours: form.availableHours,
        pricePerHour:   form.pricePerHour,
        coordinates:    form.coordinates,
        agreeToTerms:   form.agreeToTerms,
        googleMapsLink: form.googleMapsLink || "",
        facilities:     sanitizeFacilityIds(form.facilities),
        referralCode:   form.referralCode?.trim() || "",
      });
      registrationId = regResult.registrationId;

      // 2. Submit identity documents so the host enters the verification queue
      if (form.documents.length > 0) {
        const existing = await getOwnVerificationCase(user.uid);
        // Mirror contact phone onto the verification case for the review queue
        if (form.phone && (!existing || !existing.userPhone)) {
          await setVerificationContactPhone(user.uid, form.phone);
        }
        try {
          await submitHostVerification({
            registrationId,
            documents: form.documents.map((d) => ({
              type: DOC_TYPE_META.some((m) => m.type === d.type)
                ? (d.type as any)
                : "other",
              label: d.label.slice(0, 80),
              documentNumber: d.detail.slice(0, 40),
            })),
          });
        } catch (docError) {
          console.error("Document submission failed:", docError);
          toast.warning("Registration saved, but documents failed to attach — you can upload them later in Dashboard → Settings.");
        }
      }

      toast.success("You're registered! We'll verify your identity and spot, then notify you within 24–48 hours.");
      onClose();
      setStep(1);
      setForm(defaultFormData(user));
      setAddressQuery("");
    } catch (error) {
      console.error("Registration error:", error);
      toast.error("Registration failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;

  // ─────────────────────────────────────────────────────
  // Step renderers
  // ─────────────────────────────────────────────────────
  const renderStep = () => {
    switch (step) {
      /* ── Step 1: Personal Info ── */
      case 1:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <User className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Personal Information</h3>
              <p className="text-muted-foreground">Tell us about yourself</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Full Name</label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input type="text" value={form.fullName}
                    onChange={e => update("fullName", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground"
                    placeholder="Enter your full name" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input type="email" value={form.email}
                    onChange={e => update("email", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground"
                    placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Phone Number</label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input type="tel" value={form.phone}
                    onChange={e => update("phone", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground"
                    placeholder="+91 98765 43210" />
                </div>
              </div>
            </div>
          </div>
        );

      /* ── Step 2: Location Details ── */
      case 2:
        return (
          <div className="space-y-5">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-green-500 to-teal-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Home className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Location Details</h3>
              <p className="text-muted-foreground">Where is your charging spot? Detect via GPS or enter manually.</p>
            </div>

            <button
              onClick={handleGetGps}
              disabled={gpsLoading}
              className={`w-full flex items-center justify-center gap-3 py-3 px-6 rounded-xl border-2 border-dashed transition-all font-semibold text-sm ${
                gpsQuality === "reliable"
                  ? "border-green-500 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400"
                  : gpsQuality === "approximate"
                  ? "border-amber-400 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400"
                  : gpsQuality === "imprecise"
                  ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-400"
                  : "border-primary bg-primary/5 text-primary hover:bg-primary/10"
              }`}
            >
              {gpsLoading ? (
                <><Loader2 className="w-4 h-4 animate-spin" />Detecting location…</>
              ) : gpsQuality === "reliable" ? (
                <><CheckCircle2 className="w-4 h-4" />GPS Pinned (precise) — Re-detect?</>
              ) : gpsQuality === "approximate" ? (
                <><AlertTriangle className="w-4 h-4" />Location approximate — Re-detect?</>
              ) : gpsQuality === "imprecise" ? (
                <><AlertTriangle className="w-4 h-4" />Very imprecise — Re-detect or place manually</>
              ) : (
                <><Navigation className="w-4 h-4" />Use My Current Location</>
              )}
            </button>

            {gpsSuccess && !gpsError && gpsQuality === "reliable" && (
              <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl p-3 flex items-center gap-2 text-sm text-green-700 dark:text-green-400">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                Location detected precisely (±{locationAccuracy}m) — please review the fields below.
              </div>
            )}
            {gpsSuccess && !gpsError && gpsQuality === "approximate" && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-3 flex items-start gap-2 text-sm text-amber-700 dark:text-amber-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>Location detected but accuracy is approximate (±{locationAccuracy}m). Drag the pin on the map or type your address to correct it.</span>
              </div>
            )}
            {gpsSuccess && !gpsError && gpsQuality === "imprecise" && (
              <div className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-xl p-3 flex items-start gap-2 text-sm text-orange-700 dark:text-orange-400">
                <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                <span>
                  Your detected location is very imprecise (±{locationAccuracy}m — likely WiFi-based, not real GPS).
                  Address fields were <strong>not auto-filled</strong> to avoid a wrong address.
                  Try again outdoors, or <strong>click your exact location on the map below</strong>.
                </span>
              </div>
            )}
            {gpsError && (
              <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-sm text-red-700 dark:text-red-400">
                {gpsError}
              </div>
            )}

            <div className="flex items-center gap-3">
              <div className="flex-1 border-t border-border" />
              <span className="text-xs text-muted-foreground uppercase tracking-wide">or enter manually</span>
              <div className="flex-1 border-t border-border" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">
                Street Address <span className="text-primary">*</span>
              </label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={form.address}
                  onChange={e => update("address", e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground text-sm"
                  placeholder="12, MG Road, Shahupuri"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">City <span className="text-primary">*</span></label>
                <input type="text" value={form.city}
                  onChange={e => update("city", e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground"
                  placeholder="Mumbai" />
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">State</label>
                <input type="text" value={form.state}
                  onChange={e => update("state", e.target.value)}
                  className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground"
                  placeholder="Maharashtra" />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">PIN Code</label>
              <input type="text" value={form.pincode}
                onChange={e => update("pincode", e.target.value)}
                className="w-full px-3 py-2.5 border border-border rounded-xl text-sm focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground"
                placeholder="400001" />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5 text-muted-foreground uppercase tracking-wide">
                Search Address <span className="text-primary">*</span>
              </label>
              <div className="relative" ref={suggBoxRef}>
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={addressQuery}
                  onChange={e => handleAddressInput(e.target.value)}
                  onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                  className="w-full pl-9 pr-10 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground text-sm"
                  placeholder="Start typing an address, landmark, or area…"
                />
                {suggestLoading && (
                  <Loader2 className="absolute right-3 top-3 w-4 h-4 animate-spin text-muted-foreground" />
                )}
                {showSuggestions && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-background border border-border rounded-xl shadow-xl z-[9999] overflow-hidden">
                    {suggestions.map(r => (
                      <button
                        key={r.place_id}
                        onMouseDown={() => pickSuggestion(r)}
                        className="w-full text-left px-4 py-3 text-sm hover:bg-muted/60 transition-colors border-b border-border/40 last:border-0 flex items-start gap-2"
                      >
                        <MapPin className="w-4 h-4 text-primary flex-shrink-0 mt-0.5" />
                        <span className="line-clamp-2 text-foreground">{r.display_name}</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {hasMismatch && (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Location mismatch detected</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                    Your GPS position is more than 2 km from the address you searched. Which coordinates should we use for the map pin?
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    <button
                      onClick={() => setForm(prev => ({
                        ...prev, coordinates: prev.addressCoords, coordSource: "address",
                        locationLabel: addressQuery,
                      }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.coordSource === "address"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      <MapPin className="inline w-3 h-3 mr-1" />Use Searched Address
                    </button>
                    <button
                      onClick={() => setForm(prev => ({
                        ...prev, coordinates: prev.gpsCoords, coordSource: "gps",
                        locationLabel: `${prev.gpsCoords!.lat.toFixed(5)}, ${prev.gpsCoords!.lng.toFixed(5)}`,
                      }))}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.coordSource === "gps"
                          ? "bg-primary text-primary-foreground border-primary"
                          : "border-border text-foreground hover:bg-muted"
                      }`}
                    >
                      <Navigation className="inline w-3 h-3 mr-1" />Use GPS Position
                    </button>
                  </div>
                </div>
              </div>
            )}

            <LocationPickerMap
              value={form.coordinates}
              onChange={coords => handleManualPin(coords.lat, coords.lng)}
              accuracyMeters={locationAccuracy}
              city={form.city}
              height="220px"
            />

            {form.coordinates && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground px-1 flex-wrap">
                <CheckCircle2 className={`w-4 h-4 flex-shrink-0 ${
                  gpsQuality === "reliable" || gpsQuality === null ? "text-green-500" :
                  gpsQuality === "approximate" ? "text-amber-500" : "text-orange-500"
                }`} />
                <span>
                  Pin set via <strong className="text-foreground">{form.coordSource === "gps" ? (gpsQuality === null ? "manual map" : "GPS") : "address search"}</strong>
                  {" · "}
                  <span className="font-mono">{form.coordinates.lat.toFixed(5)}, {form.coordinates.lng.toFixed(5)}</span>
                  {locationAccuracy !== null && (
                    <span className={`ml-1 ${
                      gpsQuality === "reliable" ? "text-green-600" :
                      gpsQuality === "approximate" ? "text-amber-600" : "text-orange-600"
                    }`}>
                      {" · accuracy: ±"}{locationAccuracy}{"m"}
                    </span>
                  )}
                </span>
              </div>
            )}

            <div className="pt-3 border-t border-border space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex-1 border-t border-border" />
                <span className="text-xs text-muted-foreground uppercase tracking-wide whitespace-nowrap">Or use a Google Maps link</span>
                <div className="flex-1 border-t border-border" />
              </div>

              <button
                type="button"
                onClick={handleGenerateGmapsLink}
                disabled={gmapsLinkLoading || gpsLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl border border-border bg-background hover:bg-muted/60 text-sm font-medium text-foreground transition-all disabled:opacity-50"
              >
                {gmapsLinkLoading ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Detecting location…</>
                ) : (
                  <><Locate className="w-4 h-4 text-primary" />Generate Google Maps link</>
                )}
              </button>

              <div className="relative">
                <input
                  type="url"
                  value={form.googleMapsLink}
                  onChange={e => {
                    update("googleMapsLink", e.target.value);
                    setGmapsError("");
                  }}
                  onBlur={e => handleParseGmapsLink(e.target.value)}
                  onPaste={e => {
                    const pasted = e.clipboardData.getData("text");
                    setTimeout(() => handleParseGmapsLink(pasted), 0);
                  }}
                  placeholder="Paste a Google Maps link here or generate one above"
                  className="w-full pl-4 pr-20 py-3 border border-border rounded-xl text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
                />
                {form.googleMapsLink && (
                  <button
                    type="button"
                    onClick={handleCopyGmapsLink}
                    className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-primary/10 hover:bg-primary/20 text-primary transition-all"
                    title="Copy link"
                  >
                    {linkCopied
                      ? <><Check className="w-3.5 h-3.5" />Copied!</>
                      : <><Copy className="w-3.5 h-3.5" />Copy</>}
                  </button>
                )}
              </div>

              {form.googleMapsLink && !gmapsError && (
                <a
                  href={form.googleMapsLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Verify in Google Maps
                </a>
              )}

              {gmapsError && (
                <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-3 text-xs text-red-700 dark:text-red-400">
                  {gmapsError}
                </div>
              )}

              <p className="text-xs text-muted-foreground">
                Share this link via WhatsApp so a family member or rider can verify your exact pin.
              </p>
            </div>
          </div>
        );

      /* ── Step 3: Charging Setup ── */
      case 3:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Zap className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Charging Setup</h3>
              <p className="text-muted-foreground">Tell us about your charging equipment</p>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Spot Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["Home", "Shop", "Café / Restaurant", "Office", "Parking / Garage"].map(type => (
                    <button key={type} onClick={() => update("spotType", type)}
                      className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        form.spotType === type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 text-foreground"
                      }`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Outlet Type</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {["Standard 3-Pin", "5-Amp Socket", "16-Amp Socket", "Type 2 EV Charger"].map(type => (
                    <button key={type} onClick={() => update("outletType", type)}
                      className={`p-3 rounded-xl border-2 transition-all text-sm font-medium ${
                        form.outletType === type
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 text-foreground"
                      }`}>
                      {type}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Charging Speed</label>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {["Slow (2-3 kW)", "Fast (7-22 kW)", "Rapid (50+ kW)"].map(speed => (
                    <button key={speed} onClick={() => update("chargingSpeed", speed)}
                      className={`p-3 rounded-xl border-2 transition-all text-xs font-medium ${
                        form.chargingSpeed === speed
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border hover:border-primary/50 text-foreground"
                      }`}>
                      {speed}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Available Hours</label>
                <select value={form.availableHours}
                  onChange={e => update("availableHours", e.target.value)}
                  className="w-full px-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground">
                  <option value="">Select availability</option>
                  <option value="24/7">24/7</option>
                  <option value="6am-10pm">6 AM – 10 PM</option>
                  <option value="8am-8pm">8 AM – 8 PM</option>
                  <option value="9am-6pm">9 AM – 6 PM</option>
                  <option value="custom">Custom Hours</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Price per Hour (₹)</label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
                  <input type="number" value={form.pricePerHour}
                    onChange={e => update("pricePerHour", e.target.value)}
                    className="w-full pl-10 pr-4 py-3 border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent transition-all bg-background text-foreground"
                    placeholder="50" min="0" />
                </div>
              </div>
              <FacilityPicker
                selected={form.facilities}
                onChange={(ids) => update("facilities", ids)}
              />
            </div>
          </div>
        );

      /* ── Step 4: Identity Verification Documents ── */
      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <FileText className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Identity Verification</h3>
              <p className="text-muted-foreground">
                Attach 1–4 documents so our team can verify you and unlock the{" "}
                <span className="text-primary font-semibold">Verified Host</span> badge.
              </p>
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex gap-3 text-xs text-amber-800 dark:text-amber-400">
              <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
              <div>
                <p className="font-semibold mb-1">Your documents stay secure</p>
                <p>
                  Only ChargePush admins see your documents during review. Mask sensitive numbers (show only
                  the first and last few digits) — a full Aadhaar/PAN number is never required.
                </p>
              </div>
            </div>

            {/* Current type picker */}
            <div className="space-y-3">
              <label className="block text-xs font-medium text-muted-foreground uppercase tracking-wide">Add a document</label>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {DOC_TYPE_META.map(m => (
                  <button
                    key={m.type}
                    onClick={() => setDocType(m.type)}
                    className={`p-3 rounded-xl border-2 text-left transition-all ${
                      docType === m.type
                        ? "border-primary bg-primary/10"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <p className={`text-sm font-medium ${docType === m.type ? "text-primary" : "text-foreground"}`}>
                      {m.label}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-tight">{m.hint}</p>
                  </button>
                ))}
              </div>
              <input
                type="text"
                value={docDetail}
                onChange={e => setDocDetail(e.target.value)}
                placeholder="Masked number or link, e.g. ••••1234 or https://drive.google.com/…"
                className="w-full px-4 py-3 border border-border rounded-xl text-sm bg-background text-foreground focus:ring-2 focus:ring-primary focus:border-transparent transition-all"
              />
              <Button
                type="button"
                variant="outline"
                disabled={!docDetail.trim() || form.documents.length >= 4}
                onClick={() => {
                  const meta = DOC_TYPE_META.find(m => m.type === docType);
                  setForm(prev => ({
                    ...prev,
                    documents: [
                      ...prev.documents,
                      { type: docType, label: meta?.label || docType, detail: docDetail.trim() },
                    ],
                  }));
                  setDocDetail("");
                  toast.success("Document attached");
                }}
                className="w-full gap-2"
              >
                <Plus className="w-4 h-4" /> Add Document
                {form.documents.length >= 4 && " (max 4)"}
              </Button>
            </div>

            {/* Attached documents list */}
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                Attached ({form.documents.length})
              </p>
              {form.documents.length === 0 ? (
                <p className="text-sm text-muted-foreground border border-dashed border-border rounded-xl p-4 text-center">
                  No documents attached yet — add at least one to proceed.
                </p>
              ) : (
                <ul className="space-y-2">
                  {form.documents.map((d, i) => (
                    <li key={i} className="flex items-center gap-3 bg-muted/40 border border-border rounded-xl px-3 py-2.5">
                      <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{d.label}</p>
                        <p className="text-xs text-muted-foreground truncate">{d.detail}</p>
                      </div>
                      <button
                        onClick={() => setForm(prev => ({
                          ...prev, documents: prev.documents.filter((_, j) => j !== i),
                        }))}
                        className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        aria-label="Remove document"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        );

      /* ── Step 5: Confirm & Submit ── */
      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-emerald-500 to-cyan-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-2xl font-bold text-foreground mb-2">Confirm &amp; Submit</h3>
              <p className="text-muted-foreground">Review your details and complete registration</p>
            </div>

            {form.coordinates ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium text-foreground flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    Location pin confirmed
                  </p>
                  <button
                    onClick={() => { setGpsSuccess(false); handleGetGps(); }}
                    disabled={gpsLoading}
                    className="flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline disabled:opacity-50"
                  >
                    {gpsLoading ? (
                      <><Loader2 className="w-3 h-3 animate-spin" />Re-detecting…</>
                    ) : (
                      <><Navigation className="w-3 h-3" />Re-detect GPS</>
                    )}
                  </button>
                </div>

                <LocationPickerMap
                  value={form.coordinates}
                  onChange={coords => handleManualPin(coords.lat, coords.lng)}
                  accuracyMeters={locationAccuracy}
                  city={form.city}
                  height="180px"
                  showZoomControl={false}
                />
              </div>
            ) : (
              <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl p-4 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">Location pin required</p>
                  <p className="text-xs text-amber-700 dark:text-amber-400 mb-3">
                    No GPS coordinates are set yet. Please go back to Step 2 and either click “Use My Current Location” or search for your address in the autocomplete field.
                  </p>
                  <button
                    onClick={() => setStep(2)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-600 text-white hover:bg-amber-700 transition-colors"
                  >
                    Go back to Location Details
                  </button>
                </div>
              </div>
            )}

            {/* ── Summary grid ── */}
            <div className="bg-muted/40 rounded-2xl p-5 space-y-4 border border-border">
              <div className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Name</p>
                  <p className="font-medium text-foreground">{form.fullName || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Phone</p>
                  <p className="font-medium text-foreground">{form.phone || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">City</p>
                  <p className="font-medium text-foreground">{form.city || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Outlet</p>
                  <p className="font-medium text-foreground">{form.outletType || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Price / hr</p>
                  <p className="font-medium text-foreground">₹{form.pricePerHour || "—"}</p>
                </div>
                <div>
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-0.5">Hours</p>
                  <p className="font-medium text-foreground">{form.availableHours || "—"}</p>
                </div>
              </div>
              {form.documents.length > 0 && (
                <div className="pt-3 border-t border-border/60">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-2 flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5" /> Verification documents ({form.documents.length})
                  </p>
                  <ul className="space-y-1.5">
                    {form.documents.map((d, i) => (
                      <li key={i} className="text-xs text-foreground flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                        <span>{d.label}</span>
                        <span className="text-muted-foreground truncate">· {d.detail}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <div className="pt-3 border-t border-border/60">
                <label className="text-muted-foreground text-xs uppercase tracking-wide mb-1.5 flex items-center gap-1.5">
                  <Gift className="w-3.5 h-3.5 text-ev-green" /> Host referral code (optional)
                </label>
                <input
                  type="text"
                  value={form.referralCode}
                  onChange={(e) => update("referralCode", e.target.value.toUpperCase().slice(0, 20))}
                  placeholder="e.g. VS-1A2B3C4D-9X — the code of a host who invited you"
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
                <p className="text-[11px] text-muted-foreground mt-1">Your referrer gets ₹50 credit when your listing is approved.</p>
              </div>
              {form.googleMapsLink && (
                <div className="pt-3 border-t border-border/60">
                  <p className="text-muted-foreground text-xs uppercase tracking-wide mb-1">Google Maps link</p>
                  <a
                    href={form.googleMapsLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline break-all"
                  >
                    <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                    {form.googleMapsLink}
                  </a>
                </div>
              )}
            </div>

            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
              <h4 className="font-medium text-amber-900 dark:text-amber-300 mb-2 text-sm">Verification Process</h4>
              <ul className="text-xs text-amber-800 dark:text-amber-400 space-y-1">
                <li>• <strong>Verification required:</strong> Your listing is reviewed before it is shown as verified.</li>
                <li>• Our operations team reviews submitted identity documents within 24–48 hours.</li>
                <li>• You will receive a notification once your listing review is complete.</li>
                <li>• Your charging spot will start attracting riders upon approval.</li>
              </ul>
            </div>

            <div className="flex items-start gap-3">
              <input type="checkbox" id="terms" checked={form.agreeToTerms}
                onChange={e => update("agreeToTerms", e.checked)}
                className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-primary" />
              <label htmlFor="terms" className="text-sm text-muted-foreground">
                I agree to the{" "}
                <span className="text-primary underline cursor-pointer">Terms of Service</span>{" "}
                and{" "}
                <span className="text-primary underline cursor-pointer">Privacy Policy</span>.
                I confirm that my outlet information is accurate.
              </label>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // ─────────────────────────────────────────────────────
  // Render
  // ─────────────────────────────────────────────────────
  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end sm:items-center justify-center sm:p-4">
      <div className="bg-background rounded-t-3xl sm:rounded-3xl shadow-2xl w-full sm:max-w-5xl max-h-[95vh] sm:max-h-[90vh] overflow-hidden relative flex flex-col">

        {/* Header */}
        <div className="sticky top-0 bg-background border-b border-border px-4 sm:px-6 py-4 sm:py-5 z-10">
          <div className="flex items-center justify-between mb-4">
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-muted transition-colors" aria-label="Close registration">
              <X className="w-5 h-5" />
            </button>
            <button
              onClick={() => setPreviewOpen(v => !v)}
              className={`hidden lg:flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold border transition-colors ${
                previewOpen ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:bg-muted"
              }`}
            >
              <Eye className="w-3.5 h-3.5" /> {previewOpen ? "Hide Live Preview" : "Show Live Preview"}
            </button>
          </div>
          <StepIndicator
            currentStep={step}
            totalSteps={TOTAL_STEPS}
            stepLabels={STEPS.map((s) => s.label)}
          />
        </div>

        {/* Body: form + live preview */}
        <div className="flex-1 overflow-y-auto">
          <div className="flex flex-col lg:flex-row">
            <div className="flex-1 px-4 sm:px-6 py-5 max-h-[calc(95vh-200px)] sm:max-h-[calc(90vh-200px)]">
              {renderStep()}
            </div>

            {/* ── Live preview pane (desktop) ── */}
            {previewOpen && (
              <div className="hidden lg:flex flex-col w-72 border-l border-border bg-muted/30 p-5 gap-4 shrink-0 max-h-[calc(90vh-200px)] overflow-y-auto">
                <div>
                  <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-muted-foreground mb-2">
                    Live Listing Preview
                  </p>
                  <div className="bg-background rounded-2xl border border-border shadow-sm p-4 space-y-3">
                    <div className="h-24 rounded-xl gradient-green flex items-center justify-center">
                      <Zap className="w-8 h-8 text-white/80" />
                    </div>
                    <div>
                      <h4 className="font-display font-semibold text-sm truncate">
                        {form.fullName || "Your Name"}'s Charging Spot
                      </h4>
                      <p className="text-xs text-muted-foreground truncate">
                        {form.address || "Your street address"} · {form.city || "City"}
                      </p>
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        {form.coordSource === "gps" ? "GPS pinned" : form.coordinates ? "Address pinned" : "No pin yet"}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        form.coordinates
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-muted text-muted-foreground"
                      }`}>
                        {form.coordinates ? "Ready" : "Missing pin"}
                      </span>
                    </div>
                    <div className="border-t border-border pt-2.5 space-y-2 text-xs">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Outlet</span>
                        <span className="font-medium">{form.outletType || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Speed</span>
                        <span className="font-medium">{form.chargingSpeed || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Hours</span>
                        <span className="font-medium">{form.availableHours || "—"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Price</span>
                        <span className="font-semibold text-primary">
                          {form.pricePerHour ? `₹${form.pricePerHour}/hr` : "—"}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Docs</span>
                        <span className="font-medium">{form.documents.length} attached</span>
                      </div>
                      {form.facilities.length > 0 && (
                        <div>
                          <span className="text-muted-foreground">Facilities</span>
                          <div className="mt-1">
                            <FacilitiesChips amenities={form.facilities.map((id) => {
                              const f = FACILITY_MAP.get(id);
                              return f ? { id: f.id, icon: f.icon, name: f.name } : null;
                            }).filter(Boolean)} />
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-[11px] text-muted-foreground leading-relaxed">
                  This is how riders will see your listing on ChargePush. Keep filling the form — the preview updates instantly.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t border-border px-4 sm:px-6 py-4 sm:py-5">
          <div className="flex items-center justify-between">
            <Button variant="outline" onClick={step === 1 ? onClose : () => setStep(s => s - 1)}
              disabled={isSubmitting} className="flex items-center gap-2">
              {step > 1 && <ArrowLeft className="w-4 h-4" />}
              {step === 1 ? "Cancel" : "Previous"}
            </Button>

            {step === TOTAL_STEPS ? (
              <Button onClick={handleSubmit} disabled={isSubmitting || !form.agreeToTerms}
                className="flex items-center gap-2 px-8 gradient-green hover:opacity-90">
                {isSubmitting ? (
                  <><Loader2 className="w-4 h-4 animate-spin" />Registering…</>
                ) : (
                  <><Check className="w-4 h-4" />Complete Registration</>
                )}
              </Button>
            ) : (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}
                className="flex items-center gap-2 px-8">
                Next Step <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
          {!canProceed() && step < TOTAL_STEPS && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              {step === 2
                ? "Please search for an address or use GPS to pin your location"
                : step === 4
                  ? "Attach at least one document to continue"
                  : "Please fill in all required fields to continue"}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default HostRegistrationModal;
