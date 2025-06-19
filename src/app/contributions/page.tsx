"use client";

import { useState, useEffect } from 'react';
import AppLayout from '../AppLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { mockWallets } from '@/lib/mockData';
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
  const wallets: GroupWallet[] = mockWallets; 
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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
    await new Promise(resolve => setTimeout(resolve, 1500));
    const targetWallet = wallets.find(w => w.id === data.walletId);
    console.log(`Contributing to wallet ${data.walletId}:`, data);
    toast({
      title: 'Contribution Submitted',
      description: `Your contribution of ${data.amount} ${data.tokenType} to "${targetWallet?.name}" has been submitted.`,
    });
    setIsLoading(false);
    form.reset({ walletId: '', amount: 0, tokenType: '' });
  }
  
  if (!isClient) {
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
                              {wallet.name} ({wallet.tokenType})
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
                      <FormLabel>Amount</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="Enter amount" 
                          {...field} 
                          disabled={!selectedWalletId} 
                          // value={field.value === 0 ? '' : field.value} // Keep if 0 needs to be empty
                          // onChange={(e) => field.onChange(e.target.value === '' ? 0 : parseFloat(e.target.value))}
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
                    <FormItem>
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
