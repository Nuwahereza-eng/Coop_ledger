"use client";

import Link from 'next/link';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { Loan } from '@/types';
import { Repeat, CalendarDays, CheckCircle2, XCircle, Hourglass, ArrowRight, DollarSign, Landmark } from 'lucide-react';

interface LoanListItemProps {
  loan: Loan;
}

const getStatusBadgeClasses = (status: Loan['status']) => {
  switch (status) {
    case 'active': return 'bg-green-100 text-green-700 border-green-300 dark:bg-green-800/30 dark:text-green-300 dark:border-green-700';
    case 'pending': return 'bg-yellow-100 text-yellow-700 border-yellow-300 dark:bg-yellow-800/30 dark:text-yellow-300 dark:border-yellow-700';
    case 'repaid': return 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-800/30 dark:text-blue-300 dark:border-blue-700';
    case 'defaulted':
    case 'rejected': return 'bg-red-100 text-red-700 border-red-300 dark:bg-red-800/30 dark:text-red-300 dark:border-red-700';
    default: return 'bg-gray-100 text-gray-700 border-gray-300 dark:bg-gray-800/30 dark:text-gray-300 dark:border-gray-700';
  }
};

const getStatusIcon = (status: Loan['status']) => {
    switch (status) {
      case 'active': return <CheckCircle2 className="w-4 h-4 mr-1 text-green-500" />;
      case 'pending': return <Hourglass className="w-4 h-4 mr-1 text-yellow-500" />;
      case 'repaid': return <CheckCircle2 className="w-4 h-4 mr-1 text-blue-500" />;
      case 'defaulted': 
      case 'rejected': return <XCircle className="w-4 h-4 mr-1 text-red-500" />;
      default: return <Repeat className="w-4 h-4 mr-1 text-gray-500" />;
    }
  };


export function LoanListItem({ loan }: LoanListItemProps) {
  return (
    <Card className="hover:shadow-md transition-shadow duration-300 bg-card">
      <CardHeader className="p-4 sm:p-6">
        <div className="flex justify-between items-start gap-2">
            <div>
                <CardTitle className="font-headline text-md sm:text-lg text-foreground">Loan ID: {loan.id.substring(0,8)}...</CardTitle>
                <CardDescription className="text-xs sm:text-sm truncate max-w-[200px] sm:max-w-xs" title={loan.purpose}>Purpose: {loan.purpose}</CardDescription>
            </div>
            <Badge variant="outline" className={getStatusBadgeClasses(loan.status) + " text-xs px-2 py-1"}>
                {getStatusIcon(loan.status)}
                {loan.status.charAt(0).toUpperCase() + loan.status.slice(1)}
            </Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-2 text-xs sm:text-sm p-4 sm:p-6">
        <div className="flex items-center">
          <DollarSign className="w-4 h-4 mr-2 text-muted-foreground" /> Amount: {loan.amount.toLocaleString()} ({(loan.interestRate * 100).toFixed(1)}% interest)
        </div>
        <div className="flex items-center">
            <CalendarDays className="w-4 h-4 mr-2 text-muted-foreground" /> Term: {loan.termMonths} months
        </div>
        <div className="flex items-center">
            <Landmark className="w-4 h-4 mr-2 text-muted-foreground" /> Wallet: {loan.walletId.substring(0,10)}...
        </div>
        <div className="text-xs text-muted-foreground pt-1">
          Requested: {new Date(loan.requestDate).toLocaleDateString()}
        </div>
      </CardContent>
      <CardFooter className="p-4 sm:p-6">
        <Button asChild variant="outline" size="sm" className="w-full text-xs sm:text-sm">
          <Link href={`/loans/${loan.id}`}>
            View Details <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
