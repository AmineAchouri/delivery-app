'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Search, 
  Filter, 
  Download, 
  MoreHorizontal, 
  Mail, 
  Phone, 
  MapPin,
  Calendar,
  ShoppingBag,
  DollarSign,
  Star,
  ChevronLeft,
  ChevronRight,
  Eye,
  Edit,
  Trash2,
  UserPlus
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useAuth, useAuthenticatedFetch } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { FeatureGuard } from '@/components/FeatureGuard';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';

interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  address?: string;
  avatar?: string;
  total_orders: number;
  total_spent: number;
  loyalty_points?: number;
  status: 'active' | 'inactive' | 'blocked';
  created_at: string;
  last_order_at?: string;
}

// Mock data for demonstration
const mockCustomers: Customer[] = [
  {
    id: '1',
    name: 'John Doe',
    email: 'john.doe@example.com',
    phone: '+1 234 567 8900',
    address: '123 Main St, New York, NY',
    total_orders: 24,
    total_spent: 456.50,
    loyalty_points: 1250,
    status: 'active',
    created_at: '2024-01-15T10:30:00Z',
    last_order_at: '2024-11-28T14:20:00Z',
  },
  {
    id: '2',
    name: 'Jane Smith',
    email: 'jane.smith@example.com',
    phone: '+1 234 567 8901',
    address: '456 Oak Ave, Los Angeles, CA',
    total_orders: 18,
    total_spent: 324.75,
    loyalty_points: 890,
    status: 'active',
    created_at: '2024-02-20T09:15:00Z',
    last_order_at: '2024-11-27T11:45:00Z',
  },
  {
    id: '3',
    name: 'Robert Johnson',
    email: 'robert.j@example.com',
    phone: '+1 234 567 8902',
    total_orders: 5,
    total_spent: 89.99,
    loyalty_points: 200,
    status: 'inactive',
    created_at: '2024-05-10T16:00:00Z',
    last_order_at: '2024-09-15T08:30:00Z',
  },
  {
    id: '4',
    name: 'Emily Davis',
    email: 'emily.d@example.com',
    phone: '+1 234 567 8903',
    address: '789 Pine Rd, Chicago, IL',
    total_orders: 42,
    total_spent: 892.30,
    loyalty_points: 2100,
    status: 'active',
    created_at: '2023-11-05T12:45:00Z',
    last_order_at: '2024-11-29T19:00:00Z',
  },
  {
    id: '5',
    name: 'Michael Wilson',
    email: 'michael.w@example.com',
    total_orders: 0,
    total_spent: 0,
    loyalty_points: 0,
    status: 'blocked',
    created_at: '2024-08-22T14:30:00Z',
  },
];

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  blocked: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
};

export default function CustomersPage() {
  return (
    <FeatureGuard featureKey="CUSTOMERS">
      <CustomersPageContent />
    </FeatureGuard>
  );
}

