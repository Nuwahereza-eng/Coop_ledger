
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, Timestamp, addDoc, arrayUnion } from 'firebase/firestore';
import type { GroupWallet, Member, Transaction, Repayment } from '@/types';

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


export async function getWallets(): Promise<GroupWallet[]> {
  console.log('[WalletService] Attempting to fetch all wallets...');
  const walletsList: GroupWallet[] = [];
  try {
    const walletsCollection = collection(db, 'wallets');
    const walletSnapshot = await getDocs(walletsCollection);
    console.log(`[WalletService] Fetched ${walletSnapshot.docs.length} wallet document(s) from Firestore.`);

    walletSnapshot.docs.forEach(doc => {
      try {
        const data = doc.data();
        // Using JSON.stringify/parse for deep cloning for logging to avoid issues with console display of complex objects like Timestamps before conversion
        console.log(`[WalletService] Processing wallet ${doc.id}. Raw data:`, JSON.parse(JSON.stringify(data)));
        
        const convertedData = convertTimestampsToISO(data);
        console.log(`[WalletService] Wallet ${doc.id} data after timestamp conversion:`, JSON.parse(JSON.stringify(convertedData)));
        
        // Basic validation for core fields
        if (typeof convertedData.name !== 'string' || 
            typeof convertedData.balance !== 'number' || 
            typeof convertedData.tokenType !== 'string' ||
            typeof convertedData.creatorId !== 'string'
            // Members and transactions should ideally be arrays, but we'll handle defaulting them
           ) {
            console.error(`[WalletService] Wallet ${doc.id} has missing or malformed core fields (name, balance, tokenType, creatorId). Skipping. Actual data:`, convertedData);
            return; // Skip this document
        }

        // Ensure members and transactions are arrays, default to empty if missing/null, but log error
        const membersArray = Array.isArray(convertedData.members) ? convertedData.members : [];
        if (!Array.isArray(convertedData.members)) {
            console.warn(`[WalletService] Wallet ${doc.id} 'members' field is not an array or is missing. Defaulting to empty. Actual value:`, convertedData.members);
        }

        const transactionsArray = Array.isArray(convertedData.transactions) ? convertedData.transactions : [];
         if (!Array.isArray(convertedData.transactions)) {
            console.warn(`[WalletService] Wallet ${doc.id} 'transactions' field is not an array or is missing. Defaulting to empty. Actual value:`, convertedData.transactions);
        }

        walletsList.push({
          id: doc.id,
          name: convertedData.name,
          balance: convertedData.balance,
          tokenType: convertedData.tokenType,
          creatorId: convertedData.creatorId,
          members: membersArray.map(m => ({ // Ensure member objects are somewhat structured
              id: m.id || `unknown-member-${Math.random().toString(36).substring(7)}`,
              name: m.name || "Unknown Member",
              verificationStatus: m.verificationStatus || "unverified",
              ...m // spread other potential fields like creditScore
          })) as Member[], 
          transactions: transactionsArray.map(t => ({ // Ensure transaction objects are somewhat structured
              id: t.id || `unknown-tx-${Math.random().toString(36).substring(7)}`,
              type: t.type || "unknown",
              amount: typeof t.amount === 'number' ? t.amount : 0,
              date: t.date || new Date().toISOString(), // default to now if date is missing post-conversion
              description: t.description || "No description",
              ...t // spread other potential fields
          })) as Transaction[],
        });
        console.log(`[WalletService] Successfully processed and added wallet ${doc.id} to list.`);
      } catch (docError) {
        console.error(`[WalletService] Error processing document ${doc.id}:`, docError, "Raw data for this doc:", doc.data());
      }
    });
    console.log('[WalletService] Finished processing. Wallets list count:', walletsList.length, 'Wallets:', JSON.parse(JSON.stringify(walletsList)));
    return walletsList;
  } catch (error) {
    console.error("[WalletService] General error fetching wallets collection (e.g., permissions, network): ", error);
    throw new Error("Could not fetch wallets due to a general error.");
  }
}

