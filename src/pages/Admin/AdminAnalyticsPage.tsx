import React, { useState, useEffect, useMemo } from 'react';
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
  RefreshCw,
  Eye,
  Clock,
  Star,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  PhoneCall,
  CreditCard
} from 'lucide-react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { useAdminPermissions } from '@/hooks/useAdminAuth';
import {
  adminGetSystemStats,
  adminGetTopSpots,
  adminGetRecentActivity,
  adminGetBookingTimeline,
  adminGetStatusFunnel,
  adminGetCityBreakdown,
  adminGetDepositsSummary
} from '@/services/adminService';
import SEO from '@/components/SEO';

interface AnalyticsData {
  totalUsers: number;
  totalSpots: number;
  totalRequests: number;
  totalRevenue: number;
  activeUsers: number;
  pendingRequests: number;
  completedRequests: number;
  systemHealth: 'healthy' | 'warning' | 'critical';
  growth: { users: number; requests: number; revenue: number };
  timeline: Array<{
    date: string;
    bookings: number;
    completed: number;
    rejected: number;
    revenue: number;
    emergencyBookings: number;
    newUsers: number;
  }>;
  funnel: {
    pending: number;
    approved: number;
    completed: number;
    cancelled: number;
    rejected: number;
    emergency: number;
    paidDeposits: number;
    conversionRate: number;
  };
  cities: Array<{ city: string; bookings: number; completed: number; revenue: number; spots: number }>;
  deposits: { collected: number; pending: number; failed: number; emergencyBookings: number };
  topSpots: Array<{ id: string; name: string; requests: number; revenue: number; rating: number }>;
  recentActivity: Array<{
    id: string;
    type: 'user' | 'spot' | 'request';
    action: string;
    timestamp: string;
    user: string;
  }>;
}

type Period = '7d' | '30d' | '90d';

const PERIOD_DAYS: Record<Period, number> = { '7d': 7, '30d': 30, '90d': 90 };

