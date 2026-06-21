import React, { useState, useEffect } from 'react';
import ResponsiveContainer from '@/components/ui/responsive-container';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Search,
  Filter,
  MoreHorizontal,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  Zap,
  User,
  Calendar,
  MapPin,
  Phone,
  Mail,
  X
} from 'lucide-react';
import SEO from "@/components/SEO";
import { useAdminPermissions } from '@/hooks/useAdminAuth';
import { ChargingRequest } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import {
  adminGetAllRequests,
  adminSearchRequests,
  adminUpdateRequestStatus,
  adminDeleteRequest
} from '@/services/adminService';

const AdminRequestsPage: React.FC = () => {
  const { canManageRequests, canApproveRequests, canRejectRequests } = useAdminPermissions();
  const [requests, setRequests] = useState<ChargingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<ChargingRequest | null>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [selectedAction, setSelectedAction] = useState<'approved' | 'rejected' | null>(null);
  const [actionMessage, setActionMessage] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | ChargingRequest['status']>('all');
  const [error, setError] = useState<string>('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!canManageRequests) return;
    fetchRequests();
  }, [canManageRequests]);

  const fetchRequests = async () => {
    try {
      setLoading(true);
      setError('');
      const fetchedRequests = await adminGetAllRequests();
      setRequests(fetchedRequests);
    } catch (error) {
      console.error('Error fetching requests:', error);
      setError(error instanceof Error ? error.message : 'Failed to fetch charging requests');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchTerm.trim()) {
      fetchRequests();
      return;
    }

    try {
      setLoading(true);
      setError('');
      const searchedRequests = await adminSearchRequests(searchTerm);
      setRequests(searchedRequests);
    } catch (error) {
      console.error('Error searching requests:', error);
      setError(error instanceof Error ? error.message : 'Failed to search requests');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (searchTerm.trim()) {
        handleSearch();
      } else {
        fetchRequests();
      }
    }, 500); // Debounce search

    return () => clearTimeout(timeoutId);
  }, [searchTerm]);

  const filteredRequests = requests.filter(request => {
    const matchesStatus = statusFilter === 'all' || request.status === statusFilter;
    return matchesStatus;
  });

  const handleRequestAction = async () => {
    if (!selectedRequest || !selectedAction) return;

    try {
      setActionLoading(true);
      setError('');
      await adminUpdateRequestStatus(
        selectedRequest.userId,
        selectedRequest.id,
        selectedAction,
        actionMessage
      );
      setRequests(requests.map(req =>
        req.id === selectedRequest.id
          ? {
            ...req,
            status: selectedAction,
            response: {
              text: actionMessage,
              respondedAt: new Date(),
              respondedBy: 'Admin',
            }
          }
          : req
      ));
      setActionDialogOpen(false);
      setSelectedRequest(null);
      setSelectedAction(null);
      setActionMessage('');
    } catch (error) {
      console.error('Error updating request:', error);
      setError(error instanceof Error ? error.message : 'Failed to update request status');
    } finally {
      setActionLoading(false);
    }
  };

  const getStatusBadgeColor = (status: ChargingRequest['status']) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'completed':
        return 'bg-blue-100 text-blue-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'no_show':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-yellow-100 text-yellow-800';
    }
  };

  const getStatusIcon = (status: ChargingRequest['status']) => {
    switch (status) {
      case 'approved':
        return CheckCircle;
      case 'rejected':
        return XCircle;
      case 'completed':
        return CheckCircle;
      case 'cancelled':
        return XCircle;
      case 'no_show':
        return Clock;
      default:
        return Clock;
    }
  };

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short'
    }).format(date);
  };

  if (!canManageRequests) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Zap className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to manage charging requests.</p>
        </div>
      </div>
    );
  }

  return (
    <ResponsiveContainer size="xl" className="py-6">
      <SEO 
        title="Manage Requests | Admin | VoltSetu"
        description="Process and respond to EV charging session requests from users across the platform."
        noindex={true}
      />
      <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Charging Requests</h1>
          <p className="text-muted-foreground">Manage and respond to charging requests</p>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 text-destructive">
              <Zap className="w-4 h-4" />
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
                  placeholder="Search requests by user, email, or message..."
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
                variant={statusFilter === 'pending' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('pending')}
              >
                Pending
              </Button>
              <Button
                variant={statusFilter === 'approved' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('approved')}
              >
                Approved
              </Button>
              <Button
                variant={statusFilter === 'rejected' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter('rejected')}
              >
                Rejected
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Requests Table */}
      <Card>
        <CardHeader>
          <CardTitle>Charging Requests ({filteredRequests.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <p className="ml-4 text-muted-foreground">Loading charging requests...</p>
            </div>
          ) : filteredRequests.length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">No charging requests found</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'Try adjusting your search terms' : 'No charging requests match the current filter'}
              </p>
            </div>
          ) : (
              <div className="responsive-table">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>User</TableHead>
                      <TableHead>Request Details</TableHead>
                      <TableHead>Scheduled</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredRequests.map((request) => (
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="font-medium">{request.userName}</div>
                            <div className="text-sm text-muted-foreground">{request.userEmail}</div>
                            <div className="text-sm text-muted-foreground">{request.userPhone}</div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="flex items-center gap-1">
                              <Clock className="w-3 h-3 text-muted-foreground" />
                              <span className="text-sm">{request.duration} minutes</span>
                            </div>
                            {request.message && (
                              <div className="text-sm text-muted-foreground max-w-xs truncate">
                                {request.message}
                              </div>
                            )}
                            {request.feedback && (
                              <div className="flex items-center gap-1">
                                <span className="text-xs text-muted-foreground">Rating: {request.feedback.rating}/5</span>
                                <span className="text-xs text-green-600">+{request.feedback.wattsEarned} watts</span>
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            <div className="text-sm font-medium">
                              {formatDateTime(request.requestedTime)}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              Requested: {formatDateTime(request.requestedAt)}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {React.createElement(getStatusIcon(request.status || 'pending'), {
                              className: `w-4 h-4 ${getStatusBadgeColor(request.status || 'pending').split(' ')[0]}`
                            })}
                            <Badge className={getStatusBadgeColor(request.status || 'pending')}>
                              {request.status ? request.status.charAt(0).toUpperCase() + request.status.slice(1).replace('_', ' ') : 'Unknown'}
                            </Badge>
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
                              {request.status === 'pending' && (
                                <>
                                  <DropdownMenuSeparator />
                                  {canApproveRequests && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedRequest(request);
                                        setSelectedAction('approved');
                                        setActionMessage('Your request has been approved.');
                                        setActionDialogOpen(true);
                                      }}
                                    >
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Approve
                                    </DropdownMenuItem>
                                  )}
                                  {canRejectRequests && (
                                    <DropdownMenuItem
                                      onClick={() => {
                                        setSelectedRequest(request);
                                        setSelectedAction('rejected');
                                        setActionMessage('Sorry, your request cannot be accommodated.');
                                        setActionDialogOpen(true);
                                      }}
                                    >
                                      <XCircle className="w-4 h-4 mr-2" />
                                      Reject
                                    </DropdownMenuItem>
                                  )}
                                </>
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

      {/* Action Dialog */}
      <AlertDialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>
              {selectedAction === 'approved' ? 'Approve Request' : 'Reject Request'}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {selectedAction === 'approved'
                ? 'Approve this charging request. You can add a message for the user.'
                : 'Reject this charging request. Please provide a reason for the rejection.'
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">Response Message</label>
              <Textarea
                placeholder="Enter your response message..."
                value={actionMessage}
                onChange={(e) => setActionMessage(e.target.value)}
                rows={3}
              />
            </div>
            {selectedRequest && (
              <div className="p-3 bg-muted rounded-lg text-sm">
                <div className="font-medium mb-1">Request Details:</div>
                <div>User: {selectedRequest.userName}</div>
                <div>Duration: {selectedRequest.duration} minutes</div>
                <div>Scheduled: {formatDateTime(selectedRequest.requestedTime)}</div>
              </div>
            )}
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleRequestAction} disabled={actionLoading}>
              {actionLoading ? 'Processing...' : (selectedAction === 'approved' ? 'Approve' : 'Reject')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      </div>
    </ResponsiveContainer>
  );
};

export default AdminRequestsPage;
