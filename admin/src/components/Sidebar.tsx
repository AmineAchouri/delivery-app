'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Utensils, 
  Users, 
  Settings, 
  BarChart2,
  ChevronDown,
  ChevronRight,
  Plus,
  ListOrdered,
  Package,
  UserCog,
  CreditCard,
  BellRing,
  HelpCircle,
  LogOut,
  MessageSquare,
  LifeBuoy,
  FileText,
  Shield,
  Zap,
  Tag,
  Box,
  Clock,
  Star,
  DollarSign,
  Percent,
  Smartphone,
  QrCode
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string | number;
  subItems?: NavItem[];
  isNew?: boolean;
}

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({});
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const toggleMenu = (name: string) => {
    setExpandedMenus(prev => ({
      ...prev,
      [name]: !prev[name]
    }));
  };

  const navItems: NavItem[] = [
    { 
      name: 'Dashboard', 
      href: '/dashboard', 
      icon: <LayoutDashboard className="h-4 w-4" />,
      badge: 'New',
      isNew: true
    },
    { 
      name: 'Orders', 
      href: '/orders', 
      icon: <ShoppingBag className="h-4 w-4" />,
      badge: '3',
      subItems: [
        { 
          name: 'All Orders', 
          href: '/orders', 
          icon: <ListOrdered className="h-3.5 w-3.5" />,
          badge: '24'
        },
        { 
          name: 'New Order', 
          href: '/orders/new', 
          icon: <Plus className="h-3.5 w-3.5" /> 
        },
        { 
          name: 'Scheduled', 
          href: '/orders/scheduled', 
          icon: <Clock className="h-3.5 w-3.5" /> 
        },
      ]
    },
    { 
      name: 'Menu', 
      href: '/menu', 
      icon: <Utensils className="h-4 w-4" />,
      subItems: [
        { 
          name: 'All Items', 
          href: '/menu', 
          icon: <ListOrdered className="h-3.5 w-3.5" /> 
        },
        { 
          name: 'Categories', 
          href: '/menu/categories', 
          icon: <Tag className="h-3.5 w-3.5" /> 
        },
        { 
          name: 'Add New', 
          href: '/menu/new', 
          icon: <Plus className="h-3.5 w-3.5" /> 
        },
      ]
    },
    { 
      name: 'Customers', 
      href: '/customers', 
      icon: <Users className="h-4 w-4" />,
      badge: '12+',
      subItems: [
        { 
          name: 'All Customers', 
          href: '/customers', 
          icon: <Users className="h-3.5 w-3.5" /> 
        },
        { 
          name: 'Loyalty', 
          href: '/customers/loyalty', 
          icon: <Star className="h-3.5 w-3.5" /> 
        },
      ]
    },
    { 
      name: 'Analytics', 
      href: '/analytics', 
      icon: <BarChart2 className="h-4 w-4" />,
      subItems: [
        { 
          name: 'Overview', 
          href: '/analytics', 
          icon: <BarChart2 className="h-3.5 w-3.5" /> 
        },
        { 
          name: 'Sales', 
          href: '/analytics/sales', 
          icon: <DollarSign className="h-3.5 w-3.5" /> 
        },
        { 
          name: 'Products', 
          href: '/analytics/products', 
          icon: <Package className="h-3.5 w-3.5" /> 
        },
      ]
    },
    { 
      name: 'Marketing', 
      href: '/marketing', 
      icon: <Zap className="h-4 w-4" />,
      isNew: true,
      subItems: [
        { 
          name: 'Campaigns', 
          href: '/marketing/campaigns', 
          icon: <Zap className="h-3.5 w-3.5" /> 
        },
        { 
          name: 'Discounts', 
          href: '/marketing/discounts', 
          icon: <Percent className="h-3.5 w-3.5" /> 
        },
      ]
    },
    { 
      name: 'Mobile App', 
      href: '/mobile-apps', 
      icon: <Smartphone className="h-4 w-4" />,
      isNew: true,
      subItems: [
        { 
          name: 'QR Code & Link', 
          href: '/mobile-apps', 
          icon: <QrCode className="h-3.5 w-3.5" /> 
        },
      ]
    },
    { 
      name: 'Settings', 
      href: '/settings', 
      icon: <Settings className="h-4 w-4" />,
      subItems: [
        { 
          name: 'General', 
          href: '/settings', 
          icon: <Settings className="h-3.5 w-3.5" /> 
        },
        { 
          name: 'Staff', 
          href: '/settings/staff', 
          icon: <UserCog className="h-3.5 w-3.5" /> 
        },
        { 
          name: 'Billing', 
          href: '/settings/billing', 
          icon: <CreditCard className="h-3.5 w-3.5" /> 
        },
        { 
          name: 'Notifications', 
          href: '/settings/notifications', 
          icon: <BellRing className="h-3.5 w-3.5" /> 
        },
      ]
    },
  ];

  const isActive = (href: string) => {
    return pathname === href || pathname.startsWith(`${href}/`);
  };

  const hasActiveChild = (items: NavItem[] = []): boolean => {
    return items.some(item => isActive(item.href) || hasActiveChild(item.subItems));
  };

  const renderBadge = (badge: string | number | undefined, isNew = false) => {
    if (!badge && !isNew) return null;
    
    if (isNew) {
      return (
        <span className="ml-auto inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400">
          New
        </span>
      );
    }
    
    return (
      <span className="ml-auto inline-flex items-center justify-center h-5 min-w-5 px-1.5 text-xs font-medium rounded-full bg-primary-100 text-primary-800 dark:bg-primary-900/30 dark:text-primary-300">
        {badge}
      </span>
    );
  };

  const renderNavItem = (item: NavItem, level = 0) => {
    const hasSubItems = item.subItems && item.subItems.length > 0;
    const isItemActive = isActive(item.href) || (hasSubItems && hasActiveChild(item.subItems));
    const isExpanded = expandedMenus[item.name] ?? isItemActive;
    const paddingLeft = level > 0 ? 'pl-11' : 'pl-3';

    return (
      <li key={item.href} className="space-y-1">
        <div className="flex flex-col">
          <div className="relative flex items-center group">
            <Link
              href={item.href}
              className={cn(
                'flex items-center w-full py-2.5 px-3 rounded-lg transition-colors text-sm font-medium',
                'group-hover:bg-gray-100 dark:group-hover:bg-gray-800',
                isItemActive 
                  ? 'bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400' 
                  : 'text-gray-700 dark:text-gray-300',
                paddingLeft
              )}
            >
              <span className={cn(
                'flex items-center flex-1',
                level > 0 && 'text-sm',
                isItemActive && 'font-semibold'
              )}>
                <span className={cn(
                  'flex items-center justify-center w-6 h-6 rounded-md',
                  isItemActive 
                    ? 'bg-primary-100 text-primary-600 dark:bg-primary-900/50 dark:text-primary-400' 
                    : 'text-gray-500 dark:text-gray-400 group-hover:bg-gray-200 dark:group-hover:bg-gray-700'
                )}>
                  {item.icon}
                </span>
                <span className="ml-3">{item.name}</span>
              </span>
              
              {/* Badge */}
              {renderBadge(item.badge, item.isNew)}
              
              {/* Dropdown arrow */}
              {hasSubItems && (
                <button 
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    toggleMenu(item.name);
                  }}
                  className="ml-2 p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  {isExpanded ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </button>
              )}
            </Link>
          </div>
          
          {/* Sub-items */}
          {hasSubItems && isExpanded && (
            <ul className="mt-1 space-y-1">
              {item.subItems?.map((subItem) => {
                const isSubItemActive = isActive(subItem.href);
                return (
                  <li key={subItem.href} className="relative">
                    <Link
                      href={subItem.href}
                      className={cn(
                        'flex items-center py-2 px-3 text-sm rounded-lg transition-colors',
                        'group-hover:bg-gray-50 dark:group-hover:bg-gray-800',
                        isSubItemActive
                          ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 font-medium'
                          : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800',
                        'pl-11' // Indent sub-items
                      )}
                    >
                      <span className={cn(
                        'flex items-center justify-center w-5 h-5 rounded-md',
                        isSubItemActive 
                          ? 'text-primary-600 dark:text-primary-400' 
                          : 'text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300'
                      )}>
                        {subItem.icon}
                      </span>
                      <span className="ml-3">{subItem.name}</span>
                      {renderBadge(subItem.badge, subItem.isNew)}
                      
                      {/* Active indicator */}
                      {isSubItemActive && (
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-4 bg-primary-500 rounded-r-md"></span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </li>
    );
  };

  if (!mounted) return null;

  return (
    <nav className="flex flex-col h-full">
      {/* Main navigation */}
      <ul className="space-y-1 px-2">
        {navItems.map((item) => renderNavItem(item))}
      </ul>
      
      {/* Help & Support Section */}
      <div className="mt-auto pt-4 px-2">
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-0 flex items-center" aria-hidden="true">
              <div className="w-full border-t border-gray-200 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center">
              <span className="px-2 bg-white dark:bg-gray-900 text-xs text-gray-500 dark:text-gray-400">
                Help & Support
              </span>
            </div>
          </div>
        </div>
        
        <ul className="space-y-1">
          <li>
            <a
              href="#"
              className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400">
                <LifeBuoy className="h-3.5 w-3.5" />
              </span>
              <span className="ml-3">Help Center</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-purple-100 text-purple-600 dark:bg-purple-900/30 dark:text-purple-400">
                <MessageSquare className="h-3.5 w-3.5" />
              </span>
              <span className="ml-3">Send Feedback</span>
            </a>
          </li>
          <li>
            <a
              href="#"
              className="group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400">
                <FileText className="h-3.5 w-3.5" />
              </span>
              <span className="ml-3">Documentation</span>
            </a>
          </li>
          <li>
            <button
              onClick={() => {
                localStorage.removeItem('token');
                router.push('/login');
              }}
              className="w-full group flex items-center px-3 py-2 text-sm font-medium rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
            >
              <span className="flex items-center justify-center w-6 h-6 rounded-md bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400">
                <LogOut className="h-3.5 w-3.5" />
              </span>
              <span className="ml-3">Sign out</span>
            </button>
          </li>
        </ul>
        
        {/* Version info */}
        <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="px-3 text-xs text-gray-500 dark:text-gray-400">
            <div>v1.0.0</div>
            <div className="mt-1"> {new Date().getFullYear()} DeliveryApp</div>
          </div>
        </div>
      </div>
    </nav>
  );
}