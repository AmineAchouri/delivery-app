'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';

interface FeatureGuardProps {
  featureKey: string;
  children: React.ReactNode;
  redirectTo?: string;
}

export function FeatureGuard({ featureKey, children, redirectTo = '/dashboard' }: FeatureGuardProps) {
  const { isFeatureEnabled, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isFeatureEnabled(featureKey)) {
      router.push(redirectTo);
    }
  }, [isFeatureEnabled, featureKey, isLoading, router, redirectTo]);

  // Show loading or nothing while checking
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-10 w-10 border-2 border-indigo-600 border-t-transparent"></div>
      </div>
    );
  }

  // If feature is not enabled, don't render children
  if (!isFeatureEnabled(featureKey)) {
    return null;
  }

  return <>{children}</>;
}
