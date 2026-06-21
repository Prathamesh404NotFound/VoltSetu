import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, within } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BookingModal from "./BookingModal";
import { useIsMobile, useIsDesktop } from "@/hooks/use-mobile";

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("@/lib/bookingService", () => ({
  submitBookingRequest: vi.fn().mockResolvedValue("req-1"),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: vi.fn(() => false),
  useIsDesktop: vi.fn(() => false),
}));

const spot = {
  id: "spot-1",
  name: "Green Valley Charge",
  hostName: "Rajesh Kumar",
  hostPhone: "+91 9876543210",
  pricePerHour: 60,
  city: "Kolhapur",
  address: "123 Main Road, Kolhapur",
  outletType: "16-Amp Socket",
  chargingSpeed: "fast",
  isVerified: true,
  distance: 1.2,
  availableHours: "Mon–Sat, 8 AM – 8 PM",
  amenities: [{ id: "a1", name: "Covered parking", icon: "car", available: true }],
};

function goToStep(step: number) {
  for (let i = 1; i < step; i++) {
    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
  }
}

function renderModal() {
  return render(
    <MemoryRouter>
      <BookingModal isOpen onClose={vi.fn()} spot={spot} />
    </MemoryRouter>
  );
}

describe("BookingModal responsive layout — mobile (375px)", () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(true);
    vi.mocked(useIsDesktop).mockReturnValue(false);
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
    document.documentElement.style.removeProperty("--booking-keyboard-inset");
  });

  it("uses bottom-sheet layout at mobile width", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toMatch(/max-md:rounded-t-3xl/);
    expect(dialog.className).toMatch(/max-h-\[calc\(85vh/);
    expect(dialog.className).toMatch(/max-md:data-\[state=open\]:slide-in-from-bottom/);
    expect(screen.getByTestId("booking-mobile-sticky-header")).toBeInTheDocument();
  });

  it("shows compact StepIndicator without dots in sticky header", () => {
    renderModal();
    const stickyHeader = screen.getByTestId("booking-mobile-sticky-header");
    const indicator = within(stickyHeader).getByTestId("step-indicator");
    expect(within(indicator).queryByTestId("step-indicator-dots")).not.toBeInTheDocument();
    expect(within(indicator).getByText(/Step 1 of 4/i)).toBeInTheDocument();
    expect(within(indicator).getByTestId("step-indicator-progress")).toBeInTheDocument();
  });

  it("pins step 1 hero image in sticky header on mobile", () => {
    renderModal();
    const stickyHeader = screen.getByTestId("booking-mobile-sticky-header");
    expect(within(stickyHeader).getByTestId("booking-step-1-hero")).toBeInTheDocument();
    expect(within(screen.getByTestId("booking-step-1")).queryByTestId("booking-step-1-hero")).not.toBeInTheDocument();
  });

  it("keeps footer outside scroll area on step 4", () => {
    renderModal();
    goToStep(4);
    const dialog = screen.getByRole("dialog");
    const footer = screen.getByTestId("booking-step-footer");
    const scrollPane = dialog.querySelector(".overflow-y-auto");
    expect(scrollPane).toBeTruthy();
    expect(scrollPane!.contains(footer)).toBe(false);
    expect(within(footer).getByRole("button", { name: /confirm booking/i })).toBeInTheDocument();
  });

  it("uses 2-column duration grid at mobile width", () => {
    renderModal();
    goToStep(2);
    const chips = screen.getByTestId("duration-chips");
    expect(chips.className).toMatch(/grid-cols-2/);
  });

  it("keeps footer visible when keyboard inset shrinks the sheet on step 3", () => {
    const viewport = {
      height: 320,
      offsetTop: 0,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    };
    Object.defineProperty(window, "innerHeight", { writable: true, configurable: true, value: 667 });
    Object.defineProperty(window, "visualViewport", {
      writable: true,
      configurable: true,
      value: viewport,
    });

    renderModal();
    goToStep(3);

    const resizeHandler = viewport.addEventListener.mock.calls.find(
      (call) => call[0] === "resize"
    )?.[1] as (() => void) | undefined;
    resizeHandler?.();

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toMatch(/max-md:bottom-\[var\(--booking-keyboard-inset/);
    expect(document.documentElement.style.getPropertyValue("--booking-keyboard-inset")).toBe("347px");

    const footer = screen.getByTestId("booking-step-footer");
    expect(within(footer).getByRole("button", { name: /^next$/i })).toBeEnabled();

    fireEvent.focus(screen.getByLabelText(/add a note for the host/i));
    expect(within(footer).getByRole("button", { name: /^next$/i })).toBeInTheDocument();
  });
});

describe("BookingModal responsive layout — tablet (768px)", () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false);
    vi.mocked(useIsDesktop).mockReturnValue(false);
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 768 });
  });

  it("uses centered modal layout on tablet", () => {
    renderModal();
    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toMatch(/md:max-w-\[500px\]/);
    expect(dialog.className).toMatch(/md:rounded-2xl/);
    expect(screen.queryByTestId("booking-mobile-sticky-header")).not.toBeInTheDocument();
  });

  it("shows full StepIndicator with dots on tablet", () => {
    renderModal();
    const indicator = screen.getByTestId("step-indicator");
    expect(within(indicator).getByTestId("step-indicator-dots")).toBeInTheDocument();
    expect(within(indicator).queryByTestId("step-indicator-desktop-labels")).not.toBeInTheDocument();
  });

  it("renders all four steps with scrollable content and footer on step 4", () => {
    renderModal();
    for (let step = 1; step <= 4; step++) {
      expect(screen.getByTestId(`booking-step-${step}`)).toBeInTheDocument();
      if (step < 4) {
        fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
      }
    }
    expect(screen.getByTestId("booking-step-footer")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm booking/i })).toBeInTheDocument();
  });
});

describe("BookingModal responsive layout — desktop (1024px+)", () => {
  beforeEach(() => {
    vi.mocked(useIsMobile).mockReturnValue(false);
    vi.mocked(useIsDesktop).mockReturnValue(true);
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 1280 });
  });

  it("shows desktop StepIndicator with all step labels and dots", () => {
    renderModal();
    const indicator = screen.getByTestId("step-indicator");
    expect(within(indicator).getByTestId("step-indicator-desktop-labels")).toBeInTheDocument();
    expect(within(indicator).getByText(/1\. Confirm Spot/i)).toBeInTheDocument();
    expect(within(indicator).getByText(/4\. Review & Confirm/i)).toBeInTheDocument();
    expect(within(indicator).getByTestId("step-indicator-dots")).toBeInTheDocument();
  });

  it("uses auto-width nav buttons aligned right, not full-width stretch", () => {
    renderModal();
    const nextBtn = screen.getByRole("button", { name: /^next$/i });
    expect(nextBtn.className).not.toMatch(/\bflex-1\b/);
    expect(nextBtn.className).toMatch(/px-8/);

    goToStep(2);
    const backBtn = screen.getByRole("button", { name: /back/i });
    expect(backBtn.className).not.toMatch(/\bflex-1\b/);
  });

  it("shows step 1 hero inside scroll content on desktop", () => {
    renderModal();
    expect(within(screen.getByTestId("booking-step-1")).getByTestId("booking-step-1-hero")).toBeInTheDocument();
    expect(screen.queryByTestId("booking-mobile-sticky-header")).not.toBeInTheDocument();
  });
});
