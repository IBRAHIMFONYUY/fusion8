"use server";

import { courseContentSummarization } from "@/ai/flows/course-content-summarization";

/**
 * Generates an AI-powered summary for a given piece of content.
 * @param prevState - The previous state of the form.
 * @param content - The text content to be summarized.
 * @returns An object containing the summary or an error message.
 */
export async function getAiSummaryAction(prevState: { summary?: string; error?: string }, content: string): Promise<{ summary?: string; error?: string }> {
  if (!content) {
    return { error: 'Content is empty.' };
  }
  
  try {
    const result = await courseContentSummarization({ content });
    return { summary: result.summary };
  } catch (error) {
    console.error("AI summary generation failed:", error);
    return { error: 'Failed to generate summary. Please try again later.' };
  }
}
