'use client';

// admin/src/app/orders/[id]/page.tsx

import { useEffect, useState } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuthenticatedFetch, useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ArrowLeft, RefreshCw, AlertCircle } from 'lucide-react';
import Link from 'next/link';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface OrderItem {
  id?: string | number;
  name?: string;
  quantity?: number;
  price?: number;
  total?: number;
}

interface OrderDetail {
  id: string;
  order_id?: string;
  status: string;
  total: number | string;
  created_at?: string;
  customer_name?: string;
  customer_email?: string;
  items?: OrderItem[];
  [key: string]: any;
}

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const authFetch = useAuthenticatedFetch();
  const { formatPrice } = useCurrency();
  const { isPlatformAdmin, selectedTenant } = useAuth();
  const id = params?.id as string | undefined;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadOrder = async () => {
    if (!id) return;
    
    // Platform admins need a tenant selected
    if (isPlatformAdmin && !selectedTenant) {
      setError('Please select a restaurant from the Restaurants page to view order details');
      setLoading(false);
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/orders/${id}`);

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to load order');
      }

      const data = await res.json();
      setOrder(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load order');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id, selectedTenant]);

  const formatDate = (value?: string) => {
    if (!value) return '-';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return value;
    return d.toLocaleString();
  };

  const formatTotal = (value: number | string) => {
    if (typeof value === 'string') return formatPrice(parseFloat(value) || 0);
    return formatPrice(value);
  };

  const statusVariant = (status: string) => {
    const s = status.toLowerCase();
    if (s.includes('pending')) return 'bg-yellow-100 text-yellow-800';
    if (s.includes('processing')) return 'bg-blue-100 text-blue-800';
    if (s.includes('completed') || s.includes('paid')) return 'bg-green-100 text-green-800';
    if (s.includes('cancel')) return 'bg-red-100 text-red-800';
    return 'bg-gray-100 text-gray-800';
  };

  const updateStatus = async (newStatus: string) => {
    if (!id) return;
    setUpdating(true);
    setError(null);
    try {
      const res = await authFetch(`${API_BASE_URL}/orders/${id}/status`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || 'Failed to update status');
      }

      await loadOrder();
    } catch (err: any) {
      setError(err.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-40" />
        </CardHeader>
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (!order) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Order not found</CardTitle>
          <CardDescription>The requested order could not be loaded.</CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}
          <Button variant="outline" onClick={() => router.push('/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to orders
          </Button>
        </CardContent>
      </Card>
    );
  }

  const orderId = order.order_id || order.id;

  return (
    <Card>
      <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Order {orderId}</CardTitle>
          <CardDescription>
            {order.customer_name ? `Customer: ${order.customer_name}` : 'Order details from backend API'}
          </CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Badge className={statusVariant(order.status)}>{order.status}</Badge>
          <Button
            variant="outline"
            size="icon"
            onClick={loadOrder}
            disabled={loading || updating}
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {error && (
          <div className="mb-2 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 text-sm">
          <div>
            <div className="text-xs text-muted-foreground">Status</div>
            <div className="mt-1 font-medium capitalize">{order.status}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Total</div>
            <div className="mt-1 font-medium">{formatTotal(order.total)}</div>
          </div>
          <div>
            <div className="text-xs text-muted-foreground">Created at</div>
            <div className="mt-1 font-medium">{formatDate(order.created_at)}</div>
          </div>
          {order.customer_email && (
            <div>
              <div className="text-xs text-muted-foreground">Customer email</div>
              <div className="mt-1 font-medium">{order.customer_email}</div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={updating}
            onClick={() => updateStatus('processing')}
          >
            Mark as processing
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={updating}
            onClick={() => updateStatus('completed')}
          >
            Mark as completed
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={updating}
            onClick={() => updateStatus('cancelled')}
          >
            Cancel order
          </Button>
        </div>

        {order.items && order.items.length > 0 && (
          <div className="mt-2">
            <div className="mb-2 text-sm font-semibold">Items</div>
            <div className="space-y-2">
              {order.items.map((item, index) => (
                <div
                  key={item.id ?? index}
                  className="flex items-center justify-between rounded-md border px-3 py-2 text-sm"
                >
                  <div>
                    <div className="font-medium">{item.name ?? 'Item'}</div>
                    <div className="text-xs text-muted-foreground">
                      Qty {item.quantity ?? 1}
                    </div>
                  </div>
                  <div className="text-right">
                    {typeof item.total === 'number'
                      ? formatTotal(item.total)
                      : item.total ?? ''}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pt-2">
          <Button variant="ghost" size="sm" onClick={() => router.push('/orders')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to orders
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
