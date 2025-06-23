'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import Image from 'next/image';
import type { Member } from '@/types';
import Link from 'next/link';

export default function SignupPage() {
  const { users, addUser, setCurrentUser } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSignUp = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const DEMO_PASSWORD = 'password2025';

    if (!/^\+256\d{9}$/.test(phoneNumber)) {
        toast({
            title: 'Invalid Phone Number',
            description: 'Please enter a valid Ugandan phone number, e.g., +256772123456.',
            variant: 'destructive',
        });
        setIsLoading(false);
        return;
    }
    
    if (firstName.trim().length < 2 || lastName.trim().length < 2) {
        toast({
            title: 'Invalid Name',
            description: 'First and last names must be at least 2 characters long.',
            variant: 'destructive',
        });
        setIsLoading(false);
        return;
    }

    const foundUser = users.find(u => u.phoneNumber === phoneNumber);
    
    setTimeout(() => {
        if (foundUser) {
            toast({
                title: 'Account Exists',
                description: 'This phone number is already registered. Please log in.',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }

        if (password !== DEMO_PASSWORD) {
            toast({
                title: 'Invalid Password',
                description: 'For this demo, please use the password "password2025".',
                variant: 'destructive',
            });
            setIsLoading(false);
            return;
        }

        const newUserName = `${firstName.trim()} ${lastName.trim()}`;
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
    }, 1000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-8 flex items-center gap-2 text-lg font-semibold font-headline">
          <Image src="/icon.svg" alt="CoopLedger Logo" width={28} height={28} />
          <span className="text-primary">Coop</span><span className="text-foreground">Ledger</span>
       </div>
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Create an Account</CardTitle>
          <CardDescription>Join CoopLedger to start saving and borrowing with your community.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignUp} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                <Input
                    id="firstName"
                    type="text"
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    required
                />
                </div>
                <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                <Input
                    id="lastName"
                    type="text"
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    required
                />
                </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNumber">Phone Number</Label>
              <Input
                id="phoneNumber"
                type="tel"
                placeholder="+256 772 123 456"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 flex items-center justify-center h-full px-3 text-muted-foreground hover:text-foreground"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Sign Up'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link href="/login" className="underline font-medium text-primary">
              Log in
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
