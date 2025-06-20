
"use client";

import AppLayout from '../../AppLayout';
import { Landmark } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Loader2 } from 'lucide-react';

export default function WalletsOverviewPage() {
  const { userRole, isRoleInitialized } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (isRoleInitialized && userRole !== 'admin') {
      router.replace('/');
    }
  }, [userRole, isRoleInitialized, router]);

  if (!isRoleInitialized || userRole !== 'admin') {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          {isRoleInitialized && userRole !== 'admin' && <p className="mt-4 text-muted-foreground">Redirecting...</p>}
          {!isRoleInitialized && <p className="mt-4 text-muted-foreground">Initializing...</p>}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Landmark className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">
            Wallets Overview
          </h1>
        </div>
        <div className="bg-card p-6 rounded-lg shadow">
          <p className="text-muted-foreground">
            Platform-wide wallet overview and monitoring tools will be implemented here. Admins will be able to see aggregate data for all group wallets.
          </p>
        </div>
      </div>
    </AppLayout>
  );
}
