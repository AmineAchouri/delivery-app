'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Percent, 
  Plus, 
  Search, 
  MoreHorizontal,
  Copy,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  Tag,
  DollarSign,
  Clock,
  CheckCircle,
  XCircle,
  Gift,
  Ticket,
  ShoppingBag
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

interface Discount {
  id: string;
  code: string;
  name: string;
  type: 'percentage' | 'fixed' | 'free_delivery' | 'bogo';
  value: number;
  minOrder?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usageCount: number;
  status: 'active' | 'expired' | 'scheduled' | 'disabled';
  startDate: string;
  endDate: string;
  applicableTo: 'all' | 'category' | 'product' | 'customer';
  revenue: number;
}

const mockDiscounts: Discount[] = [
  {
    id: '1',
    code: 'SUMMER20',
    name: 'Summer Sale 20% Off',
    type: 'percentage',
    value: 20,
    minOrder: 25,
    maxDiscount: 50,
    usageLimit: 500,
    usageCount: 342,
    status: 'active',
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    applicableTo: 'all',
    revenue: 8560,
  },
  {
    id: '2',
    code: 'FREEDELIVERY',
    name: 'Free Delivery Weekend',
    type: 'free_delivery',
    value: 0,
    minOrder: 15,
    usageLimit: 1000,
    usageCount: 678,
    status: 'active',
    startDate: '2024-11-01',
    endDate: '2024-12-31',
    applicableTo: 'all',
    revenue: 12340,
  },
  {
    id: '3',
    code: 'NEWUSER10',
    name: 'New User $10 Off',
    type: 'fixed',
    value: 10,
    minOrder: 20,
    usageLimit: undefined,
    usageCount: 156,
    status: 'active',
    startDate: '2024-01-01',
    endDate: '2024-12-31',
    applicableTo: 'customer',
    revenue: 3120,
  },
  {
    id: '4',
    code: 'BOGO50',
    name: 'Buy One Get One 50% Off',
    type: 'bogo',
    value: 50,
    usageLimit: 200,
    usageCount: 200,
    status: 'expired',
    startDate: '2024-10-01',
    endDate: '2024-10-31',
    applicableTo: 'category',
    revenue: 4560,
  },
  {
    id: '5',
    code: 'BLACKFRIDAY',
    name: 'Black Friday 30% Off',
    type: 'percentage',
    value: 30,
    minOrder: 30,
    maxDiscount: 100,
    usageLimit: 1000,
    usageCount: 0,
    status: 'scheduled',
    startDate: '2024-11-29',
    endDate: '2024-12-01',
    applicableTo: 'all',
    revenue: 0,
  },
];

const typeLabels = {
  percentage: 'Percentage',
  fixed: 'Fixed Amount',
  free_delivery: 'Free Delivery',
  bogo: 'BOGO',
};

const typeIcons = {
  percentage: <Percent className="h-4 w-4" />,
  fixed: <DollarSign className="h-4 w-4" />,
  free_delivery: <ShoppingBag className="h-4 w-4" />,
  bogo: <Gift className="h-4 w-4" />,
};

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  expired: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  scheduled: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  disabled: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
};

