// admin/src/config/api.ts
// Frontend calls its own Next.js API routes, which proxy to the backend
const API_BASE_URL = '/api';

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
    LIST: `${API_BASE_URL}/orders`,
    DETAIL: (id: string | number) => `${API_BASE_URL}/orders/${id}`,
    UPDATE_STATUS: (id: string | number) => `${API_BASE_URL}/orders/${id}/status`,
  },
  MENUS: {
    LIST: `${API_BASE_URL}/menu`,
    // Note: Backend only provides /menu endpoint that returns full menu tree
    // No separate endpoints for categories or items - they're nested in the menu response
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