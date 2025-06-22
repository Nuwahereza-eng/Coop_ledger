
import type { NavItem } from '@/components/layout/SidebarNavItems';
import {
  LayoutDashboard,
  Wallet,
  Repeat,
  History,
  UserCheck,
  Gauge,
  Landmark,
  WalletCards
} from 'lucide-react';

export const memberNavItems: NavItem[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/wallets', label: 'Group Wallets', icon: Landmark },
  { href: '/personal-wallet', label: 'Personal Wallet', icon: WalletCards },
  { href: '/contributions', label: 'Contributions', icon: Wallet },
  { href: '/loans', label: 'Loans', icon: Repeat },
  { href: '/records', label: 'All Records', icon: History },
  { href: '/verify', label: 'Verify ID', icon: UserCheck },
  { href: '/credit-score', label: 'Credit Score', icon: Gauge },
];
