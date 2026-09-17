import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
  Building,
  Zap,
  DollarSign,
  Clock,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Phone,
  Mail,
  Globe,
  MapPin,
  Settings,
  Shield
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminAuth';
import { NetworkChargingStation } from '@/types';
import { adminCreateNetworkStation, adminUpdateNetworkStation } from '@/services/networkStationService';
import { validateForm, validationRules } from '@/lib/validation';
import { LoadingSpinner } from '@/components/ui/loading-states';

interface AddStationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (station?: NetworkChargingStation) => void;
  initialData?: NetworkChargingStation | null;
}

const GOVERNMENT_DEPARTMENTS = [
  'Ministry of Power',
  'Ministry of New and Renewable Energy',
  'Ministry of Heavy Industries',
  'State Electricity Board',
  'Municipal Corporation',
  'Public Works Department',
  'Transport Department',
  'Other'
];

const CHARGER_TYPES = [
  'Type 2',
  'CCS',
  'CHAdeMO',
  'Type 1',
  'Standard 3-pin',
  '5 Amp',
  '16 Amp'
];

const STATION_TYPES = [
  'Public Charging Station',
  'Network Operator',
  'Educational Institution',
  'Hospital',
  'Parking Area',
  'Highway',
  'Urban Center',
  'Rural Area'
];

interface StationFormData {
  stationName: string;
  stationType: string;
  networkOperator: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  coordinates: { lat: number; lng: number };
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
  description: string;
  notes?: string;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  isFeatured: boolean;
  googleMapsUrl?: string;
}

const defaultFormData: StationFormData = {
  stationName: '',
  stationType: '',
  networkOperator: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  coordinates: { lat: 0, lng: 0 },
  numberOfChargers: 1,
  chargerTypes: [],
  availabilityStatus: 'active',
  pricing: {
    pricePerHour: 0,
    pricePerMinute: undefined,
    freeCharging: false
  },
  workingHours: {
    weekdays: '24/7',
    weekends: '24/7'
  },
  contact: {
    phone: '',
    email: '',
    website: ''
  },
  description: '',
  notes: '',
  verificationStatus: 'pending',
  isFeatured: false,
  googleMapsUrl: ''
};

