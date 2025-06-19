import type { GroupWallet, Loan, Transaction, Member, Contribution } from '@/types';

export const mockMembers: Member[] = [
  { id: 'member-1', name: 'Aisha Ibrahim', verificationStatus: 'verified', creditScore: 75 },
  { id: 'member-2', name: 'John Okello', verificationStatus: 'pending' },
  { id: 'member-3', name: 'Fatima Diallo', verificationStatus: 'verified', creditScore: 82 },
  { id: 'member-4', name: 'David Kiptoo', verificationStatus: 'unverified' },
];

export const mockTransactions: Transaction[] = [
  { id: 'txn-1', walletId: 'wallet-1', memberId: 'member-1', type: 'contribution', amount: 100, date: '2023-01-15T10:00:00Z', description: 'Monthly contribution by Aisha' },
  { id: 'txn-2', walletId: 'wallet-1', memberId: 'member-2', type: 'contribution', amount: 100, date: '2023-01-16T11:00:00Z', description: 'Monthly contribution by John' },
  { id: 'txn-3', walletId: 'wallet-1', type: 'loan_disbursement', amount: -50, date: '2023-02-01T14:00:00Z', description: 'Loan to Aisha', relatedLoanId: 'loan-1' },
  { id: 'txn-4', walletId: 'wallet-1', memberId: 'member-1', type: 'loan_repayment', amount: 10, date: '2023-03-01T09:00:00Z', description: 'Loan repayment by Aisha', relatedLoanId: 'loan-1' },
  { id: 'txn-5', walletId: 'wallet-2', memberId: 'member-3', type: 'contribution', amount: 200, date: '2023-03-05T10:00:00Z', description: 'Initial contribution by Fatima' },
  { id: 'txn-6', walletId: 'wallet-1', type: 'wallet_creation', amount: 0, date: '2023-01-10T09:00:00Z', description: 'Youth Innovators SACCO wallet created' },
  { id: 'txn-7', walletId: 'wallet-1', memberId: 'member-1', type: 'interest_accrual', amount: 5, date: '2023-04-01T00:00:00Z', description: 'Monthly interest accrued' },
];

export const mockContributions: Contribution[] = [
    { id: 'contr-1', memberId: 'member-1', walletId: 'wallet-1', amount: 100, tokenType: 'USDC', date: '2023-01-15T10:00:00Z' },
    { id: 'contr-2', memberId: 'member-2', walletId: 'wallet-1', amount: 100, tokenType: 'USDC', date: '2023-01-16T11:00:00Z' },
    { id: 'contr-3', memberId: 'member-3', walletId: 'wallet-2', amount: 200, tokenType: 'DAI', date: '2023-03-05T10:00:00Z' },
    { id: 'contr-4', memberId: 'member-1', walletId: 'wallet-1', amount: 150, tokenType: 'USDC', date: '2023-02-15T10:00:00Z' },
];


export const mockWallets: GroupWallet[] = [
  {
    id: 'wallet-1',
    name: 'Youth Innovators SACCO',
    balance: 1250,
    tokenType: 'USDC',
    members: [mockMembers[0], mockMembers[1]],
    transactions: mockTransactions.filter(t => t.walletId === 'wallet-1'),
    creatorId: 'member-1',
  },
  {
    id: 'wallet-2',
    name: 'Women Empowerment Fund',
    balance: 3500,
    tokenType: 'DAI',
    members: [mockMembers[2], mockMembers[3]],
    transactions: mockTransactions.filter(t => t.walletId === 'wallet-2'),
    creatorId: 'member-3',
  },
];

export const mockLoans: Loan[] = [
  {
    id: 'loan-1',
    memberId: 'member-1',
    walletId: 'wallet-1',
    amount: 50,
    interestRate: 0.05, // 5%
    termMonths: 6,
    purpose: 'Purchase seeds for farming',
    status: 'active',
    requestDate: '2023-01-20T10:00:00Z',
    approvalDate: '2023-02-01T14:00:00Z',
    totalRepaid: 8.55, // Updated to reflect first payment
    repaymentSchedule: [
      { id: 'rep-1-1', dueDate: '2023-03-01T00:00:00Z', amountDue: 8.55, amountPaid: 8.55, paymentDate: '2023-03-01T09:00:00Z', status: 'paid' },
      { id: 'rep-1-2', dueDate: '2023-04-01T00:00:00Z', amountDue: 8.55, status: 'pending' },
      { id: 'rep-1-3', dueDate: '2023-05-01T00:00:00Z', amountDue: 8.55, status: 'pending' },
      { id: 'rep-1-4', dueDate: '2023-06-01T00:00:00Z', amountDue: 8.55, status: 'pending' },
      { id: 'rep-1-5', dueDate: '2023-07-01T00:00:00Z', amountDue: 8.55, status: 'pending' },
      { id: 'rep-1-6', dueDate: '2023-08-01T00:00:00Z', amountDue: 8.55, status: 'pending' },
    ],
  },
  {
    id: 'loan-2',
    memberId: 'member-3',
    walletId: 'wallet-2',
    amount: 200,
    interestRate: 0.08, // 8%
    termMonths: 12,
    purpose: 'Start small tailoring business',
    status: 'pending',
    requestDate: '2023-04-01T10:00:00Z',
    totalRepaid: 0,
    repaymentSchedule: [], // Generated upon approval
  },
];

export function getWalletById(id: string): GroupWallet | undefined {
  return mockWallets.find(wallet => wallet.id === id);
}

export function getLoanById(id: string): Loan | undefined {
  return mockLoans.find(loan => loan.id === id);
}
