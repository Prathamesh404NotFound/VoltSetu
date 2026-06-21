import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor, within } from "@testing-library/react";
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
  useIsMobile: () => false,
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
  chargingSpeed: "fast",
  isVerified: true,
  distance: 1.2,
  availableHours: "Mon–Sat, 8 AM – 8 PM",
  amenities: [
    { id: "a1", name: "Covered parking", icon: "car", available: true },
    { id: "a2", name: "Waiting area", icon: "sofa", available: true },
  ],
};

function goToStep4() {
  fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
  fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
  fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
}

function acknowledgePayment() {
  fireEvent.click(
    screen.getByLabelText(/I understand payment is made directly to the host on arrival/i)
  );
}

describe("BookingModal step wizard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("navigates forward and back through all 4 steps", () => {
    render(
      <MemoryRouter>
        <BookingModal isOpen onClose={vi.fn()} spot={spot} />
      </MemoryRouter>
    );

    expect(screen.getByTestId("booking-step-1")).toBeInTheDocument();
    expect(screen.getByText(/Step 1 of 4/i)).toBeInTheDocument();
    expect(screen.getByText("Confirm Spot")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /back/i })).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByTestId("booking-step-2")).toBeInTheDocument();
    expect(screen.getByText(/Step 2 of 4/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByTestId("booking-step-3")).toBeInTheDocument();
    expect(screen.getByLabelText(/add a note for the host/i)).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByTestId("booking-step-4")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /confirm booking/i })).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /back/i }));
    expect(screen.getByTestId("booking-step-3")).toBeInTheDocument();
  }, 15000);

  it("renders step 1 spot details and keeps Next enabled (review-only)", () => {
    render(
      <MemoryRouter>
        <BookingModal
          isOpen
          onClose={vi.fn()}
          spot={{ ...spot, id: undefined }}
        />
      </MemoryRouter>
    );

    expect(screen.getByText("Green Valley Charge")).toBeInTheDocument();
    expect(screen.getByText(/123 Main Road/i)).toBeInTheDocument();
    expect(screen.getByText(/Rajesh/i)).toBeInTheDocument();
    expect(screen.getByText("Covered parking")).toBeInTheDocument();
    expect(screen.getByText(/is this the right spot/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^next$/i })).toBeEnabled();
  });

  it("shows live price on step 2 and requires valid duration", () => {
    render(
      <MemoryRouter>
        <BookingModal isOpen onClose={vi.fn()} spot={spot} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    expect(screen.getByText(/₹60 × 30 min = ₹30/i)).toBeInTheDocument();
    expect(screen.getByText(/This spot is available Mon–Sat/i)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^next$/i })).toBeEnabled();

    fireEvent.click(screen.getByRole("button", { name: /1 hr/i }));
    expect(screen.getByText(/₹60 × 1 hr = ₹60/i)).toBeInTheDocument();
  });

  it("keeps Next enabled on step 3 with optional note and character counter", () => {
    render(
      <MemoryRouter>
        <BookingModal isOpen onClose={vi.fn()} spot={spot} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));

    expect(screen.getByTestId("booking-step-3")).toBeInTheDocument();
    expect(screen.getByText("0/150")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /^next$/i })).toBeEnabled();

    const note = "I'll be on a red Activa";
    fireEvent.change(screen.getByLabelText(/add a note for the host/i), {
      target: { value: note },
    });
    expect(screen.getByText(`${note.length}/150`)).toBeInTheDocument();
  });

  it("shows review summary on step 4 including payment model", () => {
    render(
      <MemoryRouter>
        <BookingModal isOpen onClose={vi.fn()} spot={spot} />
      </MemoryRouter>
    );

    goToStep4();

    const step4 = screen.getByTestId("booking-step-4");
    expect(step4).toBeInTheDocument();
    expect(within(step4).getByText("Green Valley Charge")).toBeInTheDocument();
    expect(within(step4).getAllByText(/30 min/i).length).toBeGreaterThan(0);
    expect(within(step4).getByText("₹30")).toBeInTheDocument();
    expect(within(step4).getByText(/Pay via Cash\/UPI on arrival/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/I understand payment is made directly to the host on arrival/i)
    ).toBeInTheDocument();
  });

  it("disables Confirm Booking until payment acknowledgment is checked", () => {
    render(
      <MemoryRouter>
        <BookingModal isOpen onClose={vi.fn()} spot={spot} />
      </MemoryRouter>
    );

    goToStep4();

    const confirmBtn = screen.getByRole("button", { name: /confirm booking/i });
    expect(confirmBtn).toBeDisabled();

    fireEvent.click(
      screen.getByLabelText(/I understand payment is made directly to the host on arrival/i)
    );
    expect(confirmBtn).toBeEnabled();
  });

  it("submits booking from step 4 after payment acknowledgment", async () => {
    render(
      <MemoryRouter>
        <BookingModal isOpen onClose={vi.fn()} spot={spot} />
      </MemoryRouter>
    );

    goToStep4();
    acknowledgePayment();
    fireEvent.click(screen.getByRole("button", { name: /confirm booking/i }));

    await waitFor(() => {
      expect(screen.getByText("Request Sent!")).toBeInTheDocument();
    });

    expect(mockSubmit).toHaveBeenCalledOnce();
    expect(mockSubmit).toHaveBeenCalledWith({
      spotId: "spot-1",
      spotName: "Green Valley Charge",
      hostName: "Rajesh Kumar",
      hostPhone: "+91 9876543210",
      duration: 30,
      message: "",
      pricePerHour: 60,
      estimatedCost: 30,
      city: "Kolhapur",
      outletType: "16-Amp Socket",
    });
  });

  it("passes optional note from step 3 through review to submitBookingRequest", async () => {
    render(
      <MemoryRouter>
        <BookingModal isOpen onClose={vi.fn()} spot={spot} />
      </MemoryRouter>
    );

    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    fireEvent.click(screen.getByRole("button", { name: /1 hr/i }));
    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));

    const note = "I'll be on a red Activa, arriving around 6 PM.";
    fireEvent.change(screen.getByLabelText(/add a note for the host/i), {
      target: { value: note },
    });
    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));

    expect(screen.getByText(note)).toBeInTheDocument();
    expect(within(screen.getByTestId("booking-step-4")).getByText("₹60")).toBeInTheDocument();

    acknowledgePayment();
    fireEvent.click(screen.getByRole("button", { name: /confirm booking/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledOnce();
    });

    expect(mockSubmit).toHaveBeenCalledWith({
      spotId: "spot-1",
      spotName: "Green Valley Charge",
      hostName: "Rajesh Kumar",
      hostPhone: "+91 9876543210",
      duration: 60,
      message: note,
      pricePerHour: 60,
      estimatedCost: 60,
      city: "Kolhapur",
      outletType: "16-Amp Socket",
    });
  });
});
