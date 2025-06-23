
import { db } from '@/lib/firebase';
import { collection, getDocs, Timestamp, addDoc, query, orderBy, limit } from 'firebase/firestore';
import type { Transaction, TransactionType } from '@/types';
import { sha256, serializeTransactionForHashing, GENESIS_HASH } from '@/lib/crypto';

// Helper function to convert Firestore Timestamps to ISO strings
function convertTimestampsToISO(data: any): any {
  if (data === null || typeof data !== 'object') {
    return data;
  }

  if (data instanceof Timestamp) {
    return data.toDate().toISOString();
  }

  if (Array.isArray(data)) {
    return data.map(item => convertTimestampsToISO(item));
  }

  const convertedObject: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      convertedObject[key] = convertTimestampsToISO(data[key]);
    }
  }
  return convertedObject;
}

export async function getPersonalTransactions(): Promise<Transaction[]> {
    console.log('[PersonalLedgerService] Attempting to fetch all personal transactions...');
    const personalTxsList: Transaction[] = [];
    try {
        const personalLedgerCollection = collection(db, 'personal_ledger');
        const txSnapshot = await getDocs(personalLedgerCollection);
        console.log(`[PersonalLedgerService] Fetched ${txSnapshot.docs.length} personal transaction document(s).`);

        txSnapshot.forEach((doc) => {
            const rawData = doc.data();
            const data = convertTimestampsToISO(rawData);
            personalTxsList.push({ id: doc.id, ...data } as Transaction);
        });
        return personalTxsList;
    } catch (error) {
        console.error("[PersonalLedgerService] Error fetching personal_ledger collection: ", error);
        throw new Error("Could not fetch personal transactions.");
    }
}


export type NewPersonalTransactionInput = {
    memberId: string;
    type: 'personal_deposit' | 'personal_withdrawal';
    amount: number;
    description: string;
};

export async function addPersonalTransaction(txInput: NewPersonalTransactionInput): Promise<string> {
    const personalLedgerCollection = collection(db, 'personal_ledger');

    // 1. Find the last transaction to get its hash
    const q = query(personalLedgerCollection, orderBy('date', 'desc'), limit(1));
    const lastTxSnapshot = await getDocs(q);

    let previousHash = GENESIS_HASH;
    if (!lastTxSnapshot.empty) {
        const lastTx = lastTxSnapshot.docs[0].data() as Transaction;
        if (lastTx.hash) {
            previousHash = lastTx.hash;
        }
    }
    
    // 2. Prepare the new transaction object
    const newTransactionData: Omit<Transaction, 'hash'> = {
        ...txInput,
        id: `txn-personal-${new Date().getTime()}-${Math.random().toString(16).slice(2)}`,
        date: Timestamp.now(),
        previousHash: previousHash,
    };

    // 3. Generate the hash for the new transaction
    const hash = await sha256(serializeTransactionForHashing(newTransactionData));

    // 4. Create the final transaction object with the new hash
    const finalNewTransaction: Transaction & { date: Timestamp } = {
        ...newTransactionData,
        hash: hash,
    };

    try {
        const docRef = await addDoc(personalLedgerCollection, finalNewTransaction);
        console.log('[PersonalLedgerService] Personal transaction created successfully with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("[PersonalLedgerService] Error creating personal transaction: ", error);
        throw new Error(`Could not create personal transaction. Firestore error: ${error instanceof Error ? error.message : String(error)}`);
    }
}
