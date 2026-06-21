import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Activity,
  Users,
  MapPin,
  Zap,
  DollarSign,
  Calendar,
  Download,
  RefreshCw,
  Eye,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { useAdminPermissions } from '@/hooks/useAdminAuth';
import {
  adminGetSystemStats,
  adminGetTopSpots,
  adminGetRecentActivity
} from '@/services/adminService';
import SEO from "@/components/SEO";

interface AnalyticsData {
  totalUsers: number;
  totalSpots: number;
  totalRequests: number;
  totalRevenue: number;
  activeUsers: number;
  pendingRequests: number;
  completedRequests: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  monthlyGrowth: {
    users: number;
    spots: number;
    requests: number;
    revenue: number;
  };
  topSpots: Array<{
    id: string;
    name: string;
    requests: number;
    revenue: number;
    rating: number;
  }>;
  recentActivity: Array<{
    id: string;
    type: 'user' | 'spot' | 'request';
    action: string;
    timestamp: string;
    user: string;
  }>;
}

const AdminAnalyticsPage: React.FC = () => {
  const { canViewAnalytics } = useAdminPermissions();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>('');
  const [selectedPeriod, setSelectedPeriod] = useState<'7d' | '30d' | '90d'>('30d');

  useEffect(() => {
    if (!canViewAnalytics) return;
    fetchAnalyticsData();
  }, [canViewAnalytics, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');

      const [systemStats, topSpotsData, recentActivityData] = await Promise.all([
        adminGetSystemStats(),
        adminGetTopSpots(10),
        adminGetRecentActivity(20),
      ]);

      // Calculate monthly growth (simplified - in real implementation, this would be based on historical data)
      const monthlyGrowth = {
        users: 12.5,
        spots: 8.3,
        requests: 23.7,
        revenue: 15.2,
      };

      setData({
        ...systemStats,
        monthlyGrowth,
        topSpots: topSpotsData,
        recentActivity: recentActivityData,
      });
    } catch (err) {
      console.error('Error fetching analytics data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch analytics data');
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

  const getHealthStatusColor = (health: string) => {
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
  };

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

  if (!canViewAnalytics) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Access Denied</h2>
          <p className="text-muted-foreground">You don't have permission to view analytics.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        <p className="mt-4 text-muted-foreground">Loading analytics data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Error Loading Data</h2>
          <p className="text-muted-foreground">{error}</p>
          <Button onClick={fetchAnalyticsData} className="mt-4">
            <Activity className="w-4 h-4 mr-2" />
            Retry
          </Button>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <BarChart3 className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">No Data Available</h2>
          <p className="text-muted-foreground">Analytics data is not available.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <SEO 
        title="Admin Analytics | ChargeNest"
        description="Detailed system performance metrics and analytics for ChargeNest administrators."
        noindex={true}
      />
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">System performance and insights</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <Button
                key={period}
                variant={selectedPeriod === period ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setSelectedPeriod(period)}
              >
                {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button size="sm" onClick={fetchAnalyticsData}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalUsers.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.monthlyGrowth.users > 0 ? (
                <>
                  <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-green-500">+{data.monthlyGrowth.users}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 mr-1 text-red-500" />
                  <span className="text-red-500">{data.monthlyGrowth.users}%</span>
                </>
              )}
              <span className="ml-1">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Charging Spots</CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalSpots.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.monthlyGrowth.spots > 0 ? (
                <>
                  <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-green-500">+{data.monthlyGrowth.spots}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 mr-1 text-red-500" />
                  <span className="text-red-500">{data.monthlyGrowth.spots}%</span>
                </>
              )}
              <span className="ml-1">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Requests</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{data.totalRequests.toLocaleString()}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.monthlyGrowth.requests > 0 ? (
                <>
                  <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-green-500">+{data.monthlyGrowth.requests}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 mr-1 text-red-500" />
                  <span className="text-red-500">{data.monthlyGrowth.requests}%</span>
                </>
              )}
              <span className="ml-1">this month</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{formatCurrency(data.totalRevenue)}</div>
            <div className="flex items-center text-xs text-muted-foreground">
              {data.monthlyGrowth.revenue > 0 ? (
                <>
                  <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
                  <span className="text-green-500">+{data.monthlyGrowth.revenue}%</span>
                </>
              ) : (
                <>
                  <ArrowDownRight className="w-3 h-3 mr-1 text-red-500" />
                  <span className="text-red-500">{data.monthlyGrowth.revenue}%</span>
                </>
              )}
              <span className="ml-1">this month</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.activeUsers.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Currently active</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Requests</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.pendingRequests}</div>
            <div className="text-xs text-muted-foreground">Awaiting approval</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">System Health</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <Badge className={getHealthStatusColor(data.systemHealth)}>
              {data.systemHealth.charAt(0).toUpperCase() + data.systemHealth.slice(1)}
            </Badge>
            <div className="text-xs text-muted-foreground mt-2">All systems operational</div>
          </CardContent>
        </Card>
      </div>

      {/* Top Performing Spots */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">Top Performing Spots</CardTitle>
        </CardHeader>
        <CardContent>
          {data.topSpots.length > 0 ? (
            <div className="space-y-4">
              {data.topSpots.map((spot, index) => (
                <div key={spot.id} className="flex items-center gap-4 p-3 rounded-lg border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium">{spot.name}</div>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>{spot.requests} requests</span>
                      <span>{formatCurrency(spot.revenue)}</span>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-500 fill-current" />
                        <span>{spot.rating.toFixed(1)}</span>
                      </div>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm">
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
          {data.recentActivity.length > 0 ? (
            <div className="space-y-4">
              {data.recentActivity.map((activity) => (
                <div key={activity.id} className="flex items-center gap-3 p-3 rounded-lg border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    {React.createElement(getActivityIcon(activity.type), {
                      className: "w-4 h-4 text-primary"
                    })}
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
  );
};

export default AdminAnalyticsPage;
