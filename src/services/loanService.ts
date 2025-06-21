
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, Timestamp, addDoc, updateDoc, runTransaction, arrayUnion } from 'firebase/firestore';
import type { Loan, GroupWallet, Transaction, Repayment } from '@/types';
import { sha256, serializeTransactionForHashing, GENESIS_HASH } from '@/lib/crypto';


// Helper function to convert Firestore Timestamps in loan objects
function convertLoanTimestampsToISO(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(item => convertLoanTimestampsToISO(item));
  }

  const convertedObject: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      convertedObject[key] = convertLoanTimestampsToISO(data[key]);
    }
  }
  return convertedObject;
}

export async function getLoans(): Promise<Loan[]> {
  console.log('[LoanService] Attempting to fetch all loans...');
  const loansList: Loan[] = [];
  try {
    const loansCollection = collection(db, 'loans');
    const loanSnapshot = await getDocs(loansCollection);
    console.log(`[LoanService] Fetched ${loanSnapshot.docs.length} loan document(s).`);

    loanSnapshot.forEach((doc) => {
      const rawData = doc.data();
      const data = convertLoanTimestampsToISO(rawData);
      
      loansList.push({
        id: doc.id,
        ...data,
      } as Loan);
    });
    console.log('[LoanService] Successfully processed loans:', loansList);
    return loansList;
  } catch (error) {
    console.error("[LoanService] Error fetching loans collection: ", error);
    throw new Error("Could not fetch loans.");
  }
}

export async function getLoanById(id: string): Promise<Loan | null> {
  console.log(`[LoanService] Attempting to fetch loan by ID: ${id}`);
  try {
    const loanDocRef = doc(db, 'loans', id);
    const loanDoc = await getDoc(loanDocRef);

    if (loanDoc.exists()) {
      const rawData = loanDoc.data();
      const data = convertLoanTimestampsToISO(rawData);
      console.log(`[LoanService] Found loan ${id}:`, data);
      return { id: loanDoc.id, ...data } as Loan;
    } else {
      console.warn(`[LoanService] Loan with id ${id} not found.`);
      return null;
    }
  } catch (error) {
    console.error(`[LoanService] Error fetching loan with id ${id}: `, error);
    throw new Error(`Could not fetch loan ${id}.`);
  }
}

export type CreateLoanData = Omit<Loan, 'id' | 'status' | 'requestDate' | 'repaymentSchedule' | 'totalRepaid'>;