export async function getWalletById(id: string): Promise<GroupWallet | undefined> {
  console.log(`[WalletService] Attempting to fetch wallet by ID: ${id}`);
  try {
    const walletDocRef = doc(db, 'wallets', id);
    const walletDoc = await getDoc(walletDocRef);

    if (walletDoc.exists()) {
      const data = walletDoc.data();
      console.log(`[WalletService] Raw data for wallet ${id}:`, JSON.parse(JSON.stringify(data)));
      const convertedData = convertTimestampsToISO(data);
      console.log(`[WalletService] Converted data for wallet ${id}:`, JSON.parse(JSON.stringify(convertedData)));

      // Similar validation and defaulting as in getWallets
      if (typeof convertedData.name !== 'string' || 
          typeof convertedData.balance !== 'number' ||
          typeof convertedData.tokenType !== 'string' ||
          typeof convertedData.creatorId !== 'string'
          ) {
          console.error(`[WalletService] Wallet ${id} (fetched by ID) has missing or malformed core fields. Returning undefined.`);
          return undefined;
      }
      
      const membersArray = Array.isArray(convertedData.members) ? convertedData.members : [];
      if (!Array.isArray(convertedData.members)) {
            console.warn(`[WalletService] Wallet ${id} 'members' field (fetched by ID) is not an array or is missing. Defaulting to empty.`);
      }
      const transactionsArray = Array.isArray(convertedData.transactions) ? convertedData.transactions : [];
      if (!Array.isArray(convertedData.transactions)) {
            console.warn(`[WalletService] Wallet ${id} 'transactions' field (fetched by ID) is not an array or is missing. Defaulting to empty.`);
      }

      const wallet = { 
        id: walletDoc.id,
        name: convertedData.name,
        balance: convertedData.balance,
        tokenType: convertedData.tokenType,
        creatorId: convertedData.creatorId,
        members: membersArray.map(m => ({
              id: m.id || `unknown-member-${Math.random().toString(36).substring(7)}`,
              name: m.name || "Unknown Member",
              verificationStatus: m.verificationStatus || "unverified",
              ...m
          })) as Member[],
        transactions: transactionsArray.map(t => ({
              id: t.id || `unknown-tx-${Math.random().toString(36).substring(7)}`,
              type: t.type || "unknown",
              amount: typeof t.amount === 'number' ? t.amount : 0,
              date: t.date || new Date().toISOString(),
              description: t.description || "No description",
              ...t
          })) as Transaction[],
      };
      console.log(`[WalletService] Wallet ${id} (fetched by ID) after conversion and defaulting:`, JSON.parse(JSON.stringify(wallet)));
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

interface CreateWalletData {
  name: string;
  tokenType: string;
  creatorId: string; 
}

export async function createWallet(walletData: CreateWalletData): Promise<string> {
  console.log('[WalletService] Attempting to create wallet with data:', walletData);
  try {
    const walletsCollection = collection(db, 'wallets');
    // Ensure the creator is added as a member with a valid structure
    const creatorMember: Member = {
      id: walletData.creatorId,
      name: `User ${walletData.creatorId.substring(0, 8)}...`, // Placeholder name, consider fetching actual user name if available
      verificationStatus: 'pending', // Default status
      // creditScore and hashedPii are optional and can be omitted
    };

    const newWalletDocData = {
      name: walletData.name,
      tokenType: walletData.tokenType,
      creatorId: walletData.creatorId,
      balance: 0,
      members: [creatorMember], 
      transactions: [] as Transaction[], // Ensure transactions is an empty array
      createdAt: Timestamp.now() 
    };
    console.log('[WalletService] Data to be saved for new wallet:', newWalletDocData);
    const docRef = await addDoc(walletsCollection, newWalletDocData);
    console.log('[WalletService] Wallet created successfully with ID:', docRef.id);
    return docRef.id;
  } catch (error) {
    console.error("[WalletService] Error creating wallet: ", error);
    // It's good practice to log the actual error object for more details
    if (error instanceof Error) {
        console.error("[WalletService] Firestore error details:", error.message, error.stack);
    }
    throw new Error(`Could not create wallet. Firestore error: ${error instanceof Error ? error.message : String(error)}`);
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

