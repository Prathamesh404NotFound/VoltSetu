import React, { useState, useEffect } from 'react';
import ResponsiveContainer from '@/components/ui/responsive-container';
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
  X
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminAuth';
import { ChargingSpot } from '@/types';
import AddSpotModal from '@/components/Admin/AddSpotModal';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  adminGetAllSpots,
  adminUpdateSpotStatus,
  adminDeleteSpot,
  adminSearchSpots,
} from '@/services/adminService';
import { toast } from 'sonner';
import ResponsiveContainer from '@/components/ui/responsive-container';
import ResponsiveGrid from '@/components/ui/responsive-grid';

const AdminSpotsPage: React.FC = () => {
  const { canManageSpots, canEditSpots, canDeleteSpots } = useAdminPermissions();
  const [spots, setSpots] = useState<ChargingSpot[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSpot, setSelectedSpot] = useState<ChargingSpot | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<'all' | ChargingSpot['status']>('all');
  const [error, setError] = useState<string>('');
  const [addSpotModalOpen, setAddSpotModalOpen] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!canManageSpots) return;
    fetchSpots();
  }, [canManageSpots]);

  const fetchSpots = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await adminGetAllSpots();
      setSpots(data);
    } catch (err) {
      console.error('Error fetching spots:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch spots');
    } finally {
      setLoading(false);
    }
  };

  const handleSpotCreated = (newSpot: ChargingSpot) => {
    setSpots(prev => [newSpot, ...prev]);
    setAddSpotModalOpen(false);
    toast.success('Spot created successfully!');
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchSpots();
      return;
    }

    try {
      setLoading(true);
      setError('');
      const searchedSpots = await adminSearchSpots(searchTerm);
      setSpots(searchedSpots);
    } catch (error) {
      console.error('Error searching spots:', error);
      setError(error instanceof Error ? error.message : 'Failed to search charging spots');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        fetchSpots();
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const filteredSpots = spots.filter(spot => {
    const matchesStatus = statusFilter === 'all' || spot.status === statusFilter;
    return matchesStatus;
  });

  const handleDeleteSpot = async () => {
    if (!selectedSpot || !canDeleteSpots) return;

    try {
      setActionLoading(true);
      setError('');
      await adminDeleteSpot(selectedSpot.id);
      setSpots(spots.filter(s => s.id !== selectedSpot.id));
      setDeleteDialogOpen(false);
      setSelectedSpot(null);
    } catch (error) {
      console.error('Error deleting spot:', error);
      setError(error instanceof Error ? error.message : 'Failed to delete charging spot');
    } finally {
      setActionLoading(false);
    }
  };

  const handleStatusChange = async (spotId: string, newStatus: ChargingSpot['status']) => {
    if (!canEditSpots) return;

    try {
      setActionLoading(true);
      setError('');
      await adminUpdateSpotStatus(spotId, newStatus);
      setSpots(spots.map(spot =>
        spot.id === spotId ? { ...spot, status: newStatus } : spot
      ));
    } catch (error) {
      console.error('Error updating spot status:', error);
      setError(error instanceof Error ? error.message : 'Failed to update spot status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: ChargingSpot['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-gray-100 text-gray-800';
      case 'suspended':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusIcon = (status: ChargingSpot['status']) => {
    switch (status) {
      case 'active':
        return CheckCircle;
      case 'pending':
        return Clock;
      case 'inactive':
        return XCircle;
      case 'suspended':
        return XCircle;
      default:
        return MapPin;
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

  if (!canManageSpots) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <MapPin className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to manage charging spots.</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer size="xl" className="py-6">
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Charging Spots</h1>
          <p className="text-muted-foreground">Manage charging locations and availability</p>
        </div>
        <Button onClick={() => setAddSpotModalOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Spot
        </Button>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <MapPin className="w-4 h-4" />
              <span>{error}</span>
              <Button variant="ghost" size="sm" onClick={() => setError('')}>
                <X className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search spots by name, host, or address..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button
                variant={statusFilter === 'all' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('all')}
              >
                All
              </Button>
              <Button
                variant={statusFilter === 'active' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('active')}
              >
                Active
              </Button>
              <Button
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'inactive' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('inactive')}
              >
                Inactive
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Spots Table */}
      <Card>
        <CardHeader>
          <CardTitle>Charging Spots ({filteredSpots.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-4 text-muted-foreground">Loading charging spots...</p>
            </div>
          ) : filteredSpots.length === 0 ? (
            <div className="text-center py-12">
              <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No charging spots found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'No charging spots match the current filter'}
              </p>
            </div>
          ) : (
              <div className="responsive-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Spot</TableHead>
                      <TableHead>Host</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredSpots.map((spot) => (
                      <TableRow key={spot.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-primary/10 overflow-hidden">
                              {spot.photos && spot.photos.length > 0 ? (
                                <img
                                  src={spot.photos[0]}
                                  alt={spot.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <MapPin className="w-full h-full p-3 text-primary" />
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium">{spot.name}</div>
                              <div className="text-sm text-muted-foreground truncate">
                                {spot.address}, {spot.city}
                              </div>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{spot.hostName}</div>
                            <div className="text-sm text-muted-foreground">{spot.hostEmail}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {React.createElement(getStatusIcon(spot.status), {
                              className: `w-4 h-4 ${getStatusBadgeColor(spot.status).split(' ')[0]}`
                            })}
                            <Badge className={getStatusBadgeColor(spot.status)}>
                              {spot.status.charAt(0).toUpperCase() + spot.status.slice(1)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="font-medium">{formatCurrency(spot.pricePerHour)}/hr</div>
                          {spot.pricePerMinute && (
                            <div className="text-sm text-muted-foreground">
                              {formatCurrency(spot.pricePerMinute)}/min
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-medium">{spot.rating.toFixed(1)}</span>
                            <span className="text-sm text-muted-foreground">
                              ({spot.reviews ? spot.reviews.length : 0} reviews)
                            </span>
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
                                    Edit Spot
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(spot.id, 'active')}
                                    disabled={spot.status === 'active' || actionLoading}
                                  >
                                    <CheckCircle className="w-4 h-4 mr-2" />
                                    Make Active
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(spot.id, 'inactive')}
                                    disabled={spot.status === 'inactive' || actionLoading}
                                  >
                                    <XCircle className="w-4 h-4 mr-2" />
                                    Make Inactive
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    onClick={() => handleStatusChange(spot.id, 'suspended')}
                                    disabled={spot.status === 'suspended' || actionLoading}
                                  >
                                    <Ban className="w-4 h-4 mr-2" />
                                    Suspend
                                  </DropdownMenuItem>
                                  <DropdownMenuSeparator />
                                </>
                              )}
                              {canDeleteSpots && (
                                <DropdownMenuItem
                                  className="text-destructive"
                                  onClick={() => {
                                    setSelectedSpot(spot);
                                    setDeleteDialogOpen(true);
                                  }}
                                >
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Delete Spot
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
            <AlertDialogTitle>Delete Charging Spot</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedSpot?.name}"? This action cannot be undone and will remove all associated data including charging history and reviews.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteSpot}
              className="bg-destructive text-destructive-foreground"
              disabled={actionLoading}
            >
              {actionLoading ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Spot Modal */}
      <AddSpotModal
        isOpen={addSpotModalOpen}
        onClose={() => setAddSpotModalOpen(false)}
        onSuccess={handleSpotCreated}
      />
      </div>
    </ResponsiveContainer>
  );
};

export default AdminSpotsPage;
