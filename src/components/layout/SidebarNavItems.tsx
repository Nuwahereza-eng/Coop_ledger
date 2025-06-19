
"use client";

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  disabled?: boolean;
}

interface SidebarNavItemsProps {
  items: NavItem[];
  isMobile?: boolean;
  onLinkClick?: () => void; // Callback for when a link is clicked, useful for closing mobile sheet
}

export function SidebarNavItems({ items, isMobile = false, onLinkClick }: SidebarNavItemsProps) {
  const pathname = usePathname();

  if (!items?.length) {
    return null;
  }

  return (
    <SidebarMenu className={cn(isMobile && "flex flex-col gap-1")}>
      {items.map((item) => {
        const isActive = pathname === item.href || (item.href !== "/" && pathname.startsWith(item.href + '/')) || (item.href !== "/" && pathname === item.href + '/');
        return (
          <SidebarMenuItem key={item.href}>
            <Link
              href={item.disabled ? "#" : item.href}
              passHref
              legacyBehavior={isMobile}
              onClick={isMobile ? onLinkClick : undefined}
              aria-disabled={item.disabled}
              className={cn(item.disabled ? "pointer-events-none" : "")}
            >
              <SidebarMenuButton
                asChild={!isMobile}
                className={cn(
                  "w-full justify-start text-base md:text-sm",
                  item.disabled && "cursor-not-allowed opacity-50"
                )}
                isActive={isActive}
                // The disabled prop is handled by the <Link> wrapper's aria-disabled and className for pointer-events.
                // SidebarMenuButton itself will also get disabled styling from its variants if item.disabled is true.
                disabled={item.disabled}
                tooltip={isMobile ? undefined : {content: item.label, side: 'right', align: 'center' }}
              >
                {!isMobile ? (
                  // Desktop: asChild is true. SidebarMenuButton becomes Slot.
                  // Slot needs a single child element. This span acts as that single child.
                  // The SidebarMenuButton's styles (including from variants like isActive) will be applied to this span.
                  <span className="flex items-center w-full">
                    <item.icon className={cn("mr-3 h-5 w-5 shrink-0", isActive && "text-sidebar-primary")} />
                    <span className={cn("group-data-[collapsible=icon]:hidden")}>{item.label}</span>
                  </span>
                ) : (
                  // Mobile: asChild is false. SidebarMenuButton renders a <button>.
                  // Its children can be multiple elements (wrapped in a fragment).
                  <>
                    <item.icon className={cn("mr-3 h-5 w-5 shrink-0", isActive && "text-primary")} />
                    <span className={cn("")}>{item.label}</span>
                  </>
                )}
              </SidebarMenuButton>
            </Link>
          </SidebarMenuItem>
        );
      })}
    </SidebarMenu>
  );
}
