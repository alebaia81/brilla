import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getPayPalBaseUrl, getPayPalAccessToken, getPayPalConfig } from '../../../lib/paypal';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Recupero variabili d'ambiente PayPal (Cloudflare Pages locals.runtime.env, cloudflare:workers env, import.meta.env o fallback)
    const { clientId, clientSecret, paypalEnv } = getPayPalConfig(locals, env);

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ 
          error: 'Credenziali PayPal non configurate nel server.' 
        }), 
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 2. Lettura e validazione dell'importo dal body JSON
    const body: any = await request.json().catch(() => ({}));
    const rawTotal = body.totale ?? body.total ?? body.amount ?? body.importo;
    const total = Number(rawTotal);

    if (isNaN(total) || total <= 0) {
      return new Response(
        JSON.stringify({ 
          error: 'Importo non valido o inferiore/uguale a 0.' 
        }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Ottenimento token di autenticazione PayPal OAuth2
    const baseUrl = getPayPalBaseUrl(paypalEnv);
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, baseUrl);

    // 4. Chiamata alle API PayPal per creazione ordine
    const paypalResponse = await fetch(`${baseUrl}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [
          {
            amount: {
              currency_code: 'EUR',
              value: total.toFixed(2),
            },
            description: body.descrizione || 'Ordine Brilla Cafe',
          },
        ],
      }),
    });

    if (!paypalResponse.ok) {
      const errorText = await paypalResponse.text();
      console.error('[PAYPAL CREATE ORDER ERROR]:', paypalResponse.status, errorText);
      return new Response(
        JSON.stringify({ 
          error: 'Errore durante la creazione dell\'ordine su PayPal', 
          details: errorText 
        }), 
        {
          status: paypalResponse.status || 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const orderData: any = await paypalResponse.json();

    // 5. Risposta con l'ID dell'ordine generato da PayPal
    return new Response(
      JSON.stringify({ id: orderData.id }), 
      {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[API PAYPAL CREATE-ORDER ERROR]:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Errore interno creazione ordine' }), 
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
