'use client';

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
  ExternalLink
} from 'lucide-react';

export default function MobileAppsPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Mobile Apps</h1>
        <p className="text-muted-foreground mt-2">
          Promote your restaurant's mobile apps to customers and drivers
        </p>
      </div>

      {/* Hero Section */}
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
                  <h2 className="text-3xl font-bold">Your Restaurant Apps</h2>
                  <p className="text-white/90">Available on iOS & Android</p>
                </div>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-lg">Customer App</p>
                    <p className="text-white/80">Browse menu, place orders, and track deliveries</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-lg">Driver App</p>
                    <p className="text-white/80">Accept deliveries, navigate, and earn money</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="font-semibold text-lg">Real-time Sync</p>
                    <p className="text-white/80">All orders sync instantly across all platforms</p>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2 pt-4">
                <Star className="h-6 w-6 fill-yellow-300 text-yellow-300" />
                <Star className="h-6 w-6 fill-yellow-300 text-yellow-300" />
                <Star className="h-6 w-6 fill-yellow-300 text-yellow-300" />
                <Star className="h-6 w-6 fill-yellow-300 text-yellow-300" />
                <Star className="h-6 w-6 fill-yellow-300 text-yellow-300" />
                <span className="ml-2 text-lg font-semibold">4.8/5 (10K+ reviews)</span>
              </div>
            </div>

            {/* Right: QR Codes */}
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="text-center">
                <p className="text-lg font-semibold mb-4">Scan to Download</p>
                <div className="grid grid-cols-2 gap-4">
                  {/* App Store QR */}
                  <div className="bg-white rounded-2xl p-4 space-y-3">
                    <div className="h-32 w-32 bg-slate-100 rounded-xl flex items-center justify-center">
                      <QrCode className="h-28 w-28 text-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2 text-slate-900">
                        <Apple className="h-4 w-4" />
                        <span className="text-sm font-bold">App Store</span>
                      </div>
                      <p className="text-xs text-slate-600">iOS 13+</p>
                    </div>
                  </div>
                  
                  {/* Play Store QR */}
                  <div className="bg-white rounded-2xl p-4 space-y-3">
                    <div className="h-32 w-32 bg-slate-100 rounded-xl flex items-center justify-center">
                      <QrCode className="h-28 w-28 text-slate-800" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center justify-center gap-2 text-slate-900">
                        <PlayCircle className="h-4 w-4" />
                        <span className="text-sm font-bold">Play Store</span>
                      </div>
                      <p className="text-xs text-slate-600">Android 8+</p>
                    </div>
                  </div>
                </div>
              </div>
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
