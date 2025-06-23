
'use server';

/**
 * @fileOverview AI agent that generates a credit score for a member based on their contribution and repayment history.
 *
 * - generateCreditScore - A function that generates a credit score for a member.
 * - GenerateCreditScoreInput - The input type for the generateCreditScore function.
 * - GenerateCreditScoreOutput - The return type for the generateCreditScore function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { getWallets } from '@/services/walletService';
import { getPersonalTransactions } from '@/services/personalLedgerService';
import type { Transaction } from '@/types';

// The Input now only requires a memberId. The flow will fetch the history.
const GenerateCreditScoreInputSchema = z.object({
  memberId: z.string().describe('The unique identifier of the member.'),
});
export type GenerateCreditScoreInput = z.infer<typeof GenerateCreditScoreInputSchema>;

const GenerateCreditScoreOutputSchema = z.object({
  creditScore: z
    .number()
    .describe(
      'A numeric credit score between 0 and 100 representing the creditworthiness of the member.'
    ),
  reasoning: z
    .string()
    .describe(
      'The reasoning behind the assigned credit score, based on the provided history.'
    ),
});
export type GenerateCreditScoreOutput = z.infer<typeof GenerateCreditScoreOutputSchema>;

export async function generateCreditScore(input: GenerateCreditScoreInput): Promise<GenerateCreditScoreOutput> {
  return generateCreditScoreFlow(input);
}

// The prompt's input schema remains the same, as the flow will prepare the data for it.
const PromptInputSchema = z.object({
  contributionHistory: z
    .string()
    .describe(
      'The contribution history of the member, including dates and amounts contributed.'
    ),
  repaymentHistory: z
    .string()
    .describe(
      'The repayment history of the member, including dates and amounts repaid.'
    ),
  memberId: z.string().describe('The unique identifier of the member.'),
});


const generateCreditScorePrompt = ai.definePrompt({
  name: 'generateCreditScorePrompt',
  input: { schema: PromptInputSchema },
  output: { schema: GenerateCreditScoreOutputSchema },
  prompt: `You are an AI assistant that generates credit scores for SACCO members.

  Given the contribution and repayment history of a member, generate a credit score between 0 and 100.
  A higher score indicates better creditworthiness.
  Also, provide a brief explanation of your reasoning for the assigned score.

  Member ID: {{{memberId}}}
  Contribution History: {{{contributionHistory}}}
  Repayment History: {{{repaymentHistory}}}

  Consider these factors when creating the credit score and reasoning:
  - Timeliness of contributions and repayments
  - Consistency and amount of contributions and repayments
  - Length of transaction history
  - Number and status of loans taken
  - Any defaults or late payments (which would be evident from loan data)
`,
});

const generateCreditScoreFlow = ai.defineFlow(
  {
    name: 'generateCreditScoreFlow',
    inputSchema: GenerateCreditScoreInputSchema,
    outputSchema: GenerateCreditScoreOutputSchema,
  },
  async (input) => {
    // 1. Fetch all transaction data
    const [allWallets, allPersonalTxs] = await Promise.all([
      getWallets(),
      getPersonalTransactions(),
    ]);

    const memberId = input.memberId;

    // 2. Aggregate all transactions for the member
    const memberTransactions: Transaction[] = [];
    allWallets.forEach(wallet => {
      const memberWalletTxs = (wallet.transactions || []).filter(tx => tx.memberId === memberId);
      memberTransactions.push(...memberWalletTxs);
    });
    const memberPersonalTxs = allPersonalTxs.filter(tx => tx.memberId === memberId);
    memberTransactions.push(...memberPersonalTxs);

    // 3. Categorize and format transactions for the prompt
    const contributions = memberTransactions.filter(tx => tx.type === 'contribution' || tx.type === 'personal_deposit');
    const repayments = memberTransactions.filter(tx => tx.type === 'loan_repayment');

    const contributionHistory = contributions.length > 0
      ? contributions.map(tx => `On ${new Date(tx.date as string).toLocaleDateString()}, deposited/contributed ${tx.amount.toLocaleString()}.`).join('\n')
      : 'No contribution or deposit history found.';
    
    const repaymentHistory = repayments.length > 0
      ? repayments.map(tx => `On ${new Date(tx.date as string).toLocaleDateString()}, repaid ${tx.amount.toLocaleString()} for a loan.`).join('\n')
      : 'No loan repayment history found.';

    // 4. Call the prompt with the automatically-generated history
    const { output } = await generateCreditScorePrompt({
      memberId: memberId,
      contributionHistory: contributionHistory,
      repaymentHistory: repaymentHistory,
    });
    
    return output!;
  }
);
