
'use server';
/**
 * @fileOverview An AI agent that calculates a member's loan limit.
 *
 * - calculateLoanLimit - A function that analyzes a member's financial history to determine a safe loan limit.
 * - CalculateLoanLimitInput - The input type for the calculateLoanLimit function.
 * - CalculateLoanLimitOutput - The return type for the calculateLoanLimit function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getUserById } from '@/services/userService';
import { getWallets } from '@/services/walletService';
import type { Member, Transaction } from '@/types';

const CalculateLoanLimitInputSchema = z.object({
  memberId: z.string().describe('The unique identifier of the member.'),
});
export type CalculateLoanLimitInput = z.infer<typeof CalculateLoanLimitInputSchema>;

const CalculateLoanLimitOutputSchema = z.object({
  loanLimit: z
    .number()
    .describe('A numeric loan limit, representing the maximum amount the member is eligible to borrow.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the assigned loan limit, based on the provided history.'),
});
export type CalculateLoanLimitOutput = z.infer<typeof CalculateLoanLimitOutputSchema>;

export async function calculateLoanLimit(input: CalculateLoanLimitInput): Promise<CalculateLoanLimitOutput> {
  return calculateLoanLimitFlow(input);
}

// This prompt defines the AI's task.
const prompt = ai.definePrompt({
  name: 'calculateLoanLimitPrompt',
  input: {
    schema: z.object({
        memberDetails: z.string(),
        contributionHistory: z.string(),
    }),
  },
  output: { schema: CalculateLoanLimitOutputSchema },
  prompt: `You are a cautious but fair loan officer for a community SACCO. Your primary goal is to empower members while ensuring the financial stability of the group.

You will calculate a safe loan limit for a member based on their financial data.

Analyze the member's details and contribution history. A higher credit score and consistent, significant contributions should result in a higher limit. The limit should generally not exceed 50% of their total contributions unless their credit score is exceptionally high (e.g., >85).

MEMBER DETAILS:
{{{memberDetails}}}

CONTRIBUTION HISTORY (from the blockchain ledger):
{{{contributionHistory}}}

Based on this data, provide a numeric 'loanLimit' and a brief 'reasoning' for your decision.`,
});

// This flow orchestrates the data fetching and AI call.
const calculateLoanLimitFlow = ai.defineFlow(
  {
    name: 'calculateLoanLimitFlow',
    inputSchema: CalculateLoanLimitInputSchema,
    outputSchema: CalculateLoanLimitOutputSchema,
  },
  async (input) => {
    // 1. Fetch all necessary data
    const member = await getUserById(input.memberId);
    if (!member) {
      throw new Error(`Member with ID ${input.memberId} not found.`);
    }

    const allWallets = await getWallets();
    const memberContributions: Transaction[] = [];

    allWallets.forEach(wallet => {
        const contributions = (wallet.transactions || []).filter(
            tx => tx.type === 'contribution' && tx.memberId === input.memberId
        );
        memberContributions.push(...contributions);
    });

    // 2. Format the data for the prompt
    const memberDetails = JSON.stringify({
      id: member.id,
      name: member.name,
      creditScore: member.creditScore,
      personalWalletBalance: member.personalWalletBalance,
      verificationStatus: member.verificationStatus,
    }, null, 2);

    const contributionHistory = memberContributions.length > 0 
        ? memberContributions.map(tx => `- On ${new Date(tx.date as string).toLocaleDateString()}: contributed ${tx.amount} to wallet ${tx.walletId?.substring(0,6)}...`).join('\n')
        : 'No contribution history found.';

    // 3. Call the AI model
    const { output } = await prompt({
        memberDetails: memberDetails,
        contributionHistory: contributionHistory
    });

    return output!;
  }
);
