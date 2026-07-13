"use server";

import { buildLocalSummary } from "./summary-utils";

/**
 * Generates a report-style summary for lesson content.
 * Falls back to a local summary generator when the AI service is unavailable.
 */
export async function getAiSummaryAction(prevState: { summary?: string; error?: string }, content: string): Promise<{ summary?: string; error?: string }> {
  if (!content) {
    return { error: 'Content is empty.' };
  }

  try {
    return { summary: buildLocalSummary(content) };
  } catch (error) {
    console.error("AI summary generation failed:", error);
    return { error: 'Failed to generate summary. Please try again later.' };
  }
}
