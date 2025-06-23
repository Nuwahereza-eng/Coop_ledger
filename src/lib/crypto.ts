
import type { Transaction } from '@/types';
import { Timestamp } from 'firebase/firestore';

export async function sha256(message: string): Promise<string> {
    const msgBuffer = new TextEncoder().encode(message);
    const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export function serializeTransactionForHashing(tx: Omit<Transaction, 'hash' | 'id'> & { id?: string }): string {
    const dateAsString = tx.date instanceof Timestamp ? tx.date.toDate().toISOString() : String(tx.date);

    const dataToHash = {
        id: tx.id,
        walletId: tx.walletId,
        memberId: tx.memberId,
        type: tx.type,
        amount: tx.amount,
        date: dateAsString, 
        description: tx.description,
        previousHash: tx.previousHash,
        relatedLoanId: tx.relatedLoanId,
        relatedContributionId: tx.relatedContributionId,
    };
    return JSON.stringify(dataToHash, Object.keys(dataToHash).sort());
}

export const GENESIS_HASH = "0".repeat(64);
