
"use client";

import React from 'react';
import {
  SidebarProvider,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarInset,
} from '@/components/ui/sidebar';
import { Header } from '@/components/layout/Header';
import { SidebarNavItems } from '@/components/layout/SidebarNavItems';
import { memberNavItems } from '@/config/memberNav';
import { adminNavItems } from '@/config/adminNav';
import { Button } from '@/components/ui/button';
import { LogOut, UserCog, User, Sun, Moon, Loader2 } from 'lucide-react';
import { useRole, type UserRole } from '@/contexts/RoleContext'; 
// import { useTheme } from 'next-themes';

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { userRole, setUserRole, isRoleInitialized } = useRole();
  // const { theme, setTheme } = useTheme();

  const currentNavItems = userRole === 'admin' ? adminNavItems : memberNavItems;

  const toggleRole = () => {
    setUserRole((prevRole: UserRole) => (prevRole === 'member' ? 'admin' : 'member'));
  };
  
  if (!isRoleInitialized) {
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
              <Button
                variant="ghost"
                className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={toggleRole}
              >
                {userRole === 'member' ? <UserCog className="h-5 w-5" /> : <User className="h-5 w-5" />}
                <span className="group-data-[collapsible=icon]:hidden">
                  Switch to {userRole === 'member' ? 'Admin' : 'Member'} View
                </span>
              </Button>
              {/* Theme toggle example - uncomment if next-themes is used
               <Button 
                variant="ghost" 
                size="icon" 
                className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
                <span className="group-data-[collapsible=icon]:hidden">
                  Toggle Theme
                </span>
              </Button> 
              */}
              <Button variant="ghost" className="w-full justify-start gap-2 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <LogOut className="h-5 w-5" />
                <span className="group-data-[collapsible=icon]:hidden">Logout</span>
              </Button>
            </SidebarFooter>
          </Sidebar>
          <SidebarInset className="flex-1 bg-background overflow-y-auto">
            <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
