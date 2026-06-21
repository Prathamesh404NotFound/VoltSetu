import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BookingModal from "./BookingModal";

const mockSubmit = vi.fn().mockResolvedValue("req-1");

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return { ...actual, useNavigate: () => vi.fn() };
});

vi.mock("@/lib/bookingService", () => ({
  submitBookingRequest: (...args: unknown[]) => mockSubmit(...args),
}));

vi.mock("@/hooks/use-mobile", () => ({
  useIsMobile: () => true,
  useIsDesktop: () => false,
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
};

function goToStep4AndConfirm() {
  fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
  fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
  fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
  fireEvent.click(
    screen.getByLabelText(/I understand payment is made directly to the host on arrival/i)
  );
  fireEvent.click(screen.getByRole("button", { name: /confirm booking/i }));
}

describe("BookingModal mobile bottom sheet", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, "innerWidth", { writable: true, configurable: true, value: 375 });
    document.documentElement.style.removeProperty("--booking-keyboard-inset");
  });

  it("uses bottom-sheet layout classes at mobile width", () => {
    render(
      <MemoryRouter>
        <BookingModal isOpen onClose={vi.fn()} spot={spot} />
      </MemoryRouter>
    );

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toMatch(/max-md:rounded-t-3xl/);
    expect(dialog.className).toMatch(/max-h-\[calc\(85vh/);
    expect(dialog.className).toMatch(/max-md:data-\[state=open\]:slide-in-from-bottom/);
  });

  it("closes via Escape key (backdrop/Escape handled by Radix Dialog)", () => {
    const onClose = vi.fn();
    render(
      <MemoryRouter>
        <BookingModal isOpen onClose={onClose} spot={spot} />
      </MemoryRouter>
    );

    fireEvent.keyDown(document, { key: "Escape", code: "Escape" });
    expect(onClose).toHaveBeenCalled();
  });

  it("adjusts keyboard inset via visualViewport on mobile", () => {
    const viewport = {
      height: 400,
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

    render(
      <MemoryRouter>
        <BookingModal isOpen onClose={vi.fn()} spot={spot} />
      </MemoryRouter>
    );

    const resizeHandler = viewport.addEventListener.mock.calls.find(
      (call) => call[0] === "resize"
    )?.[1] as (() => void) | undefined;
    expect(resizeHandler).toBeDefined();

    resizeHandler?.();
    expect(document.documentElement.style.getPropertyValue("--booking-keyboard-inset")).toBe("267px");
  });

  it("replaces wizard with success view in bottom sheet after Confirm Booking on mobile", async () => {
    render(
      <MemoryRouter>
        <BookingModal isOpen onClose={vi.fn()} spot={spot} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("booking-mobile-sticky-header")).toBeInTheDocument();
    expect(screen.getByTestId("step-indicator")).toBeInTheDocument();

    goToStep4AndConfirm();

    await waitFor(() => {
      expect(screen.getByText("Request Sent!")).toBeInTheDocument();
    });

    const dialog = screen.getByRole("dialog");
    expect(dialog.className).toMatch(/max-md:rounded-t-3xl/);
    expect(dialog.className).toMatch(/max-h-\[calc\(85vh/);

    expect(screen.queryByTestId("booking-step-footer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("booking-mobile-sticky-header")).not.toBeInTheDocument();
    expect(screen.queryByTestId("step-indicator")).not.toBeInTheDocument();
    expect(screen.queryByTestId("booking-step-4")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /^next$/i })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();

    expect(screen.getByTestId("booking-success-view")).toBeInTheDocument();
    expect(screen.getByTestId("booking-success-summary")).toHaveTextContent(
      "Booked Green Valley Charge for 30 min — ₹30 due on arrival"
    );

    expect(screen.getByRole("link", { name: /call host/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /message host on whatsapp/i })).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /view in my bookings/i })).toBeInTheDocument();
    expect(screen.getByText(/host will confirm your request shortly/i)).toBeInTheDocument();

    expect(mockSubmit).toHaveBeenCalledOnce();
  }, 15000);
});
