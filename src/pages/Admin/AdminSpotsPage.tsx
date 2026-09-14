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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge as StatusBadge } from '@/components/ui/badge';
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
import ResponsiveGrid from '@/components/ui/responsive-grid';
import SEO from "@/components/SEO";

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
  const [editSpot, setEditSpot] = useState<ChargingSpot | null>(null);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
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
      setSpots(prev => prev.filter(s => s.id !== selectedSpot.id));
      setDeleteDialogOpen(false);
      setSelectedSpot(null);
      toast.success(`"${selectedSpot.name}" has been deleted.`);
    } catch (error) {
      console.error('Error deleting spot:', error);
      toast.error('Failed to delete the charging spot. Please try again.');
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
      toast.success(`Spot is now ${newStatus}.`);
    } catch (error) {
      console.error('Error updating spot status:', error);
      toast.error('Failed to update spot status. Please try again.');
      setError(error instanceof Error ? error.message : 'Failed to update spot status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenEdit = (spot: ChargingSpot) => {
    setEditSpot(spot);
    setAddSpotModalOpen(true);
  };

  const handleOpenDetails = (spot: ChargingSpot) => {
    setSelectedSpot(spot);
    setDetailDialogOpen(true);
  };

  const handleSpotEdited = (updated: ChargingSpot) => {
    setSpots(prev => prev.map(s => (s.id === updated.id ? updated : s)));
    setEditSpot(null);
    setAddSpotModalOpen(false);
  };

  const getStatusBadgeColor = (status: ChargingSpot['status']) => {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'inactive':
        return 'bg-muted text-muted-foreground';
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
      <SEO 
        title="Manage Charging Spots | Admin | ChargePush"
        description="Oversee all charging spots across the network, manage their status, and review performance."
        noindex={true}
      />
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Charging Spots</h1>
          <p className="text-muted-foreground">Manage charging locations and availability</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={fetchSpots} disabled={loading} aria-label="Refresh spots">
            <svg className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
              <path d="M21 3v5h-5" />
            </svg>
            Refresh
          </Button>
          <Button onClick={() => setAddSpotModalOpen(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Add Spot
          </Button>
        </div>
      </div>

      {/* Status and verification summary */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Active', count: spots.filter(s => s.status === 'active').length, accent: 'bg-green-50 text-green-700' },
          { label: 'Pending', count: spots.filter(s => s.status === 'pending').length, accent: 'bg-yellow-50 text-yellow-700' },
          { label: 'Verified', count: spots.filter(s => s.isVerified).length, accent: 'bg-primary/10 text-primary' },
          { label: 'Total', count: spots.length, accent: 'bg-muted text-muted-foreground' },
        ].map(({ label, count, accent }) => (
          <div key={label} className="flex items-center justify-between rounded-xl border border-border bg-card px-4 py-3">
            <span className="text-sm font-medium text-muted-foreground">{label}</span>
            <span className={`text-lg font-bold rounded-lg px-2 py-0.5 ${accent}`}>{count}</span>
          </div>
        ))}
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
                              <DropdownMenuItem onClick={() => handleOpenDetails(spot)}>
                                <Eye className="w-4 h-4 mr-2" />
                                View Details
                              </DropdownMenuItem>
                              {canEditSpots && (
                                <>
                                  <DropdownMenuItem onClick={() => handleOpenEdit(spot)}>
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

      {/* Spot Details Dialog */}
      <Dialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {selectedSpot?.name ?? 'Charging Spot'}
              {selectedSpot?.status && (
                <Badge className={getStatusBadgeColor(selectedSpot.status)}>
                  {selectedSpot.status}
                </Badge>
              )}
            </DialogTitle>
            {selectedSpot?.description && (
              <DialogDescription className="text-sm">{selectedSpot.description}</DialogDescription>
            )}
          </DialogHeader>

          {selectedSpot && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <DetailItem icon={MapPin} label="Address" value={`${selectedSpot.address}, ${selectedSpot.city}, ${selectedSpot.state} - ${selectedSpot.pincode}`} />
                <DetailItem
                  icon={MapPin}
                  label="Coordinates"
                  value={`Lat ${selectedSpot.coordinates?.lat?.toFixed(5) ?? '—'}, Lng ${selectedSpot.coordinates?.lng?.toFixed(5) ?? '—'}`}
                />
                <DetailItem icon={Zap} label="Outlet Type" value={selectedSpot.outletType?.replace('_', ' ').toUpperCase() ?? '—'} />
                <DetailItem icon={Zap} label="Charging Speed" value={selectedSpot.chargingSpeed?.toUpperCase() ?? '—'} />
                <DetailItem icon={Clock} label="Available Hours" value={selectedSpot.availableHours || '—'} />
                <DetailItem icon={ImageIcon} label="Category" value={selectedSpot.category?.replace('_', ' ').toUpperCase() ?? '—'} />
                <DetailItem icon={Zap} label="Price per Hour" value={formatCurrency(selectedSpot.pricePerHour || 0)} />
                {selectedSpot.pricePerMinute ? (
                  <DetailItem icon={Zap} label="Price per Minute" value={formatCurrency(selectedSpot.pricePerMinute)} />
                ) : (
                  <DetailItem icon={Zap} label="Price per Minute" value="—" />
                )}
              </div>

              {selectedSpot.amenities?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Facilities</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedSpot.amenities
                      .filter(a => a.available)
                      .map(a => (
                        <StatusBadge key={a.id} variant="secondary" className="text-xs">
                          {a.name}
                        </StatusBadge>
                      ))}
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-muted/40 rounded-lg p-4">
                <div>
                  <p className="text-xs text-muted-foreground">Rating</p>
                  <p className="font-semibold flex items-center gap-1">
                    <Star className="w-4 h-4 text-yellow-500 fill-current" /> {selectedSpot.rating.toFixed(1)}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Reviews</p>
                  <p className="font-semibold">{selectedSpot.reviews ? selectedSpot.reviews.length : 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Total Charges</p>
                  <p className="font-semibold">{selectedSpot.totalCharges ?? 0}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Verified</p>
                  <p className="font-semibold">{selectedSpot.isVerified ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div className="text-xs text-muted-foreground space-y-1">
                <p><strong>Host:</strong> {selectedSpot.hostName} ({selectedSpot.hostEmail}){selectedSpot.hostPhone ? ` · ${selectedSpot.hostPhone}` : ''}</p>
                {selectedSpot.googleMapsLink && (
                  <a href={selectedSpot.googleMapsLink} target="_blank" rel="noopener noreferrer" className="text-primary underline break-all">
                    Open in Google Maps
                  </a>
                )}
                <p>
                  <strong>Created:</strong> {selectedSpot.createdAt ? formatDate(selectedSpot.createdAt) : '—'} · <strong>Updated:</strong> {selectedSpot.updatedAt ? formatDate(selectedSpot.updatedAt) : '—'}
                </p>
              </div>

              {selectedSpot.photos?.length > 0 && (
                <div>
                  <p className="text-sm font-medium mb-2">Photos ({selectedSpot.photos.length})</p>
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {selectedSpot.photos.map((url, i) => (
                      <img key={i} src={url} alt={`${selectedSpot.name} photo ${i + 1}`} className="w-full h-20 object-cover rounded-md" />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add / Edit Spot Modal */}
      <AddSpotModal
        isOpen={addSpotModalOpen}
        onClose={() => {
          setAddSpotModalOpen(false);
          setEditSpot(null);
        }}
        onSuccess={editSpot ? handleSpotEdited : handleSpotCreated}
        editSpot={editSpot ?? undefined}
      />
      </div>
    </ResponsiveContainer>
  );
};

const DetailItem: React.FC<{ icon: any; label: string; value: string }> = ({ icon: Icon, label, value }) => (
  <div className="flex items-start gap-2">
    <Icon className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
    <div className="min-w-0">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium break-words">{value}</p>
    </div>
  </div>
);

export default AdminSpotsPage;
