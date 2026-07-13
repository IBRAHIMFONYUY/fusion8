export function buildLocalSummary(content: string): string {
  const normalized = (content || '').trim();

  if (!normalized) {
    return 'No lesson content is available yet. The report will appear here once the lesson notes are synced.';
  }

  const sentences = normalized
    .split(/(?<=[.!?])\s+/)
    .map((sentence) => sentence.trim())
    .filter(Boolean)
    .slice(0, 3);

  if (sentences.length === 0) {
    return 'The lesson content is available, but it needs a clearer structure before a report can be generated.';
  }

  const corePoints = sentences.map((sentence) => sentence.replace(/\s+/g, ' '));
  return `Key takeaways: ${corePoints.join(' ')}`;
}
