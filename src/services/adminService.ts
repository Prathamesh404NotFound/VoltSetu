import { database, auth, storage } from '@/lib/firebase-services';
import {
  ref,
  get,
  set,
  update,
  remove,
  push,
  query,
  orderByChild,
  limitToLast,
  startAt,
  endAt
} from 'firebase/database';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL,
  deleteObject
} from 'firebase/storage';
import { serverTimestamp } from 'firebase/database';
import {
  User,
  ChargingSpot,
  ChargingRequest,
  Review
} from '@/types';

// Admin Service Functions for Real Backend Operations

// User Management
export const adminGetAllUsers = async (): Promise<User[]> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      return [];
    }

    const users = snapshot.val();
    return Object.keys(users).map(key => ({
      id: key,
      ...users[key],
      createdAt: users[key].createdAt ? new Date(users[key].createdAt) : new Date(),
      lastLoginAt: users[key].lastLoginAt ? new Date(users[key].lastLoginAt) : new Date(),
    }));
  } catch (error) {
    console.error('Error fetching users:', error);
    throw new Error('Failed to fetch users');
  }
};

export const adminUpdateUserRole = async (userId: string, role: User['role']): Promise<void> => {
  try {
    const userRef = ref(database, `users/${userId}`);
    await update(userRef, {
      role,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating user role:', error);
    throw new Error('Failed to update user role');
  }
};

export const adminDeleteUser = async (userId: string): Promise<void> => {
  try {
    // First delete all user's charging spots
    const spotsRef = ref(database, 'chargingSpots');
    const spotsSnapshot = await get(spotsRef);

    if (spotsSnapshot.exists()) {
      const spots = spotsSnapshot.val();
      const userSpots = Object.keys(spots).filter(key => spots[key].hostId === userId);

      // Delete each spot
      for (const spotId of userSpots) {
        await remove(ref(database, `chargingSpots/${spotId}`));
      }
    }

    // Delete all user's requests (nested: chargingRequests/{userId}/{requestId})
    await remove(ref(database, `chargingRequests/${userId}`));

    // Delete user's host registrations
    const hostRegistrationsRef = ref(database, 'hostRegistrations');
    const hostRegistrationsSnapshot = await get(hostRegistrationsRef);

    if (hostRegistrationsSnapshot.exists()) {
      const hostRegistrations = hostRegistrationsSnapshot.val();
      const userRegistrations = Object.keys(hostRegistrations).filter(key => key === userId);

      // Delete each registration
      for (const regId of userRegistrations) {
        await remove(ref(database, `hostRegistrations/${userId}/${regId}`));
      }
    }

    // Finally delete the user
    await remove(ref(database, `users/${userId}`));
  } catch (error) {
    console.error('Error deleting user:', error);
    throw new Error('Failed to delete user');
  }
};

// Charging Spots Management
export const adminGetAllSpots = async (): Promise<ChargingSpot[]> => {
  try {
    const spotsRef = ref(database, 'chargingSpots');
    const snapshot = await get(spotsRef);

    if (!snapshot.exists()) {
      return [];
    }

    const spots = snapshot.val();
    return Object.keys(spots).map(key => {
      const raw = spots[key];
      return {
        id: key,
        ...raw,
        // Numeric fields: coerce strings from old registrations and default missing fields to 0
        rating: typeof raw.rating === 'number' ? raw.rating : Number(raw.rating) || 0,
        pricePerHour: typeof raw.pricePerHour === 'number' ? raw.pricePerHour : Number(raw.pricePerHour) || 0,
        pricePerMinute: raw.pricePerMinute != null ? (typeof raw.pricePerMinute === 'number' ? raw.pricePerMinute : Number(raw.pricePerMinute) || 0) : undefined,
        totalCharges: typeof raw.totalCharges === 'number' ? raw.totalCharges : Number(raw.totalCharges) || 0,
        // Array fields: guard against missing keys in legacy documents
        reviews: Array.isArray(raw.reviews) ? raw.reviews : [],
        photos: Array.isArray(raw.photos) ? raw.photos : [],
        amenities: Array.isArray(raw.amenities) ? raw.amenities : [],
        // Status: fall back to 'pending' so .charAt(0) never throws
        status: raw.status || 'pending',
        createdAt: raw.createdAt ? new Date(raw.createdAt) : new Date(),
        updatedAt: raw.updatedAt ? new Date(raw.updatedAt) : new Date(),
      };
    });
  } catch (error) {
    console.error('Error fetching spots:', error);
    throw new Error('Failed to fetch charging spots');
  }
};

export const adminUpdateSpotStatus = async (spotId: string, status: ChargingSpot['status']): Promise<void> => {
  try {
    const spotRef = ref(database, `chargingSpots/${spotId}`);
    await update(spotRef, {
      status,
      updatedAt: serverTimestamp()
    });
  } catch (error) {
    console.error('Error updating spot status:', error);
    throw new Error('Failed to update spot status');
  }
};

export const adminDeleteSpot = async (spotId: string): Promise<void> => {
  try {
    // Delete all requests for this spot (nested: chargingRequests/{userId}/{requestId})
    const requestsRef = ref(database, 'chargingRequests');
    const requestsSnapshot = await get(requestsRef);

    if (requestsSnapshot.exists()) {
      const all = requestsSnapshot.val();
      const deletions: Promise<void>[] = [];

      for (const userId of Object.keys(all)) {
        const userRequests = all[userId];
        if (!userRequests || typeof userRequests !== 'object') continue;

        for (const requestId of Object.keys(userRequests)) {
          if (userRequests[requestId]?.spotId === spotId) {
            deletions.push(
              remove(ref(database, `chargingRequests/${userId}/${requestId}`))
            );
          }
        }
      }

      await Promise.all(deletions);
    }

    // Delete the spot
    await remove(ref(database, `chargingSpots/${spotId}`));
  } catch (error) {
    console.error('Error deleting spot:', error);
    throw new Error('Failed to delete charging spot');
  }
};

export const adminCreateSpot = async (spotData: Omit<ChargingSpot, 'id' | 'createdAt' | 'updatedAt'>): Promise<ChargingSpot> => {
  try {
    const spotsRef = ref(database, 'chargingSpots');
    const newSpotRef = push(spotsRef);

    const newSpot: ChargingSpot = {
      ...spotData,
      id: newSpotRef.key!,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    await set(newSpotRef, newSpot);
    return newSpot;
  } catch (error) {
    console.error('Error creating spot:', error);
    throw new Error('Failed to create charging spot');
  }
};

/** Update all editable fields of an existing charging spot. Merges on top of the
 * current record so ratings, reviews, photos and counters are preserved. */
export const adminUpdateSpot = async (
  spotId: string,
  spotData: Partial<ChargingSpot>
): Promise<void> => {
  try {
    const spotRef = ref(database, `chargingSpots/${spotId}`);
    await update(spotRef, {
      ...spotData,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error('Error updating spot:', error);
    throw new Error('Failed to update charging spot');
  }
};

export const adminUploadSpotImages = async (spotId: string, files: File[]): Promise<string[]> => {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const fileRef = storageRef(storage, `spots/${spotId}/image_${index}_${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading spot images:', error);
    throw new Error('Failed to upload spot images');
  }
};

export const adminUploadStationImages = async (stationId: string, files: File[]): Promise<string[]> => {
  try {
    const uploadPromises = files.map(async (file, index) => {
      const fileRef = storageRef(storage, `stations/${stationId}/image_${index}_${Date.now()}_${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);
      return downloadURL;
    });

    return await Promise.all(uploadPromises);
  } catch (error) {
    console.error('Error uploading station images:', error);
    throw new Error('Failed to upload station images');
  }
};

// Requests Management — data lives at chargingRequests/{userId}/{requestId}
const flattenNestedRequests = (
  all: Record<string, Record<string, Record<string, unknown>>> | null
): ChargingRequest[] => {
  if (!all) return [];

  const requests: ChargingRequest[] = [];

  for (const userId of Object.keys(all)) {
    const userRequests = all[userId];
    if (!userRequests || typeof userRequests !== 'object') continue;

    for (const requestId of Object.keys(userRequests)) {
      const req = userRequests[requestId];
      if (!req || typeof req !== 'object' || !('spotId' in req)) continue;

      requests.push({
        id: requestId,
        userId: (req.userId as string) ?? userId,
        ...req,
        requestedAt: req.requestedAt ? new Date(req.requestedAt as number) : new Date(),
        requestedTime: req.requestedTime ? new Date(req.requestedTime as number) : new Date(),
      } as ChargingRequest);
    }
  }

  return requests;
};

export const adminGetAllRequests = async (): Promise<ChargingRequest[]> => {
  try {
    const requestsRef = ref(database, 'chargingRequests');
    const snapshot = await get(requestsRef);
    return flattenNestedRequests(snapshot.exists() ? snapshot.val() : null);
  } catch (error) {
    console.error('Error fetching requests:', error);
    throw new Error('Failed to fetch charging requests');
  }
};

export const adminUpdateRequestStatus = async (
  userId: string,
  requestId: string,
  status: ChargingRequest['status'],
  responseText?: string
): Promise<void> => {
  try {
    const requestRef = ref(database, `chargingRequests/${userId}/${requestId}`);
    const updateData: Record<string, unknown> = {
      status,
      updatedAt: serverTimestamp(),
    };

    if (responseText) {
      updateData.response = {
        text: responseText,
        respondedAt: serverTimestamp(),
        respondedBy: auth.currentUser?.displayName || 'Admin',
      };
    }

    await update(requestRef, updateData);
  } catch (error) {
    console.error('Error updating request status:', error);
    throw new Error('Failed to update request status');
  }
};

export const adminDeleteRequest = async (userId: string, requestId: string): Promise<void> => {
  try {
    await remove(ref(database, `chargingRequests/${userId}/${requestId}`));
  } catch (error) {
    console.error('Error deleting request:', error);
    throw new Error('Failed to delete charging request');
  }
};

// Analytics Functions
export const adminGetSystemStats = async () => {
  try {
    const [users, spots, requests] = await Promise.all([
      adminGetAllUsers(),
      adminGetAllSpots(),
      adminGetAllRequests(),
    ]);

    const activeUsers = users.filter(user => {
      const lastLogin = user.lastLoginAt;
      const now = new Date();
      const hoursDiff = (now.getTime() - lastLogin.getTime()) / (1000 * 60 * 60);
      return hoursDiff < 24; // Active if logged in within 24 hours
    });

    const pendingRequests = requests.filter(req => req.status === 'pending');
    const completedRequests = requests.filter(req => req.status === 'completed');

    // Revenue from completed booking sessions, priced per spot's own rate
    // (pricePerHour converted from minutes: duration/60). Falls back to the
    // booking's stored estimatedCost when the spot rate is unavailable.
    const bookingRevenue = (req: ChargingRequest) => {
      if (typeof (req as any).estimatedCost === 'number') return Math.max(0, (req as any).estimatedCost);
      const pph = Number((req as any).pricePerHour) || 0;
      return (pph * Number(req.duration || 0)) / 60;
    };
    const totalRevenue = completedRequests.reduce((sum, req) => sum + bookingRevenue(req), 0);

    return {
      totalUsers: users.length,
      totalSpots: spots.length,
      totalRequests: requests.length,
      totalRevenue,
      activeUsers: activeUsers.length,
      pendingRequests: pendingRequests.length,
      completedRequests: completedRequests.length,
      systemHealth: 'healthy' as const,
    };
  } catch (error) {
    console.error('Error fetching system stats:', error);
    throw new Error('Failed to fetch system statistics');
  }
};

export const adminGetTopSpots = async (limit: number = 5): Promise<Array<{
  id: string;
  name: string;
  requests: number;
  revenue: number;
  rating: number;
}>> => {
  try {
    const spots = await adminGetAllSpots();
    const requests = await adminGetAllRequests();

    // Calculate metrics for each spot
    const spotsWithMetrics = spots.map(spot => {
      const spotRequests = requests.filter(req => req.spotId === spot.id);
      const completedRequests = spotRequests.filter(req => req.status === 'completed');

      const revenue = completedRequests.reduce((sum, req) => {
        // Minutes, not hours: duration/60. Also respect the stored estimate.
        if (typeof (req as any).estimatedCost === 'number') return sum + Math.max(0, (req as any).estimatedCost);
        return sum + (spot.pricePerHour * Number(req.duration || 0)) / 60;
      }, 0);

      return {
        id: spot.id,
        name: spot.name,
        requests: spotRequests.length,
        revenue,
        rating: spot.rating || 0,
      };
    });

    // Sort by revenue and return top spots
    return spotsWithMetrics
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching top spots:', error);
    throw new Error('Failed to fetch top performing spots');
  }
};

export const adminGetRecentActivity = async (limit: number = 10): Promise<Array<{
  id: string;
  type: 'user' | 'spot' | 'request';
  action: string;
  timestamp: string;
  user: string;
}>> => {
  try {
    const [users, spots, requests] = await Promise.all([
      adminGetAllUsers(),
      adminGetAllSpots(),
      adminGetAllRequests(),
    ]);

    const activities: Array<{
      id: string;
      type: 'user' | 'spot' | 'request';
      action: string;
      timestamp: string;
      user: string;
    }> = [];

    // Add user activities
    users.forEach(user => {
      activities.push({
        id: `user-${user.id}`,
        type: 'user',
        action: 'User registered',
        timestamp: user.createdAt.toISOString(),
        user: user.displayName,
      });
    });

    // Add spot activities
    spots.forEach(spot => {
      activities.push({
        id: `spot-${spot.id}`,
        type: 'spot',
        action: `Charging spot added: ${spot.name}`,
        timestamp: spot.createdAt.toISOString(),
        user: spot.hostName,
      });
    });

    // Add request activities
    requests.forEach(request => {
      activities.push({
        id: `request-${request.id}`,
        type: 'request',
        action: `Request ${request.status}: ${request.userName}`,
        timestamp: request.requestedAt.toISOString(),
        user: request.userName,
      });
    });

    // Sort by timestamp and return recent activities
    return activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent activity:', error);
    throw new Error('Failed to fetch recent activity');
  }
};

// File Upload Functions
export const adminUploadFile = async (file: File, path: string): Promise<string> => {
  try {
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading file:', error);
    throw new Error('Failed to upload file');
  }
};

export const adminDeleteFile = async (path: string): Promise<void> => {
  try {
    const fileRef = storageRef(storage, path);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting file:', error);
    throw new Error('Failed to delete file');
  }
};

// Search and Filter Functions
export const adminSearchUsers = async (searchTerm: string): Promise<User[]> => {
  try {
    const users = await adminGetAllUsers();
    const lowerSearchTerm = searchTerm.toLowerCase();

    return users.filter(user =>
      user.displayName.toLowerCase().includes(lowerSearchTerm) ||
      user.email.toLowerCase().includes(lowerSearchTerm)
    );
  } catch (error) {
    console.error('Error searching users:', error);
    throw new Error('Failed to search users');
  }
};

export const adminSearchSpots = async (searchTerm: string): Promise<ChargingSpot[]> => {
  try {
    const spots = await adminGetAllSpots();
    const lowerSearchTerm = searchTerm.toLowerCase();

    return spots.filter(spot =>
      spot.name.toLowerCase().includes(lowerSearchTerm) ||
      spot.hostName.toLowerCase().includes(lowerSearchTerm) ||
      spot.address.toLowerCase().includes(lowerSearchTerm) ||
      spot.city.toLowerCase().includes(lowerSearchTerm)
    );
  } catch (error) {
    console.error('Error searching spots:', error);
    throw new Error('Failed to search charging spots');
  }
};

export const adminSearchRequests = async (searchTerm: string): Promise<ChargingRequest[]> => {
  try {
    const requests = await adminGetAllRequests();
    const lowerSearchTerm = searchTerm.toLowerCase();

    return requests.filter(request =>
      request.userName.toLowerCase().includes(lowerSearchTerm) ||
      request.userEmail.toLowerCase().includes(lowerSearchTerm) ||
      (request.message && request.message.toLowerCase().includes(lowerSearchTerm))
    );
  } catch (error) {
    console.error('Error searching requests:', error);
    throw new Error('Failed to search requests');
  }
};

// Pagination Functions
export const adminGetUsersPaginated = async (
  page: number = 1,
  limit: number = 10
): Promise<{ users: User[]; total: number; }> => {
  try {
    const usersRef = ref(database, 'users');
    const snapshot = await get(usersRef);

    if (!snapshot.exists()) {
      return { users: [], total: 0 };
    }

    const users = snapshot.val();
    const userArray = Object.keys(users).map(key => ({
      id: key,
      ...users[key],
      createdAt: users[key].createdAt ? new Date(users[key].createdAt) : new Date(),
      lastLoginAt: users[key].lastLoginAt ? new Date(users[key].lastLoginAt) : new Date(),
    }));

    const total = userArray.length;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);

    return {
      users: userArray.slice(startIndex, endIndex),
      total,
    };
  } catch (error) {
    console.error('Error fetching paginated users:', error);
    throw new Error('Failed to fetch paginated users');
  }
};

export const adminGetSpotsPaginated = async (
  page: number = 1,
  limit: number = 10
): Promise<{ spots: ChargingSpot[]; total: number; }> => {
  try {
    const spotsRef = ref(database, 'chargingSpots');
    const snapshot = await get(spotsRef);

    if (!snapshot.exists()) {
      return { spots: [], total: 0 };
    }

    const spots = snapshot.val();
    const spotArray = Object.keys(spots).map(key => ({
      id: key,
      ...spots[key],
      createdAt: spots[key].createdAt ? new Date(spots[key].createdAt) : new Date(),
      updatedAt: spots[key].updatedAt ? new Date(spots[key].updatedAt) : new Date(),
    }));

    const total = spotArray.length;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);

    return {
      spots: spotArray.slice(startIndex, endIndex),
      total,
    };
  } catch (error) {
    console.error('Error fetching paginated spots:', error);
    throw new Error('Failed to fetch paginated spots');
  }
};

export const adminGetRequestsPaginated = async (
  page: number = 1,
  limit: number = 10
): Promise<{ requests: ChargingRequest[]; total: number; }> => {
  try {
    const requestsRef = ref(database, 'chargingRequests');
    const snapshot = await get(requestsRef);

    if (!snapshot.exists()) {
      return { requests: [], total: 0 };
    }

    const requestArray = flattenNestedRequests(snapshot.exists() ? snapshot.val() : null);

    const total = requestArray.length;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);

    return {
      requests: requestArray.slice(startIndex, endIndex),
      total,
    };
  } catch (error) {
    console.error('Error fetching paginated requests:', error);
    throw new Error('Failed to fetch paginated requests');
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// Analytics APIs (timeline, funnel, city breakdown, deposits)
// ─────────────────────────────────────────────────────────────────────────────

function toBucketKey(ts: number, bucketDays: number): string {
  const d = new Date(ts);
  if (bucketDays <= 1) {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  }
  // Weekly buckets keyed by the Monday of the week
  const day = d.getDay(); // 0=Sun..6=Sat; shift so Monday is week start
  const monday = new Date(d);
  monday.setDate(d.getDate() - ((day + 6) % 7));
  return monday.toISOString().slice(0, 10);
}

/** Daily (7d) or weekly (30d/90d) buckets of bookings, completions, revenue,
 * and new users — used by the analytics combo chart. */
export const adminGetBookingTimeline = async (
  period: '7d' | '30d' | '90d'
): Promise<
  Array<{
    date: string;
    bookings: number;
    completed: number;
    rejected: number;
    revenue: number;
    emergencyBookings: number;
    newUsers: number;
  }>
> => {
  const bucketDays = period === '7d' ? 1 : 7;
  const days = period === '7d' ? 7 : period === '30d' ? 30 : 90;
  const now = Date.now();
  const cutoff = now - days * 24 * 60 * 60 * 1000;

  const [users, requests] = await Promise.all([adminGetAllUsers(), adminGetAllRequests()]);

  const timeline: Record<string, { bookings: number; completed: number; rejected: number; revenue: number; emergencyBookings: number; newUsers: number }> = {};
  // Seed every bucket so the chart always spans the full period
  const bucketCount = Math.ceil(days / bucketDays);
  const seedKey = (daysBack: number) => {
    const d = new Date(now - daysBack * 24 * 60 * 60 * 1000);
    return toBucketKey(d.getTime(), bucketDays);
  };
  for (let i = 0; i < bucketCount; i++) {
    const key = seedKey(days - 1 - i * bucketDays);
    timeline[key] = { bookings: 0, completed: 0, rejected: 0, revenue: 0, emergencyBookings: 0, newUsers: 0 };
  }

  const revenueOf = (req: any) => {
    if (typeof req.estimatedCost === 'number') return Math.max(0, req.estimatedCost);
    const pph = Number(req.pricePerHour) || 0;
    return (pph * Number(req.duration || 0)) / 60;
  };

  requests.forEach((req: any) => {
    const ts = typeof req.requestedAt === 'number' ? req.requestedAt : 0;
    if (!ts || ts < cutoff) return;
    const key = toBucketKey(ts, bucketDays);
    const cell = timeline[key] || (timeline[key] = { bookings: 0, completed: 0, rejected: 0, revenue: 0, emergencyBookings: 0, newUsers: 0 });
    cell.bookings += 1;
    if (req.status === 'completed') {
      cell.completed += 1;
      cell.revenue += revenueOf(req);
    }
    if (req.status === 'rejected' || req.status === 'cancelled') cell.rejected += 1;
    if (req.emergency) cell.emergencyBookings += 1;
  });

  users.forEach((user: any) => {
    const ts = user.createdAt ? user.createdAt.getTime() : 0;
    if (!ts || ts < cutoff) return;
    const key = toBucketKey(ts, bucketDays);
    const cell = timeline[key] || (timeline[key] = { bookings: 0, completed: 0, rejected: 0, revenue: 0, emergencyBookings: 0, newUsers: 0 });
    cell.newUsers += 1;
  });

  return Object.keys(timeline)
    .sort()
    .map((date) => ({
      date,
      bookings: timeline[date].bookings,
      completed: timeline[date].completed,
      rejected: timeline[date].rejected,
      revenue: Math.round(timeline[date].revenue * 100) / 100,
      emergencyBookings: timeline[date].emergencyBookings,
      newUsers: timeline[date].newUsers,
    }));
};

export interface StatusFunnel {
  pending: number;
  approved: number;
  completed: number;
  cancelled: number;
  rejected: number;
  emergency: number;
  paidDeposits: number;
  conversionRate: number; // completed / bookings that left pending
}

/** Booking status funnel: how many requests enter, get approved, complete,
 * and how many were emergencies or paid deposits. */
export const adminGetStatusFunnel = async (): Promise<StatusFunnel> => {
  const requests = await adminGetAllRequests();
  const count = (s: string) => requests.filter((r) => r.status === s).length;
  const pending = count('pending');
  const approved = count('approved');
  const completed = count('completed');
  const cancelled = count('cancelled');
  const rejected = count('rejected');
  const emergency = requests.filter((r: any) => r.emergency).length;
  const paidDeposits = requests.filter((r: any) => r.depositStatus === 'paid').length;
  const conversionDenominator = approved + completed + cancelled + rejected;
  const conversionRate = conversionDenominator > 0 ? Math.round((completed / conversionDenominator) * 1000) / 10 : 0;
  return { pending, approved, completed, cancelled, rejected, emergency, paidDeposits, conversionRate };
};

export interface CityBreakdown {
  city: string;
  bookings: number;
  completed: number;
  revenue: number;
  spots: number;
}

/** Revenue and demand breakdown per city from live bookings and spots. */
export const adminGetCityBreakdown = async (): Promise<CityBreakdown[]> => {
  const [spots, requests] = await Promise.all([adminGetAllSpots(), adminGetAllRequests()]);
  const byCity: Record<string, CityBreakdown> = {};
  const cell = (city: string) =>
    byCity[city] || (byCity[city] = { city, bookings: 0, completed: 0, revenue: 0, spots: 0 });
  spots.forEach((spot) => {
    const c = (spot.city || '').trim() || 'Unassigned';
    cell(c).spots += 1;
  });
  requests.forEach((req: any) => {
    const c = ((req as any).city || '').trim() || 'Unassigned';
    const entry = cell(c);
    entry.bookings += 1;
    if (req.status === 'completed') {
      entry.completed += 1;
      entry.revenue += typeof req.estimatedCost === 'number' ? Math.max(0, req.estimatedCost) : (Number(req.pricePerHour) || 0) * Number(req.duration || 0) / 60;
    }
  });
  return Object.values(byCity)
    .filter((c) => c.bookings > 0 || c.spots > 0)
    .sort((a, b) => b.revenue - a.revenue)
    .map((c) => ({ ...c, revenue: Math.round(c.revenue * 100) / 100 }));
};

export interface DepositsSummary {
  collected: number;
  pending: number;
  failed: number;
  emergencyBookings: number;
}

/** Summary of Cashfree deposit collection across all bookings. */
export const adminGetDepositsSummary = async (): Promise<DepositsSummary> => {
  const requests = await adminGetAllRequests();
  const byStatus = (s: string) => requests.filter((r: any) => r.depositStatus === s).length;
  const collected = requests
    .filter((r: any) => r.depositStatus === 'paid' && typeof r.depositAmount === 'number')
    .reduce((sum, r) => sum + Number(r.depositAmount), 0);
  return {
    collected: Math.round(collected * 100) / 100,
    pending: byStatus('pending'),
    failed: byStatus('failed'),
    emergencyBookings: requests.filter((r: any) => r.emergency).length,
  };
};
