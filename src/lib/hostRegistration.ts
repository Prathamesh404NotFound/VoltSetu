import { database, auth } from "./firebase-services";
import { ref, push, set, serverTimestamp, get, update, remove } from "firebase/database";

interface HostRegistrationData {
  userId: string;
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  outletType: string;
  chargingSpeed: string;
  availableHours: string;
  pricePerHour: string;
  coordinates: { lat: number; lng: number } | null;
  agreeToTerms: boolean;
  status: "pending" | "approved" | "rejected";
  createdAt: any;
  googleMapsLink?: string;
}

export interface HostRegistrationInput {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  outletType: string;
  chargingSpeed: string;
  availableHours: string;
  pricePerHour: string;
  coordinates: { lat: number; lng: number } | null;
  agreeToTerms: boolean;
  googleMapsLink?: string;
}

export async function submitHostRegistration(data: HostRegistrationInput) {
  const user = auth.currentUser;
  if (!user) {
    throw new Error("User must be logged in to register as host");
  }

  // Resolve coordinates: use GPS from form, fall back to city lookup
  const coordinates = data.coordinates || getCityFallbackCoordinates(data.city);

  const registrationData: HostRegistrationData = {
    userId: user.uid,
    fullName: data.fullName,
    email: data.email,
    phone: data.phone,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    outletType: data.outletType,
    chargingSpeed: data.chargingSpeed,
    availableHours: data.availableHours,
    pricePerHour: data.pricePerHour,
    coordinates,
    agreeToTerms: data.agreeToTerms,
    status: "approved", // auto-approve for MVP
    createdAt: serverTimestamp(),
    googleMapsLink: data.googleMapsLink || "",
  };

  // Save under hostRegistrations/{uid}/
  const userRegistrationsRef = ref(database, `hostRegistrations/${user.uid}`);
  const newRegistrationRef = push(userRegistrationsRef);
  await set(newRegistrationRef, registrationData);

  // Also create a charging spot entry
  const spotData = {
    hostId: user.uid,
    hostName: data.fullName,
    hostEmail: data.email,
    hostPhone: data.phone,
    name: `${data.fullName}'s Charging Spot`,
    description: `Charging spot in ${data.city}, ${data.state}. ${data.outletType} outlet available.`,
    address: data.address,
    city: data.city,
    state: data.state,
    pincode: data.pincode,
    coordinates,
    category: "home",
    outletType: data.outletType,
    chargingSpeed: data.chargingSpeed,
    availableHours: data.availableHours,
    pricePerHour: parseFloat(data.pricePerHour) || 0,
    pricePerMinute: (parseFloat(data.pricePerHour) || 0) / 60,
    amenities: [
      { id: "1", name: "Power Backup", icon: "battery", available: true },
      { id: "2", name: "Security", icon: "shield", available: true },
    ],
    rating: 0,
    reviews: [],
    totalCharges: 0,
    status: "active", // auto-approve for MVP
    isVerified: true, // auto-verify for MVP
    isFeatured: false,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    googleMapsLink: data.googleMapsLink || "",
  };

  const spotsRef = ref(database, "chargingSpots");
  const newSpotRef = push(spotsRef);
  await set(newSpotRef, spotData);

  // Mark the user's role as host
  const userRef = ref(database, `users/${user.uid}`);
  await update(userRef, {
    role: "host",
    updatedAt: serverTimestamp(),
  });

  return {
    registrationId: newRegistrationRef.key,
    spotId: newSpotRef.key,
    success: true,
  };
}

// Fallback coordinates for major Indian cities when GPS is unavailable
export function getCityFallbackCoordinates(city: string): { lat: number; lng: number } {
  const cityMap: Record<string, { lat: number; lng: number }> = {
    mumbai: { lat: 19.076, lng: 72.8777 },
    delhi: { lat: 28.7041, lng: 77.1025 },
    bangalore: { lat: 12.9716, lng: 77.5946 },
    bengaluru: { lat: 12.9716, lng: 77.5946 },
    hyderabad: { lat: 17.385, lng: 78.4867 },
    chennai: { lat: 13.0827, lng: 80.2707 },
    kolkata: { lat: 22.5726, lng: 88.3639 },
    pune: { lat: 18.5204, lng: 73.8567 },
    ahmedabad: { lat: 23.0225, lng: 72.5714 },
    surat: { lat: 21.1702, lng: 72.8311 },
    jaipur: { lat: 26.9124, lng: 75.7873 },
    lucknow: { lat: 26.8467, lng: 80.9462 },
  };
  return cityMap[city.toLowerCase().trim()] || { lat: 20.5937, lng: 78.9629 };
}

