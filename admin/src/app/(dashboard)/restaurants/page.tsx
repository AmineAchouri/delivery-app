'use client';

import { useState, useEffect } from 'react';
import { useAuth, useAuthenticatedFetch } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Plus, 
  Search, 
  Edit, 
  ToggleLeft, 
  ToggleRight,
  ShoppingBag,
  Globe,
  Check,
  X,
  Trash2,
  AlertTriangle,
  MoreVertical
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface TenantFeature {
  key: string;
  enabled: boolean;
  description: string | null;
}

interface TenantAdmin {
  id: string;
  email: string;
  name: string;
  type: 'platform_admin' | 'restaurant_admin';
  role: string;
  status: string;
  createdAt: string;
}

interface Tenant {
  id: string;
  name: string;
  domain: string;
  status: string;
  currencyCode: string;
  createdAt: string;
  features: TenantFeature[];
  stats: {
    admins: number;
    orders: number;
    menus: number;
  };
}

const API_BASE_URL = '/api';

export default function RestaurantsPage() {
  const { isSuperAdmin } = useAuth();
  const router = useRouter();
  const authFetch = useAuthenticatedFetch();
  
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showFeaturesModal, setShowFeaturesModal] = useState<Tenant | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState<Tenant | null>(null);
  const [deleteConfirmName, setDeleteConfirmName] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [showUsersModal, setShowUsersModal] = useState<Tenant | null>(null);
  const [tenantAdmins, setTenantAdmins] = useState<TenantAdmin[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [platformAdmins, setPlatformAdmins] = useState<{ id: string; name: string; email: string }[]>([]);

  useEffect(() => {
    if (isSuperAdmin === false) {
      router.push('/dashboard');
    }
  }, [isSuperAdmin, router]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch tenants and platform admins in parallel
        const [tenantsRes, adminsRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/api/platform-admin/tenants`),
          authFetch(`${API_BASE_URL}/api/platform-admin/admins`)
        ]);
        
        if (tenantsRes.ok) {
          const data = await tenantsRes.json();
          setTenants(Array.isArray(data) ? data : []);
        }
        
        if (adminsRes.ok) {
          const admins = await adminsRes.json();
          // Only show PLATFORM_ADMIN (not SUPER_ADMIN) for assignment
          setPlatformAdmins(admins.filter((a: any) => a.role === 'PLATFORM_ADMIN'));
        }
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authFetch]);

  const filteredTenants = tenants.filter(tenant =>
    tenant.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tenant.domain.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateTenant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const assignToAdminId = formData.get('assignToAdmin') as string;
    
    try {
      const response = await authFetch(`${API_BASE_URL}/api/platform-admin/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.get('name'),
          domain: formData.get('domain'),
          currencyCode: formData.get('currencyCode') || 'USD',
          ownerEmail: formData.get('ownerEmail') || undefined,
          ownerPassword: formData.get('ownerPassword') || undefined,
          assignToAdminId: assignToAdminId || undefined,
        }),
      });
      if (response.ok) {
        const newTenant = await response.json();
        console.log('Created tenant:', newTenant);
        // Add the new tenant with proper format
        const formattedTenant: Tenant = {
          id: newTenant.id,
          name: newTenant.name,
          domain: newTenant.domain,
          status: newTenant.status,
          currencyCode: newTenant.currencyCode,
          createdAt: new Date().toISOString(),
          features: [],
          stats: { admins: 1, orders: 0, menus: 0 }
        };
        setTenants([formattedTenant, ...tenants]);
        setShowCreateModal(false);
        
        // Show owner credentials
        if (newTenant.owner) {
          alert(`Restaurant created successfully!\n\nOwner Login Credentials:\nTenant ID: ${newTenant.id}\nEmail: ${newTenant.owner.email}\nPassword: ${newTenant.owner.password}`);
        }
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to create tenant:', response.status, errorData);
        alert(errorData.error || 'Failed to create tenant');
      }
    } catch (error) {
      console.error('Failed to create tenant:', error);
      alert('Failed to create tenant');
    }
  };

  const handleViewUsers = async (tenant: Tenant) => {
    setShowUsersModal(tenant);
    setLoadingUsers(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/platform-admin/tenants/${tenant.id}/users`);
      if (response.ok) {
        const admins = await response.json();
        setTenantAdmins(admins);
      } else {
        const errorData = await response.json().catch(() => ({}));
        console.error('Failed to load admins:', response.status, errorData);
        alert(errorData.error || 'Failed to load admins');
      }
    } catch (error) {
      console.error('Failed to fetch admins:', error);
      alert('Failed to load admins');
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleUpdateStatus = async (id: string, status: string) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/platform-admin/tenants/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      if (response.ok) {
        setTenants(tenants.map(t => t.id === id ? { ...t, status } : t));
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to update status');
      }
    } catch (error) {
      console.error('Failed to update tenant:', error);
      alert('Failed to update status');
    }
  };

  const handleDeleteTenant = async () => {
    if (!showDeleteModal || deleteConfirmName !== showDeleteModal.name) {
      alert('Please type the restaurant name to confirm deletion');
      return;
    }
    
    setDeleting(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/platform-admin/tenants/${showDeleteModal.id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setTenants(tenants.filter(t => t.id !== showDeleteModal.id));
        setShowDeleteModal(null);
        setDeleteConfirmName('');
        alert('Restaurant deleted successfully');
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to delete restaurant');
      }
    } catch (error) {
      console.error('Failed to delete tenant:', error);
      alert('Failed to delete restaurant');
    } finally {
      setDeleting(false);
    }
  };

  const handleToggleFeature = async (tenantId: string, featureKey: string, enabled: boolean) => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/platform-admin/tenants/${tenantId}/features`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ features: { [featureKey]: enabled } }),
      });
      if (response.ok) {
        const updated = await response.json();
        setTenants(tenants.map(t => t.id === tenantId ? { ...t, features: updated.features } : t));
        if (showFeaturesModal?.id === tenantId) {
          setShowFeaturesModal({ ...showFeaturesModal, features: updated.features });
        }
      }
    } catch (error) {
      console.error('Failed to toggle feature:', error);
    }
  };

  const refreshTenants = async () => {
    setLoading(true);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/platform-admin/tenants`);
      if (response.ok) {
        const data = await response.json();
        setTenants(Array.isArray(data) ? data : []);
      }
    } catch (error) {
      console.error('Failed to refresh tenants:', error);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Restaurants</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage all restaurants on the platform</p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={refreshTenants}
            className="inline-flex items-center gap-2 px-4 py-2.5 border border-slate-200 dark:border-slate-700 hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl transition-colors"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
          >
            <Plus className="h-5 w-5" />
            Add Restaurant
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search restaurants..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
              <Building2 className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{tenants.length}</p>
              <p className="text-sm text-slate-500">Total Restaurants</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{tenants.filter(t => t.status === 'active').length}</p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <ShoppingBag className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{tenants.reduce((sum, t) => sum + t.stats.orders, 0)}</p>
              <p className="text-sm text-slate-500">Total Orders</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Restaurants Grid */}
      {filteredTenants.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Building2 className="h-12 w-12 text-slate-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-1">No restaurants found</h3>
            <p className="text-slate-500 dark:text-slate-400 mb-4">
              {searchQuery ? 'Try adjusting your search' : 'Get started by adding your first restaurant'}
            </p>
            {!searchQuery && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-lg transition-colors"
              >
                <Plus className="h-4 w-4" />
                Add Restaurant
              </button>
            )}
          </CardContent>
        </Card>
      ) : (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredTenants.map((tenant) => (
          <Card key={tenant.id}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {tenant.name.charAt(0)}
                  </div>
                  <div>
                    <CardTitle className="text-base">{tenant.name}</CardTitle>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Globe className="h-3 w-3" />
                      {tenant.domain}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  tenant.status === 'active' 
                    ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                    : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {tenant.status}
                </span>
              </div>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="grid grid-cols-3 gap-2 py-3 border-t border-b border-slate-100 dark:border-slate-700">
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{tenant.stats.admins}</p>
                  <p className="text-xs text-slate-500">Admins</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{tenant.stats.orders}</p>
                  <p className="text-xs text-slate-500">Orders</p>
                </div>
                <div className="text-center">
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">{tenant.stats.menus}</p>
                  <p className="text-xs text-slate-500">Menus</p>
                </div>
              </div>
              <div className="flex items-center gap-2 pt-3">
                <button
                  onClick={() => handleViewUsers(tenant)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-purple-600 hover:bg-purple-50 dark:text-purple-400 dark:hover:bg-purple-900/20 rounded-lg transition-colors"
                >
                  Admins ({tenant.stats.admins})
                </button>
                <button
                  onClick={() => setShowFeaturesModal(tenant)}
                  className="flex-1 px-3 py-2 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                >
                  Features
                </button>
                <button
                  onClick={() => handleUpdateStatus(tenant.id, tenant.status === 'active' ? 'inactive' : 'active')}
                  className={`p-2 rounded-lg transition-colors ${
                    tenant.status === 'active' 
                      ? 'text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20' 
                      : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700'
                  }`}
                  title={tenant.status === 'active' ? 'Deactivate Restaurant' : 'Activate Restaurant'}
                >
                  {tenant.status === 'active' ? <ToggleRight className="h-5 w-5" /> : <ToggleLeft className="h-5 w-5" />}
                </button>
                <button
                  onClick={() => setShowDeleteModal(tenant)}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  title="Delete Restaurant"
                >
                  <Trash2 className="h-5 w-5" />
                </button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Restaurant</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateTenant} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Restaurant Name *</label>
                <input name="name" required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" placeholder="My Restaurant" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Domain *</label>
                <input name="domain" required placeholder="myrestaurant.com" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Currency</label>
                <select name="currencyCode" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  <option value="USD">USD</option>
                  <option value="EUR">EUR</option>
                  <option value="GBP">GBP</option>
                </select>
              </div>
              <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Owner Account</p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Owner Email</label>
                    <input name="ownerEmail" type="email" placeholder="owner@restaurant.com" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm" />
                    <p className="text-xs text-slate-500 mt-1">Leave empty for default: owner@[domain]</p>
                  </div>
                  <div>
                    <label className="block text-sm text-slate-600 dark:text-slate-400 mb-1">Owner Password</label>
                    <input name="ownerPassword" type="text" placeholder="owner123" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white text-sm" />
                    <p className="text-xs text-slate-500 mt-1">Leave empty for default: owner123</p>
                  </div>
                </div>
              </div>
              {platformAdmins.length > 0 && (
                <div className="border-t border-slate-200 dark:border-slate-700 pt-4">
                  <p className="text-sm font-medium text-slate-700 dark:text-slate-300 mb-3">Assign to Platform Admin (Optional)</p>
                  <select name="assignToAdmin" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                    <option value="">-- No assignment --</option>
                    {platformAdmins.map(admin => (
                      <option key={admin.id} value={admin.id}>{admin.name} ({admin.email})</option>
                    ))}
                  </select>
                  <p className="text-xs text-slate-500 mt-1">The selected admin will be able to manage this restaurant</p>
                </div>
              )}
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
                Create Restaurant
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Features Modal */}
      {showFeaturesModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{showFeaturesModal.name} Features</h2>
              <button onClick={() => setShowFeaturesModal(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-3">
              {showFeaturesModal.features.map((feature) => (
                <div key={feature.key} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-slate-700/50">
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{feature.key}</p>
                    {feature.description && <p className="text-sm text-slate-500">{feature.description}</p>}
                  </div>
                  <button
                    onClick={() => handleToggleFeature(showFeaturesModal.id, feature.key, !feature.enabled)}
                    className={`p-2 rounded-lg transition-colors ${feature.enabled ? 'text-emerald-500' : 'text-slate-400'}`}
                  >
                    {feature.enabled ? <ToggleRight className="h-6 w-6" /> : <ToggleLeft className="h-6 w-6" />}
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-12 w-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900 dark:text-white">Delete Restaurant</h2>
                <p className="text-sm text-slate-500">This action cannot be undone</p>
              </div>
            </div>
            
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-4">
              <p className="text-sm text-red-800 dark:text-red-200">
                <strong>Warning:</strong> Deleting <strong>{showDeleteModal.name}</strong> will permanently remove:
              </p>
              <ul className="mt-2 text-sm text-red-700 dark:text-red-300 list-disc list-inside space-y-1">
                <li>All admins ({showDeleteModal.stats.admins} admins)</li>
                <li>All orders ({showDeleteModal.stats.orders} orders)</li>
                <li>All menus ({showDeleteModal.stats.menus} menus)</li>
                <li>All users and settings</li>
              </ul>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-2">
                Type <strong>{showDeleteModal.name}</strong> to confirm:
              </label>
              <input
                type="text"
                value={deleteConfirmName}
                onChange={(e) => setDeleteConfirmName(e.target.value)}
                placeholder="Restaurant name"
                className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white"
              />
            </div>

            <div className="flex flex-col gap-3">
              <button
                onClick={handleDeleteTenant}
                disabled={deleteConfirmName !== showDeleteModal.name || deleting}
                className={`w-full px-4 py-3 font-medium rounded-xl transition-colors ${
                  deleteConfirmName === showDeleteModal.name && !deleting
                    ? 'bg-red-600 hover:bg-red-700 text-white cursor-pointer'
                    : 'bg-gray-200 dark:bg-gray-700 text-gray-400 dark:text-gray-500 cursor-not-allowed'
                }`}
              >
                {deleting ? 'Deleting...' : deleteConfirmName === showDeleteModal.name ? '🗑️ Confirm Delete' : '🔒 Type restaurant name to enable'}
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(null);
                  setDeleteConfirmName('');
                }}
                className="w-full px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 font-medium rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admins Modal */}
      {showUsersModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-lg w-full p-6 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">{showUsersModal.name} - Admins</h2>
              <button onClick={() => { setShowUsersModal(null); setTenantAdmins([]); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            
            {loadingUsers ? (
              <div className="flex items-center justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-indigo-600 border-t-transparent"></div>
              </div>
            ) : tenantAdmins.length === 0 ? (
              <div className="text-center py-8 text-slate-500">
                No admins found for this restaurant.
              </div>
            ) : (
              <div className="overflow-y-auto flex-1 space-y-3">
                {tenantAdmins.map(admin => (
                  <div key={`${admin.type}-${admin.id}`} className="p-4 bg-slate-50 dark:bg-slate-700/50 rounded-xl">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`h-10 w-10 rounded-full flex items-center justify-center text-white font-bold ${
                          admin.type === 'platform_admin' 
                            ? 'bg-gradient-to-br from-purple-500 to-indigo-600'
                            : 'bg-gradient-to-br from-amber-500 to-orange-600'
                        }`}>
                          {admin.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-medium text-slate-900 dark:text-white">{admin.name}</p>
                          <p className="text-sm text-slate-500">{admin.email}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              admin.type === 'platform_admin'
                                ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                : 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                            }`}>
                              {admin.type === 'platform_admin' ? 'Platform' : 'Restaurant'}
                            </span>
                            <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400">
                              {admin.role}
                            </span>
                            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                              admin.status === 'active'
                                ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-600 dark:text-slate-300'
                            }`}>
                              {admin.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-slate-500">
                      Added: {new Date(admin.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
