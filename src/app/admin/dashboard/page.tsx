
"use client";

import AppLayout from '../../AppLayout';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ShieldCheck, Users, Landmark, History, Settings, ListChecks, BarChart3, Edit3 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';
import { getWallets } from '@/services/walletService';
import { getUsers } from '@/services/userService';
import { getLoans } from '@/services/loanService';
import type { GroupWallet, Loan } from '@/types';


export default function AdminDashboardPage() {
  const { userRole, isRoleInitialized } = useRole();
  const router = useRouter();

  const [numWallets, setNumWallets] = useState(0);
  const [totalPlatformBalance, setTotalPlatformBalance] = useState(0);
  const [numMembers, setNumMembers] = useState(0);
  const [numPendingLoans, setNumPendingLoans] = useState(0);
  const [numTotalTransactions, setNumTotalTransactions] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isRoleInitialized && userRole !== 'admin') {
      router.replace('/'); // Redirect non-admins
    } else if (userRole === 'admin') {
      async function fetchAdminDashboardData() {
        console.log('[AdminDashboardPage] Admin role detected, fetching all admin data.');
        setIsLoading(true);
        try {
          // Fetch all data concurrently for better performance
          const [fetchedWallets, fetchedMembers, fetchedLoans] = await Promise.all([
            getWallets(),
            getUsers(),
            getLoans(),
          ]);

          // Process Wallet Data
          setNumWallets(fetchedWallets.length);
          const totalBalance = fetchedWallets.reduce((sum, wallet) => sum + wallet.balance, 0);
          setTotalPlatformBalance(totalBalance);
          const totalTransactions = fetchedWallets.reduce((sum, wallet) => sum + (wallet.transactions?.length || 0), 0);
          setNumTotalTransactions(totalTransactions);
          
          // Process Member Data
          setNumMembers(fetchedMembers.length);

          // Process Loan Data
          const pendingLoansCount = fetchedLoans.filter(loan => loan.status === 'pending').length;
          setNumPendingLoans(pendingLoansCount);

        } catch (error) {
          console.error("[AdminDashboardPage] Error fetching data for admin dashboard:", error);
          // Optional: set an error state to show a message to the user
        } finally {
          setIsLoading(false);
          console.log('[AdminDashboardPage] Finished fetching all admin data.');
        }
      }
      fetchAdminDashboardData();
    }
  }, [userRole, isRoleInitialized, router]);

  const adminFeatures = [
    { title: 'Manage Members', description: `View, approve, and manage all ${isLoading ? '...' : numMembers} SACCO members.`, icon: Users, href: '/admin/manage-members', cta: 'Go to Members', img: 'https://placehold.co/600x400.png', hint: 'user management list', disabled: false },
    { title: 'Wallets Overview', description: `Monitor ${isLoading ? '...' : numWallets} group wallets. Total balance: ${isLoading ? '...' : totalPlatformBalance.toLocaleString()} UGX.`, icon: Landmark, href: '/admin/wallets-overview', cta: 'View Wallets', img: 'https://placehold.co/600x400.png', hint: 'financial dashboard charts', disabled: false },
    { title: 'System Logs', description: `Track all ${isLoading ? '...' : numTotalTransactions} system-level activities and important events.`, icon: History, href: '/admin/system-logs', cta: 'View Logs', img: 'https://placehold.co/600x400.png', hint: 'server logs text', disabled: false },
    { title: 'Approve Loans', description: `Review and approve/reject ${isLoading ? '...' : (numPendingLoans > 0 ? numPendingLoans + ' pending' : 'loan')} applications.`, icon: ListChecks, href: '/admin/approve-loans', cta: 'Review Loans', img: 'https://placehold.co/600x400.png', hint: 'approval checklist tasks', disabled: false },
    { title: 'Platform Analytics', description: 'View key metrics and reports on platform usage and growth.', icon: BarChart3, href: '/admin/analytics', cta: 'View Analytics', img: 'https://placehold.co/600x400.png', hint: 'data charts graphs', disabled: true },
    { title: 'System Settings', description: 'Configure global platform settings, parameters, and integrations.', icon: Settings, href: '/admin/settings', cta: 'Configure', img: 'https://placehold.co/600x400.png', hint: 'gears settings interface', disabled: true },
  ];


  if (isLoading || !isRoleInitialized || userRole !== 'admin') {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          {isRoleInitialized && userRole !== 'admin' 
              ? <p className="mt-4 text-muted-foreground">Redirecting...</p>
              : <p className="mt-4 text-muted-foreground">Loading admin dashboard...</p>
          }
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <section className="bg-card p-6 sm:p-8 rounded-lg shadow-lg">
          <div className="flex flex-col md:flex-row items-center gap-6">
            <div className="md:w-2/3 space-y-4 text-center md:text-left">
              <div className="flex items-center gap-3 justify-center md:justify-start">
                <ShieldCheck className="h-10 w-10 text-primary" />
                <h1 className="text-3xl sm:text-4xl font-bold font-headline text-primary">Admin Dashboard</h1>
              </div>
              <p className="text-md sm:text-lg text-muted-foreground">
                Welcome, Admin! Manage members, oversee financials, and configure the CoopLedger platform.
              </p>
            </div>
            <div className="md:w-1/3 mt-6 md:mt-0 flex justify-center">
              <Image 
                src="https://placehold.co/300x300.png" 
                alt="Admin illustration" 
                width={250} 
                height={250} 
                className="rounded-lg shadow-md"
                data-ai-hint="secure administration shield"
              />
            </div>
          </div>
        </section>

        <section>
          <h2 className="text-2xl sm:text-3xl font-semibold font-headline mb-6 text-center text-foreground">Admin Tools</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {adminFeatures.map((feature) => (
              <Card key={feature.title} className={`flex flex-col hover:shadow-xl transition-shadow duration-300 bg-card ${feature.disabled ? 'opacity-60 pointer-events-none' : ''}`}>
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
                  <Button asChild className="mt-auto w-full text-sm sm:text-base" disabled={feature.disabled}>
                    <Link href={feature.disabled ? '#' : feature.href}>{feature.cta}</Link>
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
