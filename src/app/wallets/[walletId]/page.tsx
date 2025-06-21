
"use client";

import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../AppLayout';
import type { GroupWallet, Member as MemberType, Transaction } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContributeForm } from '@/components/features/wallets/ContributeForm';
import { TransactionListItem } from '@/components/features/records/TransactionListItem';
import { ArrowLeft, Users, ListCollapse, PlusCircle, Loader2, AlertTriangle, Landmark } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { getWalletById } from '@/services/walletService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockMembers } from '@/lib/mockData';

export default function WalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const walletId = params.walletId as string;
  
  const [wallet, setWallet] = useState<GroupWallet | undefined>(undefined);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchWalletDetails = useCallback(async () => {
    if (!walletId) return;
    console.log(`[WalletDetailPage] fetchWalletDetails triggered for walletId: ${walletId}`);
    try {
      setIsLoading(true);
      setError(null);
      const firestoreWallet = await getWalletById(walletId);
      if (firestoreWallet) {
        setWallet(firestoreWallet);
      } else {
        setError(`Wallet with ID "${walletId}" not found.`);
      }
    } catch (err) {
      console.error(`[WalletDetailPage] Failed to fetch wallet ${walletId}:`, err);
      setError(err instanceof Error ? err.message : "An unknown error occurred while fetching wallet details.");
    } finally {
      setIsLoading(false);
    }
  }, [walletId]);

  useEffect(() => {
    fetchWalletDetails();
  }, [fetchWalletDetails]);

  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="ml-4 text-muted-foreground">Loading wallet details...</p>
        </div>
      </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground">Error Loading Wallet</h1>
          <Alert variant="destructive" className="max-w-md mx-auto mt-4">
            <AlertTitle>Loading Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/wallets')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Wallets
          </Button>
        </div>
      </AppLayout>
    );
  }

  if (!wallet) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <Landmark className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground">Wallet Not Found</h1>
          <p className="text-muted-foreground mt-2">The wallet you are looking for does not exist or could not be loaded.</p>
          <Button onClick={() => router.push('/wallets')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Wallets
          </Button>
        </div>
      </AppLayout>
    );
  }

  const displayMembers = wallet.members && wallet.members.length > 0 ? wallet.members : mockMembers.slice(0,3);
  const displayTransactions = wallet.transactions ? [...wallet.transactions].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) : [];

  const creatorName = wallet.creatorId 
    ? (wallet.members?.find(m => m.id === wallet.creatorId)?.name || wallet.creatorId) 
    : 'Unknown';


  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8">
        <Button variant="outline" asChild className="mb-2 text-sm">
          <Link href="/wallets">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Wallets
          </Link>
        </Button>

        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-gradient-to-br from-primary/10 via-card to-accent/10 p-4 sm:p-6">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1">
                        <Landmark className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                        <CardTitle className="font-headline text-2xl sm:text-3xl text-foreground">{wallet.name}</CardTitle>
                    </div>
                    <CardDescription className="text-xs sm:text-sm">Managed in {wallet.tokenType} &bull; Created by: {creatorName}</CardDescription>
                </div>
                <div className="text-left md:text-right mt-2 md:mt-0">
                    <p className="text-xs sm:text-sm text-muted-foreground">Current Balance</p>
                    <p className="text-2xl sm:text-3xl font-bold text-primary">{wallet.balance.toLocaleString()} {wallet.tokenType}</p>
                </div>
            </div>
          </CardHeader>
          <div className="w-full h-40 sm:h-60 overflow-hidden">
            <Image 
              src={`https://placehold.co/1200x400.png`}
              alt={`${wallet.name} banner`}
              width={1200}
              height={400}
              className="w-full h-full object-cover"
              data-ai-hint="financial group banner"
              priority
            />
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 sm:gap-8">
          <div className="lg:col-span-2 space-y-6 sm:space-y-8">
            <Card className="shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 font-headline text-lg sm:text-xl">
                  <ListCollapse className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  Recent Transactions
                </CardTitle>
              </CardHeader>
              <CardContent className="p-0 sm:p-2 md:p-4">
                {displayTransactions.length > 0 ? (
                  <ScrollArea className="h-[300px] sm:h-[350px]">
                    <div className="divide-y divide-border">
                    {displayTransactions.map(tx => ( 
                      <TransactionListItem key={tx.id} transaction={tx} />
                    ))}
                    </div>
                  </ScrollArea>
                ) : (
                  <p className="text-muted-foreground p-4 text-sm">No transactions yet for this wallet.</p>
                )}
              </CardContent>
               <CardFooter className="p-4 sm:p-6">
                <Button variant="outline" asChild className="text-sm">
                    <Link href="/records">View All Platform Records</Link>
                </Button>
              </CardFooter>
            </Card>
          </div>

          <div className="space-y-6 sm:space-y-8">
            <Card className="shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 font-headline text-lg sm:text-xl">
                  <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  Make a Contribution
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ContributeForm wallet={wallet} onSuccess={fetchWalletDetails} />
              </CardContent>
            </Card>

            <Card className="shadow-md">
              <CardHeader className="p-4 sm:p-6">
                <CardTitle className="flex items-center gap-2 font-headline text-lg sm:text-xl">
                  <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                  Members ({displayMembers.length})
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6">
                <ScrollArea className="h-[200px] sm:h-[240px]">
                  <ul className="space-y-3">
                    {displayMembers.map((member: MemberType) => (
                      <li key={member.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8 sm:h-9 sm:w-9">
                            <AvatarImage src={`https://placehold.co/40x40.png?text=${member.name.substring(0,1)}`} alt={member.name} data-ai-hint="profile avatar" />
                            <AvatarFallback>{member.name.substring(0, 2).toUpperCase()}</AvatarFallback>
                          </Avatar>
                          <span className="text-sm sm:text-base">{member.name}</span>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          member.verificationStatus === 'verified' ? 'bg-green-100 text-green-700 dark:bg-green-800/30 dark:text-green-300' :
                          member.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-700 dark:bg-yellow-800/30 dark:text-yellow-300' :
                          'bg-red-100 text-red-700 dark:bg-red-800/30 dark:text-red-300'
                        }`}>
                          {member.verificationStatus}
                        </span>
                      </li>
                    ))}
                  </ul>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
