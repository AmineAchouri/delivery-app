// admin/src/config/api.ts
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3002/api';

export const API_ENDPOINTS = {
  AUTH: {
    LOGIN: `${API_BASE_URL}/auth/login`,
    REFRESH: `${API_BASE_URL}/auth/refresh`,
  },
  DASHBOARD: {
    STATS: `${API_BASE_URL}/dashboard/stats`,
    RECENT_ORDERS: `${API_BASE_URL}/dashboard/recent-orders`,
    ORDER_TRENDS: `${API_BASE_URL}/dashboard/order-trends`,
    POPULAR_ITEMS: `${API_BASE_URL}/dashboard/popular-items`,
  },
  ORDERS: {
    LIST: `${API_BASE_URL.replace('/api', '')}/orders`,
    DETAIL: (id: string | number) => `${API_BASE_URL.replace('/api', '')}/orders/${id}`,
    UPDATE_STATUS: (id: string | number) => `${API_BASE_URL.replace('/api', '')}/orders/${id}/status`,
  },
  MENUS: {
    LIST: `${API_BASE_URL.replace('/api', '')}/menus`,
    CATEGORIES_FOR_MENU: (menuId: string | number) =>
      `${API_BASE_URL.replace('/api', '')}/menus/${menuId}/categories`,
    ITEMS_FOR_CATEGORY: (categoryId: string | number) =>
      `${API_BASE_URL.replace('/api', '')}/categories/${categoryId}/items`,
    ITEM_DETAIL: (itemId: string | number) =>
      `${API_BASE_URL.replace('/api', '')}/items/${itemId}`,
  },
  CUSTOMERS: {
    LIST: `${API_BASE_URL}/customers`,
    DETAIL: (id: string | number) => `${API_BASE_URL}/customers/${id}`,
    LOYALTY: `${API_BASE_URL}/customers/loyalty`,
  },
  ANALYTICS: {
    OVERVIEW: `${API_BASE_URL}/analytics/overview`,
    SALES: `${API_BASE_URL}/analytics/sales`,
    PRODUCTS: `${API_BASE_URL}/analytics/products`,
  },
  MARKETING: {
    CAMPAIGNS: `${API_BASE_URL}/marketing/campaigns`,
    CAMPAIGN_DETAIL: (id: string | number) => `${API_BASE_URL}/marketing/campaigns/${id}`,
    DISCOUNTS: `${API_BASE_URL}/marketing/discounts`,
    DISCOUNT_DETAIL: (id: string | number) => `${API_BASE_URL}/marketing/discounts/${id}`,
  },
  SETTINGS: {
    GENERAL: `${API_BASE_URL}/settings`,
    STAFF: `${API_BASE_URL}/settings/staff`,
    STAFF_DETAIL: (id: string | number) => `${API_BASE_URL}/settings/staff/${id}`,
    BILLING: `${API_BASE_URL}/settings/billing`,
    NOTIFICATIONS: `${API_BASE_URL}/settings/notifications`,
  },
};