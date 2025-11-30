'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { FeatureGuard } from '@/components/FeatureGuard';

export default function MarketingPage() {
  return (
    <FeatureGuard featureKey="MARKETING">
      <MarketingPageContent />
    </FeatureGuard>
  );
}

function MarketingPageContent() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/marketing/campaigns');
  }, [router]);

  return (
    <div className="p-6 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
    </div>
  );
}
