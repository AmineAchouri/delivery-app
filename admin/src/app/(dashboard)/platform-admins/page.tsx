'use client';

import { useState, useEffect } from 'react';
import { useAuth, useAuthenticatedFetch } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { 
  UserCog, 
  Plus, 
  Search, 
  Edit, 
  Trash2,
  Shield,
  Building2,
  Mail,
  X,
  Check
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface AssignedTenant {
  id: string;
  name: string;
  domain: string;
}

interface PlatformAdminUser {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'PLATFORM_ADMIN';
  status: string;
  createdAt: string;
  createdBy: { id: string; name: string; email: string } | null;
  assignedTenants: AssignedTenant[];
}

interface Tenant {
  id: string;
  name: string;
  domain: string;
}

const API_BASE_URL = '';

export default function PlatformAdminsPage() {
  const { isSuperAdmin, platformAdmin } = useAuth();
  const router = useRouter();
  const authFetch = useAuthenticatedFetch();
  
  const [admins, setAdmins] = useState<PlatformAdminUser[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState<PlatformAdminUser | null>(null);
  const [assigningTenants, setAssigningTenants] = useState<PlatformAdminUser | null>(null);
  const [selectedTenants, setSelectedTenants] = useState<string[]>([]);

  useEffect(() => {
    if (isSuperAdmin === false) {
      router.push('/dashboard');
    }
  }, [isSuperAdmin, router]);

  const fetchAdmins = async () => {
    try {
      const adminsRes = await authFetch(`${API_BASE_URL}/api/platform-admin/admins`);
      if (adminsRes.ok) setAdmins(await adminsRes.json());
    } catch (error) {
      console.error('Failed to fetch admins:', error);
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [adminsRes, tenantsRes] = await Promise.all([
          authFetch(`${API_BASE_URL}/api/platform-admin/admins`),
          authFetch(`${API_BASE_URL}/api/platform-admin/tenants`)
        ]);
        
        if (adminsRes.ok) setAdmins(await adminsRes.json());
        if (tenantsRes.ok) setTenants(await tenantsRes.json());
      } catch (error) {
        console.error('Failed to fetch data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [authFetch]);

  const filteredAdmins = admins.filter(a =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    a.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const response = await authFetch(`${API_BASE_URL}/api/platform-admin/admins`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: formData.get('email'),
          password: formData.get('password'),
          name: formData.get('name'),
          role: formData.get('role'),
        }),
      });
      if (response.ok) {
        // Refetch to get complete admin data with all fields
        await fetchAdmins();
        setShowCreateModal(false);
      } else {
        const error = await response.json().catch(() => ({}));
        alert(error.error || 'Failed to create admin');
      }
    } catch (error) {
      console.error('Failed to create admin:', error);
      alert('Failed to create admin');
    }
  };

  const handleUpdateAdmin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editingAdmin) return;
    
    const formData = new FormData(e.currentTarget);
    const data: any = {
      name: formData.get('name'),
      status: formData.get('status'),
      role: formData.get('role'),
    };
    const password = formData.get('password') as string;
    if (password) data.password = password;

    try {
      const response = await authFetch(`${API_BASE_URL}/api/platform-admin/admins/${editingAdmin.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (response.ok) {
        await fetchAdmins();
        setEditingAdmin(null);
      } else {
        const error = await response.json().catch(() => ({}));
        alert(error.error || 'Failed to update admin');
      }
    } catch (error) {
      console.error('Failed to update admin:', error);
      alert('Failed to update admin');
    }
  };

  const handleDeleteAdmin = async (id: string) => {
    if (!confirm('Are you sure you want to delete this admin?')) return;
    try {
      const response = await authFetch(`${API_BASE_URL}/api/platform-admin/admins/${id}`, {
        method: 'DELETE',
      });
      if (response.ok) {
        setAdmins(admins.filter(a => a.id !== id));
      }
    } catch (error) {
      console.error('Failed to delete admin:', error);
    }
  };

  const handleAssignTenants = async () => {
    if (!assigningTenants) return;
    try {
      const response = await authFetch(`${API_BASE_URL}/api/platform-admin/admins/${assigningTenants.id}/tenants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantIds: selectedTenants }),
      });
      if (response.ok) {
        await fetchAdmins();
        setAssigningTenants(null);
        setSelectedTenants([]);
      } else {
        const error = await response.json().catch(() => ({}));
        alert(error.error || 'Failed to assign tenants');
      }
    } catch (error) {
      console.error('Failed to assign tenants:', error);
      alert('Failed to assign tenants');
    }
  };

  const openAssignModal = (adminUser: PlatformAdminUser) => {
    setAssigningTenants(adminUser);
    setSelectedTenants(adminUser.assignedTenants.map(t => t.id));
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
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Platform Admins</h1>
          <p className="text-slate-500 dark:text-slate-400">Manage platform administrators</p>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
        >
          <Plus className="h-5 w-5" />
          Add Admin
        </button>
      </div>

      {/* Search */}
      <div className="relative max-w-md">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
        <input
          type="text"
          placeholder="Search admins..."
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
              <UserCog className="h-5 w-5 text-indigo-600 dark:text-indigo-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{admins.length}</p>
              <p className="text-sm text-slate-500">Total Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              <Shield className="h-5 w-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{admins.filter(a => a.role === 'SUPER_ADMIN').length}</p>
              <p className="text-sm text-slate-500">Super Admins</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <Check className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-slate-900 dark:text-white">{admins.filter(a => a.status === 'active').length}</p>
              <p className="text-sm text-slate-500">Active</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Admins List */}
      <div className="space-y-4">
        {filteredAdmins.map((adminUser) => (
          <Card key={adminUser.id}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-lg">
                    {adminUser.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-900 dark:text-white">{adminUser.name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        adminUser.role === 'SUPER_ADMIN'
                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400'
                          : 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400'
                      }`}>
                        {adminUser.role === 'SUPER_ADMIN' ? 'Super Admin' : 'Platform Admin'}
                      </span>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        adminUser.status === 'active'
                          ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400'
                          : 'bg-slate-100 text-slate-700 dark:bg-slate-700 dark:text-slate-300'
                      }`}>
                        {adminUser.status}
                      </span>
                    </div>
                    <p className="text-sm text-slate-500 flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {adminUser.email}
                    </p>
                    {adminUser.assignedTenants.length > 0 && (
                      <div className="flex items-center gap-1 mt-1 flex-wrap">
                        <Building2 className="h-3 w-3 text-slate-400" />
                        {adminUser.assignedTenants.map(t => (
                          <span key={t.id} className="text-xs bg-slate-100 dark:bg-slate-700 px-2 py-0.5 rounded">
                            {t.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {adminUser.role === 'PLATFORM_ADMIN' && (
                    <button
                      onClick={() => openAssignModal(adminUser)}
                      className="px-3 py-1.5 text-sm font-medium text-indigo-600 hover:bg-indigo-50 dark:text-indigo-400 dark:hover:bg-indigo-900/20 rounded-lg transition-colors"
                    >
                      Assign Restaurants
                    </button>
                  )}
                  <button
                    onClick={() => setEditingAdmin(adminUser)}
                    className="p-2 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  {adminUser.id !== platformAdmin?.id && (
                    <button
                      onClick={() => handleDeleteAdmin(adminUser.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Platform Admin</h2>
              <button onClick={() => setShowCreateModal(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input name="name" required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
                <input name="email" type="email" required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password</label>
                <input name="password" type="password" required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select name="role" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  <option value="PLATFORM_ADMIN">Platform Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
                Create Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editingAdmin && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Admin</h2>
              <button onClick={() => setEditingAdmin(null)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdateAdmin} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name</label>
                <input name="name" defaultValue={editingAdmin.name} required className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">New Password (leave blank to keep)</label>
                <input name="password" type="password" className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Role</label>
                <select name="role" defaultValue={editingAdmin.role} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  <option value="PLATFORM_ADMIN">Platform Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Status</label>
                <select name="status" defaultValue={editingAdmin.status} className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>
              <button type="submit" className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors">
                Update Admin
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Assign Tenants Modal */}
      {assigningTenants && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-slate-800 rounded-2xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assign Restaurants to {assigningTenants.name}</h2>
              <button onClick={() => { setAssigningTenants(null); setSelectedTenants([]); }} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto mb-4">
              {tenants.map(tenant => (
                <label key={tenant.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700/50 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={selectedTenants.includes(tenant.id)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedTenants([...selectedTenants, tenant.id]);
                      } else {
                        setSelectedTenants(selectedTenants.filter(id => id !== tenant.id));
                      }
                    }}
                    className="h-4 w-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                  />
                  <div>
                    <p className="font-medium text-slate-900 dark:text-white">{tenant.name}</p>
                    <p className="text-sm text-slate-500">{tenant.domain}</p>
                  </div>
                </label>
              ))}
            </div>
            <button
              onClick={handleAssignTenants}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-medium rounded-xl transition-colors"
            >
              Save Assignments
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
