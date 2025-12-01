'use client';

import { useState, useEffect } from 'react';
import { useAuth, useAuthenticatedFetch } from '@/contexts/AuthContext';
import Link from 'next/link';
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  ArrowLeft,
  FolderOpen,
  ChevronRight,
  X,
  Save,
  GripVertical,
  AlertCircle
} from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { API_ENDPOINTS } from '@/config/api';

interface Category {
  category_id: string;
  name: string;
  description?: string;
  sort_order: number;
  menu_id: string;
  item_count?: number;
}

interface Menu {
  menu_id: string;
  name: string;
}

export default function CategoriesPage() {
  const authFetch = useAuthenticatedFetch();
  const { isPlatformAdmin, selectedTenant } = useAuth();
  
  const [menus, setMenus] = useState<Menu[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedMenu, setSelectedMenu] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    sort_order: 0
  });

  useEffect(() => {
    if (isPlatformAdmin && !selectedTenant) {
      setError('Please select a restaurant from the Restaurants page to view categories');
      setLoading(false);
      return;
    }
    
    const fetchMenus = async () => {
      try {
        const response = await authFetch(API_ENDPOINTS.MENUS.LIST);
        if (response.ok) {
          const data = await response.json();
          
          // If no menus exist, create a default one
          if (data.length === 0) {
            const createRes = await authFetch(API_ENDPOINTS.MENUS.LIST, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ name: 'Main Menu' })
            });
            
            if (createRes.ok) {
              const newMenu = await createRes.json();
              setMenus([newMenu]);
              setSelectedMenu(newMenu.menu_id);
            }
          } else {
            setMenus(data);
            if (!selectedMenu) {
              setSelectedMenu(data[0].menu_id);
            }
          }
        }
      } catch (error) {
        console.error('Failed to fetch menus:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchMenus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant?.tenant_id, isPlatformAdmin]);

  useEffect(() => {
    if (!selectedMenu) return;
    
    const fetchCategories = async () => {
      setLoading(true);
      try {
        const response = await authFetch(API_ENDPOINTS.MENUS.CATEGORIES(selectedMenu));
        if (response.ok) {
          const cats = await response.json();
          // Fetch item count for each category
          const catsWithCount = await Promise.all(
            cats.map(async (cat: Category) => {
              const itemsRes = await authFetch(API_ENDPOINTS.MENUS.CATEGORY_ITEMS(cat.category_id));
              const items = itemsRes.ok ? await itemsRes.json() : [];
              return { ...cat, item_count: items.length };
            })
          );
          setCategories(catsWithCount);
        }
      } catch (error) {
        console.error('Failed to fetch categories:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMenu]);

  const refreshCategories = async () => {
    if (!selectedMenu) return;
    setLoading(true);
    try {
      const response = await authFetch(API_ENDPOINTS.MENUS.CATEGORIES(selectedMenu));
      if (response.ok) {
        const cats = await response.json();
        const catsWithCount = await Promise.all(
          cats.map(async (cat: Category) => {
            const itemsRes = await authFetch(API_ENDPOINTS.MENUS.CATEGORY_ITEMS(cat.category_id));
            const items = itemsRes.ok ? await itemsRes.json() : [];
            return { ...cat, item_count: items.length };
          })
        );
        setCategories(catsWithCount);
      }
    } catch (error) {
      console.error('Failed to fetch categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const payload = {
      name: formData.name,
      description: formData.description || null,
      sort_order: formData.sort_order,
      menu_id: selectedMenu
    };

    try {
      let response;
      if (editingCategory) {
        response = await authFetch(API_ENDPOINTS.ADMIN.CATEGORY_DETAIL(editingCategory.category_id), {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        response = await authFetch(API_ENDPOINTS.ADMIN.CATEGORIES, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      }

      if (response.ok) {
        const savedCategory = await response.json();
        if (editingCategory) {
          setCategories(categories.map(c => 
            c.category_id === editingCategory.category_id ? { ...savedCategory, item_count: c.item_count } : c
          ));
        } else {
          setCategories([...categories, { ...savedCategory, item_count: 0 }]);
        }
        closeModal();
      } else {
        const error = await response.json().catch(() => ({ message: 'Failed to save category' }));
        alert(error.message || 'Failed to save category');
      }
    } catch (error) {
      console.error('Failed to save category:', error);
      alert('Failed to save category. Please try again.');
    }
  };

  const handleDelete = async (categoryId: string) => {
    if (!confirm('Are you sure you want to delete this category? All items in this category will also be deleted.')) return;
    
    try {
      const response = await authFetch(API_ENDPOINTS.ADMIN.CATEGORY_DETAIL(categoryId), {
        method: 'DELETE'
      });
      
      if (response.ok) {
        setCategories(categories.filter(c => c.category_id !== categoryId));
      }
    } catch (error) {
      console.error('Failed to delete category:', error);
    }
  };

  const openCreateModal = () => {
    setEditingCategory(null);
    setFormData({
      name: '',
      description: '',
      sort_order: categories.length
    });
    setShowModal(true);
  };

  const openEditModal = (category: Category) => {
    setEditingCategory(category);
    setFormData({
      name: category.name,
      description: category.description || '',
      sort_order: category.sort_order
    });
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCategory(null);
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && menus.length === 0) {
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
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Categories</h1>
            <p className="text-slate-500">
              {selectedTenant ? `Managing categories for ${selectedTenant.name}` : 'Organize your menu items'}
            </p>
          </div>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Category
        </button>
      </div>

      {/* Menu Selector & Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <select
          value={selectedMenu}
          onChange={(e) => setSelectedMenu(e.target.value)}
          className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
        >
          {menus.map(menu => (
            <option key={menu.menu_id} value={menu.menu_id}>{menu.name}</option>
          ))}
        </select>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800"
          />
        </div>
      </div>

      {/* Categories List */}
      <div className="space-y-3">
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
          </div>
        ) : filteredCategories.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <FolderOpen className="h-12 w-12 text-slate-300 mx-auto mb-3" />
              <p className="text-slate-500">No categories found</p>
              <button
                onClick={openCreateModal}
                className="mt-4 text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Create your first category
              </button>
            </CardContent>
          </Card>
        ) : (
          filteredCategories.map(category => (
            <Card key={category.category_id} className="overflow-hidden">
              <CardContent className="p-4">
                <div className="flex items-center gap-4">
                  <div className="p-2 text-slate-400 cursor-grab">
                    <GripVertical className="h-5 w-5" />
                  </div>
                  
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{category.name}</h3>
                      <span className="px-2 py-0.5 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400 text-xs rounded-full">
                        {category.item_count} items
                      </span>
                    </div>
                    {category.description && (
                      <p className="text-sm text-slate-500 mt-1">{category.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    <Link
                      href={`/menu/items?category=${category.category_id}`}
                      className="flex items-center gap-1 px-3 py-1.5 text-sm text-indigo-600 hover:bg-indigo-50 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    >
                      View Items <ChevronRight className="h-4 w-4" />
                    </Link>
                    <button
                      onClick={() => openEditModal(category)}
                      className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDelete(category.category_id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white dark:bg-slate-800 rounded-2xl shadow-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">
                {editingCategory ? 'Edit Category' : 'Add New Category'}
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
                  placeholder="Category name"
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
                  placeholder="Category description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                  Sort Order
                </label>
                <input
                  type="number"
                  min="0"
                  value={formData.sort_order}
                  onChange={(e) => setFormData({ ...formData, sort_order: parseInt(e.target.value) || 0 })}
                  className="w-full px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900"
                />
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
                  {editingCategory ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
