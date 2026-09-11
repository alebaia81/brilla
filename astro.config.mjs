// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';
import cloudflare from '@astrojs/cloudflare';

// https://astro.build/config
export default defineConfig({
  site: 'https://brillacafe.it',
  output: 'server',
  adapter: cloudflare({
    imageService: 'cloudflare',
    // @ts-ignore
    platformProxy: {
      enabled: true,
    },
  }),
  prefetch: true,
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/checkout') &&
        !page.includes('/conferma') &&
        !page.includes('/api/'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});