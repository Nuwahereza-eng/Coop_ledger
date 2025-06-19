
"use client"; 

import Link from 'next/link';
import AppLayout from '../AppLayout';
import { Button } from '@/components/ui/button';
import { GroupWalletCard } from '@/components/features/wallets/GroupWalletCard';
// import { mockWallets } from '@/lib/mockData'; // Replaced with Firestore
import type { GroupWallet } from '@/types';
import { PlusCircle, Landmark, Loader2, AlertTriangle } from 'lucide-react';
import { useEffect, useState } from 'react';
import { getWallets } from '@/services/walletService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function WalletsPage() {
  const [wallets, setWallets] = useState<GroupWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchWallets() {
      try {
        setIsLoading(true);
        setError(null);
        const firestoreWallets = await getWallets();
        setWallets(firestoreWallets);
      } catch (err) {
        console.error("Failed to fetch wallets:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchWallets();
  }, []);

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

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading wallets...</p>
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Fetching Wallets</AlertTitle>
            <AlertDescription>
              {error} Please ensure your Firebase setup is correct and the 'wallets' collection exists.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && wallets.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {wallets.map((wallet) => (
              <GroupWalletCard key={wallet.id} wallet={wallet} />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && wallets.length === 0 && (
          <div className="text-center py-12 bg-card rounded-lg shadow">
            <Landmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No group wallets found.</p>
            <p className="mt-2 text-sm text-muted-foreground">Get started by creating one, or check your Firestore 'wallets' collection!</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
