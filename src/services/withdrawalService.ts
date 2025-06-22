
import { db } from '@/lib/firebase';
import { collection, getDocs, doc, query, where, Timestamp, addDoc, updateDoc, runTransaction, arrayUnion } from 'firebase/firestore';
import type { WithdrawalProposal, GroupWallet, Transaction } from '@/types';
import { sha256, serializeTransactionForHashing, GENESIS_HASH } from '@/lib/crypto';
import { addPersonalTransaction } from './personalLedgerService';

// Helper function to convert Firestore Timestamps to ISO strings for client-side use
function convertTimestampsToISO(data: any): any {
  if (data === null || typeof data !== 'object') return data;
  if (data instanceof Timestamp) return data.toDate().toISOString();
  if (Array.isArray(data)) return data.map(item => convertTimestampsToISO(item));

  const convertedObject: { [key: string]: any } = {};
  for (const key in data) {
    if (Object.prototype.hasOwnProperty.call(data, key)) {
      convertedObject[key] = convertTimestampsToISO(data[key]);
    }
  }
  return convertedObject;
}

export async function getProposalsForWallet(walletId: string): Promise<WithdrawalProposal[]> {
  const proposals: WithdrawalProposal[] = [];
  try {
    const q = query(collection(db, 'withdrawalProposals'), where('walletId', '==', walletId));
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((doc) => {
      proposals.push({ id: doc.id, ...convertTimestampsToISO(doc.data()) } as WithdrawalProposal);
    });
    return proposals.sort((a, b) => new Date(b.requestDate as string).getTime() - new Date(a.requestDate as string).getTime());
  } catch (error) {
    console.error("[WithdrawalService] Error fetching proposals: ", error);
    throw new Error("Could not fetch withdrawal proposals.");
  }
}

type CreateProposalData = {
  walletId: string;
  creatorId: string;
  amount: number;
  reason: string;
}
export async function createWithdrawalProposal(data: CreateProposalData): Promise<string> {
  const newProposal = {
    ...data,
    status: 'voting_in_progress',
    requestDate: Timestamp.now(),
    votesFor: [],
    votesAgainst: [],
    voters: [],
  };
  try {
    const docRef = await addDoc(collection(db, 'withdrawalProposals'), newProposal);
    return docRef.id;
  } catch (error) {
    console.error("[WithdrawalService] Error creating proposal: ", error);
    throw new Error("Could not create withdrawal proposal.");
  }
}

type CastVoteData = {
  proposalId: string;
  memberId: string;
  vote: 'for' | 'against';
}
export async function castVoteOnWithdrawal(data: CastVoteData): Promise<void> {
  await runTransaction(db, async (firestoreTransaction) => {
    const proposalRef = doc(db, 'withdrawalProposals', data.proposalId);
    const proposalDoc = await firestoreTransaction.get(proposalRef);

    if (!proposalDoc.exists() || proposalDoc.data().status !== 'voting_in_progress') {
      throw new Error("This proposal is not currently in a voting phase.");
    }
    const proposalData = proposalDoc.data() as WithdrawalProposal;

    const walletRef = doc(db, 'wallets', proposalData.walletId);
    const walletDoc = await firestoreTransaction.get(walletRef);
    if (!walletDoc.exists()) throw new Error("Source wallet for the proposal not found!");
    
    const walletData = walletDoc.data() as GroupWallet;
    if (!walletData.members.some(m => m.id === data.memberId)) {
        throw new Error("You are not a member of the wallet this proposal belongs to.");
    }
    if ((proposalData.voters || []).includes(data.memberId)) {
        throw new Error("You have already voted on this proposal.");
    }
    if(proposalData.creatorId === data.memberId) {
        throw new Error("You cannot vote on your own proposal.");
    }

    const updatedVoters = [...(proposalData.voters || []), data.memberId];
    let updatedVotesFor = [...(proposalData.votesFor || [])];
    let updatedVotesAgainst = [...(proposalData.votesAgainst || [])];

    if (data.vote === 'for') {
        updatedVotesFor.push(data.memberId);
    } else {
        updatedVotesAgainst.push(data.memberId);
    }

    let newStatus = proposalData.status;
    const totalVotingMembers = walletData.members.length - 1; // Creator doesn't vote
    const approvalThreshold = Math.floor(totalVotingMembers / 2) + 1;

    if (updatedVotesFor.length >= approvalThreshold) {
      newStatus = 'approved';
    } else if (updatedVotesAgainst.length >= (totalVotingMembers - approvalThreshold + 1)) {
      newStatus = 'rejected';
    }

    firestoreTransaction.update(proposalRef, {
      voters: updatedVoters,
      votesFor: updatedVotesFor,
      votesAgainst: updatedVotesAgainst,
      status: newStatus,
    });
  });
}

