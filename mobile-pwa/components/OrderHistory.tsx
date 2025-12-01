'use client';

import { useState, useEffect } from 'react';
import { Package, X, Clock } from 'lucide-react';

interface OrderItem {
  itemId: string;
  name: string;
  quantity: number;
  price: number;
}

interface Order {
  orderId: string;
  timestamp: string;
  items: OrderItem[];
  total: number;
  paymentMethod: string;
  status: string;
}

interface OrderHistoryProps {
  tenant: string;
}

export default function OrderHistory({ tenant }: OrderHistoryProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [currency, setCurrency] = useState('$');

  // Load orders from localStorage
  useEffect(() => {
    const loadOrders = () => {
      try {
        const savedOrders = localStorage.getItem(`orders_${tenant}`);
        const savedCurrency = localStorage.getItem(`currency_${tenant}`);
        
        if (savedOrders) {
          setOrders(JSON.parse(savedOrders));
        }
        if (savedCurrency) {
          setCurrency(savedCurrency);
        }
      } catch (error) {
        console.error('Error loading orders:', error);
      }
    };

    loadOrders();

    // Reload orders when localStorage changes
    const handleStorageChange = () => loadOrders();
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically (for same-tab updates)
    const interval = setInterval(loadOrders, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [tenant]);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInMins = Math.floor(diffInMs / 60000);
    
    if (diffInMins < 1) return 'Just now';
    if (diffInMins < 60) return `${diffInMins} min ago`;
    if (diffInMins < 1440) return `${Math.floor(diffInMins / 60)} hours ago`;
    return date.toLocaleDateString();
  };

  const orderCount = orders.length;

  return (
    <div className="relative">
      {/* Orders Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition"
        title="Order History"
      >
        <Package className="w-6 h-6 text-gray-700" />
        {orderCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-green-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {orderCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {isOpen && (
        <>
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40" 
            onClick={() => setIsOpen(false)}
          />
          
          {/* Dropdown Content */}
          <div className="absolute right-0 top-full mt-2 w-96 bg-white rounded-lg shadow-2xl border z-50 max-h-[80vh] overflow-hidden flex flex-col">
            {/* Header */}
            <div className="p-4 border-b flex items-center justify-between bg-gray-50">
              <div>
                <h3 className="font-bold text-lg">Your Orders</h3>
                <p className="text-xs text-gray-500">This session</p>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-200 rounded-full transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Orders List */}
            {orders.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3">📦</div>
                <p className="text-gray-600 font-medium">No orders yet</p>
                <p className="text-sm text-gray-500 mt-1">Place your first order!</p>
              </div>
            ) : (
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {orders.map((order) => (
                  <div key={order.orderId} className="border rounded-lg p-4 bg-gray-50 hover:bg-gray-100 transition">
                    {/* Order Header */}
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-500"></div>
                        <span className="font-semibold text-sm">Order #{order.orderId.slice(-8)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3 h-3" />
                        {formatDate(order.timestamp)}
                      </div>
                    </div>

                    {/* Order Items */}
                    <div className="space-y-2 mb-3">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between text-sm">
                          <span className="text-gray-700">
                            {item.quantity}x {item.name}
                          </span>
                          <span className="text-gray-600">
                            {currency}{(item.price * item.quantity).toFixed(2)}
                          </span>
                        </div>
                      ))}
                    </div>

                    {/* Order Footer */}
                    <div className="flex items-center justify-between pt-3 border-t">
                      <div className="text-xs">
                        <span className="text-gray-500">Payment: </span>
                        <span className="font-medium text-gray-700">
                          {order.paymentMethod === 'pay_on_pickup' ? 'Pay on Pickup' : 'Paid'}
                        </span>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-gray-500">Total</div>
                        <div className="font-bold text-orange-500">
                          {currency}{order.total.toFixed(2)}
                        </div>
                      </div>
                    </div>

                    {/* Status Badge */}
                    <div className="mt-3">
                      <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                        ⏳ Preparing
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}
            {orders.length > 0 && (
              <div className="p-4 border-t bg-gray-50">
                <div className="text-center text-sm text-gray-600">
                  <p className="font-semibold">{orderCount} order{orderCount !== 1 ? 's' : ''} placed today</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Total spent: {currency}{orders.reduce((sum, o) => sum + o.total, 0).toFixed(2)}
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
