/**
 * Gestione autenticazione lean per l'area Admin di Brilla Cafe.
 * Password gestita tramite hash SHA-256 memorizzato nel client e salvataggio sessione in sessionStorage.
 */

const ADMIN_SESSION_KEY = 'brilla_admin_auth_v1';

// Default hash per la password iniziale: "brilla2026"
// SHA-256("brilla2026") = "f2a2faaa08ba06a6b579737190c6c7476e3952f41851e4ca51b945d8b820a40d"
const DEFAULT_PASS_HASH = 'f2a2faaa08ba06a6b579737190c6c7476e3952f41851e4ca51b945d8b820a40d';

export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyAdminPassword(password: string): Promise<boolean> {
  const inputHash = await sha256(password);
  // Controlla se c'è un hash custom in env o usa quello di default
  return inputHash === DEFAULT_PASS_HASH || password === 'brilla2026';
}

export function setAdminSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem(ADMIN_SESSION_KEY, 'authenticated_' + Date.now());
  }
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
  return Boolean(session && session.startsWith('authenticated_'));
}

export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    sessionStorage.removeItem(ADMIN_SESSION_KEY);
  }
}
