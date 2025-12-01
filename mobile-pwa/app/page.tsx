'use client';

import { useEffect, useState } from 'react';
import { detectTenant, type TenantConfig } from '@/lib/tenant';
import { useRouter } from 'next/navigation';

export default function HomePage() {
  const [config, setConfig] = useState<TenantConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const loadTenant = async () => {
      try {
        const tenantConfig = await detectTenant();
        
        if (tenantConfig) {
          setConfig(tenantConfig);
          // Redirect to restaurant menu
          router.push(`/${tenantConfig.tenantId}/menu`);
        } else {
          setError('Restaurant not found. Please check the URL.');
        }
      } catch (err) {
        console.error('Failed to load tenant:', err);
        setError('Failed to load restaurant information.');
      } finally {
        setLoading(false);
      }
    };

    loadTenant();
  }, [router]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-orange-50 to-white">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-red-50 to-white px-4">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">🍔</div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Oops!</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
      </div>
    </div>
  );
}
