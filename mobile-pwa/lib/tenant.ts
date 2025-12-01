// Tenant detection and configuration

export interface TenantConfig {
  tenantId: string;
  name: string;
  logo: string;
  primaryColor: string;
  backgroundColor: string;
  currency: string;
  currencySymbol: string;
  features: string[];
  menuVersion?: number;
  domain: string;
}

/**
 * Detects the current tenant based on domain/subdomain
 * Supports:
 * - Custom domains: bella-italia.com
 * - Subdomains: bella-italia.yourapp.com
 * - Path-based (for testing): app.com/bella-italia
 */
export async function detectTenant(): Promise<TenantConfig | null> {
  try {
    // Get domain from window location
    const domain = typeof window !== 'undefined' ? window.location.hostname : '';
    
    // For local development
    if (domain === 'localhost' || domain.startsWith('127.0.0.1')) {
      // Use query parameter or default tenant for testing
      const params = new URLSearchParams(window.location.search);
      const testTenant = params.get('tenant') || 'bella-italia';
      return await fetchTenantConfig(testTenant);
    }
    
    // Extract tenant identifier from domain
    let tenantIdentifier: string;
    
    // Option 1: Subdomain (bella-italia.yourapp.com)
    if (domain.includes('.')) {
      const parts = domain.split('.');
      tenantIdentifier = parts[0]; // bella-italia
    } else {
      tenantIdentifier = domain;
    }
    
    return await fetchTenantConfig(tenantIdentifier, domain);
  } catch (error) {
    console.error('Tenant detection failed:', error);
    return null;
  }
}

/**
 * Fetches tenant configuration from backend
 */
async function fetchTenantConfig(
  identifier: string,
  domain?: string
): Promise<TenantConfig | null> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_BACKEND_URL || 
                       'http://localhost:3000';
    
    const url = domain 
      ? `${backendUrl}/api/public/tenant/config?domain=${domain}`
      : `${backendUrl}/api/public/tenant/config?identifier=${identifier}`;
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // Always fetch fresh tenant config
    });
    
    if (!response.ok) {
      console.error('Failed to fetch tenant config:', response.status);
      return null;
    }
    
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching tenant config:', error);
    return null;
  }
}

/**
 * Caches tenant config in localStorage with version checking
 */
export function cacheTenantConfig(config: TenantConfig): void {
  try {
    localStorage.setItem('tenantConfig', JSON.stringify(config));
    localStorage.setItem('tenantConfigTimestamp', Date.now().toString());
  } catch (error) {
    console.error('Failed to cache tenant config:', error);
  }
}

/**
 * Gets cached tenant config if fresh (< 24 hours old)
 */
export function getCachedTenantConfig(): TenantConfig | null {
  try {
    const cached = localStorage.getItem('tenantConfig');
    const timestamp = localStorage.getItem('tenantConfigTimestamp');
    
    if (!cached || !timestamp) return null;
    
    const age = Date.now() - parseInt(timestamp);
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    
    if (age > maxAge) {
      // Cache expired
      localStorage.removeItem('tenantConfig');
      localStorage.removeItem('tenantConfigTimestamp');
      return null;
    }
    
    return JSON.parse(cached);
  } catch (error) {
    console.error('Failed to get cached tenant config:', error);
    return null;
  }
}
