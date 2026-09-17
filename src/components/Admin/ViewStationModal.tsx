import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { NetworkChargingStation } from '@/types';
import {
  MapPin,
  Building,
  Zap,
  Clock,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Edit,
  Shield,
  CheckCircle,
  AlertTriangle,
  XCircle,
  ExternalLink
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminAuth';

interface ViewStationModalProps {
  station: NetworkChargingStation | null;
  isOpen: boolean;
  onClose: () => void;
  onEdit?: (station: NetworkChargingStation) => void;
}

export default function ViewStationModal({
  station,
  isOpen,
  onClose,
  onEdit
}: ViewStationModalProps) {
  const { canEditSpots } = useAdminPermissions();

  if (!station) return null;

  const getStatusBadgeColor = (status: NetworkChargingStation['availabilityStatus']) => {
    switch (status) {
      case 'active':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'maintenance':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'inactive':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      case 'coming_soon':
        return 'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400 border-cyan-500/30';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  const getVerificationBadgeColor = (status: NetworkChargingStation['verificationStatus']) => {
    switch (status) {
      case 'verified':
        return 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/30';
      case 'pending':
        return 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/30';
      case 'rejected':
        return 'bg-rose-500/15 text-rose-600 dark:text-rose-400 border-rose-500/30';
      default:
        return 'bg-slate-500/15 text-slate-600 dark:text-slate-400 border-slate-500/30';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader className="border-b pb-4">
          <div className="flex flex-wrap items-center justify-between gap-2 pr-6">
            <div>
              <DialogTitle className="text-xl font-bold">{station.stationName}</DialogTitle>
              <p className="text-sm text-muted-foreground flex items-center gap-1.5 mt-1">
                <Building className="w-3.5 h-3.5" /> {station.networkOperator} • {station.stationType}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Badge className={getStatusBadgeColor(station.availabilityStatus)}>
                {station.availabilityStatus.replace('_', ' ').toUpperCase()}
              </Badge>
              <Badge className={getVerificationBadgeColor(station.verificationStatus)}>
                <Shield className="w-3 h-3 mr-1" />
                {station.verificationStatus.toUpperCase()}
              </Badge>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-5 py-2 text-sm">
          {/* Location & Maps */}
          <div className="space-y-2 bg-muted/40 p-3.5 rounded-xl border border-border/50">
            <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-cyan-500" /> Location Details
            </h4>
            <p className="font-medium text-foreground">{station.address}</p>
            <p className="text-muted-foreground">{station.city}, {station.state} - {station.pincode}</p>
            {station.googleMapsUrl && (
              <a
                href={station.googleMapsUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-600 dark:text-cyan-400 hover:underline mt-1"
              >
                <Globe className="w-3.5 h-3.5" /> Open Google Maps <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>

          {/* Technical Chargers */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-amber-500" /> Technical & Chargers
              </h4>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Number of Chargers:</span>
                <span className="font-bold">{station.numberOfChargers}</span>
              </div>
              <div className="space-y-1">
                <span className="text-muted-foreground block text-xs">Supported Charger Types:</span>
                <div className="flex flex-wrap gap-1.5">
                  {station.chargerTypes.map((type) => (
                    <Badge key={type} variant="secondary" className="text-xs">
                      {type}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Pricing */}
            <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-2">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <DollarSign className="w-4 h-4 text-emerald-500" /> Pricing Information
              </h4>
              <div className="flex justify-between items-center text-sm">
                <span className="text-muted-foreground">Rate:</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {station.pricing?.freeCharging
                    ? 'Free'
                    : station.pricing?.pricePerHour
                      ? `₹${station.pricing.pricePerHour} / hr`
                      : 'Not specified'}
                </span>
              </div>
              {station.pricing?.pricePerMinute ? (
                <div className="flex justify-between items-center text-xs text-muted-foreground">
                  <span>Price per min:</span>
                  <span>₹{station.pricing.pricePerMinute} / min</span>
                </div>
              ) : null}
            </div>
          </div>

          {/* Working Hours & Contact */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-1.5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-500" /> Working Hours
              </h4>
              <div className="text-xs space-y-1">
                <div><span className="text-muted-foreground">Weekdays:</span> <span className="font-medium">{station.workingHours?.weekdays || '24/7'}</span></div>
                <div><span className="text-muted-foreground">Weekends:</span> <span className="font-medium">{station.workingHours?.weekends || '24/7'}</span></div>
              </div>
            </div>

            <div className="bg-muted/40 p-3.5 rounded-xl border border-border/50 space-y-1.5">
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Phone className="w-4 h-4 text-purple-500" /> Contact Details
              </h4>
              <div className="text-xs space-y-1">
                {station.contact?.phone && (
                  <div><span className="text-muted-foreground">Phone:</span> <span className="font-medium">{station.contact.phone}</span></div>
                )}
                {station.contact?.email && (
                  <div><span className="text-muted-foreground">Email:</span> <span className="font-medium">{station.contact.email}</span></div>
                )}
                {station.contact?.website && (
                  <div>
                    <span className="text-muted-foreground">Website:</span>{' '}
                    <a href={station.contact.website} target="_blank" rel="noreferrer" className="text-cyan-600 hover:underline">
                      {station.contact.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Description & Notes */}
          {station.description && (
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">Description</h4>
              <p className="text-muted-foreground bg-muted/20 p-3 rounded-lg border text-xs leading-relaxed">{station.description}</p>
            </div>
          )}
          {station.notes && (
            <div>
              <h4 className="font-semibold text-xs uppercase tracking-wider text-muted-foreground mb-1">Internal Notes</h4>
              <p className="text-muted-foreground bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg text-xs leading-relaxed">{station.notes}</p>
            </div>
          )}
        </div>

        <DialogFooter className="gap-2 pt-2 border-t">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {canEditSpots && onEdit && (
            <Button
              onClick={() => {
                onClose();
                onEdit(station);
              }}
              className="bg-primary text-white"
            >
              <Edit className="w-4 h-4 mr-1.5" /> Edit Station
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
