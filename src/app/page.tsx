
"use client";

import Link from 'next/link';
import AppLayout from './AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Landmark, Repeat, History, UserCheck, Gauge, Wallet, ArrowRight, Loader2 } from 'lucide-react';
import Image from 'next/image';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { mockLoans, mockTransactions } from '@/lib/mockData';
import { getWallets } from '@/services/walletService';
import { getPersonalTransactions } from '@/services/personalLedgerService';
import { useUser } from '@/contexts/UserContext';
import type { GroupWallet } from '@/types';

export default function DashboardPage() {
  const { userRole, isRoleInitialized } = useRole();
  const { currentUser } = useUser();
  const router = useRouter();

  const [numGroupWallets, setNumGroupWallets] = useState(0);
  const [totalContributions, setTotalContributions] = useState(0);
  const [isDataLoading, setIsDataLoading] = useState(true);

  useEffect(() => {
    if (isRoleInitialized && userRole === 'admin') {
      router.replace('/admin/dashboard');
    }
  }, [userRole, isRoleInitialized, router]);

  useEffect(() => {
    if (userRole === 'member' && isRoleInitialized && currentUser) {
      async function fetchDashboardData() {
        console.log('[DashboardPage] Member role detected, fetching data for dashboard.');
        setIsDataLoading(true);
        try {
          const [fetchedWallets, personalTxs] = await Promise.all([
            getWallets(),
            getPersonalTransactions()
          ]);
          
          // --- Group Wallets Data ---
          const memberWallets = fetchedWallets.filter(wallet =>
            wallet.members.some(member => member.id === currentUser.id)
          );
          setNumGroupWallets(memberWallets.length);

          // --- Contributions Data ---
          const allGroupTxs = fetchedWallets.flatMap(w => w.transactions || []);
          const allTxs = [...allGroupTxs, ...personalTxs];
          
          const userContributions = allTxs
            .filter(tx => tx.memberId === currentUser.id && (tx.type === 'contribution' || tx.type === 'personal_deposit'))
            .reduce((sum, tx) => sum + tx.amount, 0);
            
          setTotalContributions(userContributions);

        } catch (error) {
          console.error("[DashboardPage] Error fetching data for dashboard:", error);
        } finally {
          setIsDataLoading(false);
          console.log('[DashboardPage] Finished fetching data for dashboard.');
        }
      }
      fetchDashboardData();
    } else if (!isRoleInitialized || userRole !== 'member' || !currentUser) {
        setIsDataLoading(false);
    }
  }, [userRole, isRoleInitialized, currentUser]);


  const numActiveLoans = mockLoans.filter(loan => loan.status === 'active').length;
  const numTotalTransactions = mockTransactions.length;

  const memberFeatures = [
    { title: 'Group Wallets', description: `Access and manage ${isDataLoading ? '...' : numGroupWallets} collective savings group wallets.`, icon: Landmark, href: '/wallets', cta: 'View Wallets', img: 'https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', hint: 'community finance' },
    { title: 'Contributions', description: `Your total contributions stand at ${isDataLoading ? '...' : totalContributions.toLocaleString()} UGX.`, icon: Wallet, href: '/contributions', cta: 'Make Contribution', img: 'https://images.unsplash.com/photo-1637597384601-61e937e8bc15?q=80&w=1074&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', hint: 'digital currency' },
    { title: 'Smart Loans', description: `Access automated micro-loans. ${numActiveLoans} loans currently active.`, icon: Repeat, href: '/loans', cta: 'Apply for Loan', img: 'https://plus.unsplash.com/premium_photo-1677265809324-4cc68b8cc4e7?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', hint: 'loan agreement' },
    { title: 'Transparent Records', description: `View all ${numTotalTransactions} immutable transactions on the ledger.`, icon: History, href: '/records', cta: 'See Ledger', img: 'https://plus.unsplash.com/premium_photo-1682125773446-259ce64f9dd7?q=80&w=2071&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', hint: 'transaction history' },
    { title: 'Member Verification', description: 'Secure your identity with mobile KYC. Complete your verification to enhance trust.', icon: UserCheck, href: '/verify', cta: 'Verify Now', img: 'https://plus.unsplash.com/premium_photo-1677093906217-9420a5f16322?q=80&w=1332&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', hint: 'identity security' },
    { title: 'Credit Reputation', description: 'Check your AI-powered credit score based on your SACCO activity.', icon: Gauge, href: '/credit-score', cta: 'Get Score', img: 'https://plus.unsplash.com/premium_photo-1676837121480-ff39800ebfc7?q=80&w=735&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D', hint: 'financial score' },
  ];


  if (!isRoleInitialized || userRole === 'admin' || isDataLoading) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
           {isRoleInitialized && userRole === 'admin' && <p className="mt-4 text-muted-foreground">Redirecting to Admin Dashboard...</p>}
           {isRoleInitialized && userRole === 'member' && isDataLoading && <p className="mt-4 text-muted-foreground">Loading dashboard data...</p>}
           {!isRoleInitialized && <p className="mt-4 text-muted-foreground">Initializing app...</p>}
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
                src="https://images.unsplash.com/photo-1652020503800-0ed3e0021746?q=80&w=1240&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" 
                alt="CoopLedger illustration" 
                width={250} 
                height={250} 
                className="rounded-lg shadow-md"
                data-ai-hint="community technology" 
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
                  <CardDescription className="text-sm sm:text-base min-h-[3rem]">{feature.description}</CardDescription>
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
