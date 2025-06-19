
import type { NavItem } from '@/components/layout/SidebarNavItems';
import { LayoutDashboard, Users, Settings, ShieldAlert, History, Landmark, Edit3 } from 'lucide-react';

export const adminNavItems: NavItem[] = [
  { href: '/admin/dashboard', label: 'Admin Dashboard', icon: LayoutDashboard },
  { href: '/admin/manage-members', label: 'Manage Members', icon: Users },
  { href: '/admin/wallets-overview', label: 'Wallets Overview', icon: Landmark },
  { href: '/admin/system-logs', label: 'System Logs', icon: History },
  { href: '/admin/dispute-resolution', label: 'Disputes', icon: ShieldAlert, disabled: true },
  { href: '/admin/content-management', label: 'Manage Content', icon: Edit3, disabled: true },
  { href: '/admin/settings', label: 'System Settings', icon: Settings, disabled: true },
];
