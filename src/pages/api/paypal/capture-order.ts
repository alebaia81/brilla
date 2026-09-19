import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';
import { getPayPalBaseUrl, getPayPalAccessToken, getPayPalConfig } from '../../../lib/paypal';

export const prerender = false;

/**
 * Ottiene il riferimento al database Cloudflare D1
 */
function getDb(locals: any): any {
  try {
    const rEnv = (locals as any)?.runtime?.env;
    if (rEnv?.DB || rEnv?.['brilla-cafe-db']) {
      return rEnv.DB || rEnv['brilla-cafe-db'];
    }
  } catch {}
  try {
    if (typeof env !== 'undefined' && env) {
      return (env as any).DB || (env as any)['brilla-cafe-db'];
    }
  } catch {}
  return undefined;
}

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // 1. Connessione al database D1
    const db = getDb(locals);

    // 2. Recupero configurazione PayPal
    const { clientId, clientSecret, paypalEnv } = getPayPalConfig(locals, env);

    if (!clientId || !clientSecret) {
      return new Response(
        JSON.stringify({ error: 'Credenziali PayPal non configurate nel server.' }), 
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 3. Lettura payload dalla richiesta
    const body: any = await request.json().catch(() => ({}));
    const orderID = String(body.orderID || body.orderId || body.id || '').trim();
    const carrello = Array.isArray(body.carrello) 
      ? body.carrello 
      : (Array.isArray(body.cart) ? body.cart : (Array.isArray(body.articoli) ? body.articoli : []));
    const cliente = body.cliente || body.customer || {};

    if (!orderID) {
      return new Response(
        JSON.stringify({ error: 'Parametro orderID mancante.' }), 
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // 4. Cattura dell'ordine tramite PayPal API
    const baseUrl = getPayPalBaseUrl(paypalEnv);
    const accessToken = await getPayPalAccessToken(clientId, clientSecret, baseUrl);

    const captureResponse = await fetch(`${baseUrl}/v2/checkout/orders/${orderID}/capture`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });

    const captureData: any = await captureResponse.json();

    if (!captureResponse.ok) {
      console.error('[PAYPAL CAPTURE ERROR]:', captureResponse.status, captureData);
      return new Response(
        JSON.stringify({
          error: 'Errore durante la cattura del pagamento PayPal',
          details: captureData,
        }),
        {
          status: captureResponse.status || 500,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    const status = captureData.status;

    // 5. Se la cattura ha avuto successo, inserimento nel database D1
    if (status === 'COMPLETED') {
      const orderId = crypto.randomUUID();
      const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
      const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
      const numeroOrdine = `ORD-${dateStr}-${randomSuffix}`;

      // Sanitizzazione parametri cliente e importo
      const clienteNome = String(
        cliente.nome || cliente.cliente_nome || 
        `${captureData.payer?.name?.given_name || ''} ${captureData.payer?.name?.surname || ''}`.trim() || 
        'Cliente'
      ).trim();

      const clienteEmail = String(
        cliente.email || cliente.cliente_email || 
        captureData.payer?.email_address || 
        ''
      ).trim() || null;

      const clienteTelefono = String(
        cliente.telefono || cliente.cliente_telefono || cliente.phone || 
        'Non specificato'
      ).trim();

      const tipoOrdine = String(
        cliente.tipo_ordine || cliente.tipo || body.tipo_ordine || 'ritiro'
      ).trim().toLowerCase() === 'spedizione'
        ? 'spedizione'
        : 'ritiro';

      const dataRitiro = tipoOrdine === 'ritiro' ? (cliente.data_ritiro || cliente.data || null) : null;
      const fasciaRitiro = tipoOrdine === 'ritiro' ? (cliente.fascia || null) : null;
      const indirizzoSpedizione = tipoOrdine === 'spedizione' ? (cliente.indirizzo || null) : null;
      const cittaSpedizione = tipoOrdine === 'spedizione' ? (cliente.citta || null) : null;
      const capSpedizione = tipoOrdine === 'spedizione' ? (cliente.cap || null) : null;

      // Calcolo subtotale articoli reale dal carrello
      let calculatedSubtotal = 0;
      if (carrello && Array.isArray(carrello) && carrello.length > 0) {
        calculatedSubtotal = carrello.reduce((acc: number, item: any) => {
          const p = Number(item.prezzo_unitario ?? item.prezzo ?? item.price ?? 0);
          const q = Math.max(1, parseInt(item.quantita || item.quantity || 1, 10));
          return acc + (p * q);
        }, 0);
      } else {
        calculatedSubtotal = Number(body.subtotale ?? 0);
      }
      const subtotaleArticoli = Number(calculatedSubtotal.toFixed(2));

      // Regole spese di spedizione:
      // - Ritiro in Negozio: sempre 0,00 €
      // - Spedizione a Domicilio: subtotale < 50.00 € => 6,50 €, subtotale >= 50.00 € => 0,00 €
      const costoSpedizione = tipoOrdine === 'ritiro' 
        ? 0.0 
        : (subtotaleArticoli >= 50.0 ? 0.0 : 6.50);

      const capturedAmount = Number(
        captureData.purchase_units?.[0]?.payments?.captures?.[0]?.amount?.value ||
        captureData.purchase_units?.[0]?.amount?.value ||
        body.totale || body.total || 0
      );

      const totaleOrdine = subtotaleArticoli > 0 
        ? Number((subtotaleArticoli + costoSpedizione).toFixed(2))
        : Number(capturedAmount.toFixed(2));

      const totaleArticoli = subtotaleArticoli > 0 
        ? subtotaleArticoli 
        : Math.max(0, Number((totaleOrdine - costoSpedizione).toFixed(2)));

      const statoOrdine = 'pagato';
      const creatoIl = new Date().toISOString();
      const noteCliente = tipoOrdine === 'spedizione'
        ? `Spedizione: ${indirizzoSpedizione || ''}, ${cittaSpedizione || ''} ${capSpedizione || ''}`
        : `Ritiro: ${dataRitiro || ''} - Fascia: ${fasciaRitiro || ''}`;

      if (!db) {
        console.error('[D1 INSERT ERROR]: Database D1 non disponibile (binding DB mancante in runtime).');
        throw new Error('Database D1 non disponibile nel runtime.');
      }

      try {
        const batchStatements: any[] = [];

        // 1. Inserimento testata ordine nella tabella ordini
        batchStatements.push(
          db.prepare(`
            INSERT INTO ordini (
              id, numero_ordine, cliente_nome, cliente_email, cliente_telefono,
              tipo_ordine, stato, data_ritiro_prevista, fascia_ritiro,
              indirizzo_spedizione, citta_spedizione, cap_spedizione,
              costo_spedizione, totale_articoli, totale_ordine, note_cliente,
              pagamento_id_paypal, data_pagamento, creato_il, aggiornato_il
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
          `).bind(
            orderId, numeroOrdine, clienteNome, clienteEmail, clienteTelefono,
            tipoOrdine, statoOrdine, dataRitiro, fasciaRitiro,
            indirizzoSpedizione, cittaSpedizione, capSpedizione,
            costoSpedizione, totaleArticoli, totaleOrdine, noteCliente,
            orderID, creatoIl
          )
        );

        // 2. Inserimento articoli ordine nel carrello
        if (carrello && Array.isArray(carrello) && carrello.length > 0) {
          for (const item of carrello) {
            const itemId = crypto.randomUUID();
            const prodId = item.prodotto_id || item.id ? String(item.prodotto_id || item.id) : null;
            const nomeProd = String(item.nome_prodotto || item.nome || item.title || 'Prodotto').trim();
            const quantita = Math.max(1, parseInt(item.quantita || item.quantity || 1, 10));
            const prezzoUnitario = Number(item.prezzo_unitario ?? item.prezzo ?? item.price ?? 0);
            const subtotale = Number((prezzoUnitario * quantita).toFixed(2));

            batchStatements.push(
              db.prepare(`
                INSERT INTO ordine_articoli (
                  id, ordine_id, prodotto_id, nome_prodotto, quantita, prezzo_unitario, subtotale, creato_il
                ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
              `).bind(itemId, orderId, prodId, nomeProd, quantita, prezzoUnitario, subtotale)
            );

            // Aggiorna giacenza se presente il prodotto
            if (prodId) {
              batchStatements.push(
                db.prepare(`
                  UPDATE prodotti 
                  SET 
                    quantita_disponibile = MAX(0, quantita_disponibile - ?),
                    disponibile = CASE WHEN (quantita_disponibile - ?) <= 0 THEN 0 ELSE disponibile END,
                    aggiornato_il = datetime('now')
                  WHERE id = ?
                `).bind(quantita, quantita, prodId)
              );
            }
          }
        }

        // Esecuzione atomica del batch su D1
        console.log(`[D1 BATCH EXECUTE]: Esecuzione di ${batchStatements.length} statement SQL per ordine ${numeroOrdine}...`);
        await db.batch(batchStatements);
        console.log(`[D1 INSERT SUCCESS]: Ordine #${numeroOrdine} (ID: ${orderId}) registrato con successo in D1.`);
      } catch (sqlErr: any) {
        console.error('[D1 INSERT ERROR]:', sqlErr);
        throw new Error(`Errore durante il salvataggio su D1: ${sqlErr?.message || sqlErr}`);
      }

      // 6. Restituzione risposta di successo
      return new Response(
        JSON.stringify({
          success: true,
          orderId,
          numeroOrdine,
          paypalOrderId: orderID,
          status,
        }),
        {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        }
      );
    }

    // Se lo stato di cattura non è COMPLETED
    return new Response(
      JSON.stringify({
        success: false,
        status,
        paypalOrderId: orderID,
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  } catch (error: any) {
    console.error('[API PAYPAL CAPTURE-ORDER ERROR]:', error);
    return new Response(
      JSON.stringify({ error: error.message || 'Errore durante la cattura dell\'ordine' }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    );
  }
};
