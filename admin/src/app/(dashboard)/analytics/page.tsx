'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticatedFetch } from '@/contexts/AuthContext';
import { 
  TrendingUp, 
  TrendingDown,
  DollarSign, 
  ShoppingBag, 
  Users, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  BarChart2,
  PieChart,
  Activity,
  Loader2
} from 'lucide-react';
import { FeatureGuard } from '@/components/FeatureGuard';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

const API_BASE_URL = '/api';

interface MetricCard {
  title: string;
  value: string;
  change: number;
  changeLabel: string;
  icon: React.ReactNode;
  color: string;
}

interface ChartData {
  label: string;
  value: number;
  percentage?: number;
}

interface Stats {
  users: number;
  orders: { total: number; today: number; pending: number };
  menu: { items: number; categories: number };
  revenue: { total: number; today: number };
}

interface AnalyticsData {
  revenueByDay: ChartData[];
  ordersByHour: ChartData[];
  ordersByCategory: ChartData[];
  topProducts: { name: string; orders: number; revenue: number }[];
  summary: { totalOrders: number; totalRevenue: number; avgOrderValue: number };
}

export default function AnalyticsPage() {
  return (
    <FeatureGuard featureKey="ANALYTICS">
      <AnalyticsPageContent />
    </FeatureGuard>
  );
}

