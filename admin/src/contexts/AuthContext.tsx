'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

// Types
export type UserType = 'platform_admin' | 'tenant_owner' | 'tenant_staff' | 'customer' | 'delivery_agent';

export interface TenantFeature {
  key: string;
  enabled: boolean;
  description?: string;
}

export interface Tenant {
  tenant_id: string;
  name: string;
  domain: string;
  status: string;
  features?: TenantFeature[];
}

export interface PlatformAdmin {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'PLATFORM_ADMIN';
}

export interface TenantUser {
  user_id: string;
  email: string;
  phone?: string;
  status: string;
  tenant_id: string;
  roles: string[];
  permissions: string[];
}

export interface TenantSettings {
  logo?: string;
  name?: string;
  description?: string;
  [key: string]: string | undefined;
}

interface AuthState {
  userType: UserType | null;
  platformAdmin: PlatformAdmin | null;
  tenantUser: TenantUser | null;
  tenants: Tenant[];
  selectedTenant: Tenant | null;
  tenantSettings: TenantSettings | null;
  accessToken: string | null;
  refreshToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  loginPlatformAdmin: (email: string, password: string) => Promise<void>;
  loginTenantUser: (email: string, password: string, tenantId: string) => Promise<void>;
  loginMultiTenant: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  selectTenant: (tenant: Tenant) => void;
  refreshAuth: () => Promise<boolean>;
  updateTenantSettings: (settings: TenantSettings) => void;
  fetchTenantSettings: () => Promise<void>;
  // Helper getters
  isPlatformAdmin: boolean;
  isSuperAdmin: boolean;
  isTenantOwner: boolean;
  isCustomer: boolean;
  isDeliveryAgent: boolean;
  hasMultipleTenants: boolean;
  // Feature check
  isFeatureEnabled: (featureKey: string) => boolean;
  // Legacy compatibility
  admin: PlatformAdmin | null;
  login: (email: string, password: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

// Use local Next.js API proxy (which forwards to backend)
const API_BASE_URL = '';

// Helper to determine user type from roles
function getUserTypeFromRoles(roles: string[]): UserType {
  if (roles.includes('OWNER') || roles.includes('STAFF')) return 'tenant_owner';
  if (roles.includes('DELIVERY_AGENT')) return 'delivery_agent';
  if (roles.includes('CUSTOMER')) return 'customer';
  return 'customer'; // default
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [state, setState] = useState<AuthState>({
    userType: null,
    platformAdmin: null,
    tenantUser: null,
    tenants: [],
    selectedTenant: null,
    tenantSettings: null,
    accessToken: null,
    refreshToken: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // Load auth state from localStorage on mount
  useEffect(() => {
    const loadAuthState = () => {
      try {
        const storedUserType = localStorage.getItem('userType') as UserType | null;
        const storedPlatformAdmin = localStorage.getItem('platformAdmin');
        const storedTenantUser = localStorage.getItem('tenantUser');
        const storedTenants = localStorage.getItem('platformTenants');
        const storedSelectedTenant = localStorage.getItem('selectedTenant');
        const storedAccessToken = localStorage.getItem('accessToken');
        const storedRefreshToken = localStorage.getItem('refreshToken');

        if (storedAccessToken && (storedPlatformAdmin || storedTenantUser)) {
          const storedTenantSettings = localStorage.getItem('tenantSettings');
          setState({
            userType: storedUserType,
            platformAdmin: storedPlatformAdmin ? JSON.parse(storedPlatformAdmin) : null,
            tenantUser: storedTenantUser ? JSON.parse(storedTenantUser) : null,
            tenants: storedTenants ? JSON.parse(storedTenants) : [],
            selectedTenant: storedSelectedTenant ? JSON.parse(storedSelectedTenant) : null,
            tenantSettings: storedTenantSettings ? JSON.parse(storedTenantSettings) : null,
            accessToken: storedAccessToken,
            refreshToken: storedRefreshToken,
            isLoading: false,
            isAuthenticated: true,
          });
        } else {
          setState(prev => ({ ...prev, isLoading: false }));
        }
      } catch (error) {
        console.error('Error loading auth state:', error);
        setState(prev => ({ ...prev, isLoading: false }));
      }
    };

    loadAuthState();
  }, []);

  // Platform Admin Login
  const loginPlatformAdmin = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/platform-admin/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    // Store in localStorage
    localStorage.setItem('userType', 'platform_admin');
    localStorage.setItem('platformAdmin', JSON.stringify(data.admin));
    localStorage.setItem('platformTenants', JSON.stringify(data.tenants));
    localStorage.setItem('accessToken', data.accessToken);
    localStorage.setItem('refreshToken', data.refreshToken);

    const selectedTenant = data.tenants.length > 0 ? data.tenants[0] : null;
    if (selectedTenant) {
      localStorage.setItem('selectedTenant', JSON.stringify(selectedTenant));
    }

    setState({
      userType: 'platform_admin',
      platformAdmin: data.admin,
      tenantUser: null,
      tenants: data.tenants,
      selectedTenant,
      tenantSettings: null,
      accessToken: data.accessToken,
      refreshToken: data.refreshToken,
      isLoading: false,
      isAuthenticated: true,
    });

    router.push('/dashboard');
  }, [router]);

  // Tenant User Login (Owner, Staff, Customer, Delivery)
  const loginTenantUser = useCallback(async (email: string, password: string, tenantId: string) => {
    const response = await fetch(`${API_BASE_URL}/auth/login`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-Tenant-Id': tenantId,
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Login failed' }));
      throw new Error(error.message || 'Login failed');
    }

    const data = await response.json();

    // Fetch user profile to get roles
    const meResponse = await fetch(`${API_BASE_URL}/me`, {
      headers: { 
        'Authorization': `Bearer ${data.access_token}`,
        'X-Tenant-Id': tenantId,
      },
    });

    let userInfo: TenantUser;
    if (meResponse.ok) {
      const meData = await meResponse.json();
      userInfo = {
        user_id: meData.user_id,
        email: meData.email,
        phone: meData.phone,
        status: meData.status,
        tenant_id: meData.tenant_id,
        roles: meData.roles || [],
        permissions: meData.perms || [],
      };
    } else {
      // Fallback if /me fails
      userInfo = {
        user_id: '',
        email,
        status: 'active',
        tenant_id: tenantId,
        roles: [],
        permissions: [],
      };
    }

    const userType = getUserTypeFromRoles(userInfo.roles);
    // Use tenant info from login response if available
    const tenant: Tenant = data.tenant ? {
      tenant_id: data.tenant.tenant_id,
      name: data.tenant.name,
      domain: data.tenant.domain || '',
      status: data.tenant.status || 'active',
      features: data.tenant.features || []
    } : {
      tenant_id: tenantId,
      name: 'Restaurant',
      domain: '',
      status: 'active',
      features: []
    };

    // Store in localStorage
    localStorage.setItem('userType', userType);
    localStorage.setItem('tenantUser', JSON.stringify(userInfo));
    localStorage.setItem('selectedTenant', JSON.stringify(tenant));
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);

    setState({
      userType,
      platformAdmin: null,
      tenantUser: userInfo,
      tenants: [tenant],
      selectedTenant: tenant,
      tenantSettings: null,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      isLoading: false,
      isAuthenticated: true,
    });

    // Route based on user type
    if (userType === 'tenant_owner' || userType === 'tenant_staff') {
      router.push('/dashboard');
    } else if (userType === 'delivery_agent') {
      router.push('/delivery');
    } else {
      router.push('/customer/menu'); // Customer ordering page
    }
  }, [router]);

  // Multi-tenant login - login to all restaurants at once
  const loginMultiTenant = useCallback(async (email: string, password: string) => {
    const response = await fetch(`${API_BASE_URL}/api/auth/multi-login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(error.error || 'Login failed');
    }

    const data = await response.json();

    // Build tenant list with features
    const tenantList: Tenant[] = data.tenants.map((t: any) => ({
      tenant_id: t.tenant_id,
      name: t.name,
      domain: t.domain || '',
      status: t.status || 'active',
      features: t.features || []
    }));

    const userType = getUserTypeFromRoles(data.user.roles || []);
    const userInfo: TenantUser = {
      user_id: data.user.user_id,
      email: data.user.email,
      phone: data.user.phone,
      status: data.user.status,
      tenant_id: data.primary_tenant.tenant_id,
      roles: data.user.roles || [],
      permissions: data.user.permissions || [],
    };

    // Store in localStorage
    localStorage.setItem('userType', userType);
    localStorage.setItem('tenantUser', JSON.stringify(userInfo));
    localStorage.setItem('platformTenants', JSON.stringify(tenantList));
    localStorage.setItem('selectedTenant', JSON.stringify(tenantList[0]));
    localStorage.setItem('accessToken', data.access_token);
    localStorage.setItem('refreshToken', data.refresh_token);

    setState({
      userType,
      platformAdmin: null,
      tenantUser: userInfo,
      tenants: tenantList,
      selectedTenant: tenantList[0],
      tenantSettings: null,
      accessToken: data.access_token,
      refreshToken: data.refresh_token,
      isLoading: false,
      isAuthenticated: true,
    });

    router.push('/dashboard');
  }, [router]);

  const logout = useCallback(async () => {
    try {
      const accessToken = localStorage.getItem('accessToken');
      const userType = localStorage.getItem('userType');
      
      if (accessToken && userType === 'platform_admin') {
        await fetch(`${API_BASE_URL}/api/platform-admin/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        });
      }
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // Clear all localStorage
      localStorage.removeItem('userType');
      localStorage.removeItem('platformAdmin');
      localStorage.removeItem('tenantUser');
      localStorage.removeItem('platformTenants');
      localStorage.removeItem('selectedTenant');
      localStorage.removeItem('tenantSettings');
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      setState({
        userType: null,
        platformAdmin: null,
        tenantUser: null,
        tenants: [],
        selectedTenant: null,
        tenantSettings: null,
        accessToken: null,
        refreshToken: null,
        isLoading: false,
        isAuthenticated: false,
      });

      router.push('/login');
    }
  }, [router]);

  const selectTenant = useCallback((tenant: Tenant) => {
    localStorage.setItem('selectedTenant', JSON.stringify(tenant));
    // Clear tenant settings when switching tenants - will be refetched
    localStorage.removeItem('tenantSettings');
    setState(prev => ({ ...prev, selectedTenant: tenant, tenantSettings: null }));
  }, []);

  const refreshAuth = useCallback(async (): Promise<boolean> => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      const userType = localStorage.getItem('userType');
      
      if (!refreshToken) {
        console.log('No refresh token found, logging out');
        await logout();
        return false;
      }

      const endpoint = userType === 'platform_admin' 
        ? `${API_BASE_URL}/api/platform-admin/auth/refresh`
        : `${API_BASE_URL}/auth/refresh`;

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        console.log('Token refresh failed, logging out');
        await logout();
        return false;
      }

      const data = await response.json();

      localStorage.setItem('accessToken', data.accessToken || data.access_token);
      localStorage.setItem('refreshToken', data.refreshToken || data.refresh_token);

      setState(prev => ({ 
        ...prev, 
        accessToken: data.accessToken || data.access_token,
        refreshToken: data.refreshToken || data.refresh_token,
      }));
      return true;
    } catch (error) {
      console.error('Refresh error:', error);
      await logout();
      return false;
    }
  }, [logout]);

  // Fetch tenant settings
  const fetchTenantSettings = useCallback(async () => {
    if (!state.selectedTenant || !state.accessToken) return;
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/tenant/settings`, {
        headers: {
          'Authorization': `Bearer ${state.accessToken}`,
          'X-Tenant-Id': state.selectedTenant.tenant_id,
        },
      });
      
      if (response.ok) {
        const settings = await response.json();
        localStorage.setItem('tenantSettings', JSON.stringify(settings));
        setState(prev => ({ ...prev, tenantSettings: settings }));
      }
    } catch (error) {
      console.error('Failed to fetch tenant settings:', error);
    }
  }, [state.selectedTenant, state.accessToken]);

  // Update tenant settings (called after saving settings)
  const updateTenantSettings = useCallback((settings: TenantSettings) => {
    localStorage.setItem('tenantSettings', JSON.stringify(settings));
    setState(prev => ({ ...prev, tenantSettings: settings }));
  }, []);

  // Computed properties
  const isPlatformAdmin = state.userType === 'platform_admin';
  const isSuperAdmin = isPlatformAdmin && state.platformAdmin?.role === 'SUPER_ADMIN';
  const isTenantOwner = state.userType === 'tenant_owner' || state.userType === 'tenant_staff';
  const isCustomer = state.userType === 'customer';
  const isDeliveryAgent = state.userType === 'delivery_agent';
  const hasMultipleTenants = state.tenants.length > 1;

  // Check if a feature is enabled for the selected tenant
  // Super admins see everything, but platform admins and owners respect tenant features
  const isFeatureEnabled = useCallback((featureKey: string): boolean => {
    if (isSuperAdmin) return true; // Super admins see everything
    if (!state.selectedTenant?.features) return true; // Default to enabled if no features loaded
    const feature = state.selectedTenant.features.find(f => f.key === featureKey);
    return feature?.enabled ?? true; // Default to enabled if feature not found
  }, [isSuperAdmin, state.selectedTenant?.features]);

  const value: AuthContextType = {
    ...state,
    loginPlatformAdmin,
    loginTenantUser,
    loginMultiTenant,
    logout,
    selectTenant,
    refreshAuth,
    updateTenantSettings,
    fetchTenantSettings,
    isPlatformAdmin,
    isSuperAdmin,
    isTenantOwner,
    isCustomer,
    isDeliveryAgent,
    hasMultipleTenants,
    isFeatureEnabled,
    // Legacy compatibility
    admin: state.platformAdmin,
    login: loginPlatformAdmin,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

// Hook for making authenticated API calls
export function useAuthenticatedFetch() {
  const { accessToken, selectedTenant, refreshAuth, logout } = useAuth();

  return useCallback(async (url: string, options: RequestInit = {}) => {
    const headers = new Headers(options.headers);
    if (accessToken) {
      headers.set('Authorization', `Bearer ${accessToken}`);
    }
    if (selectedTenant) {
      headers.set('X-Tenant-Id', selectedTenant.tenant_id);
    }

    let response = await fetch(url, { ...options, headers });

    if (response.status === 401) {
      const refreshed = await refreshAuth();
      if (refreshed) {
        const newToken = localStorage.getItem('accessToken');
        if (newToken) {
          headers.set('Authorization', `Bearer ${newToken}`);
          response = await fetch(url, { ...options, headers });
        }
      }
      // If refresh failed, refreshAuth already called logout
    }

    return response;
  }, [accessToken, selectedTenant, refreshAuth, logout]);
}
