/**
 * Utility per integrazione PayPal REST API v1/v2
 * Gestione URL di base, autenticazione OAuth2 e credenziali ambiente
 */

/**
 * Restituisce l'URL di base delle API PayPal in base all'ambiente configurato.
 * @param envVal Valore stringa dell'ambiente ('live' o 'sandbox')
 */
export function getPayPalBaseUrl(envVal?: string): string {
  const normalized = (envVal || '').trim().toLowerCase();
  if (normalized === 'live' || normalized === 'production') {
    return 'https://api-m.paypal.com';
  }
  return 'https://api-m.sandbox.paypal.com';
}

/**
 * Richiede un token di accesso OAuth2 alle API PayPal tramite client_credentials.
 * @param clientId Client ID dell'applicazione PayPal
 * @param clientSecret Secret Key dell'applicazione PayPal
 * @param baseUrl URL base di PayPal (sandbox o live)
 */
export async function getPayPalAccessToken(
  clientId: string,
  clientSecret: string,
  baseUrl: string
): Promise<string> {
  const cleanClientId = (clientId || '').trim();
  const cleanClientSecret = (clientSecret || '').trim();

  if (!cleanClientId || !cleanClientSecret) {
    throw new Error('Credenziali PayPal mancanti: PAYPAL_CLIENT_ID o PAYPAL_CLIENT_SECRET non configurati.');
  }

  // Log temporaneo di debug per verificare endpoint ed ID a runtime
  console.log('[PAYPAL DEBUG] Using URL:', baseUrl, 'with Client ID:', cleanClientId.slice(0, 8) + '...');

  // Codifica in Base64 per Basic Auth (compatibile con Web API e Node.js)
  const credentials = `${cleanClientId}:${cleanClientSecret}`;
  const auth = typeof btoa === 'function' 
    ? btoa(credentials) 
    : Buffer.from(credentials).toString('base64');

  const response = await fetch(`${baseUrl}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error('[PAYPAL OAUTH ERROR]:', response.status, errorText);
    throw new Error(`Errore autenticazione PayPal (${response.status}): ${errorText}`);
  }

  const data = (await response.json()) as { access_token?: string };
  if (!data.access_token) {
    throw new Error('Access token non presente nella risposta PayPal.');
  }

  return data.access_token;
}

/**
 * Helper per estrarre la configurazione PayPal supportando runtime Cloudflare Pages,
 * Astro import.meta.env e process.env.
 */
export function getPayPalConfig(locals?: any, cfWorkerEnv?: any) {
  let rEnv: any = {};
  let pEnv: any = {};
  try {
    if (locals && (locals as any).runtime) {
      rEnv = (locals as any).runtime.env || {};
    }
  } catch {}
  try {
    if (locals && (locals as any).platform) {
      pEnv = (locals as any).platform.env || {};
    }
  } catch {}

  const workerEnv = cfWorkerEnv || {};

  const clientId =
    pEnv.PAYPAL_CLIENT_ID ||
    pEnv.PUBLIC_PAYPAL_CLIENT_ID ||
    rEnv.PAYPAL_CLIENT_ID ||
    rEnv.PUBLIC_PAYPAL_CLIENT_ID ||
    workerEnv.PAYPAL_CLIENT_ID ||
    workerEnv.PUBLIC_PAYPAL_CLIENT_ID ||
    import.meta.env.PAYPAL_CLIENT_ID ||
    import.meta.env.PUBLIC_PAYPAL_CLIENT_ID ||
    (typeof process !== 'undefined' ? (process.env?.PAYPAL_CLIENT_ID || process.env?.PUBLIC_PAYPAL_CLIENT_ID) : undefined) ||
    '';

  const clientSecret =
    pEnv.PAYPAL_CLIENT_SECRET ||
    rEnv.PAYPAL_CLIENT_SECRET ||
    workerEnv.PAYPAL_CLIENT_SECRET ||
    import.meta.env.PAYPAL_CLIENT_SECRET ||
    (typeof process !== 'undefined' ? process.env?.PAYPAL_CLIENT_SECRET : undefined) ||
    '';

  const paypalEnv =
    pEnv.PAYPAL_ENV ||
    pEnv.PUBLIC_PAYPAL_ENV ||
    rEnv.PAYPAL_ENV ||
    rEnv.PUBLIC_PAYPAL_ENV ||
    workerEnv.PAYPAL_ENV ||
    workerEnv.PUBLIC_PAYPAL_ENV ||
    import.meta.env.PAYPAL_ENV ||
    import.meta.env.PUBLIC_PAYPAL_ENV ||
    (typeof process !== 'undefined' ? (process.env?.PAYPAL_ENV || process.env?.PUBLIC_PAYPAL_ENV) : undefined) ||
    'sandbox';

  return {
    clientId: String(clientId).trim(),
    clientSecret: String(clientSecret).trim(),
    paypalEnv: String(paypalEnv).trim(),
  };
}
