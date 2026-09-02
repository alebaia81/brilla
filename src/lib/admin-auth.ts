/**
 * Gestione autenticazione lean per l'area Admin di Brilla Cafe.
 * Supporta memorizzazione sicura su localStorage e sessionStorage per persistenza affidabile.
 */

const ADMIN_SESSION_KEY = 'brilla_admin_auth_v1';

export function verifyAdminPassword(password: string): boolean {
  const clean = (password || '').trim().toLowerCase();
  return (
    clean === 'brilla2026' ||
    clean === 'brilla' ||
    clean === 'brillacafe' ||
    clean === 'admin' ||
    clean === 'brilla sas'
  );
}

export function setAdminSession(): void {
  if (typeof window !== 'undefined') {
    try {
      const token = 'authenticated_' + Date.now();
      localStorage.setItem(ADMIN_SESSION_KEY, token);
      sessionStorage.setItem(ADMIN_SESSION_KEY, token);
    } catch (e) {
      console.warn('Storage non disponibile:', e);
    }
  }
}

export function isAdminAuthenticated(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    const local = localStorage.getItem(ADMIN_SESSION_KEY);
    const session = sessionStorage.getItem(ADMIN_SESSION_KEY);
    const val = local || session;
    return Boolean(val && val.startsWith('authenticated_'));
  } catch (e) {
    return false;
  }
}

export function clearAdminSession(): void {
  if (typeof window !== 'undefined') {
    try {
      localStorage.removeItem(ADMIN_SESSION_KEY);
      sessionStorage.removeItem(ADMIN_SESSION_KEY);
    } catch (e) {
      console.warn('Storage error on clear:', e);
    }
  }
}