export default function DiscountsPage() {
  const router = useRouter();
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setTimeout(() => {
      setDiscounts(mockDiscounts);
      setLoading(false);
    }, 500);
  }, [router]);

  const filteredDiscounts = discounts.filter((discount) => {
    const matchesSearch = 
      discount.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      discount.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || discount.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: discounts.length,
    active: discounts.filter(d => d.status === 'active').length,
    totalUsage: discounts.reduce((sum, d) => sum + d.usageCount, 0),
    totalRevenue: discounts.reduce((sum, d) => sum + d.revenue, 0),
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getDiscountDisplay = (discount: Discount) => {
    switch (discount.type) {
      case 'percentage':
        return `${discount.value}% Off`;
      case 'fixed':
        return `$${discount.value} Off`;
      case 'free_delivery':
        return 'Free Delivery';
      case 'bogo':
        return `BOGO ${discount.value}% Off`;
      default:
        return '';
    }
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
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Total Discounts</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Ticket className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Discounts</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Usage</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalUsage.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border-orange-200 dark:border-orange-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600 dark:text-orange-400">Revenue Generated</p>
                <p className="text-2xl font-bold text-orange-900 dark:text-orange-100">${stats.totalRevenue.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-orange-500/20 flex items-center justify-center">
                <DollarSign className="h-6 w-6 text-orange-600 dark:text-orange-400" />
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
              placeholder="Search discounts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 w-full sm:w-64"
            />
          </div>
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full sm:w-36"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="scheduled">Scheduled</option>
            <option value="expired">Expired</option>
            <option value="disabled">Disabled</option>
          </Select>
        </div>

        <Button size="sm" className="w-full sm:w-auto bg-primary-600 hover:bg-primary-700 text-white">
          <Plus className="h-4 w-4 mr-2" />
          Create Discount
        </Button>
      </div>

      {/* Discounts Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead>Code</TableHead>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-center">Value</TableHead>
                <TableHead className="text-center">Usage</TableHead>
                <TableHead>Valid Period</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="text-right">Revenue</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDiscounts.map((discount) => (
                <TableRow key={discount.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <code className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded text-sm font-mono font-medium">
                        {discount.code}
                      </code>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 w-7 p-0"
                        onClick={() => copyCode(discount.code)}
                      >
                        {copiedCode === discount.code ? (
                          <CheckCircle className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <p className="font-medium text-gray-900 dark:text-white">{discount.name}</p>
                    {discount.minOrder && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Min. order: ${discount.minOrder}</p>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="h-8 w-8 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300">
                        {typeIcons[discount.type]}
                      </span>
                      <span className="text-sm text-gray-600 dark:text-gray-300">{typeLabels[discount.type]}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className="font-semibold text-primary-600 dark:text-primary-400">
                      {getDiscountDisplay(discount)}
                    </span>
                    {discount.maxDiscount && (
                      <p className="text-xs text-gray-500 dark:text-gray-400">Max: ${discount.maxDiscount}</p>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <div>
                      <span className="font-medium text-gray-900 dark:text-white">{discount.usageCount}</span>
                      {discount.usageLimit && (
                        <span className="text-gray-500 dark:text-gray-400"> / {discount.usageLimit}</span>
                      )}
                    </div>
                    {discount.usageLimit && (
                      <div className="mt-1 h-1.5 w-20 mx-auto bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className={cn(
                            "h-full rounded-full",
                            discount.usageCount >= discount.usageLimit ? "bg-red-500" : "bg-primary-500"
                          )}
                          style={{ width: `${Math.min((discount.usageCount / discount.usageLimit) * 100, 100)}%` }}
                        />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-1 text-sm text-gray-600 dark:text-gray-300">
                      <Calendar className="h-3.5 w-3.5" />
                      {formatDate(discount.startDate)} - {formatDate(discount.endDate)}
                    </div>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
                      statusColors[discount.status]
                    )}>
                      {discount.status.charAt(0).toUpperCase() + discount.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-green-600 dark:text-green-400">
                      ${discount.revenue.toLocaleString()}
                    </span>
                  </TableCell>
                  <TableCell>
                    <div className="relative group">
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                      <div className="absolute right-0 top-full mt-1 w-36 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-10 hidden group-hover:block">
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                          <Eye className="h-4 w-4" /> View
                        </button>
                        <button className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                          <Edit className="h-4 w-4" /> Edit
                        </button>
                        <button className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
                          <Trash2 className="h-4 w-4" /> Delete
                        </button>
                      </div>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          {filteredDiscounts.length === 0 && (
            <div className="text-center py-12">
              <Percent className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No discounts found</h3>
              <p className="text-gray-500 dark:text-gray-400">Try adjusting your search or create a new discount</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
