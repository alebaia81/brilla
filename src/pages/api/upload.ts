import type { APIRoute } from 'astro';
import { env } from 'cloudflare:workers';

export const prerender = false;

const DEFAULT_R2_PUBLIC_BASE_URL = 'https://pub-5d4c665fcec4447e98cc82b828a0e174.r2.dev';

export const POST: APIRoute = async ({ request, locals }) => {
  try {
    // Risoluzione flessibile del binding R2:
    // Supporta sia locals.runtime.env.STORAGE (e alias prodotti/brilla-prodotti)
    // sia l'import standard da 'cloudflare:workers'
    let storage: any = undefined;

    try {
      const runtimeEnv = (locals as any)?.runtime?.env;
      if (runtimeEnv) {
        storage = runtimeEnv.STORAGE || runtimeEnv.prodotti || runtimeEnv['brilla-prodotti'];
      }
    } catch {
      // Ignora se locals.runtime.env non è accessibile o deprecato nel runtime corrente
    }

    if (!storage && typeof env !== 'undefined' && env) {
      storage = env.STORAGE || (env as any).prodotti || (env as any)['brilla-prodotti'];
    }

    if (!storage) {
      return new Response(JSON.stringify({ 
        error: 'Bucket R2 non disponibile o binding (STORAGE / prodotti) mancante nel runtime Cloudflare' 
      }), {
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

    // Risoluzione flessibile del dominio pubblico R2:
    // 1. Variabile d'ambiente runtime (Cloudflare Pages settings)
    // 2. Variabile d'ambiente build/Astro (PUBLIC_R2_URL / R2_PUBLIC_URL)
    // 3. Fallback di sicurezza al nuovo dominio pubblico ufficiale
    let r2PublicBase = DEFAULT_R2_PUBLIC_BASE_URL;
    try {
      const runtimeEnv = (locals as any)?.runtime?.env;
      const envUrl = runtimeEnv?.PUBLIC_R2_URL || runtimeEnv?.R2_PUBLIC_URL ||
        ((typeof env !== 'undefined' && env) ? ((env as any).PUBLIC_R2_URL || (env as any).R2_PUBLIC_URL) : undefined) ||
        import.meta.env.PUBLIC_R2_URL ||
        import.meta.env.R2_PUBLIC_URL;
      if (envUrl && typeof envUrl === 'string' && envUrl.trim() !== '') {
        r2PublicBase = envUrl.trim().replace(/\/$/, '');
      }
    } catch {
      // Fallback a DEFAULT_R2_PUBLIC_BASE_URL
    }

    // Upload diretto sul bucket R2
    const fileBuffer = await file.arrayBuffer();
    await storage.put(filename, fileBuffer, {
      httpMetadata: {
        contentType,
        cacheControl: 'public, max-age=31536000, immutable',
      },
    });

    const publicUrl = `${r2PublicBase}/${filename}`;

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
