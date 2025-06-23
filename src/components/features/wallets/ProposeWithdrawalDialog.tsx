
"use client";

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import type { GroupWallet } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { createWithdrawalProposal } from '@/services/withdrawalService';

const proposalSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  reason: z.string().min(10, { message: 'Reason must be at least 10 characters long.' }).max(200, { message: 'Reason cannot exceed 200 characters.' }),
});
type ProposalFormData = z.infer<typeof proposalSchema>;

interface ProposeWithdrawalDialogProps {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  wallet: GroupWallet;
  onSuccess: () => void;
}

export function ProposeWithdrawalDialog({ isOpen, setIsOpen, wallet, onSuccess }: ProposeWithdrawalDialogProps) {
  const { toast } = useToast();
  const { currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ProposalFormData>({
    resolver: zodResolver(proposalSchema),
    defaultValues: { amount: 0, reason: '' },
  });

  async function onSubmit(data: ProposalFormData) {
    if (!currentUser || currentUser.id !== wallet.creatorId) {
      toast({ title: "Unauthorized", description: "Only the wallet creator can propose a withdrawal.", variant: "destructive" });
      return;
    }
     if (data.amount > wallet.balance) {
      toast({ title: "Insufficient Funds", description: "Proposed withdrawal amount exceeds wallet balance.", variant: "destructive" });
      return;
    }
    
    setIsLoading(true);
    try {
      await createWithdrawalProposal({
        walletId: wallet.id,
        creatorId: currentUser.id,
        amount: data.amount,
        reason: data.reason,
      });

      toast({
        title: "Proposal Submitted",
        description: "Your withdrawal proposal is now open for voting by members.",
      });

      onSuccess();
      setIsOpen(false);
      form.reset();
    } catch (error) {
      console.error("Failed to create withdrawal proposal:", error);
      toast({
        title: "Submission Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Propose Fund Withdrawal</DialogTitle>
          <DialogDescription>
            Propose to withdraw funds from "{wallet.name}". This will be subject to a vote by all members.
            Current balance: {wallet.balance.toLocaleString()} {wallet.tokenType}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Amount to Withdraw</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="reason"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Reason for Withdrawal</FormLabel>
                  <FormControl>
                    <Textarea placeholder="E.g., To pay for group project expenses..." {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
             <DialogFooter>
                <DialogClose asChild>
                    <Button type="button" variant="secondary">Cancel</Button>
                </DialogClose>
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Submit Proposal
                </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
