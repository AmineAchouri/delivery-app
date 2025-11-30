'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Star, 
  Trophy, 
  Gift, 
  TrendingUp, 
  Users,
  Crown,
  Medal,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { useCurrency } from '@/contexts/CurrencyContext';

interface LoyaltyTier {
  name: string;
  minPoints: number;
  maxPoints: number;
  color: string;
  icon: React.ReactNode;
  benefits: string[];
  customerCount: number;
}

interface TopCustomer {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  points: number;
  tier: string;
  totalSpent: number;
  ordersCount: number;
}

const loyaltyTiers: LoyaltyTier[] = [
  {
    name: 'Bronze',
    minPoints: 0,
    maxPoints: 499,
    color: 'from-amber-600 to-amber-700',
    icon: <Medal className="h-6 w-6" />,
    benefits: ['5% off on orders', 'Birthday reward', 'Early access to sales'],
    customerCount: 234,
  },
  {
    name: 'Silver',
    minPoints: 500,
    maxPoints: 1499,
    color: 'from-gray-400 to-gray-500',
    icon: <Award className="h-6 w-6" />,
    benefits: ['10% off on orders', 'Free delivery', 'Priority support', 'Exclusive deals'],
    customerCount: 156,
  },
  {
    name: 'Gold',
    minPoints: 1500,
    maxPoints: 2999,
    color: 'from-yellow-500 to-yellow-600',
    icon: <Trophy className="h-6 w-6" />,
    benefits: ['15% off on orders', 'Free delivery', 'VIP support', 'Early menu access', 'Double points days'],
    customerCount: 89,
  },
  {
    name: 'Platinum',
    minPoints: 3000,
    maxPoints: Infinity,
    color: 'from-purple-500 to-purple-600',
    icon: <Crown className="h-6 w-6" />,
    benefits: ['20% off on orders', 'Free priority delivery', 'Dedicated support', 'Exclusive events', 'Triple points days', 'Surprise gifts'],
    customerCount: 42,
  },
];

const topCustomers: TopCustomer[] = [
  { id: '1', name: 'Emily Davis', email: 'emily.d@example.com', points: 4250, tier: 'Platinum', totalSpent: 2340.50, ordersCount: 156 },
  { id: '2', name: 'John Doe', email: 'john.doe@example.com', points: 3100, tier: 'Platinum', totalSpent: 1890.25, ordersCount: 98 },
  { id: '3', name: 'Sarah Wilson', email: 'sarah.w@example.com', points: 2450, tier: 'Gold', totalSpent: 1456.00, ordersCount: 87 },
  { id: '4', name: 'Michael Brown', email: 'michael.b@example.com', points: 1890, tier: 'Gold', totalSpent: 1234.75, ordersCount: 72 },
  { id: '5', name: 'Jane Smith', email: 'jane.smith@example.com', points: 1250, tier: 'Silver', totalSpent: 890.50, ordersCount: 45 },
];

const getTierColor = (tier: string) => {
  switch (tier) {
    case 'Platinum': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
    case 'Gold': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    case 'Silver': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    default: return 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400';
  }
};

