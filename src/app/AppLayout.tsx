
"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Header } from '@/components/layout/Header';
import { SidebarNavItems } from '@/components/layout/SidebarNavItems';
import { memberNavItems } from '@/config/memberNav';
import { adminNavItems } from '@/config/adminNav';
import { Button } from '@/components/ui/button';
import { LogOut, Loader2, Wallet } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext'; 
import { useUser } from '@/contexts/UserContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { userRole } = useRole();
  const { currentUser, isUserInitialized, setCurrentUser } = useUser();

  useEffect(() => {
    // Auth guard: Wait for initialization, then redirect if not logged in.
    if (isUserInitialized && !currentUser) {
      router.push('/login');
    }
  }, [isUserInitialized, currentUser, router]);

  const handleLogout = () => {
    setCurrentUser(null);
    // Let the useEffect handle the redirect to ensure context is updated first
  };

  const currentNavItems = userRole === 'admin' ? adminNavItems : memberNavItems;
  
  // The loading state should show if the user context is not yet initialized.
  // Once it is initialized, the useEffect above will handle the redirect if needed.
  if (!isUserInitialized || !currentUser) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-background">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="mt-4 text-muted-foreground">Initializing...</p>
      </div>
    );
  }

  return (
    <SidebarProvider defaultOpen={true}>
      <div className="flex min-h-screen flex-col bg-background">
        <Header navItems={currentNavItems} />
        <div className="flex flex-1">
          <Sidebar collapsible="icon" variant="sidebar" className="border-r hidden md:flex bg-sidebar text-sidebar-foreground">
            <SidebarContent className="p-2 flex-grow">
              <SidebarNavItems items={currentNavItems} />
            </SidebarContent>
            <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
              <div className="text-center text-xs p-2 text-sidebar-foreground/70 group-data-[collapsible=icon]:hidden">
                <p>Logged in as:</p>
                <p className="font-bold">{currentUser.name}</p>
                <p>({currentUser.role})</p>
                <div className="flex items-center justify-center gap-1 mt-1 font-mono text-primary">
                  <Wallet className="h-3 w-3" />
                  <span>{currentUser.personalWalletBalance.toLocaleString()}</span>
                </div>
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={handleLogout}
              >
                <LogOut className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">
                  Logout
                </span>
              </Button>
            </SidebarFooter>
          </Sidebar>
          <main className="flex-1 bg-background overflow-y-auto">
             <div className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
