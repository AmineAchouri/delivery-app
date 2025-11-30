'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  CreditCard, 
  Plus, 
  Download,
  CheckCircle,
  AlertCircle,
  Calendar,
  DollarSign,
  Receipt,
  Zap,
  Crown,
  ArrowUpRight,
  ExternalLink
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  brand?: string;
  last4: string;
  expiry?: string;
  isDefault: boolean;
}

interface Invoice {
  id: string;
  number: string;
  date: string;
  amount: number;
  status: 'paid' | 'pending' | 'failed';
  description: string;
}

interface Plan {
  name: string;
  price: number;
  period: string;
  features: string[];
  current: boolean;
}

const mockPaymentMethods: PaymentMethod[] = [
  { id: '1', type: 'card', brand: 'Visa', last4: '4242', expiry: '12/25', isDefault: true },
  { id: '2', type: 'card', brand: 'Mastercard', last4: '8888', expiry: '06/26', isDefault: false },
];

const mockInvoices: Invoice[] = [
  { id: '1', number: 'INV-2024-001', date: '2024-11-01', amount: 99.00, status: 'paid', description: 'Pro Plan - November 2024' },
  { id: '2', number: 'INV-2024-002', date: '2024-10-01', amount: 99.00, status: 'paid', description: 'Pro Plan - October 2024' },
  { id: '3', number: 'INV-2024-003', date: '2024-09-01', amount: 99.00, status: 'paid', description: 'Pro Plan - September 2024' },
  { id: '4', number: 'INV-2024-004', date: '2024-08-01', amount: 49.00, status: 'paid', description: 'Starter Plan - August 2024' },
];

const plans: Plan[] = [
  {
    name: 'Starter',
    price: 49,
    period: 'month',
    features: ['Up to 100 orders/month', '1 staff member', 'Basic analytics', 'Email support'],
    current: false,
  },
  {
    name: 'Pro',
    price: 99,
    period: 'month',
    features: ['Unlimited orders', 'Up to 10 staff', 'Advanced analytics', 'Priority support', 'Marketing tools'],
    current: true,
  },
  {
    name: 'Enterprise',
    price: 249,
    period: 'month',
    features: ['Everything in Pro', 'Unlimited staff', 'Custom integrations', 'Dedicated support', 'SLA guarantee'],
    current: false,
  },
];

export default function BillingPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setTimeout(() => {
      setPaymentMethods(mockPaymentMethods);
      setInvoices(mockInvoices);
      setLoading(false);
    }, 500);
  }, [router]);

  const currentPlan = plans.find(p => p.current);
  const nextBillingDate = new Date();
  nextBillingDate.setMonth(nextBillingDate.getMonth() + 1);
  nextBillingDate.setDate(1);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const statusColors = {
    paid: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    failed: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-64 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Current Plan */}
      <Card className="bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20 border-primary-200 dark:border-primary-800">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 rounded-xl bg-primary-500 flex items-center justify-center">
                <Crown className="h-7 w-7 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">{currentPlan?.name} Plan</h3>
                  <Badge className="bg-primary-500 text-white">Current</Badge>
                </div>
                <p className="text-gray-600 dark:text-gray-300">
                  ${currentPlan?.price}/{currentPlan?.period} • Next billing: {formatDate(nextBillingDate.toISOString())}
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline">
                Cancel Plan
              </Button>
              <Button className="bg-primary-600 hover:bg-primary-700 text-white">
                <Zap className="h-4 w-4 mr-2" />
                Upgrade Plan
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Plans Comparison */}
      <div>
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Available Plans</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {plans.map((plan) => (
            <Card 
              key={plan.name}
              className={cn(
                "relative overflow-hidden transition-shadow hover:shadow-lg",
                plan.current && "ring-2 ring-primary-500"
              )}
            >
              {plan.current && (
                <div className="absolute top-0 right-0 bg-primary-500 text-white text-xs font-medium px-3 py-1 rounded-bl-lg">
                  Current
                </div>
              )}
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <div className="flex items-baseline gap-1">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">${plan.price}</span>
                  <span className="text-gray-500 dark:text-gray-400">/{plan.period}</span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Button 
                  className={cn(
                    "w-full",
                    plan.current 
                      ? "bg-gray-100 text-gray-500 cursor-not-allowed dark:bg-gray-700 dark:text-gray-400" 
                      : "bg-primary-600 hover:bg-primary-700 text-white"
                  )}
                  disabled={plan.current}
                >
                  {plan.current ? 'Current Plan' : 'Select Plan'}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-primary-500" />
                Payment Methods
              </CardTitle>
              <CardDescription>Manage your payment methods</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Method
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {paymentMethods.map((method) => (
              <div 
                key={method.id}
                className={cn(
                  "flex items-center justify-between p-4 rounded-lg border",
                  method.isDefault 
                    ? "border-primary-200 bg-primary-50 dark:border-primary-800 dark:bg-primary-900/20" 
                    : "border-gray-200 dark:border-gray-700"
                )}
              >
                <div className="flex items-center gap-4">
                  <div className="h-12 w-16 rounded-lg bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center text-white text-xs font-bold">
                    {method.brand}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {method.brand} •••• {method.last4}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Expires {method.expiry}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  {method.isDefault && (
                    <Badge className="bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-400">
                      Default
                    </Badge>
                  )}
                  <Button variant="ghost" size="sm">Edit</Button>
                  {!method.isDefault && (
                    <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700 hover:bg-red-50">
                      Remove
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Billing History */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Receipt className="h-5 w-5 text-primary-500" />
                Billing History
              </CardTitle>
              <CardDescription>View and download your invoices</CardDescription>
            </div>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Export All
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="bg-gray-50 dark:bg-gray-800/50">
                <TableHead>Invoice</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="text-right">Amount</TableHead>
                <TableHead className="text-center">Status</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invoices.map((invoice) => (
                <TableRow key={invoice.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <TableCell>
                    <span className="font-medium text-gray-900 dark:text-white">{invoice.number}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600 dark:text-gray-300">{formatDate(invoice.date)}</span>
                  </TableCell>
                  <TableCell>
                    <span className="text-gray-600 dark:text-gray-300">{invoice.description}</span>
                  </TableCell>
                  <TableCell className="text-right">
                    <span className="font-medium text-gray-900 dark:text-white">${invoice.amount.toFixed(2)}</span>
                  </TableCell>
                  <TableCell className="text-center">
                    <span className={cn(
                      "inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium",
                      statusColors[invoice.status]
                    )}>
                      {invoice.status === 'paid' && <CheckCircle className="h-3 w-3" />}
                      {invoice.status === 'failed' && <AlertCircle className="h-3 w-3" />}
                      {invoice.status.charAt(0).toUpperCase() + invoice.status.slice(1)}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                      <Download className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary-500" />
            Current Usage
          </CardTitle>
          <CardDescription>Your usage for this billing period</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Orders</span>
                <span className="font-medium text-gray-900 dark:text-white">1,234 / Unlimited</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-green-500 rounded-full" style={{ width: '100%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Staff Members</span>
                <span className="font-medium text-gray-900 dark:text-white">6 / 10</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '60%' }} />
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-300">Storage</span>
                <span className="font-medium text-gray-900 dark:text-white">2.4 GB / 10 GB</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                <div className="h-full bg-purple-500 rounded-full" style={{ width: '24%' }} />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
