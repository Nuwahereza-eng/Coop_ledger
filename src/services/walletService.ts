
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, getDoc, Timestamp, addDoc, updateDoc, arrayUnion, runTransaction } from 'firebase/firestore';
import type { GroupWallet, Member, Transaction, Repayment } from '@/types';
import { sha256, serializeTransactionForHashing, GENESIS_HASH } from '@/lib/crypto';
import { addPersonalTransaction } from './personalLedgerService';


// #region Hashing and Serialization
// Hashing and serialization moved to lib/crypto.ts
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
        
        const convertedData = convertTimestampsToISO(data);
        
        if (typeof convertedData.name !== 'string' || 
            typeof convertedData.balance !== 'number' || 
            typeof convertedData.tokenType !== 'string' ||
            !convertedData.creatorId
           ) {
            console.warn(`[WalletService] Wallet document ${doc.id} is missing core fields (name, balance, tokenType, creatorId) or is empty. Please check or delete this document in your Firestore database. Skipping.`, {id: doc.id, data: convertedData});
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
      } catch (docError) {
        console.error(`[WalletService] Error processing document ${doc.id}:`, docError, "Raw data for this doc:", doc.data());
      }
    }
    console.log('[WalletService] Finished processing. Wallets list count:', walletsList.length);
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
      const convertedData = convertTimestampsToISO(data);

      if (typeof convertedData.name !== 'string' || 
          typeof convertedData.balance !== 'number' ||
          typeof convertedData.tokenType !== 'string' ||
          !convertedData.creatorId
          ) {
          console.warn(`[WalletService] Wallet ${id} (fetched by ID) has missing or malformed core fields. Returning undefined. Please check this document in Firestore.`);
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
  creatorName: string;
}

export async function createWallet(walletData: CreateWalletData): Promise<string> {
    console.log('[WalletService] Attempting to create wallet with data:', walletData);
    const creatorMember: Member = {
        id: walletData.creatorId,
        name: walletData.creatorName,
        role: 'admin', // Creator is admin of the wallet by default
        verificationStatus: 'pending', // Creator still needs to verify
        personalWalletBalance: 0 // This should be looked up, but default for now
    };

    const genesisTransaction: Omit<Transaction, 'hash'> = {
        id: `txn-genesis-${new Date().getTime()}`,
        type: 'wallet_creation',
        amount: 0,
        date: Timestamp.now(), // Use Firestore Timestamp
        description: `Wallet "${walletData.name}" created by ${walletData.creatorName}.`,
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
        console.error("[WalletService] Error creating wallet document in Firestore: ", error);
        if (error instanceof Error) {
            console.error("[WalletService] Firestore error details:", error.message, error.stack);
        }
        throw new Error(`Could not create wallet. Firestore error: ${error instanceof Error ? error.message : String(error)}`);
    }
}


export type NewTransactionInput = Omit<Transaction, 'id' | 'hash' | 'previousHash' | 'date' | 'walletId'>;

