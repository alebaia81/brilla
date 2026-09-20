import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

function getDb(locals: any): any {
  try {
    const pEnv = (locals as any)?.platform?.env;
    if (pEnv?.DB || pEnv?.['brilla-cafe-db']) {
      return pEnv.DB || pEnv['brilla-cafe-db'];
    }
  } catch {}
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

export const GET: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals);
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database D1 non disponibile o binding DB mancante' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const checkLatest = url.searchParams.get('check_latest') === 'true';
    const lastId = url.searchParams.get('last_id');
    const singleId = 
      url.searchParams.get('id') || 
      url.searchParams.get('orderId') || 
      url.searchParams.get('ordine') || 
      url.searchParams.get('numero_ordine') || 
      url.searchParams.get('numeroOrdine') || 
      url.searchParams.get('codice_ordine') || 
      url.searchParams.get('codiceOrdine');

    // Recupero dettagli di un singolo ordine
    if (singleId) {
      const order = await db.prepare(
        'SELECT * FROM ordini WHERE id = ? OR numero_ordine = ? OR pagamento_id_paypal = ?'
      ).bind(singleId, singleId, singleId).first();

      if (!order) {
        return new Response(JSON.stringify({ error: 'Ordine non trovato' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const itemsRes = await db.prepare(
        'SELECT * FROM ordine_articoli WHERE ordine_id = ?'
      ).bind(order.id).all();

      return new Response(JSON.stringify({
        ...order,
        id: order.id,
        ordineId: order.id,
        orderId: order.id,
        numero_ordine: order.numero_ordine,
        codice_ordine: order.numero_ordine,
        numeroOrdine: order.numero_ordine,
        codiceOrdine: order.numero_ordine,
        totale_ordine: order.totale_ordine,
        totale: order.totale_ordine,
        ordine_articoli: itemsRes.results || [],
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Endpoint ultraleggero di polling: query veloce senza join pesanti
    if (checkLatest) {
      const countRes = await db.prepare('SELECT COUNT(*) as count FROM ordini').first();
      const currentCount = Number(countRes?.count || 0);

      const latestOrder = await db.prepare(
        'SELECT id, numero_ordine, cliente_nome, cliente_telefono, tipo_ordine, stato, totale_ordine, creato_il FROM ordini ORDER BY creato_il DESC LIMIT 1'
      ).first();

      if (!latestOrder) {
        return new Response(JSON.stringify({ has_new: false, total_count: 0, latest: null }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      }

      const clientCount = url.searchParams.get('total_count');
      const hasCountChanged = clientCount !== null && Number(clientCount) < currentCount;
      const hasIdChanged = Boolean(lastId && String(latestOrder.id) !== String(lastId) && lastId !== '__EMPTY__');
      const hasFromEmpty = lastId === '__EMPTY__' && currentCount > 0;
      const hasNew = hasIdChanged || hasCountChanged || hasFromEmpty;

      return new Response(JSON.stringify({
        has_new: hasNew,
        total_count: currentCount,
        latest: latestOrder,
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Carica tutti gli ordini
    const ordersRes = await db.prepare('SELECT * FROM ordini ORDER BY creato_il DESC').all();
    const orders = ordersRes.results || [];

    if (orders.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Carica tutti gli articoli degli ordini
    const itemsRes = await db.prepare('SELECT * FROM ordine_articoli').all();
    const items = itemsRes.results || [];

    // Mappa gli articoli dentro i rispettivi ordini
    const itemsByOrder: Record<string, any[]> = {};
    items.forEach((item: any) => {
      const oid = String(item.ordine_id);
      if (!itemsByOrder[oid]) itemsByOrder[oid] = [];
      itemsByOrder[oid].push(item);
    });

    const combined = orders.map((order: any) => {
      const oid = String(order.id);
      return {
        ...order,
        created_at: order.creato_il || order.created_at, // Compatibilità retroattiva campi data
        ordine_articoli: itemsByOrder[oid] || [],
      };
    });

    return new Response(JSON.stringify(combined), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API ORDINI GET ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore recupero ordini' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals);
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database D1 non disponibile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const payload: any = await request.json();
    const orderId = payload.id || crypto.randomUUID();
    const numero_ordine = payload.numero_ordine || `ORD-${Date.now().toString(36).toUpperCase()}`;
    const cliente_nome = (payload.cliente_nome || '').trim();
    const cliente_email = payload.cliente_email ? String(payload.cliente_email).trim() : null;
    const cliente_telefono = (payload.cliente_telefono || '').trim();
    const tipo_ordine = String(payload.tipo_ordine || 'ritiro').trim().toLowerCase() === 'spedizione' ? 'spedizione' : 'ritiro';
    const stato = payload.stato || 'in_sospeso';
    const data_ritiro_prevista = payload.data_ritiro_prevista || null;
    const fascia_ritiro = payload.fascia_ritiro || null;
    const indirizzo_spedizione = payload.indirizzo_spedizione || null;
    const citta_spedizione = payload.citta_spedizione || null;
    const cap_spedizione = payload.cap_spedizione || null;

    const items: any[] = Array.isArray(payload.articoli) ? payload.articoli : [];

    // Calcolo affidabile del subtotale articoli
    let calcolatoArticoli = 0;
    if (items.length > 0) {
      calcolatoArticoli = items.reduce((acc, item) => {
        const up = Number(item.prezzo_unitario ?? item.prezzo_al_momento ?? item.prezzo ?? 0);
        const q = Math.max(1, parseInt(item.quantita, 10) || 1);
        return acc + (up * q);
      }, 0);
    }
    const totale_articoli = calcolatoArticoli > 0 
      ? Number(calcolatoArticoli.toFixed(2)) 
      : Number(Number(payload.totale_articoli || 0).toFixed(2));

    // Regole spese di spedizione:
    // - Ritiro in Negozio: sempre 0,00 €
    // - Spedizione a Domicilio: subtotale < 50.00 € => 6,50 €, subtotale >= 50.00 € => 0,00 €
    const costo_spedizione = tipo_ordine === 'ritiro'
      ? 0.0
      : (totale_articoli >= 50.0 ? 0.0 : 6.50);

    const totale_ordine = Number((totale_articoli + costo_spedizione).toFixed(2));
    const note_cliente = payload.note_cliente || null;
    const pagamento_id_paypal = payload.pagamento_id_paypal || null;

    // Prepara il batch di dichiarazioni SQL per l'esecuzione transazionale atomica
    const batchStatements: any[] = [];

    // 1. Inserimento testata ordine
    const orderStmt = db.prepare(`
      INSERT INTO ordini (
        id, numero_ordine, cliente_nome, cliente_email, cliente_telefono,
        tipo_ordine, stato, data_ritiro_prevista, fascia_ritiro,
        indirizzo_spedizione, citta_spedizione, cap_spedizione,
        costo_spedizione, totale_articoli, totale_ordine, note_cliente,
        pagamento_id_paypal, creato_il, aggiornato_il
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      orderId, numero_ordine, cliente_nome, cliente_email, cliente_telefono,
      tipo_ordine, stato, data_ritiro_prevista, fascia_ritiro,
      indirizzo_spedizione, citta_spedizione, cap_spedizione,
      costo_spedizione, totale_articoli, totale_ordine, note_cliente,
      pagamento_id_paypal
    );
    batchStatements.push(orderStmt);

    // 2. Inserimento articoli ordine & 3. Scalo scorte per ciascun prodotto
    for (const item of items) {
      const itemId = crypto.randomUUID();
      const prodId = item.prodotto_id || item.id ? String(item.prodotto_id || item.id) : null;
      const nomeProd = item.nome_prodotto || item.nome || 'Prodotto';
      const qty = Math.max(1, parseInt(item.quantita, 10) || 1);
      const unitPrice = Number(item.prezzo_unitario ?? item.prezzo_al_momento ?? item.prezzo ?? 0);
      const sub = Number((unitPrice * qty).toFixed(2));

      // Statement riga articolo
      const itemStmt = db.prepare(`
        INSERT INTO ordine_articoli (
          id, ordine_id, prodotto_id, nome_prodotto, quantita, prezzo_unitario, subtotale, creato_il
        ) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `).bind(itemId, orderId, prodId, nomeProd, qty, unitPrice, sub);
      batchStatements.push(itemStmt);

      // Statement scalo giacenza (se id prodotto presente)
      if (prodId) {
        const updateStockStmt = db.prepare(`
          UPDATE prodotti 
          SET 
            quantita_disponibile = MAX(0, quantita_disponibile - ?),
            disponibile = CASE WHEN (quantita_disponibile - ?) <= 0 THEN 0 ELSE disponibile END,
            aggiornato_il = datetime('now')
          WHERE id = ?
        `).bind(qty, qty, prodId);
        batchStatements.push(updateStockStmt);
      }
    }

    // Esecuzione atomica del batch su Cloudflare D1
    await db.batch(batchStatements);

    return new Response(JSON.stringify({ 
      success: true, 
      id: orderId, 
      orderId,
      ordineId: orderId,
      numero_ordine,
      codice_ordine: numero_ordine,
      numeroOrdine: numero_ordine,
      codiceOrdine: numero_ordine,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API ORDINI POST ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore creazione ordine e transazione' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request, locals }) => {
  try {
    const db = getDb(locals);
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database D1 non disponibile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: any = await request.json();
    const id = body.id;
    const stato = body.stato;

    if (!id || !stato) {
      return new Response(JSON.stringify({ error: 'ID ordine e nuovo stato sono obbligatori' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.prepare("UPDATE ordini SET stato = ?, aggiornato_il = datetime('now') WHERE id = ?")
      .bind(stato, id)
      .run();

    return new Response(JSON.stringify({ success: true, id, stato }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API ORDINI PUT ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore aggiornamento stato ordine' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
