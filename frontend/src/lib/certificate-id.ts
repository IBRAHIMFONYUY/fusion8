// Shared, Node/browser-agnostic certificate ID generator. Used both by the
// server action that issues certificates and the client-side PDF generator,
// so they always agree on the same ID for a given student+course. Avoids
// `btoa` (browser-only) so it runs identically in Server Actions.
export function generateCertificateId(studentId: string, courseId: string): string {
  const timestamp = Date.now().toString(36).toUpperCase();
  const input = `${studentId}:${courseId}`;

  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    hash = (hash * 31 + input.charCodeAt(i)) >>> 0;
  }
  const hashStr = hash.toString(36).toUpperCase().padStart(8, '0').slice(0, 8);

  return `F8-${hashStr}-${timestamp}`;
}
