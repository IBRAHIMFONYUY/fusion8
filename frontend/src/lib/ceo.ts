// Shared CEO/platform-admin identity check. Pure function, no I/O, safe to
// import from both client and server code — callers resolve the admin
// email/uid from whichever env vars are appropriate for their context
// (NEXT_PUBLIC_-prefixed on the client, unprefixed on the server).
export function isCEO(
  email: string | null | undefined,
  uid: string,
  adminEmail: string,
  adminUid: string
): boolean {
  if (adminUid && uid === adminUid) return true;
  return !!email && !!adminEmail && email.toLowerCase() === adminEmail.toLowerCase();
}
