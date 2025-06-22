
"use client";

import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../AppLayout';
import type { GroupWallet, Member as MemberType, Transaction, WithdrawalProposal } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ContributeForm } from '@/components/features/wallets/ContributeForm';
import { TransactionListItem } from '@/components/features/records/TransactionListItem';
import { ArrowLeft, Users, ListCollapse, PlusCircle, Loader2, AlertTriangle, Landmark, Download } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState, useCallback } from 'react';
import { getWalletById, addMemberToWallet } from '@/services/walletService';
import { getProposalsForWallet } from '@/services/withdrawalService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { mockMembers } from '@/lib/mockData';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { ProposeWithdrawalDialog } from '@/components/features/wallets/ProposeWithdrawalDialog';
import { WithdrawalProposalCard } from '@/components/features/wallets/WithdrawalProposalCard';
import { Separator } from '@/components/ui/separator';

export default function WalletDetailPage() {
  const params = useParams();
  const router = useRouter();
  const walletId = params.walletId as string;
  const { currentUser } = useUser();
  const { toast } = useToast();
  
  const [wallet, setWallet] = useState<GroupWallet | undefined>(undefined);
  const [proposals, setProposals] = useState<WithdrawalProposal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isJoining, setIsJoining] = useState(false);
  const [isProposeDialogOpen, setIsProposeDialogOpen] = useState(false);

  const fetchData = useCallback(async () => {
    if (!walletId) return;
    console.log(`[WalletDetailPage] fetchData triggered for walletId: ${walletId}`);
    try {
      setIsLoading(true);
      setError(null);
      const [firestoreWallet, withdrawalProposals] = await Promise.all([
        getWalletById(walletId),
        getProposalsForWallet(walletId)
      ]);

      if (firestoreWallet) {
        setWallet(firestoreWallet);
        setProposals(withdrawalProposals);
      } else {
        setError(`Wallet with ID "${walletId}" not found.`);
      }
    } catch (err) {
      console.error(`[WalletDetailPage] Failed to fetch data for wallet ${walletId}:`, err);
      setError(err instanceof Error ? err.message : "An unknown error occurred while fetching details.");
    } finally {
      setIsLoading(false);
    }
  }, [walletId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleJoinWallet = async () => {
    if (!currentUser) {
        toast({ title: "You must be logged in to join a wallet.", variant: "destructive" });
        return;
    }
    if (!wallet) {
        toast({ title: "Wallet not found.", variant: "destructive" });
        return;
    }

    setIsJoining(true);
    try {
        const newMember: MemberType = {
            id: currentUser.id,
            name: currentUser.name,
            role: currentUser.role || 'member',
            verificationStatus: currentUser.verificationStatus,
            personalWalletBalance: currentUser.personalWalletBalance,
        };

        await addMemberToWallet(wallet.id, newMember);

        toast({
            title: "Successfully Joined!",
            description: `You are now a member of "${wallet.name}".`,
        });
        
        await fetchData(); // Refresh the wallet data
    } catch (error) {
        console.error("Failed to join wallet:", error);
        toast({
            title: "Failed to Join",
            description: error instanceof Error ? error.message : "There was an error while trying to join the wallet.",
            variant: "destructive"
        });
    } finally {
        setIsJoining(false);
    }
  }


  const isMember = wallet?.members.some(m => m.id === currentUser?.id) ?? false;
  const isCreator = wallet?.creatorId === currentUser?.id;
  const activeProposals = proposals.filter(p => p.status === 'voting_in_progress' || p.status === 'approved');

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
  
  let bannerImageUrl = `https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D`;
  let bannerImageHint = 'community finance';

  if (wallet.name.toLowerCase().includes('youth')) {
    bannerImageUrl = "https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8eW91dGh8ZW58MHx8MHx8fDA%3D";
    bannerImageHint = "youth community";
  } else if (wallet.name.toLowerCase().includes('women')) {
    bannerImageUrl = "https://images.unsplash.com/photo-1506782081254-09bcfd996fd6?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    bannerImageHint = "women empowerment";
  }

  const displayMembers = wallet.members && wallet.members.length > 0 ? wallet.members : mockMembers.slice(0,3);
  const displayTransactions = wallet.transactions ? [...wallet.transactions].sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime()) : [];

  const creatorName = wallet.creatorId 
    ? (wallet.members?.find(m => m.id === wallet.creatorId)?.name || wallet.creatorId) 
    : 'Unknown';


  return (
    <AppLayout>
        <ProposeWithdrawalDialog
            isOpen={isProposeDialogOpen}
            setIsOpen={setIsProposeDialogOpen}
            wallet={wallet}
            onSuccess={fetchData}
        />
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
              src={bannerImageUrl}
              alt={`${wallet.name} banner`}
              width={1200}
              height={400}
              className="w-full h-full object-cover"
              data-ai-hint={bannerImageHint}
              priority
            />
          </div>
        </Card>

        {isCreator && (
            <Card>
                <CardHeader>
                    <CardTitle>Creator Actions</CardTitle>
                    <CardDescription>As the creator of this wallet, you can propose to withdraw funds.</CardDescription>
                </CardHeader>
                <CardContent>
                    <Button onClick={() => setIsProposeDialogOpen(true)}>
                        <Download className="mr-2 h-4 w-4" /> Propose Withdrawal
                    </Button>
                </CardContent>
            </Card>
        )}

        {activeProposals.length > 0 && (
            <div className="space-y-4">
                <h2 className="text-2xl font-bold font-headline">Active Withdrawal Proposals</h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {activeProposals.map(p => (
                        <WithdrawalProposalCard key={p.id} proposal={p} wallet={wallet} onAction={fetchData} />
                    ))}
                </div>
            </div>
        )}

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
            {!isMember ? (
              <Card className="shadow-md">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 font-headline text-lg sm:text-xl">
                    <Users className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Join this Wallet
                  </CardTitle>
                  <CardDescription>Become a member to start contributing and request loans.</CardDescription>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <Button onClick={handleJoinWallet} disabled={isJoining || !currentUser} className="w-full">
                    {isJoining ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Joining...</> : 'Join Wallet'}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <Card className="shadow-md">
                <CardHeader className="p-4 sm:p-6">
                  <CardTitle className="flex items-center gap-2 font-headline text-lg sm:text-xl">
                    <PlusCircle className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Make a Contribution
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-4 sm:p-6">
                  <ContributeForm wallet={wallet} onSuccess={fetchData} />
                </CardContent>
              </Card>
            )}

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
                            <AvatarImage src="https://images.unsplash.com/photo-1607746882042-944635dfe10e?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" alt={member.name} data-ai-hint="profile portrait" />
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
