"use client";

import Link from 'next/link';
import AppLayout from '../AppLayout';
import { Button } from '@/components/ui/button';
import { LoanListItem } from '@/components/features/loans/LoanListItem';
import { mockLoans } from '@/lib/mockData';
import type { Loan } from '@/types';
import { PlusCircle, Repeat } from 'lucide-react';

export default function LoansPage() {
  const loans: Loan[] = mockLoans; 

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

        {loans.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {loans.map((loan) => (
              <LoanListItem key={loan.id} loan={loan} />
            ))}
          </div>
        ) : (
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
