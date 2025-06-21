
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, Timestamp, addDoc } from 'firebase/firestore';
import type { Loan } from '@/types';

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
