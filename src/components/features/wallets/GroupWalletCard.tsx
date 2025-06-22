
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
                src={`https://loremflickr.com/400/200/community,savings`}
                alt={wallet.name}
                width={400}
                height={200}
                className="w-full h-full object-cover"
                data-ai-hint="community savings"
            />
        </div>
        <CardDescription className="text-xs sm:text-sm">Managed in {wallet.tokenType}</CardDescription>
      </CardHeader>
      <CardContent className="flex-grow space-y-2 p-4 sm:p-6">
        <div className="flex items-center text-md sm:text-lg">
          <DollarSign className="w-4 h-4 sm:w-5 sm:h-5 mr-2 text-green-500" />
          <span className="font-semibold text-foreground">Balance: {wallet.balance.toLocaleString()} {wallet.tokenType}</span>
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
