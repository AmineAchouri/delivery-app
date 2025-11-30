'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
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
  Activity
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

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

export default function AnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setTimeout(() => setLoading(false), 500);
  }, [router]);

  const metrics: MetricCard[] = [
    {
      title: 'Total Revenue',
      value: '$24,563.00',
      change: 12.5,
      changeLabel: 'vs last period',
      icon: <DollarSign className="h-5 w-5" />,
      color: 'from-green-500 to-emerald-600',
    },
    {
      title: 'Total Orders',
      value: '1,234',
      change: 8.2,
      changeLabel: 'vs last period',
      icon: <ShoppingBag className="h-5 w-5" />,
      color: 'from-blue-500 to-indigo-600',
    },
    {
      title: 'New Customers',
      value: '156',
      change: -3.1,
      changeLabel: 'vs last period',
      icon: <Users className="h-5 w-5" />,
      color: 'from-purple-500 to-violet-600',
    },
    {
      title: 'Avg. Order Time',
      value: '24 min',
      change: -5.4,
      changeLabel: 'faster than before',
      icon: <Clock className="h-5 w-5" />,
      color: 'from-orange-500 to-amber-600',
    },
  ];

  const revenueByDay: ChartData[] = [
    { label: 'Mon', value: 3200 },
    { label: 'Tue', value: 4100 },
    { label: 'Wed', value: 3800 },
    { label: 'Thu', value: 5200 },
    { label: 'Fri', value: 6100 },
    { label: 'Sat', value: 7500 },
    { label: 'Sun', value: 5800 },
  ];

  const ordersByCategory: ChartData[] = [
    { label: 'Pizza', value: 420, percentage: 35 },
    { label: 'Burgers', value: 280, percentage: 23 },
    { label: 'Sushi', value: 180, percentage: 15 },
    { label: 'Salads', value: 150, percentage: 12.5 },
    { label: 'Drinks', value: 100, percentage: 8.5 },
    { label: 'Desserts', value: 70, percentage: 6 },
  ];

  const ordersByHour: ChartData[] = [
    { label: '10am', value: 45 },
    { label: '11am', value: 78 },
    { label: '12pm', value: 156 },
    { label: '1pm', value: 189 },
    { label: '2pm', value: 134 },
    { label: '3pm', value: 89 },
    { label: '4pm', value: 67 },
    { label: '5pm', value: 98 },
    { label: '6pm', value: 178 },
    { label: '7pm', value: 234 },
    { label: '8pm', value: 267 },
    { label: '9pm', value: 198 },
  ];

  const maxRevenue = Math.max(...revenueByDay.map(d => d.value));
  const maxOrders = Math.max(...ordersByHour.map(d => d.value));

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
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-40"
          >
            <option value="24h">Last 24 hours</option>
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </Select>
          <Button variant="outline" size="sm">
            <Calendar className="h-4 w-4 mr-2" />
            Custom Range
          </Button>
        </div>
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
                  <BarChart2 className="h-5 w-5 text-primary-500" />
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
                      className="w-full bg-gradient-to-t from-primary-500 to-primary-400 rounded-t-md transition-all hover:from-primary-600 hover:to-primary-500 cursor-pointer"
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
                  <PieChart className="h-5 w-5 text-primary-500" />
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
                <Activity className="h-5 w-5 text-primary-500" />
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
                        : "bg-gradient-to-t from-gray-300 to-gray-200 dark:from-gray-600 dark:to-gray-500 hover:from-primary-400 hover:to-primary-300"
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
