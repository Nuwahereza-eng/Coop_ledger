import AppLayout from '../../AppLayout';
import { LoanRequestForm } from '@/components/features/loans/LoanRequestForm';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';

export default function RequestLoanPage() {
  return (
    <AppLayout>
      <div className="space-y-6">
        <Button variant="outline" asChild>
          <Link href="/loans">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Loans
          </Link>
        </Button>
        <div className="flex justify-center">
            <LoanRequestForm />
        </div>
      </div>
    </AppLayout>
  );
}
