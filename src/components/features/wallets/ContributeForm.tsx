
"use client";

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import type { GroupWallet } from '@/types';
import { Loader2 } from 'lucide-react';
import { addTransactionToWallet } from '@/services/walletService';

const contributeSchema = z.object({
  amount: z.coerce.number().positive({ message: 'Amount must be positive.' }),
  tokenType: z.string().min(1, {message: "Token type is required"}),
});

type ContributeFormData = z.infer<typeof contributeSchema>;

interface ContributeFormProps {
  wallet: GroupWallet;
  onSuccess: () => void;
}

export function ContributeForm({ wallet, onSuccess }: ContributeFormProps) {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<ContributeFormData>({
    resolver: zodResolver(contributeSchema),
    defaultValues: {
      amount: 0,
      tokenType: wallet.tokenType, 
    },
  });

  async function onSubmit(data: ContributeFormData) {
    setIsLoading(true);
    // In a real app, memberId would come from an auth context.
    const memberId = "app-user-01"; 

    try {
      await addTransactionToWallet(wallet.id, {
        type: 'contribution',
        amount: data.amount,
        description: `Contribution by ${memberId} to ${wallet.name}`,
        memberId: memberId,
      });

      toast({
        title: 'Contribution Submitted',
        description: `Your contribution of ${data.amount} ${data.tokenType} to "${wallet.name}" has been submitted.`,
      });

      form.reset({amount: 0, tokenType: wallet.tokenType});
      onSuccess(); // Trigger re-fetch in parent component

    } catch (error) {
      console.error("Failed to add contribution transaction:", error);
      toast({
        title: "Contribution Failed",
        description: "There was an error submitting your contribution. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="amount"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Amount ({wallet.tokenType})</FormLabel>
              <FormControl>
                <Input type="number" placeholder="Enter amount" {...field} />
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
              <FormLabel>Confirm Token Type</FormLabel>
              <Select onValueChange={field.onChange} value={field.value} disabled>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Token type" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value={wallet.tokenType}>{wallet.tokenType}</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Submitting...</> : 'Contribute'}
        </Button>
      </form>
    </Form>
  );
}
