'use client';

import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { ShoppingCart, Plus, Minus, Trash2, ArrowLeft } from 'lucide-react';
import CartDropdown from '@/components/CartDropdown';
import OrderHistory from '@/components/OrderHistory';

interface CartItem {
  itemId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

export default function CartPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [tenantName, setTenantName] = useState('Restaurant');
  const [currency, setCurrency] = useState('$');

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem(`cart_${tenant}`);
        const savedTenantName = localStorage.getItem(`tenantName_${tenant}`);
        const savedCurrency = localStorage.getItem(`currency_${tenant}`);
        
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
        if (savedTenantName) {
          setTenantName(savedTenantName);
        }
        if (savedCurrency) {
          setCurrency(savedCurrency);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };

    loadCart();

    // Listen for cart cleared event from dropdown
    const handleCartCleared = (event: CustomEvent) => {
      if (event.detail?.tenant === tenant) {
        setCart([]);
      }
    };

    window.addEventListener('cartCleared', handleCartCleared as EventListener);

    return () => {
      window.removeEventListener('cartCleared', handleCartCleared as EventListener);
    };
  }, [tenant]);

  // Save cart to localStorage
  const saveCart = (newCart: CartItem[]) => {
    localStorage.setItem(`cart_${tenant}`, JSON.stringify(newCart));
    setCart(newCart);
  };

  const updateQuantity = (itemId: string, delta: number) => {
    const newCart = cart.map(item => {
      if (item.itemId === itemId) {
        const newQuantity = Math.max(0, item.quantity + delta);
        return { ...item, quantity: newQuantity };
      }
      return item;
    }).filter(item => item.quantity > 0);
    
    saveCart(newCart);
  };

  const removeItem = (itemId: string) => {
    const newCart = cart.filter(item => item.itemId !== itemId);
    saveCart(newCart);
  };

  const clearCart = () => {
    saveCart([]);
  };

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50">
        {/* Header */}
        <div className="bg-white shadow-sm sticky top-0 z-10">
          <div className="max-w-2xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/${tenant}/menu`)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-xl font-bold">Cart</h1>
            </div>
          </div>
        </div>

        {/* Empty Cart */}
        <div className="flex flex-col items-center justify-center min-h-[70vh] px-4">
          <div className="text-6xl mb-4">🛒</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Your cart is empty</h2>
          <p className="text-gray-600 text-center mb-6">
            Add some delicious items from the menu!
          </p>
          <button
            onClick={() => router.push(`/${tenant}/menu`)}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition font-medium"
          >
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-32">
      {/* Header with Auth Buttons */}
      <div className="bg-white shadow-sm sticky top-0 z-10 border-b">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Bar with Auth and Cart */}
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍕</span>
              <span className="font-bold text-lg">{tenantName}</span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => alert('Sign In coming soon!\n\nYou can place orders as a guest for now.')}
                className="px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-100 rounded-full transition"
              >
                Sign in
              </button>
              <button
                onClick={() => alert('Join coming soon!\n\nCreate an account to track orders and save favorites.')}
                className="px-4 py-2 text-sm font-semibold bg-black text-white hover:bg-gray-800 rounded-full transition"
              >
                Join now
              </button>
              <div className="h-8 w-px bg-gray-300" />
              <OrderHistory tenant={tenant} />
              <CartDropdown tenant={tenant} />
            </div>
          </div>
          
          {/* Cart Title Bar */}
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push(`/${tenant}/menu`)}
                className="p-2 hover:bg-gray-100 rounded-full transition"
              >
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h1 className="text-2xl font-bold">Your Cart</h1>
            </div>
            <button
              onClick={clearCart}
              className="text-sm text-red-500 hover:text-red-600 font-semibold underline"
            >
              Clear All
            </button>
          </div>
        </div>
      </div>

      {/* Cart Items */}
      <div className="max-w-2xl mx-auto px-4 py-6">
        <div className="bg-white rounded-lg shadow-sm divide-y">
          {cart.map((item) => (
            <div key={item.itemId} className="p-4">
              <div className="flex justify-between items-start mb-3">
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{item.name}</h3>
                  {item.description && (
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">
                      {item.description}
                    </p>
                  )}
                  <p className="text-orange-500 font-semibold mt-2">
                    {currency}{item.price.toFixed(2)}
                  </p>
                </div>
                <button
                  onClick={() => removeItem(item.itemId)}
                  className="p-2 text-gray-400 hover:text-red-500 transition"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>

              {/* Quantity Controls */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 bg-gray-100 rounded-lg px-2 py-1">
                  <button
                    onClick={() => updateQuantity(item.itemId, -1)}
                    className="p-1 hover:bg-white rounded transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="font-semibold w-8 text-center">{item.quantity}</span>
                  <button
                    onClick={() => updateQuantity(item.itemId, 1)}
                    className="p-1 hover:bg-white rounded transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-right">
                  <span className="text-gray-500 text-sm">Subtotal: </span>
                  <span className="font-bold text-gray-900">
                    {currency}{(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
          <h2 className="font-bold text-lg mb-4">Order Summary</h2>
          
          <div className="space-y-2 mb-4">
            <div className="flex justify-between text-gray-600">
              <span>Items ({calculateItemCount()})</span>
              <span>{currency}{calculateTotal().toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-gray-600">
              <span>Delivery Fee</span>
              <span className="text-green-600 font-medium">FREE</span>
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="flex justify-between text-lg font-bold">
              <span>Total</span>
              <span className="text-orange-500">{currency}{calculateTotal().toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Order Actions (Fixed) */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-lg p-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center justify-between mb-3">
            <span className="text-gray-600 font-medium">Total Amount:</span>
            <span className="text-2xl font-bold text-orange-500">
              {currency}{calculateTotal().toFixed(2)}
            </span>
          </div>
          
          <div className="space-y-2">
            {/* Place Order - Pay on Pickup */}
            <button
              onClick={() => {
                // Create order object
                const order = {
                  orderId: `ORD-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                  tenantId: tenant,
                  items: cart,
                  total: calculateTotal(),
                  paymentMethod: 'pay_on_pickup',
                  status: 'preparing',
                  timestamp: new Date().toISOString()
                };
                
                // Save order to localStorage
                try {
                  const existingOrders = localStorage.getItem(`orders_${tenant}`);
                  const orders = existingOrders ? JSON.parse(existingOrders) : [];
                  orders.unshift(order); // Add new order at the beginning
                  localStorage.setItem(`orders_${tenant}`, JSON.stringify(orders));
                } catch (error) {
                  console.error('Error saving order:', error);
                }
                
                // Show confirmation
                alert(`✅ Order Placed Successfully!\n\nOrder #${order.orderId.slice(-8)}\nTotal: ${currency}${calculateTotal().toFixed(2)}\n\n💵 Payment Method: Pay on Pickup\n\nThank you! Your order will be ready soon.\n\nCheck your order history (📦) to track it!`);
                
                // Clear cart
                clearCart();
                
                // Redirect to menu
                router.push(`/${tenant}/menu`);
              }}
              className="w-full bg-orange-500 text-white py-4 rounded-lg font-bold text-base hover:bg-orange-600 transition flex items-center justify-center gap-2"
            >
              <ShoppingCart className="w-5 h-5" />
              Place Order - Pay on Pickup
            </button>

            {/* Pay Now (Coming Soon) */}
            <button
              onClick={() => {
                alert('💳 Online Payment Coming Soon!\n\nFor now, please use "Pay on Pickup" option.');
              }}
              className="w-full bg-gray-200 text-gray-700 py-4 rounded-lg font-bold text-base hover:bg-gray-300 transition flex items-center justify-center gap-2 relative"
            >
              <span>💳 Pay Now</span>
              <span className="absolute top-2 right-2 text-xs bg-yellow-400 text-yellow-900 px-2 py-1 rounded-full font-normal">
                Coming Soon
              </span>
            </button>
          </div>
          
          <p className="text-center text-xs text-gray-500 mt-3">
            Online payment will be available soon
          </p>
        </div>
      </div>
    </div>
  );
}
