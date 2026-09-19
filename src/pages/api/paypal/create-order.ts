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

    // 2. Lettura e validazione dei dati dell'ordine
    const body: any = await request.json().catch(() => ({}));
    const carrello = Array.isArray(body.carrello) 
      ? body.carrello 
      : (Array.isArray(body.cart) ? body.cart : (Array.isArray(body.articoli) ? body.articoli : []));
    
    const tipoOrdine = String(
      body.tipo_ordine || body.tipo || body.cliente?.tipo_ordine || 'ritiro'
    ).trim().toLowerCase() === 'spedizione' ? 'spedizione' : 'ritiro';

    // Ricalcolo del subtotale articoli dal carrello se fornito
    let calculatedSubtotal = 0;
    if (carrello.length > 0) {
      calculatedSubtotal = carrello.reduce((acc: number, item: any) => {
        const price = Number(item.prezzo_unitario ?? item.prezzo ?? item.price ?? 0);
        const qty = Math.max(1, parseInt(item.quantita || item.quantity || 1, 10));
        return acc + (price * qty);
      }, 0);
    } else {
      calculatedSubtotal = Number(body.subtotale ?? body.totale ?? body.total ?? body.amount ?? 0);
    }
    const subtotal = Number(calculatedSubtotal.toFixed(2));

    // Regola spese di spedizione:
    // - Ritiro in Negozio: sempre 0,00 €
    // - Spedizione a Domicilio: subtotale < 50.00 € => 6,50 €, subtotale >= 50.00 € => 0,00 €
    const shipping = tipoOrdine === 'ritiro' 
      ? 0.0 
      : (subtotal >= 50.0 ? 0.0 : 6.50);

    const total = Number((subtotal + shipping).toFixed(2));

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

    // 4. Chiamata alle API PayPal per creazione ordine con breakdown esatto
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
              breakdown: {
                item_total: {
                  currency_code: 'EUR',
                  value: subtotal.toFixed(2),
                },
                shipping: {
                  currency_code: 'EUR',
                  value: shipping.toFixed(2),
                },
              },
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
