
"use client";

import { useEffect, useState, useCallback } from 'react';
import AppLayout from '../../AppLayout';
import { Users, Loader2, AlertTriangle, Info, Vote } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { getLoans } from '@/services/loanService';
import { getUsers } from '@/services/userService';
import { getWallets } from '@/services/walletService';
import type { Loan, Member, GroupWallet } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { ApproveLoanItem } from '@/components/features/admin/ApproveLoanItem';

export default function ApproveLoansPage() {
  const { userRole, isRoleInitialized } = useRole();
  const router = useRouter();
  
  const [votingLoans, setVotingLoans] = useState<Loan[]>([]);
  const [members, setMembers] = useState<Member[]>([]);
  const [wallets, setWallets] = useState<GroupWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [allLoans, allMembers, allWallets] = await Promise.all([
        getLoans(),
        getUsers(),
        getWallets()
      ]);
      const loansInVoting = allLoans.filter(loan => loan.status === 'voting_in_progress');
      setVotingLoans(loansInVoting);
      setMembers(allMembers);
      setWallets(allWallets);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
      console.error('[ApproveLoansPage] Error fetching data:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isRoleInitialized && userRole !== 'admin') {
      router.replace('/');
    } else if (userRole === 'admin') {
      fetchData();
    }
  }, [userRole, isRoleInitialized, router, fetchData]);

  const handleAction = async () => {
    // After an approval or rejection, re-fetch the data to update the list
    await fetchData();
  };
  
  if (isLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="mt-4 text-muted-foreground">Loading loan proposals...</p>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <Vote className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">
            Loan Proposals
          </h1>
        </div>

        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>Proposals Under Review</CardTitle>
            <CardDescription>
              Monitor active loan proposals being voted on by SACCO members. Decisions are made decentrally.
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
            {!error && votingLoans.length === 0 && (
              <Alert>
                <Info className="h-4 w-4" />
                <AlertTitle>No Active Proposals</AlertTitle>
                <AlertDescription>There are currently no loan proposals being voted on.</AlertDescription>
              </Alert>
            )}
            {!error && votingLoans.length > 0 && (
              <div className="space-y-4">
                {votingLoans.map(loan => {
                  const member = members.find(m => m.id === loan.memberId);
                  const wallet = wallets.find(w => w.id === loan.walletId);
                  return (
                    <ApproveLoanItem 
                      key={loan.id}
                      loan={loan}
                      member={member}
                      wallet={wallet}
                      onActionCompleted={handleAction}
                    />
                  );
                })}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
