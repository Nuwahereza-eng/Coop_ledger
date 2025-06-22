
"use client";

import { useState } from 'react';
import AppLayout from '../AppLayout';
import { useUser } from '@/contexts/UserContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Loader2, ArrowUpCircle, ArrowDownCircle, WalletCards } from 'lucide-react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { addPersonalTransaction } from '@/services/personalLedgerService';

const amountSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
});
type AmountFormData = z.infer<typeof amountSchema>;

export default function PersonalWalletPage() {
  const { currentUser, updateCurrentUser } = useUser();
  const { toast } = useToast();
  const [isAdding, setIsAdding] = useState(false);
  const [isRemoving, setIsRemoving] = useState(false);

  const addFundsForm = useForm<AmountFormData>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: 0 },
  });

  const removeFundsForm = useForm<AmountFormData>({
    resolver: zodResolver(amountSchema),
    defaultValues: { amount: 0 },
  });

  async function handleAddFunds(data: AmountFormData) {
    if (!currentUser) return;
    setIsAdding(true);
    try {
        await addPersonalTransaction({
            memberId: currentUser.id,
            type: 'personal_deposit',
            amount: data.amount,
            description: `Personal deposit by ${currentUser.name}`
        });
        updateCurrentUser({ personalWalletBalance: currentUser.personalWalletBalance + data.amount });
        toast({
            title: 'Funds Added',
            description: `${data.amount.toLocaleString()} UGX has been added and recorded in the ledger.`,
        });
        addFundsForm.reset({ amount: 0 });
    } catch(error) {
        console.error("Failed to add funds:", error);
        toast({
            title: 'Failed to Add Funds',
            description: 'There was an error recording your transaction.',
            variant: 'destructive',
        });
    } finally {
        setIsAdding(false);
    }
  }

  async function handleRemoveFunds(data: AmountFormData) {
    if (!currentUser) return;
    if (data.amount > currentUser.personalWalletBalance) {
      toast({
        title: 'Insufficient Funds',
        description: 'You cannot remove more than your current balance.',
        variant: 'destructive',
      });
      return;
    }
    setIsRemoving(true);
     try {
        await addPersonalTransaction({
            memberId: currentUser.id,
            type: 'personal_withdrawal',
            amount: -data.amount, // Store withdrawals as negative amounts for consistency
            description: `Personal withdrawal by ${currentUser.name}`
        });
        updateCurrentUser({ personalWalletBalance: currentUser.personalWalletBalance - data.amount });
        toast({
            title: 'Funds Removed',
            description: `${data.amount.toLocaleString()} UGX has been removed and recorded in the ledger.`,
        });
        removeFundsForm.reset({ amount: 0 });
    } catch (error) {
        console.error("Failed to remove funds:", error);
        toast({
            title: 'Failed to Remove Funds',
            description: 'There was an error recording your transaction.',
            variant: 'destructive',
        });
    } finally {
        setIsRemoving(false);
    }
  }
  
  // The AppLayout should handle the main loading state, but we add a guard here
  // to prevent rendering with a null user, which could cause errors.
  if (!currentUser) {
    // This renders inside AppLayout's own loading state, so it's a fallback.
    return (
        <AppLayout>
            <div className="flex justify-center items-center h-full">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <WalletCards className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">
            Personal Wallet
          </h1>
        </div>

        <Card className="text-center shadow-lg">
          <CardHeader>
            <CardTitle className="text-lg text-muted-foreground">Current Balance</CardTitle>
            <CardDescription className="text-4xl font-bold text-primary">
              {currentUser.personalWalletBalance.toLocaleString()} UGX
            </CardDescription>
          </CardHeader>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowUpCircle className="h-6 w-6 text-green-500" />
                <CardTitle>Add Funds</CardTitle>
              </div>
              <CardDescription>Deposit funds into your personal wallet. This will be recorded on the ledger.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...addFundsForm}>
                <form onSubmit={addFundsForm.handleSubmit(handleAddFunds)} className="space-y-4">
                  <FormField
                    control={addFundsForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount to Add</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter amount" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full" disabled={isAdding}>
                    {isAdding ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Adding...</> : 'Add Funds'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <ArrowDownCircle className="h-6 w-6 text-red-500" />
                <CardTitle>Remove Funds</CardTitle>
              </div>
              <CardDescription>Withdraw funds from your personal wallet. This will be recorded on the ledger.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...removeFundsForm}>
                <form onSubmit={removeFundsForm.handleSubmit(handleRemoveFunds)} className="space-y-4">
                   <FormField
                    control={removeFundsForm.control}
                    name="amount"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Amount to Remove</FormLabel>
                        <FormControl>
                          <Input type="number" placeholder="Enter amount" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" variant="destructive" className="w-full" disabled={isRemoving}>
                    {isRemoving ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Removing...</> : 'Remove Funds'}
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppLayout>
  );
}