const AdminAnalyticsPage: React.FC = () => {
  const { canViewAnalytics } = useAdminPermissions();
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedPeriod, setSelectedPeriod] = useState<Period>('30d');

  useEffect(() => {
    if (!canViewAnalytics) return;
    fetchAnalyticsData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [canViewAnalytics, selectedPeriod]);

  const fetchAnalyticsData = async () => {
    try {
      setLoading(true);
      setError('');

      const [systemStats, topSpotsData, recentActivityData, timeline, funnel, cities, deposits] = await Promise.all([
        adminGetSystemStats(),
        adminGetTopSpots(10),
        adminGetRecentActivity(20),
        adminGetBookingTimeline(selectedPeriod),
        adminGetStatusFunnel(),
        adminGetCityBreakdown(),
        adminGetDepositsSummary(),
      ]);

      // Real period-over-period growth computed from the live timeline.
      // Split the timeline into first/second half and compare totals.
      const half = Math.max(1, Math.floor(timeline.length / 2));
      const first = timeline.slice(0, half);
      const second = timeline.slice(half);
      const sum = (arr: typeof timeline, key: 'bookings' | 'revenue' | 'newUsers') =>
        arr.reduce((acc, row) => acc + row[key], 0);
      const growth = (key: 'bookings' | 'revenue' | 'newUsers') => {
        const base = sum(first, key);
        const recent = sum(second, key);
        if (base <= 0) return recent > 0 ? 100 : 0;
        return Math.round(((recent - base) / base) * 1000) / 10;
      };

      setData({
        ...systemStats,
        growth: { users: growth('newUsers'), requests: growth('bookings'), revenue: growth('revenue') },
        timeline,
        funnel,
        cities,
        deposits,
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

  const formatCurrency = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

  const formatTimeAgo = (timestamp: string) => {
    const diffInMinutes = Math.floor((Date.now() - new Date(timestamp).getTime()) / (1000 * 60));
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  const getHealthStatusColor = (health: string) =>
    health === 'healthy' ? 'text-green-600 bg-green-50' : health === 'warning' ? 'text-yellow-600 bg-yellow-50' : 'text-red-600 bg-red-50';

  const getActivityIcon = (type: string) => (type === 'user' ? Users : type === 'spot' ? MapPin : type === 'request' ? Zap : Activity);

  const periodLabel: Record<Period, string> = { '7d': '7 Days', '30d': '30 Days', '90d': '90 Days' };

  const exportCsv = () => {
    if (!data) return;
    const rows = [['date', 'bookings', 'completed', 'rejected', 'revenue', 'emergency', 'new_users']];
    data.timeline.forEach((row) =>
      rows.push([row.date, String(row.bookings), String(row.completed), String(row.rejected), String(row.revenue), String(row.emergencyBookings), String(row.newUsers)])
    );
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chargepush-analytics-${selectedPeriod}-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
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

  const kpiGrowth = (value: number, label: string) =>
    value > 0 ? (
      <>
        <ArrowUpRight className="w-3 h-3 mr-1 text-green-500" />
        <span className="text-green-500">+{value}%</span>
      </>
    ) : value < 0 ? (
      <>
        <ArrowDownRight className="w-3 h-3 mr-1 text-red-500" />
        <span className="text-red-500">{value}%</span>
      </>
    ) : (
      <span className="text-muted-foreground">— flat {label}</span>
    );

  return (
    <div className="space-y-6 p-6">
      <SEO title="Admin Analytics | ChargePush" description="Detailed system performance metrics and analytics for ChargePush administrators." noindex={true} />

      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Live booking funnel, revenue and growth for the last {periodLabel[selectedPeriod].toLowerCase()}</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-muted rounded-lg p-1">
            {(['7d', '30d', '90d'] as const).map((period) => (
              <Button key={period} variant={selectedPeriod === period ? 'default' : 'ghost'} size="sm" onClick={() => setSelectedPeriod(period)}>
                {period === '7d' ? '7 Days' : period === '30d' ? '30 Days' : '90 Days'}
              </Button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={exportCsv}>
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
              {kpiGrowth(data.growth.users, 'period')}
              <span className="ml-1">vs previous half</span>
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
            <div className="text-xs text-muted-foreground">{data.totalSpots > 0 ? 'live in the marketplace' : 'no spots yet'}</div>
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
              {kpiGrowth(data.growth.requests, 'period')}
              <span className="ml-1">vs previous half</span>
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
              {kpiGrowth(data.growth.revenue, 'period')}
              <span className="ml-1">vs previous half</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Secondary Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.activeUsers.toLocaleString()}</div>
            <div className="text-xs text-muted-foreground">Logged in within 24 hours</div>
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
            <CardTitle className="text-sm font-medium">Roadside Rescues</CardTitle>
            <PhoneCall className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-xl font-bold">{data.funnel.emergency}</div>
            <div className="text-xs text-muted-foreground">Emergency bookings all-time</div>
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

      {/* Booking & Revenue Timeline */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg font-semibold">Bookings & Revenue</CardTitle>
            <p className="text-sm text-muted-foreground">
              {selectedPeriod === '7d' ? 'Daily' : 'Weekly'} view — {periodLabel[selectedPeriod].toLowerCase()}
            </p>
          </div>
          <Badge variant="outline" className="text-xs">{data.timeline.filter((r) => r.revenue > 0).length} earning {data.timeline.filter((r) => r.revenue > 0).length === 1 ? 'period' : 'periods'}</Badge>
        </CardHeader>
        <CardContent>
          {data.timeline.some((r) => r.bookings > 0 || r.revenue > 0) ? (
            <ResponsiveContainer width="100%" height={320}>
              <ComposedChart data={data.timeline} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.6)" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={(v: string) => v.slice(5)} />
                <YAxis yAxisId="left" tick={{ fontSize: 11 }} />
                <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <Tooltip
                  formatter={(value: any, name: string) => (name === 'Revenue' ? `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : value)}
                  labelFormatter={(label) => `Period: ${label}`}
                />
                <Legend />
                <Bar yAxisId="left" dataKey="bookings" name="Bookings" fill="hsl(var(--primary))" opacity={0.85} radius={[3, 3, 0, 0]} />
                <Bar yAxisId="left" dataKey="completed" name="Completed" fill="#16a34a" radius={[3, 3, 0, 0]} />
                <Line yAxisId="right" type="monotone" dataKey="revenue" name="Revenue" stroke="#f59e0b" strokeWidth={2} dot={false} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <BarChart3 className="w-8 h-8 mx-auto mb-4" />
              <p>No bookings recorded in the selected period yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Status Funnel + Deposits */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Booking Funnel</CardTitle>
            <p className="text-sm text-muted-foreground">How requests flow from pending to completed</p>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              {[
                { label: 'Pending', value: data.funnel.pending, cls: 'text-yellow-600 bg-yellow-50' },
                { label: 'Approved', value: data.funnel.approved, cls: 'text-blue-600 bg-blue-50' },
                { label: 'Completed', value: data.funnel.completed, cls: 'text-green-600 bg-green-50' },
                { label: 'Cancelled', value: data.funnel.cancelled, cls: 'text-muted-foreground bg-muted' },
                { label: 'Rejected', value: data.funnel.rejected, cls: 'text-red-600 bg-red-50' }
              ].map((step) => (
                <div key={step.label} className={`rounded-lg p-4 text-center ${step.cls}`}>
                  <div className="text-2xl font-bold">{step.value}</div>
                  <div className="text-xs mt-1">{step.label}</div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-border px-4 py-3">
              <span className="text-sm font-medium">Conversion — pending → completed</span>
              <span className="text-lg font-bold">{data.funnel.conversionRate}%</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg font-semibold">Deposits (Cashfree)</CardTitle>
            <p className="text-sm text-muted-foreground">Booking deposit collection</p>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground flex items-center gap-2"><CreditCard className="w-4 h-4" /> Collected</span>
              <span className="font-semibold text-green-600">{formatCurrency(data.deposits.collected)}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Paid deposits</span>
              <span className="font-semibold">{data.funnel.paidDeposits}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Pending</span>
              <span className="font-semibold">{data.deposits.pending}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Failed</span>
              <span className="font-semibold text-red-500">{data.deposits.failed}</span>
            </div>
            <div className="flex items-center justify-between border-t border-border pt-3">
              <span className="text-sm font-medium">Emergency bookings</span>
              <span className="font-semibold">{data.deposits.emergencyBookings}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* City Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg font-semibold">City Breakdown</CardTitle>
          <p className="text-sm text-muted-foreground">Bookings, revenue and spots by city</p>
        </CardHeader>
        <CardContent>
          {data.cities.length > 0 ? (
            <ResponsiveContainer width="100%" height={Math.max(200, data.cities.length * 44)}>
              <ComposedChart data={data.cities} layout="vertical" margin={{ top: 0, right: 30, left: 10, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border) / 0.6)" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11 }} tickFormatter={(v) => `₹${v}`} />
                <YAxis type="category" dataKey="city" width={90} tick={{ fontSize: 12 }} />
                <Tooltip formatter={(value: any, name: string) => (name === 'Revenue' ? `₹${Number(value).toLocaleString('en-IN', { maximumFractionDigits: 0 })}` : value)} />
                <Legend />
                <Bar dataKey="revenue" name="Revenue" fill="hsl(var(--primary))" radius={[0, 3, 3, 0]} />
                <Bar dataKey="bookings" name="Bookings" fill="#64748b" radius={[0, 3, 3, 0]} />
                <Bar dataKey="spots" name="Spots" fill="#a8a29e" radius={[0, 3, 3, 0]} />
              </ComposedChart>
            </ResponsiveContainer>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <MapPin className="w-8 h-8 mx-auto mb-4" />
              <p>No city data available yet.</p>
            </div>
          )}
        </CardContent>
      </Card>

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
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">{index + 1}</div>
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
                  <Button variant="ghost" size="sm"><Eye className="w-4 h-4" /></Button>
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
                    {React.createElement(getActivityIcon(activity.type), { className: 'w-4 h-4 text-primary' })}
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
