"use client";

import AppLayout from '../AppLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TransactionListItem } from '@/components/features/records/TransactionListItem';
import { mockTransactions } from '@/lib/mockData';
import type { Transaction, TransactionType } from '@/types';
import { History, Filter } from 'lucide-react';
import { useState } from 'react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

export default function RecordsPage() {
  const allTransactions: Transaction[] = mockTransactions; 

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');

  const filteredTransactions = allTransactions
    .filter(tx => filterType === 'all' || tx.type === filterType)
    .filter(tx => tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || tx.id.includes(searchTerm))
    .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


  const transactionTypes: Array<TransactionType | 'all'> = ['all', 'contribution', 'loan_disbursement', 'loan_repayment', 'interest_accrual', 'wallet_creation'];

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
            <History className="h-8 w-8 text-primary" />
            <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">Transaction Records</h1>
        </div>
        
        <Card className="shadow-lg">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-headline">All Platform Transactions</CardTitle>
                <CardDescription className="text-sm">An immutable ledger of all savings, contributions, and loans.</CardDescription>
                <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
                    <div className="relative flex-grow">
                        <Input 
                            placeholder="Search by description or ID..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-8 text-sm sm:text-base"
                        />
                        <Filter className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                    <Select value={filterType} onValueChange={(value: TransactionType | 'all') => setFilterType(value)}>
                        <SelectTrigger className="w-full sm:w-[200px] text-sm sm:text-base">
                            <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                            {transactionTypes.map(type => (
                                <SelectItem key={type} value={type} className="text-sm">
                                    {type === 'all' ? 'All Types' : type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </CardHeader>
            <CardContent className="p-0 sm:p-2 md:p-4">
            {filteredTransactions.length > 0 ? (
                <ScrollArea className="h-[calc(100vh-20rem)] sm:h-[calc(100vh-22rem)] border rounded-md">
                     <div className="divide-y divide-border">
                        {filteredTransactions.map((tx) => (
                        <TransactionListItem key={tx.id} transaction={tx} />
                        ))}
                    </div>
                </ScrollArea>
            ) : (
                <div className="text-center py-12">
                    <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                    <p className="text-xl text-muted-foreground">No transactions found matching your criteria.</p>
                </div>
            )}
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
