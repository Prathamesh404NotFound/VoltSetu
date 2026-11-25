import { database, auth } from "./firebase-services";
import { sanitizeForDb } from "./bookingService";
import { facilitiesToAmenities, sanitizeFacilityIds } from "@/lib/facilities";
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
  spotType?: string;
  referralCode?: string;
  facilities?: string[];
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
  spotType?: string;
  referralCode?: string;
  facilities?: string[];
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
    status: "pending",
    createdAt: serverTimestamp(),
    googleMapsLink: data.googleMapsLink || "",
    spotType: data.spotType || "Home",
    referralCode: data.referralCode || "",
    facilities: Array.isArray(data.facilities) ? sanitizeFacilityIds(data.facilities) : [],
  };

  // Save under hostRegistrations/{uid}/ — sanitizeForDb strips any
  // undefined/null/NaN value that would crash Firebase set().
  const userRegistrationsRef = ref(database, `hostRegistrations/${user.uid}`);
  const newRegistrationRef = push(userRegistrationsRef);
  await set(newRegistrationRef, sanitizeForDb(registrationData));

  // Auto-route the new submission into the admin listing review queue so
  // nothing goes live without admin approval (creates a spot pending review).
  try {
    const { createListingReview } = await import("./spotReviewService");
    const reviewSpotId = `reg-${newRegistrationRef.key}`;
    await createListingReview(reviewSpotId, sanitizeForDb({
      registrationId: newRegistrationRef.key,
      hostId: user.uid,
      hostName: registrationData.fullName,
      hostEmail: registrationData.email,
      hostPhone: registrationData.phone,
      name: `${registrationData.fullName}'s Charging Spot`,
      address: registrationData.address,
      city: registrationData.city,
      state: registrationData.state,
      outletType: registrationData.outletType,
      pricePerHour: Number.parseFloat(registrationData.pricePerHour) || 0,
      facilities: registrationData.facilities,
      referralCode: registrationData.referralCode,
      coordinates: coordinates,
      googleMapsLink: registrationData.googleMapsLink || "",
    }));
  } catch (error) {
    console.warn("Review queue routing failed (non-fatal):", error);
  }

  // Listings are created only after an administrator reviews the registration.
  // Never self-promote the account or publish an unverified spot from the client.

  return {
    registrationId: newRegistrationRef.key,
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
      .filter(spot => spot.status === "active"); // only show admin-approved live spots
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

    if (status === "approved") {
      const registrationSnapshot = await get(registrationRef);
      const registration = registrationSnapshot.val();
      if (!registration) throw new Error("Host registration was not found");

      const spotsRef = ref(database, "chargingSpots");
      const spotsSnapshot = await get(spotsRef);
      const existingSpot = spotsSnapshot.exists()
        ? Object.values(spotsSnapshot.val()).some((spot: any) => spot.hostId === userId && spot.registrationId === registrationId)
        : false;

      if (!existingSpot) {
        const newSpotRef = push(spotsRef);
        await set(newSpotRef, sanitizeForDb({
          registrationId,
          hostId: userId,
          hostName: registration.fullName,
          hostEmail: registration.email,
          hostPhone: registration.phone,
          name: `${registration.fullName}'s Charging Spot`,
          description: `Charging spot in ${registration.city}, ${registration.state}. ${registration.outletType} outlet available.`,
          address: registration.address,
          city: registration.city,
          state: registration.state,
          pincode: registration.pincode,
          coordinates: registration.coordinates || null,
          outletType: registration.outletType,
          chargingSpeed: registration.chargingSpeed,
          availableHours: registration.availableHours,
          pricePerHour: Number.parseFloat(registration.pricePerHour) || 0,
          pricePerMinute: (Number.parseFloat(registration.pricePerHour) || 0) / 60,
          amenities: facilitiesToAmenities(registration.facilities || []),
          rating: 0,
          reviews: [],
          totalCharges: 0,
          status: "active",
          isVerified: true,
          isFeatured: false,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp(),
          googleMapsLink: registration.googleMapsLink || "",
          spotType: registration.spotType || "Home",
          category: registration.spotType === "Home" ? "home" : "commercial",
          referralCode: registration.referralCode || "",
        }));
      }

      await update(ref(database, `users/${userId}`), {
        role: "host",
        hostStatus: "approved",
        updatedAt: serverTimestamp(),
      });
    } else {
      await update(ref(database, `users/${userId}`), {
        hostStatus: "rejected",
        updatedAt: serverTimestamp(),
      });
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
    await update(spotRef, sanitizeForDb({ ...data, updatedAt: serverTimestamp() }));
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
