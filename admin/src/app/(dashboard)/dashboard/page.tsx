// admin/src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Clock, 
  Users, 
  Package, 
  DollarSign, 
  TrendingUp, 
  AlertCircle, 
  Plus,
  ArrowUpRight,
  CheckCircle2,
  Clock4,
  XCircle,
  ChevronRight,
  ShoppingCart,
  Utensils,
  UserPlus,
  BarChart2,
  RefreshCw,
  Loader2,
  Settings,
  Smartphone,
  QrCode,
  Download,
  Star
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth, useAuthenticatedFetch } from '@/contexts/AuthContext';

const API_BASE_URL = '';

type OrderStatus = 'pending' | 'confirmed' | 'preparing' | 'ready' | 'delivered' | 'cancelled';

interface Order {
  id: string;
  customer: string;
  itemCount: number;
  total: number;
  status: OrderStatus;
  createdAt: string;
}

interface DashboardStats {
  users: number;
  orders: {
    total: number;
    today: number;
    pending: number;
  };
  menu: {
    items: number;
    categories: number;
  };
  revenue: {
    total: number;
    today: number;
  };
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend?: {
    value: string;
    isPositive: boolean;
  };
}

const StatsCard = ({ title, value, description, icon, trend }: StatsCardProps) => (
  <Card>
    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
      <CardTitle className="text-sm font-medium text-gray-500">
        {title}
      </CardTitle>
      <div className="h-5 w-5 text-muted-foreground">
        {icon}
      </div>
    </CardHeader>
    <CardContent>
      <div className="text-2xl font-bold">{value}</div>
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{description}</p>
        {trend && (
          <span className={`text-xs ${trend.isPositive ? 'text-green-500' : 'text-red-500'} flex items-center`}>
            {trend.value}
            <ArrowUpRight className={`h-3 w-3 ml-1 ${!trend.isPositive ? 'transform rotate-90' : ''}`} />
          </span>
        )}
      </div>
    </CardContent>
  </Card>
);

const RecentOrders = ({ orders }: { orders: Order[] }) => {
  const { formatPrice } = useCurrency();

  const getStatusBadge = (status: string) => {
    const statusMap: Record<string, { label: string; className: string }> = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      confirmed: { label: 'Confirmed', className: 'bg-blue-100 text-blue-800' },
      preparing: { label: 'Preparing', className: 'bg-indigo-100 text-indigo-800' },
      ready: { label: 'Ready', className: 'bg-green-100 text-green-800' },
      delivered: { label: 'Delivered', className: 'bg-emerald-100 text-emerald-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
    };
    return statusMap[status] || statusMap.pending;
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'delivered':
      case 'ready':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'preparing':
      case 'confirmed':
        return <Clock4 className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock4 className="h-4 w-4" />;
    }
  };

  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Package className="h-12 w-12 mx-auto mb-2 opacity-50" />
        <p>No orders yet</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {orders.map((order) => {
        const status = getStatusBadge(order.status);
        return (
          <div key={order.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Order #{order.id.slice(0, 8)}</p>
                <p className="text-sm text-gray-500">{order.customer} • {order.itemCount} items</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-medium">{formatPrice(order.total)}</span>
              <Badge className={status.className}>
                <span className="flex items-center">
                  {getStatusIcon(order.status)}
                  <span className="ml-1">{status.label}</span>
                </span>
              </Badge>
              <Button variant="ghost" size="icon" className="h-8 w-8">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        );
      })}
      <div className="text-center">
        <Link href="/orders">
          <Button variant="ghost" className="text-indigo-600">
            View all orders
          </Button>
        </Link>
      </div>
    </div>
  );
};

const QuickActions = () => {
  const { isFeatureEnabled } = useAuth();
  
  return (
    <div className="space-y-3">
      {isFeatureEnabled('ORDERS') && (
        <Link href="/order">
          <Button variant="outline" className="w-full justify-start p-6 h-auto">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600">
                <ShoppingCart className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">New Order</p>
                <p className="text-sm text-gray-500">Create a new order</p>
              </div>
            </div>
          </Button>
        </Link>
      )}
      
      {isFeatureEnabled('MENU') && (
        <Link href="/menu/items">
          <Button variant="outline" className="w-full justify-start p-6 h-auto">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-green-100 text-green-600">
                <Plus className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">Add Menu Item</p>
                <p className="text-sm text-gray-500">Add new dish to the menu</p>
              </div>
            </div>
          </Button>
        </Link>
      )}
      
      {isFeatureEnabled('CUSTOMERS') && (
        <Link href="/customers">
          <Button variant="outline" className="w-full justify-start p-6 h-auto">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600">
                <UserPlus className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">Add Customer</p>
                <p className="text-sm text-gray-500">Register a new customer</p>
              </div>
            </div>
          </Button>
        </Link>
      )}
      
      {isFeatureEnabled('ANALYTICS') && (
        <Link href="/analytics">
          <Button variant="outline" className="w-full justify-start p-6 h-auto">
            <div className="flex items-center space-x-4">
              <div className="p-2 rounded-lg bg-amber-100 text-amber-600">
                <BarChart2 className="h-5 w-5" />
              </div>
              <div className="text-left">
                <p className="font-medium">View Reports</p>
                <p className="text-sm text-gray-500">Analyze sales and performance</p>
              </div>
            </div>
          </Button>
        </Link>
      )}
    </div>
  );
};

