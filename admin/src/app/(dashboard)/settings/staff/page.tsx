'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  UserCog, 
  Plus, 
  Search, 
  MoreHorizontal,
  Mail,
  Phone,
  Shield,
  Edit,
  Trash2,
  CheckCircle,
  XCircle,
  Clock,
  Key
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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
import { cn } from '@/lib/utils';

interface StaffMember {
  id: string;
  name: string;
  email: string;
  phone?: string;
  role: 'admin' | 'manager' | 'staff' | 'delivery';
  status: 'active' | 'inactive' | 'pending';
  avatar?: string;
  lastActive?: string;
  createdAt: string;
}

const mockStaff: StaffMember[] = [
  {
    id: '1',
    name: 'John Admin',
    email: 'john@deliveryapp.com',
    phone: '+1 555-0101',
    role: 'admin',
    status: 'active',
    lastActive: '2024-11-29T14:30:00Z',
    createdAt: '2024-01-15T10:00:00Z',
  },
  {
    id: '2',
    name: 'Sarah Manager',
    email: 'sarah@deliveryapp.com',
    phone: '+1 555-0102',
    role: 'manager',
    status: 'active',
    lastActive: '2024-11-29T12:15:00Z',
    createdAt: '2024-02-20T09:00:00Z',
  },
  {
    id: '3',
    name: 'Mike Staff',
    email: 'mike@deliveryapp.com',
    phone: '+1 555-0103',
    role: 'staff',
    status: 'active',
    lastActive: '2024-11-28T18:45:00Z',
    createdAt: '2024-03-10T14:00:00Z',
  },
  {
    id: '4',
    name: 'Emily Delivery',
    email: 'emily@deliveryapp.com',
    phone: '+1 555-0104',
    role: 'delivery',
    status: 'active',
    lastActive: '2024-11-29T16:00:00Z',
    createdAt: '2024-04-05T11:00:00Z',
  },
  {
    id: '5',
    name: 'Tom New',
    email: 'tom@deliveryapp.com',
    role: 'staff',
    status: 'pending',
    createdAt: '2024-11-25T10:00:00Z',
  },
  {
    id: '6',
    name: 'Lisa Former',
    email: 'lisa@deliveryapp.com',
    role: 'staff',
    status: 'inactive',
    lastActive: '2024-10-15T09:00:00Z',
    createdAt: '2024-05-01T08:00:00Z',
  },
];

const roleColors = {
  admin: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
  manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  staff: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  delivery: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
};

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  inactive: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
};

const rolePermissions = {
  admin: ['Full access', 'Manage staff', 'View analytics', 'Manage settings'],
  manager: ['Manage orders', 'Manage menu', 'View analytics', 'Manage customers'],
  staff: ['View orders', 'Update order status', 'View menu'],
  delivery: ['View assigned orders', 'Update delivery status', 'View routes'],
};

export default function StaffPage() {
  const router = useRouter();
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [showInviteModal, setShowInviteModal] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Load from localStorage or use defaults
    const savedStaff = localStorage.getItem('staffMembers');
    setStaff(savedStaff ? JSON.parse(savedStaff) : mockStaff);
    setLoading(false);
  }, [router]);
  
  const saveStaff = (newStaff: StaffMember[]) => {
    setStaff(newStaff);
    localStorage.setItem('staffMembers', JSON.stringify(newStaff));
  };

  const filteredStaff = staff.filter((member) => {
    const matchesSearch = 
      member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      member.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || member.role === roleFilter;
    const matchesStatus = statusFilter === 'all' || member.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const stats = {
    total: staff.length,
    active: staff.filter(s => s.status === 'active').length,
    pending: staff.filter(s => s.status === 'pending').length,
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const formatLastActive = (dateString?: string) => {
    if (!dateString) return 'Never';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 5) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return formatDate(dateString);
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
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
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Staff</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <UserCog className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Active</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Pending Invites</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{stats.pending}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
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
              placeholder="Search staff..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="w-full sm:w-36"
          >
            <option value="all">All Roles</option>
            <option value="admin">Admin</option>
            <option value="manager">Manager</option>
            <option value="staff">Staff</option>
            <option value="delivery">Delivery</option>
          </Select>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="pending">Pending</option>
            <option value="inactive">Inactive</option>
          </Select>
        </div>

        <Button size="sm" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Invite Staff
        </Button>
      </div>

      {/* Role Permissions Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {Object.entries(rolePermissions).map(([role, permissions]) => (
          <Card key={role} className="hover:shadow-md transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <Badge className={roleColors[role as keyof typeof roleColors]}>
                  {role.charAt(0).toUpperCase() + role.slice(1)}
                </Badge>
                <Shield className="h-4 w-4 text-gray-400" />
              </div>
            </CardHeader>
            <CardContent>
              <ul className="space-y-1">
                {permissions.map((permission, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {permission}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Staff Table */}
      <Card>
        <CardHeader>
          <CardTitle>Staff Members</CardTitle>
          <CardDescription>Manage your team members and their access</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead>Member</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead className="text-center">Role</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead>Last Active</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStaff.map((member) => (
                <TableRow key={member.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar fallback={member.name} size="md" />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">{member.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{member.email}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {member.phone ? (
                      <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                        <Phone className="h-3 w-3" />
                        {member.phone}
                      </div>
                    ) : (
                      <span className="text-sm text-gray-400">No phone</span>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge className={roleColors[member.role]}>
                      {member.role.charAt(0).toUpperCase() + member.role.slice(1)}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                      statusColors[member.status]
                    )}>
                      {member.status === 'active' && <CheckCircle className="h-3 w-3" />}
                      {member.status === 'pending' && <Clock className="h-3 w-3" />}
                      {member.status === 'inactive' && <XCircle className="h-3 w-3" />}
                      {member.status.charAt(0).toUpperCase() + member.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-600 dark:text-gray-300">
                      {formatLastActive(member.lastActive)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {formatDate(member.createdAt)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="relative group">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 hidden group-hover:block">
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                          <Key className="h-4 w-4" /> Reset Password
                        </button>
                        {member.status === 'pending' && (
                          <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                            <Mail className="h-4 w-4" /> Resend Invite
                          </button>
                        )}
                        <button className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                          <Trash2 className="h-4 w-4" /> Remove
                        </button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredStaff.length === 0 && (
            <div className="text-center py-12">
              <UserCog className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No staff found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
