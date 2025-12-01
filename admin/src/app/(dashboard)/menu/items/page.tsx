'use client';

import { useState, useEffect } from 'react';
import { useAuth, useAuthenticatedFetch } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  ArrowLeft,
  Image as ImageIcon,
  DollarSign,
  Tag,
  ToggleLeft,
  ToggleRight,
  X,
  Save,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface MenuItem {
  item_id: string;
  name: string;
  description: string;
  price: number;
  image_url?: string;
  is_available: boolean;
  category_id: string;
}

interface Category {
  category_id: string;
  name: string;
}

const API_BASE_URL = '';

export default function MenuItemsPage() {
  const { isTenantOwner, isPlatformAdmin, selectedTenant } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const authFetch = useAuthenticatedFetch();
  const { formatPrice, symbol } = useCurrency();
  
  const categoryId = searchParams.get('category');
  
  const [items, setItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<MenuItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    image_url: '',
    is_available: true,
    category_id: categoryId || ''
  });

  useEffect(() => {
    if (isPlatformAdmin && !selectedTenant) {
      setError('Please select a restaurant from the Restaurants page to view menu items');
      setLoading(false);
      return;
    }
    
    const fetchData = async () => {
      try {
        // Fetch menus first
        const menusRes = await authFetch(`${API_BASE_URL}/api/tenant/menu`);
        if (!menusRes.ok) throw new Error('Failed to fetch menus');
        let menus = await menusRes.json();
        
        // If no menus exist, create a default one
        if (menus.length === 0) {
          const createRes = await authFetch(`${API_BASE_URL}/api/tenant/menu`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name: 'Main Menu' })
          });
          
          if (createRes.ok) {
            const newMenu = await createRes.json();
            menus = [newMenu];
          } else {
            setLoading(false);
            return;
          }
        }

        // Fetch categories
        const catsRes = await authFetch(`${API_BASE_URL}/api/tenant/menu/${menus[0].menu_id}/categories`);
        if (catsRes.ok) {
          const cats = await catsRes.json();
          setCategories(cats);
          
          // If no category selected, use first one
          const targetCategoryId = categoryId || cats[0]?.category_id;
          if (targetCategoryId) {
            setFormData(prev => ({ ...prev, category_id: targetCategoryId }));
            
            // Fetch items for category
            const itemsRes = await authFetch(`${API_BASE_URL}/categories/${targetCategoryId}/items`);
            if (itemsRes.ok) {
              setItems(await itemsRes.json());
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant?.tenant_id, categoryId, isPlatformAdmin]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      description: formData.description,
      price: parseFloat(formData.price),
      image_url: formData.image_url || null,
      is_available: formData.is_available,
      category_id: formData.category_id
    };

    try {
      let response;
      if (editingItem) {
        response = await authFetch(`${API_BASE_URL}/admin/items/${editingItem.item_id}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await authFetch(`${API_BASE_URL}/admin/items`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const savedItem = await response.json();
        if (editingItem) {
          setItems(items.map(i => i.item_id === editingItem.item_id ? savedItem : i));
        } else {
          setItems([...items, savedItem]);
        }
        closeModal();
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to save item' }));
        alert(error.message || 'Failed to save item');
      }
    } catch (error) {
      console.error('Failed to save item:', error);
      alert('Failed to save item. Please try again.');
    }
  };

  const handleDelete = async (itemId: string) => {
    if (!confirm('Are you sure you want to delete this item?')) return;
    
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/items/${itemId}`, {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setItems(items.filter(i => i.item_id !== itemId));
      }
    } catch (error) {
      console.error('Failed to delete item:', error);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/admin/items/${item.item_id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_available: !item.is_available })
      });
      
      if (response.ok) {
        setItems(items.map(i => 
          i.item_id === item.item_id ? { ...i, is_available: !i.is_available } : i
        ));
      }
    } catch (error) {
      console.error('Failed to toggle availability:', error);
    }
  };

  const openCreateModal = () => {
    setEditingItem(null);
    setFormData({
      name: '',
      description: '',
      price: '',
      image_url: '',
      is_available: true,
      category_id: categoryId || categories[0]?.category_id || ''
    });
    setShowModal(true);
  };

  const openEditModal = (item: MenuItem) => {
    setEditingItem(item);
    setFormData({
      name: item.name,
      description: item.description || '',
      price: item.price.toString(),
      image_url: item.image_url || '',
      is_available: item.is_available,
      category_id: item.category_id
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingItem(null);
  };

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    item.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

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
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link 
            href="/menu"
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Menu Items</h1>
            <p className="text-slate-500">
              {selectedTenant ? `Managing items for ${selectedTenant.name}` : 'Manage your menu items'}
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Item
        </button>
      </div>

      {/* Category Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={formData.category_id}
          onChange={(e) => {
            setFormData(prev => ({ ...prev, category_id: e.target.value }));
            router.push(`/menu/items?category=${e.target.value}`);
          }}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          {categories.map(cat => (
            <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
          ))}
        </select>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search items..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {/* Items Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredItems.map(item => (
          <Card key={item.item_id} className={`overflow-hidden ${!item.is_available ? 'opacity-60' : ''}`}>
            {item.image_url ? (
              <div className="h-40 bg-slate-200 dark:bg-slate-700">
                <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
              </div>
            ) : (
              <div className="h-40 bg-slate-100 dark:bg-slate-700 flex items-center justify-center">
                <ImageIcon className="h-12 w-12 text-slate-300" />
              </div>
            )}
            <CardContent className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h3 className="font-semibold text-slate-900 dark:text-white">{item.name}</h3>
                  <p className="text-sm text-slate-500 line-clamp-2">{item.description}</p>
                </div>
                <span className="font-bold text-indigo-600">{formatPrice(item.price)}</span>
              </div>
              
              <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-700">
                <button
                  onClick={() => toggleAvailability(item)}
                  className={`flex items-center gap-1 text-sm ${
                    item.is_available ? 'text-emerald-600' : 'text-slate-400'
                  }`}
                >
                  {item.is_available ? (
                    <><ToggleRight className="h-5 w-5" /> Available</>
                  ) : (
                    <><ToggleLeft className="h-5 w-5" /> Unavailable</>
                  )}
                </button>
                <div className="flex gap-1">
                  <button
                    onClick={() => openEditModal(item)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(item.item_id)}
                    className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredItems.length === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Tag className="h-12 w-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-500">No items found</p>
            <button
              onClick={openCreateModal}
              className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Add your first item
            </button>
          </CardContent>
        </Card>
      )}

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative w-full max-w-lg bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingItem ? 'Edit Item' : 'Add New Item'}
              </h2>
              <button onClick={closeModal} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Name *
                </label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  placeholder="Item name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  placeholder="Item description"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Price ({symbol}) *
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 font-medium">{symbol}</span>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                      required
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Category *
                  </label>
                  <select
                    value={formData.category_id}
                    onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                    required
                    className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  >
                    {categories.map(cat => (
                      <option key={cat.category_id} value={cat.category_id}>{cat.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Image URL
                </label>
                <input
                  type="url"
                  value={formData.image_url}
                  onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                  placeholder="https://example.com/image.jpg"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, is_available: !formData.is_available })}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                    formData.is_available 
                      ? 'bg-emerald-100 text-emerald-700' 
                      : 'bg-slate-100 text-slate-600'
                  }`}
                >
                  {formData.is_available ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                  {formData.is_available ? 'Available' : 'Unavailable'}
                </button>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  type="button"
                  onClick={closeModal}
                  className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" />
                  {editingItem ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
