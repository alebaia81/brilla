import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

// Helper per mappare i campi booleani da SQLite (1/0) a booleani JS (true/false)
function mapProduct(row: any) {
  if (!row) return row;
  return {
    ...row,
    disponibile: row.disponibile === 1 || row.disponibile === true,
    in_evidenza: row.in_evidenza === 1 || row.in_evidenza === true,
    in_edicola_questo_mese: row.in_edicola_questo_mese === 1 || row.in_edicola_questo_mese === true,
    prezzo: Number(row.prezzo) || 0,
    prezzo_scontato: row.prezzo_scontato != null ? Number(row.prezzo_scontato) : null,
    sconto_percentuale: row.sconto_percentuale != null ? Number(row.sconto_percentuale) : 0,
    quantita_disponibile: row.quantita_disponibile != null ? Number(row.quantita_disponibile) : 0,
  };
}

export const GET: APIRoute = async ({ request }) => {
  try {
    const db = typeof env !== 'undefined' ? env?.DB : undefined;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database D1 non disponibile o binding DB mancante' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const slug = url.searchParams.get('slug');
    const isPublic = url.searchParams.get('pubblico') === 'true';

    if (slug) {
      const stmt = db.prepare('SELECT * FROM prodotti WHERE slug = ? LIMIT 1').bind(slug);
      const row = await stmt.first();
      if (!row) {
        return new Response(JSON.stringify({ error: 'Prodotto non trovato' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        });
      }
      return new Response(JSON.stringify(mapProduct(row)), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    let query = 'SELECT * FROM prodotti';
    if (isPublic) {
      query += ' WHERE disponibile = 1 AND quantita_disponibile > 0';
    }
    query += ' ORDER BY creato_il DESC';

    const { results } = await db.prepare(query).all();
    const mapped = (results || []).map(mapProduct);

    return new Response(JSON.stringify(mapped), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API PRODOTTI GET ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore server interno' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const POST: APIRoute = async ({ request }) => {
  try {
    const db = typeof env !== 'undefined' ? env?.DB : undefined;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database D1 non disponibile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: any = await request.json();
    const id = body.id || crypto.randomUUID();
    const nome = (body.nome || '').trim();
    const slug = (body.slug || '').trim() || nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const descrizione = body.descrizione != null ? String(body.descrizione).trim() : null;
    const marca = body.marca != null ? String(body.marca).trim() : null;
    const tipo_prodotto = body.tipo_prodotto || 'cartoleria';
    const categoria_id = body.categoria_id ? String(body.categoria_id) : null;
    const prezzo = Number(body.prezzo) || 0;
    const sconto_percentuale = Number(body.sconto_percentuale) || 0;
    const prezzo_scontato = sconto_percentuale > 0 
      ? Number((prezzo * (1 - sconto_percentuale / 100)).toFixed(2)) 
      : null;
    const immagine_url = body.immagine_url || null;
    const sku = body.sku || null;
    const quantita_disponibile = Math.max(0, parseInt(body.quantita_disponibile, 10) || 0);
    const in_evidenza = body.in_evidenza ? 1 : 0;
    const in_edicola_questo_mese = body.in_edicola_questo_mese ? 1 : 0;
    const periodicita = body.periodicita || null;
    const disponibile = (body.disponibile !== false && quantita_disponibile > 0) ? 1 : 0;

    const stmt = db.prepare(`
      INSERT INTO prodotti (
        id, categoria_id, nome, slug, descrizione, marca, tipo_prodotto,
        prezzo, sconto_percentuale, prezzo_scontato, immagine_url, sku,
        quantita_disponibile, in_evidenza, in_edicola_questo_mese, periodicita,
        disponibile, creato_il, aggiornato_il
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))
    `).bind(
      id, categoria_id, nome, slug, descrizione, marca, tipo_prodotto,
      prezzo, sconto_percentuale, prezzo_scontato, immagine_url, sku,
      quantita_disponibile, in_evidenza, in_edicola_questo_mese, periodicita,
      disponibile
    );

    await stmt.run();

    return new Response(JSON.stringify({ success: true, id, slug }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API PRODOTTI POST ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore creazione prodotto' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const PUT: APIRoute = async ({ request }) => {
  try {
    const db = typeof env !== 'undefined' ? env?.DB : undefined;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database D1 non disponibile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const body: any = await request.json();
    const id = body?.id;
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID prodotto obbligatorio' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Supporta aggiornamento parziale (es. toggle veloce del solo stato `disponibile`)
    if (typeof body === 'object' && body !== null && Object.keys(body).length === 2 && 'disponibile' in body) {
      const dispValue = body.disponibile ? 1 : 0;
      await db.prepare("UPDATE prodotti SET disponibile = ?, aggiornato_il = datetime('now') WHERE id = ?")
        .bind(dispValue, id)
        .run();

      return new Response(JSON.stringify({ success: true }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const nome = (body.nome || '').trim();
    const slug = (body.slug || '').trim() || nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const descrizione = body.descrizione != null ? String(body.descrizione).trim() : null;
    const marca = body.marca != null ? String(body.marca).trim() : null;
    const tipo_prodotto = body.tipo_prodotto || 'cartoleria';
    const categoria_id = body.categoria_id ? String(body.categoria_id) : null;
    const prezzo = Number(body.prezzo) || 0;
    const sconto_percentuale = Number(body.sconto_percentuale) || 0;
    const prezzo_scontato = sconto_percentuale > 0 
      ? Number((prezzo * (1 - sconto_percentuale / 100)).toFixed(2)) 
      : null;
    const immagine_url = body.immagine_url || null;
    const quantita_disponibile = Math.max(0, parseInt(body.quantita_disponibile, 10) || 0);
    const in_evidenza = body.in_evidenza ? 1 : 0;
    const in_edicola_questo_mese = body.in_edicola_questo_mese ? 1 : 0;
    const periodicita = body.periodicita || null;
    const disponibile = (body.disponibile !== false && quantita_disponibile > 0) ? 1 : 0;

    const stmt = db.prepare(`
      UPDATE prodotti SET
        categoria_id = ?,
        nome = ?,
        slug = ?,
        descrizione = ?,
        marca = ?,
        tipo_prodotto = ?,
        prezzo = ?,
        sconto_percentuale = ?,
        prezzo_scontato = ?,
        immagine_url = ?,
        quantita_disponibile = ?,
        in_evidenza = ?,
        in_edicola_questo_mese = ?,
        periodicita = ?,
        disponibile = ?,
        aggiornato_il = datetime('now')
      WHERE id = ?
    `).bind(
      categoria_id, nome, slug, descrizione, marca, tipo_prodotto,
      prezzo, sconto_percentuale, prezzo_scontato, immagine_url,
      quantita_disponibile, in_evidenza, in_edicola_questo_mese, periodicita,
      disponibile, id
    );

    await stmt.run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API PRODOTTI PUT ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore aggiornamento prodotto' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const db = typeof env !== 'undefined' ? env?.DB : undefined;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database D1 non disponibile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    let id = url.searchParams.get('id');

    if (!id) {
      try {
        const body: any = await request.json();
        id = body?.id;
      } catch (e) {
        // Nessun body json
      }
    }

    if (!id) {
      return new Response(JSON.stringify({ error: 'ID prodotto obbligatorio per eliminazione' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.prepare('DELETE FROM prodotti WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API PRODOTTI DELETE ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore eliminazione prodotto' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
