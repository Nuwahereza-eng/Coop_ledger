
"use client";

import { useParams, useRouter } from 'next/navigation';
import AppLayout from '../../AppLayout';
import { getLoanById, castVoteOnLoan } from '@/services/loanService';
import { getWalletById } from '@/services/walletService';
import type { Loan, Repayment, GroupWallet } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CalendarDays, DollarSign, Percent, Repeat, Wallet, CheckCircle2, XCircle, Hourglass, Loader2, AlertTriangle, Vote, ThumbsUp, ThumbsDown } from 'lucide-react';
import Link from 'next/link';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Image from 'next/image';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useUser } from '@/contexts/UserContext';
import { processLoanRepayment } from '@/services/loanService';

const getLoanStatusBadgeClasses = (status: Loan['status']) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-800/30 dark:text-green-300 dark:border-green-700';
    case 'pending':
    case 'voting_in_progress': return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700';
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
  const { currentUser } = useUser();
  const loanId = params.loanId as string;

  const [loan, setLoan] = useState<Loan | null>(null);
  const [sourceWallet, setSourceWallet] = useState<GroupWallet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [repaymentAmount, setRepaymentAmount] = useState('');
  const [isRepaying, setIsRepaying] = useState(false);
  const [isVoting, setIsVoting] = useState(false);

  const fetchLoanDetails = useCallback(async () => {
    if (!loanId) return;
    try {
      setIsLoading(true);
      setError(null);
      const fetchedLoan = await getLoanById(loanId);
      if (fetchedLoan) {
        setLoan(fetchedLoan);
        if (fetchedLoan.walletId) {
            const fetchedWallet = await getWalletById(fetchedLoan.walletId);
            setSourceWallet(fetchedWallet || null);
        }
      } else {
        setError(`Loan with ID "${loanId}" not found.`);
      }
    } catch (err) {
      console.error(`[LoanDetailPage] Failed to fetch loan ${loanId}:`, err);
      setError(err instanceof Error ? err.message : "An unknown error occurred.");
    } finally {
      setIsLoading(false);
    }
  }, [loanId]);

  useEffect(() => {
    fetchLoanDetails();
  }, [fetchLoanDetails]);

  const handleVote = async (vote: 'for' | 'against') => {
    if (!currentUser || !loan) return;
    setIsVoting(true);
    try {
      await castVoteOnLoan(loan.id, currentUser.id, vote);
      toast({
        title: "Vote Cast!",
        description: `You have successfully voted to ${vote === 'for' ? 'approve' : 'reject'} this proposal.`
      });
      await fetchLoanDetails(); // Refresh to see new vote count and potentially new status
    } catch (error) {
      console.error("Failed to cast vote:", error);
      toast({
          title: "Voting Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive"
      });
    } finally {
      setIsVoting(false);
    }
  };

  const handleRepayment = async () => {
    if (!loan || !currentUser) {
        toast({ title: "Error", description: "Loan or user data not available.", variant: "destructive"});
        return;
    }
    const amount = parseFloat(repaymentAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Please enter a valid positive amount.", variant: "destructive"});
      return;
    }

    const totalAmountDue = loan.amount * (1 + loan.interestRate);
    const remainingBalance = totalAmountDue - loan.totalRepaid;

    if (amount > remainingBalance + 0.01) {
        toast({ 
            title: "Overpayment Not Allowed", 
            description: `The maximum repayment amount is ${remainingBalance.toLocaleString()}. You tried to pay ${amount.toLocaleString()}.`, 
            variant: "destructive"
        });
        return;
    }
    
    setIsRepaying(true);
    
    try {
      await processLoanRepayment(loan.id, amount, currentUser.id);

      toast({ 
          title: "Repayment Successful", 
          description: `Your payment of ${amount.toLocaleString()} has been recorded.`
      });
      
      setRepaymentAmount('');
      await fetchLoanDetails();

    } catch (error) {
      console.error("Failed to process repayment:", error);
      toast({
          title: "Repayment Failed",
          description: error instanceof Error ? error.message : "An unknown error occurred.",
          variant: "destructive"
      });
    } finally {
        setIsRepaying(false);
    }
  };
  
  if (isLoading) {
    return (
        <AppLayout>
            <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                <p className="ml-4 text-muted-foreground">Loading loan details...</p>
            </div>
        </AppLayout>
    );
  }

  if (error) {
    return (
      <AppLayout>
        <div className="text-center py-12">
          <AlertTriangle className="h-16 w-16 text-destructive mx-auto mb-4" />
          <h1 className="text-2xl font-semibold text-foreground">Error Loading Loan</h1>
          <Alert variant="destructive" className="max-w-md mx-auto mt-4">
            <AlertTitle>Loading Failed</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
          <Button onClick={() => router.push('/loans')} className="mt-6">
            <ArrowLeft className="mr-2 h-4 w-4" /> Back to Loans
          </Button>
        </div>
      </AppLayout>
    );
  }

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

  const totalAmountDue = loan.amount * (1 + loan.interestRate);
  const progressPercentage = totalAmountDue > 0 ? (loan.totalRepaid / totalAmountDue) * 100 : 0;
  const isMemberOfWallet = sourceWallet?.members.some(m => m.id === currentUser?.id) ?? false;
  const hasVoted = loan.voters?.includes(currentUser?.id ?? '') ?? false;
  const canVote = isMemberOfWallet && !hasVoted && loan.status === 'voting_in_progress';
  
  const totalVotes = loan.votesFor.length + loan.votesAgainst.length;
  const quorum = sourceWallet ? Math.floor(sourceWallet.members.length / 2) + 1 : 0;

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
                        <CardTitle className="font-headline text-2xl sm:text-3xl text-foreground">Loan Proposal: {loan.id.substring(0,8)}</CardTitle>
                    </div>
                    <CardDescription className="text-xs sm:text-sm">Status: <Badge variant="outline" className={getLoanStatusBadgeClasses(loan.status) + " text-xs px-1.5 py-0.5"}>{loan.status.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}</Badge> &bull; Purpose: {loan.purpose}</CardDescription>
                </div>
            </div>
          </CardHeader>
          <div className="w-full h-40 sm:h-52 overflow-hidden">
             <Image 
                src={`https://loremflickr.com/1200/400/finance,document`}
                alt={`Loan ${loan.id} banner`}
                width={1200}
                height={400}
                className="w-full h-full object-cover"
                data-ai-hint="financial document"
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

        {loan.status === 'voting_in_progress' && (
          <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6 flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <Vote className="w-6 h-6 text-primary" />
                <CardTitle className="font-headline text-lg sm:text-xl">Community Vote</CardTitle>
              </div>
              <p className="text-sm text-muted-foreground">{totalVotes} of {sourceWallet?.members.length} members have voted.</p>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center text-sm mb-1">
                  <span className="font-medium text-green-600">For: {loan.votesFor.length}</span>
                  <span className="font-medium text-red-600">Against: {loan.votesAgainst.length}</span>
                </div>
                <Progress value={(totalVotes / (sourceWallet?.members.length || 1)) * 100} className="h-3" />
                 <p className="text-xs text-muted-foreground text-center">A majority of {quorum} votes "For" is needed to approve this proposal.</p>
              </div>
              {canVote && (
                <div className="mt-6 pt-6 border-t flex justify-center gap-4">
                  <Button variant="destructive" onClick={() => handleVote('against')} disabled={isVoting}>
                    {isVoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ThumbsDown className="mr-2 h-4 w-4"/>}
                    Reject Proposal
                  </Button>
                  <Button onClick={() => handleVote('for')} disabled={isVoting} className="bg-green-600 hover:bg-green-700">
                     {isVoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ThumbsUp className="mr-2 h-4 w-4"/>}
                    Approve Proposal
                  </Button>
                </div>
              )}
               {hasVoted && (
                <Alert className="mt-6 bg-blue-50 border-blue-200 dark:bg-blue-900/20 dark:border-blue-500/50">
                  <AlertTitle>You have already voted on this proposal.</AlertTitle>
                  <AlertDescription>Your vote has been recorded on the ledger.</AlertDescription>
                </Alert>
              )}
               {!isMemberOfWallet && (
                 <Alert className="mt-6">
                  <AlertTitle>Voting is for Wallet Members Only</AlertTitle>
                  <AlertDescription>You must be a member of the "{sourceWallet?.name}" wallet to vote on this proposal.</AlertDescription>
                </Alert>
               )}
            </CardContent>
          </Card>
        )}
        
        {loan.status === 'active' && (
        <Card className="shadow-md">
            <CardHeader className="p-4 sm:p-6"><CardTitle className="font-headline text-lg sm:text-xl">Repayment Progress</CardTitle></CardHeader>
            <CardContent className="p-4 sm:p-6">
                <div className="space-y-2">
                    <Progress value={progressPercentage} aria-label={`${progressPercentage.toFixed(0)}% repaid`} className="h-3 sm:h-4" />
                    <p className="text-xs sm:text-sm text-muted-foreground text-right">
                        {loan.totalRepaid.toLocaleString()} / {totalAmountDue.toLocaleString()} repaid ({progressPercentage.toFixed(1)}%)
                    </p>
                </div>
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
            </CardContent>
        </Card>
        )}

        {(loan.status === 'active' || loan.status === 'repaid' || loan.status === 'defaulted') && (
        <Card className="shadow-md">
          <CardHeader className="p-4 sm:p-6">
            <CardTitle className="font-headline text-lg sm:text-xl">Repayment Schedule</CardTitle>
          </CardHeader>
          <CardContent className="p-0 sm:p-2 md:p-4">
            {loan.repaymentSchedule && loan.repaymentSchedule.length > 0 ? (
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
                          <TableCell className="text-xs sm:text-sm">{new Date(repayment.dueDate as string).toLocaleDateString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{repayment.amountDue.toLocaleString()}</TableCell>
                          <TableCell className="text-right text-xs sm:text-sm">{repayment.amountPaid?.toLocaleString() ?? '-'}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={getRepaymentStatusBadgeClasses(repayment.status) + " text-xs px-1.5 py-0.5"}>
                              {repayment.status.charAt(0).toUpperCase() + repayment.status.slice(1)}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-xs sm:text-sm hidden md:table-cell">{repayment.paymentDate ? new Date(repayment.paymentDate as string).toLocaleDateString() : '-'}</TableCell>
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
        )}
      </div>
    </AppLayout>
  );
}
