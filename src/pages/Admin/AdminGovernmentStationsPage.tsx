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
import { GovernmentChargingStation } from '@/types';
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
  adminGetAllGovernmentStations,
  adminUpdateStationStatus,
  adminUpdateVerificationStatus,
  adminDeleteGovernmentStation,
  adminSearchGovernmentStations,
  adminImportGovernmentStations,
} from '@/services/governmentStationService';
import { toast } from 'sonner';
import ResponsiveContainer from '@/components/ui/responsive-container';
import ResponsiveGrid from '@/components/ui/responsive-grid';

const AdminGovernmentStationsPage: React.FC = () => {
  const { canManageSpots, canEditSpots, canDeleteSpots } = useAdminPermissions();
  const [stations, setStations] = useState<GovernmentChargingStation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStation, setSelectedStation] = useState<GovernmentChargingStation | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | GovernmentChargingStation['availabilityStatus']>('all');
  const [verificationFilter, setVerificationFilter] = useState<'all' | GovernmentChargingStation['verificationStatus']>('all');
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
      const data = await adminGetAllGovernmentStations();
      setStations(data);
    } catch (err) {
      console.error('Error fetching stations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch government stations');
    } finally {
      setLoading(false);
    }
  };

  const handleStationCreated = (newStation: GovernmentChargingStation) => {
    setStations(prev => [newStation, ...prev]);
    setAddStationModalOpen(false);
    toast.success('Government station created successfully!');
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchStations();
      return;
    }

    try {
      setLoading(true);
      setError('');
      const searchedStations = await adminSearchGovernmentStations(searchTerm);
      setStations(searchedStations);
    } catch (error) {
      console.error('Error searching government stations:', error);
      setError(error instanceof Error ? error.message : 'Failed to search government charging stations');
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
      await adminDeleteGovernmentStation(selectedStation.id);
      setStations(stations.filter(s => s.id !== selectedStation.id));
      setDeleteDialogOpen(false);
      setSelectedStation(null);
    } catch (error) {
      console.error('Error deleting government station:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete government charging station');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (stationId: string, newStatus: GovernmentChargingStation['availabilityStatus']) => {
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

  const handleVerificationChange = async (stationId: string, newStatus: GovernmentChargingStation['verificationStatus']) => {
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

  const getStatusBadgeColor = (status: GovernmentChargingStation['availabilityStatus']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'maintenance':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'coming_soon':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getVerificationBadgeColor = (status: GovernmentChargingStation['verificationStatus']) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: GovernmentChargingStation['availabilityStatus']) => {
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
          const headers = lines[0].split(',').map(h => h.trim());

          parsedData = lines.slice(1).map((line, index) => {
            const values = line.split(',').map(v => v.trim());
            const station: any = {};

            headers.forEach((header, i) => {
              const value = values[i] || '';
              switch (header.toLowerCase()) {
                case 'stationname':
                  station.stationName = value;
                  break;
                case 'governmentdepartment':
                  station.governmentDepartment = value;
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
                  station.chargerTypes = value.split(';').map(t => t.trim()).filter(t => t);
                  break;
                case 'availabilitystatus':
                  station.availabilityStatus = value.toLowerCase() || 'active';
                  break;
                case 'priceperhour':
                  station.pricePerHour = parseFloat(value) || 0;
                  break;
                case 'phone':
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
              governmentDepartment: station.governmentDepartment || 'Unknown',
              address: station.address || 'Unknown Address',
              city: station.city || 'Unknown City',
              state: station.state || 'Unknown State',
              pincode: station.pincode || '000000',
              coordinates: { lat: station.lat || 0, lng: station.lng || 0 },
              numberOfChargers: station.numberOfChargers || 1,
              chargerTypes: station.chargerTypes || ['Type 2'],
              availabilityStatus: station.availabilityStatus || 'active',
              pricing: { pricePerHour: station.pricePerHour || 0 },
              workingHours: { weekdays: '9:00 AM - 6:00 PM', weekends: '10:00 AM - 4:00 PM' },
              contact: { phone: station.phone || '' },
              description: station.description || 'Government charging station',
              verificationStatus: 'pending',
              isFeatured: false,
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
      const result = await adminImportGovernmentStations(importPreview);
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
      'Station Name,Station Type,Government Department,Address,City,State,Pincode,Latitude,Longitude,Number of Chargers,Charger Types,Availability Status,Price per Hour,Price per Minute,Free Charging,Weekdays Hours,Weekends Hours,Holidays Hours,Contact Phone,Contact Email,Contact Website,Description,Notes,Verification Status,Is Featured',

      // Example 1: Railway Station - Active
      'Central Railway Station,Public Charging Station,Indian Railways,Platform 1,Mumbai,Maharashtra,400001,19.0760,72.8777,4,"Type 2,CCS",active,50,1,,24/7,24/7,,+91-22-23004000,info@railway.gov.in,www.railway.gov.in,Main charging station near platform 1,Located near main entrance,pending,false',

      // Example 2: Government Office - Maintenance
      'State Secretariat,Government Office,State Government,Secretariat Building,Thiruvananthapuram,Kerala,695001,8.5060,76.9726,2,"Type 2,Standard 3pin",maintenance,75,2,,9 AM - 6 PM,10 AM - 4 PM,Closed,+91-471-2320000,secretariat@kerala.gov.in,www.kerala.gov.in,Charging for government officials,Staff only access,pending,false',

      // Example 3: Educational Institution - Inactive
      'IIT Delhi Charging Hub,Educational Institution,Ministry of Education,Main Campus,New Delhi,Delhi,110016,28.5450,77.1927,6,"CCS,Type 2,CHAdeMO",inactive,40,0.5,,8 AM - 10 PM,9 AM - 9 PM,Semester break,+91-11-26591013,charging@iitd.ac.in,www.iitd.ac.in/charging,Student and faculty charging,Priority for students,verified,true',

      // Example 4: Hospital - Coming Soon
      'AIIMS Medical Center,Hospital,Ministry of Health,Main Building,New Delhi,Delhi,110029,28.5670,77.2100,8,"Type 2,CCS,Standard 3pin",coming_soon,60,0.75,,24/7,24/7,24/7,+91-11-26588500,info@aiims.edu,www.aiims.edu,Medical emergency charging priority,Available for emergency services,pending,true',

      // Example 5: Parking Area - Free Charging
      'Connaught Place Parking,Parking Area,Municipal Corporation,Inner Circle,New Delhi,Delhi,110001,28.6310,77.2090,12,"Type 2,Standard 3pin,5 Amp",active,0,,true,24/7,24/7,24/7,+91-11-23361225,parking@ndmc.gov.in,www.ndmc.gov.in,Free public parking charging,2 hour limit,verified,false',

      // Example 6: Highway Charging Station
      'NH48 Highway Station,Highway Charging,National Highway Authority,NH48 Service Area,Gurgaon,Haryana,122001,28.4595,77.0266,10,"CCS,Type 2,CHAdeMO",active,80,1.5,,24/7,24/7,24/7,+91-124-2280000,highway@nhai.gov.in,www.nhai.gov.in,Highway fast charging,Truck and car charging,verified,true',

      // Example 7: Urban Center - Complex Pricing
      'Cyber Hub Urban Center,Urban Center,Municipal Corporation,Cyber Hub,Gurgaon,Haryana,122002,28.5060,77.0840,16,"Type 2,CCS,Standard 3pin,16 Amp",active,45,0.8,,10 AM - 10 PM,10 AM - 8 PM,Closed,+91-124-4140000,cyberhub@gurgaon.gov.in,www.cyberhub.in,Business district charging,Peak hours pricing,pending,false',

      // Example 8: Rural Area - Basic Setup
      'Village Community Center,Rural Area,Panchayat,Village Square,Rural District,Maharashtra,425001,18.5204,76.8567,2,"Standard 3pin,5 Amp",active,25,0.3,,6 AM - 8 PM,7 AM - 7 PM,Closed,+91-9123456789,village@rural.gov.in,,Community charging for villagers,Free for residents,pending,false'
    ];

    // Create CSV blob
    const csvContent = templateData.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });

    // Create download link
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'government_stations_template.csv');
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
          <p className="text-muted-foreground">You don't have permission to manage government charging stations.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Government Charging Stations</h1>
          <p className="text-muted-foreground">Manage government-owned charging infrastructure</p>
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
          <CardTitle>Government Charging Stations ({filteredStations.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-4 text-muted-foreground">Loading government charging stations...</p>
            </div>
          ) : filteredStations.length === 0 ? (
            <div className="text-center py-12">
              <Building className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No government stations found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'No government stations match the current filter'}
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
                            <div className="font-medium">{station.governmentDepartment}</div>
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
            <AlertDialogTitle>Delete Government Station</AlertDialogTitle>
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
            <DialogTitle>Import Government Stations</DialogTitle>
            <DialogDescription>
              Upload a CSV or Excel file to import multiple government charging stations at once.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6">
            {/* File Upload */}
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
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
                          <TableCell>{station.governmentDepartment}</TableCell>
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

export default AdminGovernmentStationsPage;
