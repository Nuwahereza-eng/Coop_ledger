
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
import { getWallets } from '@/services/walletService';
import { createLoan } from '@/services/loanService';
import type { GroupWallet } from '@/types';
import { Repeat, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';


const loanRequestSchema = z.object({
  walletId: z.string().min(1, { message: 'Please select a wallet.' }),
  amount: z.coerce.number().positive({ message: 'Loan amount must be positive.' }),
  termMonths: z.coerce.number().int().min(1, { message: 'Term must be at least 1 month.' }).max(36, { message: 'Term cannot exceed 36 months.' }),
  purpose: z.string().min(10, { message: 'Please describe the purpose of the loan (min 10 characters).' }).max(200, {message: 'Purpose too long (max 200 characters).'}),
  interestRate: z.coerce.number().min(0, { message: 'Interest rate cannot be negative.'}).max(1, { message: 'Interest rate cannot exceed 100% (1.0).'}),
});

type LoanRequestFormData = z.infer<typeof loanRequestSchema>;

export function LoanRequestForm() {
  const { toast } = useToast();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState<GroupWallet[]>([]);
  const [isFetchingWallets, setIsFetchingWallets] = useState(true);

  useEffect(() => {
    async function fetchWallets() {
      try {
        setIsFetchingWallets(true);
        const fetchedWallets = await getWallets();
        setWallets(fetchedWallets);
      } catch (error) {
        toast({
          title: "Error fetching wallets",
          description: "Could not load group wallets for selection.",
          variant: "destructive",
        });
      } finally {
        setIsFetchingWallets(false);
      }
    }
    fetchWallets();
  }, [toast]);


  const form = useForm<LoanRequestFormData>({
    resolver: zodResolver(loanRequestSchema),
    defaultValues: {
      walletId: '',
      amount: 0,
      termMonths: 6,
      purpose: '',
      interestRate: 0.05, // Default to 5%
    },
  });

  async function onSubmit(data: LoanRequestFormData) {
    setIsLoading(true);
    // In a real app, memberId would come from an auth context.
    const memberId = "app-user-01"; 

    try {
      const newLoanId = await createLoan({
        ...data,
        memberId: memberId,
      });

      const targetWallet = wallets.find(w => w.id === data.walletId);
      toast({
        title: 'Loan Request Submitted',
        description: `Your loan request (ID: ${newLoanId.substring(0,6)}...) from "${targetWallet?.name}" has been submitted for approval.`,
      });
      form.reset();
      router.push('/loans');

    } catch (error) {
      console.error("Failed to create loan request:", error);
      toast({
        title: "Loan Request Failed",
        description: "There was an error submitting your request.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  }

  if (isFetchingWallets) {
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
                    <p className="ml-4 text-muted-foreground">Loading wallets...</p>
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
                      {wallets.length > 0 ? (
                        wallets.map(wallet => (
                          <SelectItem key={wallet.id} value={wallet.id}>
                            {wallet.name} (Balance: {wallet.balance.toLocaleString()} {wallet.tokenType})
                          </SelectItem>
                        ))
                      ) : (
                        <SelectItem value="none" disabled>No wallets found. Create a wallet first.</SelectItem>
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
              name="interestRate"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Interest Rate (e.g., 0.05 for 5%)</FormLabel>
                  <FormControl>
                    <Input type="number" step="0.01" placeholder="e.g., 0.05" {...field} />
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
            
            <Button type="submit" className="w-full" disabled={isLoading || wallets.length === 0}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Request...</> : 'Request Loan'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
