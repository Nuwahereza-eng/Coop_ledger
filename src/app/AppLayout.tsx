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
import { navItems } from '@/config/nav';
import { Button } from '@/components/ui/button';
import { LogOut, Sun, Moon } from 'lucide-react';
import { useTheme } from 'next-themes'; // Assuming next-themes is or will be installed for theme toggling

export default function AppLayout({ children }: { children: React.ReactNode }) {
  // const { theme, setTheme } = useTheme(); // For theme toggle
  // For now, we'll assume a light theme or OS preference handles dark mode
  
  // Control sidebar open state if needed, e.g., via cookies or props
  // const [sidebarOpen, setSidebarOpen] = React.useState(true); 

  return (
    <SidebarProvider defaultOpen={true} /* open={sidebarOpen} onOpenChange={setSidebarOpen} */>
      <div className="flex min-h-screen flex-col bg-background">
        <Header navItems={navItems} />
        <div className="flex flex-1">
          <Sidebar collapsible="icon" variant="sidebar" className="border-r hidden md:flex bg-sidebar text-sidebar-foreground">
            {/* SidebarTrigger is usually in the Header for mobile, or for desktop toggle if not always visible */}
            <SidebarContent className="p-2 flex-grow">
              <SidebarNavItems items={navItems} />
            </SidebarContent>
            <SidebarFooter className="p-2 mt-auto border-t border-sidebar-border">
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
          <SidebarInset className="flex-1 bg-background overflow-y-auto"> {/* Added overflow-y-auto */}
            <main className="container mx-auto px-4 py-8 sm:px-6 lg:px-8">
              {children}
            </main>
          </SidebarInset>
        </div>
      </div>
    </SidebarProvider>
  );
}
