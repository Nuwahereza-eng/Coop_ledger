
"use client";

import { useState, useEffect, useCallback } from 'react';
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
import { Repeat, Loader2, Sparkles, ShieldCheck, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useUser } from '@/contexts/UserContext';
import { useRole } from '@/contexts/RoleContext';
import { calculateLoanLimit, type CalculateLoanLimitOutput } from '@/ai/flows/calculate-loan-limit';
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
  const { userRole } = useRole(); // Get user role
  const [isLoading, setIsLoading] = useState(false);
  const [wallets, setWallets] = useState<GroupWallet[]>([]);
  const [isFetchingWallets, setIsFetchingWallets] = useState(true);
  
  const [isCalculatingLimit, setIsCalculatingLimit] = useState(false);
  const [limitResult, setLimitResult] = useState<CalculateLoanLimitOutput | null>(null);

  const isVerified = currentUser?.verificationStatus === 'verified';

  const form = useForm<z.infer<typeof loanRequestSchema>>({
    resolver: zodResolver(loanRequestSchema.refine(
      (data) => {
        if (limitResult && data.amount > limitResult.loanLimit) {
          return false;
        }
        return true;
      },
      {
        message: "Amount cannot exceed your calculated loan limit.",
        path: ["amount"],
      }
    )),
    defaultValues: {
      walletId: '',
      amount: 0,
      termMonths: 6,
      purpose: '',
      interestRate: 0.05, // Default to 5%
    },
  });

  const selectedWalletId = form.watch('walletId');

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
  
  const handleCalculateLimit = useCallback(async () => {
    if (!currentUser) return;
    
    setIsCalculatingLimit(true);
    setLimitResult(null);
    try {
      const result = await calculateLoanLimit({ memberId: currentUser.id });
      setLimitResult(result);
      form.setValue('amount', Math.min(form.getValues('amount'), result.loanLimit));
      toast({
        title: "Loan Limit Calculated",
        description: `Your loan limit is ${result.loanLimit.toLocaleString()}.`,
      });
    } catch(error) {
      console.error("Error calculating loan limit:", error);
      toast({ title: "Could not calculate loan limit", variant: "destructive"});
    } finally {
      setIsCalculatingLimit(false);
    }
  }, [currentUser, toast, form]);


  async function onSubmit(data: z.infer<typeof loanRequestSchema>) {
    if (!currentUser || !isVerified) {
        toast({ title: "Action not allowed", description: "You must be a verified member to request a loan.", variant: "destructive"});
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
        {!isVerified && (
          <Alert variant="destructive" className="mb-6">
            <ShieldAlert className="h-4 w-4" />
            <AlertTitle>Verification Required</AlertTitle>
            <AlertDescription>
              You must be a verified member to apply for a loan. Please{' '}
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
                  <FormLabel>Request From Wallet</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value} disabled={!isVerified}>
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

            <Card className="bg-muted/50 p-4">
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
                    <div>
                        <Label className="font-semibold text-foreground">Loan Limit Check</Label>
                        <p className="text-xs text-muted-foreground">Let our AI determine your borrowing power.</p>
                    </div>
                    <Button type="button" onClick={handleCalculateLimit} disabled={isCalculatingLimit || !currentUser || !isVerified}>
                        {isCalculatingLimit ? <Loader2 className="mr-2 h-4 w-4 animate-spin"/> : <Sparkles className="mr-2 h-4 w-4" />}
                        {isCalculatingLimit ? 'Calculating...' : 'Calculate My Limit'}
                    </Button>
                </div>
                {limitResult && (
                    <Alert className="mt-4 bg-background">
                        <ShieldCheck className="h-4 w-4 text-primary" />
                        <AlertTitle className="font-bold text-primary">
                            Your Loan Limit is: {limitResult.loanLimit.toLocaleString()} {wallets.find(w => w.id === selectedWalletId)?.tokenType}
                        </AlertTitle>
                        <AlertDescription className="text-xs mt-1">{limitResult.reasoning}</AlertDescription>
                    </Alert>
                )}
            </Card>

            <FormField
              control={form.control}
              name="amount"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Loan Amount</FormLabel>
                  <FormControl>
                    <Input type="number" placeholder="Enter desired amount" {...field} disabled={!limitResult || !isVerified} />
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
                    <p className="text-xs text-muted-foreground">Interest rate is set by the admin.</p>
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
            
            <Button type="submit" className="w-full" disabled={isLoading || wallets.length === 0 || !currentUser || !limitResult || !isVerified}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting Request...</> : 'Request Loan'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
