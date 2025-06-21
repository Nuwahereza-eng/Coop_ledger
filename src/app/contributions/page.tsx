
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
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Wallet, Loader2 } from 'lucide-react';

const contributionPageSchema = z.object({
  walletId: z.string().min(1, { message: 'Please select a wallet.' }),
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  tokenType: z.string().min(1, { message: 'Please select a token type.' }),
});

type ContributionPageFormData = z.infer<typeof contributionPageSchema>;

export default function ContributionsPage() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState<GroupWallet[]>([]);
  const [isClient, setIsClient] = useState(false);
  const [isFetchingWallets, setIsFetchingWallets] = useState(true);

  const fetchUserWallets = useCallback(async () => {
    try {
        console.log('[ContributionsPage] Fetching user wallets...');
        setIsFetchingWallets(true);
        const fetchedWallets = await getWallets();
        setWallets(fetchedWallets);
        console.log('[ContributionsPage] Successfully fetched wallets:', fetchedWallets);
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
  }, [toast]);


  useEffect(() => {
    setIsClient(true);
    fetchUserWallets();
  }, [fetchUserWallets]);

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
    setIsLoading(true);
    const targetWallet = wallets.find(w => w.id === data.walletId);
    if (!targetWallet) {
        toast({ title: "Wallet not found", variant: "destructive" });
        setIsLoading(false);
        return;
    }
    
    // In a real app, memberId would come from auth context
    const memberId = "app-user-01"; 

    try {
        await addTransactionToWallet(data.walletId, {
            type: 'contribution',
            amount: data.amount,
            description: `Contribution by ${memberId}`,
            memberId: memberId,
        });

        toast({
            title: 'Contribution Submitted',
            description: `Your contribution of ${data.amount.toLocaleString()} ${data.tokenType} to "${targetWallet.name}" has been recorded.`,
        });
        
        // Re-fetch wallets to update balances in the dropdown
        await fetchUserWallets();

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
            <CardDescription>Contribute funds to your selected group wallet.</CardDescription>
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
                            <SelectValue placeholder="Choose a wallet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {wallets.map(wallet => (
                            <SelectItem key={wallet.id} value={wallet.id}>
                              {wallet.name} ({wallet.balance.toLocaleString()} {wallet.tokenType})
                            </SelectItem>
                          ))}
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
                
                <Button type="submit" className="w-full" disabled={isLoading || !selectedWalletId}>
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
