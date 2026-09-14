import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Plus,
  Edit,
  Trash2,
  MapPin,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  Star,
  Image as ImageIcon,
  Ban,
  X,
  Building,
  Shield,
  AlertTriangle,
  Settings,
  Upload,
  Download,
  RefreshCw
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminAuth';
import { NetworkChargingStation } from '@/types';
import AddStationModal from '@/components/Admin/AddStationModal';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  adminGetAllNetworkStations,
  adminUpdateStationStatus,
  adminUpdateVerificationStatus,
  adminDeleteNetworkStation,
  adminSearchNetworkStations,
  adminImportNetworkStations,
} from '@/services/networkStationService';
import { toast } from 'sonner';
import ResponsiveContainer from '@/components/ui/responsive-container';
import ResponsiveGrid from '@/components/ui/responsive-grid';
import SEO from "@/components/SEO";

const AdminNetworkStationsPage: React.FC = () => {
  const { canManageSpots, canEditSpots, canDeleteSpots } = useAdminPermissions();
  const [stations, setStations] = useState<NetworkChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState<NetworkChargingStation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | NetworkChargingStation['availabilityStatus']>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | NetworkChargingStation['verificationStatus']>('all');
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);
  const [addStationModalOpen, setAddStationModalOpen] = useState(false);
  const [importDialogOpen, setImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [importPreview, setImportPreview] = useState<any[]>([]);
  const [importResult, setImportResult] = useState<any>(null);

  useEffect(() => {
    if (!canManageSpots) return;
    fetchStations();
  }, [canManageSpots]);

  const fetchStations = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminGetAllNetworkStations();
      setStations(data);
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch network stations');
    } finally {
      setLoading(false);
    }
  };

  const handleStationCreated = (newStation: NetworkChargingStation) => {
    setStations(prev => [newStation, ...prev]);
    setAddStationModalOpen(false);
    toast.success('Network station created successfully!');
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchStations();
      return;
    }

    try {
      setLoading(true);
      setError('');
      const searchedStations = await adminSearchNetworkStations(searchTerm);
      setStations(searchedStations);
    } catch (error) {
      console.error('Error searching network stations:', error);
      setError(error instanceof Error ? error.message : 'Failed to search network charging stations');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        fetchStations();
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const filteredStations = stations.filter(station => {
    const matchesStatus = statusFilter === 'all' || station.availabilityStatus === statusFilter;
    const matchesVerification = verificationFilter === 'all' || station.verificationStatus === verificationFilter;
    return matchesStatus && matchesVerification;
  });

  const handleDeleteStation = async () => {
    if (!selectedStation || !canDeleteSpots) return;

    try {
      setActionLoading(true);
      setError('');
      await adminDeleteNetworkStation(selectedStation.id);
      setStations(stations.filter(s => s.id !== selectedStation.id));
      setDeleteDialogOpen(false);
      setSelectedStation(null);
    } catch (error) {
      console.error('Error deleting network station:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete network charging station');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (stationId: string, newStatus: NetworkChargingStation['availabilityStatus']) => {
    if (!canEditSpots) return;

    try {
      setActionLoading(true);
      setError('');
      await adminUpdateStationStatus(stationId, newStatus);
      setStations(stations.map(station =>
        station.id === stationId ? { ...station, availabilityStatus: newStatus } : station
      ));
    } catch (error) {
      console.error('Error updating station status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update station status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleVerificationChange = async (stationId: string, newStatus: NetworkChargingStation['verificationStatus']) => {
    if (!canEditSpots) return;

    try {
      setActionLoading(true);
      setError('');
      await adminUpdateVerificationStatus(stationId, newStatus);
      setStations(stations.map(station =>
        station.id === stationId ? { ...station, verificationStatus: newStatus } : station
      ));
    } catch (error) {
      console.error('Error updating verification status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update verification status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: NetworkChargingStation['availabilityStatus']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
      case 'coming_soon':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getVerificationBadgeColor = (status: NetworkChargingStation['verificationStatus']) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getStatusIcon = (status: NetworkChargingStation['availabilityStatus']) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'maintenance':
        return AlertTriangle;
      case 'inactive':
        return XCircle;
      case 'coming_soon':
        return Clock;
      default:
        return Building;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN').format(date);
  };

  // Simple RFC-4180-aware CSV row parser (handles quoted fields containing commas)
  const parseCsvRow = (row: string): string[] => {
    const out: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < row.length; i++) {
      const ch = row[i];
      if (ch === '"') {
        if (inQuotes && row[i + 1] === '"') {
          cur += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        out.push(cur);
        cur = '';
      } else {
        cur += ch;
      }
    }
    out.push(cur);
    return out;
  };

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);

      try {
        const fileExtension = file.name.split('.').pop()?.toLowerCase();
        let parsedData: any[] = [];

        if (fileExtension === 'csv') {
          // Parse CSV file
          const text = await file.text();
          const lines = text.split('\n').filter(line => line.trim());
          const headers = parseCsvRow(lines[0]).map(h => h.trim().toLowerCase());

          parsedData = lines.slice(1).map((line, index) => {
            const values = parseCsvRow(line).map(v => v.trim());
            const station: any = {};

            headers.forEach((header, i) => {
              const value = values[i] || '';
              switch (header.toLowerCase()) {
                case 'stationname':
                  station.stationName = value;
                  break;
                case 'governmentdepartment':
                case 'networkoperator':
                case 'network':
                  station.networkOperator = value;
                  break;
                case 'stationtype':
                  station.stationType = value;
                  break;
                case 'priceperminute':
                  station.pricePerMinute = value;
                  break;
                case 'freecharging':
                  station.freeCharging = value;
                  break;
                case 'weekdayshours':
                  station.weekdaysHours = value;
                  break;
                case 'weekendshours':
                  station.weekendsHours = value;
                  break;
                case 'holidayshours':
                  station.holidaysHours = value;
                  break;
                case 'contactemail':
                  station.contactEmail = value;
                  break;
                case 'contactwebsite':
                  station.contactWebsite = value;
                  break;
                case 'notes':
                  station.notes = value;
                  break;
                case 'verificationstatus':
                  station.verificationStatus = value;
                  break;
                case 'isfeatured':
                  station.isFeatured = value;
                  break;
                case 'address':
                  station.address = value;
                  break;
                case 'city':
                  station.city = value;
                  break;
                case 'state':
                  station.state = value;
                  break;
                case 'pincode':
                  station.pincode = value;
                  break;
                case 'latitude':
                case 'lat':
                  station.lat = parseFloat(value) || 0;
                  break;
                case 'longitude':
                case 'lng':
                  station.lng = parseFloat(value) || 0;
                  break;
                case 'numberofchargers':
                  station.numberOfChargers = parseInt(value) || 1;
                  break;
                case 'chargertypes':
                  station.chargerTypes = value.split(/[;,]/).map(t => t.trim()).filter(t => t);
                  break;
                case 'availabilitystatus':
                  station.availabilityStatus = value.toLowerCase() || 'active';
                  break;
                case 'priceperhour':
                  station.pricePerHour = parseFloat(value) || 0;
                  break;
                case 'phone':
                case 'contactphone':
                  station.phone = value;
                  break;
                case 'description':
                  station.description = value;
                  break;
                default:
                  station[header] = value;
              }
            });

            // Create proper structure
            return {
              stationName: station.stationName || `Station ${index + 1}`,
              networkOperator: station.networkOperator || 'Unknown',
              address: station.address || 'Unknown Address',
              city: station.city || 'Unknown City',
              state: station.state || 'Unknown State',
              pincode: station.pincode || '000000',
              coordinates: { lat: station.lat || 0, lng: station.lng || 0 },
              numberOfChargers: station.numberOfChargers || 1,
              chargerTypes: station.chargerTypes || ['Type 2'],
              availabilityStatus: station.availabilityStatus || 'active',
              pricing: {
                pricePerHour: station.pricePerHour ?? 0,
                ...(station.pricePerMinute ? { pricePerMinute: parseFloat(station.pricePerMinute) || 0 } : {}),
                ...(String(station.freeCharging || '').toLowerCase() === 'true' ? { freeCharging: true } : {}),
              },
              workingHours: {
                weekdays: station.weekdaysHours || '9:00 AM - 6:00 PM',
                weekends: station.weekendsHours || '10:00 AM - 4:00 PM',
                ...(station.holidaysHours ? { holidays: station.holidaysHours } : {}),
              },
              contact: {
                phone: station.phone || '',
                ...(station.contactEmail ? { email: station.contactEmail } : {}),
                ...(station.contactWebsite ? { website: station.contactWebsite } : {}),
              },
              description: station.description || 'Network charging station',
              ...(station.notes ? { notes: station.notes } : {}),
              verificationStatus: (String(station.verificationStatus || 'pending').toLowerCase() === 'rejected') ? 'rejected' : (String(station.verificationStatus || '').toLowerCase() === 'verified' ? 'verified' : 'pending'),
              isFeatured: String(station.isFeatured || '').toLowerCase() === 'true',
              amenities: [],
              technical: { powerRating: '50kW', voltage: '400V', current: '125A', connectorTypes: station.chargerTypes || ['Type 2'] },
              usage: { totalCharges: 0, averageDailyUsage: 0 }
            };
          });
        } else if (fileExtension === 'xlsx' || fileExtension === 'xls') {
          // For Excel files, we'll show a message that they need to use CSV for now
          toast.error('Please use CSV format for bulk import. Excel files are not yet supported.');
          return;
        } else {
          toast.error('Unsupported file format. Please use CSV files.');
          return;
        }

        setImportPreview(parsedData);
        toast.success(`Successfully parsed ${parsedData.length} stations from file.`);

      } catch (error) {
        console.error('Error parsing file:', error);
        toast.error('Failed to parse file. Please check the format.');
        setImportPreview([]);
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile || !importPreview.length) return;

    try {
      setActionLoading(true);
      setError('');

      // Call the actual import function
      const result = await adminImportNetworkStations(importPreview);
      setImportResult(result);

      if (result.success > 0) {
        toast.success(`Successfully imported ${result.success} stations!`);
        // Refresh the stations list
        fetchStations();
      }

      if (result.failed > 0) {
        toast.error(`${result.failed} stations failed to import. Check the errors below.`);
      }

      if (result.skipped > 0) {
        toast.warning(`${result.skipped} stations were skipped (duplicates).`);
      }

      // Close dialog and reset
      setImportDialogOpen(false);
      setSelectedFile(null);
      setImportPreview([]);
      setImportResult(null);

    } catch (error) {
      console.error('Error importing stations:', error);
      setError(error instanceof Error ? error.message : 'Failed to import stations');
      toast.error('Failed to import stations. Please try again.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create CSV template data with all possible options
    const templateData = [
      // Header row
      'Station Name,Station Type,Network Operator,Address,City,State,Pincode,Latitude,Longitude,Number of Chargers,Charger Types,Availability Status,Price per Hour,Price per Minute,Free Charging,Weekdays Hours,Weekends Hours,Holidays Hours,Contact Phone,Contact Email,Contact Website,Description,Notes,Verification Status,Is Featured',

      // Example 1: Railway Station - Active
      'Central Railway Station,Public Charging Station,Indian Railways,Platform 1,Mumbai,Maharashtra,400001,19.0760,72.8777,4,"Type 2,CCS",active,50,1,,24/7,24/7,,+91-22-23004000,info@railway.gov.in,www.railway.gov.in,Main charging station near platform 1,Located near main entrance,pending,false',
      // Example 2: Network Operator - Active
      'Tata Power EZ Charge Hub,Public Charging Station,Tata Power,Station Road,Mumbai,Maharashtra,400001,19.0760,72.8777,6,"CCS,Type 2",active,40,0.6,,24/7,24/7,24/7,+91-1800-833-2233,info@tatapower.com,www.tatapower.com,Fast DC charging hub,Bike-friendly parking,pending,false',
      // Example 3: Network Operator - Maintenance
      'BPCL eDrive Kolhapur,Public Charging Station,BPCL,NH-4 Service Area,Kolhapur,Maharashtra,416001,16.7000,74.2500,2,"CCS",maintenance,35,0.5,,24/7,24/7,Closed,+91-1800-22-4344,support@bpclev.in,www.bpclev.in,Highway fast charging,Under routine maintenance,pending,true',
      // Example 4: Network Operator - Coming Soon
      'Ather Grid Ichalkaranji,Public Charging Station,Ather Energy,Main Market Road,Ichalkaranji,Maharashtra,416115,16.6900,74.4700,4,"Type 2",coming_soon,30,0.4,,9 AM - 9 PM,10 AM - 8 PM,,+91-92400-13861,grid@atherenergy.com,www.atherenergy.com,Bike fast-charging point,Opens next month,pending,false',
      // Example 5: Free Charging
      'Mall Parking Free Charge,Parking Area,Municipal Corporation,Mall Road,Pune,Maharashtra,411001,18.5204,73.8567,8,"Type 2,Standard 3pin",active,0,,true,24/7,24/7,24/7,+91-20-23361225,parking@pune.gov.in,www.pune.gov.in,Free public parking charging,2 hour limit,verified,false',
      // Example 6: Highway Charging
      'NH48 Highway Station,Highway Charging,Adani Energisation,NH48 Service Area,Kolhapur,Maharashtra,416122,16.7800,74.2800,10,"CCS,Type 2,CHAdeMO",active,80,1.5,,24/7,24/7,24/7,+91-99000-00000,highway@adani.com,www.adanipower.com,Highway fast charging,Truck and bike charging,verified,true',
      // Example 7: Urban Center
      'City Mall Charging Point,Urban Center,ChargeZone,Mall Parking,Mumbai,Maharashtra,400051,19.1176,72.9060,12,"Type 2,CCS,Standard 3pin",active,45,0.8,,10 AM - 10 PM,10 AM - 8 PM,Closed,+91-1800-121-2025,help@chargezone.in,www.chargezone.in,Mall parking charging,Peak hours pricing,pending,false',
      // Example 8: Rural Area
      'Village Community Charger,Rural Area,E-Fill,Village Square,Kagal,Maharashtra,416201,16.5372,74.3196,2,"CCS",active,25,0.3,,6 AM - 8 PM,7 AM - 7 PM,Closed,+91-94220-47176,support@efill.in,,Community charging for villagers,Free for residents,pending,false'
    ];

    // Create CSV blob
    const csvContent = templateData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'network_stations_template.csv');
    link.style.visibility = 'hidden';

    // Trigger download
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Clean up
    URL.revokeObjectURL(url);

    toast.success('Template downloaded successfully! Check the examples for all possible options.');
  };

  if (!canManageSpots) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Shield className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to manage network charging stations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <SEO 
        title="Manage Network Stations | Admin | ChargePush"
        description="Monitor and manage network EV charging infrastructure and verification status."
        noindex={true}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Network Charging Stations</h1>
          <p className="text-muted-foreground">Manage network charging infrastructure</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleDownloadTemplate}>
            <Download className="w-4 h-4 mr-2" />
            Get Template
          </Button>
          <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
            <Upload className="w-4 h-4 mr-2" />
            Import Stations
          </Button>
          <Button onClick={() => setAddStationModalOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Station
          </Button>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-4 h-4" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError('')}>
                <XCircle className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search stations by name, department, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex gap-2 flex-wrap">
              <div className="flex gap-2">
                <Button
                  variant={statusFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('all')}
                >
                  All Status
                </Button>
                <Button
                  variant={statusFilter === 'active' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('active')}
                >
                  Active
                </Button>
                <Button
                  variant={statusFilter === 'maintenance' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('maintenance')}
                >
                  Maintenance
                </Button>
                <Button
                  variant={statusFilter === 'coming_soon' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setStatusFilter('coming_soon')}
                >
                  Coming Soon
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={verificationFilter === 'all' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVerificationFilter('all')}
                >
                  All Verification
                </Button>
                <Button
                  variant={verificationFilter === 'verified' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVerificationFilter('verified')}
                >
                  Verified
                </Button>
                <Button
                  variant={verificationFilter === 'pending' ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => setVerificationFilter('pending')}
                >
                  Pending
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stations Table */}
      <Card>
        <CardHeader>
          <CardTitle>Network Charging Stations ({filteredStations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-4 text-muted-foreground">Loading network charging stations...</p>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No network stations found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'No network stations match the current filter'}
              </p>
            </div>
          ) : (
              <div className="responsive-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Station</TableHead>
                      <TableHead>Department</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Verification</TableHead>
                      <TableHead>Chargers</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredStations.map((station) => (
                      <TableRow key={station.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 overflow-hidden">
                              {station.images && station.images.length > 0 ? (
                                <img
                                  src={station.images[0]}
                                  alt={station.stationName}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Building className="w-full h-full p-3 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{station.stationName}</div>
                              <div className="text-sm text-muted-foreground">{station.stationType}</div>
                              {station.isFeatured && (
                                <Badge variant="secondary" className="mt-1">
                                  <Star className="w-3 h-3 mr-1" />
                                  Featured
                                </Badge>
                              )}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{station.networkOperator}</div>
                            <div className="text-sm text-muted-foreground">{station.contact.phone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{station.city}, {station.state}</div>
                            <div className="text-sm text-muted-foreground">{station.address}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {(() => {
                              const IconComponent = getStatusIcon(station.availabilityStatus);
                              return <IconComponent className={`w-4 h-4 ${getStatusBadgeColor(station.availabilityStatus).split(' ')[0]}`} />;
                            })()}
                            <Badge className={getStatusBadgeColor(station.availabilityStatus)}>
                              {station.availabilityStatus.charAt(0).toUpperCase() + station.availabilityStatus.slice(1).replace('_', ' ')}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={getVerificationBadgeColor(station.verificationStatus)}>
                            {station.verificationStatus.charAt(0).toUpperCase() + station.verificationStatus.slice(1)}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{station.numberOfChargers}</div>
                          <div className="text-sm text-muted-foreground">
                            {station.chargerTypes.join(', ')}
                          </div>
                        </TableCell>
                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" className="h-8 w-8 p-0">
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canEditSpots && (
                                <>
                                  <DropdownMenuItem>
                                    <Edit className="w-4 h-4 mr-2" />
                                    Edit Station
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(station.id, 'active')}
                                    disabled={station.availabilityStatus === 'active' || actionLoading}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Set Active
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(station.id, 'maintenance')}
                                    disabled={station.availabilityStatus === 'maintenance' || actionLoading}
                                  >
                                    <AlertTriangle className="w-4 h-4 mr-2" />
                                    Set Maintenance
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(station.id, 'inactive')}
                                    disabled={station.availabilityStatus === 'inactive' || actionLoading}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Set Inactive
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleVerificationChange(station.id, 'verified')}
                                    disabled={station.verificationStatus === 'verified' || actionLoading}
                                  >
                                    <Shield className="w-4 h-4 mr-2" />
                                    Verify Station
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleVerificationChange(station.id, 'pending')}
                                    disabled={station.verificationStatus === 'pending' || actionLoading}
                                  >
                                    <Clock className="w-4 h-4 mr-2" />
                                    Set Pending
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {canDeleteSpots && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedStation(station);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Station
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Network Station</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedStation?.stationName}"? This action cannot be undone and will remove all associated data including charging history and maintenance records.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteStation}
              className="bg-destructive text-destructive-foreground"
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import Dialog */}
      <Dialog open={importDialogOpen} onOpenChange={setImportDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Import Network Stations</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import multiple network charging stations at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* File Upload */}
            <div className="border-2 border-dashed border-border rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <div className="space-y-2">
                <div className="text-lg font-medium">Choose a file to import</div>
                <div className="text-sm text-muted-foreground">
                  Supports CSV and Excel files (.xlsx, .xls)
                </div>
                <input
                  type="file"
                  accept=".csv,.xlsx,.xls"
                  onChange={handleFileSelect}
                  className="hidden"
                  id="file-upload"
                />
                <Button variant="outline" onClick={() => document.getElementById('file-upload')?.click()}>
                  <Upload className="w-4 h-4 mr-2" />
                  Select File
                </Button>
              </div>
              {selectedFile && (
                <div className="mt-4 p-3 bg-muted rounded-lg">
                  <div className="text-sm font-medium">Selected file:</div>
                  <div className="text-sm text-muted-foreground">{selectedFile.name}</div>
                </div>
              )}
            </div>

            {/* Preview */}
            {importPreview.length > 0 && (
              <div className="space-y-4">
                <div className="text-lg font-medium">Import Preview</div>
                <div className="border rounded-lg overflow-hidden">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Station Name</TableHead>
                        <TableHead>Department</TableHead>
                        <TableHead>City</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Chargers</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {importPreview.map((station, index) => (
                        <TableRow key={index}>
                          <TableCell>{station.stationName}</TableCell>
                          <TableCell>{station.networkOperator}</TableCell>
                          <TableCell>{station.city}</TableCell>
                          <TableCell>{station.availabilityStatus}</TableCell>
                          <TableCell>{station.numberOfChargers}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                <div className="text-sm text-muted-foreground">
                  Preview shows first {importPreview.length} rows from the file.
                </div>
              </div>
            )}

            {/* Import Result */}
            {importResult && (
              <div className="space-y-4">
                <div className="text-lg font-medium">Import Result</div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{importResult.success}</div>
                    <div className="text-sm text-green-600">Successfully imported</div>
                  </div>
                  <div className="text-center p-4 bg-red-50 rounded-lg">
                    <div className="text-2xl font-bold text-red-600">{importResult.failed}</div>
                    <div className="text-sm text-red-600">Failed to import</div>
                  </div>
                  <div className="text-center p-4 bg-yellow-50 rounded-lg">
                    <div className="text-2xl font-bold text-yellow-600">{importResult.skipped}</div>
                    <div className="text-sm text-yellow-600">Skipped (duplicates)</div>
                  </div>
                </div>
                {Array.isArray(importResult.errors) && importResult.errors.length > 0 && (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {importResult.errors.slice(0, 50).map((err: any, idx: number) => (
                      <div key={idx} className="text-sm p-3 bg-red-50 border border-red-200 rounded-md text-red-800">
                        <span className="font-semibold">Row {err.row ?? '?'}:</span> {err.message || err}
                        {err.field ? ` (${err.field})` : ''}
                        {err.data?.stationName ? ` — "${err.data.stationName}"` : ''}
                      </div>
                    ))}
                    {importResult.errors.length > 50 && (
                      <div className="text-sm text-muted-foreground">…and {importResult.errors.length - 50} more errors</div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setImportDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedFile || importPreview.length === 0 || actionLoading}
              >
                {actionLoading ? 'Importing...' : 'Import Stations'}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Station Modal */}
      <AddStationModal
        isOpen={addStationModalOpen}
        onClose={() => setAddStationModalOpen(false)}
        onSuccess={handleStationCreated}
      />
    </div>
  );
};

export default AdminNetworkStationsPage;
