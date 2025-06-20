
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, Timestamp } from 'firebase/firestore';
import type { GroupWallet, Member, Transaction, Repayment } from '@/types';

// Helper function to convert Firestore Timestamps to ISO strings
// This needs to be applied recursively if you have nested objects with Timestamps
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


export async function getWallets(): Promise<GroupWallet[]> {
  console.log('[WalletService] Attempting to fetch all wallets...');
  try {
    const walletsCollection = collection(db, 'wallets');
    const walletSnapshot = await getDocs(walletsCollection);
    console.log('[WalletService] Raw wallet snapshot:', walletSnapshot);
    const walletsList = walletSnapshot.docs.map(doc => {
      const data = doc.data();
      console.log(`[WalletService] Raw data for wallet ${doc.id}:`, data);
      // Assume members and transactions are stored directly or fetched/resolved here
      // For now, direct conversion
      const convertedData = convertTimestampsToISO(data);
      console.log(`[WalletService] Converted data for wallet ${doc.id}:`, convertedData);
      return { 
        id: doc.id, 
        ...convertedData
      } as GroupWallet;
    });
    console.log('[WalletService] Wallets after conversion:', walletsList);
    return walletsList;
  } catch (error) {
    console.error("[WalletService] Error fetching wallets: ", error);
    throw new Error("Could not fetch wallets.");
  }
}

export async function getWalletById(id: string): Promise<GroupWallet | undefined> {
  console.log(`[WalletService] Attempting to fetch wallet by ID: ${id}`);
  try {
    const walletDocRef = doc(db, 'wallets', id);
    const walletDoc = await getDoc(walletDocRef);

    if (walletDoc.exists()) {
      const data = walletDoc.data();
      console.log(`[WalletService] Raw data for wallet ${id}:`, data);
       // Assuming members and transactions are sub-collections or fetched separately and merged
      // For simplicity, if they are stored directly on the wallet doc:
      const convertedData = convertTimestampsToISO(data);
      console.log(`[WalletService] Converted data for wallet ${id}:`, convertedData);
      const wallet = { 
        id: walletDoc.id, 
        ...convertedData
      } as GroupWallet;
      console.log(`[WalletService] Wallet ${id} after conversion:`, wallet);
      return wallet;
    } else {
      console.warn(`[WalletService] Wallet with id ${id} not found.`);
      return undefined;
    }
  } catch (error) {
    console.error(`[WalletService] Error fetching wallet with id ${id}: `, error);
    throw new Error(`Could not fetch wallet ${id}.`);
  }
}

// Example: If members were in a subcollection 'members' under each wallet
// export async function getMembersForWallet(walletId: string): Promise<Member[]> {
//   const membersCollection = collection(db, `wallets/${walletId}/members`);
//   const memberSnapshot = await getDocs(membersCollection);
//   return memberSnapshot.docs.map(doc => ({ id: doc.id, ...convertTimestampsToISO(doc.data()) }) as Member);
// }

// Example: If transactions were in a subcollection 'transactions' under each wallet
// export async function getTransactionsForWallet(walletId: string): Promise<Transaction[]> {
//   const transactionsCollection = collection(db, `wallets/${walletId}/transactions`);
//   const transactionSnapshot = await getDocs(transactionsCollection);
//   return transactionSnapshot.docs.map(doc => ({ id: doc.id, ...convertTimestampsToISO(doc.data()) }) as Transaction);
// }

// Placeholder for future services - you'll need to implement these similarly
export async function getMembers(): Promise<Member[]> {
    // This would fetch from a top-level 'members' collection
    console.warn("getMembers from Firestore not yet fully implemented, returning mock.");
    return []; // Or mockMembers for now
}

export async function getLoans(): Promise<Loan[]> {
     // This would fetch from a top-level 'loans' collection
    console.warn("getLoans from Firestore not yet fully implemented, returning mock.");
    return []; // Or mockLoans for now
}

export async function getTransactions(): Promise<Transaction[]> {
    // This would fetch from a top-level 'transactions' collection
    console.warn("getTransactions from Firestore not yet fully implemented, returning mock.");
    return []; // Or mockTransactions for now
}
