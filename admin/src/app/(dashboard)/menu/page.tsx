'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuthenticatedFetch, useAuth } from '@/contexts/AuthContext';
import { FeatureGuard } from '@/components/FeatureGuard';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Plus, 
  RefreshCw, 
  FolderOpen, 
  Tag, 
  ChevronRight,
  UtensilsCrossed,
  AlertCircle
} from 'lucide-react';

const API_BASE_URL = '/api';

interface Category {
  category_id: string;
  name: string;
  item_count?: number;
}

interface Menu {
  id: string;
  menu_id?: string; // legacy support
  name: string;
  description?: string;
}

export default function MenuPage() {
  return (
    <FeatureGuard featureKey="MENU">
      <MenuPageContent />
    </FeatureGuard>
  );
}

function MenuPageContent() {
  const authFetch = useAuthenticatedFetch();
  const { selectedTenant, isPlatformAdmin } = useAuth();
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isPlatformAdmin && !selectedTenant) {
      setError('Please select a restaurant from the Restaurants page to view menu');
      setLoading(false);
      return;
    }
    
    const loadData = async () => {
      setLoading(true);
      try {
        const menusRes = await authFetch(`${API_BASE_URL}/tenant/menu`);
        if (menusRes.ok) {
          let menusData = await menusRes.json();
          
          // If no menus exist, create a default one
          if (menusData.length === 0) {
            const createRes = await authFetch(`${API_BASE_URL}/tenant/menu`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'Main Menu' })
            });
            
            if (createRes.ok) {
              const newMenu = await createRes.json();
              menusData = [newMenu];
            }
          }
          
          setMenus(menusData);

          if (menusData.length > 0 && menusData[0].categories) {
            // Categories and items are already included in menu response
            const cats = menusData[0].categories;
            let total = 0;
            const catsWithCount = cats.map((cat: any) => {
              const itemCount = cat.items?.length || 0;
              total += itemCount;
              return { 
                category_id: cat.id, 
                name: cat.name, 
                item_count: itemCount 
              };
            });
            setCategories(catsWithCount);
            setTotalItems(total);
          }
        }
      } catch (error) {
        console.error('Failed to load menu data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant?.tenant_id, isPlatformAdmin]);
  
  const refreshData = async () => {
    setLoading(true);
    try {
      const menusRes = await authFetch(`${API_BASE_URL}/tenant/menu`);
      if (menusRes.ok) {
        const menusData = await menusRes.json();
        setMenus(menusData);

        if (menusData.length > 0 && menusData[0].categories) {
          // Categories and items are already included in menu response
          const cats = menusData[0].categories;
          let total = 0;
          const catsWithCount = cats.map((cat: any) => {
            const itemCount = cat.items?.length || 0;
            total += itemCount;
            return { 
              category_id: cat.id, 
              name: cat.name, 
              item_count: itemCount 
            };
          });
          setCategories(catsWithCount);
          setTotalItems(total);
        }
      }
    } catch (error) {
      console.error('Failed to load menu data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <AlertCircle className="h-12 w-12 text-amber-500" />
        <p className="text-lg text-gray-600">{error}</p>
        <Link href="/restaurants">
          <Button>Go to Restaurants</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Menu Management</h1>
          <p className="text-slate-500">
            {selectedTenant ? `Managing menu for ${selectedTenant.name}` : 'Manage your restaurant menu'}
          </p>
        </div>
        <button
          onClick={refreshData}
          className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <RefreshCw className={`h-5 w-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <UtensilsCrossed className="h-5 w-5 text-indigo-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{menus.length}</p>
              <p className="text-sm text-slate-500">Menus</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <FolderOpen className="h-5 w-5 text-emerald-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{categories.length}</p>
              <p className="text-sm text-slate-500">Categories</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Tag className="h-5 w-5 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{totalItems}</p>
              <p className="text-sm text-slate-500">Items</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Link href="/menu/categories">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                    <FolderOpen className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Manage Categories</h3>
                    <p className="text-sm text-slate-500">Organize your menu structure</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </Link>

        <Link href="/menu/items">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                    <Tag className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 dark:text-white">Manage Items</h3>
                    <p className="text-sm text-slate-500">Add and edit menu items</p>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-slate-400" />
              </div>
            </CardContent>
          </Card>
        </Link>
      </div>

      {/* Categories Overview */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Categories</h2>
            <Link 
              href="/menu/categories"
              className="text-sm text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              View All <ChevronRight className="h-4 w-4" />
            </Link>
          </div>
          
          {categories.length === 0 ? (
            <div className="text-center py-8">
              <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No categories yet</p>
              <Link 
                href="/menu/categories"
                className="mt-2 inline-block text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Create your first category
              </Link>
            </div>
          ) : (
            <div className="space-y-2">
              {categories.slice(0, 5).map(category => (
                <Link
                  key={category.category_id}
                  href={`/menu/items?category=${category.category_id}`}
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-lg bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                      <FolderOpen className="h-4 w-4 text-slate-500" />
                    </div>
                    <span className="font-medium text-slate-900 dark:text-white">{category.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-slate-500">{category.item_count} items</span>
                    <ChevronRight className="h-4 w-4 text-slate-400" />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
