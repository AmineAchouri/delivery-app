// admin/src/app/dashboard/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
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
  BarChart2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';

type OrderStatus = 'pending' | 'processing' | 'completed' | 'cancelled';

interface Order {
  id: string;
  customer: string;
  items: number;
  total: string;
  status: OrderStatus;
  date: string;
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

const RecentOrders = () => {
  const orders: Order[] = [
    {
      id: 'ORD-001',
      customer: 'John Doe',
      items: 3,
      total: '$45.99',
      status: 'completed',
      date: '2023-05-15 14:32'
    },
    {
      id: 'ORD-002',
      customer: 'Jane Smith',
      items: 5,
      total: '$78.50',
      status: 'processing',
      date: '2023-05-15 13:21'
    },
    {
      id: 'ORD-003',
      customer: 'Robert Johnson',
      items: 2,
      total: '$24.99',
      status: 'pending',
      date: '2023-05-15 12:45'
    },
    {
      id: 'ORD-004',
      customer: 'Emily Davis',
      items: 1,
      total: '$12.99',
      status: 'completed',
      date: '2023-05-15 11:30'
    },
    {
      id: 'ORD-005',
      customer: 'Michael Brown',
      items: 4,
      total: '$56.75',
      status: 'cancelled',
      date: '2023-05-15 10:15'
    },
  ];

  const getStatusBadge = (status: OrderStatus) => {
    const statusMap = {
      pending: { label: 'Pending', className: 'bg-yellow-100 text-yellow-800' },
      processing: { label: 'Processing', className: 'bg-blue-100 text-blue-800' },
      completed: { label: 'Completed', className: 'bg-green-100 text-green-800' },
      cancelled: { label: 'Cancelled', className: 'bg-red-100 text-red-800' },
    };
    return statusMap[status] || statusMap.pending;
  };

  const getStatusIcon = (status: OrderStatus) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="h-4 w-4" />;
      case 'processing':
        return <Clock4 className="h-4 w-4" />;
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      default:
        return <Clock4 className="h-4 w-4" />;
    }
  };

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
                <p className="font-medium">Order #{order.id}</p>
                <p className="text-sm text-gray-500">{order.customer} • {order.items} items</p>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <span className="font-medium">{order.total}</span>
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
        <Button variant="ghost" className="text-primary">
          View all orders
        </Button>
      </div>
    </div>
  );
};

const QuickActions = () => (
  <div className="space-y-3">
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
  </div>
);

export default function DashboardPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
    } else {
      setIsLoading(false);
    }
  }, [router]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex-1 space-y-6">
      <div className="flex flex-col justify-between gap-3 md:flex-row md:items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Welcome back</h2>
          <p className="text-sm text-muted-foreground">
            A quick overview of how your restaurant is performing today.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden sm:inline-flex">
            <Utensils className="mr-2 h-4 w-4" />
            Manage Menu
          </Button>
          <Button>
            <Plus className="mr-2 h-4 w-4" />
            New Order
          </Button>
        </div>
      </div>
      
      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="reports">Reports</TabsTrigger>
          <TabsTrigger value="notifications">Notifications</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Total Revenue"
              value="$24,780.00"
              description="+20.1% from last month"
              icon={<DollarSign className="h-4 w-4" />}
              trend={{ value: '20.1%', isPositive: true }}
            />
            <StatsCard
              title="Orders"
              value="1,245"
              description="+12% from last month"
              icon={<Package className="h-4 w-4" />}
              trend={{ value: '12%', isPositive: true }}
            />
            <StatsCard
              title="Active Customers"
              value="1,234"
              description="+8% from last month"
              icon={<Users className="h-4 w-4" />}
              trend={{ value: '8%', isPositive: true }}
            />
            <StatsCard
              title="Avg. Order Value"
              value="$45.67"
              description="+2.5% from last month"
              icon={<TrendingUp className="h-4 w-4" />}
              trend={{ value: '2.5%', isPositive: true }}
            />
          </div>
          
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
            <Card className="col-span-4">
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
                <CardDescription>You've had 245 orders this week.</CardDescription>
              </CardHeader>
              <CardContent>
                <RecentOrders />
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
                  <CardTitle>Today's Special</CardTitle>
                  <CardDescription>Featured menu item</CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="relative h-40 bg-gradient-to-r from-amber-500 to-amber-600 rounded-b-lg overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent z-10 flex flex-col justify-end p-4">
                      <h3 className="text-lg font-semibold text-white">Spicy Pasta Arrabbiata</h3>
                      <p className="text-sm text-amber-100">Our chef's special for today</p>
                      <Button size="sm" className="mt-2 w-fit">
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Analytics</CardTitle>
              <CardDescription>Detailed analytics and insights coming soon.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        
        <TabsContent value="reports" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Reports</CardTitle>
              <CardDescription>Generate and view reports here.</CardDescription>
            </CardHeader>
          </Card>
        </TabsContent>
        
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