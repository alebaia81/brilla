import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

export const GET: APIRoute = async () => {
  try {
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database D1 non disponibile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const { results } = await db.prepare('SELECT * FROM categorie ORDER BY ordine ASC, creato_il ASC').all();

    return new Response(JSON.stringify(results || []), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API CATEGORIE GET ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore lettura categorie' }), {
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

    const body: any = await request.json();
    const id = body.id || crypto.randomUUID();
    const nome = (body.nome || '').trim();
    const slug = (body.slug || '').trim() || nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const tipo_categoria = body.tipo_categoria || body.tipo || 'cartoleria';
    const descrizione = body.descrizione != null ? String(body.descrizione).trim() : null;
    const ordine = parseInt(body.ordine, 10) || 0;

    await db.prepare(`
      INSERT INTO categorie (id, nome, slug, tipo_categoria, descrizione, ordine, creato_il)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
    `).bind(id, nome, slug, tipo_categoria, descrizione, ordine).run();

    return new Response(JSON.stringify({
      success: true,
      category: { id, nome, slug, tipo_categoria, tipo: tipo_categoria, descrizione, ordine }
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API CATEGORIE POST ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore creazione categoria' }), {
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
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID categoria obbligatorio' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const nome = (body.nome || '').trim();
    const slug = (body.slug || '').trim() || nome.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');
    const tipo_categoria = body.tipo_categoria || body.tipo || 'cartoleria';
    const descrizione = body.descrizione != null ? String(body.descrizione).trim() : null;

    await db.prepare(`
      UPDATE categorie SET
        nome = ?,
        slug = ?,
        tipo_categoria = ?,
        descrizione = ?
      WHERE id = ?
    `).bind(nome, slug, tipo_categoria, descrizione, id).run();

    return new Response(JSON.stringify({
      success: true,
      category: { id, nome, slug, tipo_categoria, tipo: tipo_categoria, descrizione }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API CATEGORIE PUT ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore modifica categoria' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const db = env.DB;
    if (!db) {
      return new Response(JSON.stringify({ error: 'Database D1 non disponibile' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');
    if (!id) {
      return new Response(JSON.stringify({ error: 'ID categoria mancante' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    await db.prepare('DELETE FROM categorie WHERE id = ?').bind(id).run();

    return new Response(JSON.stringify({ success: true, id }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API CATEGORIE DELETE ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore eliminazione categoria' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
