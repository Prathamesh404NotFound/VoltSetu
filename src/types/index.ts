// Core data models for Charge Nest application

export interface User {
  id: string;
  email: string;
  displayName: string;
  photoURL?: string;
  phone?: string;
  role: 'user' | 'host' | 'admin';
  isVerified: boolean;
  createdAt: Date;
  lastLoginAt: Date;
  preferences: UserPreferences;
  stats: UserStats;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'system';
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
    newSpots: boolean;
    requestUpdates: boolean;
    promotions: boolean;
  };
  location: {
    enabled: boolean;
    coordinates?: {
      lat: number;
      lng: number;
    };
    city?: string;
    state?: string;
  };
}

export interface UserStats {
  watts: number; // Reward points
  level: number;
  requestsCompleted: number;
  reviewsGiven: number;
  favoritesCount: number;
  referralCount: number;
  joinDate: Date;
}

export interface ChargingSpot {
  id: string;
  hostId: string;
  hostName: string;
  hostEmail: string;
  hostPhone: string;
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  category: SpotCategory;
  outletType: OutletType;
  chargingSpeed: ChargingSpeed;
  availableHours: string;
  pricePerHour: number;
  pricePerMinute?: number;
  amenities: Amenity[];
  photos: string[];
  rating: number;
  reviews: Review[];
  totalCharges: number;
  status: SpotStatus;
  isVerified: boolean;
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  googleMapsLink?: string;
}

export type SpotCategory =
  | 'cafe'
  | 'restaurant'
  | 'office'
  | 'home'
  | 'shop'
  | 'mall'
  | 'hotel'
  | 'coworking'
  | 'gas_station'
  | 'other';

export type OutletType =
  | 'standard_3pin'
  | '5_amp'
  | '16_amp'
  | 'type2_ev'
  | 'ccs'
  | 'tesla'
  | 'usb';

export type ChargingSpeed =
  | 'slow' // 2-3 kW
  | 'fast' // 7-22 kW  
  | 'rapid' // 50+ kW
  | 'ultra'; // 150+ kW

export type SpotStatus =
  | 'active'
  | 'inactive'
  | 'pending'
  | 'suspended'
  | 'maintenance';

export interface Amenity {
  id: string;
  name: string;
  icon: string;
  available: boolean;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userPhoto?: string;
  rating: number;
  comment: string;
  photos?: string[];
  createdAt: Date;
  helpful: number;
  response?: {
    text: string;
    createdAt: Date;
  };
}

export interface ChargingRequest {
  id: string;
  spotId: string;
  userId: string;
  userName: string;
  userPhone: string;
  userEmail: string;
  requestedAt: Date;
  requestedTime: Date;
  duration: number; // in minutes
  status: RequestStatus;
  message?: string;
  response?: {
    text: string;
    respondedAt: Date;
    respondedBy: string;
  };
  completedAt?: Date;
  feedback?: {
    rating: number;
    comment: string;
    wattsEarned: number;
  };
}

export type RequestStatus =
  | 'pending'
  | 'approved'
  | 'rejected'
  | 'cancelled'
  | 'completed'
  | 'no_show';

export interface Favorite {
  id: string;
  userId: string;
  spotId: string;
  createdAt: Date;
}

export interface Notification {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  message: string;
  data?: any;
  read: boolean;
  createdAt: Date;
  actionUrl?: string;
}

export type NotificationType =
  | 'request_approved'
  | 'request_rejected'
  | 'request_completed'
  | 'new_review'
  | 'spot_nearby'
  | 'watts_earned'
  | 'level_up'
  | 'system'
  | 'promotion';

export interface LeaderboardEntry {
  userId: string;
  userName: string;
  userPhoto?: string;
  watts: number;
  level: number;
  rank: number;
  change: number; // rank change from previous period
}