function CustomersPageContent() {
  const router = useRouter();
  const { selectedTenant } = useAuth();
  const authFetch = useAuthenticatedFetch();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedCustomers, setSelectedCustomers] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingCustomer, setViewingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    address: '',
    status: 'active' as 'active' | 'inactive' | 'blocked'
  });
  const itemsPerPage = 10;

  useEffect(() => {
    if (selectedTenant) {
      loadCustomers();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTenant?.tenant_id]);

  const loadCustomers = async () => {
    setLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/tenant/customers`);

      if (res.ok) {
        const data = await res.json();
        // Map API response to Customer interface
        const customerData: Customer[] = (data.data || []).map((c: any) => ({
          id: c.id,
          name: c.email.split('@')[0], // Use email prefix as name if no name field
          email: c.email,
          phone: c.phone || '',
          total_orders: c.orderCount || 0,
          total_spent: 0, // Would need to calculate from orders
          status: c.status === 'active' ? 'active' : 'inactive',
          created_at: c.createdAt,
          last_order_at: c.lastActive
        }));
        setCustomers(customerData.length > 0 ? customerData : mockCustomers);
      } else {
        // Use mock data if API not available
        setCustomers(mockCustomers);
      }
    } catch (error) {
      console.error('Failed to load customers:', error);
      setCustomers(mockCustomers);
    } finally {
      setLoading(false);
    }
  };

  const filteredCustomers = customers.filter((customer) => {
    const matchesSearch =
      customer.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      customer.phone?.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || customer.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const paginatedCustomers = filteredCustomers.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const { formatPrice } = useCurrency();
  
  const formatCurrency = (amount: number) => {
    return formatPrice(amount);
  };

  const toggleSelectAll = () => {
    if (selectedCustomers.length === paginatedCustomers.length) {
      setSelectedCustomers([]);
    } else {
      setSelectedCustomers(paginatedCustomers.map((c) => c.id));
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedCustomers((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', email: '', phone: '', address: '', status: 'active' });
    setShowModal(true);
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      email: customer.email,
      phone: customer.phone || '',
      address: customer.address || '',
      status: customer.status
    });
    setShowModal(true);
  };

  const openViewModal = (customer: Customer) => {
    setViewingCustomer(customer);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditingCustomer(null);
    setViewingCustomer(null);
  };

  const handleSaveCustomer = async () => {
    try {
      if (editingCustomer) {
        // Update existing customer via API
        const res = await authFetch(`${API_BASE_URL}/api/tenant/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (res.ok) {
          const updated = await res.json();
          setCustomers(customers.map(c => c.id === editingCustomer.id ? {
            ...c,
            name: updated.name,
            email: updated.email,
            phone: updated.phone,
            status: updated.status
          } : c));
          closeModal();
        } else {
          const error = await res.json();
          alert(error.error || 'Failed to update customer');
        }
      } else {
        // Create new customer via API
        const res = await authFetch(`${API_BASE_URL}/api/tenant/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData)
        });
        
        if (res.ok) {
          const newCustomer = await res.json();
          setCustomers([...customers, {
            id: newCustomer.id,
            name: newCustomer.name,
            email: newCustomer.email,
            phone: newCustomer.phone || '',
            status: newCustomer.status,
            total_orders: 0,
            total_spent: 0,
            created_at: newCustomer.createdAt
          }]);
          closeModal();
        } else {
          const error = await res.json();
          alert(error.error || 'Failed to create customer');
        }
      }
    } catch (error) {
      console.error('Failed to save customer:', error);
      alert('Failed to save customer');
    }
  };

  const handleDeleteCustomer = async (customerId: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    
    try {
      const res = await authFetch(`${API_BASE_URL}/api/tenant/customers/${customerId}`, {
        method: 'DELETE'
      });
      
      if (res.ok) {
        setCustomers(customers.filter(c => c.id !== customerId));
      } else {
        const error = await res.json();
        alert(error.error || 'Failed to delete customer');
      }
    } catch (error) {
      console.error('Failed to delete customer:', error);
      alert('Failed to delete customer');
    }
  };

  // Stats cards data
  const stats = {
    total: customers.length,
    active: customers.filter((c) => c.status === 'active').length,
    totalRevenue: customers.reduce((sum, c) => sum + c.total_spent, 0),
    avgOrderValue: customers.length > 0 
      ? customers.reduce((sum, c) => sum + c.total_spent, 0) / customers.reduce((sum, c) => sum + c.total_orders, 0) || 0
      : 0,
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Customers</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <UserPlus className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Customers</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Star className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Revenue</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{formatCurrency(stats.totalRevenue)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Avg. Order Value</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">{formatCurrency(stats.avgOrderValue)}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <ShoppingBag className="h-6 w-6 text-orange-600 dark:text-orange-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Actions */}
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search customers..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-40"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="blocked">Blocked</option>
          </Select>
        </div>

        <div className="flex gap-2 w-full sm:w-auto">
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Filter className="h-4 w-4 mr-2" />
            Filters
          </Button>
          <Button variant="outline" size="sm" className="flex-1 sm:flex-none">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button size="sm" className="flex-1 sm:flex-none bg-indigo-600 hover:bg-indigo-700 text-white" onClick={openAddModal}>
            <UserPlus className="h-4 w-4 mr-2" />
            Add Customer
          </Button>
        </div>
      </div>

      {/* Customers Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead className="w-12">
                  <input
                    type="checkbox"
                    checked={selectedCustomers.length === paginatedCustomers.length && paginatedCustomers.length > 0}
                    onChange={toggleSelectAll}
                    className="rounded border-gray-300 dark:border-gray-600"
                  />
                </TableHead>
                <TableHead>Customer</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Orders</TableHead>
                <TableHead className="text-right">Total Spent</TableHead>
                <TableHead className="text-center">Loyalty</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-center">Joined</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedCustomers.map((customer) => (
                <TableRow 
                  key={customer.id}
                  className="hover:bg-gray-50 dark:hover:bg-gray-800/50 cursor-pointer"
                  onClick={() => router.push(`/customers/${customer.id}`)}
                >
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <input
                      type="checkbox"
                      checked={selectedCustomers.includes(customer.id)}
                      onChange={() => toggleSelect(customer.id)}
                      className="rounded border-gray-300 dark:border-gray-600"
                    />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar
                        src={customer.avatar}
                        fallback={customer.name}
                        size="md"
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {customer.phone && (
                        <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                          <Phone className="h-3 w-3" />
                          {customer.phone}
                        </div>
                      )}
                      {customer.address && (
                        <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 truncate max-w-[200px]">
                          <MapPin className="h-3 w-3 flex-shrink-0" />
                          {customer.address}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-medium text-gray-900 dark:text-white">{customer.total_orders}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {formatCurrency(customer.total_spent)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center">
                    <div className="flex items-center justify-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-medium text-gray-900 dark:text-white">
                        {customer.loyalty_points || 0}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[customer.status]}`}>
                      {customer.status.charAt(0).toUpperCase() + customer.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-center text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(customer.created_at)}
                  </TableCell>
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <div className="relative group">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 hidden group-hover:block">
                        <button 
                          onClick={() => openViewModal(customer)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" /> View
                        </button>
                        <button 
                          onClick={() => openEditModal(customer)}
                          className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                        >
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                        <button 
                          onClick={() => handleDeleteCustomer(customer.id)}
                          className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2"
                        >
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {paginatedCustomers.length === 0 && (
            <div className="text-center py-12">
              <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No customers found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or filters</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Showing {(currentPage - 1) * itemsPerPage + 1} to{' '}
            {Math.min(currentPage * itemsPerPage, filteredCustomers.length)} of{' '}
            {filteredCustomers.length} customers
          </p>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            {[...Array(totalPages)].map((_, i) => (
              <Button
                key={i}
                variant={currentPage === i + 1 ? 'default' : 'outline'}
                size="sm"
                onClick={() => setCurrentPage(i + 1)}
                className=""
              >
                {i + 1}
              </Button>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Add/Edit Customer Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {editingCustomer ? 'Edit Customer' : 'Add New Customer'}
            </h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder="Customer name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder="customer@example.com"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder="+1 234 567 8900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
                <input
                  type="text"
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder="123 Main St, City"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="blocked">Blocked</option>
                </select>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={closeModal} className="flex-1">Cancel</Button>
              <Button onClick={handleSaveCustomer} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                {editingCustomer ? 'Save Changes' : 'Add Customer'}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Customer Modal */}
      {viewingCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={closeModal} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Customer Details</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar src={viewingCustomer.avatar} fallback={viewingCustomer.name} size="lg" />
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{viewingCustomer.name}</h3>
                  <p className="text-sm text-gray-500">{viewingCustomer.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-500">Phone</p>
                  <p className="font-medium text-gray-900 dark:text-white">{viewingCustomer.phone || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Status</p>
                  <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[viewingCustomer.status]}`}>
                    {viewingCustomer.status}
                  </span>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Orders</p>
                  <p className="font-medium text-gray-900 dark:text-white">{viewingCustomer.total_orders}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Spent</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatCurrency(viewingCustomer.total_spent)}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Loyalty Points</p>
                  <p className="font-medium text-gray-900 dark:text-white">{viewingCustomer.loyalty_points || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Member Since</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(viewingCustomer.created_at)}</p>
                </div>
              </div>
              {viewingCustomer.address && (
                <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500">Address</p>
                  <p className="font-medium text-gray-900 dark:text-white">{viewingCustomer.address}</p>
                </div>
              )}
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={closeModal} className="flex-1">Close</Button>
              <Button onClick={() => { closeModal(); openEditModal(viewingCustomer); }} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                Edit Customer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
