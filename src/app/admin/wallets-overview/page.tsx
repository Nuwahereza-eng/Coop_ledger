
"use client";

import { useEffect, useState } from 'react';
import AppLayout from '../../AppLayout';
import { Landmark, Loader2, AlertTriangle, ArrowRight } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { getWallets } from '@/services/walletService';
import type { GroupWallet } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function WalletsOverviewPage() {
  const { userRole, isRoleInitialized } = useRole();
  const router = useRouter();
  const [wallets, setWallets] = useState<GroupWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isRoleInitialized && userRole !== 'admin') {
      router.replace('/');
    } else if (userRole === 'admin') {
      async function fetchWallets() {
        setIsLoading(true);
        setError(null);
        try {
          const fetchedWallets = await getWallets();
          setWallets(fetchedWallets);
        } catch (err) {
          setError(err instanceof Error ? err.message : "An unknown error occurred.");
          console.error('[WalletsOverviewPage] Error fetching wallets:', err);
        } finally {
          setIsLoading(false);
        }
      }
      fetchWallets();
    }
  }, [userRole, isRoleInitialized, router]);

  if (!isRoleInitialized || userRole !== 'admin' || isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          {isRoleInitialized && userRole !== 'admin' && <p className="mt-4 text-muted-foreground">Redirecting...</p>}
          {!isRoleInitialized && <p className="mt-4 text-muted-foreground">Initializing...</p>}
          {isLoading && userRole === 'admin' && <p className="mt-4 text-muted-foreground">Loading wallets overview...</p>}
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

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>All Group Wallets</CardTitle>
            <CardDescription>
              A high-level overview of all wallets on the platform.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            {!error && (
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Token</TableHead>
                      <TableHead className="text-center">Members</TableHead>
                      <TableHead className="text-right">Balance</TableHead>
                      <TableHead className="text-center">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {wallets.length > 0 ? (
                      wallets.map((wallet) => (
                        <TableRow key={wallet.id}>
                          <TableCell className="font-medium">{wallet.name}</TableCell>
                          <TableCell>{wallet.tokenType}</TableCell>
                          <TableCell className="text-center">{wallet.members.length}</TableCell>
                          <TableCell className="text-right">{wallet.balance.toLocaleString()}</TableCell>
                          <TableCell className="text-center">
                            <Button asChild variant="outline" size="sm">
                              <Link href={`/wallets/${wallet.id}`}>
                                View <ArrowRight className="ml-2 h-4 w-4" />
                              </Link>
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center">
                          No wallets found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
