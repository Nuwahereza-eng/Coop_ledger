"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { Landmark, Loader2 } from 'lucide-react';

const createWalletSchema = z.object({
  groupName: z.string().min(3, { message: 'Group name must be at least 3 characters.' }).max(50, {message: "Group name too long."}),
  tokenType: z.string().min(1, { message: 'Please select a token type.' }),
});

type CreateWalletFormData = z.infer<typeof createWalletSchema>;

export function CreateWalletForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const form = useForm<CreateWalletFormData>({
    resolver: zodResolver(createWalletSchema),
    defaultValues: {
      groupName: '',
      tokenType: '',
    },
  });

  async function onSubmit(data: CreateWalletFormData) {
    setIsLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    console.log('Creating wallet:', data);
    toast({
      title: 'Wallet Creation Initiated',
      description: `Group wallet "${data.groupName}" is being created with ${data.tokenType}.`,
    });
    setIsLoading(false);
    form.reset();
    // Potentially redirect or update UI state here
  }

  if (!isClient) {
    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center p-6">
                 <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-3 mx-auto w-fit">
                    <Landmark className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl">Create New Group Wallet</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                <div className="flex justify-center items-center h-40">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </CardContent>
        </Card>
    );
  }


  return (
    <Card className="w-full max-w-lg mx-auto">
      <CardHeader className="text-center p-6">
        <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-3 mx-auto w-fit">
            <Landmark className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="font-headline text-2xl">Create New Group Wallet</CardTitle>
        <CardDescription>Set up a new shared wallet for your group's savings.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="groupName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Group Name</FormLabel>
                  <FormControl>
                    <Input placeholder="E.g., Village Savings Group" {...field} />
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
                  <FormLabel>Token Type for Contributions</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a stablecoin or token" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="USDC">USDC (USD Coin)</SelectItem>
                      <SelectItem value="DAI">DAI (Dai Stablecoin)</SelectItem>
                      <SelectItem value="AppToken">AppToken (Native Token)</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Creating Wallet...</> : 'Create Wallet'}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
