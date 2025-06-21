
"use client";

import React from 'react';
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
import { LogOut, UserCog, User, Sun, Moon, Loader2, Users } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext'; 
import { useUser } from '@/contexts/UserContext';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { userRole, isRoleInitialized: isRoleInitialized } = useRole();
  const { currentUser, users, setCurrentUser, isUserInitialized: isUserInitialized } = useUser();

  const currentNavItems = userRole === 'admin' ? adminNavItems : memberNavItems;

  const cycleUser = () => {
    if (!currentUser) return;
    const currentIndex = users.findIndex(u => u.id === currentUser.id);
    const nextIndex = (currentIndex + 1) % users.length;
    setCurrentUser(users[nextIndex]);
  };
  
  const isInitialized = isRoleInitialized && isUserInitialized;

  if (!isInitialized || !currentUser) {
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
              </div>
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={cycleUser}
              >
                <Users className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">
                  Switch User
                </span>
              </Button>
              <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <LogOut className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">Logout</span>
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
