'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Image from 'next/image';
import { ShoppingCart, Search, ChevronRight } from 'lucide-react';
import CartDropdown from '@/components/CartDropdown';
import OrderHistory from '@/components/OrderHistory';

interface MenuItem {
  itemId: string;
  name: string;
  description?: string;
  price: number;
  image?: string;
  isAvailable: boolean;
}

interface Category {
  categoryId: string;
  name: string;
  description?: string;
  image?: string;
  items: MenuItem[];
}

interface Menu {
  menuId: string;
  name: string;
  categories: Category[];
}

interface TenantData {
  tenantId: string;
  tenantName: string;
  currency: string;
  menus: Menu[];
}

export default function MenuPage() {
  const params = useParams();
  const router = useRouter();
  const tenant = params.tenant as string;
  
  const [menuData, setMenuData] = useState<TenantData | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [cart, setCart] = useState<{ [key: string]: number }>({});

  useEffect(() => {
    const loadMenu = async () => {
      try {
        const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                          'http://localhost:3000';
        
        // First, get tenant config to resolve tenant slug to UUID
        // Convert slug (bella-italia) to domain format
        const domain = `${tenant}.com`;
        const configResponse = await fetch(`${backendUrl}/api/public/tenant/config?domain=${domain}`);
        if (!configResponse.ok) throw new Error('Tenant not found');
        
        const config = await configResponse.json();
        const tenantId = config.tenantId; // This is the UUID
        
        // Now fetch the menu using the UUID
        const response = await fetch(`${backendUrl}/api/public/tenant/menu?tenantId=${tenantId}`);
        
        if (!response.ok) throw new Error('Failed to load menu');
        
        const data = await response.json();
        setMenuData(data);
        
        // Select first category by default
        if (data.menus.length > 0 && data.menus[0].categories.length > 0) {
          setSelectedCategory(data.menus[0].categories[0].categoryId);
        }
      } catch (error) {
        console.error('Error loading menu:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMenu();

    // Listen for cart cleared event from dropdown
    const handleCartCleared = (event: CustomEvent) => {
      if (event.detail?.tenant === tenant) {
        setCart({});
      }
    };

    window.addEventListener('cartCleared', handleCartCleared as EventListener);

    return () => {
      window.removeEventListener('cartCleared', handleCartCleared as EventListener);
    };
  }, [tenant]);

  const addToCart = (itemId: string) => {
    if (!menuData) return;

    // Find the item details
    let itemDetails = null;
    for (const menu of menuData.menus) {
      for (const category of menu.categories) {
        const found = category.items.find(i => i.itemId === itemId);
        if (found) {
          itemDetails = found;
          break;
        }
      }
      if (itemDetails) break;
    }

    if (!itemDetails) return;

    // Load existing cart from localStorage
    const savedCart = localStorage.getItem(`cart_${tenant}`);
    const cartItems = savedCart ? JSON.parse(savedCart) : [];

    // Check if item already in cart
    const existingIndex = cartItems.findIndex((item: any) => item.itemId === itemId);
    if (existingIndex >= 0) {
      cartItems[existingIndex].quantity += 1;
    } else {
      cartItems.push({
        itemId: itemDetails.itemId,
        name: itemDetails.name,
        description: itemDetails.description,
        price: itemDetails.price,
        quantity: 1
      });
    }

    // Save to localStorage
    localStorage.setItem(`cart_${tenant}`, JSON.stringify(cartItems));
    localStorage.setItem(`tenantName_${tenant}`, menuData.tenantName);
    localStorage.setItem(`currency_${tenant}`, menuData.currency);

    // Update local state for UI
    setCart(prev => ({
      ...prev,
      [itemId]: (prev[itemId] || 0) + 1
    }));
  };

  const cartCount = Object.values(cart).reduce((sum, qty) => sum + qty, 0);

  const filteredItems = menuData?.menus[0]?.categories
    .find(cat => cat.categoryId === selectedCategory)
    ?.items.filter(item => 
      item.name.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🍕</div>
          <div className="flex items-center justify-center gap-2 mb-4">
            <span className="text-4xl animate-pulse" style={{ animationDelay: '0s' }}>🍝</span>
            <span className="text-4xl animate-pulse" style={{ animationDelay: '0.2s' }}>🍔</span>
            <span className="text-4xl animate-pulse" style={{ animationDelay: '0.4s' }}>🍰</span>
          </div>
          <p className="text-lg font-semibold text-gray-700">Preparing your menu...</p>
          <p className="text-sm text-gray-500 mt-2">Almost ready! 🧑‍🍳</p>
        </div>
      </div>
    );
  }

  if (!menuData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <p className="text-gray-600">Menu not available</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header with Auth Buttons */}
      <div className="bg-white border-b sticky top-0 z-10 shadow-sm">
        <div className="max-w-7xl mx-auto px-4">
          {/* Top Bar with Auth and Cart */}
          <div className="flex items-center justify-between py-3 border-b">
            <div className="flex items-center gap-2">
              <span className="text-2xl">🍕</span>
              <span className="font-bold text-lg">{menuData.tenantName}</span>
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
          
          {/* Menu Title */}
          <div className="py-4">
            <h1 className="text-2xl font-bold text-gray-900">Menu</h1>
            <p className="text-sm text-gray-600">Order for pickup or delivery</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
          <input
            type="text"
            placeholder="Search menu items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-transparent"
          />
        </div>
      </div>

      {/* Categories */}
      <div className="max-w-7xl mx-auto px-4 mb-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {menuData.menus[0]?.categories.map((category) => (
            <button
              key={category.categoryId}
              onClick={() => setSelectedCategory(category.categoryId)}
              className={`px-4 py-2 rounded-full whitespace-nowrap transition ${
                selectedCategory === category.categoryId
                  ? 'bg-orange-500 text-white'
                  : 'bg-white text-gray-700 hover:bg-gray-100'
              }`}
            >
              {category.name}
            </button>
          ))}
        </div>
      </div>

      {/* Menu Items */}
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item.itemId}
              className="bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition"
            >
              {item.image && (
                <div className="relative h-48 bg-gray-200">
                  <Image
                    src={item.image}
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                  />
                </div>
              )}
              <div className="p-4">
                <h3 className="font-semibold text-gray-900 mb-1">{item.name}</h3>
                {item.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{item.description}</p>
                )}
                <div className="flex items-center justify-between">
                  <span className="text-lg font-bold text-orange-500">
                    {menuData.currency} {item.price.toFixed(2)}
                  </span>
                  <button
                    onClick={() => addToCart(item.itemId)}
                    disabled={!item.isAvailable}
                    className={`px-4 py-2 rounded-lg font-medium transition ${
                      item.isAvailable
                        ? 'bg-orange-500 text-white hover:bg-orange-600'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {item.isAvailable ? 'Add' : 'Unavailable'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {filteredItems.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No items found</p>
          </div>
        )}
      </div>

      {/* Floating Cart Button */}
      {cartCount > 0 && (
        <button
          onClick={() => router.push(`/${tenant}/cart`)}
          className="fixed bottom-6 right-6 bg-orange-500 text-white rounded-full p-4 shadow-lg hover:bg-orange-600 transition flex items-center gap-2"
        >
          <ShoppingCart className="w-6 h-6" />
          <span className="font-bold">{cartCount}</span>
          <ChevronRight className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}
