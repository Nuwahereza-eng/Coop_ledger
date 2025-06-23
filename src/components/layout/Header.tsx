import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Menu } from 'lucide-react';
import { SidebarNavItems, type NavItem } from './SidebarNavItems'; 

interface HeaderProps {
  navItems: NavItem[];
}

export function Header({ navItems }: HeaderProps) {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <Link href="/" className="flex items-center gap-2 text-lg font-semibold font-headline">
          <Image src="/icon.svg" alt="CoopLedger Logo" width={28} height={28} />
          <span className="text-primary">Coop</span><span className="text-foreground">Ledger</span>
        </Link>

        {/* Mobile Navigation */}
        <div className="md:hidden">
          <Sheet>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon">
                <Menu className="h-6 w-6" />
                <span className="sr-only">Toggle navigation menu</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-[280px] bg-sidebar p-0">
              <div className="flex h-16 items-center px-4 border-b border-sidebar-border">
                <Link href="/" className="flex items-center gap-2 text-lg font-semibold">
                 <Image src="/icon.svg" alt="CoopLedger Logo" width={28} height={28} />
                 <span className="text-sidebar-primary">Coop</span><span className="text-sidebar-foreground">Ledger</span>
                </Link>
              </div>
              <nav className="flex flex-col p-4 space-y-2">
                <SidebarNavItems items={navItems} isMobile={true} />
              </nav>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
