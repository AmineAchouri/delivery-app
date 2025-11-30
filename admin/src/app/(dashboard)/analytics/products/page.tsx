'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Package, 
  TrendingUp, 
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight,
  Star,
  ShoppingBag,
  Eye,
  Heart,
  BarChart2,
  Filter,
  Download
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

interface Product {
  id: string;
  name: string;
  category: string;
  image?: string;
  orders: number;
  revenue: number;
  rating: number;
  reviews: number;
  trend: number;
  inStock: boolean;
}

interface CategoryPerformance {
  name: string;
  orders: number;
  revenue: number;
  avgRating: number;
  growth: number;
  color: string;
}

export default function ProductAnalyticsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('30d');
  const [sortBy, setSortBy] = useState('orders');

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const topProducts: Product[] = [
    { id: '1', name: 'Margherita Pizza', category: 'Pizza', orders: 456, revenue: 6840.00, rating: 4.8, reviews: 234, trend: 12.5, inStock: true },
    { id: '2', name: 'Classic Burger', category: 'Burgers', orders: 389, revenue: 4668.00, rating: 4.6, reviews: 189, trend: 8.3, inStock: true },
    { id: '3', name: 'Caesar Salad', category: 'Salads', orders: 312, revenue: 3744.00, rating: 4.7, reviews: 156, trend: 15.2, inStock: true },
    { id: '4', name: 'Pepperoni Pizza', category: 'Pizza', orders: 298, revenue: 4768.00, rating: 4.9, reviews: 201, trend: 5.1, inStock: true },
    { id: '5', name: 'Chicken Wings', category: 'Appetizers', orders: 267, revenue: 2670.00, rating: 4.5, reviews: 145, trend: -2.3, inStock: true },
    { id: '6', name: 'Sushi Platter', category: 'Sushi', orders: 234, revenue: 5616.00, rating: 4.8, reviews: 167, trend: 18.7, inStock: false },
    { id: '7', name: 'Chocolate Cake', category: 'Desserts', orders: 198, revenue: 1584.00, rating: 4.9, reviews: 123, trend: 22.1, inStock: true },
    { id: '8', name: 'Iced Coffee', category: 'Drinks', orders: 456, revenue: 1824.00, rating: 4.4, reviews: 89, trend: 3.2, inStock: true },
  ];

  const categoryPerformance: CategoryPerformance[] = [
    { name: 'Pizza', orders: 754, revenue: 11608.00, avgRating: 4.85, growth: 8.7, color: 'bg-red-500' },
    { name: 'Burgers', orders: 512, revenue: 6144.00, avgRating: 4.6, growth: 5.2, color: 'bg-yellow-500' },
    { name: 'Sushi', orders: 345, revenue: 8280.00, avgRating: 4.8, growth: 18.7, color: 'bg-pink-500' },
    { name: 'Salads', orders: 423, revenue: 5076.00, avgRating: 4.7, growth: 12.3, color: 'bg-green-500' },
    { name: 'Drinks', orders: 678, revenue: 2712.00, avgRating: 4.4, growth: 3.2, color: 'bg-blue-500' },
    { name: 'Desserts', orders: 289, revenue: 2312.00, avgRating: 4.9, growth: 22.1, color: 'bg-purple-500' },
  ];

  const totalOrders = topProducts.reduce((sum, p) => sum + p.orders, 0);
  const totalRevenue = topProducts.reduce((sum, p) => sum + p.revenue, 0);
  const avgRating = topProducts.reduce((sum, p) => sum + p.rating, 0) / topProducts.length;

  const sortedProducts = [...topProducts].sort((a, b) => {
    if (sortBy === 'orders') return b.orders - a.orders;
    if (sortBy === 'revenue') return b.revenue - a.revenue;
    if (sortBy === 'rating') return b.rating - a.rating;
    if (sortBy === 'trend') return b.trend - a.trend;
    return 0;
  });

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
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Product Analytics</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Track product performance and trends</p>
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
          </Select>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Products Sold</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{totalOrders.toLocaleString()}</p>
                <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +9.2% vs last period
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Product Revenue</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">${totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +14.5% vs last period
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Avg. Rating</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{avgRating.toFixed(1)}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center mt-1">
                  <Star className="h-3 w-3 mr-1 fill-current" />
                  Based on 1,304 reviews
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Active Products</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">48</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                  3 out of stock
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Package className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Category Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart2 className="h-5 w-5 text-indigo-500" />
            Category Performance
          </CardTitle>
          <CardDescription>Revenue and orders by category</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {categoryPerformance.map((category, index) => (
              <div key={index} className="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3 mb-3">
                  <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center text-white", category.color)}>
                    <Package className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-medium text-gray-900 dark:text-white">{category.name}</h4>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{category.orders} orders</p>
                  </div>
                  <Badge 
                    variant="secondary" 
                    className={cn(
                      "ml-auto",
                      category.growth >= 0 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                    )}
                  >
                    {category.growth >= 0 ? '+' : ''}{category.growth}%
                  </Badge>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Revenue</span>
                    <span className="font-medium text-gray-900 dark:text-white">${category.revenue.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Avg. Rating</span>
                    <span className="font-medium text-gray-900 dark:text-white flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      {category.avgRating}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Products Table */}
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <CardTitle>Top Products</CardTitle>
              <CardDescription>Best performing products by various metrics</CardDescription>
            </div>
            <Select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="w-40"
            >
              <option value="orders">Sort by Orders</option>
              <option value="revenue">Sort by Revenue</option>
              <option value="rating">Sort by Rating</option>
              <option value="trend">Sort by Trend</option>
            </Select>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="w-12">#</TableHead>
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="text-center">Rating</TableHead>
                <TableHead className="text-center">Trend</TableHead>
                <TableHead className="text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {sortedProducts.map((product, index) => (
                <TableRow key={product.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell className="font-medium text-gray-500">{index + 1}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                        <Package className="h-5 w-5 text-gray-500" />
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{product.name}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{product.reviews} reviews</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{product.category}</Badge>
                  </TableCell>
                  <TableCell className="text-center font-medium">{product.orders}</TableCell>
                  <TableCell className="text-right font-medium">${product.revenue.toLocaleString()}</TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium">{product.rating}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className={cn(
                      "inline-flex items-center gap-1 text-sm font-medium",
                      product.trend >= 0 ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
                    )}>
                      {product.trend >= 0 ? (
                        <ArrowUpRight className="h-4 w-4" />
                      ) : (
                        <ArrowDownRight className="h-4 w-4" />
                      )}
                      {Math.abs(product.trend)}%
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge 
                      variant="secondary"
                      className={product.inStock 
                        ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400" 
                        : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                      }
                    >
                      {product.inStock ? 'In Stock' : 'Out of Stock'}
                    </Badge>
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
