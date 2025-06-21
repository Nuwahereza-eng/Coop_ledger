
"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import AppLayout from '../AppLayout';
import { Button } from '@/components/ui/button';
import { LoanListItem } from '@/components/features/loans/LoanListItem';
import type { Loan } from '@/types';
import { PlusCircle, Repeat, Loader2, AlertTriangle } from 'lucide-react';
import { getLoans } from '@/services/loanService';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export default function LoansPage() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchLoans() {
      try {
        setIsLoading(true);
        setError(null);
        const fetchedLoans = await getLoans();
        setLoans(fetchedLoans);
      } catch (err) {
        console.error("[LoansPage] Failed to fetch loans:", err);
        setError(err instanceof Error ? err.message : "An unknown error occurred while fetching loans.");
      } finally {
        setIsLoading(false);
      }
    }
    fetchLoans();
  }, []);

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <Repeat className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">My Loans</h1>
          </div>
          <Button asChild>
            <Link href="/loans/request">
              <PlusCircle className="mr-2 h-5 w-5" /> Request New Loan
            </Link>
          </Button>
        </div>

        {isLoading && (
          <div className="flex justify-center items-center py-12">
            <Loader2 className="h-12 w-12 animate-spin text-primary" />
            <p className="ml-4 text-muted-foreground">Loading loans...</p>
          </div>
        )}

        {error && !isLoading && (
          <Alert variant="destructive" className="max-w-2xl mx-auto">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error Fetching Loans</AlertTitle>
            <AlertDescription>
              {error} Please ensure your Firebase setup is correct and a 'loans' collection exists if you expect data.
            </AlertDescription>
          </Alert>
        )}

        {!isLoading && !error && loans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loans.map((loan) => (
              <LoanListItem key={loan.id} loan={loan} />
            ))}
          </div>
        ) : null}

        {!isLoading && !error && loans.length === 0 && (
          <div className="text-center py-12 bg-card rounded-lg shadow">
            <Repeat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl text-muted-foreground">No loans found.</p>
            <p className="mt-2 text-sm text-muted-foreground">You can request a new loan if you are part of a group wallet.</p>
          </div>
        )}
      </div>
    </AppLayout>
  );
}
