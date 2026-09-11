import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const R2_PUBLIC_BASE_URL = 'https://pub-7ca92debbf604b7bb0c88ae6e9d4e4df.r2.dev';

export const POST: APIRoute = async ({ request }) => {
  try {
    const storage = env.STORAGE;
    if (!storage) {
      return new Response(JSON.stringify({ error: 'Bucket R2 non disponibile o binding STORAGE mancante' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file || !(file instanceof File)) {
      return new Response(JSON.stringify({ error: 'Nessun file valido fornito nel campo "file"' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Genera nome file univoco, sicuro e pulito
    const originalName = file.name || 'image.avif';
    const extension = originalName.includes('.') ? originalName.split('.').pop()?.toLowerCase() : 'avif';
    const cleanBaseName = originalName
      .replace(/\.[^/.]+$/, '')
      .toLowerCase()
      .replace(/[^a-z0-9]/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 40);

    const uniqueId = crypto.randomUUID().slice(0, 8);
    const filename = `${Date.now()}-${uniqueId}-${cleanBaseName}.${extension}`;
    const contentType = file.type || 'image/avif';

    // Upload diretto sul bucket R2
    const fileBuffer = await file.arrayBuffer();
    await storage.put(filename, fileBuffer, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    const publicUrl = `${R2_PUBLIC_BASE_URL}/${filename}`;

    return new Response(JSON.stringify({
      success: true,
      url: publicUrl,
      filename,
      contentType,
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error: any) {
    console.error('[API UPLOAD ERROR]:', error);
    return new Response(JSON.stringify({ error: error.message || 'Errore durante upload su Cloudflare R2' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
