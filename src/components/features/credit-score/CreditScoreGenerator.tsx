"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { generateCreditScore, type GenerateCreditScoreOutput } from '@/ai/flows/generate-credit-score';
import { Gauge, Bot, ThumbsUp, ThumbsDown, Sparkles, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const creditScoreSchema = z.object({
  memberId: z.string().min(1, { message: 'Member ID is required.' }).max(50, {message: "ID too long."}),
  contributionHistory: z.string().min(10, { message: 'Contribution history must be at least 10 characters.' }).max(1000, {message: "History too long."}),
  repaymentHistory: z.string().min(10, { message: 'Repayment history must be at least 10 characters.' }).max(1000, {message: "History too long."}),
});

type CreditScoreFormData = z.infer<typeof creditScoreSchema>;

export function CreditScoreGenerator() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [creditScoreResult, setCreditScoreResult] = useState<GenerateCreditScoreOutput | null>(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const form = useForm<CreditScoreFormData>({
    resolver: zodResolver(creditScoreSchema),
    defaultValues: {
      memberId: '',
      contributionHistory: '',
      repaymentHistory: '',
    },
  });

  async function onSubmit(data: CreditScoreFormData) {
    setIsLoading(true);
    setCreditScoreResult(null);
    try {
      const result = await generateCreditScore(data);
      setCreditScoreResult(result);
      toast({
        title: 'Credit Score Generated',
        description: `Successfully generated credit score for member ${data.memberId}.`,
      });
    } catch (error) {
      console.error('Error generating credit score:', error);
      toast({
        title: 'Error Generating Score',
        description: (error instanceof Error ? error.message : null) || 'An unexpected error occurred. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-500';
    if (score >= 60) return 'text-yellow-500';
    if (score >= 40) return 'text-orange-500';
    return 'text-red-500';
  };
  
  const getScoreIcon = (score: number) => {
    if (score >= 70) return <ThumbsUp className="w-full h-full" />;
    return <ThumbsDown className="w-full h-full" />;
  };

  if (!isClient) {
    return (
        <Card className="w-full max-w-2xl mx-auto">
            <CardHeader className="text-center p-6">
                 <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-3 mx-auto w-fit">
                    <Gauge className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl">AI-Powered Credit Score</CardTitle>
            </CardHeader>
            <CardContent className="p-6">
                 <div className="flex justify-center items-center h-80">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
            </CardContent>
        </Card>
    );
  }


  return (
    <div className="space-y-8">
      <Card className="w-full max-w-2xl mx-auto shadow-lg">
        <CardHeader className="text-center p-6">
            <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-3 mx-auto w-fit">
                <Gauge className="h-10 w-10 text-primary" />
            </div>
          <CardTitle className="font-headline text-2xl text-foreground">AI-Powered Credit Score</CardTitle>
          <CardDescription>Enter member's financial history to generate a credit reputation score.</CardDescription>
        </CardHeader>
        <CardContent className="p-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="memberId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Member ID</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter member's unique ID" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="contributionHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Contribution History</FormLabel>
                    <FormControl>
                      <Textarea placeholder="E.g., Consistent monthly contributions of $50 for 2 years. One late contribution by 3 days." {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="repaymentHistory"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Repayment History</FormLabel>
                    <FormControl>
                      <Textarea placeholder="E.g., Took a loan of $200, repaid on time over 6 months. No defaults." {...field} rows={4} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Generating Score...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate Credit Score
                  </>
                )}
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="w-full max-w-2xl mx-auto text-center p-6 shadow-md">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-primary">Our AI is analyzing the data...</p>
          <p className="text-muted-foreground text-sm">This might take a moment.</p>
        </Card>
      )}

      {creditScoreResult && !isLoading && (
        <Card className="w-full max-w-2xl mx-auto animate-in fade-in-50 slide-in-from-bottom-10 duration-500 shadow-xl">
          <CardHeader className="p-6">
            <CardTitle className="font-headline text-xl flex items-center gap-2 text-foreground">
              <Bot className="h-6 w-6 text-primary" /> Credit Score Result for Member {form.getValues('memberId')}
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center p-6">
            <div className="md:col-span-1 flex flex-col items-center justify-center p-6 rounded-lg bg-gradient-to-br from-primary/10 to-accent/10 border h-full">
              <div className={`w-20 h-20 sm:w-24 sm:h-24 mb-2 ${getScoreColor(creditScoreResult.creditScore)}`}>
                  {getScoreIcon(creditScoreResult.creditScore)}
              </div>
              <p className="text-4xl sm:text-5xl font-bold" style={{ color: getScoreColor(creditScoreResult.creditScore) }}>
                {creditScoreResult.creditScore}
              </p>
              <p className="text-xs sm:text-sm text-muted-foreground">out of 100</p>
            </div>
            <div className="md:col-span-2">
              <Alert className="bg-card border-border">
                <Sparkles className="h-4 w-4 text-primary" />
                <AlertTitle className="font-semibold text-foreground/90">AI Reasoning:</AlertTitle>
                <AlertDescription className="text-sm leading-relaxed text-muted-foreground">
                  {creditScoreResult.reasoning}
                </AlertDescription>
              </Alert>
            </div>
          </CardContent>
          <CardFooter className="p-6">
            <p className="text-xs text-muted-foreground">
              This credit score is AI-generated based on the provided data and should be used as one of many factors in decision-making.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