export async function createLoan(loanData: CreateLoanData): Promise<string> {
    console.log('[LoanService] Attempting to create loan with data:', loanData);

    const newLoanDocData = {
      ...loanData,
      status: 'pending',
      requestDate: Timestamp.now(),
      repaymentSchedule: [],
      totalRepaid: 0,
    };

    try {
        const docRef = await addDoc(collection(db, 'loans'), newLoanDocData);
        console.log('[LoanService] Loan created successfully with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("[LoanService] Error creating loan document in Firestore: ", error);
        throw new Error(`Could not create loan request. Firestore error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export async function approveLoan(loanId: string): Promise<void> {
  const loanRef = doc(db, 'loans', loanId);
  
  await runTransaction(db, async (firestoreTransaction) => {
    const loanDoc = await firestoreTransaction.get(loanRef);
    if (!loanDoc.exists() || loanDoc.data().status !== 'pending') {
      throw new Error("Loan not found or not in pending state.");
    }
    const loanData = loanDoc.data() as Loan;
    
    const walletRef = doc(db, 'wallets', loanData.walletId);
    const walletDoc = await firestoreTransaction.get(walletRef);
    if (!walletDoc.exists()) {
      throw new Error("Source wallet for the loan not found!");
    }
    const walletData = walletDoc.data() as GroupWallet;

    if (walletData.balance < loanData.amount) {
      throw new Error("Insufficient funds in the wallet to disburse this loan.");
    }
    
    const currentTransactions = (walletData.transactions || []).map(t => convertTimestampsToISO(t)) as (Transaction & {date: string})[];
    const sortedTransactions = currentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastTransaction = sortedTransactions.length > 0 ? sortedTransactions[0] : null;

    const previousHash = lastTransaction?.hash ?? GENESIS_HASH;

    const disbursementTransaction: Omit<Transaction, 'hash'> = {
        id: `txn-disburse-${new Date().getTime()}-${Math.random().toString(16).slice(2)}`,
        type: 'loan_disbursement',
        amount: -loanData.amount, // It's a disbursement, so it's negative for the wallet
        date: Timestamp.now(),
        description: `Loan disbursement for: ${loanData.purpose}`,
        previousHash: previousHash,
        walletId: loanData.walletId,
        memberId: loanData.memberId,
        relatedLoanId: loanId,
    };
    
    const hash = await sha256(serializeTransactionForHashing(disbursementTransaction));
    const finalDisbursementTx: Transaction & {date: Timestamp} = { ...disbursementTransaction, hash };

    const newBalance = walletData.balance - loanData.amount;

    // Generate Repayment Schedule
    const repaymentSchedule: Repayment[] = [];
    // Assuming interestRate is a flat rate for the entire term for simplicity
    const totalRepayable = loanData.amount * (1 + loanData.interestRate);
    const installmentAmount = totalRepayable / loanData.termMonths;
    const approvalDate = new Date();

    for (let i = 1; i <= loanData.termMonths; i++) {
        const dueDate = new Date(approvalDate);
        dueDate.setMonth(dueDate.getMonth() + i);
        repaymentSchedule.push({
            id: `rep-${loanId}-${i}`,
            dueDate: Timestamp.fromDate(dueDate),
            amountDue: parseFloat(installmentAmount.toFixed(2)),
            status: 'pending',
            amountPaid: 0,
        });
    }

    // Update wallet
    firestoreTransaction.update(walletRef, {
      balance: newBalance,
      transactions: arrayUnion(finalDisbursementTx)
    });

    // Update loan
    firestoreTransaction.update(loanRef, {
      status: 'active',
      approvalDate: Timestamp.now(),
      repaymentSchedule: repaymentSchedule
    });
  });
   console.log(`[LoanService] Loan ${loanId} approved and disbursed successfully.`);
}

export async function rejectLoan(loanId: string): Promise<void> {
    const loanRef = doc(db, 'loans', loanId);
    await updateDoc(loanRef, {
        status: 'rejected',
    });
    console.log(`[LoanService] Loan ${loanId} rejected successfully.`);
}


export async function processLoanRepayment(loanId: string, repaymentAmount: number, memberId: string): Promise<void> {
  await runTransaction(db, async (firestoreTransaction) => {
    // 1. Get Loan and Wallet
    const loanRef = doc(db, 'loans', loanId);
    const loanDoc = await firestoreTransaction.get(loanRef);

    if (!loanDoc.exists() || loanDoc.data().status !== 'active') {
      throw new Error("Loan is not active or does not exist.");
    }
    const loanData = loanDoc.data() as Loan;

    const walletRef = doc(db, 'wallets', loanData.walletId);
    const walletDoc = await firestoreTransaction.get(walletRef);
    if (!walletDoc.exists()) {
      throw new Error("Source wallet for the loan not found!");
    }
    const walletData = walletDoc.data() as GroupWallet;

    // 2. Create Wallet Transaction
    const currentTransactions = (walletData.transactions || []).map(t => convertTimestampsToISO(t)) as (Transaction & {date: string})[];
    const sortedTransactions = currentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const lastTransaction = sortedTransactions.length > 0 ? sortedTransactions[0] : null;
    const previousHash = lastTransaction?.hash ?? GENESIS_HASH;

    const repaymentTransaction: Omit<Transaction, 'hash'> = {
        id: `txn-repay-${new Date().getTime()}-${Math.random().toString(16).slice(2)}`,
        type: 'loan_repayment',
        amount: repaymentAmount, // Positive: money into wallet
        date: Timestamp.now(),
        description: `Loan repayment by member ${memberId}`,
        previousHash: previousHash,
        walletId: loanData.walletId,
        memberId: memberId,
        relatedLoanId: loanId,
    };

    const hash = await sha256(serializeTransactionForHashing(repaymentTransaction));
    const finalRepaymentTx: Transaction & {date: Timestamp} = { ...repaymentTransaction, hash };

    // 3. Update Wallet
    const newWalletBalance = walletData.balance + repaymentAmount;
    firestoreTransaction.update(walletRef, {
      balance: newWalletBalance,
      transactions: arrayUnion(finalRepaymentTx)
    });

    // 4. Update Loan
    const newTotalRepaid = (loanData.totalRepaid || 0) + repaymentAmount;
    let amountToApply = repaymentAmount;
    const updatedSchedule = loanData.repaymentSchedule.map((repayment: Repayment) => {
        const updatedRepayment = { ...repayment }; // Work with a copy
        if (updatedRepayment.status !== 'paid' && amountToApply > 0) {
            const remainingDue = updatedRepayment.amountDue - (updatedRepayment.amountPaid || 0);
            const paymentForThisInstallment = Math.min(amountToApply, remainingDue);
            
            updatedRepayment.amountPaid = (updatedRepayment.amountPaid || 0) + paymentForThisInstallment;
            amountToApply -= paymentForThisInstallment;

            // Use a small epsilon for float comparison to be safe
            if (updatedRepayment.amountPaid >= (updatedRepayment.amountDue - 0.001)) {
                updatedRepayment.status = 'paid';
                updatedRepayment.paymentDate = Timestamp.now();
            }
        }
        return updatedRepayment;
    });
    
    let newStatus = loanData.status;
    const totalAmountDue = loanData.amount * (1 + loanData.interestRate);
    if (newTotalRepaid >= totalAmountDue) {
        newStatus = 'repaid';
    }

    firestoreTransaction.update(loanRef, {
        totalRepaid: newTotalRepaid,
        repaymentSchedule: updatedSchedule,
        status: newStatus,
    });
  });
  console.log(`[LoanService] Repayment of ${repaymentAmount} for loan ${loanId} processed successfully.`);
}
