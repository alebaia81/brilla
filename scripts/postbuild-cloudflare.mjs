import { cpSync, existsSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const distDir = resolve(process.cwd(), 'dist');
const serverDir = resolve(distDir, 'server');
const clientDir = resolve(distDir, 'client');
const workerDirInDist = resolve(distDir, '_worker.js');
const workerDirInClient = resolve(clientDir, '_worker.js');

if (!existsSync(distDir)) {
  console.error('[POSTBUILD ERROR]: dist directory not found.');
  process.exit(1);
}

// 1. Prepara la cartella _worker.js da dist/server
if (existsSync(serverDir)) {
  console.log('[POSTBUILD] Preparing _worker.js for Cloudflare Pages...');
  cpSync(serverDir, workerDirInDist, { recursive: true });

  const indexContent = "export * from './entry.mjs';\nexport { default } from './entry.mjs';\n";
  writeFileSync(resolve(workerDirInDist, 'index.js'), indexContent, 'utf-8');
  writeFileSync(resolve(workerDirInDist, 'index.mjs'), indexContent, 'utf-8');

  // Copia _worker.js anche dentro dist/client per supportare entrambi i path di Pages
  if (existsSync(clientDir)) {
    cpSync(workerDirInDist, workerDirInClient, { recursive: true });
  }
}

// 2. Copia tutti i file statici da dist/client alla radice di dist
if (existsSync(clientDir)) {
  console.log('[POSTBUILD] Syncing static client assets to dist root...');
  cpSync(clientDir, distDir, { recursive: true });
}

// 3. Genera _routes.json per Cloudflare Pages
// Garantisce che tutte le chiamate /api/* vengano instradate al worker e gli asset statici alla CDN
const routesJson = JSON.stringify({
  version: 1,
  include: ['/api/*'],
  exclude: []
}, null, 2);

writeFileSync(resolve(distDir, '_routes.json'), routesJson, 'utf-8');
if (existsSync(clientDir)) {
  writeFileSync(resolve(clientDir, '_routes.json'), routesJson, 'utf-8');
}

console.log('[POSTBUILD] Cloudflare Pages compatibility layer generated successfully in dist and dist/client.');
