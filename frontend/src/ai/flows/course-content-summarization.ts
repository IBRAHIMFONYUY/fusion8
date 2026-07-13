'use server';

// DEAD CODE — no callers anywhere in the app; the live "Quick Summary" feature
// uses the local heuristic in src/lib/summary-utils.ts instead. Kept here for
// potential future use, not wired to any UI.

/**
 * @fileOverview AI flow to generate a summary of a course or video lesson.
 *
 * - courseContentSummarization - A function that generates a summary of a course or video lesson.
 * - CourseContentSummarizationInput - The input type for the courseContentSummarization function.
 * - CourseContentSummarizationOutput - The return type for the courseContentSummarization function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const CourseContentSummarizationInputSchema = z.object({
  content: z.string().describe('The content of the course or video lesson to summarize.'),
});

export type CourseContentSummarizationInput = z.infer<typeof CourseContentSummarizationInputSchema>;

const CourseContentSummarizationOutputSchema = z.object({
  summary: z.string().describe('The AI-generated summary of the course or video lesson.'),
});

export type CourseContentSummarizationOutput = z.infer<typeof CourseContentSummarizationOutputSchema>;

export async function courseContentSummarization(input: CourseContentSummarizationInput): Promise<CourseContentSummarizationOutput> {
  return courseContentSummarizationFlow(input);
}

const prompt = ai.definePrompt({
  name: 'courseContentSummarizationPrompt',
  input: {schema: CourseContentSummarizationInputSchema},
  output: {schema: CourseContentSummarizationOutputSchema},
  prompt: `You are an AI assistant designed to provide concise and informative summaries of educational content.\n\nPlease summarize the following course or video lesson content, highlighting the key points and main ideas:\n\nContent: {{{content}}}`,
});

const courseContentSummarizationFlow = ai.defineFlow(
  {
    name: 'courseContentSummarizationFlow',
    inputSchema: CourseContentSummarizationInputSchema,
    outputSchema: CourseContentSummarizationOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