export default function AddStationModal({ isOpen, onClose, onSuccess, initialData }: AddStationModalProps) {
  const { canEditSpots } = useAdminPermissions();
  const [formData, setFormData] = useState<StationFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (initialData) {
        setFormData({
          stationName: initialData.stationName || '',
          stationType: initialData.stationType || '',
          networkOperator: initialData.networkOperator || '',
          address: initialData.address || '',
          city: initialData.city || '',
          state: initialData.state || '',
          pincode: initialData.pincode || '',
          coordinates: initialData.coordinates || { lat: 0, lng: 0 },
          numberOfChargers: initialData.numberOfChargers || 1,
          chargerTypes: initialData.chargerTypes || [],
          availabilityStatus: initialData.availabilityStatus || 'active',
          pricing: {
            pricePerHour: initialData.pricing?.pricePerHour ?? 0,
            pricePerMinute: initialData.pricing?.pricePerMinute,
            freeCharging: initialData.pricing?.freeCharging || false
          },
          workingHours: {
            weekdays: initialData.workingHours?.weekdays || '24/7',
            weekends: initialData.workingHours?.weekends || '24/7',
            holidays: initialData.workingHours?.holidays
          },
          contact: {
            phone: initialData.contact?.phone || '',
            email: initialData.contact?.email || '',
            website: initialData.contact?.website || ''
          },
          description: initialData.description || '',
          notes: initialData.notes || '',
          verificationStatus: initialData.verificationStatus || 'pending',
          isFeatured: initialData.isFeatured || false,
          googleMapsUrl: initialData.googleMapsUrl || ''
        });
      } else {
        setFormData(defaultFormData);
      }
      setErrors({});
    }
  }, [isOpen, initialData]);

  const handleInputChange = (field: keyof StationFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleNestedInputChange = (parent: keyof StationFormData, field: string, value: any) => {
    setFormData(prev => {
      const parentData = prev[parent] as any;
      return {
        ...prev,
        [parent]: {
          ...parentData,
          [field]: value
        }
      };
    });
  };

  const handleChargerTypeToggle = (chargerType: string) => {
    const currentTypes = formData.chargerTypes;
    const newTypes = currentTypes.includes(chargerType)
      ? currentTypes.filter(t => t !== chargerType)
      : [...currentTypes, chargerType];
    setFormData(prev => ({ ...prev, chargerTypes: newTypes }));
  };

  const validateForm = (): boolean => {
    const formErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.stationName.trim()) formErrors.stationName = 'Station name is required';
    if (!formData.stationType) formErrors.stationType = 'Station type is required';
    if (!formData.networkOperator) formErrors.networkOperator = 'Network operator is required';
    if (!formData.address.trim()) formErrors.address = 'Address is required';
    if (!formData.city.trim()) formErrors.city = 'City is required';
    if (!formData.state.trim()) formErrors.state = 'State is required';
    if (!formData.pincode.trim()) formErrors.pincode = 'Pincode is required';
    if (formData.coordinates.lat === 0 || formData.coordinates.lng === 0) {
      formErrors.coordinates = 'Coordinates are required';
    }
    if (formData.numberOfChargers <= 0) formErrors.numberOfChargers = 'Number of chargers must be greater than 0';
    if (formData.chargerTypes.length === 0) formErrors.chargerTypes = 'At least one charger type is required';
    if (!formData.contact.phone.trim()) formErrors.phone = 'Contact phone is required';
    if (!formData.description.trim()) formErrors.description = 'Description is required';

    // Phone validation
    const phoneRegex = /^[\+]?[1-9][\d]{0,15}$/;
    const cleanPhone = formData.contact.phone.replace(/[\s\-\(\)]/g, '');
    if (!phoneRegex.test(cleanPhone)) {
      formErrors.phone = 'Please enter a valid phone number';
    }

    // Pincode validation
    const pincodeRegex = /^\d{6}$/;
    if (!pincodeRegex.test(formData.pincode)) {
      formErrors.pincode = 'Please enter a valid 6-digit pincode';
    }

    // Price validation
    if (formData.pricing.pricePerHour < 0) {
      formErrors.pricePerHour = 'Price cannot be negative';
    }

    setErrors(formErrors);
    return Object.keys(formErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    setIsSubmitting(true);
    try {
      if (initialData) {
        // Update existing station
        const updates: Partial<NetworkChargingStation> = {
          ...formData,
          technical: {
            powerRating: initialData.technical?.powerRating || '50kW',
            voltage: initialData.technical?.voltage || '400V',
            current: initialData.technical?.current || '125A',
            connectorTypes: formData.chargerTypes
          }
        };
        await adminUpdateNetworkStation(initialData.id, updates);
        toast.success('Network station updated successfully!');
        onSuccess?.();
        handleClose();
      } else {
        // Create station
        const stationData: Omit<NetworkChargingStation, 'id' | 'createdAt' | 'updatedAt'> = {
          ...formData,
          images: [],
          logo: '',
          amenities: [],
          technical: {
            powerRating: '50kW',
            voltage: '400V',
            current: '125A',
            connectorTypes: formData.chargerTypes
          },
          usage: {
            totalCharges: 0,
            averageDailyUsage: 0,
            lastMaintenance: undefined,
            nextMaintenance: undefined
          }
        };

        const createdStation = await adminCreateNetworkStation(stationData);

        toast.success('Network station created successfully!');
        onSuccess?.(createdStation);
        handleClose();
      }
    } catch (error) {
      console.error('Error saving station:', error);
      toast.error(initialData ? 'Failed to update network station' : 'Failed to create network station');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFormData(defaultFormData);
    setErrors({});
    onClose();
  };

  if (!canEditSpots) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You don't have permission to edit network stations.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{initialData ? 'Edit Network Charging Station' : 'Add New Network Charging Station'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Basic Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="stationName">Station Name *</Label>
                <Input
                  id="stationName"
                  value={formData.stationName}
                  onChange={(e) => handleInputChange('stationName', e.target.value)}
                  placeholder="Enter station name"
                />
                {errors.stationName && <p className="text-sm text-destructive">{errors.stationName}</p>}
              </div>

              <div>
                <Label htmlFor="stationType">Station Type *</Label>
                <Select value={formData.stationType} onValueChange={(value) => handleInputChange('stationType', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select station type" />
                  </SelectTrigger>
                  <SelectContent>
                    {STATION_TYPES.map(type => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.stationType && <p className="text-sm text-destructive">{errors.stationType}</p>}
              </div>

              <div>
                <Label htmlFor="networkOperator">Network Operator *</Label>
                <Select value={formData.networkOperator} onValueChange={(value) => handleInputChange('networkOperator', value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select department" />
                  </SelectTrigger>
                  <SelectContent>
                    {GOVERNMENT_DEPARTMENTS.map(dept => (
                      <SelectItem key={dept} value={dept}>{dept}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {errors.networkOperator && <p className="text-sm text-destructive">{errors.networkOperator}</p>}
              </div>

              <div>
                <Label htmlFor="verificationStatus">Verification Status</Label>
                <Select value={formData.verificationStatus} onValueChange={(value) => handleInputChange('verificationStatus', value as 'verified' | 'pending' | 'rejected')}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select verification status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="verified">Verified</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label htmlFor="description">Description *</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                placeholder="Describe the charging station"
                rows={3}
              />
              {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                value={formData.notes || ''}
                onChange={(e) => handleInputChange('notes', e.target.value)}
                placeholder="Additional notes about the station"
                rows={2}
              />
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Location Information</h3>

            <div>
              <Label htmlFor="address">Address *</Label>
              <Input
                id="address"
                value={formData.address}
                onChange={(e) => handleInputChange('address', e.target.value)}
                placeholder="Enter complete address"
              />
              {errors.address && <p className="text-sm text-destructive">{errors.address}</p>}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <div>
                <Label htmlFor="city">City *</Label>
                <Input
                  id="city"
                  value={formData.city}
                  onChange={(e) => handleInputChange('city', e.target.value)}
                  placeholder="City"
                />
                {errors.city && <p className="text-sm text-destructive">{errors.city}</p>}
              </div>
              <div>
                <Label htmlFor="state">State *</Label>
                <Input
                  id="state"
                  value={formData.state}
                  onChange={(e) => handleInputChange('state', e.target.value)}
                  placeholder="State"
                />
                {errors.state && <p className="text-sm text-destructive">{errors.state}</p>}
              </div>
              <div>
                <Label htmlFor="pincode">Pincode *</Label>
                <Input
                  id="pincode"
                  value={formData.pincode}
                  onChange={(e) => handleInputChange('pincode', e.target.value)}
                  placeholder="Pincode"
                  maxLength={6}
                />
                {errors.pincode && <p className="text-sm text-destructive">{errors.pincode}</p>}
              </div>
            </div>

            <div>
              <Label>Coordinates *</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <Input
                    value={formData.coordinates.lat}
                    onChange={(e) => handleInputChange('coordinates', { ...formData.coordinates, lat: parseFloat(e.target.value) || 0 })}
                    placeholder="Latitude"
                    type="number"
                    step="any"
                  />
                </div>
                <div>
                  <Input
                    value={formData.coordinates.lng}
                    onChange={(e) => handleInputChange('coordinates', { ...formData.coordinates, lng: parseFloat(e.target.value) || 0 })}
                    placeholder="Longitude"
                    type="number"
                    step="any"
                  />
                </div>
              </div>
              {errors.coordinates && <p className="text-sm text-destructive">{errors.coordinates}</p>}
            </div>

            <div>
              <Label htmlFor="googleMapsUrl">Google Maps Link (Optional)</Label>
              <Input
                id="googleMapsUrl"
                value={formData.googleMapsUrl || ''}
                onChange={(e) => handleInputChange('googleMapsUrl', e.target.value)}
                placeholder="e.g., https://maps.google.com/?q=16.705,74.243 or https://goo.gl/maps/..."
              />
            </div>
          </div>

          {/* Technical Specifications */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Technical Specifications</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="numberOfChargers">Number of Chargers *</Label>
                <Input
                  id="numberOfChargers"
                  type="number"
                  min="1"
                  value={formData.numberOfChargers}
                  onChange={(e) => handleInputChange('numberOfChargers', parseInt(e.target.value) || 1)}
                  placeholder="Number of chargers"
                />
                {errors.numberOfChargers && <p className="text-sm text-destructive">{errors.numberOfChargers}</p>}
              </div>

              <div>
                <Label htmlFor="availabilityStatus">Availability Status *</Label>
                <Select value={formData.availabilityStatus} onValueChange={(value) => handleInputChange('availabilityStatus', value as any)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="coming_soon">Coming Soon</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <Label>Charger Types *</Label>
              <div className="flex flex-wrap gap-2">
                {CHARGER_TYPES.map(type => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleChargerTypeToggle(type)}
                    className={`px-3 py-1 rounded-full text-sm border transition-colors ${formData.chargerTypes.includes(type)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border hover:bg-muted'
                      }`}
                  >
                    {type}
                  </button>
                ))}
              </div>
              {errors.chargerTypes && <p className="text-sm text-destructive">{errors.chargerTypes}</p>}
            </div>
          </div>

          {/* Pricing */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pricing</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="pricePerHour">Price per Hour (Rs) *</Label>
                <Input
                  id="pricePerHour"
                  type="number"
                  min="0"
                  step="1"
                  value={formData.pricing.pricePerHour}
                  onChange={(e) => handleNestedInputChange('pricing', 'pricePerHour', parseFloat(e.target.value) || 0)}
                  placeholder="Enter price per hour"
                />
                {errors.pricePerHour && <p className="text-sm text-destructive">{errors.pricePerHour}</p>}
              </div>

              <div>
                <Label htmlFor="pricePerMinute">Price per Minute (Rs) - Optional</Label>
                <Input
                  id="pricePerMinute"
                  type="number"
                  min="0"
                  step="0.1"
                  value={formData.pricing.pricePerMinute || ''}
                  onChange={(e) => handleNestedInputChange('pricing', 'pricePerMinute', e.target.value ? parseFloat(e.target.value) : undefined)}
                  placeholder="Enter price per minute"
                />
              </div>

              <div className="col-span-2">
                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="freeCharging"
                    checked={formData.pricing.freeCharging}
                    onChange={(e) => handleNestedInputChange('pricing', 'freeCharging', e.target.checked)}
                    className="rounded"
                  />
                  <Label htmlFor="freeCharging">Free Charging</Label>
                </div>
              </div>
            </div>
          </div>

          {/* Working Hours */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Working Hours</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="weekdays">Weekdays</Label>
                <Input
                  id="weekdays"
                  value={formData.workingHours.weekdays}
                  onChange={(e) => handleNestedInputChange('workingHours', 'weekdays', e.target.value)}
                  placeholder="e.g., 9 AM - 6 PM"
                />
              </div>
              <div>
                <Label htmlFor="weekends">Weekends</Label>
                <Input
                  id="weekends"
                  value={formData.workingHours.weekends}
                  onChange={(e) => handleNestedInputChange('workingHours', 'weekends', e.target.value)}
                  placeholder="e.g., 10 AM - 4 PM"
                />
              </div>
            </div>
          </div>

          {/* Contact Information */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contact Information</h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="phone">Phone *</Label>
                <Input
                  id="phone"
                  value={formData.contact.phone}
                  onChange={(e) => handleNestedInputChange('contact', 'phone', e.target.value)}
                  placeholder="Contact phone number"
                />
                {errors.phone && <p className="text-sm text-destructive">{errors.phone}</p>}
              </div>

              <div>
                <Label htmlFor="email">Email (Optional)</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.contact.email || ''}
                  onChange={(e) => handleNestedInputChange('contact', 'email', e.target.value)}
                  placeholder="Contact email"
                />
              </div>

              <div className="col-span-2">
                <Label htmlFor="website">Website (Optional)</Label>
                <Input
                  id="website"
                  value={formData.contact.website || ''}
                  onChange={(e) => handleNestedInputChange('contact', 'website', e.target.value)}
                  placeholder="Website URL"
                />
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end space-x-4 pt-4 border-t">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="min-w-[120px]"
            >
              {isSubmitting ? (
                <>
                  <LoadingSpinner size="sm" className="mr-2" />
                  {initialData ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                initialData ? 'Update Station' : 'Create Station'
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
