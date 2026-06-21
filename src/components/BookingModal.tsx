import { useState, useEffect, useRef, useCallback, type ReactNode, type FocusEvent } from "react";
import {
  Zap,
  Loader2,
  Phone,
  ArrowLeft,
  MapPin,
  Clock,
  Minus,
  Plus,
  BadgeCheck,
  MessageSquare,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { submitBookingRequest } from "@/lib/bookingService";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import { useIsMobile, useIsDesktop } from "@/hooks/use-mobile";
import StepIndicator from "@/components/StepIndicator";
import type { Amenity } from "@/types";

/** Mobile bottom-sheet (< md / 768px). Tablet+ uses centered Dialog. */
const bookingDialogContentClass = (extra?: string) =>
  cn(
    "p-0 gap-0 overflow-hidden border bg-background shadow-lg duration-300",
    "max-md:fixed max-md:inset-x-0 max-md:bottom-[var(--booking-keyboard-inset,0px)] max-md:top-auto max-md:left-0",
    "max-md:translate-x-0 max-md:translate-y-0 max-md:w-full max-md:max-w-full",
    "max-md:max-h-[calc(85vh-var(--booking-keyboard-inset,0px))] max-md:rounded-t-3xl max-md:rounded-b-none",
    "max-md:flex max-md:flex-col max-md:pb-[env(safe-area-inset-bottom)]",
    "max-md:data-[state=open]:animate-in max-md:data-[state=closed]:animate-out",
    "max-md:data-[state=open]:fade-in-0 max-md:data-[state=closed]:fade-out-0",
    "max-md:data-[state=open]:slide-in-from-bottom max-md:data-[state=closed]:slide-out-to-bottom",
    "max-md:data-[state=open]:duration-500 max-md:data-[state=closed]:duration-300",
    "max-md:[&>button]:top-3 max-md:[&>button]:right-3 max-md:[&>button]:h-10 max-md:[&>button]:w-10",
    "md:fixed md:inset-x-auto md:bottom-auto md:left-[50%] md:top-[50%]",
    "md:translate-x-[-50%] md:translate-y-[-50%] md:max-h-[90vh] md:flex md:flex-col",
    "md:rounded-2xl md:max-w-[500px] lg:max-w-[540px]",
    extra
  );

function useKeyboardInset(active: boolean) {
  useEffect(() => {
    if (!active) return;

    const viewport = window.visualViewport;
    if (!viewport) return;

    const updateInset = () => {
      const inset = Math.max(0, window.innerHeight - viewport.height - viewport.offsetTop);
      document.documentElement.style.setProperty("--booking-keyboard-inset", `${inset}px`);
    };

    updateInset();
    viewport.addEventListener("resize", updateInset);
    viewport.addEventListener("scroll", updateInset);

    return () => {
      viewport.removeEventListener("resize", updateInset);
      viewport.removeEventListener("scroll", updateInset);
      document.documentElement.style.removeProperty("--booking-keyboard-inset");
    };
  }, [active]);
}

function MobileSheetHandle() {
  return (
    <div className="md:hidden flex justify-center pt-3 pb-2 shrink-0" aria-hidden="true">
      <div className="w-10 h-1 rounded-full bg-muted-foreground/35" />
    </div>
  );
}

function BookingDialogContent({
  className,
  header,
  stickyHeader,
  footer,
  children,
  scrollRef,
}: {
  className?: string;
  header?: ReactNode;
  stickyHeader?: ReactNode;
  footer?: ReactNode;
  children: ReactNode;
  scrollRef?: React.RefObject<HTMLDivElement>;
}) {
  return (
    <DialogContent className={bookingDialogContentClass(className)}>
      <MobileSheetHandle />
      {header}
      {stickyHeader}
      <div
        ref={scrollRef}
        className="flex-1 min-h-0 overflow-y-auto overscroll-contain max-md:touch-pan-y"
      >
        {children}
      </div>
      {footer}
    </DialogContent>
  );
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  spot: {
    id?: string;
    name: string;
    hostName: string;
    hostPhone?: string;
    pricePerHour: number;
    outletType?: string;
    chargingSpeed?: string;
    city?: string;
    address?: string;
    photos?: string[];
    distance?: string | number;
    isVerified?: boolean;
    availableHours?: string;
    amenities?: Amenity[];
  };
}

const BOOKING_STEP_LABELS = [
  "Confirm Spot",
  "Choose Duration",
  "Your Details",
  "Review & Confirm",
];
const TOTAL_BOOKING_STEPS = 4;

const MIN_DURATION = 15;
const CUSTOM_STEP = 15;
const NOTE_MAX_LENGTH = 150;

const DURATIONS = [
  { label: "30 min", value: 30 },
  { label: "1 hr", value: 60 },
  { label: "2 hr", value: 120 },
  { label: "3 hr", value: 180 },
  { label: "Custom", value: 0 },
];

/** Matches SpotCard overlay badge styling (adapted for light step panels). */
const spotBadgeClass = "inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium shadow-sm";

function formatChargingSpeed(speed: string): string {
  const labels: Record<string, string> = {
    slow: "Slow (2–3 kW)",
    fast: "Fast (7–22 kW)",
    rapid: "Rapid (50+ kW)",
    ultra: "Ultra (150+ kW)",
  };
  return labels[speed] ?? speed.replace(/_/g, " ");
}

function formatDistance(distance?: string | number): string | null {
  if (distance === undefined || distance === null || distance === "") return null;
  if (typeof distance === "number") return `${distance.toFixed(1)} km`;
  return distance;
}

function Step1SpotHero({
  spot,
  className,
}: {
  spot: BookingModalProps["spot"];
  className?: string;
}) {
  const spotImage = spot.photos?.[0];

  return (
    <div
      className={cn("relative h-40 rounded-xl overflow-hidden border border-border", className)}
      data-testid="booking-step-1-hero"
    >
      <SpotThumbnail src={spotImage} alt={spot.name} />
      <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent pointer-events-none" />
      <div className="absolute bottom-3 left-3 right-3 flex flex-wrap gap-1.5">
        {spot.outletType && (
          <span className={cn(spotBadgeClass, "bg-black/70 backdrop-blur-md text-white")}>
            <Zap className="w-3 h-3 text-yellow-400" />
            {spot.outletType}
          </span>
        )}
        {spot.chargingSpeed && (
          <span className={cn(spotBadgeClass, "bg-primary/90 backdrop-blur-md text-primary-foreground")}>
            <Zap className="w-3 h-3" />
            {formatChargingSpeed(spot.chargingSpeed)}
          </span>
        )}
      </div>
    </div>
  );
}

function SpotThumbnail({ src, alt }: { src?: string; alt: string }) {
  const [imgError, setImgError] = useState(false);
  const showImage = Boolean(src) && !imgError;

  useEffect(() => {
    setImgError(false);
  }, [src]);

  if (!showImage) {
    return (
      <div className="w-full h-full bg-gradient-to-br from-primary/20 to-ev-green/20 flex items-center justify-center">
        <Zap className="w-6 h-6 text-primary/50" />
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      className="w-full h-full object-cover"
      onError={() => setImgError(true)}
    />
  );
}

export default function BookingModal({ isOpen, onClose, spot }: BookingModalProps) {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  const isDesktop = useIsDesktop();
  const scrollRef = useRef<HTMLDivElement>(null);

  const [currentStep, setCurrentStep] = useState(1);
  const [stepValidationError, setStepValidationError] = useState("");
  const [duration, setDuration] = useState<number>(30);
  const [customMinutes, setCustomMinutes] = useState(90);
  const [message, setMessage] = useState("");
  const [paymentAcknowledged, setPaymentAcknowledged] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [durationError, setDurationError] = useState(false);

  const activeDuration = duration === 0 ? customMinutes : duration;
  const estimatedCost = Math.round((spot.pricePerHour / 60) * activeDuration);
  const isDurationValid = activeDuration >= MIN_DURATION;

  const spotImage = spot.photos?.[0];
  const spotLocation = spot.address || spot.city || "Unknown area";
  const spotDistance = formatDistance(spot.distance);
  const hostFirstName = spot.hostName.trim().split(/\s+/)[0] || spot.hostName;
  const availableAmenities =
    spot.amenities?.filter((a) => a.available && a.name?.trim()) ?? [];

  useEffect(() => {
    if (!isOpen) {
      setCurrentStep(1);
      setSuccess(false);
      setStepValidationError("");
      setDurationError(false);
      setDuration(30);
      setCustomMinutes(90);
      setMessage("");
      setPaymentAcknowledged(false);
      setLoading(false);
    }
  }, [isOpen]);

  const formatDuration = (mins: number) => {
    if (mins >= 60 && mins % 60 === 0) return `${mins / 60} hr`;
    if (mins >= 60) return `${Math.floor(mins / 60)} hr ${mins % 60} min`;
    return `${mins} min`;
  };

  const canProceedStep = useCallback(
    (step: number): boolean => {
      switch (step) {
        case 1:
          return true;
        case 2:
          return isDurationValid && activeDuration > 0;
        case 3:
          return true;
        case 4:
          return (
            Boolean(spot.id) &&
            isDurationValid &&
            activeDuration > 0 &&
            paymentAcknowledged
          );
        default:
          return true;
      }
    },
    [spot.id, isDurationValid, activeDuration, paymentAcknowledged]
  );

  const getStepValidationMessage = useCallback(
    (step: number): string => {
      switch (step) {
        case 2:
          return `Please select a charging duration (minimum ${MIN_DURATION} minutes).`;
        case 4:
          if (!paymentAcknowledged) {
            return "Please confirm you understand payment is made directly to the host on arrival.";
          }
          return "Please complete all required booking details before confirming.";
        default:
          return "Please complete the required fields to continue.";
      }
    },
    [paymentAcknowledged]
  );

  const handleNoteChange = (value: string) => {
    setMessage(value.slice(0, NOTE_MAX_LENGTH));
  };

  const handleDurationSelect = (value: number) => {
    setDuration(value);
    setDurationError(false);
    setStepValidationError("");
  };

  const adjustCustomMinutes = (delta: number) => {
    setCustomMinutes((prev) => Math.max(MIN_DURATION, prev + delta));
    setDurationError(false);
    setStepValidationError("");
  };

  const formatDurationForPrice = (mins: number) => {
    if (mins >= 60 && mins % 60 === 0) return `${mins / 60} hr`;
    return `${mins} min`;
  };

  const scrollToTop = () => {
    const el = scrollRef.current;
    if (!el) return;
    if (typeof el.scrollTo === "function") {
      el.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      el.scrollTop = 0;
    }
  };

  const nextStep = () => {
    if (!canProceedStep(currentStep)) {
      setStepValidationError(getStepValidationMessage(currentStep));
      if (currentStep === 2) setDurationError(true);
      return;
    }
    setStepValidationError("");
    setDurationError(false);
    setCurrentStep((s) => Math.min(TOTAL_BOOKING_STEPS, s + 1));
    scrollToTop();
  };

  const prevStep = () => {
    setStepValidationError("");
    setDurationError(false);
    setCurrentStep((s) => Math.max(1, s - 1));
    scrollToTop();
  };

  const handleBook = async () => {
    if (!canProceedStep(4)) {
      setStepValidationError(getStepValidationMessage(4));
      setDurationError(true);
      return;
    }
    if (!spot.id) {
      toast.error("Invalid spot selected.");
      return;
    }

    setLoading(true);
    try {
      await submitBookingRequest({
        spotId: spot.id,
        spotName: spot.name,
        hostName: spot.hostName,
        hostPhone: spot.hostPhone || "",
        duration: activeDuration,
        message: message.trim(),
        pricePerHour: spot.pricePerHour,
        estimatedCost,
        city: spot.city || "Unknown",
        outletType: spot.outletType || "Standard",
      });

      setSuccess(true);
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : "Failed to submit booking request.";
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleFinish = () => {
    onClose();
    navigate("/dashboard/bookings");
  };

  const getWhatsAppLink = (prefill?: string) => {
    if (!spot.hostPhone) return "#";
    const num = spot.hostPhone.replace(/\D/g, "");
    const base = `https://wa.me/${num}`;
    if (prefill) return `${base}?text=${encodeURIComponent(prefill)}`;
    return base;
  };

  const getPhoneLink = () => {
    if (!spot.hostPhone) return "#";
    const num = spot.hostPhone.replace(/\D/g, "");
    return `tel:+${num}`;
  };

  const whatsAppOnMyWayLink = getWhatsAppLink(
    `Hi ${spot.hostName}, I just booked "${spot.name}" — on my way!`
  );

  const stepIndicatorVariant = isMobile ? "compact" : isDesktop ? "desktop" : "default";

  useKeyboardInset(isMobile && isOpen);

  const handleFieldFocus = useCallback(
    (e: FocusEvent<HTMLElement>) => {
      if (!isMobile) return;
      window.setTimeout(() => {
        if (typeof e.target.scrollIntoView === "function") {
          e.target.scrollIntoView({ block: "center", behavior: "smooth" });
        }
      }, 300);
    },
    [isMobile]
  );

  if (success) {
    return (
      <Dialog open={isOpen} onOpenChange={(open) => !open && handleFinish()}>
        <BookingDialogContent
          className="md:text-center md:p-8"
          footer={
            <div className="shrink-0 p-4 pt-0 md:p-0 md:pt-4 border-t border-border/60 md:border-0 max-md:pb-[max(1rem,env(safe-area-inset-bottom))]">
              <Button onClick={handleFinish} className="w-full md:w-auto md:px-8 rounded-xl">
                View in My Bookings
              </Button>
            </div>
          }
        >
          <div className="p-6 pt-2 md:p-0 text-center">
            <div className="w-16 h-16 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-6">
              <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <DialogTitle className="text-2xl font-bold mb-2">Request Sent!</DialogTitle>
            <DialogDescription className="text-base text-muted-foreground mb-4">
              Your booking request has been sent to{" "}
              <span className="font-semibold text-foreground">{spot.hostName}</span>.
            </DialogDescription>
            <div
              className="bg-muted/50 p-4 rounded-xl text-sm mb-4 flex flex-col gap-2 text-left"
              data-testid="booking-success-view"
            >
              <p
                className="font-medium text-foreground text-center pb-3 border-b border-border/60"
                data-testid="booking-success-summary"
              >
                Booked {spot.name} for {formatDuration(activeDuration)} — ₹{estimatedCost} due on
                arrival
              </p>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Spot:</span>
                <span className="font-semibold">{spot.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Duration:</span>
                <span className="font-semibold">{formatDuration(activeDuration)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Est. Cost:</span>
                <span className="font-semibold text-green-600">₹{estimatedCost}</span>
              </div>

              {spot.hostPhone && (
                <div className="flex gap-2 pt-3 mt-1 border-t border-border/60">
                  <a
                    href={getPhoneLink()}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-transparent hover:bg-muted transition-colors"
                    aria-label="Call host"
                  >
                    <Phone className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm font-medium text-foreground">Call</span>
                  </a>
                  <a
                    href={whatsAppOnMyWayLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border bg-transparent hover:bg-muted transition-colors"
                    aria-label="Message host on WhatsApp"
                  >
                    <svg viewBox="0 0 24 24" className="w-4 h-4 fill-muted-foreground" aria-hidden="true">
                      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51a12.8 12.8 0 0 0-.57-.01c-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413Z" />
                    </svg>
                    <span className="text-sm font-medium text-foreground">WhatsApp</span>
                  </a>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mb-2 px-1">
              The host will confirm your request shortly — you'll get a notification in the
              bell icon once approved. Check My Bookings anytime for status updates.
            </p>
          </div>
        </BookingDialogContent>
      </Dialog>
    );
  }

  const stepFooter = (
    <div
      className="shrink-0 border-t border-border bg-background px-4 py-4 max-md:pb-[max(1rem,env(safe-area-inset-bottom))]"
      data-testid="booking-step-footer"
    >
      <div className={cn("flex items-center gap-3", !isMobile && "justify-end")}>
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={loading}
            className={cn(
              "flex items-center gap-2 rounded-xl",
              !isMobile && "min-w-[100px]"
            )}
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}

        {currentStep < TOTAL_BOOKING_STEPS ? (
          <Button
            onClick={nextStep}
            disabled={!canProceedStep(currentStep)}
            className={cn(
              "rounded-xl gradient-primary text-white border-0 hover:opacity-90",
              isMobile ? "flex-1" : "px-8 min-w-[120px]"
            )}
          >
            Next
          </Button>
        ) : (
          <Button
            onClick={handleBook}
            disabled={loading || !canProceedStep(4)}
            className={cn(
              "rounded-xl gradient-primary text-white border-0 hover:opacity-90",
              isMobile ? "flex-1" : "px-8 min-w-[160px]"
            )}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Booking...
              </>
            ) : (
              "Confirm Booking"
            )}
          </Button>
        )}
      </div>

      {(stepValidationError || (durationError && currentStep === 2)) && (
          <p className="text-xs text-destructive text-center mt-2">
            {stepValidationError || getStepValidationMessage(currentStep)}
          </p>
        )}
      {!canProceedStep(currentStep) &&
        currentStep < TOTAL_BOOKING_STEPS &&
        !stepValidationError &&
        !(durationError && currentStep === 2) && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {getStepValidationMessage(currentStep)}
          </p>
        )}
      {currentStep === TOTAL_BOOKING_STEPS &&
        !paymentAcknowledged &&
        !loading && (
          <p className="text-xs text-muted-foreground text-center mt-2">
            {getStepValidationMessage(4)}
          </p>
        )}
    </div>
  );

  const mobileStickyHeader = isMobile ? (
    <div
      className="md:hidden shrink-0 bg-background border-b border-border z-10"
      data-testid="booking-mobile-sticky-header"
    >
      <div className="px-4 pt-1 pb-3">
        <StepIndicator
          currentStep={currentStep}
          totalSteps={TOTAL_BOOKING_STEPS}
          stepLabels={BOOKING_STEP_LABELS}
          labelAlign="center"
          variant="compact"
        />
      </div>
      {currentStep === 1 && (
        <div className="px-4 pb-3">
          <Step1SpotHero spot={spot} />
        </div>
      )}
    </div>
  ) : null;

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <BookingDialogContent
        stickyHeader={mobileStickyHeader}
        footer={stepFooter}
        scrollRef={scrollRef}
      >
        <div className="p-6 space-y-5">
          <DialogTitle className="sr-only">Book Charging Spot</DialogTitle>
          {!isMobile && (
            <StepIndicator
              currentStep={currentStep}
              totalSteps={TOTAL_BOOKING_STEPS}
              stepLabels={BOOKING_STEP_LABELS}
              labelAlign="center"
              variant={stepIndicatorVariant}
            />
          )}

          {currentStep === 1 && (
            <div className="space-y-6" data-testid="booking-step-1">
              {!isMobile && <Step1SpotHero spot={spot} />}

              <div>
                <h3 className="text-xl font-bold text-foreground">{spot.name}</h3>
                <p className="text-sm text-muted-foreground flex items-start gap-1.5 mt-1.5">
                  <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{spotLocation}</span>
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-muted-foreground">Host:</span>
                  <span className="font-medium text-foreground">{hostFirstName}</span>
                  {spot.isVerified && (
                    <BadgeCheck className="w-4 h-4 text-ev-green shrink-0" aria-label="Verified host" />
                  )}
                </div>
                {spotDistance && (
                  <div className="flex items-center gap-1.5 text-muted-foreground">
                    <MapPin className="w-4 h-4 text-primary/70 shrink-0" />
                    <span>{spotDistance} away</span>
                  </div>
                )}
                <div className="flex items-center gap-1.5 font-semibold text-foreground">
                  ₹{spot.pricePerHour}
                  <span className="text-xs font-normal text-muted-foreground">/hr</span>
                </div>
              </div>

              {availableAmenities.length > 0 && (
                <div>
                  <label className="block text-sm font-medium mb-2">Amenities</label>
                  <div className="flex flex-wrap gap-2">
                    {availableAmenities.map((amenity) => (
                      <span
                        key={amenity.id}
                        className="px-3 py-1 rounded-full bg-muted border border-border text-xs font-medium text-foreground"
                      >
                        {amenity.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <p className="text-sm text-muted-foreground text-center pt-4 border-t border-border">
                Is this the right spot?
              </p>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-6" data-testid="booking-step-2">
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground mb-1">Choose Duration</h3>
                <p className="text-sm text-muted-foreground">How long do you plan to charge?</p>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">Charging Duration</label>
                <div className="grid grid-cols-2 gap-2 md:flex md:flex-wrap" data-testid="duration-chips">
                  {DURATIONS.map((d) => (
                    <button
                      key={d.label}
                      type="button"
                      onClick={() => handleDurationSelect(d.value)}
                      className={cn(
                        "px-3 py-2 rounded-xl text-sm font-medium transition-all border text-center",
                        duration === d.value
                          ? "bg-primary text-primary-foreground border-primary shadow-sm"
                          : "bg-background text-muted-foreground border-border hover:bg-muted/80"
                      )}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>

                {duration === 0 && (
                  <div className="flex items-center gap-3 mt-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl"
                      onClick={() => adjustCustomMinutes(-CUSTOM_STEP)}
                      disabled={customMinutes <= MIN_DURATION}
                      aria-label="Decrease duration"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    <div className="flex-1 flex items-center justify-center gap-2 py-3 px-3 rounded-xl border border-border bg-background">
                      <Clock className="w-4 h-4 text-muted-foreground shrink-0" />
                      <span className="font-semibold text-sm">{customMinutes} min</span>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-10 w-10 shrink-0 rounded-xl"
                      onClick={() => adjustCustomMinutes(CUSTOM_STEP)}
                      aria-label="Increase duration"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                )}

                {(durationError || !canProceedStep(2)) && currentStep === 2 && (
                  <p className="text-xs text-destructive mt-2">
                    {getStepValidationMessage(2)}
                  </p>
                )}
              </div>

              <div className="rounded-xl border border-border bg-muted/40 px-4 py-3 text-sm">
                <span className="font-semibold text-foreground">
                  ₹{spot.pricePerHour} × {formatDurationForPrice(activeDuration)} = ₹{estimatedCost}
                </span>
              </div>

              {spot.availableHours && (
                <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 shrink-0" />
                  This spot is available {spot.availableHours}
                </p>
              )}
            </div>
          )}

          {currentStep === 3 && (
            <div className="space-y-6" data-testid="booking-step-3">
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground mb-1">Your Details</h3>
                <p className="text-sm text-muted-foreground">
                  Optional — help the host recognize you when you arrive
                </p>
              </div>

              <div>
                <label htmlFor="host-note" className="block text-sm font-medium mb-2">
                  Add a note for the host (optional)
                </label>
                <div className="relative">
                  <MessageSquare className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Textarea
                    id="host-note"
                    placeholder="e.g. I'll be on a red Activa, arriving around 6 PM."
                    value={message}
                    onChange={(e) => handleNoteChange(e.target.value)}
                    onFocus={handleFieldFocus}
                    maxLength={NOTE_MAX_LENGTH}
                    className="pl-10 resize-none rounded-xl min-h-[100px]"
                    rows={3}
                  />
                </div>
                <p className="text-xs text-muted-foreground text-right mt-1.5">
                  {message.length}/{NOTE_MAX_LENGTH}
                </p>
              </div>
            </div>
          )}

          {currentStep === 4 && (
            <div className="space-y-6" data-testid="booking-step-4">
              <div className="text-center">
                <h3 className="text-xl font-bold text-foreground mb-1">Review &amp; Confirm</h3>
                <p className="text-sm text-muted-foreground">
                  Check your booking details before sending the request
                </p>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-4 shadow-sm">
                <div className="flex gap-3">
                  <div className="w-16 h-16 rounded-xl overflow-hidden border border-border shrink-0">
                    <SpotThumbnail src={spotImage} alt={spot.name} />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground leading-tight">{spot.name}</p>
                    <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{spotLocation}</p>
                  </div>
                </div>

                <div className="space-y-2 text-sm border-t border-border pt-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{formatDuration(activeDuration)}</span>
                  </div>
                  {message.trim() && (
                    <div className="pt-1">
                      <span className="text-muted-foreground block mb-1">Note for host</span>
                      <p className="text-foreground text-sm bg-muted/40 rounded-lg px-3 py-2">
                        {message.trim()}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <div className="rounded-xl border border-border bg-card p-4 space-y-3 shadow-sm">
                <p className="text-sm font-semibold text-foreground">Booking Summary</p>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Duration</span>
                    <span className="font-medium">{formatDuration(activeDuration)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Rate</span>
                    <span className="font-medium">₹{spot.pricePerHour}/hr</span>
                  </div>
                  <div className="flex justify-between items-baseline pt-1 border-t border-border">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-2xl font-bold text-foreground">₹{estimatedCost}</span>
                  </div>
                  <div className="flex items-center gap-2 pt-1 text-xs text-muted-foreground">
                    <BadgeCheck className="w-3.5 h-3.5 text-ev-green shrink-0" />
                    <span>Pay via Cash/UPI on arrival</span>
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="payment-ack"
                  checked={paymentAcknowledged}
                  onChange={(e) => {
                    setPaymentAcknowledged(e.target.checked);
                    setStepValidationError("");
                  }}
                  className="mt-1 w-4 h-4 text-primary border-border rounded focus:ring-primary"
                />
                <label htmlFor="payment-ack" className="text-sm text-muted-foreground">
                  I understand payment is made directly to the host on arrival
                </label>
              </div>
            </div>
          )}
        </div>
      </BookingDialogContent>
    </Dialog>
  );
}
