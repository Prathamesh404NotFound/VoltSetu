import { database, auth } from '@/lib/firebase-services';
import { 
  ref, 
  get, 
  set, 
  update, 
  remove, 
  push, 
  serverTimestamp 
} from 'firebase/database';
import { 
  ref as storageRef, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage';
import { storage } from '@/lib/firebase-services';
import { NetworkChargingStation, ImportResult } from '@/types';

// Network Station Service Functions

export const adminGetAllNetworkStations = async (): Promise<NetworkChargingStation[]> => {
  try {
    const stationsRef = ref(database, 'networkStations');
    const snapshot = await get(stationsRef);
    
    if (!snapshot.exists()) {
      return [];
    }
    
    const stations = snapshot.val();
    return Object.keys(stations).map(key => ({
      id: key,
      ...stations[key],
      createdAt: stations[key].createdAt ? new Date(stations[key].createdAt) : new Date(),
      updatedAt: stations[key].updatedAt ? new Date(stations[key].updatedAt) : new Date(),
      lastVerified: stations[key].lastVerified ? new Date(stations[key].lastVerified) : undefined,
      nextMaintenance: stations[key].usage?.nextMaintenance ? new Date(stations[key].usage.nextMaintenance) : undefined,
      lastMaintenance: stations[key].usage?.lastMaintenance ? new Date(stations[key].usage.lastMaintenance) : undefined,
    }));
  } catch (error) {
    console.error('Error fetching network stations:', error);
    throw new Error('Failed to fetch network charging stations');
  }
};

export const adminGetNetworkStation = async (id: string): Promise<NetworkChargingStation | null> => {
  try {
    const stationRef = ref(database, `networkStations/${id}`);
    const snapshot = await get(stationRef);
    
    if (!snapshot.exists()) {
      return null;
    }
    
    const station = snapshot.val();
    return {
      id,
      ...station,
      createdAt: station.createdAt ? new Date(station.createdAt) : new Date(),
      updatedAt: station.updatedAt ? new Date(station.updatedAt) : new Date(),
      lastVerified: station.lastVerified ? new Date(station.lastVerified) : undefined,
      nextMaintenance: station.usage?.nextMaintenance ? new Date(station.usage.nextMaintenance) : undefined,
      lastMaintenance: station.usage?.lastMaintenance ? new Date(station.usage.lastMaintenance) : undefined,
    };
  } catch (error) {
    console.error('Error fetching network station:', error);
    throw new Error('Failed to fetch network charging station');
  }
};

export const adminCreateNetworkStation = async (stationData: Omit<NetworkChargingStation, 'id' | 'createdAt' | 'updatedAt'>): Promise<NetworkChargingStation> => {
  try {
    const stationsRef = ref(database, 'networkStations');
    const newStationRef = push(stationsRef);
    const stationId = newStationRef.key;
    
    if (!stationId) {
      throw new Error('Failed to generate station ID');
    }
    
    const station: NetworkChargingStation = {
      ...stationData,
      id: stationId,
      createdAt: new Date(),
      updatedAt: new Date(),
      usage: {
        ...stationData.usage,
        totalCharges: 0,
        averageDailyUsage: 0,
      },
    };
    
    await set(newStationRef, station);
    return station;
  } catch (error) {
    console.error('Error creating network station:', error);
    throw new Error('Failed to create network charging station');
  }
};

export const adminUpdateNetworkStation = async (id: string, updates: Partial<NetworkChargingStation>): Promise<void> => {
  try {
    const stationRef = ref(database, `networkStations/${id}`);
    await update(stationRef, { 
      ...updates, 
      updatedAt: serverTimestamp() 
    });
  } catch (error) {
    console.error('Error updating network station:', error);
    throw new Error('Failed to update network charging station');
  }
};

export const adminBatchUpdateNetworkStations = async (
  stationIds: string[],
  updates: Partial<NetworkChargingStation>
): Promise<number> => {
  try {
    let updatedCount = 0;
    const batchPromises = stationIds.map(async (id) => {
      const stationRef = ref(database, `networkStations/${id}`);
      await update(stationRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
      updatedCount++;
    });
    await Promise.all(batchPromises);
    return updatedCount;
  } catch (error) {
    console.error('Error batch updating network stations:', error);
    throw new Error('Failed to perform batch update on network stations');
  }
};

export const adminDeleteNetworkStation = async (id: string): Promise<void> => {
  try {
    await remove(ref(database, `networkStations/${id}`));
  } catch (error) {
    console.error('Error deleting network station:', error);
    throw new Error('Failed to delete network charging station');
  }
};

export const adminSearchNetworkStations = async (searchTerm: string): Promise<NetworkChargingStation[]> => {
  try {
    const stations = await adminGetAllNetworkStations();
    const lowerSearchTerm = searchTerm.toLowerCase();
    
    return stations.filter(station => 
      station.stationName.toLowerCase().includes(lowerSearchTerm) ||
      station.networkOperator.toLowerCase().includes(lowerSearchTerm) ||
      station.address.toLowerCase().includes(lowerSearchTerm) ||
      station.city.toLowerCase().includes(lowerSearchTerm) ||
      station.state.toLowerCase().includes(lowerSearchTerm)
    );
  } catch (error) {
    console.error('Error searching network stations:', error);
    throw new Error('Failed to search network charging stations');
  }
};

export const adminUpdateStationStatus = async (id: string, status: NetworkChargingStation['availabilityStatus']): Promise<void> => {
  try {
    const stationRef = ref(database, `networkStations/${id}`);
    await update(stationRef, { 
      availabilityStatus: status, 
      updatedAt: serverTimestamp() 
    });
  } catch (error) {
    console.error('Error updating station status:', error);
    throw new Error('Failed to update station status');
  }
};

export const adminUpdateVerificationStatus = async (id: string, status: NetworkChargingStation['verificationStatus']): Promise<void> => {
  try {
    const stationRef = ref(database, `networkStations/${id}`);
    await update(stationRef, { 
      verificationStatus: status,
      verifiedBy: auth.currentUser?.displayName || 'Admin',
      lastVerified: serverTimestamp(),
      updatedAt: serverTimestamp() 
    });
  } catch (error) {
    console.error('Error updating verification status:', error);
    throw new Error('Failed to update verification status');
  }
};

// File upload functions
export const adminUploadStationImage = async (file: File, stationId: string, imageName: string): Promise<string> => {
  try {
    const fileRef = storageRef(storage, `networkStations/${stationId}/${imageName}`);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);
    return downloadURL;
  } catch (error) {
    console.error('Error uploading station image:', error);
    throw new Error('Failed to upload station image');
  }
};

export const adminDeleteStationImage = async (stationId: string, imageName: string): Promise<void> => {
  try {
    const fileRef = storageRef(storage, `networkStations/${stationId}/${imageName}`);
    await deleteObject(fileRef);
  } catch (error) {
    console.error('Error deleting station image:', error);
    throw new Error('Failed to delete station image');
  }
};

// Bulk import functions
export const adminImportNetworkStations = async (stations: any[]): Promise<ImportResult> => {
  const result: ImportResult = {
    success: 0,
    failed: 0,
    skipped: 0,
    errors: [],
    imported: []
  };

  for (let i = 0; i < stations.length; i++) {
    const stationData = stations[i];
    
    try {
      // Validate required fields
      const validationError = validateStationData(stationData);
      if (validationError) {
        result.errors.push({
          row: i + 1,
          field: validationError.field,
          message: validationError.message,
          data: stationData
        });
        result.failed++;
        continue;
      }

      // Check for duplicates
      const existingStations = await adminGetAllNetworkStations();
      const isDuplicate = existingStations.some(station => 
        station.stationName.toLowerCase() === stationData.stationName.toLowerCase() ||
        (station.coordinates.lat === stationData.coordinates.lat && 
         station.coordinates.lng === stationData.coordinates.lng)
      );

      if (isDuplicate) {
        result.errors.push({
          row: i + 1,
          field: 'duplicate',
          message: 'Station with this name or coordinates already exists',
          data: stationData
        });
        result.skipped++;
        continue;
      }

      // Create station
      const createdStation = await adminCreateNetworkStation(stationData);
      result.imported.push(createdStation);
      result.success++;
      
    } catch (error) {
      result.errors.push({
        row: i + 1,
        field: 'general',
        message: error instanceof Error ? error.message : 'Failed to import station',
        data: stationData
      });
      result.failed++;
    }
  }

  return result;
};

// Validation function
const validateStationData = (stationData: any): { field: string; message: string } | null => {
  if (!stationData.stationName || stationData.stationName.trim() === '') {
    return { field: 'stationName', message: 'Station name is required' };
  }
  
  if (!stationData.networkOperator || stationData.networkOperator.trim() === '') {
    return { field: 'networkOperator', message: 'Network operator is required' };
  }
  
  if (!stationData.address || stationData.address.trim() === '') {
    return { field: 'address', message: 'Address is required' };
  }
  
  if (!stationData.city || stationData.city.trim() === '') {
    return { field: 'city', message: 'City is required' };
  }
  
  if (!stationData.state || stationData.state.trim() === '') {
    return { field: 'state', message: 'State is required' };
  }
  
  if (!stationData.pincode || stationData.pincode.trim() === '') {
    return { field: 'pincode', message: 'Pincode is required' };
  }
  
  if (!stationData.coordinates || !stationData.coordinates.lat || !stationData.coordinates.lng) {
    return { field: 'coordinates', message: 'Valid coordinates are required' };
  }
  
  if (isNaN(stationData.coordinates.lat) || isNaN(stationData.coordinates.lng)) {
    return { field: 'coordinates', message: 'Coordinates must be valid numbers' };
  }
  
  if (stationData.coordinates.lat < -90 || stationData.coordinates.lat > 90) {
    return { field: 'coordinates', message: 'Latitude must be between -90 and 90' };
  }
  
  if (stationData.coordinates.lng < -180 || stationData.coordinates.lng > 180) {
    return { field: 'coordinates', message: 'Longitude must be between -180 and 180' };
  }
  
  if (!stationData.contact || !stationData.contact.phone) {
    return { field: 'contact.phone', message: 'Contact phone is required' };
  }
  
  // Validate phone number format (basic validation)
  const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
  if (!phoneRegex.test(stationData.contact.phone.replace(/[\s\-\(\)]/g, ''))) {
    return { field: 'contact.phone', message: 'Invalid phone number format' };
  }
  
  return null;
};

// Pagination functions
export const adminGetNetworkStationsPaginated = async (
  page: number = 1, 
  limit: number = 10
): Promise<{ stations: NetworkChargingStation[]; total: number; }> => {
  try {
    const stationsRef = ref(database, 'networkStations');
    const snapshot = await get(stationsRef);
    
    if (!snapshot.exists()) {
      return { stations: [], total: 0 };
    }
    
    const stations = snapshot.val();
    const stationArray = Object.keys(stations).map(key => ({
      id: key,
      ...stations[key],
      createdAt: stations[key].createdAt ? new Date(stations[key].createdAt) : new Date(),
      updatedAt: stations[key].updatedAt ? new Date(stations[key].updatedAt) : new Date(),
      lastVerified: stations[key].lastVerified ? new Date(stations[key].lastVerified) : undefined,
      nextMaintenance: stations[key].usage?.nextMaintenance ? new Date(stations[key].usage.nextMaintenance) : undefined,
      lastMaintenance: stations[key].usage?.lastMaintenance ? new Date(stations[key].usage.lastMaintenance) : undefined,
    }));
    
    const total = stationArray.length;
    const startIndex = (page - 1) * limit;
    const endIndex = Math.min(startIndex + limit, total);
    
    return {
      stations: stationArray.slice(startIndex, endIndex),
      total,
    };
  } catch (error) {
    console.error('Error fetching paginated network stations:', error);
    throw new Error('Failed to fetch paginated network charging stations');
  }
};

// Statistics functions
export const adminGetNetworkStationStats = async () => {
  try {
    const stations = await adminGetAllNetworkStations();
    
    const stats = {
      total: stations.length,
      active: stations.filter(s => s.availabilityStatus === 'active').length,
      maintenance: stations.filter(s => s.availabilityStatus === 'maintenance').length,
      inactive: stations.filter(s => s.availabilityStatus === 'inactive').length,
      comingSoon: stations.filter(s => s.availabilityStatus === 'coming_soon').length,
      verified: stations.filter(s => s.verificationStatus === 'verified').length,
      pending: stations.filter(s => s.verificationStatus === 'pending').length,
      rejected: stations.filter(s => s.verificationStatus === 'rejected').length,
      featured: stations.filter(s => s.isFeatured).length,
      totalChargers: stations.reduce((sum, s) => sum + s.numberOfChargers, 0),
      averageChargers: stations.length > 0 ? stations.reduce((sum, s) => sum + s.numberOfChargers, 0) / stations.length : 0,
    };
    
    return stats;
  } catch (error) {
    console.error('Error fetching network station stats:', error);
    throw new Error('Failed to fetch network station statistics');
  }
};
