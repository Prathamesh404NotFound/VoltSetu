import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BookingModal from "./BookingModal";

const mockNavigate = vi.fn();
const mockSubmit = vi.fn();
const mockOnClose = vi.fn();

vi.mock("react-router-dom", async () => {
  const actual = await vi.importActual<typeof import("react-router-dom")>("react-router-dom");
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
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
  outletType: "16-Amp Socket",
};

function renderModal() {
  return render(
    <MemoryRouter>
      <BookingModal isOpen onClose={mockOnClose} spot={spot} />
    </MemoryRouter>
  );
}

describe("BookingModal success state", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockSubmit.mockResolvedValue("req-123");
  });

  it("shows host contact actions and navigates to bookings after submit", async () => {
    renderModal();

    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    fireEvent.click(screen.getByRole("button", { name: /^next$/i }));
    fireEvent.click(
      screen.getByLabelText(/I understand payment is made directly to the host on arrival/i)
    );
    fireEvent.click(screen.getByRole("button", { name: /confirm booking/i }));

    await waitFor(() => {
      expect(screen.getByText("Request Sent!")).toBeInTheDocument();
    });

    expect(screen.queryByTestId("step-indicator")).not.toBeInTheDocument();
    expect(screen.queryByTestId("booking-step-footer")).not.toBeInTheDocument();
    expect(screen.queryByTestId("booking-mobile-sticky-header")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /confirm booking/i })).not.toBeInTheDocument();
    expect(screen.queryByText(/Step 4 of 4/i)).not.toBeInTheDocument();

    expect(screen.getByTestId("booking-success-view")).toBeInTheDocument();
    expect(screen.getByTestId("booking-success-summary")).toHaveTextContent(
      "Booked Green Valley Charge for 30 min — ₹30 due on arrival"
    );

    expect(screen.getByText("Green Valley Charge")).toBeInTheDocument();
    expect(screen.getByText("30 min")).toBeInTheDocument();
    expect(screen.getByText("₹30")).toBeInTheDocument();

    const callLink = screen.getByRole("link", { name: /call host/i });
    expect(callLink).toHaveAttribute("href", "tel:+919876543210");

    const whatsAppLink = screen.getByRole("link", { name: /message host on whatsapp/i });
    expect(whatsAppLink).toHaveAttribute("href", expect.stringContaining("https://wa.me/919876543210"));
    expect(whatsAppLink).toHaveAttribute("href", expect.stringContaining("on%20my%20way"));

    expect(
      screen.getByText(/host will confirm your request shortly/i)
    ).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: /view in my bookings/i }));

    expect(mockOnClose).toHaveBeenCalledOnce();
    expect(mockNavigate).toHaveBeenCalledWith("/dashboard/bookings");
  }, 15000);
});