export default function LoyaltyPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const { formatPrice } = useCurrency();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setLoading(false);
  }, [router]);

  const totalMembers = loyaltyTiers.reduce((sum, tier) => sum + tier.customerCount, 0);
  const totalPointsIssued = 125000;
  const pointsRedeemed = 45000;
  const redemptionRate = ((pointsRedeemed / totalPointsIssued) * 100).toFixed(1);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 dark:bg-gray-700 rounded-lg" />
            ))}
          </div>
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-900/20 dark:to-indigo-800/20 border-indigo-200 dark:border-indigo-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-indigo-600 dark:text-indigo-400">Total Members</p>
                <p className="text-2xl font-bold text-indigo-900 dark:text-indigo-100">{totalMembers}</p>
                <p className="text-xs text-indigo-600 dark:text-indigo-400 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +12% this month
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-indigo-500/20 flex items-center justify-center">
                <Users className="h-6 w-6 text-indigo-600 dark:text-indigo-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-900/20 dark:to-yellow-800/20 border-yellow-200 dark:border-yellow-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Points Issued</p>
                <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">{totalPointsIssued.toLocaleString()}</p>
                <p className="text-xs text-yellow-600 dark:text-yellow-400 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +8% this month
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-yellow-500/20 flex items-center justify-center">
                <Star className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border-green-200 dark:border-green-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600 dark:text-green-400">Points Redeemed</p>
                <p className="text-2xl font-bold text-green-900 dark:text-green-100">{pointsRedeemed.toLocaleString()}</p>
                <p className="text-xs text-green-600 dark:text-green-400 flex items-center mt-1">
                  <ArrowUpRight className="h-3 w-3 mr-1" />
                  +15% this month
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-green-500/20 flex items-center justify-center">
                <Gift className="h-6 w-6 text-green-600 dark:text-green-400" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border-purple-200 dark:border-purple-800">
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Redemption Rate</p>
                <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">{redemptionRate}%</p>
                <p className="text-xs text-purple-600 dark:text-purple-400 flex items-center mt-1">
                  <ArrowDownRight className="h-3 w-3 mr-1" />
                  -2% this month
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-purple-500/20 flex items-center justify-center">
                <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Loyalty Tiers */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Loyalty Tiers</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {loyaltyTiers.map((tier) => (
            <Card key={tier.name} className="overflow-hidden hover:shadow-lg transition-shadow">
              <div className={cn("h-2 bg-gradient-to-r", tier.color)} />
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className={cn("h-10 w-10 rounded-full bg-gradient-to-br flex items-center justify-center text-white", tier.color)}>
                    {tier.icon}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {tier.customerCount} members
                  </Badge>
                </div>
                <CardTitle className="text-lg mt-2">{tier.name}</CardTitle>
                <CardDescription>
                  {tier.maxPoints === Infinity 
                    ? `${tier.minPoints.toLocaleString()}+ points`
                    : `${tier.minPoints.toLocaleString()} - ${tier.maxPoints.toLocaleString()} points`
                  }
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {tier.benefits.map((benefit, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <Sparkles className="h-3 w-3 text-indigo-500 flex-shrink-0" />
                      {benefit}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Top Loyalty Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-500" />
                Top Loyalty Members
              </CardTitle>
              <CardDescription>Customers with the highest loyalty points</CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={() => router.push('/customers')}>
              View All
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {topCustomers.map((customer, index) => (
              <div 
                key={customer.id}
                className="flex items-center justify-between p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
                onClick={() => router.push(`/customers/${customer.id}`)}
              >
                <div className="flex items-center gap-4">
                  <div className="relative">
                    <span className={cn(
                      "absolute -top-1 -left-1 h-5 w-5 rounded-full flex items-center justify-center text-xs font-bold",
                      index === 0 ? "bg-yellow-500 text-white" :
                      index === 1 ? "bg-gray-400 text-white" :
                      index === 2 ? "bg-amber-600 text-white" :
                      "bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300"
                    )}>
                      {index + 1}
                    </span>
                    <Avatar fallback={customer.name} size="lg" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{customer.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{customer.email}</p>
                  </div>
                </div>
                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Orders</p>
                    <p className="font-medium text-gray-900 dark:text-white">{customer.ordersCount}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Total Spent</p>
                    <p className="font-medium text-gray-900 dark:text-white">{formatPrice(customer.totalSpent)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500 dark:text-gray-400">Points</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                      <span className="font-bold text-gray-900 dark:text-white">{customer.points.toLocaleString()}</span>
                    </div>
                  </div>
                  <span className={cn("px-2.5 py-0.5 rounded-full text-xs font-medium", getTierColor(customer.tier))}>
                    {customer.tier}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <Gift className="h-6 w-6 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Create Reward</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Add new loyalty rewards</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <Star className="h-6 w-6 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">Bonus Points</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Award bonus points to customers</p>
            </div>
          </CardContent>
        </Card>

        <Card className="hover:shadow-lg transition-shadow cursor-pointer">
          <CardContent className="p-6 flex items-center gap-4">
            <div className="h-12 w-12 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
            </div>
            <div>
              <h3 className="font-medium text-gray-900 dark:text-white">View Reports</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Loyalty program analytics</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