type ExecuteData = {
    proposalId: string;
    memberId: string;
}
export async function executeWithdrawal({ proposalId, memberId }: ExecuteData): Promise<number> {
    let withdrawnAmount = 0;
    await runTransaction(db, async (firestoreTransaction) => {
        const proposalRef = doc(db, 'withdrawalProposals', proposalId);
        const proposalDoc = await firestoreTransaction.get(proposalRef);
        if (!proposalDoc.exists() || proposalDoc.data().status !== 'approved' || proposalDoc.data().creatorId !== memberId) {
            throw new Error("This withdrawal cannot be executed. It's either not approved or you are not the creator.");
        }
        const proposalData = proposalDoc.data() as WithdrawalProposal;
        withdrawnAmount = proposalData.amount;

        const walletRef = doc(db, 'wallets', proposalData.walletId);
        const walletDoc = await firestoreTransaction.get(walletRef);
        if (!walletDoc.exists()) throw new Error("Source wallet for the proposal not found!");

        const walletData = walletDoc.data() as GroupWallet;
        if (walletData.balance < proposalData.amount) {
            firestoreTransaction.update(proposalRef, { status: 'failed', reason: 'Insufficient funds at time of execution.' });
            throw new Error("Wallet has insufficient funds to complete this withdrawal.");
        }

        // 1. Create wallet withdrawal transaction
        const currentTransactions = (walletData.transactions || []).map(t => convertTimestampsToISO(t)) as (Transaction & {date: string})[];
        const sortedTransactions = currentTransactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        const lastTransaction = sortedTransactions.length > 0 ? sortedTransactions[0] : null;
        const previousHash = lastTransaction?.hash ?? GENESIS_HASH;

        const groupWithdrawalTx: Omit<Transaction, 'hash'> = {
            id: `txn-grp-wthdrw-${Date.now()}`,
            type: 'group_withdrawal',
            amount: -proposalData.amount, // Negative from group wallet
            date: Timestamp.now(),
            description: `DAO-approved withdrawal by ${walletData.members.find(m => m.id === memberId)?.name}. Reason: ${proposalData.reason}`,
            previousHash: previousHash,
            walletId: proposalData.walletId,
            memberId: memberId,
            relatedWithdrawalProposalId: proposalId,
        };
        const hash = await sha256(serializeTransactionForHashing(groupWithdrawalTx));
        const finalTx = { ...groupWithdrawalTx, hash };

        // 2. Update wallet balance and transactions
        const newBalance = walletData.balance - proposalData.amount;
        firestoreTransaction.update(walletRef, {
            balance: newBalance,
            transactions: arrayUnion(finalTx)
        });

        // 3. Create personal deposit transaction for the creator
        await addPersonalTransaction({
            memberId: memberId,
            type: 'personal_deposit',
            amount: proposalData.amount, // Positive to personal wallet
            description: `Received from group withdrawal from "${walletData.name}"`
        });

        // 4. Update proposal status to executed
        firestoreTransaction.update(proposalRef, { status: 'executed' });
    });
    
    // This return happens outside the transaction to ensure it only returns on success.
    return withdrawnAmount;
}