export interface Referral {
  id: string;
  referrerId: string;
  referredEmail: string;
  referredUserId?: string;
  status: 'pending' | 'completed';
  wattsEarned: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface ContactForm {
  name: string;
  email: string;
  phone?: string;
  subject: string;
  message: string;
  type: 'support' | 'feedback' | 'partnership' | 'other';
  createdAt: Date;
}

export interface NewsletterSignup {
  email: string;
  preferences: {
    newSpots: boolean;
    promotions: boolean;
    updates: boolean;
  };
  createdAt: Date;
}

// API Response types
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  hasMore: boolean;
}

// Search and filter types
export interface SpotSearchParams {
  query?: string;
  location?: {
    lat: number;
    lng: number;
    radius?: number; // in km
  };
  categories?: SpotCategory[];
  outletTypes?: OutletType[];
  chargingSpeeds?: ChargingSpeed[];
  priceRange?: {
    min: number;
    max: number;
  };
  rating?: number;
  amenities?: string[];
  availableNow?: boolean;
  verified?: boolean;
  sortBy?: 'distance' | 'rating' | 'price' | 'newest' | 'popular';
  page?: number;
  limit?: number;
}

export interface SpotSearchResults {
  spots: ChargingSpot[];
  total: number;
  hasMore: boolean;
  searchCenter?: {
    lat: number;
    lng: number;
  };
}

// Form types
export interface CreateSpotData {
  name: string;
  description: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  category: SpotCategory;
  outletType: OutletType;
  chargingSpeed: ChargingSpeed;
  availableHours: string;
  pricePerHour: number;
  pricePerMinute?: number;
  amenities: Amenity[];
  photos: string[];
  googleMapsLink?: string;
}

export interface UpdateSpotData extends Partial<CreateSpotData> {
  id: string;
}

export interface CreateRequestData {
  spotId: string;
  requestedTime: Date;
  duration: number;
  message?: string;
}

// UI State types
export interface LoadingState {
  isLoading: boolean;
  message?: string;
}

export interface ErrorState {
  hasError: boolean;
  message?: string;
  code?: string;
}

// Chart and analytics types
export interface SpotAnalytics {
  totalRequests: number;
  completedRequests: number;
  averageRating: number;
  totalRevenue: number;
  popularTimes: {
    hour: number;
    requests: number;
  }[];
  monthlyStats: {
    month: string;
    requests: number;
    revenue: number;
  }[];
}

export interface UserAnalytics {
  totalSpent: number;
  totalSaved: number;
  spotsVisited: number;
  reviewsGiven: number;
  wattsEarned: number;
  monthlyActivity: {
    month: string;
    requests: number;
    watts: number;
  }[];
}

// Government Charging Stations types
export interface GovernmentChargingStation {
  id: string;
  stationName: string;
  stationType: string;
  governmentDepartment: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: {
    lat: number;
    lng: number;
  };
  numberOfChargers: number;
  chargerTypes: string[];
  availabilityStatus: 'active' | 'maintenance' | 'inactive' | 'coming_soon';
  pricing: {
    pricePerHour: number;
    pricePerMinute?: number;
    freeCharging?: boolean;
  };
  workingHours: {
    weekdays: string;
    weekends: string;
    holidays?: string;
  };
  contact: {
    phone: string;
    email?: string;
    website?: string;
  };
  images: string[];
  logo?: string;
  description: string;
  notes?: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  isFeatured: boolean;
  createdAt: Date;
  updatedAt: Date;
  lastVerified?: Date;
  verifiedBy?: string;
  amenities: Array<{
    id: string;
    name: string;
    icon: string;
    available: boolean;
  }>;
  technical: {
    powerRating: string;
    voltage: string;
    current: string;
    connectorTypes: string[];
  };
  usage: {
    totalCharges: number;
    averageDailyUsage: number;
    lastMaintenance?: Date;
    nextMaintenance?: Date;
  };
}

export interface ImportResult {
  success: number;
  failed: number;
  skipped: number;
  errors: Array<{
    row: number;
    field: string;
    message: string;
    data: any;
  }>;
  imported: GovernmentChargingStation[];
}

export type GovernmentStationStatus = 'active' | 'maintenance' | 'inactive' | 'coming_soon';
export type GovernmentStationVerificationStatus = 'verified' | 'pending' | 'rejected';
