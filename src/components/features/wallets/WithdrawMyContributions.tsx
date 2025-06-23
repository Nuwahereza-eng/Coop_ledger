
"use client";

import { useState, useMemo } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Download } from 'lucide-react';
import type { GroupWallet } from '@/types';
import { useUser } from '@/contexts/UserContext';
import { withdrawMyContributions } from '@/services/walletService';

const withdrawalSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

interface WithdrawMyContributionsProps {
  wallet: GroupWallet;
  onSuccess: () => void;
}

export function WithdrawMyContributions({ wallet, onSuccess }: WithdrawMyContributionsProps) {
  const { toast } = useToast();
  const { currentUser, updateCurrentUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);

  const netContributions = useMemo(() => {
    if (!currentUser) return 0;
    const memberContributions = (wallet.transactions || [])
      .filter(tx => tx.type === 'contribution' && tx.memberId === currentUser.id)
      .reduce((sum, tx) => sum + tx.amount, 0);
    
    const memberWithdrawals = (wallet.transactions || [])
      .filter(tx => tx.type === 'group_withdrawal' && tx.memberId === currentUser.id)
      .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
      
    return memberContributions - memberWithdrawals;
  }, [wallet.transactions, currentUser]);

  const form = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema.refine(data => data.amount <= netContributions, {
      message: "Withdrawal amount cannot exceed your net contributions.",
      path: ["amount"],
    })),
    defaultValues: { amount: 0 },
  });

  async function onSubmit(data: WithdrawalFormData) {
    if (!currentUser) return;
    
    setIsLoading(true);
    try {
      await withdrawMyContributions(wallet.id, currentUser.id, data.amount);

      updateCurrentUser({ personalWalletBalance: currentUser.personalWalletBalance + data.amount });
      
      toast({
        title: "Withdrawal Successful",
        description: `${data.amount.toLocaleString()} ${wallet.tokenType} has been transferred to your personal wallet.`,
      });

      form.reset();
      onSuccess();
    } catch (error) {
      console.error("Failed to withdraw contributions:", error);
      toast({
        title: "Withdrawal Failed",
        description: error instanceof Error ? error.message : "An unknown error occurred.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Card className="shadow-md">
      <CardHeader className="p-4 sm:p-6">
        <CardTitle className="flex items-center gap-2 font-headline text-lg sm:text-xl">
          <Download className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
          My Contributions
        </CardTitle>
        <CardDescription>
          Your net contributions to this wallet are{' '}
          <span className="font-bold text-primary">{netContributions.toLocaleString()} {wallet.tokenType}</span>.
          You can withdraw up to this amount.
        </CardDescription>
      </CardHeader>
      <CardContent className="p-4 sm:p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
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
            <Button type="submit" variant="destructive" className="w-full" disabled={isLoading || netContributions <= 0}>
              {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Download className="mr-2 h-4 w-4" />}
              Withdraw
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
