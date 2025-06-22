
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
import { Repeat, Loader2, ShieldCheck, ShieldAlert, Vote } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { useRole } from '@/contexts/RoleContext';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const loanRequestSchema = z.object({
  walletId: z.string().min(1, { message: 'Please select a wallet.' }),
  amount: z.coerce.number().positive({ message: 'Loan amount must be positive.' }),
  termMonths: z.coerce.number().int().min(1, { message: 'Term must be at least 1 month.' }).max(36, { message: 'Term cannot exceed 36 months.' }),
  purpose: z.string().min(10, { message: 'Please describe the purpose of the loan (min 10 characters).' }).max(200, {message: 'Purpose too long (max 200 characters).'}),
  interestRate: z.coerce.number().min(0, { message: 'Interest rate cannot be negative.'}).max(1, { message: 'Interest rate cannot exceed 100% (1.0).'}),
});

export function LoanRequestForm() {
  const { toast } = useToast();
  const router = useRouter();
  const { currentUser } = useUser();
  const { userRole } = useRole();
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState<GroupWallet[]>([]);
  const [isFetchingWallets, setIsFetchingWallets] = useState(true);

  const isVerified = currentUser?.verificationStatus === 'verified';

  const form = useForm<z.infer<typeof loanRequestSchema>>({
    resolver: zodResolver(loanRequestSchema),
    defaultValues: {
      walletId: '',
      amount: 0,
      termMonths: 6,
      purpose: '',
      interestRate: 0.05, // Default to 5%
    },
  });

  useEffect(() => {
    async function fetchWallets() {
      if (!currentUser) return;
      try {
        setIsFetchingWallets(true);
        const allWallets = await getWallets();
        // Filter for wallets the user is a member of
        const memberWallets = allWallets.filter(w => w.members.some(m => m.id === currentUser.id));
        setWallets(memberWallets);
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
  }, [toast, currentUser]);

  async function onSubmit(data: z.infer<typeof loanRequestSchema>) {
    if (!currentUser || !isVerified) {
        toast({ title: "Action not allowed", description: "You must be a verified member to propose a loan.", variant: "destructive"});
        return;
    }
    setIsLoading(true);

    try {
      const newLoanId = await createLoan({
        ...data,
        memberId: currentUser.id,
      });

      const targetWallet = wallets.find(w => w.id === data.walletId);
      toast({
        title: 'Loan Proposal Submitted!',
        description: `Your loan proposal (ID: ${newLoanId.substring(0,6)}...) has been submitted to the members of "${targetWallet?.name}" for voting.`,
      });
      form.reset();
      router.push('/loans');

    } catch (error) {
      console.error("Failed to create loan proposal:", error);
      toast({
        title: "Proposal Submission Failed",
        description: "There was an error submitting your proposal.",
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
                    <Vote className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl">Submit a Loan Proposal</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex justify-center items-center h-60">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="ml-4 text-muted-foreground">Loading your wallets...</p>
                </div>
            </CardContent>
        </Card>
    );
  }

  return (
    <Card className="w-full max-w-lg mx-auto shadow-lg">
       <CardHeader className="text-center p-6">
        <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-3 mx-auto w-fit">
            <Vote className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="font-headline text-2xl text-foreground">Submit a Loan Proposal</CardTitle>
        <CardDescription>Propose a loan to your group. It will be approved by member vote.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        {!isVerified && (
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Verification Required</AlertTitle>
            <AlertDescription>
              You must be a verified member to propose a loan. Please{' '}
              <Link href="/verify" className="underline font-semibold">complete your verification</Link>.
            </AlertDescription>
          </Alert>
        )}
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="walletId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Propose to Wallet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isVerified}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a wallet you are a member of" />
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
                        <SelectItem value="none" disabled>You are not a member of any wallets.</SelectItem>
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
                    <Input type="number" placeholder="Enter desired amount" {...field} disabled={!isVerified} />
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
                    <Input type="number" placeholder="E.g., 6" {...field} disabled={!isVerified} />
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
                    <Input 
                      type="number" 
                      step="0.01" 
                      placeholder="e.g., 0.05" 
                      {...field} 
                      disabled={userRole !== 'admin' || !isVerified}
                    />
                  </FormControl>
                  {userRole !== 'admin' && (
                    <p className="text-xs text-muted-foreground">Interest rate is set by group policy (defaulted).</p>
                  )}
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
                    <Textarea placeholder="Briefly explain how you will use the funds..." {...field} rows={3} disabled={!isVerified} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading || wallets.length === 0 || !currentUser || !isVerified}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Proposal...</> : 'Submit Proposal for Voting'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
