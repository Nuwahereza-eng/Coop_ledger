
"use client";

import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../AppLayout';
import { getLoanById, mockWallets } from '@/lib/mockData';
import type { Loan, Repayment } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CalendarDays, DollarSign, Percent, Repeat, Wallet, CheckCircle2, XCircle, Hourglass, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';

const getLoanStatusBadgeClasses = (status: Loan['status']) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-800/30 dark:text-green-300 dark:border-green-700';
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700';
    case 'repaid': return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-800/30 dark:text-blue-300 dark:border-blue-700';
    case 'defaulted':
    case 'rejected': return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-800/30 dark:text-red-300 dark:border-red-700';
    default: return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700';
  }
};

const getRepaymentStatusBadgeClasses = (status: Repayment['status']) => {
  switch (status) {
    case 'paid': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-800/30 dark:text-green-300 dark:border-green-700';
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700';
    case 'overdue': return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-800/30 dark:text-red-300 dark:border-red-700';
    default: return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700';
  }
};

export default function LoanDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { toast } = useToast();
  const loanId = params.loanId as string;
  const loanData: Loan | undefined = getLoanById(loanId); // This is treated as initial data

  const [loan, setLoan] = useState<Loan | undefined>(loanData);
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [isRepaying, setIsRepaying] = useState(false);

  if (!loan) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <Repeat className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground">Loan Not Found</h1>
          <p className="text-muted-foreground mt-2">The loan you are looking for does not exist or you may not have access.</p>
          <Button onClick={() => router.push('/loans')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Loans
          </Button>
        </div>
      </AppLayout>
    );
  }

  const sourceWallet = mockWallets.find(w => w.id === loan.walletId);
  const progressPercentage = loan.amount > 0 ? (loan.totalRepaid / loan.amount) * 100 : 0;

  const handleRepayment = async () => {
    const amount = parseFloat(repaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive"});
      return;
    }
    setIsRepaying(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setLoan(prevLoan => {
        if (!prevLoan) return undefined;
        const newTotalRepaid = prevLoan.totalRepaid + amount;
        const updatedSchedule = prevLoan.repaymentSchedule.map(r => {
            if(r.status === 'pending' && amount > 0) { // Naive update for first pending
                const paidAmount = Math.min(amount, r.amountDue - (r.amountPaid || 0));
                r.amountPaid = (r.amountPaid || 0) + paidAmount;
                // amount -= paidAmount; // Reduce amount for next installments if any
                if (r.amountPaid >= r.amountDue) {
                    r.status = 'paid';
                    r.paymentDate = new Date().toISOString();
                }
            }
            return r;
        });
        return { ...prevLoan, totalRepaid: newTotalRepaid, repaymentSchedule: updatedSchedule };
    });

    toast({ title: "Repayment Submitted", description: `Repayment of ${amount} for loan ${loan.id} submitted.`});
    setRepaymentAmount('');
    setIsRepaying(false);
  };

  return (
    <AppLayout>
      <div className="space-y-6 sm:space-y-8">
        <Button variant="outline" asChild className="mb-2 text-sm">
          <Link href="/loans">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Loans
          </Link>
        </Button>

        <Card className="overflow-hidden shadow-lg">
          <CardHeader className="bg-gradient-to-br from-primary/10 via-card to-accent/10 p-4 sm:p-6">
             <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
                <div>
                    <div className="flex items-center gap-2 sm:gap-3 mb-1">
                        <Repeat className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
                        <CardTitle className="font-headline text-2xl sm:text-3xl text-foreground">Loan: {loan.id.substring(0,8)}</CardTitle>
                    </div>
                    <CardDescription className="text-xs sm:text-sm">Status: <Badge variant="outline" className={getLoanStatusBadgeClasses(loan.status) + " text-xs px-1.5 py-0.5"}>{loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}</Badge> &bull; Purpose: {loan.purpose}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <div className="w-full h-40 sm:h-52 overflow-hidden">
             <Image 
                src={`https://placehold.co/1200x400.png`}
                alt={`Loan ${loan.id} banner`}
                width={1200}
                height={400}
                className="w-full h-full object-cover"
                data-ai-hint="financial agreement document"
                priority
            />
          </div>
          <CardContent className="p-4 sm:p-6 grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
            {[
                {icon: DollarSign, label: "Principal", value: loan.amount.toLocaleString()},
                {icon: Percent, label: "Interest Rate", value: `${(loan.interestRate * 100).toFixed(1)}%`},
                {icon: CalendarDays, label: "Term", value: `${loan.termMonths} Months`},
                {icon: Wallet, label: "Source Wallet", value: sourceWallet?.name || 'N/A'},
            ].map(item => (
                <div key={item.label} className="flex items-center gap-2 sm:gap-3 p-2 sm:p-3 border rounded-md bg-card hover:bg-muted/50 transition-colors">
                    <item.icon className="w-5 h-5 sm:w-6 sm:h-6 text-primary shrink-0" />
                    <div>
                        <p className="text-xs text-muted-foreground">{item.label}</p>
                        <p className="font-semibold text-sm sm:text-md truncate" title={item.value}>{item.value}</p>
                    </div>
                </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6"><CardTitle className="font-headline text-lg sm:text-xl">Repayment Progress</CardTitle></CardHeader>
            <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                    <Progress value={progressPercentage} aria-label={`${progressPercentage.toFixed(0)}% repaid`} className="h-3 sm:h-4" />
                    <p className="text-xs sm:text-sm text-muted-foreground text-right">
                        {loan.totalRepaid.toLocaleString()} / {loan.amount.toLocaleString()} repaid ({progressPercentage.toFixed(1)}%)
                    </p>
                </div>
                {loan.status === 'active' && (
                    <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t">
                        <h3 className="text-md sm:text-lg font-semibold mb-2 sm:mb-3">Make a Repayment</h3>
                        <div className="flex flex-col sm:flex-row items-end gap-2 sm:gap-3">
                            <div className="flex-grow w-full sm:w-auto">
                                <Label htmlFor="repaymentAmount" className="text-xs sm:text-sm font-medium sr-only">Amount</Label>
                                <Input 
                                    id="repaymentAmount" 
                                    type="number" 
                                    value={repaymentAmount}
                                    onChange={(e) => setRepaymentAmount(e.target.value)}
                                    placeholder="Enter amount"
                                    className="mt-1 text-sm sm:text-base"
                                />
                            </div>
                            <Button onClick={handleRepayment} disabled={isRepaying || !repaymentAmount} className="w-full sm:w-auto text-sm sm:text-base">
                                {isRepaying ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</> : "Submit Repayment"}
                            </Button>
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>

        <Card className="shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-headline text-lg sm:text-xl">Repayment Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-2 md:p-4">
            {loan.repaymentSchedule.length > 0 ? (
                <ScrollArea className="max-h-[400px] w-full">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-xs sm:text-sm">Due Date</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Amount Due</TableHead>
                        <TableHead className="text-right text-xs sm:text-sm">Paid</TableHead>
                        <TableHead className="text-xs sm:text-sm">Status</TableHead>
                        <TableHead className="text-xs sm:text-sm hidden md:table-cell">Payment Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {loan.repaymentSchedule.map((repayment) => (
                        <TableRow key={repayment.id}>
                          <TableCell className="text-xs sm:text-sm">{new Date(repayment.dueDate).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{repayment.amountDue.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{repayment.amountPaid?.toLocaleString() ?? '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getRepaymentStatusBadgeClasses(repayment.status) + " text-xs px-1.5 py-0.5"}>
                              {repayment.status.charAt(0).toUpperCase() + repayment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell">{repayment.paymentDate ? new Date(repayment.paymentDate).toLocaleDateString() : '-'}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </ScrollArea>
            ) : (
              <p className="text-muted-foreground p-4 text-sm">Repayment schedule will be available once the loan is active.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
