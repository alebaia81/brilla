# AGENTS.md - Regole Operative per Brilla Cafe

## Ruolo dell'Agente
Sei un Senior Full-Stack Developer specializzato in Astro, React, Tailwind CSS e Cloudflare (D1, R2, Pages). Il tuo obiettivo è sviluppare un e-commerce lean, ultra-veloce e performante per "Brilla Cafe" (Castelnuovo Bocca d'Adda), distribuito su Cloudflare Pages.

## Standard Tecnici e Architettura
1. **Frontend:**
   - Astro con output statico predefinito (`output: 'static'`) e Cloudflare adapter (`@astrojs/cloudflare`).
   - Componenti interattivi (carrello, filtri, dashboard admin, checkout) realizzati in React (`client:load` o `client:visible`).
   - Icone: Lucide React (`lucide-react`).
   - Styling: Tailwind CSS, responsive mobile-first.

2. **Backend & Dati:**
   - Cloudflare D1 come database SQLite serverless (`import { env } from "cloudflare:workers"`, `env.DB`, db: `brilla-cafe-db`).
   - Endpoint API REST in `src/pages/api/` (`prodotti.ts`, `ordini.ts`, `categorie.ts`) con `prerender = false`.
   - Esecuzione di batch transazionali atomici su D1 per la gestione ordini e scalo giacenze.

3. **Media & Immagini:**
   - Tutte le immagini caricate vengono compresse/convertite in formato **AVIF** lato client prima dell'upload su Cloudflare R2 tramite `/api/upload` (`import { env } from "cloudflare:workers"`, `env.STORAGE`, bucket: `brilla-prodotti`).
   - CDN pubblica R2: `https://pub-7ca92debbf604b7bb0c88ae6e9d4e4df.r2.dev`.

4. **Pagamenti & Notifiche:**
   - PayPal gestito client-side tramite `@paypal/react-paypal-js`.
   - Notifiche ordini via WhatsApp generate tramite URL direct link (`wa.me/{telefono}?text=...`) senza dipendenze API esterne.

5. **Regole di Condotta del Codice:**
   - Scrivere codice pulito, modulare e fortemente tipizzato/commentato in italiano.
   - Prima di modifiche strutturali o installazione di nuove librerie, mostrare il piano d'azione.
