
"use client";

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import AppLayout from '../AppLayout';
import { Button } from '@/components/ui/button';
import { LoanListItem } from '@/components/features/loans/LoanListItem';
import type { Loan, GroupWallet } from '@/types';
import { PlusCircle, Vote, Loader2, AlertTriangle, FileText, GitPullRequest } from 'lucide-react';
import { getLoans } from '@/services/loanService';
import { getWallets } from '@/services/walletService';
import { useUser } from '@/contexts/UserContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [wallets, setWallets] = useState<GroupWallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { currentUser } = useUser();

  useEffect(() => {
    async function fetchData() {
      if (!currentUser) {
        // Wait for user to be available
        setIsLoading(false);
        return;
      };
      
      try {
        setIsLoading(true);
        setError(null);
        const [fetchedLoans, fetchedWallets] = await Promise.all([
            getLoans(),
            getWallets()
        ]);
        setLoans(fetchedLoans);
        setWallets(fetchedWallets);
      } catch (err) {
        console.error("[LoansPage] Failed to fetch data:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while fetching data.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchData();
  }, [currentUser]); // Re-fetch when user is available

  const { myProposals, proposalsToVoteOn } = useMemo(() => {
    if (!currentUser) return { myProposals: [], proposalsToVoteOn: [] };

    const myProposals = loans.filter(loan => loan.memberId === currentUser.id);
    
    const userWalletIds = new Set(
        wallets
            .filter(wallet => wallet.members.some(member => member.id === currentUser.id))
            .map(wallet => wallet.id)
    );

    const proposalsToVoteOn = loans.filter(loan => 
        loan.status === 'voting_in_progress' &&
        loan.memberId !== currentUser.id && // Don't vote on your own proposals
        userWalletIds.has(loan.walletId) &&
        !(loan.voters || []).includes(currentUser.id)
    );
    
    return { myProposals, proposalsToVoteOn };

  }, [loans, wallets, currentUser]);


  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <GitPullRequest className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">Loan Proposals</h1>
          </div>
          <Button asChild>
            <Link href="/loans/request">
              <PlusCircle className="mr-2 h-5 w-5" /> Propose New Loan
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading proposals...</p>
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Fetching Data</AlertTitle>
            <AlertDescription>
              {error} Please ensure your setup is correct and collections exist in Firestore.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && (
            <div className="space-y-12">
                 {/* Section for Proposals to Vote On */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <Vote className="h-7 w-7 text-primary" />
                        <h2 className="text-xl sm:text-2xl font-semibold font-headline text-foreground">Proposals Requiring Your Vote</h2>
                    </div>
                    {proposalsToVoteOn.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {proposalsToVoteOn.map((loan) => (
                            <LoanListItem key={loan.id} loan={loan} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-card rounded-lg shadow">
                            <Vote className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-xl text-muted-foreground">No proposals are currently waiting for your vote.</p>
                            <p className="mt-2 text-sm text-muted-foreground">Check back later to participate in group decisions.</p>
                        </div>
                    )}
                </section>
                
                {/* Section for My Proposals */}
                <section>
                    <div className="flex items-center gap-3 mb-6">
                        <FileText className="h-7 w-7 text-primary" />
                        <h2 className="text-xl sm:text-2xl font-semibold font-headline text-foreground">My Submitted Proposals</h2>
                    </div>
                    {myProposals.length > 0 ? (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {myProposals.map((loan) => (
                            <LoanListItem key={loan.id} loan={loan} />
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-12 bg-card rounded-lg shadow">
                            <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                            <p className="text-xl text-muted-foreground">You have not submitted any loan proposals.</p>
                            <p className="mt-2 text-sm text-muted-foreground">You can propose a new loan if you are part of a group wallet.</p>
                        </div>
                    )}
                </section>
            </div>
        )}

      </div>
    </AppLayout>
  );
}
