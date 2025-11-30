'use client';

import { useState, useEffect } from 'react';
import { useAuth, useAuthenticatedFetch } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { 
  ShoppingCart, 
  Plus, 
  Minus, 
  Trash2, 
  Search,
  MapPin,
  CreditCard,
  Clock,
  ChevronRight,
  X,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface MenuItem {
  item_id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_available: boolean;
}

interface Category {
  category_id: string;
  name: string;
  description?: string;
  items: MenuItem[];
}

interface CartItem {
  item: MenuItem;
  quantity: number;
}

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

export default function OrderPage() {
  const { selectedTenant, tenantUser, isCustomer } = useAuth();
  const authFetch = useAuthenticatedFetch();
  const { formatPrice } = useCurrency();
  
  const [categories, setCategories] = useState<Category[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showCart, setShowCart] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  // Fetch menu data
  useEffect(() => {
    const fetchMenu = async () => {
      if (!selectedTenant) return;
      
      try {
        // Get menus
        const menusRes = await authFetch(`${API_BASE_URL}/menus`);
        if (!menusRes.ok) throw new Error('Failed to fetch menus');
        const menus = await menusRes.json();
        
        if (menus.length === 0) {
          setLoading(false);
          return;
        }

        // Get categories for first menu
        const categoriesRes = await authFetch(`${API_BASE_URL}/menus/${menus[0].menu_id}/categories`);
        if (!categoriesRes.ok) throw new Error('Failed to fetch categories');
        const cats = await categoriesRes.json();

        // Get items for each category
        const categoriesWithItems = await Promise.all(
          cats.map(async (cat: any) => {
            const itemsRes = await authFetch(`${API_BASE_URL}/categories/${cat.category_id}/items`);
            const items = itemsRes.ok ? await itemsRes.json() : [];
            return { ...cat, items };
          })
        );

        setCategories(categoriesWithItems);
        if (categoriesWithItems.length > 0) {
          setSelectedCategory(categoriesWithItems[0].category_id);
        }
      } catch (error) {
        console.error('Failed to fetch menu:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenu();
  }, [selectedTenant, authFetch]);

  // Cart functions
  const addToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(c => c.item.item_id === item.item_id);
      if (existing) {
        return prev.map(c => 
          c.item.item_id === item.item_id 
            ? { ...c, quantity: c.quantity + 1 }
            : c
        );
      }
      return [...prev, { item, quantity: 1 }];
    });
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => prev.filter(c => c.item.item_id !== itemId));
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart(prev => prev.map(c => {
      if (c.item.item_id === itemId) {
        const newQty = c.quantity + delta;
        return newQty > 0 ? { ...c, quantity: newQty } : c;
      }
      return c;
    }).filter(c => c.quantity > 0));
  };

  const cartTotal = cart.reduce((sum, c) => sum + (c.item.price * c.quantity), 0);
  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0);

  const handleCheckout = async () => {
    if (cart.length === 0) {
      alert('Your cart is empty. Please add items before checkout.');
      return;
    }

    try {
      const response = await authFetch(`${API_BASE_URL}/api/tenant/orders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart.map(c => ({
            item_id: c.item.item_id,
            quantity: c.quantity,
            price: c.item.price
          })),
          total_amount: cartTotal + 2.99
        })
      });

      if (response.ok) {
        setOrderPlaced(true);
        setCart([]);
        setTimeout(() => {
          setShowCheckout(false);
          setOrderPlaced(false);
        }, 3000);
      } else {
        const error = await response.json().catch(() => ({ message: 'Checkout failed' }));
        alert(error.error || error.message || 'Failed to place order');
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to place order. Please try again.');
    }
  };

  // Filter items by search
  const filteredCategories = categories.map(cat => ({
    ...cat,
    items: cat.items.filter(item =>
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description?.toLowerCase().includes(searchQuery.toLowerCase())
    )
  })).filter(cat => cat.items.length > 0 || !searchQuery);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white dark:bg-slate-800 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                {selectedTenant?.name || 'Restaurant'}
              </h1>
              <p className="text-sm text-slate-500 flex items-center gap-1">
                <Clock className="h-3 w-3" /> 20-30 min delivery
              </p>
            </div>
            
            {/* Search */}
            <div className="flex-1 max-w-md">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search menu..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-sm"
                />
              </div>
            </div>

            {/* Cart Button */}
            <button
              onClick={() => setShowCart(true)}
              className="relative flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              <span className="font-medium">{formatPrice(cartTotal)}</span>
              {cartCount > 0 && (
                <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </button>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
            {categories.map(cat => (
              <button
                key={cat.category_id}
                onClick={() => setSelectedCategory(cat.category_id)}
                className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${
                  selectedCategory === cat.category_id
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {filteredCategories.map(category => (
          <div key={category.category_id} className="mb-8">
            <h2 className="text-lg font-bold text-slate-900 dark:text-white mb-4">
              {category.name}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {category.items.map(item => (
                <Card key={item.item_id} className="overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="flex">
                    {item.image_url && (
                      <div className="w-32 h-32 bg-slate-200 dark:bg-slate-700 flex-shrink-0">
                        <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <CardContent className="flex-1 p-4">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                      <p className="text-sm text-slate-500 line-clamp-2 mt-1">{item.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="font-bold text-indigo-600">{formatPrice(item.price)}</span>
                        <button
                          onClick={() => addToCart(item)}
                          disabled={!item.is_available}
                          className="p-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          <Plus className="h-4 w-4" />
                        </button>
                      </div>
                    </CardContent>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        ))}

        {categories.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500">No menu items available</p>
          </div>
        )}
      </div>

      {/* Cart Sidebar */}
      {showCart && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowCart(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 shadow-xl flex flex-col">
            <div className="p-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between">
              <h2 className="text-lg font-bold text-slate-900 dark:text-white">Your Cart</h2>
              <button onClick={() => setShowCart(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {cart.length === 0 ? (
                <p className="text-center text-slate-500 py-8">Your cart is empty</p>
              ) : (
                cart.map(cartItem => (
                  <div key={cartItem.item.item_id} className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex-1">
                      <h4 className="font-medium text-slate-900 dark:text-white">{cartItem.item.name}</h4>
                      <p className="text-sm text-indigo-600">{formatPrice(cartItem.item.price * cartItem.quantity)}</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => updateQuantity(cartItem.item.item_id, -1)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                      >
                        <Minus className="h-4 w-4" />
                      </button>
                      <span className="w-8 text-center font-medium">{cartItem.quantity}</span>
                      <button
                        onClick={() => updateQuantity(cartItem.item.item_id, 1)}
                        className="p-1 hover:bg-slate-200 dark:hover:bg-slate-600 rounded"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => removeFromCart(cartItem.item.item_id)}
                        className="p-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-700">
                <div className="flex justify-between mb-4">
                  <span className="text-slate-600 dark:text-slate-400">Subtotal</span>
                  <span className="font-bold text-slate-900 dark:text-white">{formatPrice(cartTotal)}</span>
                </div>
                <button
                  onClick={() => { setShowCart(false); setShowCheckout(true); }}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center justify-center gap-2"
                >
                  Checkout <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {showCheckout && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => !orderPlaced && setShowCheckout(false)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
            {orderPlaced ? (
              <div className="text-center py-8">
                <div className="h-16 w-16 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Check className="h-8 w-8 text-emerald-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Order Placed!</h2>
                <p className="text-slate-500">Your order is being prepared</p>
              </div>
            ) : (
              <>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white mb-6">Checkout</h2>
                
                <div className="space-y-4 mb-6">
                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <MapPin className="h-5 w-5 text-indigo-600" />
                      <span className="font-medium text-slate-900 dark:text-white">Delivery Address</span>
                    </div>
                    <input
                      type="text"
                      placeholder="Enter your address"
                      className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm"
                    />
                  </div>

                  <div className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-center gap-3 mb-2">
                      <CreditCard className="h-5 w-5 text-indigo-600" />
                      <span className="font-medium text-slate-900 dark:text-white">Payment Method</span>
                    </div>
                    <select className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-800 text-sm">
                      <option>Cash on Delivery</option>
                      <option>Credit Card</option>
                    </select>
                  </div>
                </div>

                <div className="border-t border-slate-200 dark:border-slate-700 pt-4 mb-4">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Subtotal</span>
                    <span>{formatPrice(cartTotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-slate-500">Delivery Fee</span>
                    <span>{formatPrice(2.99)}</span>
                  </div>
                  <div className="flex justify-between font-bold text-lg">
                    <span>Total</span>
                    <span className="text-indigo-600">{formatPrice(cartTotal + 2.99)}</span>
                  </div>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl"
                >
                  Place Order
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
