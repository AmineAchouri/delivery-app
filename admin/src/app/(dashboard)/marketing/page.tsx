'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';

export default function MarketingPage() {
  const router = useRouter();
  
  useEffect(() => {
    router.replace('/marketing/campaigns');
  }, [router]);

  return (
    <div className="p-6 flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-500"></div>
    </div>
  );
}
