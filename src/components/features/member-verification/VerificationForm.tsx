"use client";

import { useState, useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useToast } from '@/hooks/use-toast';
import { UserCheck, ShieldCheck, Info, Loader2 } from 'lucide-react';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

const verificationSchema = z.object({
  fullName: z.string().min(3, { message: 'Full name must be at least 3 characters.' }).max(100, {message: "Name too long."}),
  nationalId: z.string().min(5, { message: 'National ID must be valid.' }).max(30, {message: "ID too long."}),
  phoneNumber: z.string().regex(/^\+?[1-9]\d{1,14}$/, { message: 'Enter a valid phone number (e.g., +1234567890).' }),
});

type VerificationFormData = z.infer<typeof verificationSchema>;

async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  return hashHex;
}

export function VerificationForm() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [hashedPii, setHashedPii] = useState<string | null>(null);
  const [verificationStatus, setVerificationStatus] = useState<'idle' | 'pending' | 'verified' | 'error'>('idle');
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);


  const form = useForm<VerificationFormData>({
    resolver: zodResolver(verificationSchema),
    defaultValues: {
      fullName: '',
      nationalId: '',
      phoneNumber: '',
    },
  });

  async function onSubmit(data: VerificationFormData) {
    setIsLoading(true);
    setHashedPii(null);
    setVerificationStatus('pending');

    try {
      const piiString = `${data.fullName.trim().toLowerCase()}|${data.nationalId.trim()}|${data.phoneNumber.trim()}`;
      const hash = await sha256(piiString);
      setHashedPii(hash);

      console.log('Submitting PII hash for verification:', hash);
      await new Promise(resolve => setTimeout(resolve, 2000));

      setVerificationStatus('verified');
      toast({
        title: 'Verification Submitted',
        description: 'Your information has been securely submitted for verification.',
      });
    } catch (error) {
      console.error("Hashing or submission error:", error);
      setVerificationStatus('error');
      toast({
        title: 'Verification Failed',
        description: 'Could not process your verification request. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  }
  
  if (!isClient) {
    return (
        <Card className="w-full max-w-lg mx-auto">
            <CardHeader className="text-center p-6">
                <div className="inline-flex justify-center items-center p-3 bg-primary/10 rounded-full mb-3 mx-auto w-fit">
                    <UserCheck className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="font-headline text-2xl">Member Verification (KYC)</CardTitle>
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
            <UserCheck className="h-10 w-10 text-primary" />
        </div>
        <CardTitle className="font-headline text-2xl text-foreground">Member Verification (KYC)</CardTitle>
        <CardDescription>Securely verify your identity. Your personal information is processed locally.</CardDescription>
      </CardHeader>
      <CardContent className="p-6">
        <Alert className="mb-6 bg-accent/20 border-accent text-accent-foreground">
          <ShieldCheck className="h-5 w-5 text-primary" />
          <AlertTitle className="font-semibold text-foreground/90">Privacy First</AlertTitle>
          <AlertDescription className="text-sm">
            Your personal details are hashed on your device. We only store a secure, one-way hash of your information.
          </AlertDescription>
        </Alert>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name (as on ID)</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="nationalId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>National ID Number</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your National ID" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="phoneNumber"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Phone Number</FormLabel>
                  <FormControl>
                    <Input type="tel" placeholder="+254700123456" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <Button type="submit" className="w-full" disabled={isLoading || verificationStatus === 'verified'}>
              {isLoading && <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Processing...</>}
              {!isLoading && verificationStatus === 'verified' && 'Identity Verified'}
              {!isLoading && verificationStatus !== 'verified' && 'Verify Identity'}
            </Button>
          </form>
        </Form>
      </CardContent>
      {(hashedPii || verificationStatus !== 'idle') && (
        <CardFooter className="flex-col items-start space-y-2 pt-4 p-6 border-t">
          {verificationStatus === 'pending' && <p className="text-sm text-muted-foreground">Generating secure hash and submitting...</p>}
          {hashedPii && (
            <>
              <p className="text-sm font-medium text-foreground">Generated PII Hash (for demo):</p>
              <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto w-full text-muted-foreground">{hashedPii}</pre>
            </>
          )}
          {verificationStatus === 'verified' && <p className="text-sm text-green-600 font-semibold">Verification request sent successfully!</p>}
          {verificationStatus === 'error' && <p className="text-sm text-red-600 font-semibold">An error occurred during verification.</p>}
        </CardFooter>
      )}
    </Card>
  );
}