export default function DashboardPage() {
  const { formatPrice } = useCurrency();
  const { selectedTenant, tenants, hasMultipleTenants, selectTenant, tenantSettings, fetchTenantSettings, isFeatureEnabled } = useAuth();
  const authFetch = useAuthenticatedFetch();
  
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [error, setError] = useState<string | null>(null);

  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch stats and orders in parallel
      const [statsRes, ordersRes] = await Promise.all([
        authFetch(`${API_BASE_URL}/api/tenant/stats`),
        authFetch(`${API_BASE_URL}/api/tenant/orders?limit=5`)
      ]);

      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json();
        setRecentOrders(ordersData.data || []);
      }

      // Fetch tenant settings if not cached
      if (!tenantSettings) {
        await fetchTenantSettings();
      }
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (selectedTenant) {
      fetchDashboardData();
    } else {
      setLoading(false);
    }
  }, [selectedTenant]);

  return (
    <div className="flex-1 space-y-6">
      {/* Restaurant Switcher for multi-tenant users */}
      {hasMultipleTenants && (
        <div className="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-lg bg-indigo-100 dark:bg-indigo-800 flex items-center justify-center">
                <Utensils className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
              </div>
              <div>
                <p className="font-semibold text-indigo-900 dark:text-indigo-100">{selectedTenant?.name}</p>
                <p className="text-sm text-indigo-600 dark:text-indigo-400">
                  You have access to {tenants.length} restaurants
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {tenants.map((tenant) => (
                <button
                  key={tenant.tenant_id}
                  onClick={() => selectTenant(tenant)}
                  className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                    selectedTenant?.tenant_id === tenant.tenant_id
                      ? 'bg-indigo-600 text-white shadow-md'
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/30 border'
                  }`}
                >
                  {tenant.name}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Restaurant Banner with Logo */}
      {selectedTenant && (
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-700 rounded-2xl p-6 text-white">
          <div className="absolute inset-0 bg-black/10" />
          <div className="relative flex items-center gap-4">
            {tenantSettings?.logo ? (
              <img 
                src={tenantSettings.logo} 
                alt={selectedTenant.name} 
                className="h-16 w-16 rounded-xl object-cover border-2 border-white/30 shadow-lg"
              />
            ) : (
              <div className="h-16 w-16 rounded-xl bg-white/20 flex items-center justify-center border-2 border-white/30">
                <Utensils className="h-8 w-8 text-white" />
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold">{tenantSettings?.name || selectedTenant.name}</h1>
              <p className="text-white/80 text-sm mt-1">
                {tenantSettings?.description || selectedTenant.domain || 'Restaurant Dashboard'}
              </p>
            </div>
            <Link href="/settings">
              <Button variant="secondary" size="sm" className="bg-white/20 hover:bg-white/30 text-white border-0">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </Button>
            </Link>
          </div>
        </div>
      )}

      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">
            {selectedTenant ? `Welcome to ${selectedTenant.name}` : 'Welcome back'}
          </h2>
          <p className="text-sm text-muted-foreground">
            A quick overview of how your restaurant is performing today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isFeatureEnabled('MENU') && (
            <Link href="/menu">
              <Button variant="outline" className="hidden sm:inline-flex">
                <Utensils className="mr-2 h-4 w-4" />
                Manage Menu
              </Button>
            </Link>
          )}
          {isFeatureEnabled('ORDERS') && (
            <Link href="/order">
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                New Order
              </Button>
            </Link>
          )}
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          {isFeatureEnabled('ANALYTICS') && <TabsTrigger value="analytics">Analytics</TabsTrigger>}
          {isFeatureEnabled('ANALYTICS') && <TabsTrigger value="reports">Reports</TabsTrigger>}
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <AlertCircle className="h-12 w-12 mx-auto mb-4 text-red-500" />
              <p className="text-red-600">{error}</p>
              <Button onClick={fetchDashboardData} className="mt-4">
                <RefreshCw className="mr-2 h-4 w-4" />
                Retry
              </Button>
            </div>
          ) : (
            <>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <StatsCard
                  title="Total Revenue"
                  value={formatPrice(stats?.revenue.total || 0)}
                  description={`${formatPrice(stats?.revenue.today || 0)} today`}
                  icon={<DollarSign className="h-4 w-4" />}
                />
                <StatsCard
                  title="Total Orders"
                  value={(stats?.orders.total || 0).toLocaleString()}
                  description={`${stats?.orders.today || 0} today, ${stats?.orders.pending || 0} pending`}
                  icon={<Package className="h-4 w-4" />}
                />
                <StatsCard
                  title="Customers"
                  value={(stats?.users || 0).toLocaleString()}
                  description="Registered users"
                  icon={<Users className="h-4 w-4" />}
                />
                <StatsCard
                  title="Menu Items"
                  value={(stats?.menu.items || 0).toLocaleString()}
                  description={`${stats?.menu.categories || 0} categories`}
                  icon={<Utensils className="h-4 w-4" />}
                />
              </div>

              {/* Mobile App Promotion Section */}
              <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white border-0 overflow-hidden relative">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -mr-32 -mt-32"></div>
                <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full -ml-24 -mb-24"></div>
                <CardContent className="p-6 relative z-10">
                  <div className="grid gap-6 md:grid-cols-3">
                    {/* Left: Info */}
                    <div className="md:col-span-2 space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                          <Smartphone className="h-6 w-6" />
                        </div>
                        <div>
                          <h3 className="text-2xl font-bold">Get Our Mobile App</h3>
                          <p className="text-white/90 text-sm">Order on the go with our mobile app</p>
                        </div>
                      </div>
                      
                      <div className="space-y-3">
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">Fast & Easy Ordering</p>
                            <p className="text-sm text-white/80">Browse menu and place orders in seconds</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">Real-time Order Tracking</p>
                            <p className="text-sm text-white/80">Track your order from kitchen to doorstep</p>
                          </div>
                        </div>
                        <div className="flex items-start gap-3">
                          <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                          <div>
                            <p className="font-semibold">Exclusive App Deals</p>
                            <p className="text-sm text-white/80">Get special discounts and offers</p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                        <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                        <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                        <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                        <Star className="h-5 w-5 fill-yellow-300 text-yellow-300" />
                        <span className="ml-2 text-sm font-semibold">4.8/5 (10K+ reviews)</span>
                      </div>
                    </div>

                    {/* Right: QR Codes */}
                    <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="text-center">
                        <p className="text-sm font-semibold mb-3">Scan to Download</p>
                        <div className="grid grid-cols-2 gap-3">
                          {/* App Store QR */}
                          <div className="bg-white rounded-xl p-3 space-y-2">
                            <div className="h-24 w-24 bg-slate-100 rounded-lg flex items-center justify-center">
                              <QrCode className="h-20 w-20 text-slate-800" />
                            </div>
                            <div className="flex items-center justify-center gap-1 text-slate-900">
                              <Download className="h-3 w-3" />
                              <span className="text-xs font-semibold">App Store</span>
                            </div>
                          </div>
                          
                          {/* Play Store QR */}
                          <div className="bg-white rounded-xl p-3 space-y-2">
                            <div className="h-24 w-24 bg-slate-100 rounded-lg flex items-center justify-center">
                              <QrCode className="h-20 w-20 text-slate-800" />
                            </div>
                            <div className="flex items-center justify-center gap-1 text-slate-900">
                              <Download className="h-3 w-3" />
                              <span className="text-xs font-semibold">Play Store</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <p className="text-xs text-white/70 text-center max-w-[200px]">
                        Available for iOS 13+ and Android 8+
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
              
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
                <Card className="col-span-4">
                  <CardHeader className="flex flex-row items-center justify-between">
                    <div>
                      <CardTitle>Recent Orders</CardTitle>
                      <CardDescription>Latest {recentOrders.length} orders</CardDescription>
                    </div>
                    <Button variant="ghost" size="icon" onClick={fetchDashboardData}>
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </CardHeader>
                  <CardContent>
                    <RecentOrders orders={recentOrders} />
                  </CardContent>
                </Card>
            
                <div className="col-span-3 space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Quick Actions</CardTitle>
                      <CardDescription>Common tasks at your fingertips</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <QuickActions />
                    </CardContent>
                  </Card>
                  
                  <Card>
                    <CardHeader>
                      <CardTitle>Restaurant Info</CardTitle>
                      <CardDescription>Your restaurant details</CardDescription>
                    </CardHeader>
                    <CardContent>
                      {selectedTenant && (
                        <div className="space-y-2">
                          <p className="text-sm"><strong>Name:</strong> {selectedTenant.name}</p>
                          <p className="text-sm"><strong>Domain:</strong> {selectedTenant.domain || 'Not set'}</p>
                          <p className="text-sm"><strong>Status:</strong> {selectedTenant.status}</p>
                          <Link href="/settings">
                            <Button size="sm" className="mt-2 w-full">
                              Manage Settings
                            </Button>
                          </Link>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </div>
              </div>
            </>
          )}
        </TabsContent>
        
        {isFeatureEnabled('ANALYTICS') && (
          <TabsContent value="analytics" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Analytics</CardTitle>
                <CardDescription>Detailed analytics and insights coming soon.</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        )}
        
        {isFeatureEnabled('ANALYTICS') && (
          <TabsContent value="reports" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Reports</CardTitle>
                <CardDescription>Generate and view reports here.</CardDescription>
              </CardHeader>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Notifications</CardTitle>
              <CardDescription>Your recent notifications will appear here.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
