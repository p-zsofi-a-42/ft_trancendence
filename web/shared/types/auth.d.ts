declare module '#auth-utils' {
  interface User {
    id: string
    name: string
    email: string
  }

  // Server-only data between password check and TOTP verification; 
  // never sent to the client.
  interface SecureSessionData {
    pendingTotpUserId?: string
  }
}
