'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, useAuthenticatedFetch } from '@/contexts/AuthContext';
import { 
  Settings, 
  Store, 
  MapPin, 
  Phone, 
  Mail, 
  Globe,
  Clock,
  Camera,
  Save,
  Upload,
  CheckCircle,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';

const API_BASE_URL = '';

interface BusinessSettings {
  name: string;
  description: string;
  email: string;
  phone: string;
  website: string;
  address: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
  timezone: string;
  currency: string;
  logo?: string;
}

interface OperatingHours {
  day: string;
  open: string;
  close: string;
  closed: boolean;
}

export default function SettingsPage() {
  const router = useRouter();
  const { selectedTenant, updateTenantSettings: updateContextSettings } = useAuth();
  const authFetch = useAuthenticatedFetch();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  
  // Use tenant data as defaults, fall back to empty values
  const [settings, setSettings] = useState<BusinessSettings>({
    name: '',
    description: '',
    email: '',
    phone: '',
    website: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    country: '',
    timezone: 'America/New_York',
    currency: 'USD',
    logo: '',
  });

  const [operatingHours, setOperatingHours] = useState<OperatingHours[]>([
    { day: 'Monday', open: '09:00', close: '22:00', closed: false },
    { day: 'Tuesday', open: '09:00', close: '22:00', closed: false },
    { day: 'Wednesday', open: '09:00', close: '22:00', closed: false },
    { day: 'Thursday', open: '09:00', close: '22:00', closed: false },
    { day: 'Friday', open: '09:00', close: '23:00', closed: false },
    { day: 'Saturday', open: '10:00', close: '23:00', closed: false },
    { day: 'Sunday', open: '10:00', close: '21:00', closed: false },
  ]);

  const fetchSettings = async () => {
    try {
      const response = await authFetch(`${API_BASE_URL}/api/tenant/settings`);
      if (response.ok) {
        const data = await response.json();
        // Map API response to settings object
        setSettings(prev => ({
          ...prev,
          logo: data.logo || '',
          name: data.name || selectedTenant?.name || '',
          description: data.description || '',
          email: data.email || '',
          phone: data.phone || '',
          website: data.website || (selectedTenant?.domain ? `https://${selectedTenant.domain}` : ''),
          address: data.address || '',
          city: data.city || '',
          state: data.state || '',
          zipCode: data.zipCode || '',
          country: data.country || '',
          timezone: data.timezone || 'America/New_York',
          currency: data.currency || 'USD',
        }));
        
        // Load operating hours if saved
        if (data.operatingHours) {
          try {
            setOperatingHours(JSON.parse(data.operatingHours));
          } catch (e) {
            console.error('Failed to parse operating hours');
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token') || localStorage.getItem('accessToken');
    if (!token) {
      router.push('/login');
      return;
    }
    
    if (selectedTenant) {
      fetchSettings();
    }
    
    setLoading(false);
  }, [router, selectedTenant]);

  const handleSave = async () => {
    setSaving(true);
    try {
      // Save to backend API
      const settingsToSave = {
        ...settings,
        operatingHours: JSON.stringify(operatingHours)
      };
      
      const response = await authFetch(`${API_BASE_URL}/api/tenant/settings`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settingsToSave)
      });
      
      if (response.ok) {
        const savedSettings = await response.json();
        // Update the cached settings in context
        updateContextSettings(savedSettings);
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        const errorData = await response.json().catch(() => ({}));
        alert(errorData.error || 'Failed to save settings');
      }
    } catch (error) {
      console.error('Failed to save settings:', error);
      alert('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const updateSettings = (field: keyof BusinessSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  const updateHours = (index: number, field: keyof OperatingHours, value: string | boolean) => {
    setOperatingHours(prev => {
      const updated = [...prev];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-6">
          <div className="h-48 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="h-96 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">General Settings</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400">Manage your business information and preferences</p>
        </div>
        <Button 
          onClick={handleSave} 
          disabled={saving}
          className={cn(
            saved && "!bg-green-600 hover:!bg-green-700"
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

      {/* Business Logo & Name */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Store className="h-5 w-5 text-indigo-500" />
            Business Profile
          </CardTitle>
          <CardDescription>Your business identity and branding</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col sm:flex-row gap-6">
            {/* Logo Upload */}
            <div className="flex flex-col items-center gap-3">
              <div className="h-32 w-32 rounded-xl bg-gradient-to-br from-indigo-100 to-indigo-200 dark:from-indigo-900 dark:to-indigo-800 flex items-center justify-center border-2 border-dashed border-indigo-300 dark:border-indigo-700 overflow-hidden">
                {settings.logo ? (
                  <img src={settings.logo} alt="Logo" className="h-full w-full object-cover" />
                ) : (
                  <Camera className="h-10 w-10 text-indigo-500" />
                )}
              </div>
              <input
                type="file"
                id="logo-upload"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = async () => {
                      try {
                        // Upload to server
                        const response = await authFetch(`${API_BASE_URL}/api/tenant/upload`, {
                          method: 'POST',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({
                            data: reader.result,
                            type: 'logo'
                          })
                        });
                        
                        if (response.ok) {
                          const { url } = await response.json();
                          // Store the URL (prepend API base for full path)
                          updateSettings('logo', `${API_BASE_URL}${url}`);
                        } else {
                          alert('Failed to upload logo');
                        }
                      } catch (error) {
                        console.error('Upload error:', error);
                        alert('Failed to upload logo');
                      }
                    };
                    reader.readAsDataURL(file);
                  }
                }}
              />
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => document.getElementById('logo-upload')?.click()}
              >
                <Upload className="h-4 w-4 mr-2" />
                Upload Logo
              </Button>
            </div>

            {/* Business Info */}
            <div className="flex-1 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Business Name
                </label>
                <Input
                  value={settings.name}
                  onChange={(e) => updateSettings('name', e.target.value)}
                  placeholder="Enter business name"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  value={settings.description}
                  onChange={(e) => updateSettings('description', e.target.value)}
                  placeholder="Describe your business"
                  rows={3}
                  className="flex w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:border-indigo-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-400"
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contact Information */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Phone className="h-5 w-5 text-indigo-500" />
            Contact Information
          </CardTitle>
          <CardDescription>How customers can reach you</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Mail className="h-4 w-4 inline mr-1" />
                Email Address
              </label>
              <Input
                type="email"
                value={settings.email}
                onChange={(e) => updateSettings('email', e.target.value)}
                placeholder="contact@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Phone className="h-4 w-4 inline mr-1" />
                Phone Number
              </label>
              <Input
                type="tel"
                value={settings.phone}
                onChange={(e) => updateSettings('phone', e.target.value)}
                placeholder="+1 (555) 123-4567"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                <Globe className="h-4 w-4 inline mr-1" />
                Website
              </label>
              <Input
                type="url"
                value={settings.website}
                onChange={(e) => updateSettings('website', e.target.value)}
                placeholder="https://example.com"
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Address */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-indigo-500" />
            Business Address
          </CardTitle>
          <CardDescription>Your physical location</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Street Address
              </label>
              <Input
                value={settings.address}
                onChange={(e) => updateSettings('address', e.target.value)}
                placeholder="123 Main Street"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                City
              </label>
              <Input
                value={settings.city}
                onChange={(e) => updateSettings('city', e.target.value)}
                placeholder="New York"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                State / Province
              </label>
              <Input
                value={settings.state}
                onChange={(e) => updateSettings('state', e.target.value)}
                placeholder="NY"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                ZIP / Postal Code
              </label>
              <Input
                value={settings.zipCode}
                onChange={(e) => updateSettings('zipCode', e.target.value)}
                placeholder="10001"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Country
              </label>
              <Select
                value={settings.country}
                onChange={(e) => updateSettings('country', e.target.value)}
              >
                <option value="United States">United States</option>
                <option value="Canada">Canada</option>
                <option value="United Kingdom">United Kingdom</option>
                <option value="Australia">Australia</option>
                <option value="Germany">Germany</option>
                <option value="France">France</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Operating Hours */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-indigo-500" />
            Operating Hours
          </CardTitle>
          <CardDescription>Set your business hours for each day</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {operatingHours.map((hours, index) => (
              <div 
                key={hours.day}
                className={cn(
                  "flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg",
                  hours.closed ? "bg-gray-50 dark:bg-gray-800/50" : "bg-white dark:bg-gray-800"
                )}
              >
                <div className="w-28 font-medium text-gray-900 dark:text-white">
                  {hours.day}
                </div>
                <div className="flex items-center gap-3 flex-1">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={hours.closed}
                      onChange={(e) => updateHours(index, 'closed', e.target.checked)}
                      className="rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
                    />
                    <span className="text-sm text-gray-600 dark:text-gray-300">Closed</span>
                  </label>
                  {!hours.closed && (
                    <>
                      <Input
                        type="time"
                        value={hours.open}
                        onChange={(e) => updateHours(index, 'open', e.target.value)}
                        className="w-32"
                      />
                      <span className="text-gray-500">to</span>
                      <Input
                        type="time"
                        value={hours.close}
                        onChange={(e) => updateHours(index, 'close', e.target.value)}
                        className="w-32"
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Regional Settings */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5 text-indigo-500" />
            Regional Settings
          </CardTitle>
          <CardDescription>Timezone and currency preferences</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Timezone
              </label>
              <Select
                value={settings.timezone}
                onChange={(e) => updateSettings('timezone', e.target.value)}
              >
                <option value="America/New_York">Eastern Time (ET)</option>
                <option value="America/Chicago">Central Time (CT)</option>
                <option value="America/Denver">Mountain Time (MT)</option>
                <option value="America/Los_Angeles">Pacific Time (PT)</option>
                <option value="Europe/London">London (GMT)</option>
                <option value="Europe/Paris">Paris (CET)</option>
              </Select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Currency
              </label>
              <Select
                value={settings.currency}
                onChange={(e) => updateSettings('currency', e.target.value)}
              >
                <option value="USD">US Dollar (USD)</option>
                <option value="EUR">Euro (EUR)</option>
                <option value="GBP">British Pound (GBP)</option>
                <option value="CAD">Canadian Dollar (CAD)</option>
                <option value="AUD">Australian Dollar (AUD)</option>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
