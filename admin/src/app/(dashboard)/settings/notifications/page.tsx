'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  BellRing, 
  Mail, 
  Smartphone, 
  MessageSquare,
  ShoppingBag,
  Users,
  DollarSign,
  AlertTriangle,
  Megaphone,
  Save,
  CheckCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface NotificationSetting {
  id: string;
  category: string;
  title: string;
  description: string;
  email: boolean;
  push: boolean;
  sms: boolean;
}

const defaultSettings: NotificationSetting[] = [
  {
    id: 'new_order',
    category: 'Orders',
    title: 'New Orders',
    description: 'Get notified when a new order is placed',
    email: true,
    push: true,
    sms: false,
  },
  {
    id: 'order_status',
    category: 'Orders',
    title: 'Order Status Changes',
    description: 'Updates when order status changes',
    email: true,
    push: true,
    sms: false,
  },
  {
    id: 'order_cancelled',
    category: 'Orders',
    title: 'Order Cancellations',
    description: 'Alert when an order is cancelled',
    email: true,
    push: true,
    sms: true,
  },
  {
    id: 'low_stock',
    category: 'Inventory',
    title: 'Low Stock Alerts',
    description: 'When menu items are running low',
    email: true,
    push: false,
    sms: false,
  },
  {
    id: 'new_customer',
    category: 'Customers',
    title: 'New Customer Signups',
    description: 'When a new customer registers',
    email: false,
    push: false,
    sms: false,
  },
  {
    id: 'customer_review',
    category: 'Customers',
    title: 'Customer Reviews',
    description: 'When customers leave reviews',
    email: true,
    push: true,
    sms: false,
  },
  {
    id: 'payment_received',
    category: 'Payments',
    title: 'Payment Received',
    description: 'Confirmation of successful payments',
    email: true,
    push: false,
    sms: false,
  },
  {
    id: 'payment_failed',
    category: 'Payments',
    title: 'Payment Failed',
    description: 'Alert when a payment fails',
    email: true,
    push: true,
    sms: true,
  },
  {
    id: 'daily_summary',
    category: 'Reports',
    title: 'Daily Summary',
    description: 'Daily business performance summary',
    email: true,
    push: false,
    sms: false,
  },
  {
    id: 'weekly_report',
    category: 'Reports',
    title: 'Weekly Report',
    description: 'Weekly analytics and insights',
    email: true,
    push: false,
    sms: false,
  },
  {
    id: 'marketing_updates',
    category: 'Marketing',
    title: 'Campaign Performance',
    description: 'Updates on marketing campaign results',
    email: true,
    push: false,
    sms: false,
  },
  {
    id: 'system_alerts',
    category: 'System',
    title: 'System Alerts',
    description: 'Important system notifications',
    email: true,
    push: true,
    sms: true,
  },
];

const categoryIcons: Record<string, React.ReactNode> = {
  Orders: <ShoppingBag className="h-5 w-5" />,
  Inventory: <AlertTriangle className="h-5 w-5" />,
  Customers: <Users className="h-5 w-5" />,
  Payments: <DollarSign className="h-5 w-5" />,
  Reports: <BellRing className="h-5 w-5" />,
  Marketing: <Megaphone className="h-5 w-5" />,
  System: <AlertTriangle className="h-5 w-5" />,
};

const categoryColors: Record<string, string> = {
  Orders: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
  Inventory: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400',
  Customers: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
  Payments: 'bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400',
  Reports: 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400',
  Marketing: 'bg-pink-100 text-pink-600 dark:bg-pink-900/30 dark:text-pink-400',
  System: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400',
};

