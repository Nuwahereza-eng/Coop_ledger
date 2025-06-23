'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/contexts/UserContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Landmark, Loader2, Eye, EyeOff } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
  const { users, setCurrentUser } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [phoneNumber, setPhoneNumber] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
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

    const foundUser = users.find(u => u.phoneNumber === phoneNumber);

    setTimeout(() => {
      if (!foundUser) {
        toast({
          title: 'Login Failed',
          description: 'No account found with this phone number. Please sign up.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

      if (password !== DEMO_PASSWORD) {
        toast({
          title: 'Login Failed',
          description: 'Invalid password. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
        return;
      }

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
    }, 1000);
  };

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background p-4">
       <div className="absolute top-8 flex items-center gap-2 text-lg font-semibold font-headline">
          <Landmark className="h-7 w-7 text-primary" />
          <span className="text-primary">Coop</span><span className="text-foreground">Ledger</span>
       </div>
      <Card className="w-full max-w-sm shadow-2xl">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-headline">Welcome Back</CardTitle>
          <CardDescription>Enter your phone number and password to log in.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
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
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Log In'}
            </Button>
          </form>
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link href="/signup" className="underline font-medium text-primary">
              Sign up
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
