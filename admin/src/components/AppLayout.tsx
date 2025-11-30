'use client';

import { ReactNode, useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { 
  Menu, 
  X, 
  Bell, 
  Search,
  Moon,
  Sun,
  User,
  LayoutDashboard,
  ShoppingBag,
  UtensilsCrossed,
  Users,
  BarChart3,
  Megaphone,
  Settings,
  LogOut,
  ChevronDown,
  Store,
  HelpCircle,
  Building2,
  Shield,
  UserCog
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface AppLayoutProps {
  children: ReactNode;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  superAdminOnly?: boolean;
}

const mainNavItems: NavItem[] = [
  { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
  { name: 'Restaurants', href: '/restaurants', icon: Building2, superAdminOnly: true },
  { name: 'Platform Admins', href: '/platform-admins', icon: UserCog, superAdminOnly: true },
  { name: 'Orders', href: '/orders', icon: ShoppingBag },
  { name: 'Menu', href: '/menu', icon: UtensilsCrossed },
  { name: 'Customers', href: '/customers', icon: Users },
  { name: 'Analytics', href: '/analytics', icon: BarChart3 },
  { name: 'Marketing', href: '/marketing', icon: Megaphone },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function AppLayout({ children }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [tenantSelectorOpen, setTenantSelectorOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();
  const { 
    platformAdmin, 
    tenantUser,
    tenants, 
    selectedTenant, 
    selectTenant, 
    logout, 
    isAuthenticated, 
    isLoading,
    isPlatformAdmin,
    isSuperAdmin,
    isTenantOwner,
    userType
  } = useAuth();

  // Get display name and email based on user type
  const displayName = isPlatformAdmin 
    ? (platformAdmin?.name || 'Admin')
    : (tenantUser?.email?.split('@')[0] || 'User');
  const displayEmail = isPlatformAdmin 
    ? (platformAdmin?.email || '')
    : (tenantUser?.email || '');

  useEffect(() => {
    setMounted(true);
    
    if (typeof window !== 'undefined') {
      const isDark = localStorage.getItem('darkMode') === 'true';
      setDarkMode(isDark);
      document.documentElement.classList.toggle('dark', isDark);
    }
  }, []);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    setDarkMode(newDarkMode);
    localStorage.setItem('darkMode', String(newDarkMode));
    document.documentElement.classList.toggle('dark', newDarkMode);
  };

  const handleLogout = async () => {
    await logout();
  };

  // Filter nav items based on role
  const filteredNavItems = mainNavItems.filter(item => {
    if (item.superAdminOnly && !isSuperAdmin) {
      return false;
    }
    return true;
  });

  const isActive = (href: string) => {
    if (href === '/dashboard') return pathname === '/dashboard';
    return pathname === href || pathname?.startsWith(`${href}/`);
  };

  if (!mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-100 dark:bg-slate-900">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-900">
      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={cn(
        "fixed top-0 bottom-0 left-0 z-50 w-72 flex flex-col bg-white dark:bg-slate-800 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0",
        sidebarOpen ? 'translate-x-0' : '-translate-x-full'
      )}>
        {/* Sidebar Header */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-slate-200 dark:border-slate-700">
          <Link href="/dashboard" className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30">
              <Store className="h-5 w-5 text-white" />
            </div>
            <div>
              <span className="font-bold text-slate-900 dark:text-white text-lg">DeliveryApp</span>
              <span className="block text-xs text-slate-500 dark:text-slate-400">Admin Panel</span>
            </div>
          </Link>
          <button 
            onClick={() => setSidebarOpen(false)}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Tenant Selector */}
        {tenants.length > 0 && (
          <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
            <p className="px-2 mb-2 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              Restaurant
            </p>
            <div className="relative">
              <button
                onClick={() => setTenantSelectorOpen(!tenantSelectorOpen)}
                className="w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl bg-slate-100 dark:bg-slate-700 text-sm font-medium text-slate-900 dark:text-white hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <Building2 className="h-4 w-4 text-indigo-500 flex-shrink-0" />
                  <span className="truncate">{selectedTenant?.name || 'Select Restaurant'}</span>
                </div>
                <ChevronDown className={cn(
                  "h-4 w-4 text-slate-400 transition-transform",
                  tenantSelectorOpen && "rotate-180"
                )} />
              </button>
              
              {tenantSelectorOpen && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 py-1 z-50 max-h-60 overflow-y-auto">
                  {tenants.map((tenant) => (
                    <button
                      key={tenant.tenant_id}
                      onClick={() => {
                        selectTenant(tenant);
                        setTenantSelectorOpen(false);
                      }}
                      className={cn(
                        "w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors",
                        selectedTenant?.tenant_id === tenant.tenant_id && "bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 dark:text-indigo-400"
                      )}
                    >
                      <Building2 className="h-4 w-4 flex-shrink-0" />
                      <div className="min-w-0">
                        <p className="font-medium truncate">{tenant.name}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{tenant.domain}</p>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav className="flex-1 px-4 py-6 space-y-1 overflow-y-auto">
          <p className="px-3 mb-3 text-xs font-semibold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Main Menu
          </p>
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.href);
            
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setSidebarOpen(false)}
                className={cn(
                  'group flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-200',
                  active
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg shadow-indigo-500/30'
                    : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-700/50'
                )}
              >
                <Icon className={cn(
                  'h-5 w-5 flex-shrink-0 transition-transform group-hover:scale-110',
                  active ? 'text-white' : 'text-slate-400 group-hover:text-indigo-500'
                )} />
                <span>{item.name}</span>
                {item.superAdminOnly && (
                  <Shield className="h-3 w-3 ml-auto text-amber-500" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-4 border-t border-slate-200 dark:border-slate-700">
          <div className="p-4 rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-slate-700 dark:to-slate-800">
            <div className="flex items-center gap-3 mb-3">
              <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold">
                {displayName.charAt(0).toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{displayName}</p>
                <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{displayEmail}</p>
                <span className={cn(
                  "inline-flex items-center gap-1 mt-1 px-2 py-0.5 rounded-full text-xs font-medium",
                  isSuperAdmin 
                    ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400"
                    : isPlatformAdmin
                    ? "bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400"
                    : "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400"
                )}>
                  {isSuperAdmin && <Shield className="h-3 w-3" />}
                  {isSuperAdmin ? 'Super Admin' : isPlatformAdmin ? 'Platform Admin' : isTenantOwner ? 'Owner' : 'User'}
                </span>
              </div>
            </div>
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-red-600 hover:bg-red-50 dark:text-slate-300 dark:hover:text-red-400 dark:hover:bg-red-900/20 transition-colors"
            >
              <LogOut className="h-4 w-4" />
              Sign Out
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:pl-72">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-800/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-700">
          <div className="h-16 px-4 sm:px-6 lg:px-8 flex items-center justify-between gap-4">
            {/* Left side - Mobile menu + Search */}
            <div className="flex items-center gap-4 flex-1">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700"
              >
                <Menu className="h-5 w-5" />
              </button>

              {/* Search */}
              <div className="hidden sm:flex flex-1 max-w-lg">
                <div className="relative w-full">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search anything..."
                    className="w-full h-11 pl-11 pr-4 rounded-xl border border-slate-200 dark:border-slate-600 bg-slate-50 dark:bg-slate-700 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent transition-shadow"
                  />
                </div>
              </div>
            </div>

            {/* Right side actions */}
            <div className="flex items-center gap-2">
              {/* Dark mode toggle */}
              <button
                onClick={toggleDarkMode}
                className="p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                title={darkMode ? 'Light mode' : 'Dark mode'}
              >
                {darkMode ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
              </button>

              {/* Help */}
              <button className="hidden sm:flex p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <HelpCircle className="h-5 w-5" />
              </button>

              {/* Notifications */}
              <button className="relative p-2.5 rounded-xl text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors">
                <Bell className="h-5 w-5" />
                <span className="absolute top-2 right-2 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white dark:ring-slate-800"></span>
              </button>

              {/* Profile dropdown */}
              <div className="relative">
                <button 
                  onClick={() => setProfileOpen(!profileOpen)}
                  className="flex items-center gap-2 p-1.5 pr-3 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
                >
                  <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center text-white font-semibold text-sm">
                    {displayName.charAt(0).toUpperCase()}
                  </div>
                  <ChevronDown className={cn(
                    "h-4 w-4 text-slate-400 transition-transform",
                    profileOpen && "rotate-180"
                  )} />
                </button>

                {profileOpen && (
                  <>
                    <div className="fixed inset-0 z-10" onClick={() => setProfileOpen(false)} />
                    <div className="absolute right-0 mt-2 w-56 rounded-xl bg-white dark:bg-slate-800 shadow-xl border border-slate-200 dark:border-slate-700 py-2 z-20">
                      <div className="px-4 py-3 border-b border-slate-200 dark:border-slate-700">
                        <p className="text-sm font-medium text-slate-900 dark:text-white">{displayName}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{displayEmail}</p>
                      </div>
                      <div className="py-1">
                        <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                          <User className="h-4 w-4" />
                          Profile
                        </Link>
                        <Link href="/settings" onClick={() => setProfileOpen(false)} className="flex items-center gap-2 px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700">
                          <Settings className="h-4 w-4" />
                          Settings
                        </Link>
                        <button 
                          onClick={handleLogout}
                          className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <LogOut className="h-4 w-4" />
                          Sign Out
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="min-h-[calc(100vh-4rem)] p-4 sm:p-6 lg:p-8">
          <div className="w-full">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
