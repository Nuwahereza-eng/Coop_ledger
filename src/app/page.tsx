
"use client";

import Link from 'next/link';
import AppLayout from './AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, Repeat, History, UserCheck, Gauge, Wallet, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { mockWallets, mockContributions, mockLoans, mockTransactions } from '@/lib/mockData';

export default function DashboardPage() {
  const { userRole, isRoleInitialized } = useRole();
  const router = useRouter();

  useEffect(() => {
    if (isRoleInitialized && userRole === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [userRole, isRoleInitialized, router]);

  // Calculate dynamic data for member features
  const numGroupWallets = mockWallets.length;
  const totalContributions = mockContributions.reduce((sum, contrib) => sum + contrib.amount, 0);
  const numActiveLoans = mockLoans.filter(loan => loan.status === 'active').length;
  const numTotalTransactions = mockTransactions.length;

  const memberFeatures = [
    { title: 'Group Wallets', description: `Access and manage ${numGroupWallets} collective savings group wallets.`, icon: Landmark, href: '/wallets', cta: 'View Wallets', img: 'https://placehold.co/600x400.png', hint: 'community finance' },
    { title: 'Contributions', description: `Contribute tokens to your group. Total contributed: ${totalContributions.toLocaleString()} UGX.`, icon: Wallet, href: '/contributions', cta: 'Make Contribution', img: 'https://placehold.co/600x400.png', hint: 'digital currency' },
    { title: 'Smart Loans', description: `Access automated micro-loans. ${numActiveLoans} loans currently active.`, icon: Repeat, href: '/loans', cta: 'Apply for Loan', img: 'https://placehold.co/600x400.png', hint: 'loan agreement' },
    { title: 'Transparent Records', description: `View all ${numTotalTransactions} immutable transactions on the ledger.`, icon: History, href: '/records', cta: 'See Ledger', img: 'https://placehold.co/600x400.png', hint: 'transaction history' },
    { title: 'Member Verification', description: 'Secure your identity with mobile KYC. Complete your verification to enhance trust.', icon: UserCheck, href: '/verify', cta: 'Verify Now', img: 'https://placehold.co/600x400.png', hint: 'identity security' },
    { title: 'Credit Reputation', description: 'Check your AI-powered credit score based on your SACCO activity.', icon: Gauge, href: '/credit-score', cta: 'Get Score', img: 'https://placehold.co/600x400.png', hint: 'financial score' },
  ];


  if (!isRoleInitialized || userRole === 'admin') {
    // Show loading or null while redirecting or if role is not initialized
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
           {isRoleInitialized && userRole === 'admin' && <p className="mt-4 text-muted-foreground">Redirecting to Admin Dashboard...</p>}
        </div>
      </AppLayout>
    );
  }
  
  // Render Member Dashboard
  return (
    <AppLayout>
      <div className="space-y-8">
        <section className="bg-card p-6 sm:p-8 rounded-lg shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="md:w-2/3 space-y-4 text-center md:text-left">
              <h1 className="text-3xl sm:text-4xl font-bold font-headline text-primary">Welcome to CoopLedger</h1>
              <p className="text-md sm:text-lg text-muted-foreground">
                Your transparent and secure platform for community savings and micro-loans.
                Empowering rural youth and women with blockchain technology.
              </p>
              <Button size="lg" asChild className="mt-4">
                <Link href="/wallets">Get Started <ArrowRight className="ml-2 h-5 w-5" /></Link>
              </Button>
            </div>
            <div className="md:w-1/3 mt-6 md:mt-0 flex justify-center">
              <Image 
                src="https://placehold.co/300x300.png" 
                alt="CoopLedger illustration" 
                width={250} 
                height={250} 
                className="rounded-lg shadow-md"
                data-ai-hint="community finance technology" 
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-semibold font-headline mb-6 text-center text-foreground">Key Features</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {memberFeatures.map((feature) => (
              <Card key={feature.title} className="flex flex-col hover:shadow-xl transition-shadow duration-300 bg-card">
                <CardHeader className="items-center text-center pt-6">
                   <div className="p-3 bg-primary/10 rounded-full mb-3">
                     <feature.icon className="h-8 w-8 sm:h-10 sm:w-10 text-primary" />
                   </div>
                  <CardTitle className="font-headline text-xl sm:text-2xl text-foreground">{feature.title}</CardTitle>
                  <CardDescription className="text-sm sm:text-base min-h-[3rem]">{feature.description}</CardDescription> {/* Removed fixed h-12, added min-h */}
                </CardHeader>
                <CardContent className="flex-grow flex flex-col items-center text-center p-4 sm:p-6">
                   <div className="w-full aspect-video mb-4 rounded-md overflow-hidden">
                    <Image 
                        src={feature.img} 
                        alt={feature.title} 
                        width={600} 
                        height={400} 
                        className="w-full h-full object-cover" 
                        data-ai-hint={feature.hint}
                      />
                   </div>
                  <Button asChild className="mt-auto w-full text-sm sm:text-base">
                    <Link href={feature.href}>{feature.cta}</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </div>
    </AppLayout>
  );
}
