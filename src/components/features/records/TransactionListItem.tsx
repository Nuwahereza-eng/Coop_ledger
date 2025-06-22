
"use client";

import type { Transaction } from '@/types';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Landmark, Upload, TrendingUp, TrendingDown, CircleDollarSign, FileText, Fingerprint, Copy, UserPlus, ArrowUpCircle, ArrowDownCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface TransactionListItemProps {
  transaction: Transaction;
}

const getTransactionIcon = (type: Transaction['type']) => {
  if (type === 'contribution') return <Upload className="h-5 w-5 text-green-500" />;
  if (type === 'loan_disbursement') return <TrendingDown className="h-5 w-5 text-red-500" />;
  if (type === 'loan_repayment') return <TrendingUp className="h-5 w-5 text-blue-500" />;
  if (type === 'interest_accrual') return <CircleDollarSign className="h-5 w-5 text-purple-500" />;
  if (type === 'wallet_creation') return <Landmark className="h-5 w-5 text-indigo-500" />;
  if (type === 'member_join') return <UserPlus className="h-5 w-5 text-cyan-500" />;
  if (type === 'personal_deposit') return <ArrowUpCircle className="h-5 w-5 text-teal-500" />;
  if (type === 'personal_withdrawal') return <ArrowDownCircle className="h-5 w-5 text-orange-500" />;
  return <FileText className="h-5 w-5 text-gray-500" />;
};

const getTransactionColorClass = (amount: number, type: Transaction['type']) => {
    if (type === 'loan_disbursement' || type === 'personal_withdrawal' || (amount < 0 && type !== 'contribution')) return 'text-red-600 dark:text-red-400';
    if (amount > 0) return 'text-green-600 dark:text-green-400';
    return 'text-muted-foreground';
};

export function TransactionListItem({ transaction }: TransactionListItemProps) {
  const { toast } = useToast();
  const date = new Date(transaction.date as string);
  const formattedDate = date.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  const formattedTime = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });

  const handleCopy = (textToCopy: string) => {
    navigator.clipboard.writeText(textToCopy).then(() => {
        toast({ title: "Copied to clipboard!"});
    }).catch(err => {
        toast({ title: "Failed to copy", description: err.message, variant: "destructive"});
    });
  };

  return (
    <div className="flex flex-col p-3 sm:p-4 hover:bg-muted/50 transition-colors">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 sm:gap-4">
          <div className="p-2 bg-muted rounded-full">
              {getTransactionIcon(transaction.type)}
          </div>
          <div>
            <p className={cn("font-semibold text-sm sm:text-base", getTransactionColorClass(transaction.amount, transaction.type))}>
              {transaction.amount >= 0 ? '+' : ''}{transaction.amount.toLocaleString()}
            </p>
            <p className="text-xs sm:text-sm text-muted-foreground truncate max-w-[150px] sm:max-w-xs" title={transaction.description}>{transaction.description}</p>
            {transaction.memberId && <p className="text-xs text-muted-foreground/70">Member: {transaction.memberId}</p>}
          </div>
        </div>
        <div className="text-right space-y-1">
          <Badge variant={"outline"} className={cn(
              "text-xs",
              transaction.type === 'contribution' ? 'bg-green-100 text-green-700 border-green-300 dark:bg-green-800/30 dark:text-green-300 dark:border-green-700' :
              transaction.type === 'loan_disbursement' ? 'bg-red-100 text-red-700 border-red-300 dark:bg-red-800/30 dark:text-red-300 dark:border-red-700' :
              transaction.type === 'loan_repayment' ? 'bg-blue-100 text-blue-700 border-blue-300 dark:bg-blue-800/30 dark:text-blue-300 dark:border-blue-700' :
              transaction.type === 'member_join' ? 'bg-cyan-100 text-cyan-700 border-cyan-300 dark:bg-cyan-800/30 dark:text-cyan-300 dark:border-cyan-700' :
              transaction.type === 'personal_deposit' ? 'bg-teal-100 text-teal-700 border-teal-300 dark:bg-teal-800/30 dark:text-teal-300 dark:border-teal-700' :
              transaction.type === 'personal_withdrawal' ? 'bg-orange-100 text-orange-700 border-orange-300 dark:bg-orange-800/30 dark:text-orange-300 dark:border-orange-700' :
              'bg-muted text-muted-foreground border-border'
            )}>
              {transaction.type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
          </Badge>
          <p className="text-xs text-muted-foreground">{formattedDate} <span className="hidden sm:inline">at {formattedTime}</span></p>
        </div>
      </div>
      {transaction.hash && (
        <div className="mt-2 pl-4 sm:pl-12 text-xs">
          <div className="flex items-center gap-2 text-muted-foreground font-mono">
            <Fingerprint className="h-3 w-3 shrink-0" />
            <span 
                className="truncate cursor-pointer hover:underline" 
                title={`Click to copy hash: ${transaction.hash}`}
                onClick={() => handleCopy(transaction.hash!)}
            >
                Hash: {transaction.hash.substring(0, 10)}...{transaction.hash.substring(transaction.hash.length - 8)}
            </span>
            <Copy className="h-3 w-3 shrink-0 cursor-pointer hover:text-foreground" onClick={() => handleCopy(transaction.hash!)} />
          </div>
          {transaction.previousHash && (
            <div className="flex items-center gap-2 text-muted-foreground/70 font-mono">
                <span className="ml-1">↳</span>
                <span 
                    className="truncate cursor-pointer hover:underline"
                    title={`Click to copy previous hash: ${transaction.previousHash}`}
                    onClick={() => handleCopy(transaction.previousHash!)}
                >
                    Prev: {transaction.previousHash.substring(0, 10)}...{transaction.previousHash.substring(transaction.previousHash.length - 8)}
                </span>
                <Copy className="h-3 w-3 shrink-0 cursor-pointer hover:text-foreground" onClick={() => handleCopy(transaction.previousHash!)} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
