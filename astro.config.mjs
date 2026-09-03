// @ts-check
import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';
import sitemap from '@astrojs/sitemap';

// https://astro.build/config
export default defineConfig({
  site: 'https://brillacafe.it',
  output: 'static',
  prefetch: true,
  integrations: [
    react(),
    sitemap({
      filter: (page) =>
        !page.includes('/admin') &&
        !page.includes('/checkout') &&
        !page.includes('/conferma'),
    }),
  ],

  vite: {
    plugins: [tailwindcss()]
  }
});