export async function getHostRegistrations(userId: string) {
  try {
    const registrationsRef = ref(database, `hostRegistrations/${userId}`);
    const snapshot = await get(registrationsRef);
    if (!snapshot.exists()) return [];
    const registrations = snapshot.val();
    return Object.keys(registrations).map((key) => ({ id: key, ...registrations[key] }));
  } catch (error) {
    console.error("Error fetching host registrations:", error);
    throw error;
  }
}

export async function getHostSpots(userId: string) {
  try {
    const spotsRef = ref(database, "chargingSpots");
    const snapshot = await get(spotsRef);
    if (!snapshot.exists()) return [];
    const spots = snapshot.val();
    return Object.keys(spots)
      .filter((key) => spots[key].hostId === userId)
      .map((key) => ({ id: key, ...spots[key] }));
  } catch (error) {
    console.error("Error fetching host spots:", error);
    throw error;
  }
}

export async function getAllChargingSpots() {
  try {
    const spotsRef = ref(database, "chargingSpots");
    const snapshot = await get(spotsRef);
    if (!snapshot.exists()) return [];
    const spots = snapshot.val();
    return Object.keys(spots)
      .map((key) => ({ id: key, ...spots[key] }))
      .filter(spot => spot.status !== "rejected"); // show pending and active spots in MVP
  } catch (error) {
    console.error("Error fetching all charging spots:", error);
    throw error;
  }
}

export async function updateRegistrationStatus(
  registrationId: string,
  userId: string,
  status: "approved" | "rejected",
  reason?: string
) {
  try {
    const registrationRef = ref(database, `hostRegistrations/${userId}/${registrationId}`);
    await update(registrationRef, {
      status,
      updatedAt: serverTimestamp(),
      ...(reason && { rejectionReason: reason }),
    });

    // Also update the corresponding spot status
    const spotsRef = ref(database, "chargingSpots");
    const spotsSnapshot = await get(spotsRef);
    if (spotsSnapshot.exists()) {
      const spots = spotsSnapshot.val();
      const spotEntry = Object.entries(spots).find(
        ([, spot]: [string, any]) => spot.hostId === userId && spot.status === "pending"
      );
      if (spotEntry) {
        const [spotId] = spotEntry;
        const spotRef = ref(database, `chargingSpots/${spotId}`);
        await update(spotRef, {
          status: status === "approved" ? "active" : "rejected",
          updatedAt: serverTimestamp(),
          isVerified: status === "approved",
        });
      }
    }
    return true;
  } catch (error) {
    console.error("Error updating registration status:", error);
    throw error;
  }
}

export async function updateSpot(spotId: string, data: any) {
  try {
    const spotRef = ref(database, `chargingSpots/${spotId}`);
    await update(spotRef, { ...data, updatedAt: serverTimestamp() });
    return true;
  } catch (error) {
    console.error("Error updating spot:", error);
    throw error;
  }
}

export async function deleteSpot(spotId: string) {
  try {
    const spotRef = ref(database, `chargingSpots/${spotId}`);
    await remove(spotRef);
    return true;
  } catch (error) {
    console.error("Error deleting spot:", error);
    throw error;
  }
}

export async function getSpotAnalytics(spotId: string) {
  try {
    const requestsRef = ref(database, "chargingRequests");
    const snapshot = await get(requestsRef);
    if (!snapshot.exists()) {
      return { totalRequests: 0, completedRequests: 0, pendingRequests: 0, totalEarnings: 0, averageRating: 0 };
    }
    const requests = snapshot.val();
    const spotRequests = Object.values(requests).filter((req: any) => req.spotId === spotId);
    const completedRequests = spotRequests.filter((req: any) => req.status === "completed").length;
    const pendingRequests = spotRequests.filter((req: any) => req.status === "pending").length;
    return {
      totalRequests: spotRequests.length,
      completedRequests,
      pendingRequests,
      totalEarnings: completedRequests * 50,
      averageRating: 4.5,
    };
  } catch (error) {
    console.error("Error fetching spot analytics:", error);
    throw error;
  }
}
