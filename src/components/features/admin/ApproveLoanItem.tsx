
"use client";

import type { Loan, Member, GroupWallet } from '@/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Calendar, User, Wallet, DollarSign, Text, ExternalLink, ThumbsUp, ThumbsDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import { Progress } from '@/components/ui/progress';

interface ApproveLoanItemProps {
  loan: Loan;
  member?: Member;
  wallet?: GroupWallet;
  onActionCompleted: () => void; // This might not be needed anymore but kept for consistency
}

export function ApproveLoanItem({ loan, member, wallet, onActionCompleted }: ApproveLoanItemProps) {
  const totalVotes = loan.votesFor.length + loan.votesAgainst.length;
  const totalMembers = wallet?.members.length || 1;
  const voteProgress = (totalVotes / totalMembers) * 100;
  const quorum = Math.floor(totalMembers / 2) + 1;

  return (
    <Card className="border-l-4 border-yellow-400 dark:border-yellow-600">
      <CardHeader>
        <div className="flex justify-between items-start">
            <div>
                <CardTitle className="text-lg">Loan Proposal: {loan.id.substring(0, 8)}...</CardTitle>
                <CardDescription>
                    <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Calendar className="w-3 h-3 mr-1.5"/>
                        Requested on {new Date(loan.requestDate as string).toLocaleDateString()}
                    </div>
                </CardDescription>
            </div>
            <Badge variant="outline" className="bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700">
              Voting in Progress
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4 text-sm">
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
         <div className="pt-2">
            <strong className="font-medium">Voting Progress:</strong>
             <div className="flex justify-between items-center text-xs text-muted-foreground mt-1">
                <span>{totalVotes} of {totalMembers} voted</span>
                <span>{quorum} votes to pass</span>
            </div>
            <Progress value={voteProgress} className="mt-1 h-2"/>
            <div className="flex justify-between items-center text-xs mt-1">
                <span className="flex items-center gap-1 text-green-600"><ThumbsUp className="h-3 w-3"/> {loan.votesFor.length}</span>
                <span className="flex items-center gap-1 text-red-600"><ThumbsDown className="h-3 w-3"/> {loan.votesAgainst.length}</span>
            </div>
        </div>
      </CardContent>
      <CardFooter className="flex justify-start">
        <Button variant="link" asChild className="p-0 h-auto text-xs">
            <Link href={`/loans/${loan.id}`} target="_blank">
                View Proposal & Vote Status <ExternalLink className="w-3 h-3 ml-1.5"/>
            </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}
