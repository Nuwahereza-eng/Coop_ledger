
"use client";

import { useEffect, useState } from 'react';
import AppLayout from '../../AppLayout';
import { History, Filter, Loader2, AlertTriangle } from 'lucide-react';
import { useRole } from '@/contexts/RoleContext';
import { useRouter } from 'next/navigation';
import { getWallets } from '@/services/walletService';
import { getPersonalTransactions } from '@/services/personalLedgerService';
import type { Transaction, TransactionType } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { TransactionListItem } from '@/components/features/records/TransactionListItem';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';


export default function SystemLogsPage() {
  const { userRole, isRoleInitialized } = useRole();
  const router = useRouter();

  const [allTransactions, setAllTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<TransactionType | 'all'>('all');

  useEffect(() => {
    if (isRoleInitialized && userRole !== 'admin') {
      router.replace('/');
    } else if (userRole === 'admin') {
      async function fetchTransactions() {
        try {
          console.log("[SystemLogsPage] Fetching all transactions...");
          setIsLoading(true);
          setError(null);
          const [wallets, personalTxs] = await Promise.all([
            getWallets(),
            getPersonalTransactions()
          ]);
          const walletTxs = wallets.flatMap(wallet => wallet.transactions || []);
          const combinedTransactions = [...walletTxs, ...personalTxs];
          
          console.log(`[SystemLogsPage] Aggregated ${combinedTransactions.length} total transactions.`);
          setAllTransactions(combinedTransactions);
        } catch (err) {
          console.error("[SystemLogsPage] Failed to fetch transactions:", err);
          setError(err instanceof Error ? err.message : "An unknown error occurred while fetching records.");
        } finally {
          setIsLoading(false);
        }
      }
      fetchTransactions();
    }
  }, [userRole, isRoleInitialized, router]);

  const filteredTransactions = allTransactions
    .filter(tx => filterType === 'all' || tx.type === filterType)
    .filter(tx => tx.description.toLowerCase().includes(searchTerm.toLowerCase()) || tx.id.includes(searchTerm))
    .sort((a, b) => new Date(b.date as string).getTime() - new Date(a.date as string).getTime());

  const transactionTypes: Array<TransactionType | 'all'> = ['all', 'contribution', 'loan_disbursement', 'loan_repayment', 'interest_accrual', 'wallet_creation', 'member_join', 'personal_deposit', 'personal_withdrawal'];


  if (!isRoleInitialized || userRole !== 'admin') {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-10rem)]">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          {isRoleInitialized && userRole !== 'admin' && <p className="mt-4 text-muted-foreground">Redirecting...</p>}
          {!isRoleInitialized && <p className="mt-4 text-muted-foreground">Initializing...</p>}
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-8">
        <div className="flex items-center gap-3">
          <History className="h-8 w-8 text-primary" />
          <h1 className="text-2xl sm:text-3xl font-bold font-headline text-foreground">
            System Logs
          </h1>
        </div>
        
        <Card className="shadow-lg">
            <CardHeader className="p-4 sm:p-6">
                <CardTitle className="text-lg sm:text-xl font-headline">All Platform Transactions</CardTitle>
                <CardDescription className="text-sm">An immutable, auditable ledger of all platform activities.</CardDescription>
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
              {isLoading && (
                <div className="flex justify-center items-center py-12">
                  <Loader2 className="h-12 w-12 animate-spin text-primary" />
                  <p className="ml-4 text-muted-foreground">Loading system logs...</p>
                </div>
              )}
              
              {error && !isLoading && (
                <Alert variant="destructive" className="max-w-2xl mx-auto my-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertTitle>Error Fetching Logs</AlertTitle>
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {!isLoading && !error && filteredTransactions.length > 0 ? (
                  <ScrollArea className="h-[calc(100vh-22rem)] sm:h-[calc(100vh-24rem)] border rounded-md">
                      <div className="divide-y divide-border">
                          {filteredTransactions.map((tx) => (
                          <TransactionListItem key={tx.id} transaction={tx} />
                          ))}
                      </div>
                  </ScrollArea>
              ) : null}

              {!isLoading && !error && filteredTransactions.length === 0 && (
                  <div className="text-center py-12">
                      <History className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-xl text-muted-foreground">No logs found matching your criteria.</p>
                      <p className="mt-2 text-sm text-muted-foreground">The ledger is empty or no transactions match your filters.</p>
                  </div>
              )}
            </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
}
