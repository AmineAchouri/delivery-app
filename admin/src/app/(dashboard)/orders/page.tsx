// admin/src/app/orders/page.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthenticatedFetch, useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Order {
  id: string;
  order_id?: string; // backend might use order_id
  status: string;
  total: number | string;
  created_at?: string;
  customer_name?: string;
}

export default function OrdersPage() {
  const router = useRouter();
  const authFetch = useAuthenticatedFetch();
  const { formatPrice } = useCurrency();
  const { selectedTenant, isPlatformAdmin } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadOrders = async () => {
    // Platform admins need a tenant selected to view orders
    if (isPlatformAdmin && !selectedTenant) {
      setError('Please select a restaurant from the Restaurants page to view orders');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      // Use tenant API endpoint which works for both platform admins and tenant users
      const res = await authFetch(`${API_BASE_URL}/api/tenant/orders`);

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.message || data?.error || 'Failed to load orders');
      }

      const data = await res.json();
      const items: Order[] = (data.data || []).map((o: any) => ({
        id: o.id,
        order_id: o.id,
        status: o.status,
        total: o.total,
        created_at: o.createdAt,
        customer_name: o.customer
      }));
      setOrders(items);
    } catch (err: any) {
      setError(err.message || 'Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant]);

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

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <CardTitle>Orders</CardTitle>
          <CardDescription>Live orders fetched from the backend API.</CardDescription>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={loadOrders} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </div>
        )}

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-10 w-full" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="py-10 text-center text-sm text-muted-foreground">
            No orders found.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Order</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {orders.map((order) => {
                  const id = order.order_id || order.id;
                  return (
                    <TableRow key={id} className="hover:bg-muted/60 cursor-pointer" onClick={() => router.push(`/orders/${id}`)}>
                      <TableCell className="font-medium">{id}</TableCell>
                      <TableCell>
                        <Badge className={statusVariant(order.status)}>{order.status}</Badge>
                      </TableCell>
                      <TableCell>{formatTotal(order.total)}</TableCell>
                      <TableCell>{formatDate(order.created_at)}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="icon">
                          <ChevronRight className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
