"use client"; 

import Link from 'next/link';
import AppLayout from '../AppLayout';
import { Button } from '@/components/ui/button';
import { GroupWalletCard } from '@/components/features/wallets/GroupWalletCard';
import { mockWallets } from '@/lib/mockData';
import type { GroupWallet } from '@/types';
import { PlusCircle, Landmark } from 'lucide-react';

export default function WalletsPage() {
  const wallets: GroupWallet[] = mockWallets; 

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
             <Landmark className="h-8 w-8 text-primary" />
             <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">Group Wallets</h1>
          </div>
          <Button asChild>
            <Link href="/wallets/create">
              <PlusCircle className="mr-2 h-5 w-5" /> Create New Wallet
            </Link>
          </Button>
        </div>

        {wallets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallets.map((wallet) => (
              <GroupWalletCard key={wallet.id} wallet={wallet} />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 bg-card rounded-lg shadow">
            <Landmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No group wallets found.</p>
            <p className="mt-2 text-sm text-muted-foreground">Get started by creating one!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
