
"use client";

import { useState, useEffect, useCallback } from 'react';
import AppLayout from '../AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { getWallets, addTransactionToWallet } from '@/services/walletService';
import type { GroupWallet } from '@/types';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Form, FormControl, FormField, FormLabel, FormMessage } from '@/components/ui/form';
import { Wallet, Loader2 } from 'lucide-react';
import { useUser } from '@/contexts/UserContext';

const contributionPageSchema = z.object({
  walletId: z.string().min(1, { message: 'Please select a wallet.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  tokenType: z.string().min(1, { message: 'Please select a token type.' }),
});

type ContributionPageFormData = z.infer<typeof contributionPageSchema>;

export default function ContributionsPage() {
  const { toast } = useToast();
  const { currentUser, updateCurrentUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState<GroupWallet[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isFetchingWallets, setIsFetchingWallets] = useState(true);

  useEffect(() => {
    setIsClient(true);

    async function fetchAndFilterWallets() {
      if (!currentUser) return; // Don't fetch if no user

      try {
        console.log('[ContributionsPage] Fetching user wallets...');
        setIsFetchingWallets(true);
        const allWallets = await getWallets();

        // The key change: Filter wallets to only include those the user is a member of
        const memberWallets = allWallets.filter(wallet =>
          wallet.members.some(member => member.id === currentUser.id)
        );
        
        setWallets(memberWallets);
        console.log('[ContributionsPage] Successfully fetched and filtered wallets for current user:', memberWallets);
      } catch (error) {
        toast({
          title: 'Error fetching wallets',
          description: 'Could not load your group wallets. Please try again later.',
          variant: 'destructive',
        });
        console.error("[ContributionsPage] Error in fetchUserWallets:", error);
      } finally {
        setIsFetchingWallets(false);
      }
    }

    fetchAndFilterWallets();
  }, [currentUser, toast]); // Dependency on currentUser ensures this runs when user logs in

  const form = useForm<ContributionPageFormData>({
    resolver: zodResolver(contributionPageSchema),
    defaultValues: {
      walletId: '',
      amount: 0,
      tokenType: '',
    },
  });

  const selectedWalletId = form.watch('walletId');
  
  useEffect(() => {
    const selectedWallet = wallets.find(w => w.id === selectedWalletId);
    if (selectedWallet) {
      form.setValue('tokenType', selectedWallet.tokenType, { shouldValidate: true });
    } else {
      form.setValue('tokenType', '', { shouldValidate: true });
    }
  }, [selectedWalletId, wallets, form]);


  async function onSubmit(data: ContributionPageFormData) {
    if (!currentUser) {
        toast({ title: "No user found", description: "You must be logged in to make a contribution.", variant: "destructive"});
        return;
    }
    
    if (currentUser.personalWalletBalance < data.amount) {
        toast({ title: "Insufficient Funds", description: `Your personal balance of ${currentUser.personalWalletBalance.toLocaleString()} is less than the contribution amount.`, variant: "destructive"});
        return;
    }

    setIsLoading(true);
    const targetWallet = wallets.find(w => w.id === data.walletId);
    if (!targetWallet) {
        toast({ title: "Wallet not found", variant: "destructive" });
        setIsLoading(false);
        return;
    }

    try {
        await addTransactionToWallet(data.walletId, {
            type: 'contribution',
            amount: data.amount,
            description: `Contribution by ${currentUser.name}`,
            memberId: currentUser.id,
        });

        // Deduct from personal wallet (local state simulation)
        updateCurrentUser({ personalWalletBalance: currentUser.personalWalletBalance - data.amount });

        toast({
            title: 'Contribution Submitted',
            description: `Your contribution of ${data.amount.toLocaleString()} ${data.tokenType} to "${targetWallet.name}" has been recorded.`,
        });
        
        // Re-fetch wallets to update balances in the dropdown
        // The fetch logic will re-run automatically due to the useEffect dependency on `currentUser`
        // which will be updated by the successful transaction. Let's trigger it manually just in case.
        if (currentUser) {
            const allWallets = await getWallets();
            const memberWallets = allWallets.filter(wallet => wallet.members.some(member => member.id === currentUser.id));
            setWallets(memberWallets);
        }


        form.reset({ walletId: '', amount: 0, tokenType: '' });

    } catch(error) {
        console.error("Failed to make contribution:", error);
        toast({
            title: 'Contribution Failed',
            description: 'There was an error submitting your contribution.',
            variant: 'destructive',
        });
    } finally {
        setIsLoading(false);
    }
  }
  
  if (!isClient || isFetchingWallets) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8 flex flex-col items-center">
        <Card className="w-full max-w-lg shadow-lg">
          <CardHeader className="text-center p-6">
            <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-3 mx-auto w-fit">
                <Wallet className="h-10 w-10 text-primary" />
            </div>
            <CardTitle className="font-headline text-2xl text-foreground">Make a Contribution</CardTitle>
            <CardDescription>Contribute funds to a group wallet you are a member of. Your personal balance is {currentUser?.personalWalletBalance.toLocaleString()} {wallets[0]?.tokenType || '...'} </CardDescription>
          </CardHeader>
          <CardContent className="p-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="walletId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Select Group Wallet</FormLabel>
                      <Select 
                        onValueChange={field.onChange}
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={wallets.length > 0 ? "Choose a wallet" : "You are not a member of any wallets"} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets.length > 0 ? (
                            wallets.map(wallet => (
                              <SelectItem key={wallet.id} value={wallet.id}>
                                {wallet.name} ({wallet.balance.toLocaleString()} {wallet.tokenType})
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="none" disabled>No wallets to contribute to.</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Amount ({form.getValues('tokenType') || '...'})</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter amount" 
                          {...field} 
                          disabled={!selectedWalletId} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="tokenType"
                  render={({ field }) => (
                    <FormItem className="hidden">
                      <FormLabel>Token Type</FormLabel>
                       <Input {...field} readOnly disabled className="bg-muted/50" />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <Button type="submit" className="w-full" disabled={isLoading || !selectedWalletId || !currentUser}>
                  {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Contribute Funds'}
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