function AnalyticsPageContent() {
  const router = useRouter();
  const authFetch = useAuthenticatedFetch();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<Stats | null>(null);
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [timeRange, setTimeRange] = useState('7d');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [showCustomRange, setShowCustomRange] = useState(false);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    fetchData();
  }, [router, timeRange]);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Get days from timeRange
      const daysMap: Record<string, number> = {
        '24h': 1,
        '7d': 7,
        '30d': 30,
        '90d': 90,
        '1y': 365
      };
      const days = daysMap[timeRange] || 7;

      const [statsRes, analyticsRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/tenant/stats`),
        authFetch(`${API_BASE_URL}/api/tenant/analytics?days=${days}`)
      ]);

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data);
      }

      if (analyticsRes.ok) {
        const data = await analyticsRes.json();
        setAnalytics(data);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range);
    if (range === 'custom') {
      setShowCustomRange(true);
    } else {
      setShowCustomRange(false);
    }
    // In a real app, this would trigger a data refresh
  };

  const handleExport = () => {
    const data = {
      timeRange,
      exportDate: new Date().toISOString(),
      metrics: { revenue: 24563, orders: 1234, customers: 156 }
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `analytics-${timeRange}-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const applyCustomRange = () => {
    if (customStartDate && customEndDate) {
      setShowCustomRange(false);
      // In a real app, this would trigger a data refresh with the custom date range
      alert(`Applied custom range: ${customStartDate} to ${customEndDate}`);
    }
  };

  const metrics: MetricCard[] = [
    {
      title: 'Total Revenue',
      value: formatPrice(stats?.revenue.total || 0),
      change: 0,
      changeLabel: `${formatPrice(stats?.revenue.today || 0)} today`,
      icon: <DollarSign className="h-5 w-5" />,
      color: 'from-green-500 to-emerald-600',
    },
    {
      title: 'Total Orders',
      value: (stats?.orders.total || 0).toLocaleString(),
      change: 0,
      changeLabel: `${stats?.orders.today || 0} today`,
      icon: <ShoppingBag className="h-5 w-5" />,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'Customers',
      value: (stats?.users || 0).toLocaleString(),
      change: 0,
      changeLabel: 'registered users',
      icon: <Users className="h-5 w-5" />,
      color: 'from-purple-500 to-violet-600',
    },
    {
      title: 'Menu Items',
      value: (stats?.menu.items || 0).toLocaleString(),
      change: 0,
      changeLabel: `${stats?.menu.categories || 0} categories`,
      icon: <Activity className="h-5 w-5" />,
      color: 'from-orange-500 to-amber-600',
    },
  ];

  // Use real data from API or fallback to empty arrays
  const revenueByDay: ChartData[] = analytics?.revenueByDay || [
    { label: 'Mon', value: 0 },
    { label: 'Tue', value: 0 },
    { label: 'Wed', value: 0 },
    { label: 'Thu', value: 0 },
    { label: 'Fri', value: 0 },
    { label: 'Sat', value: 0 },
    { label: 'Sun', value: 0 },
  ];

  const ordersByCategory: ChartData[] = analytics?.ordersByCategory?.length 
    ? analytics.ordersByCategory 
    : [{ label: 'No data', value: 0, percentage: 0 }];

  const ordersByHour: ChartData[] = analytics?.ordersByHour || [
    { label: '10am', value: 0 },
    { label: '11am', value: 0 },
    { label: '12pm', value: 0 },
    { label: '1pm', value: 0 },
    { label: '2pm', value: 0 },
    { label: '3pm', value: 0 },
    { label: '4pm', value: 0 },
    { label: '5pm', value: 0 },
    { label: '6pm', value: 0 },
    { label: '7pm', value: 0 },
    { label: '8pm', value: 0 },
    { label: '9pm', value: 0 },
  ];

  const topProducts = analytics?.topProducts || [];

  const maxRevenue = Math.max(...revenueByDay.map(d => d.value), 1);
  const maxOrders = Math.max(...ordersByHour.map(d => d.value), 1);

  const categoryColors = [
    'bg-blue-500',
    'bg-green-500',
    'bg-yellow-500',
    'bg-purple-500',
    'bg-pink-500',
    'bg-orange-500',
  ];

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            <div className="h-80 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Analytics Overview</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track your business performance</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={timeRange}
            onChange={(e) => handleTimeRangeChange(e.target.value)}
            className="w-40"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
            <option value="custom">Custom Range</option>
          </Select>
          <Button variant="outline" size="sm" onClick={handleExport}>
            <Activity className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
        
        {/* Custom Date Range Modal */}
        {showCustomRange && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/50" onClick={() => setShowCustomRange(false)} />
            <div className="relative w-full max-w-sm bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Custom Date Range</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-6">
                <Button variant="outline" onClick={() => setShowCustomRange(false)} className="flex-1">Cancel</Button>
                <Button onClick={applyCustomRange} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">Apply</Button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {metrics.map((metric, index) => (
          <Card key={index} className="overflow-hidden">
            <CardContent className="p-0">
              <div className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{metric.title}</span>
                  <div className={cn("h-10 w-10 rounded-lg bg-gradient-to-br flex items-center justify-center text-white", metric.color)}>
                    {metric.icon}
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">{metric.value}</p>
                  <div className="flex items-center gap-1">
                    {metric.change >= 0 ? (
                      <ArrowUpRight className="h-4 w-4 text-green-500" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4 text-red-500" />
                    )}
                    <span className={cn("text-sm font-medium", metric.change >= 0 ? "text-green-500" : "text-red-500")}>
                      {Math.abs(metric.change)}%
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">{metric.changeLabel}</span>
                  </div>
                </div>
              </div>
              <div className={cn("h-1 bg-gradient-to-r", metric.color)} />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <BarChart2 className="h-5 w-5 text-indigo-500" />
                  Revenue by Day
                </CardTitle>
                <CardDescription>Daily revenue for the selected period</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/analytics/sales')}>
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-end justify-between gap-2">
              {revenueByDay.map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full relative group">
                    <div
                      className="w-full bg-gradient-to-t from-indigo-500 to-indigo-400 rounded-t-md transition-all hover:from-indigo-600 hover:to-indigo-500 cursor-pointer"
                      style={{ height: `${(day.value / maxRevenue) * 200}px` }}
                    />
                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      ${day.value.toLocaleString()}
                    </div>
                  </div>
                  <span className="text-xs text-gray-500 dark:text-gray-400">{day.label}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Orders by Category */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5 text-indigo-500" />
                  Orders by Category
                </CardTitle>
                <CardDescription>Distribution of orders across categories</CardDescription>
              </div>
              <Button variant="ghost" size="sm" onClick={() => router.push('/analytics/products')}>
                View Details
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ordersByCategory.map((category, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">{category.label}</span>
                    <span className="text-gray-500 dark:text-gray-400">
                      {category.value} orders ({category.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className={cn("h-full rounded-full transition-all", categoryColors[index % categoryColors.length])}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Orders by Hour */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-indigo-500" />
                Orders by Hour
              </CardTitle>
              <CardDescription>Peak ordering times throughout the day</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="h-48 flex items-end justify-between gap-1">
            {ordersByHour.map((hour, index) => (
              <div key={index} className="flex-1 flex flex-col items-center gap-2">
                <div className="w-full relative group">
                  <div
                    className={cn(
                      "w-full rounded-t-sm transition-all cursor-pointer",
                      hour.value === maxOrders 
                        ? "bg-gradient-to-t from-green-500 to-green-400" 
                        : "bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 hover:from-indigo-400 hover:to-indigo-300"
                    )}
                    style={{ height: `${(hour.value / maxOrders) * 160}px` }}
                  />
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-gray-900 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10">
                    {hour.value} orders
                  </div>
                </div>
                <span className="text-xs text-gray-500 dark:text-gray-400">{hour.label}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 flex items-center justify-center gap-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-green-500" />
              <span className="text-gray-600 dark:text-gray-300">Peak Hour (8pm)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-3 w-3 rounded-full bg-gray-300 dark:bg-gray-600" />
              <span className="text-gray-600 dark:text-gray-300">Regular Hours</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-500" />
                Top Products
              </CardTitle>
              <CardDescription>Best selling items in the selected period</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {topProducts.length > 0 ? (
            <div className="space-y-4">
              {topProducts.map((product, index) => (
                <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "h-8 w-8 rounded-full flex items-center justify-center text-white font-bold text-sm",
                      index === 0 ? "bg-yellow-500" : index === 1 ? "bg-gray-400" : index === 2 ? "bg-amber-600" : "bg-gray-300"
                    )}>
                      {index + 1}
                    </div>
                    <span className="font-medium text-gray-900 dark:text-white">{product.name}</span>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-900 dark:text-white">{product.orders} orders</p>
                    <p className="text-sm text-gray-500">{formatPrice(product.revenue)}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-gray-500">
              <ShoppingBag className="h-12 w-12 mx-auto mb-2 opacity-50" />
              <p>No product data available for this period</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Quick Links */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-blue-500"
          onClick={() => router.push('/analytics/sales')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Sales Analytics</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Detailed revenue reports</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-green-500"
          onClick={() => router.push('/analytics/products')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Product Analytics</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Best sellers & trends</p>
            </div>
          </CardContent>
        </Card>

        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer border-l-4 border-l-purple-500"
          onClick={() => router.push('/customers')}
        >
          <CardContent className="p-4 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <Users className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Customer Insights</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Behavior & retention</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
