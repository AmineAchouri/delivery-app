'use client';

import { ReactNode } from 'react';
import AppLayout from '@/components/AppLayout';

export default function DashboardGroupLayout({ children }: { children: ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}
