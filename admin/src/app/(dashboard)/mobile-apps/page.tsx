'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Smartphone, 
  QrCode, 
  Download, 
  Star, 
  CheckCircle2,
  Apple,
  PlayCircle,
  Users,
  TrendingUp,
  MessageSquare,
  Share2,
  ExternalLink,
  Copy,
  Check,
  Globe,
  Wifi,
  Bell,
  Zap
} from 'lucide-react';

export default function MobileAppsPage() {
  const { selectedTenant, tenantSettings } = useAuth();
  const [copied, setCopied] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Build the PWA URL based on tenant
  const getPwaUrl = () => {
    const baseUrl = process.env.NEXT_PUBLIC_MOBILE_PWA_URL || 'http://localhost:3002';
    const tenantSlug = selectedTenant?.domain || selectedTenant?.name?.toLowerCase().replace(/\s+/g, '-') || 'bella-italia';
    return `${baseUrl}/${tenantSlug}/menu`;
  };

  const pwaUrl = getPwaUrl();

  // Generate QR code using canvas (no external dependency needed)
  useEffect(() => {
    const generateQRCode = async () => {
      try {
        // Use a free QR code API
        const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=256x256&data=${encodeURIComponent(pwaUrl)}&bgcolor=ffffff&color=1e293b`;
        setQrCodeDataUrl(qrApiUrl);
      } catch (err) {
        console.error('Failed to generate QR code:', err);
      }
    };
    
    if (pwaUrl) {
      generateQRCode();
    }
  }, [pwaUrl]);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(pwaUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const downloadQRCode = async () => {
    if (!qrCodeDataUrl) return;
    
    try {
      const response = await fetch(qrCodeDataUrl);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.download = `${selectedTenant?.name || 'restaurant'}-qr-code.png`;
      link.href = url;
      link.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Failed to download QR code:', err);
    }
  };

  const shareLink = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${selectedTenant?.name || 'Restaurant'} - Order Online`,
          text: 'Order delicious food from our restaurant!',
          url: pwaUrl,
        });
      } catch (err) {
        console.error('Share failed:', err);
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mobile Apps</h1>
        <p className="text-muted-foreground mt-2">
          Promote your restaurant's mobile apps to customers and drivers
        </p>
      </div>

      {/* Hero Section - PWA Link & QR Code */}
      <Card className="bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 text-white border-0 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-white/10 rounded-full -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/10 rounded-full -ml-32 -mb-32"></div>
        <CardContent className="p-8 relative z-10">
          <div className="grid gap-8 md:grid-cols-2">
            {/* Left: Info */}
            <div className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                  <Smartphone className="h-8 w-8" />
                </div>
                <div>
                  <h2 className="text-3xl font-bold">{selectedTenant?.name || 'Your Restaurant'}</h2>
                  <p className="text-white/90">Mobile Ordering PWA</p>
                </div>
              </div>
              
              {/* PWA Link Box */}
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 space-y-3">
                <p className="text-sm font-medium text-white/80">Your Mobile App Link:</p>
                <div className="flex items-center gap-2">
                  <div className="flex-1 p-3 bg-white/20 rounded-lg font-mono text-sm break-all">
                    {pwaUrl}
                  </div>
                  <Button 
                    variant="secondary" 
                    size="icon"
                    onClick={copyToClipboard}
                    className="flex-shrink-0 bg-white/20 hover:bg-white/30 border-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4 text-green-300" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={() => window.open(pwaUrl, '_blank')}
                    className="bg-white text-indigo-600 hover:bg-white/90"
                  >
                    <ExternalLink className="h-4 w-4 mr-2" />
                    Open App
                  </Button>
                  <Button 
                    variant="secondary" 
                    size="sm"
                    onClick={shareLink}
                    className="bg-white/20 hover:bg-white/30 border-0"
                  >
                    <Share2 className="h-4 w-4 mr-2" />
                    Share
                  </Button>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">No App Store Required</p>
                    <p className="text-sm text-white/80">Works instantly in any browser</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Install to Home Screen</p>
                    <p className="text-sm text-white/80">Feels like a native app</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold">Always Up to Date</p>
                    <p className="text-sm text-white/80">Menu changes reflect instantly</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right: QR Code */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="text-center">
                <p className="text-lg font-semibold mb-4">Scan to Order</p>
                <div className="bg-white rounded-2xl p-4 space-y-3">
                  {qrCodeDataUrl ? (
                    <img 
                      src={qrCodeDataUrl} 
                      alt="QR Code" 
                      className="h-48 w-48 mx-auto"
                    />
                  ) : (
                    <div className="h-48 w-48 bg-slate-100 rounded-xl flex items-center justify-center mx-auto">
                      <QrCode className="h-32 w-32 text-slate-300 animate-pulse" />
                    </div>
                  )}
                  <div className="space-y-1">
                    <p className="text-sm font-bold text-slate-900">{selectedTenant?.name || 'Restaurant'}</p>
                    <p className="text-xs text-slate-600">Scan with your camera</p>
                  </div>
                </div>
                <Button 
                  variant="secondary" 
                  size="sm"
                  onClick={downloadQRCode}
                  className="mt-4 bg-white/20 hover:bg-white/30 border-0"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Download QR Code
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* PWA Features */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            PWA Features
          </CardTitle>
          <CardDescription>
            Progressive Web App benefits for your customers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-slate-50 dark:bg-slate-800">
              <div className="p-2 rounded-lg bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <Smartphone className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Install to Home Screen</p>
                <p className="text-sm text-muted-foreground">Works like a native app</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-slate-50 dark:bg-slate-800">
              <div className="p-2 rounded-lg bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <Wifi className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Works Offline</p>
                <p className="text-sm text-muted-foreground">Browse menu without internet</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-slate-50 dark:bg-slate-800">
              <div className="p-2 rounded-lg bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <Bell className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Push Notifications</p>
                <p className="text-sm text-muted-foreground">Order updates in real-time</p>
              </div>
            </div>
            <div className="flex items-start gap-3 p-4 rounded-xl border bg-slate-50 dark:bg-slate-800">
              <div className="p-2 rounded-lg bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400">
                <Zap className="h-5 w-5" />
              </div>
              <div>
                <p className="font-medium">Fast & Lightweight</p>
                <p className="text-sm text-muted-foreground">No app store needed</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Print-Ready QR Materials */}
      <Card>
        <CardHeader>
          <CardTitle>Print-Ready Materials</CardTitle>
          <CardDescription>
            Download QR code materials for your restaurant
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {/* Table Tent */}
            <div className="p-4 border rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={downloadQRCode}>
              <div className="w-full aspect-[3/4] bg-gradient-to-b from-indigo-500 to-purple-600 rounded-lg mb-3 flex flex-col items-center justify-center text-white p-4">
                <p className="text-xs font-semibold mb-2">SCAN TO ORDER</p>
                <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center">
                  <QrCode className="h-12 w-12 text-slate-800" />
                </div>
                <p className="text-[10px] mt-2 opacity-80">{selectedTenant?.name}</p>
              </div>
              <p className="text-sm font-medium">Table Tent</p>
              <p className="text-xs text-muted-foreground">4" x 6"</p>
            </div>

            {/* Poster */}
            <div className="p-4 border rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={downloadQRCode}>
              <div className="w-full aspect-[3/4] bg-gradient-to-b from-pink-500 to-rose-600 rounded-lg mb-3 flex flex-col items-center justify-center text-white p-4">
                <p className="text-sm font-bold mb-2">ORDER ONLINE</p>
                <div className="w-20 h-20 bg-white rounded-lg flex items-center justify-center">
                  <QrCode className="h-16 w-16 text-slate-800" />
                </div>
                <p className="text-[10px] mt-2 opacity-80">Scan Me!</p>
              </div>
              <p className="text-sm font-medium">Poster</p>
              <p className="text-xs text-muted-foreground">8.5" x 11"</p>
            </div>

            {/* Sticker */}
            <div className="p-4 border rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={downloadQRCode}>
              <div className="w-full aspect-square bg-white border-4 border-slate-200 rounded-full mb-3 flex flex-col items-center justify-center p-4">
                <div className="w-16 h-16 bg-slate-100 rounded-lg flex items-center justify-center">
                  <QrCode className="h-12 w-12 text-slate-800" />
                </div>
                <p className="text-[8px] mt-1 text-slate-600 font-medium">SCAN TO ORDER</p>
              </div>
              <p className="text-sm font-medium">Sticker</p>
              <p className="text-xs text-muted-foreground">3" x 3"</p>
            </div>

            {/* Business Card */}
            <div className="p-4 border rounded-xl text-center hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer" onClick={downloadQRCode}>
              <div className="w-full aspect-[1.75/1] bg-slate-900 rounded-lg mb-3 flex items-center justify-between text-white p-3">
                <div className="text-left">
                  <p className="text-[10px] font-bold">{selectedTenant?.name || 'Restaurant'}</p>
                  <p className="text-[8px] opacity-70">Order Online</p>
                </div>
                <div className="w-12 h-12 bg-white rounded flex items-center justify-center">
                  <QrCode className="h-10 w-10 text-slate-800" />
                </div>
              </div>
              <p className="text-sm font-medium">Business Card</p>
              <p className="text-xs text-muted-foreground">3.5" x 2"</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Downloads</CardTitle>
            <Download className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">10,234</div>
            <p className="text-xs text-muted-foreground">+12% from last month</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8,456</div>
            <p className="text-xs text-muted-foreground">82% retention rate</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">65%</div>
            <p className="text-xs text-muted-foreground">Of total orders</p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">App Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8/5</div>
            <p className="text-xs text-muted-foreground">From 10,234 reviews</p>
          </CardContent>
        </Card>
      </div>

      {/* Two Apps */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Customer App */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Customer App</CardTitle>
                  <CardDescription>For your customers</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">Live</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Allow customers to browse your menu, place orders, track deliveries, and manage their profiles.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Key Features:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Browse menu with photos
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Easy checkout & payment
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Real-time order tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Order history & favorites
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Push notifications
                </li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Store
              </Button>
              <Button className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Driver App */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-orange-500 to-red-500 flex items-center justify-center">
                  <Smartphone className="h-6 w-6 text-white" />
                </div>
                <div>
                  <CardTitle>Driver App</CardTitle>
                  <CardDescription>For delivery drivers</CardDescription>
                </div>
              </div>
              <Badge variant="secondary" className="bg-green-100 text-green-700">Live</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Enable drivers to accept deliveries, navigate to locations, and update order status in real-time.
            </p>
            
            <div className="space-y-2">
              <h4 className="font-semibold text-sm">Key Features:</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Accept/reject deliveries
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  GPS navigation
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Update order status
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Earnings tracking
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  Customer contact
                </li>
              </ul>
            </div>

            <div className="flex gap-2 pt-2">
              <Button className="flex-1" variant="outline">
                <ExternalLink className="h-4 w-4 mr-2" />
                View in Store
              </Button>
              <Button className="flex-1">
                <Share2 className="h-4 w-4 mr-2" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Promotion Tips */}
      <Card>
        <CardHeader>
          <CardTitle>Promote Your Apps</CardTitle>
          <CardDescription>Tips to increase app downloads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-lg bg-blue-100 flex items-center justify-center">
                <QrCode className="h-5 w-5 text-blue-600" />
              </div>
              <h4 className="font-semibold">Print QR Codes</h4>
              <p className="text-sm text-muted-foreground">
                Add QR codes to receipts, menus, and packaging for easy downloads
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-lg bg-purple-100 flex items-center justify-center">
                <MessageSquare className="h-5 w-5 text-purple-600" />
              </div>
              <h4 className="font-semibold">Social Media</h4>
              <p className="text-sm text-muted-foreground">
                Share app links on your social media channels regularly
              </p>
            </div>
            
            <div className="space-y-2">
              <div className="h-10 w-10 rounded-lg bg-green-100 flex items-center justify-center">
                <Star className="h-5 w-5 text-green-600" />
              </div>
              <h4 className="font-semibold">Incentivize</h4>
              <p className="text-sm text-muted-foreground">
                Offer discounts or free delivery for first-time app users
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
