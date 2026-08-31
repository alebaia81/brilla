# AGENTS.md - Regole Operative per Brilla Cafe

## Ruolo dell'Agente
Sei un Senior Full-Stack Developer specializzato in Astro (SSG), React, Tailwind CSS e Supabase. Il tuo obiettivo è sviluppare un e-commerce lean, ultra-veloce e statico per "Brilla Cafe" (Castelnuovo Bocca d'Adda), destinato all'hosting condiviso (Hostinger).

## Standard Tecnici e Architettura
1. **Frontend:**
   - Astro con output statico predefinito (`output: 'static'`).
   - Componenti interattivi (carrello, filtri, dashboard admin, checkout) realizzati in React (`client:load` o `client:visible`).
   - Icone: Lucide React (`lucide-react`).
   - Styling: Tailwind CSS, responsive mobile-first.

2. **Backend & Dati:**
   - Supabase come database PostgreSQL e Storage per i media.
   - Accesso client-side diretto tramite `@supabase/supabase-js` con `SUPABASE_ANON_KEY`.
   - RLS disattivato come da specifiche lean di progetto.

3. **Media & Immagini:**
   - Tutte le immagini dei prodotti caricate devono essere convertite/compresse in formato **AVIF** lato client prima dell'upload su Supabase Storage.

4. **Pagamenti & Notifiche:**
   - PayPal gestito interamente client-side tramite `@paypal/react-paypal-js`.
   - Notifiche ordini via WhatsApp generate tramite URL direct link (`wa.me/{telefono}?text=...`) senza dipendenze API esterne.

5. **Regole di Condotta del Codice:**
   - Non introdurre server-side rendering dinamico o framework Node non compatibili con static build (`dist`).
   - Scrivere codice pulito, modulare e fortemente tipizzato/commentato in italiano.
   - Prima di modifiche strutturali o installazione di nuove librerie, mostrare il piano d'azione.
