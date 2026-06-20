import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import {
  MapPin,
  Zap,
  DollarSign,
  Clock,
  Plus,
  Loader2,
  CheckCircle,
  AlertCircle,
  Home,
  Star,
  Car,
  Coffee,
  Building,
  Store,
  Hotel,
  Fuel
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminAuth';
import { ChargingSpot, SpotCategory, OutletType, ChargingSpeed, SpotStatus } from '@/types';
import { adminCreateSpot } from '@/services/adminService';
import { adminGetAllUsers } from '@/services/adminService';
import { validateForm, validationRules } from '@/lib/validation';
import { LoadingSpinner } from '@/components/ui/loading-states';

interface AddSpotModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (spot: ChargingSpot) => void;
}

const SPOT_CATEGORIES: SpotCategory[] = [
  'home', 'office', 'cafe', 'restaurant', 'shop', 'mall', 'hotel', 'coworking', 'gas_station', 'other'
];

const OUTLET_TYPES: OutletType[] = [
  'standard_3pin',
  '5_amp',
  '16_amp',
  'type2_ev',
  'ccs',
  'tesla',
  'usb'
];

const CHARGING_SPEEDS: ChargingSpeed[] = [
  'slow',
  'fast',
  'rapid',
  'ultra'
];

const CATEGORY_ICONS = {
  home: Home,
  office: Building,
  cafe: Coffee,
  restaurant: Store,
  shop: Store,
  mall: Store,
  hotel: Hotel,
  coworking: Building,
  gas_station: Fuel,
  other: MapPin
};

interface SpotFormData {
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
  coordinates: { lat: number; lng: number };
  category: SpotCategory;
  outletType: OutletType;
  chargingSpeed: ChargingSpeed;
  availableHours: string;
  pricePerHour: number;
  pricePerMinute?: number;
  amenities: string[];
}

const defaultFormData: SpotFormData = {
  hostId: '',
  hostName: '',
  hostEmail: '',
  hostPhone: '',
  name: '',
  description: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  coordinates: { lat: 0, lng: 0 },
  category: 'home',
  outletType: 'standard_3pin',
  chargingSpeed: 'slow',
  availableHours: '24/7',
  pricePerHour: 0,
  pricePerMinute: undefined,
  amenities: []
};

