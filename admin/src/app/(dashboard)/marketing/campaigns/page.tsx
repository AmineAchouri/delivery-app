'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Zap, 
  Plus, 
  Search, 
  Filter,
  MoreHorizontal,
  Play,
  Pause,
  Eye,
  Edit,
  Trash2,
  Calendar,
  Users,
  TrendingUp,
  Mail,
  MessageSquare,
  Bell,
  Target,
  ArrowUpRight,
  Clock,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Campaign {
  id: string;
  name: string;
  type: 'email' | 'push' | 'sms' | 'in-app';
  status: 'active' | 'paused' | 'draft' | 'completed' | 'scheduled';
  audience: number;
  sent: number;
  opened: number;
  clicked: number;
  converted: number;
  startDate: string;
  endDate?: string;
  budget?: number;
  spent?: number;
}

const mockCampaigns: Campaign[] = [
  {
    id: '1',
    name: 'Summer Sale Promotion',
    type: 'email',
    status: 'active',
    audience: 5420,
    sent: 5420,
    opened: 2345,
    clicked: 890,
    converted: 234,
    startDate: '2024-11-01',
    endDate: '2024-11-30',
    budget: 500,
    spent: 320,
  },
  {
    id: '2',
    name: 'New Menu Launch',
    type: 'push',
    status: 'active',
    audience: 8900,
    sent: 8900,
    opened: 4560,
    clicked: 1234,
    converted: 456,
    startDate: '2024-11-15',
    budget: 300,
    spent: 180,
  },
  {
    id: '3',
    name: 'Weekend Special',
    type: 'sms',
    status: 'scheduled',
    audience: 3200,
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    startDate: '2024-12-01',
    endDate: '2024-12-03',
    budget: 200,
    spent: 0,
  },
  {
    id: '4',
    name: 'Loyalty Rewards Reminder',
    type: 'in-app',
    status: 'completed',
    audience: 2100,
    sent: 2100,
    opened: 1890,
    clicked: 567,
    converted: 189,
    startDate: '2024-10-15',
    endDate: '2024-10-31',
    budget: 150,
    spent: 150,
  },
  {
    id: '5',
    name: 'Black Friday Deals',
    type: 'email',
    status: 'draft',
    audience: 0,
    sent: 0,
    opened: 0,
    clicked: 0,
    converted: 0,
    startDate: '2024-11-29',
    budget: 1000,
    spent: 0,
  },
];

const typeIcons = {
  email: <Mail className="h-4 w-4" />,
  push: <Bell className="h-4 w-4" />,
  sms: <MessageSquare className="h-4 w-4" />,
  'in-app': <Zap className="h-4 w-4" />,
};

const typeColors = {
  email: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  push: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  sms: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  'in-app': 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
};

const statusColors = {
  active: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
  paused: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
  draft: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  completed: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
  scheduled: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
};

const statusIcons = {
  active: <Play className="h-3 w-3" />,
  paused: <Pause className="h-3 w-3" />,
  draft: <Edit className="h-3 w-3" />,
  completed: <CheckCircle className="h-3 w-3" />,
  scheduled: <Clock className="h-3 w-3" />,
};

