"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { mockWallets } from '@/lib/mockData';
import type { GroupWallet } from '@/types';
import { Repeat, Loader2 } from 'lucide-react';

const loanRequestSchema = z.object({
  walletId: z.string().min(1, { message: 'Please select a wallet.' }),
  amount: z.coerce.number().positive({ message: 'Loan amount must be positive.' }),
  termMonths: z.coerce.number().int().min(1, { message: 'Term must be at least 1 month.' }).max(36, { message: 'Term cannot exceed 36 months.' }),
  purpose: z.string().min(10, { message: 'Please describe the purpose of the loan (min 10 characters).' }).max(200, {message: 'Purpose too long (max 200 characters).'}),
});

type LoanRequestFormData = z.infer<typeof loanRequestSchema>;

export function LoanRequestForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const wallets: GroupWallet[] = mockWallets; 
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const form = useForm<LoanRequestFormData>({
    resolver: zodResolver(loanRequestSchema),
    defaultValues: {
      walletId: '',
      amount: 0,
      termMonths: 6,
      purpose: '',
    },
  });

  async function onSubmit(data: LoanRequestFormData) {
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    const targetWallet = wallets.find(w => w.id === data.walletId);
    console.log('Requesting loan from wallet:', data);
    toast({
      title: 'Loan Request Submitted',
      description: `Your loan request of ${data.amount} from "${targetWallet?.name}" for ${data.termMonths} months has been submitted for approval.`,
    });
    setIsLoading(false);
    form.reset();
  }

  if (!isClient) {
    return (
        <Card className="w-full max-w-lg mx-auto">
             <CardHeader className="text-center p-6">
                <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-3 mx-auto w-fit">
                    <Repeat className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl">Request a Loan</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex justify-center items-center h-60">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
       <CardHeader className="text-center p-6">
        <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-3 mx-auto w-fit">
            <Repeat className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="font-headline text-2xl text-foreground">Request a Loan</CardTitle>
        <CardDescription>Apply for a micro-loan from your group wallet.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Request From Wallet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a wallet" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {wallets.map(wallet => (
                        <SelectItem key={wallet.id} value={wallet.id}>
                          {wallet.name} (Balance: {wallet.balance.toLocaleString()} {wallet.tokenType})
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
                  <FormLabel>Loan Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter desired amount" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="termMonths"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Repayment Term (Months)</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="E.g., 6" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="purpose"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Purpose of Loan</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Briefly explain how you will use the funds..." {...field} rows={3} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Request...</> : 'Request Loan'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
