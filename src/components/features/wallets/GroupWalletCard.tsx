
"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { GroupWallet } from '@/types';
import { Landmark, Users, DollarSign, ArrowRight } from 'lucide-react';
import Image from 'next/image';

interface GroupWalletCardProps {
  wallet: GroupWallet;
}

export function GroupWalletCard({ wallet }: GroupWalletCardProps) {
  let imageUrl = "https://images.unsplash.com/photo-1582213782179-e0d53f98f2ca?q=80&w=1170&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
  let imageHint = 'community finance';

  if (wallet.name.toLowerCase().includes('youth')) {
    imageUrl = "https://images.unsplash.com/photo-1502444330042-d1a1ddf9bb5b?w=600&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8eW91dGh8ZW58MHx8MHx8fDA%3D";
    imageHint = "youth community";
  } else if (wallet.name.toLowerCase().includes('women')) {
    imageUrl = "https://images.unsplash.com/photo-1506782081254-09bcfd996fd6?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D";
    imageHint = "women empowerment";
  }

  const displayToken = wallet.tokenType === 'AppToken' ? '$CL' : wallet.tokenType;

  return (
    <Card className="flex flex-col h-full hover:shadow-lg transition-shadow duration-300 bg-card">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex items-center gap-3 mb-3">
          <div className="p-2 bg-primary/10 rounded-md">
            <Landmark className="w-6 h-6 sm:w-7 sm:w-7 text-primary" />
          </div>
          <CardTitle className="font-headline text-lg sm:text-xl text-foreground">{wallet.name}</CardTitle>
        </div>
        <div className="aspect-video w-full rounded-md overflow-hidden mb-2">
            <Image 
                src={imageUrl}
                alt={wallet.name}
                width={400}
                height={200}
                className="w-full h-full object-cover"
                data-ai-hint={imageHint}
            />
        </div>
        <CardDescription className="text-xs sm:text-sm">Managed in {displayToken}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 p-4 sm:p-6">
        <div className="flex items-center text-md sm:text-lg">
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500" />
          <span className="font-semibold text-foreground">Balance: {wallet.balance.toLocaleString()} {displayToken}</span>
        </div>
        <div className="flex items-center text-xs sm:text-sm text-muted-foreground">
          <Users className="w-3 h-3 sm:w-4 sm:h-4 mr-2" />
          <span>{wallet.members.length} Members</span>
        </div>
         <div className="text-xs text-muted-foreground">
          Created by: {wallet.members.find(m => m.id === wallet.creatorId)?.name || wallet.creatorId}
        </div>
      </CardContent>
      <CardFooter className="p-4 sm:p-6">
        <Button asChild className="w-full text-sm sm:text-base">
          <Link href={`/wallets/${wallet.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
