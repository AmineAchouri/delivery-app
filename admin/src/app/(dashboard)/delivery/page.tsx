'use client';

import { useState, useEffect } from 'react';
import { useAuth, useAuthenticatedFetch } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useRouter } from 'next/navigation';
import { 
  Truck, 
  MapPin, 
  Phone, 
  Clock, 
  CheckCircle2,
  Package,
  Navigation,
  User,
  DollarSign,
  RefreshCw
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface Order {
  order_id: string;
  status: string;
  total_amount: number;
  created_at: string;
  delivery_address?: string;
  customer_name?: string;
  customer_phone?: string;
  items: { name: string; quantity: number }[];
}

const API_BASE_URL = '';

const STATUS_FLOW = ['pending', 'confirmed', 'preparing', 'ready', 'picked_up', 'delivered'];

export default function DeliveryPage() {
  const { isDeliveryAgent, tenantUser } = useAuth();
  const router = useRouter();
  const authFetch = useAuthenticatedFetch();
  const { formatPrice } = useCurrency();
  
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'available' | 'my_orders'>('available');
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (isDeliveryAgent === false) {
      router.push('/dashboard');
    }
  }, [isDeliveryAgent, router]);

  useEffect(() => {
    fetchOrders();
  }, [authFetch]);

  const fetchOrders = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/tenant/orders`);
      if (response.ok) {
        const data = await response.json();
        // Map API response to Order interface
        const orderList = (data.data || []).map((o: any) => ({
          order_id: o.id,
          status: o.status,
          total_amount: o.total,
          created_at: o.createdAt,
          customer_name: o.customer,
          items: []
        }));
        setOrders(orderList);
      }
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/orders/${orderId}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });

      if (response.ok) {
        setOrders(orders.map(o => 
          o.order_id === orderId ? { ...o, status: newStatus } : o
        ));
        if (selectedOrder?.order_id === orderId) {
          setSelectedOrder({ ...selectedOrder, status: newStatus });
        }
      }
    } catch (error) {
      console.error('Failed to update order:', error);
    }
  };

  const getNextStatus = (currentStatus: string) => {
    const idx = STATUS_FLOW.indexOf(currentStatus);
    return idx >= 0 && idx < STATUS_FLOW.length - 1 ? STATUS_FLOW[idx + 1] : null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-amber-100 text-amber-700';
      case 'confirmed': return 'bg-blue-100 text-blue-700';
      case 'preparing': return 'bg-purple-100 text-purple-700';
      case 'ready': return 'bg-emerald-100 text-emerald-700';
      case 'picked_up': return 'bg-indigo-100 text-indigo-700';
      case 'delivered': return 'bg-green-100 text-green-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  // Filter orders based on tab
  const availableOrders = orders.filter(o => o.status === 'ready');
  const myOrders = orders.filter(o => o.status === 'picked_up');
  const displayOrders = activeTab === 'available' ? availableOrders : myOrders;

  // Stats
  const todayDelivered = orders.filter(o => o.status === 'delivered').length;
  const todayEarnings = todayDelivered * 5; // $5 per delivery

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Delivery Dashboard</h1>
          <p className="text-slate-500">Manage your deliveries</p>
        </div>
        <button
          onClick={fetchOrders}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className="h-5 w-5" />
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{todayDelivered}</p>
              <p className="text-sm text-slate-500">Delivered Today</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Package className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{myOrders.length}</p>
              <p className="text-sm text-slate-500">In Progress</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <DollarSign className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{formatPrice(todayEarnings)}</p>
              <p className="text-sm text-slate-500">Today's Earnings</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200 dark:border-slate-700">
        <button
          onClick={() => setActiveTab('available')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'available'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          Available ({availableOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('my_orders')}
          className={`px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
            activeTab === 'my_orders'
              ? 'border-indigo-600 text-indigo-600'
              : 'border-transparent text-slate-500 hover:text-slate-700'
          }`}
        >
          My Deliveries ({myOrders.length})
        </button>
      </div>

      {/* Orders List */}
      <div className="space-y-4">
        {displayOrders.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <Truck className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">
                {activeTab === 'available' 
                  ? 'No orders available for pickup' 
                  : 'No active deliveries'}
              </p>
            </CardContent>
          </Card>
        ) : (
          displayOrders.map(order => (
            <Card key={order.order_id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">
                        Order #{order.order_id.slice(0, 8)}
                      </h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                        {order.status.replace('_', ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                      <Clock className="h-3 w-3" />
                      {new Date(order.created_at).toLocaleTimeString()}
                    </p>
                  </div>
                  <p className="font-bold text-indigo-600">{formatPrice(order.total_amount || 0)}</p>
                </div>

                {/* Items */}
                <div className="text-sm text-slate-600 dark:text-slate-400 mb-3">
                  {order.items?.map((item, i) => (
                    <span key={i}>
                      {item.quantity}x {item.name}
                      {i < order.items.length - 1 ? ', ' : ''}
                    </span>
                  )) || 'No items'}
                </div>

                {/* Address */}
                {order.delivery_address && (
                  <div className="flex items-start gap-2 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-lg mb-3">
                    <MapPin className="h-4 w-4 text-slate-400 mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-slate-900 dark:text-white">
                        {order.customer_name || 'Customer'}
                      </p>
                      <p className="text-sm text-slate-500">{order.delivery_address}</p>
                      {order.customer_phone && (
                        <p className="text-sm text-slate-500 flex items-center gap-1 mt-1">
                          <Phone className="h-3 w-3" /> {order.customer_phone}
                        </p>
                      )}
                    </div>
                  </div>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  {activeTab === 'available' && (
                    <button
                      onClick={() => updateOrderStatus(order.order_id, 'picked_up')}
                      className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                    >
                      <Package className="h-4 w-4" />
                      Accept Delivery
                    </button>
                  )}
                  {activeTab === 'my_orders' && (
                    <>
                      <button
                        onClick={() => {/* Open maps */}}
                        className="flex-1 py-2 bg-slate-100 dark:bg-slate-700 hover:bg-slate-200 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-300 font-medium rounded-lg flex items-center justify-center gap-2"
                      >
                        <Navigation className="h-4 w-4" />
                        Navigate
                      </button>
                      <button
                        onClick={() => updateOrderStatus(order.order_id, 'delivered')}
                        className="flex-1 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="h-4 w-4" />
                        Mark Delivered
                      </button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
