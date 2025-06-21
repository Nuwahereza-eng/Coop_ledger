
"use client";

import { useState } from 'react';
import type { Loan, Member, GroupWallet } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { approveLoan, rejectLoan } from '@/services/loanService';
import { Loader2, Check, X, Calendar, User, Wallet, DollarSign, Text, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';

interface ApproveLoanItemProps {
  loan: Loan;
  member?: Member;
  wallet?: GroupWallet;
  onActionCompleted: () => void;
}

export function ApproveLoanItem({ loan, member, wallet, onActionCompleted }: ApproveLoanItemProps) {
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);
  const { toast } = useToast();

  const handleApprove = async () => {
    setIsApproving(true);
    try {
      await approveLoan(loan.id);
      toast({
        title: "Loan Approved",
        description: `Loan ${loan.id.substring(0,6)} for ${member?.name} has been approved and funds disbursed.`,
      });
      onActionCompleted();
    } catch (error) {
      console.error("Failed to approve loan:", error);
      toast({
        title: "Approval Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    setIsRejecting(true);
    try {
      await rejectLoan(loan.id);
      toast({
        title: "Loan Rejected",
        description: `Loan ${loan.id.substring(0,6)} for ${member?.name} has been rejected.`,
        variant: "destructive",
      });
      onActionCompleted();
    } catch (error) {
      console.error("Failed to reject loan:", error);
      toast({
        title: "Rejection Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
      setIsRejecting(false);
    }
  };
  
  const isLoading = isApproving || isRejecting;

  return (
    <Card className="border-l-4 border-yellow-400 dark:border-yellow-600">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg">Loan Request: {loan.id.substring(0, 8)}...</CardTitle>
                <CardDescription>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3 mr-1.5"/>
                        Requested on {new Date(loan.requestDate as string).toLocaleDateString()}
                    </div>
                </CardDescription>
            </div>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700">
              Pending
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-3 text-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
            <p className="flex items-center"><User className="w-4 h-4 mr-2 text-primary"/> <strong>Member:</strong> <span className="ml-2">{member?.name || 'Unknown User'}</span></p>
            <p className="flex items-center"><Wallet className="w-4 h-4 mr-2 text-primary"/> <strong>From Wallet:</strong> <span className="ml-2">{wallet?.name || 'Unknown Wallet'}</span></p>
            <p className="flex items-center"><DollarSign className="w-4 h-4 mr-2 text-primary"/> <strong>Amount:</strong> <span className="ml-2">{loan.amount.toLocaleString()} ({wallet?.tokenType})</span></p>
            <p className="flex items-center"><Calendar className="w-4 h-4 mr-2 text-primary"/> <strong>Term:</strong> <span className="ml-2">{loan.termMonths} months at {(loan.interestRate * 100).toFixed(1)}%</span></p>
        </div>
        <div className="flex items-start pt-2">
            <Text className="w-4 h-4 mr-2 mt-0.5 text-primary shrink-0"/> 
            <div>
                <strong className="font-medium">Purpose:</strong>
                <p className="text-muted-foreground">{loan.purpose}</p>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <Button variant="link" asChild className="p-0 h-auto text-xs">
            <Link href={`/loans/${loan.id}`} target="_blank">
                View Details <ExternalLink className="w-3 h-3 ml-1.5"/>
            </Link>
        </Button>
        <div className="flex gap-2">
            <Button size="sm" variant="destructive" onClick={handleReject} disabled={isLoading}>
                {isRejecting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <X className="mr-2 h-4 w-4" />}
                Reject
            </Button>
            <Button size="sm" onClick={handleApprove} disabled={isLoading}>
                {isApproving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
                Approve
            </Button>
        </div>
      </CardFooter>
    </Card>
  )
}
