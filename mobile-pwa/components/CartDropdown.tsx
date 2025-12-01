'use client';

import { useState, useEffect } from 'react';
import { ShoppingCart, X } from 'lucide-react';
import { useRouter } from 'next/navigation';

interface CartItem {
  itemId: string;
  name: string;
  description: string;
  price: number;
  quantity: number;
}

interface CartDropdownProps {
  tenant: string;
}

export default function CartDropdown({ tenant }: CartDropdownProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currency, setCurrency] = useState('$');

  // Load cart from localStorage
  useEffect(() => {
    const loadCart = () => {
      try {
        const savedCart = localStorage.getItem(`cart_${tenant}`);
        const savedCurrency = localStorage.getItem(`currency_${tenant}`);
        
        if (savedCart) {
          setCart(JSON.parse(savedCart));
        }
        if (savedCurrency) {
          setCurrency(savedCurrency);
        }
      } catch (error) {
        console.error('Error loading cart:', error);
      }
    };

    loadCart();

    // Reload cart when localStorage changes
    const handleStorageChange = () => loadCart();
    window.addEventListener('storage', handleStorageChange);
    
    // Also check periodically (for same-tab updates)
    const interval = setInterval(loadCart, 1000);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      clearInterval(interval);
    };
  }, [tenant]);

  const calculateTotal = () => {
    return cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const calculateItemCount = () => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  };

  const itemCount = calculateItemCount();

  return (
    <div className="relative">
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 hover:bg-gray-100 rounded-full transition"
      >
        <ShoppingCart className="w-6 h-6 text-gray-700" />
        {itemCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-orange-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
            {itemCount}
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
            <div className="p-4 border-b bg-gray-50">
              <div className="flex items-center justify-between mb-2">
                <h3 className="font-bold text-lg">Your Order</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="p-1 hover:bg-gray-200 rounded-full transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              {cart.length > 0 && (
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to empty your cart?')) {
                      localStorage.removeItem(`cart_${tenant}`);
                      setCart([]);
                      // Dispatch custom event to notify other components
                      window.dispatchEvent(new CustomEvent('cartCleared', { detail: { tenant } }));
                    }
                  }}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold hover:underline"
                >
                  🗑️ Empty cart
                </button>
              )}
            </div>

            {/* Cart Items */}
            {cart.length === 0 ? (
              <div className="p-8 text-center">
                <div className="text-5xl mb-3">🛒</div>
                <p className="text-gray-600 font-medium">Your cart is empty</p>
                <p className="text-sm text-gray-500 mt-1">Add items to get started!</p>
              </div>
            ) : (
              <>
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  {cart.map((item) => (
                    <div key={item.itemId} className="border rounded-lg p-3 bg-gray-50 hover:bg-gray-100 transition">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex-1">
                          <h4 className="font-semibold text-gray-900 text-sm">{item.name}</h4>
                          {item.description && (
                            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Quantity:</span>
                          <span className="font-semibold text-sm bg-white px-2 py-1 rounded">
                            {item.quantity}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-gray-500">
                            {currency}{item.price.toFixed(2)} each
                          </div>
                          <div className="font-bold text-orange-500">
                            {currency}{(item.price * item.quantity).toFixed(2)}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Footer with Total and Actions */}
                <div className="p-4 border-t bg-gray-50">
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-semibold text-gray-700">Total</span>
                    <span className="text-xl font-bold text-orange-500">
                      {currency}{calculateTotal().toFixed(2)}
                    </span>
                  </div>
                  
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setIsOpen(false);
                        router.push(`/${tenant}/cart`);
                      }}
                      className="w-full bg-orange-500 text-white py-3 rounded-lg font-semibold hover:bg-orange-600 transition"
                    >
                      View Cart & Checkout
                    </button>
                    <button
                      onClick={() => setIsOpen(false)}
                      className="w-full bg-white text-gray-700 py-2 rounded-lg font-medium hover:bg-gray-100 transition border"
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}
