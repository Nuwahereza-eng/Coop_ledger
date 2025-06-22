
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Landmark, Loader2 } from 'lucide-react';
import type { Member } from '@/types';

export default function LoginPage() {
  const { users, setCurrentUser, addUser } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Hardcoded password for demo purposes
    const DEMO_PASSWORD = 'password123';

    // Basic validation for phone number format
    if (!/^\+256\d{9}$/.test(phoneNumber)) {
        toast({
            title: 'Invalid Phone Number',
            description: 'Please enter a valid Ugandan phone number, e.g., +256772123456.',
            variant: 'destructive',
        });
        setIsLoading(false);
        return;
    }

    const foundUser = users.find(u => u.phoneNumber === phoneNumber);

    setTimeout(() => {
      if (password !== DEMO_PASSWORD) {
        toast({
          title: 'Login Failed',
          description: 'Invalid password. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (foundUser) {
        // User exists, log them in
        setCurrentUser(foundUser);
        toast({
          title: `Welcome back, ${foundUser.name}!`,
          description: `You are logged in as a ${foundUser.role}.`,
        });
        if (foundUser.role === 'admin') {
          router.push('/admin/dashboard');
        } else {
          router.push('/');
        }
      } else {
        // User does not exist, create a new account
        const newUserName = `User ${phoneNumber.slice(-4)}`;
        const newUser: Member = {
            id: `user-${new Date().getTime()}`,
            name: newUserName,
            phoneNumber: phoneNumber,
            role: 'member',
            verificationStatus: 'unverified',
            personalWalletBalance: 0,
            creditScore: 0,
        };
        
        addUser(newUser);
        setCurrentUser(newUser);

        toast({
          title: 'Account Created!',
          description: `Welcome, ${newUserName}! Your new account is ready.`,
        });
        router.push('/');
      }
    }, 1000); // Simulate network delay
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-8 flex items-center gap-2 text-lg font-semibold font-headline">
          <Landmark className="h-7 w-7 text-primary" />
          <span className="text-primary">Coop</span><span className="text-foreground">Ledger</span>
       </div>
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Login or Sign Up</CardTitle>
          <CardDescription>Enter your phone number and password to continue.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+256772123456"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
               <p className="text-xs text-muted-foreground pt-1">Hint: Use a valid number (e.g., +256772333333 for admin) and 'password123'. New numbers create new accounts.</p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Continue'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