export default function CampaignsPage() {
  const router = useRouter();
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [viewingCampaign, setViewingCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    type: 'email' as Campaign['type'],
    status: 'draft' as Campaign['status'],
    startDate: '',
    endDate: ''
  });

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    
    // Load from localStorage or use defaults
    const savedCampaigns = localStorage.getItem('marketingCampaigns');
    setCampaigns(savedCampaigns ? JSON.parse(savedCampaigns) : mockCampaigns);
    setLoading(false);
  }, [router]);
  
  const saveCampaigns = (newCampaigns: Campaign[]) => {
    setCampaigns(newCampaigns);
    localStorage.setItem('marketingCampaigns', JSON.stringify(newCampaigns));
  };

  const openCreateModal = () => {
    setFormData({ name: '', type: 'email', status: 'draft', startDate: '', endDate: '' });
    setShowModal(true);
  };

  const handleCreateCampaign = () => {
    const newCampaign: Campaign = {
      id: Date.now().toString(),
      name: formData.name,
      type: formData.type,
      status: 'draft',
      audience: 0,
      startDate: formData.startDate || new Date().toISOString().split('T')[0],
      endDate: formData.endDate,
      sent: 0,
      opened: 0,
      clicked: 0,
      converted: 0
    };
    saveCampaigns([...campaigns, newCampaign]);
    setShowModal(false);
  };

  const handleViewCampaign = (campaign: Campaign) => {
    setViewingCampaign(campaign);
  };

  const handleLaunchCampaign = (campaignId: string) => {
    const updated = campaigns.map(c => 
      c.id === campaignId ? { ...c, status: 'active' as const } : c
    );
    saveCampaigns(updated);
  };

  const handlePauseCampaign = (campaignId: string) => {
    const updated = campaigns.map(c => 
      c.id === campaignId ? { ...c, status: 'paused' as const } : c
    );
    saveCampaigns(updated);
  };

  const filteredCampaigns = campaigns.filter((campaign) => {
    const matchesSearch = campaign.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || campaign.status === statusFilter;
    const matchesType = typeFilter === 'all' || campaign.type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  const stats = {
    total: campaigns.length,
    active: campaigns.filter(c => c.status === 'active').length,
    totalReach: campaigns.reduce((sum, c) => sum + c.sent, 0),
    avgConversion: campaigns.filter(c => c.sent > 0).length > 0
      ? (campaigns.reduce((sum, c) => sum + (c.converted / (c.sent || 1)) * 100, 0) / campaigns.filter(c => c.sent > 0).length).toFixed(1)
      : '0',
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
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
      {/* Demo Data Notice */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4 flex items-start gap-3">
        <div className="h-10 w-10 rounded-full bg-amber-100 dark:bg-amber-800 flex items-center justify-center flex-shrink-0">
          <Zap className="h-5 w-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div>
          <h3 className="font-semibold text-amber-900 dark:text-amber-100">Demo Mode</h3>
          <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
            Marketing campaigns shown here are simulated demo data. In production, this module would integrate with email marketing services (Mailchimp, SendGrid), push notification providers, and SMS gateways.
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Total Campaigns</p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{stats.total}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Zap className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Campaigns</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{stats.active}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Play className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border-blue-200 dark:border-blue-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Reach</p>
                <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{stats.totalReach.toLocaleString()}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-blue-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg. Conversion</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{stats.avgConversion}%</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-purple-600 dark:text-purple-400" />
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
              placeholder="Search campaigns..."
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
            <option value="paused">Paused</option>
            <option value="draft">Draft</option>
            <option value="scheduled">Scheduled</option>
            <option value="completed">Completed</option>
          </Select>
          <Select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full sm:w-36"
          >
            <option value="all">All Types</option>
            <option value="email">Email</option>
            <option value="push">Push</option>
            <option value="sms">SMS</option>
            <option value="in-app">In-App</option>
          </Select>
        </div>

        <Button size="sm" className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-700 text-white" onClick={openCreateModal}>
          <Plus className="h-4 w-4 mr-2" />
          Create Campaign
        </Button>
      </div>

      {/* Campaigns Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredCampaigns.map((campaign) => (
          <Card key={campaign.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-2">
              <div className="flex items-start justify-between">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", typeColors[campaign.type])}>
                  {typeIcons[campaign.type]}
                </div>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium",
                    statusColors[campaign.status]
                  )}>
                    {statusIcons[campaign.status]}
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </span>
                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardTitle className="text-base mt-3">{campaign.name}</CardTitle>
              <CardDescription className="flex items-center gap-2">
                <Calendar className="h-3 w-3" />
                {formatDate(campaign.startDate)}
                {campaign.endDate && ` - ${formatDate(campaign.endDate)}`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Metrics */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Audience</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{campaign.audience.toLocaleString()}</p>
                  </div>
                  <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800/50">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Sent</p>
                    <p className="font-semibold text-gray-900 dark:text-white">{campaign.sent.toLocaleString()}</p>
                  </div>
                </div>

                {/* Funnel */}
                {campaign.sent > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Open Rate</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        {((campaign.opened / campaign.sent) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full"
                        style={{ width: `${(campaign.opened / campaign.sent) * 100}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Conversion</span>
                      <span className="font-medium text-green-600 dark:text-green-400">
                        {((campaign.converted / campaign.sent) * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full"
                        style={{ width: `${(campaign.converted / campaign.sent) * 100}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Budget */}
                {campaign.budget && (
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-500 dark:text-gray-400">Budget</span>
                      <span className="font-medium text-gray-900 dark:text-white">
                        ${campaign.spent?.toLocaleString()} / ${campaign.budget.toLocaleString()}
                      </span>
                    </div>
                    <div className="mt-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-indigo-500 rounded-full"
                        style={{ width: `${((campaign.spent || 0) / campaign.budget) * 100}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewCampaign(campaign)}>
                  <Eye className="h-4 w-4 mr-1" />
                  View
                </Button>
                {campaign.status === 'active' ? (
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => handlePauseCampaign(campaign.id)}>
                    <Pause className="h-4 w-4 mr-1" />
                    Pause
                  </Button>
                ) : campaign.status === 'paused' || campaign.status === 'draft' ? (
                  <Button size="sm" className="flex-1 bg-green-600 hover:bg-green-700 text-white" onClick={() => handleLaunchCampaign(campaign.id)}>
                    <Play className="h-4 w-4 mr-1" />
                    {campaign.status === 'draft' ? 'Launch' : 'Resume'}
                  </Button>
                ) : null}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filteredCampaigns.length === 0 && (
        <Card>
          <CardContent className="py-12 text-center">
            <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">No campaigns found</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-4">Try adjusting your filters or create a new campaign</p>
            <Button className="bg-indigo-600 hover:bg-indigo-700 text-white" onClick={openCreateModal}>
              <Plus className="h-4 w-4 mr-2" />
              Create Campaign
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Campaign Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setShowModal(false)} />
          <div className="relative w-full max-w-md bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Create New Campaign</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Campaign Name *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                  placeholder="e.g., Summer Sale Promotion"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
                <select
                  value={formData.type}
                  onChange={(e) => setFormData({ ...formData, type: e.target.value as any })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                >
                  <option value="email">Email</option>
                  <option value="push">Push Notification</option>
                  <option value="sms">SMS</option>
                  <option value="in-app">In-App</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setShowModal(false)} className="flex-1">Cancel</Button>
              <Button onClick={handleCreateCampaign} className="flex-1 bg-indigo-600 hover:bg-indigo-700 text-white">
                Create Campaign
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* View Campaign Modal */}
      {viewingCampaign && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50" onClick={() => setViewingCampaign(null)} />
          <div className="relative w-full max-w-lg bg-white dark:bg-gray-800 rounded-xl shadow-xl p-6">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">{viewingCampaign.name}</h2>
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", statusColors[viewingCampaign.status])}>
                  {viewingCampaign.status}
                </span>
                <span className="text-sm text-gray-500">{viewingCampaign.type.toUpperCase()}</span>
              </div>
              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p className="text-sm text-gray-500">Audience</p>
                  <p className="font-medium text-gray-900 dark:text-white">{viewingCampaign.audience.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Sent</p>
                  <p className="font-medium text-gray-900 dark:text-white">{viewingCampaign.sent.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Opened</p>
                  <p className="font-medium text-gray-900 dark:text-white">{viewingCampaign.opened.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Clicked</p>
                  <p className="font-medium text-gray-900 dark:text-white">{viewingCampaign.clicked.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Converted</p>
                  <p className="font-medium text-gray-900 dark:text-white">{viewingCampaign.converted.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Start Date</p>
                  <p className="font-medium text-gray-900 dark:text-white">{formatDate(viewingCampaign.startDate)}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setViewingCampaign(null)} className="flex-1">Close</Button>
              {viewingCampaign.status === 'draft' && (
                <Button onClick={() => { handleLaunchCampaign(viewingCampaign.id); setViewingCampaign(null); }} className="flex-1 bg-green-600 hover:bg-green-700 text-white">
                  Launch Campaign
                </Button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
