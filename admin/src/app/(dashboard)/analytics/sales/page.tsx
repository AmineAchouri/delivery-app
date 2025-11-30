'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  DollarSign, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Download,
  CreditCard,
  Wallet,
  Banknote,
  Receipt,
  Target,
  Percent
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

interface SalesData {
  date: string;
  orders: number;
  revenue: number;
  avgOrderValue: number;
  refunds: number;
}

interface PaymentMethod {
  method: string;
  amount: number;
  percentage: number;
  transactions: number;
  icon: React.ReactNode;
  color: string;
}

export default function SalesAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const salesData: SalesData[] = [
    { date: '2024-11-29', orders: 156, revenue: 4250.50, avgOrderValue: 27.25, refunds: 45.00 },
    { date: '2024-11-28', orders: 142, revenue: 3890.75, avgOrderValue: 27.40, refunds: 0 },
    { date: '2024-11-27', orders: 168, revenue: 4567.00, avgOrderValue: 27.18, refunds: 89.50 },
    { date: '2024-11-26', orders: 134, revenue: 3654.25, avgOrderValue: 27.27, refunds: 0 },
    { date: '2024-11-25', orders: 189, revenue: 5234.00, avgOrderValue: 27.69, refunds: 125.00 },
    { date: '2024-11-24', orders: 201, revenue: 5678.50, avgOrderValue: 28.25, refunds: 0 },
    { date: '2024-11-23', orders: 178, revenue: 4890.25, avgOrderValue: 27.47, refunds: 67.00 },
  ];

  const paymentMethods: PaymentMethod[] = [
    { method: 'Credit Card', amount: 15234.50, percentage: 52, transactions: 456, icon: <CreditCard className="h-5 w-5" />, color: 'bg-blue-500' },
    { method: 'Digital Wallet', amount: 8567.25, percentage: 29, transactions: 312, icon: <Wallet className="h-5 w-5" />, color: 'bg-purple-500' },
    { method: 'Cash', amount: 4123.00, percentage: 14, transactions: 189, icon: <Banknote className="h-5 w-5" />, color: 'bg-green-500' },
    { method: 'Other', amount: 1456.75, percentage: 5, transactions: 67, icon: <Receipt className="h-5 w-5" />, color: 'bg-gray-500' },
  ];

  const totalRevenue = salesData.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders = salesData.reduce((sum, d) => sum + d.orders, 0);
  const totalRefunds = salesData.reduce((sum, d) => sum + d.refunds, 0);
  const avgOrderValue = totalRevenue / totalOrders;
  const netRevenue = totalRevenue - totalRefunds;

  const revenueByWeek = [
    { week: 'Week 1', revenue: 18500, target: 20000 },
    { week: 'Week 2', revenue: 22300, target: 20000 },
    { week: 'Week 3', revenue: 19800, target: 20000 },
    { week: 'Week 4', revenue: 24563, target: 20000 },
  ];

  const maxWeekRevenue = Math.max(...revenueByWeek.map(w => Math.max(w.revenue, w.target)));

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Sales Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Detailed revenue and sales reports</p>
        </div>
        <div className="flex items-center gap-3">
          <Select
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            className="w-40"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Revenue</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{formatPrice(totalRevenue)}</p>
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12.5% vs last period
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Net Revenue</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{formatPrice(netRevenue)}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center mt-1">
                  After {formatPrice(totalRefunds)} refunds
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg. Order Value</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatPrice(avgOrderValue)}</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +2.3% vs last period
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Receipt className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Target Progress</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">92%</p>
                <p className="text-xs text-orange-600 dark:text-orange-400 flex items-center mt-1">
                  $2,437 to reach goal
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Weekly Revenue vs Target */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Weekly Revenue vs Target</CardTitle>
            <CardDescription>Compare actual revenue against monthly targets</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {revenueByWeek.map((week, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-gray-900 dark:text-white">{week.week}</span>
                    <div className="flex items-center gap-4">
                      <span className="text-gray-500 dark:text-gray-400">
                        {formatPrice(week.revenue)} / {formatPrice(week.target)}
                      </span>
                      <Badge variant={week.revenue >= week.target ? 'default' : 'secondary'} className={week.revenue >= week.target ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' : ''}>
                        {week.revenue >= week.target ? 'On Track' : 'Behind'}
                      </Badge>
                    </div>
                  </div>
                  <div className="relative h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="absolute h-full bg-indigo-500 rounded-full transition-all"
                      style={{ width: `${(week.revenue / maxWeekRevenue) * 100}%` }}
                    />
                    <div
                      className="absolute h-full w-0.5 bg-red-500"
                      style={{ left: `${(week.target / maxWeekRevenue) * 100}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-center gap-6 text-sm">
              <div className="flex items-center gap-2">
                <div className="h-3 w-3 rounded-full bg-indigo-500" />
                <span className="text-gray-600 dark:text-gray-300">Revenue</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="h-3 w-0.5 bg-red-500" />
                <span className="text-gray-600 dark:text-gray-300">Target</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Payment Methods */}
        <Card>
          <CardHeader>
            <CardTitle>Payment Methods</CardTitle>
            <CardDescription>Revenue by payment type</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {paymentMethods.map((method, index) => (
                <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-white", method.color)}>
                    {method.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-gray-900 dark:text-white text-sm">{method.method}</span>
                      <span className="font-bold text-gray-900 dark:text-white">{formatPrice(method.amount)}</span>
                    </div>
                    <div className="flex items-center justify-between mt-1">
                      <span className="text-xs text-gray-500 dark:text-gray-400">{method.transactions} transactions</span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{method.percentage}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Daily Sales Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Daily Sales Breakdown</CardTitle>
              <CardDescription>Detailed daily sales data</CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead>Date</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-right">Avg. Order</TableHead>
                <TableHead className="text-right">Refunds</TableHead>
                <TableHead className="text-right">Net Revenue</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {salesData.map((day, index) => (
                <TableRow key={index} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell className="font-medium">
                    {new Date(day.date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                  </TableCell>
                  <TableCell className="text-center">{day.orders}</TableCell>
                  <TableCell className="text-right font-medium">{formatPrice(day.revenue)}</TableCell>
                  <TableCell className="text-right">{formatPrice(day.avgOrderValue)}</TableCell>
                  <TableCell className="text-right">
                    {day.refunds > 0 ? (
                      <span className="text-red-600 dark:text-red-400">-{formatPrice(day.refunds)}</span>
                    ) : (
                      <span className="text-gray-400">{formatPrice(0)}</span>
                    )}
                  </TableCell>
                  <TableCell className="text-right font-bold text-green-600 dark:text-green-400">
                    {formatPrice(day.revenue - day.refunds)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
