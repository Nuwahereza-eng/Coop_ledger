
import type { Timestamp } from 'firebase/firestore';

export interface Member {
  id: string;
  name: string;
  role?: 'member' | 'admin';
  hashedPii?: string; // One-way hash of PII
  verificationStatus: 'verified' | 'pending' | 'unverified';
  creditScore?: number;
}

export interface GroupWallet {
  id: string;
  name: string;
  balance: number; // Assuming a numeric balance for simplicity
  tokenType: string; // e.g., "USDC", "DAI", "AppToken"
  members: Member[];
  transactions: Transaction[];
  creatorId: string; // Member ID of the creator
}

export interface Contribution {
  id: string;
  memberId: string;
  walletId: string;
  amount: number;
  tokenType: string;
  date: string | Timestamp; // ISO Date string on client, Timestamp in Firestore
}

export interface Loan {
  id:string;
  memberId: string; // Borrower
  walletId: string; // Source wallet
  amount: number;
  interestRate: number; // Annual percentage, e.g., 0.05 for 5%
  termMonths: number;
  purpose: string;
  status: 'pending' | 'active' | 'repaid' | 'defaulted' | 'rejected';
  requestDate: string | Timestamp;
  approvalDate?: string | Timestamp;
  repaymentSchedule: Repayment[];
  totalRepaid: number;
}

export interface Repayment {
  id: string;
  dueDate: string | Timestamp;
  amountDue: number;
  amountPaid?: number;
  paymentDate?: string | Timestamp;
  status: 'pending' | 'paid' | 'overdue';
}

export type TransactionType = 'contribution' | 'loan_disbursement' | 'loan_repayment' | 'interest_accrual' | 'wallet_creation';

export interface Transaction {
  id: string;
  walletId?: string; // Optional if it's a general platform transaction
  memberId?: string; // Optional, e.g. for interest accrual to wallet
  type: TransactionType;
  amount: number; // Positive for income to wallet, negative for outgoing
  date: string | Timestamp; // ISO Date string on client, Timestamp in Firestore
  description: string;
  hash?: string;
  previousHash?: string;
  relatedLoanId?: string;
  relatedContributionId?: string;
}