export async function addTransactionToWallet(walletId: string, transactionInput: NewTransactionInput): Promise<void> {
    const walletRef = doc(db, 'wallets', walletId);

    try {
        await runTransaction(db, async (firestoreTransaction) => {
            const walletDoc = await firestoreTransaction.get(walletRef);
            if (!walletDoc.exists()) {
                throw new Error("Wallet not found!");
            }

            const walletData = walletDoc.data();
            
            const currentTransactionsWithTimestamps = (walletData.transactions || []) as (Transaction & {date: Timestamp})[];

            const lastTransaction = currentTransactionsWithTimestamps.length > 0
                ? [...currentTransactionsWithTimestamps].sort((a, b) => b.date.toMillis() - a.date.toMillis())[0]
                : null;


            const previousHash = lastTransaction?.hash ?? GENESIS_HASH;

            const newTransactionData: Omit<Transaction, 'hash'> = {
                ...transactionInput,
                id: `txn-${new Date().getTime()}-${Math.random().toString(16).slice(2)}`,
                date: Timestamp.now(), // Use Firestore Timestamp
                previousHash: previousHash,
                walletId: walletId,
            };

            const hash = await sha256(serializeTransactionForHashing(newTransactionData));
            const finalNewTransaction: Transaction & { date: Timestamp } = {
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

export async function addMemberToWallet(walletId: string, member: Member): Promise<void> {
  const walletRef = doc(db, 'wallets', walletId);

  try {
    await runTransaction(db, async (firestoreTransaction) => {
      const walletDoc = await firestoreTransaction.get(walletRef);
      if (!walletDoc.exists()) {
        throw new Error("Wallet not found!");
      }

      const walletData = walletDoc.data();
      
      const memberExists = (walletData.members || []).some((m: Member) => m.id === member.id);
      if (memberExists) {
        console.log(`[WalletService] Member ${member.id} is already in wallet ${walletId}. Nothing to do.`);
        return; 
      }

      const currentTransactionsWithTimestamps = (walletData.transactions || []) as (Transaction & {date: Timestamp})[];
      const lastTransaction = currentTransactionsWithTimestamps.length > 0
          ? [...currentTransactionsWithTimestamps].sort((a, b) => b.date.toMillis() - a.date.toMillis())[0]
          : null;
      const previousHash = lastTransaction?.hash ?? GENESIS_HASH;

      const joinTransaction: Omit<Transaction, 'hash'> = {
          id: `txn-join-${new Date().getTime()}-${Math.random().toString(16).slice(2)}`,
          type: 'member_join',
          amount: 0,
          date: Timestamp.now(),
          description: `Member ${member.name} joined the wallet.`,
          previousHash: previousHash,
          walletId: walletId,
          memberId: member.id,
      };

      const hash = await sha256(serializeTransactionForHashing(joinTransaction));
      const finalJoinTransaction: Transaction & { date: Timestamp } = {
          ...joinTransaction,
          hash: hash,
      };
      
      console.log("[WalletService] Adding new member and join transaction:", member, finalJoinTransaction);

      firestoreTransaction.update(walletRef, {
          members: arrayUnion(member),
          transactions: arrayUnion(finalJoinTransaction),
      });
    });
    console.log(`[WalletService] Member ${member.id} successfully added to wallet ${walletId}.`);
  } catch (error) {
    console.error(`[WalletService] Error adding member to wallet ${walletId}:`, error);
    throw new Error(`Could not add member. Firestore error: ${error instanceof Error ? error.message : String(error)}`);
  }
}

export async function withdrawMyContributions(walletId: string, memberId: string, amount: number): Promise<void> {
    await runTransaction(db, async (firestoreTransaction) => {
        const walletRef = doc(db, 'wallets', walletId);
        const walletDoc = await firestoreTransaction.get(walletRef);
        if (!walletDoc.exists()) throw new Error("Wallet not found!");
        const walletData = walletDoc.data() as GroupWallet;

        // 1. Verify member and calculate their total contributions
        const memberContributions = (walletData.transactions || [])
            .filter(tx => tx.type === 'contribution' && tx.memberId === memberId)
            .reduce((sum, tx) => sum + tx.amount, 0);
        
        const memberWithdrawals = (walletData.transactions || [])
            .filter(tx => tx.type === 'group_withdrawal' && tx.memberId === memberId)
            .reduce((sum, tx) => sum + Math.abs(tx.amount), 0); // withdrawals are negative

        const netContributions = memberContributions - memberWithdrawals;

        if (amount > netContributions) {
            throw new Error(`Withdrawal amount of ${amount.toLocaleString()} exceeds your net contributions of ${netContributions.toLocaleString()}.`);
        }
        if (amount > walletData.balance) {
            throw new Error("Withdrawal amount exceeds wallet's total balance.");
        }

        // 2. Create wallet withdrawal transaction
        const currentTransactionsWithTimestamps = (walletData.transactions || []) as (Transaction & {date: Timestamp})[];
        const lastTransaction = currentTransactionsWithTimestamps.length > 0
            ? [...currentTransactionsWithTimestamps].sort((a, b) => b.date.toMillis() - a.date.toMillis())[0]
            : null;
        const previousHash = lastTransaction?.hash ?? GENESIS_HASH;

        const withdrawalTx: Omit<Transaction, 'hash'> = {
            id: `txn-mbr-wthdrw-${new Date().getTime()}-${Math.random().toString(16).slice(2)}`,
            type: 'group_withdrawal',
            amount: -amount, // Negative from group wallet
            date: Timestamp.now(),
            description: `Member withdrawal by ${walletData.members.find(m => m.id === memberId)?.name}.`,
            previousHash: previousHash,
            walletId: walletId,
            memberId: memberId,
        };
        const hash = await sha256(serializeTransactionForHashing(withdrawalTx));
        const finalTx: Transaction & { date: Timestamp } = { ...withdrawalTx, hash };

        // 3. Update wallet balance and transactions
        const newBalance = walletData.balance - amount;
        firestoreTransaction.update(walletRef, {
            balance: newBalance,
            transactions: arrayUnion(finalTx)
        });

        // 4. Create personal deposit transaction for the member (will update their personal balance in UI)
        await addPersonalTransaction({
            memberId: memberId,
            type: 'personal_deposit',
            amount: amount, // Positive to personal wallet
            description: `Received from personal withdrawal from "${walletData.name}"`
        });
    });
}
