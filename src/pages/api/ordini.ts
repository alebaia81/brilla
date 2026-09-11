import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database D1 non disponibile o binding DB mancante' }), {
        status: 500,
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

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = env.DB;
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
    const tipo_ordine = payload.tipo_ordine || 'ritiro';
    const stato = payload.stato || 'in_sospeso';
    const data_ritiro_prevista = payload.data_ritiro_prevista || null;
    const fascia_ritiro = payload.fascia_ritiro || null;
    const indirizzo_spedizione = payload.indirizzo_spedizione || null;
    const citta_spedizione = payload.citta_spedizione || null;
    const cap_spedizione = payload.cap_spedizione || null;
    const costo_spedizione = Number(payload.costo_spedizione) || 0;
    const totale_articoli = Number(payload.totale_articoli) || 0;
    const totale_ordine = Number(payload.totale_ordine) || (totale_articoli + costo_spedizione);
    const note_cliente = payload.note_cliente || null;
    const pagamento_id_paypal = payload.pagamento_id_paypal || null;

    const items: any[] = Array.isArray(payload.articoli) ? payload.articoli : [];

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
      numero_ordine 
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

export const PUT: APIRoute = async ({ request }) => {
  try {
    const db = env.DB;
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