export default function NotificationsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [settings, setSettings] = useState<NotificationSetting[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/login');
      return;
    }
    setTimeout(() => {
      setSettings(defaultSettings);
      setLoading(false);
    }, 500);
  }, [router]);

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const toggleSetting = (id: string, channel: 'email' | 'push' | 'sms') => {
    setSettings(prev => prev.map(setting => 
      setting.id === id 
        ? { ...setting, [channel]: !setting[channel] }
        : setting
    ));
  };

  const toggleAllInCategory = (category: string, channel: 'email' | 'push' | 'sms', value: boolean) => {
    setSettings(prev => prev.map(setting => 
      setting.category === category 
        ? { ...setting, [channel]: value }
        : setting
    ));
  };

  const groupedSettings = settings.reduce((acc, setting) => {
    if (!acc[setting.category]) {
      acc[setting.category] = [];
    }
    acc[setting.category].push(setting);
    return acc;
  }, {} as Record<string, NotificationSetting[]>);

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Notification Preferences</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Choose how you want to receive notifications</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className={cn(
            "bg-primary-600 hover:bg-primary-700 text-white",
            saved && "bg-green-600 hover:bg-green-700"
          )}
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
              Saving...
            </>
          ) : saved ? (
            <>
              <CheckCircle className="h-4 w-4 mr-2" />
              Saved!
            </>
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </>
          )}
        </Button>
      </div>

      {/* Channel Legend */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-wrap items-center gap-6">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Notification Channels:</span>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <Mail className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Email</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <BellRing className="h-4 w-4 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">Push</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <MessageSquare className="h-4 w-4 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-600 dark:text-gray-300">SMS</span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Notification Settings by Category */}
      {Object.entries(groupedSettings).map(([category, categorySettings]) => (
        <Card key={category}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={cn("h-10 w-10 rounded-lg flex items-center justify-center", categoryColors[category])}>
                  {categoryIcons[category]}
                </div>
                <div>
                  <CardTitle className="text-base">{category}</CardTitle>
                  <CardDescription>{categorySettings.length} notification types</CardDescription>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">All:</span>
                  <button
                    onClick={() => toggleAllInCategory(category, 'email', true)}
                    className="h-6 w-6 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors"
                    title="Enable all email"
                  >
                    <Mail className="h-3 w-3 text-blue-600 dark:text-blue-400" />
                  </button>
                  <button
                    onClick={() => toggleAllInCategory(category, 'push', true)}
                    className="h-6 w-6 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center hover:bg-purple-200 dark:hover:bg-purple-900/50 transition-colors"
                    title="Enable all push"
                  >
                    <BellRing className="h-3 w-3 text-purple-600 dark:text-purple-400" />
                  </button>
                  <button
                    onClick={() => toggleAllInCategory(category, 'sms', true)}
                    className="h-6 w-6 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors"
                    title="Enable all SMS"
                  >
                    <MessageSquare className="h-3 w-3 text-green-600 dark:text-green-400" />
                  </button>
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {categorySettings.map((setting) => (
                <div 
                  key={setting.id}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900 dark:text-white">{setting.title}</h4>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{setting.description}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Email Toggle */}
                    <button
                      onClick={() => toggleSetting(setting.id, 'email')}
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center transition-all",
                        setting.email 
                          ? "bg-blue-500 text-white shadow-md" 
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                      )}
                      title="Email notifications"
                    >
                      <Mail className="h-4 w-4" />
                    </button>

                    {/* Push Toggle */}
                    <button
                      onClick={() => toggleSetting(setting.id, 'push')}
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center transition-all",
                        setting.push 
                          ? "bg-purple-500 text-white shadow-md" 
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                      )}
                      title="Push notifications"
                    >
                      <BellRing className="h-4 w-4" />
                    </button>

                    {/* SMS Toggle */}
                    <button
                      onClick={() => toggleSetting(setting.id, 'sms')}
                      className={cn(
                        "h-10 w-10 rounded-lg flex items-center justify-center transition-all",
                        setting.sms 
                          ? "bg-green-500 text-white shadow-md" 
                          : "bg-gray-200 dark:bg-gray-700 text-gray-400 hover:bg-gray-300 dark:hover:bg-gray-600"
                      )}
                      title="SMS notifications"
                    >
                      <MessageSquare className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {/* Quiet Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-primary-500" />
            Quiet Hours
          </CardTitle>
          <CardDescription>Pause non-urgent notifications during specific hours</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500 h-5 w-5"
                defaultChecked
              />
              <span className="text-gray-700 dark:text-gray-300">Enable quiet hours</span>
            </label>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500 dark:text-gray-400">From</span>
              <input
                type="time"
                defaultValue="22:00"
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">to</span>
              <input
                type="time"
                defaultValue="08:00"
                className="rounded-md border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">
            During quiet hours, only critical notifications (payment failures, system alerts) will be sent.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
