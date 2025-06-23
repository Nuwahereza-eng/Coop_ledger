
"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { generateCreditScore, type GenerateCreditScoreOutput } from '@/ai/flows/generate-credit-score';
import { Gauge, Bot, ThumbsUp, ThumbsDown, Sparkles, Loader2, Info } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useUser } from '@/contexts/UserContext';


export function CreditScoreGenerator() {
  const { toast } = useToast();
  const { currentUser } = useUser();
  const [isLoading, setIsLoading] = useState(false);
  const [creditScoreResult, setCreditScoreResult] = useState<GenerateCreditScoreOutput | null>(null);

  async function handleGenerateScore() {
    if (!currentUser) {
      toast({
        title: 'Not Logged In',
        description: 'You must be logged in to generate a credit score.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsLoading(true);
    setCreditScoreResult(null);
    
    try {
      const result = await generateCreditScore({ memberId: currentUser.id });
      setCreditScoreResult(result);
      toast({
        title: 'Credit Score Generated!',
        description: `We've successfully analyzed your history.`,
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

  return (
    <div className="w-full max-w-2xl mx-auto space-y-8">
      <Card className="shadow-lg">
        <CardHeader className="text-center p-6">
            <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-3 mx-auto w-fit">
                <Gauge className="h-10 w-10 text-primary" />
            </div>
          <CardTitle className="font-headline text-2xl text-foreground">AI-Powered Credit Score</CardTitle>
          <CardDescription>Automatically generate your credit reputation score based on your activity.</CardDescription>
        </CardHeader>
        <CardContent className="p-6 text-center">
            <Alert className="mb-6 text-left">
                <Info className="h-4 w-4" />
                <AlertTitle>How It Works</AlertTitle>
                <AlertDescription>
                Our AI analyzes your entire transaction history on the platform—including all contributions, deposits, and loan repayments—to generate a fair and dynamic credit score.
                </AlertDescription>
            </Alert>
            <Button onClick={handleGenerateScore} className="w-full" disabled={isLoading || !currentUser}>
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing Your History...
                  </>
                ) : (
                  <>
                    <Sparkles className="mr-2 h-4 w-4" />
                    Generate My Credit Score
                  </>
                )}
              </Button>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="text-center p-6 shadow-md">
          <Loader2 className="h-12 w-12 text-primary animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-primary">Our AI is analyzing the data...</p>
          <p className="text-muted-foreground text-sm">This might take a moment.</p>
        </Card>
      )}

      {creditScoreResult && !isLoading && (
        <Card className="animate-in fade-in-50 slide-in-from-bottom-10 duration-500 shadow-xl">
          <CardHeader className="p-6">
            <CardTitle className="font-headline text-xl flex items-center gap-2 text-foreground">
              <Bot className="h-6 w-6 text-primary" /> Your Credit Score Result
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
              This credit score is AI-generated based on your platform activity and should be used as one of many factors in decision-making.
            </p>
          </CardFooter>
        </Card>
      )}
    </div>
  );
}
