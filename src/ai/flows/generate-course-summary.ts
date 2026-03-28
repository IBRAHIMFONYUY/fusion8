'use server';

/**
 * @fileOverview AI flow to generate a summary of a course or video lesson.
 *
 * - generateCourseSummary - A function that generates a summary of a course or video lesson.
 * - GenerateCourseSummaryInput - The input type for the generateCourseSummary function.
 * - GenerateCourseSummaryOutput - The return type for the generateCourseSummary function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const GenerateCourseSummaryInputSchema = z.object({
  content: z.string().describe('The content of the course or video lesson to summarize.'),
});

export type GenerateCourseSummaryInput = z.infer<typeof GenerateCourseSummaryInputSchema>;

const GenerateCourseSummaryOutputSchema = z.object({
  summary: z.string().describe('The AI-generated summary of the course or video lesson.'),
});

export type GenerateCourseSummaryOutput = z.infer<typeof GenerateCourseSummaryOutputSchema>;

export async function generateCourseSummary(input: GenerateCourseSummaryInput): Promise<GenerateCourseSummaryOutput> {
  return generateCourseSummaryFlow(input);
}

const prompt = ai.definePrompt({
  name: 'generateCourseSummaryPrompt',
  input: {schema: GenerateCourseSummaryInputSchema},
  output: {schema: GenerateCourseSummaryOutputSchema},
  prompt: `You are an AI assistant designed to provide concise and informative summaries of educational content.

  Please summarize the following course or video lesson content, highlighting the key points and main ideas:

  Content: {{{content}}}
  `,
});

const generateCourseSummaryFlow = ai.defineFlow(
  {
    name: 'generateCourseSummaryFlow',
    inputSchema: GenerateCourseSummaryInputSchema,
    outputSchema: GenerateCourseSummaryOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
