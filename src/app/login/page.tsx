
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

export default function LoginPage() {
  const { users, setCurrentUser } = useUser();
  const router = useRouter();
  const { toast } = useToast();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    // Hardcoded password for demo purposes
    const DEMO_PASSWORD = 'password123';

    const foundUser = users.find(u => u.name.toLowerCase() === username.toLowerCase());

    setTimeout(() => {
      if (foundUser && password === DEMO_PASSWORD) {
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
        toast({
          title: 'Login Failed',
          description: 'Invalid username or password. Please try again.',
          variant: 'destructive',
        });
        setIsLoading(false);
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
          <CardTitle className="text-2xl font-headline">Login</CardTitle>
          <CardDescription>Enter your credentials to access your dashboard.</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                type="text"
                placeholder="E.g., Aisha Ibrahim"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
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
               <p className="text-xs text-muted-foreground pt-1">Hint: Use any name from the mock users (e.g., 'Fatima Diallo' for admin) and the password 'password123'.</p>
            </div>
            <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : 'Login'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