export default function AddSpotModal({ isOpen, onClose, onSuccess }: AddSpotModalProps) {
  const { canEditSpots } = useAdminPermissions();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<SpotFormData>(defaultFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [users, setUsers] = useState<any[]>([]);

  const totalSteps = 4;
  const progress = (currentStep / totalSteps) * 100;

  useEffect(() => {
    if (isOpen) {
      loadUsers();
    }
  }, [isOpen]);

  const loadUsers = async () => {
    try {
      const allUsers = await adminGetAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Error loading users:', error);
      toast.error('Failed to load users');
    }
  };

  const handleInputChange = (field: keyof SpotFormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateCurrentStep = (): boolean => {
    const stepErrors: Record<string, string> = {};

    if (currentStep === 1) {
      if (!formData.hostId) stepErrors.hostId = 'Host is required';
      if (!formData.name.trim()) stepErrors.name = 'Spot name is required';
      if (!formData.description.trim()) stepErrors.description = 'Description is required';
      if (!formData.address.trim()) stepErrors.address = 'Address is required';
      if (!formData.city.trim()) stepErrors.city = 'City is required';
      if (!formData.state.trim()) stepErrors.state = 'State is required';
      if (!formData.pincode.trim()) stepErrors.pincode = 'Pincode is required';
      if (formData.coordinates.lat === 0 || formData.coordinates.lng === 0) {
        stepErrors.coordinates = 'Coordinates are required';
      }
    }

    if (currentStep === 2) {
      if (!formData.category) stepErrors.category = 'Category is required';
      if (!formData.outletType) stepErrors.outletType = 'Outlet type is required';
      if (!formData.chargingSpeed) stepErrors.chargingSpeed = 'Charging speed is required';
      if (!formData.availableHours.trim()) stepErrors.availableHours = 'Available hours are required';
    }

    if (currentStep === 3) {
      if (formData.pricePerHour <= 0) stepErrors.pricePerHour = 'Price must be greater than 0';
      if (formData.pricePerMinute !== undefined && formData.pricePerMinute <= 0) {
        stepErrors.pricePerMinute = 'Price must be greater than 0';
      }
    }

    setErrors(stepErrors);
    return Object.keys(stepErrors).length === 0;
  };

  const nextStep = () => {
    if (validateCurrentStep()) {
      setCurrentStep(prev => Math.min(prev + 1, totalSteps));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateCurrentStep()) return;

    setIsSubmitting(true);
    try {
      // Create spot
      const spotData: Omit<ChargingSpot, 'id' | 'createdAt' | 'updatedAt'> = {
        ...formData,
        rating: 0,
        reviews: [],
        totalCharges: 0,
        status: 'pending' as SpotStatus,
        isVerified: false,
        isFeatured: false,
        photos: [],
        amenities: [], // Empty array since we're not collecting amenities
      };

      const createdSpot = await adminCreateSpot(spotData);

      toast.success('Spot created successfully!');
      onSuccess?.(createdSpot);
      handleClose();
    } catch (error) {
      console.error('Error creating spot:', error);
      toast.error('Failed to create spot');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setCurrentStep(1);
    setFormData(defaultFormData);
    setErrors({});
    onClose();
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Basic Information</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="hostId">Host *</Label>
                  <Select value={formData.hostId} onValueChange={(value) => handleInputChange('hostId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a host" />
                    </SelectTrigger>
                    <SelectContent>
                      {users.map(user => (
                        <SelectItem key={user.id} value={user.id}>
                          {user.displayName} ({user.email})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.hostId && <p className="text-sm text-destructive">{errors.hostId}</p>}
                </div>

                <div>
                  <Label htmlFor="name">Spot Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="Enter spot name"
                  />
                  {errors.name && <p className="text-sm text-destructive">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="description">Description *</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => handleInputChange('description', e.target.value)}
                    placeholder="Describe the charging spot"
                    rows={3}
                  />
                  {errors.description && <p className="text-sm text-destructive">{errors.description}</p>}
                </div>

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
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Spot Details</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="category">Category *</Label>
                  <Select value={formData.category} onValueChange={(value) => handleInputChange('category', value as SpotCategory)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      {SPOT_CATEGORIES.map(category => {
                        const Icon = CATEGORY_ICONS[category];
                        return (
                          <SelectItem key={category} value={category}>
                            <div className="flex items-center gap-2">
                              <Icon className="w-4 h-4" />
                              {category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ')}
                            </div>
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                  {errors.category && <p className="text-sm text-destructive">{errors.category}</p>}
                </div>

                <div>
                  <Label htmlFor="outletType">Outlet Type *</Label>
                  <Select value={formData.outletType} onValueChange={(value) => handleInputChange('outletType', value as OutletType)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select outlet type" />
                    </SelectTrigger>
                    <SelectContent>
                      {OUTLET_TYPES.map(type => (
                        <SelectItem key={type} value={type}>
                          {type.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.outletType && <p className="text-sm text-destructive">{errors.outletType}</p>}
                </div>

                <div>
                  <Label htmlFor="chargingSpeed">Charging Speed *</Label>
                  <Select value={formData.chargingSpeed} onValueChange={(value) => handleInputChange('chargingSpeed', value as ChargingSpeed)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select charging speed" />
                    </SelectTrigger>
                    <SelectContent>
                      {CHARGING_SPEEDS.map(speed => (
                        <SelectItem key={speed} value={speed}>
                          {speed.replace('_', ' ').toUpperCase()}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.chargingSpeed && <p className="text-sm text-destructive">{errors.chargingSpeed}</p>}
                </div>

                <div>
                  <Label htmlFor="availableHours">Available Hours *</Label>
                  <Input
                    id="availableHours"
                    value={formData.availableHours}
                    onChange={(e) => handleInputChange('availableHours', e.target.value)}
                    placeholder="e.g., 24/7, 9 AM - 6 PM"
                  />
                  {errors.availableHours && <p className="text-sm text-destructive">{errors.availableHours}</p>}
                </div>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Pricing</h3>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="pricePerHour">Price per Hour (Rs) *</Label>
                  <Input
                    id="pricePerHour"
                    type="number"
                    min="0"
                    step="1"
                    value={formData.pricePerHour}
                    onChange={(e) => handleInputChange('pricePerHour', parseFloat(e.target.value) || 0)}
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
                    value={formData.pricePerMinute || ''}
                    onChange={(e) => handleInputChange('pricePerMinute', e.target.value ? parseFloat(e.target.value) : undefined)}
                    placeholder="Enter price per minute"
                  />
                  {errors.pricePerMinute && <p className="text-sm text-destructive">{errors.pricePerMinute}</p>}
                </div>
              </div>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold mb-4">Summary</h3>

              <div className="bg-muted/50 p-4 rounded-lg">
                <h4 className="font-medium mb-2">Review your spot details</h4>
                <div className="space-y-1 text-sm">
                  <p><strong>Name:</strong> {formData.name}</p>
                  <p><strong>Host:</strong> {formData.hostName}</p>
                  <p><strong>Address:</strong> {formData.address}, {formData.city}</p>
                  <p><strong>Category:</strong> {formData.category}</p>
                  <p><strong>Outlet Type:</strong> {formData.outletType}</p>
                  <p><strong>Price:</strong> Rs {formData.pricePerHour}/hour</p>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  if (!canEditSpots) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent>
          <div className="text-center py-8">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Access Denied</h3>
            <p className="text-muted-foreground">You don't have permission to create spots.</p>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add New Charging Spot</DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Progress */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Step {currentStep} of {totalSteps}</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>

          {/* Form Content */}
          {renderStep()}

          {/* Navigation */}
          <div className="flex justify-between pt-4 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStep === 1}
            >
              Previous
            </Button>

            {currentStep === totalSteps ? (
              <Button
                onClick={handleSubmit}
                disabled={isSubmitting}
                className="min-w-[120px]"
              >
                {isSubmitting ? (
                  <>
                    <LoadingSpinner size="sm" className="mr-2" />
                    Creating...
                  </>
                ) : (
                  'Create Spot'
                )}
              </Button>
            ) : (
              <Button onClick={nextStep}>
                Next
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
