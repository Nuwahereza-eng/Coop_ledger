
"use client";

import { useState } from 'react';
import type { WithdrawalProposal, GroupWallet } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { useToast } from '@/hooks/use-toast';
import { castVoteOnWithdrawal, executeWithdrawal } from '@/services/withdrawalService';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Loader2, DollarSign, MessageSquare, ThumbsUp, ThumbsDown, Check, Download, AlertCircle } from 'lucide-react';

interface WithdrawalProposalCardProps {
  proposal: WithdrawalProposal;
  wallet: GroupWallet;
  onAction: () => void; // To refresh data on parent
}

export function WithdrawalProposalCard({ proposal, wallet, onAction }: WithdrawalProposalCardProps) {
  const { currentUser, updateCurrentUser } = useUser();
  const { toast } = useToast();
  const [isVoting, setIsVoting] = useState(false);
  const [isExecuting, setIsExecuting] = useState(false);

  if (!currentUser) return null;

  const totalMembers = wallet.members.length;
  const quorum = Math.floor(totalMembers / 2) + 1;

  const votesFor = proposal.votesFor?.length || 0;
  const votesAgainst = proposal.votesAgainst?.length || 0;
  const totalVotes = votesFor + votesAgainst;
  const voteProgress = (totalVotes / totalMembers) * 100;
  
  const hasVoted = proposal.voters?.includes(currentUser.id);
  const isCreator = proposal.creatorId === currentUser.id;
  const canVote = wallet.members.some(m => m.id === currentUser.id) && !isCreator && !hasVoted && proposal.status === 'voting_in_progress';
  const canExecute = isCreator && proposal.status === 'approved';

  const getStatusBadge = () => {
    switch (proposal.status) {
      case 'voting_in_progress':
        return <Badge variant="outline" className="bg-yellow-100 text-yellow-700">Voting</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-blue-100 text-blue-700">Approved</Badge>;
      case 'executed':
        return <Badge variant="outline" className="bg-green-100 text-green-700">Executed</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      default:
        return <Badge variant="secondary">{proposal.status}</Badge>;
    }
  };

  const handleVote = async (vote: 'for' | 'against') => {
    setIsVoting(true);
    try {
      await castVoteOnWithdrawal({
        proposalId: proposal.id,
        memberId: currentUser.id,
        vote,
      });
      toast({ title: "Vote Cast", description: "Your vote has been recorded." });
      onAction();
    } catch (error) {
      toast({
        title: "Voting Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsVoting(false);
    }
  };
  
  const handleExecute = async () => {
    setIsExecuting(true);
    try {
      const withdrawnAmount = await executeWithdrawal({ proposalId: proposal.id, memberId: currentUser.id });
      updateCurrentUser({ personalWalletBalance: currentUser.personalWalletBalance + withdrawnAmount });
      toast({
        title: "Withdrawal Executed!",
        description: `${withdrawnAmount.toLocaleString()} has been transferred to your personal wallet.`,
      });
      onAction();
    } catch (error) {
      toast({
        title: "Execution Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsExecuting(false);
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <div className="flex justify-between items-start">
          <CardTitle className="text-lg">Withdrawal Proposal</CardTitle>
          {getStatusBadge()}
        </div>
        <CardDescription>Proposed by: {wallet.members.find(m => m.id === proposal.creatorId)?.name || 'Unknown'}</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center font-bold text-xl">
          <DollarSign className="mr-2 h-5 w-5 text-primary" />
          {proposal.amount.toLocaleString()} {wallet.tokenType}
        </div>
        <div className="flex items-start text-sm text-muted-foreground">
          <MessageSquare className="mr-2 h-4 w-4 mt-0.5 shrink-0" />
          <p>{proposal.reason}</p>
        </div>

        {proposal.status === 'voting_in_progress' && (
          <div className="pt-2">
            <div className="flex justify-between items-center text-xs text-muted-foreground mb-1">
              <span>{totalVotes} of {totalMembers} voted</span>
              <span>{quorum} votes to pass</span>
            </div>
            <Progress value={voteProgress} className="h-2" />
            <div className="flex justify-between items-center text-xs mt-1">
              <span className="flex items-center gap-1 text-green-600"><ThumbsUp className="h-3 w-3" /> {votesFor}</span>
              <span className="flex items-center gap-1 text-red-600"><ThumbsDown className="h-3 w-3" /> {votesAgainst}</span>
            </div>
          </div>
        )}
      </CardContent>
      <CardFooter className="flex flex-col items-stretch gap-2">
        {canVote && (
          <div className="flex gap-2">
            <Button variant="outline" className="w-full" onClick={() => handleVote('against')} disabled={isVoting}>
              {isVoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ThumbsDown className="mr-2 h-4 w-4"/>}
              Reject
            </Button>
            <Button className="w-full" onClick={() => handleVote('for')} disabled={isVoting}>
              {isVoting ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <ThumbsUp className="mr-2 h-4 w-4"/>}
              Approve
            </Button>
          </div>
        )}
        {hasVoted && proposal.status === 'voting_in_progress' && (
          <Alert variant="default" className="bg-blue-50 border-blue-200 text-blue-800">
            <Check className="h-4 w-4 !text-blue-800" />
            <AlertTitle>Vote Recorded</AlertTitle>
            <AlertDescription>You have already voted on this proposal.</AlertDescription>
          </Alert>
        )}
        {canExecute && (
            <Button onClick={handleExecute} disabled={isExecuting} className="w-full bg-green-600 hover:bg-green-700">
                {isExecuting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
                Execute Withdrawal
            </Button>
        )}
        {isCreator && proposal.status === 'approved' && !canExecute && (
             <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Error</AlertTitle>
                <AlertDescription>Something went wrong. You should be able to execute this.</AlertDescription>
             </Alert>
        )}
      </CardFooter>
    </Card>
  );
}
