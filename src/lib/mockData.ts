
import type { GroupWallet, Loan, Transaction, Member, Contribution } from '@/types';

// Note: As Firestore integration progresses, these mock arrays will be gradually phased out or used only as fallbacks/testing.

export const mockUsers: Member[] = [
  { id: 'user-aisha-01', name: 'Aisha Ibrahim', role: 'member', verificationStatus: 'verified', creditScore: 75, personalWalletBalance: 500000 },
  { id: 'user-john-02', name: 'John Okello', role: 'member', verificationStatus: 'pending', personalWalletBalance: 250000 },
  { id: 'user-fatima-03', name: 'Fatima Diallo', role: 'admin', verificationStatus: 'verified', creditScore: 82, personalWalletBalance: 1200000 },
  { id: 'user-david-04', name: 'David Kiptoo', role: 'member', verificationStatus: 'unverified', personalWalletBalance: 100000 },
];

export const mockMembers: Member[] = mockUsers; // Alias for backward compatibility if needed

export const mockTransactions: Transaction[] = [
  { id: 'txn-1', walletId: 'wallet-1', memberId: 'user-aisha-01', type: 'contribution', amount: 100000, date: '2023-01-15T10:00:00Z', description: 'Monthly contribution by Aisha' },
  { id: 'txn-2', walletId: 'wallet-1', memberId: 'user-john-02', type: 'contribution', amount: 100000, date: '2023-01-16T11:00:00Z', description: 'Monthly contribution by John' },
  { id: 'txn-3', walletId: 'wallet-1', type: 'loan_disbursement', amount: -50000, date: '2023-02-01T14:00:00Z', description: 'Loan to Aisha', relatedLoanId: 'loan-1' },
  { id: 'txn-4', walletId: 'wallet-1', memberId: 'user-aisha-01', type: 'loan_repayment', amount: 10000, date: '2023-03-01T09:00:00Z', description: 'Loan repayment by Aisha', relatedLoanId: 'loan-1' },
  { id: 'txn-5', walletId: 'wallet-2', memberId: 'user-fatima-03', type: 'contribution', amount: 200000, date: '2023-03-05T10:00:00Z', description: 'Initial contribution by Fatima' },
  { id: 'txn-6', walletId: 'wallet-1', type: 'wallet_creation', amount: 0, date: '2023-01-10T09:00:00Z', description: 'Youth Innovators SACCO wallet created' },
  { id: 'txn-7', walletId: 'wallet-1', memberId: 'user-aisha-01', type: 'interest_accrual', amount: 5000, date: '2023-04-01T00:00:00Z', description: 'Monthly interest accrued' },
];

export const mockContributions: Contribution[] = [
    { id: 'contr-1', memberId: 'user-aisha-01', walletId: 'wallet-1', amount: 100000, tokenType: 'UGX', date: '2023-01-15T10:00:00Z' },
    { id: 'contr-2', memberId: 'user-john-02', walletId: 'wallet-1', amount: 100000, tokenType: 'UGX', date: '2023-01-16T11:00:00Z' },
    { id: 'contr-3', memberId: 'user-fatima-03', walletId: 'wallet-2', amount: 200000, tokenType: 'UGX', date: '2023-03-05T10:00:00Z' },
    { id: 'contr-4', memberId: 'user-aisha-01', walletId: 'wallet-1', amount: 150000, tokenType: 'UGX', date: '2023-02-15T10:00:00Z' },
];

// mockWallets is no longer the primary source for /wallets page, but might be used by other parts not yet migrated.
export const mockWallets: GroupWallet[] = [
  {
    id: 'wallet-1',
    name: 'Youth Innovators SACCO',
    balance: 1250000,
    tokenType: 'UGX',
    members: [mockUsers[0], mockUsers[1]],
    transactions: mockTransactions.filter(t => t.walletId === 'wallet-1'),
    creatorId: 'user-aisha-01',
  },
  {
    id: 'wallet-2',
    name: 'Women Empowerment Fund',
    balance: 3500000,
    tokenType: 'UGX',
    members: [mockUsers[2], mockUsers[3]],
    transactions: mockTransactions.filter(t => t.walletId === 'wallet-2'),
    creatorId: 'user-fatima-03',
  },
];

export const mockLoans: Loan[] = [
  {
    id: 'loan-1',
    memberId: 'user-aisha-01',
    walletId: 'wallet-1',
    amount: 50000,
    interestRate: 0.05, // 5%
    termMonths: 6,
    purpose: 'Purchase seeds for farming',
    status: 'active',
    requestDate: '2023-01-20T10:00:00Z',
    approvalDate: '2023-02-01T14:00:00Z',
    totalRepaid: 8550, 
    repaymentSchedule: [
      { id: 'rep-1-1', dueDate: '2023-03-01T00:00:00Z', amountDue: 8550, amountPaid: 8550, paymentDate: '2023-03-01T09:00:00Z', status: 'paid' },
      { id: 'rep-1-2', dueDate: '2023-04-01T00:00:00Z', amountDue: 8550, status: 'pending' },
      { id: 'rep-1-3', dueDate: '2023-05-01T00:00:00Z', amountDue: 8550, status: 'pending' },
      { id: 'rep-1-4', dueDate: '2023-06-01T00:00:00Z', amountDue: 8550, status: 'pending' },
      { id: 'rep-1-5', dueDate: '2023-07-01T00:00:00Z', amountDue: 8550, status: 'pending' },
      { id: 'rep-1-6', dueDate: '2023-08-01T00:00:00Z', amountDue: 8550, status: 'pending' },
    ],
  },
  {
    id: 'loan-2',
    memberId: 'user-fatima-03',
    walletId: 'wallet-2',
    amount: 200000,
    interestRate: 0.08, // 8%
    termMonths: 12,
    purpose: 'Start small tailoring business',
    status: 'pending',
    requestDate: '2023-04-01T10:00:00Z',
    totalRepaid: 0,
    repaymentSchedule: [], 
  },
];
