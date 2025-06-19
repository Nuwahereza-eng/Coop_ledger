
import type { Metadata } from 'next';
// import { PT_Sans } from 'next/font/google'; // Using <link> as per instructions
import './globals.css';
import { Toaster } from "@/components/ui/toaster";
import { RoleProvider } from '@/contexts/RoleContext';

// If you want to use the next/font loader for PT Sans:
// const ptSans = PT_Sans({
//   subsets: ['latin'],
//   weight: ['400', '700'],
//   variable: '--font-pt-sans', // Optional: if you want to use it as a CSS variable
// });

export const metadata: Metadata = {
  title: 'CoopLedger - Blockchain SACCO',
  description: 'Transparent and secure savings and micro-loans for communities.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=PT+Sans:ital,wght@0,400;0,700;1,400;1,700&display=swap" rel="stylesheet" />
      </head>
      {/* If using next/font, add ptSans.className here */}
      <body className="font-body antialiased">
        <RoleProvider>
          {children}
        </RoleProvider>
        <Toaster />
      </body>
    </html>
  );
}
