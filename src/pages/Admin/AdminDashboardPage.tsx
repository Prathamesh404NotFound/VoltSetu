import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Users,
  MapPin,
  Zap,
  BarChart3,
  Settings,
  Activity,
  TrendingUp,
  DollarSign,
  Eye,
  Plus,
  Clock,
  Star
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminAuth';
import { Link } from 'react-router-dom';
import ResponsiveContainer from '@/components/ui/responsive-container';
import ResponsiveGrid from '@/components/ui/responsive-grid';
import {
  adminGetSystemStats,
  adminGetTopSpots,
  adminGetRecentActivity
} from '@/services/adminService';
import SEO from "@/components/SEO";

const AdminDashboardPage: React.FC = () => {
  const { canViewAdminDashboard } = useAdminPermissions();
  const [stats, setStats] = useState<any>(null);
  const [topSpots, setTopSpots] = useState<any[]>([]);
  const [recentActivity, setRecentActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!canViewAdminDashboard) return;

    fetchDashboardData();
  }, [canViewAdminDashboard]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError('');

      const [systemStats, topSpotsData, recentActivityData] = await Promise.all([
        adminGetSystemStats(),
        adminGetTopSpots(5),
        adminGetRecentActivity(10),
      ]);

      setStats(systemStats);
      setTopSpots(topSpotsData);
      setRecentActivity(recentActivityData);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const formatDate = (date: string | Date) => {
    return new Intl.DateTimeFormat('en-IN').format(new Date(date));
  };

  const formatTimeAgo = (timestamp: string) => {
    const now = new Date();
    const time = new Date(timestamp);
    const diffInMinutes = Math.floor((now.getTime() - time.getTime()) / (1000 * 60));

    if (diffInMinutes < 60) {
      return `${diffInMinutes} minutes ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)} hours ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)} days ago`;
    }
  };

  if (!canViewAdminDashboard) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to access the admin dashboard.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchDashboardData} className="mt-4">
            <Activity className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Activity className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
          <p className="text-muted-foreground">System statistics are not available.</p>
        </div>
      </div>
    );
  }

  // Helper function for activity icon
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'user':
        return Users;
      case 'spot':
        return MapPin;
      case 'request':
        return Zap;
      default:
        return Activity;
    }
  };

  return (
    <ResponsiveContainer size="xl" className="py-6">
      <SEO 
        title="Admin Dashboard | VoltSetu"
        description="System overview, user analytics, and platform performance metrics for VoltSetu administrators."
        noindex={true}
      />
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground">Admin Dashboard</h1>
            <p className="text-muted-foreground">System overview and analytics</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm">
              <BarChart3 className="w-4 h-4 mr-2" />
              Export Report
            </Button>
            <Button size="sm" onClick={fetchDashboardData}>
              <Activity className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <ResponsiveGrid
          cols={{ default: 1, sm: 2, lg: 2, xl: 4 }}
          gap={{ default: 'gap-4', sm: 'gap-4', lg: 'gap-6', xl: 'gap-6' }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                <span className="text-green-500">Growing steadily</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Charging Spots</CardTitle>
              <MapPin className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalSpots.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                <span className="text-green-500">Growing steadily</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
              <Zap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalRequests.toLocaleString()}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                <span className="text-green-500">Growing steadily</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalRevenue)}</div>
              <div className="flex items-center text-xs text-muted-foreground">
                <TrendingUp className="w-3 h-3 mr-1 text-green-500" />
                <span className="text-green-500">Growing steadily</span>
              </div>
            </CardContent>
          </Card>
        </ResponsiveGrid>

        {/* Secondary Stats */}
        <ResponsiveGrid
          cols={{ default: 1, sm: 3 }}
          gap={{ default: 'gap-4', sm: 'gap-6' }}
        >
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Users</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stats.activeUsers.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Currently active</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold">{stats.pendingRequests.toLocaleString()}</div>
              <div className="text-xs text-muted-foreground">Awaiting approval</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">System Health</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <Badge className={getHealthStatusColor(stats.systemHealth)}>
                {stats.systemHealth.charAt(0).toUpperCase() + stats.systemHealth.slice(1)}
              </Badge>
              <div className="text-xs text-muted-foreground mt-2">All systems operational</div>
            </CardContent>
          </Card>
        </ResponsiveGrid>

        {/* Quick Actions */}
        <ResponsiveGrid
          cols={{ default: 1, sm: 2, lg: 2, xl: 4 }}
          gap={{ default: 'gap-4', sm: 'gap-4', lg: 'gap-6', xl: 'gap-6' }}
        >
          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/admin/users" className="block">
              <CardContent className="p-4 sm:p-6 text-center">
                <Users className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-4 text-primary" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Manage Users</h3>
                <p className="text-sm text-muted-foreground">View and manage user accounts</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/admin/spots" className="block">
              <CardContent className="p-4 sm:p-6 text-center">
                <MapPin className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-4 text-primary" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Manage Spots</h3>
                <p className="text-sm text-muted-foreground">Control charging locations</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/admin/requests" className="block">
              <CardContent className="p-4 sm:p-6 text-center">
                <Zap className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-4 text-primary" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">Manage Requests</h3>
                <p className="text-sm text-muted-foreground">Handle charging requests</p>
              </CardContent>
            </Link>
          </Card>

          <Card className="hover:shadow-md transition-shadow cursor-pointer">
            <Link to="/admin/analytics" className="block">
              <CardContent className="p-4 sm:p-6 text-center">
                <BarChart3 className="w-6 h-6 sm:w-8 sm:h-8 mx-auto mb-2 sm:mb-4 text-primary" />
                <h3 className="font-semibold mb-2 text-sm sm:text-base">View Analytics</h3>
                <p className="text-sm text-muted-foreground">System statistics and insights</p>
              </CardContent>
            </Link>
          </Card>
        </ResponsiveGrid>

        {/* Top Performing Spots */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Top Performing Spots</CardTitle>
          </CardHeader>
          <CardContent>
            {topSpots.length > 0 ? (
              <div className="space-y-4">
                {topSpots.map((spot, index) => (
                  <div key={spot.id} className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 p-3 rounded-lg border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium flex-shrink-0">
                      {index + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{spot.name}</div>
                      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 text-sm text-muted-foreground">
                        <span>{spot.requests} requests</span>
                        <span>{formatCurrency(spot.revenue)}</span>
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-500 fill-current" />
                          <span>{spot.rating.toFixed(1)}</span>
                        </div>
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" className="flex-shrink-0">
                      <Eye className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <MapPin className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                <p>No top performing spots available</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start sm:items-center gap-3 p-3 rounded-lg border border-border">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      {(() => {
                        const IconComponent = getActivityIcon(activity.type);
                        return <IconComponent className="w-4 h-4 text-primary" />;
                      })()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium text-sm">{activity.action}</div>
                      <div className="text-xs text-muted-foreground">
                        by {activity.user} <span className="mx-1">·</span> {formatTimeAgo(activity.timestamp)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Activity className="w-8 h-8 mx-auto mb-4 text-muted-foreground" />
                <p>No recent activity available</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </ResponsiveContainer>
  );

  // Helper function for health status color
  function getHealthStatusColor(health: string) {
    switch (health) {
      case 'healthy':
        return 'text-green-600 bg-green-50';
      case 'warning':
        return 'text-yellow-600 bg-yellow-50';
      case 'critical':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  }
};

export default AdminDashboardPage;
