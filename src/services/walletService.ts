
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, Timestamp, addDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import type { GroupWallet, Member, Transaction, Repayment } from '@/types';


// #region Hashing and Serialization
async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

function serializeTransactionForHashing(tx: Omit<Transaction, 'hash'>): string {
    // Creates a stable, string representation of a transaction for hashing.
    // The order of keys is important for consistent hashes.
    const dataToHash = {
        id: tx.id,
        walletId: tx.walletId,
        memberId: tx.memberId,
        type: tx.type,
        amount: tx.amount,
        date: tx.date,
        description: tx.description,
        previousHash: tx.previousHash,
        relatedLoanId: tx.relatedLoanId,
        relatedContributionId: tx.relatedContributionId,
    };
    return JSON.stringify(dataToHash, Object.keys(dataToHash).sort());
}

const GENESIS_HASH = "0".repeat(64);
// #endregion


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

    for (const doc of walletSnapshot.docs) {
      try {
        const data = doc.data();
        console.log(`[WalletService] Processing wallet ${doc.id}. Raw data:`, JSON.parse(JSON.stringify(data)));
        
        const convertedData = convertTimestampsToISO(data);
        console.log(`[WalletService] Wallet ${doc.id} data after timestamp conversion:`, JSON.parse(JSON.stringify(convertedData)));
        
        if (typeof convertedData.name !== 'string' || 
            typeof convertedData.balance !== 'number' || 
            typeof convertedData.tokenType !== 'string' ||
            typeof convertedData.creatorId !== 'string'
           ) {
            console.error(`[WalletService] Wallet ${doc.id} has missing or malformed core fields (name, balance, tokenType, creatorId). Skipping. Actual data:`, convertedData);
            continue;
        }

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
          members: membersArray.map((m: any) => ({
              id: m.id || `unknown-member-${Math.random().toString(36).substring(7)}`,
              name: m.name || "Unknown Member",
              verificationStatus: m.verificationStatus || "unverified",
              ...m
          })) as Member[], 
          transactions: transactionsArray.map((t: any) => ({
              id: t.id || `unknown-tx-${Math.random().toString(36).substring(7)}`,
              type: t.type || "unknown",
              amount: typeof t.amount === 'number' ? t.amount : 0,
              date: t.date || new Date().toISOString(),
              description: t.description || "No description",
              ...t
          })) as Transaction[],
        });
        console.log(`[WalletService] Successfully processed and added wallet ${doc.id} to list.`);
      } catch (docError) {
        console.error(`[WalletService] Error processing document ${doc.id}:`, docError, "Raw data for this doc:", doc.data());
      }
    }
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
        members: membersArray.map((m: any) => ({
              id: m.id || `unknown-member-${Math.random().toString(36).substring(7)}`,
              name: m.name || "Unknown Member",
              verificationStatus: m.verificationStatus || "unverified",
              ...m
          })) as Member[],
        transactions: transactionsArray.map((t: any) => ({
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
    const creatorMember: Member = {
        id: walletData.creatorId,
        name: `User ${walletData.creatorId.substring(0, 8)}...`,
        verificationStatus: 'pending',
    };

    const genesisTransaction: Omit<Transaction, 'hash'> = {
        id: `txn-genesis-${new Date().getTime()}`,
        type: 'wallet_creation',
        amount: 0,
        date: new Date().toISOString(),
        description: `Wallet "${walletData.name}" created by ${walletData.creatorId}.`,
        previousHash: GENESIS_HASH,
        memberId: walletData.creatorId
    };

    const finalGenesisTx: Transaction = {
        ...genesisTransaction,
        hash: await sha256(serializeTransactionForHashing(genesisTransaction))
    };

    const newWalletDocData = {
        name: walletData.name,
        tokenType: walletData.tokenType,
        creatorId: walletData.creatorId,
        balance: 0,
        members: [creatorMember],
        transactions: [finalGenesisTx],
        createdAt: Timestamp.now()
    };

    try {
        const docRef = await addDoc(collection(db, 'wallets'), newWalletDocData);
        console.log('[WalletService] Wallet created successfully with ID:', docRef.id);
        return docRef.id;
    } catch (error) {
        console.error("[WalletService] Error creating wallet: ", error);
        if (error instanceof Error) {
            console.error("[WalletService] Firestore error details:", error.message, error.stack);
        }
        throw new Error(`Could not create wallet. Firestore error: ${error instanceof Error ? error.message : String(error)}`);
    }
}

export type NewTransactionInput = Omit<Transaction, 'id' | 'hash' | 'previousHash' | 'date'>;

export async function addTransactionToWallet(walletId: string, transactionInput: NewTransactionInput): Promise<void> {
    const walletRef = doc(db, 'wallets', walletId);

    try {
        await runTransaction(db, async (firestoreTransaction) => {
            const walletDoc = await firestoreTransaction.get(walletRef);
            if (!walletDoc.exists()) {
                throw new Error("Wallet not found!");
            }

            const walletData = walletDoc.data();
            const currentTransactions = (walletData.transactions || []) as Transaction[];

            const lastTransaction = currentTransactions.length > 0 ? currentTransactions[currentTransactions.length - 1] : null;
            const previousHash = lastTransaction?.hash ?? GENESIS_HASH;

            const newTransactionData: Omit<Transaction, 'hash'> = {
                ...transactionInput,
                id: `txn-${new Date().getTime()}-${Math.random().toString(16).slice(2)}`,
                date: new Date().toISOString(),
                previousHash: previousHash,
                walletId: walletId,
            };

            const hash = await sha256(serializeTransactionForHashing(newTransactionData));
            const finalNewTransaction: Transaction = {
                ...newTransactionData,
                hash: hash,
            };

            const newBalance = walletData.balance + finalNewTransaction.amount;
            
            console.log("[WalletService] Adding new transaction:", finalNewTransaction);
            console.log(`[WalletService] Updating balance from ${walletData.balance} to ${newBalance}`);

            firestoreTransaction.update(walletRef, {
                transactions: arrayUnion(finalNewTransaction),
                balance: newBalance,
            });
        });
        console.log(`[WalletService] Transaction successfully added to wallet ${walletId}.`);
    } catch (error) {
        console.error(`[WalletService] Error adding transaction to wallet ${walletId}:`, error);
        throw new Error(`Could not add transaction. Firestore error: ${error instanceof Error ? error.message : String(error)}`);
    }
}
