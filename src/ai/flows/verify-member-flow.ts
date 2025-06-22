
'use server';
/**
 * @fileOverview An AI agent that verifies a member's identity.
 *
 * - verifyMember - A function that analyzes ID documents and a liveness photo to verify a member.
 * - VerifyMemberInput - The input type for the verifyMember function.
 * - VerifyMemberOutput - The return type for the verifyMember function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

const VerifyMemberInputSchema = z.object({
  idFrontDataUri: z.string().describe("A data URI of the front of the user's ID document. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  idBackDataUri: z.string().describe("A data URI of the back of the user's ID document. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  livenessPhotoDataUri: z.string().describe("A data URI of the user's selfie for liveness check. Expected format: 'data:<mimetype>;base64,<encoded_data>'."),
  piiHash: z.string().describe("The one-way hash of the user's PII for record-keeping."),
});
export type VerifyMemberInput = z.infer<typeof VerifyMemberInputSchema>;

const VerifyMemberOutputSchema = z.object({
  isVerified: z.boolean().describe('Whether the identity verification was successful.'),
  reasoning: z
    .string()
    .describe('The reasoning behind the verification decision, highlighting checks performed.'),
  error: z.string().optional().describe('Any error message if the process failed.'),
});
export type VerifyMemberOutput = z.infer<typeof VerifyMemberOutputSchema>;

export async function verifyMember(input: VerifyMemberInput): Promise<VerifyMemberOutput> {
  return verifyMemberFlow(input);
}

const prompt = ai.definePrompt({
  name: 'verifyMemberPrompt',
  input: { schema: VerifyMemberInputSchema },
  output: { schema: VerifyMemberOutputSchema },
  prompt: `You are an automated KYC (Know Your Customer) verification agent. Your task is to verify a user's identity based on the provided documents.

You must perform the following checks:
1.  **Face Match**: Compare the face in the liveness photo with the face on the ID document. They must be the same person.
2.  **Document Check**: Examine the front and back of the ID. It must look like a legitimate government-issued identification document. Check for signs of tampering or forgery.
3.  **Liveness Check**: The liveness photo must be a clear, forward-facing picture of a real person, not a photo of a screen or another picture.

Based on these checks, decide if the user is verified.

- If all checks pass, set 'isVerified' to true and provide a success reasoning (e.g., "Face match successful and ID appears valid.").
- If any check fails, set 'isVerified' to false and provide a clear reason for the rejection (e.g., "Face on ID does not match liveness photo.", "ID document appears to be a screenshot and not a real document.", "Liveness photo is blurry.").

Do not attempt to read or extract any personal text like name, ID number, or date of birth. Your only job is to perform the visual checks.

Here is the data:
- Front of ID: {{media url=idFrontDataUri}}
- Back of ID: {{media url=idBackDataUri}}
- Liveness Photo: {{media url=livenessPhotoDataUri}}
`,
});

const verifyMemberFlow = ai.defineFlow(
  {
    name: 'verifyMemberFlow',
    inputSchema: VerifyMemberInputSchema,
    outputSchema: VerifyMemberOutputSchema,
  },
  async (input) => {
    try {
      const { output } = await prompt(input);
      return output!;
    } catch (e) {
        console.error("[verifyMemberFlow] Error during AI verification:", e);
        return {
            isVerified: false,
            reasoning: "The AI verification service failed to process the request. This could be due to an issue with the provided images or a temporary service outage.",
            error: e instanceof Error ? e.message : "An unknown error occurred.",
        }
    }
  }
);
