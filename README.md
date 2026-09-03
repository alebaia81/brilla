# ☕ Brilla Cafe’ — E-commerce Statico & Servizio Scegli & Ritira

> Piattaforma e-commerce lean, ultra-veloce e statica per **Brilla Cafe** (Castelnuovo Bocca d'Adda, Lodi).
> Unisce Bar, Edicola e Cartoleria con il servizio esclusivo **Scegli & Ritira al bancone a zero costi** e gestione ordini in tempo reale.

---

## ⚡ Stack Tecnologico

- **Framework:** [Astro 5](https://astro.build/) (`output: 'static'`) — Static Site Generation ultra-veloce con zero JS non necessario.
- **UI & Isole Interattive:** [React 19](https://react.dev/) (`client:load`, `client:visible`).
- **Styling & Design System:** [Tailwind CSS 4](https://tailwindcss.com/) — Mobile-first, palette dedicata e accessibilità WCAG 2.1 AA.
- **State Management:** [Nanostores](https://github.com/nanostores/nanostores) con persistenza in `localStorage`.
- **Database & Media:** [Supabase](https://supabase.com/) (PostgreSQL + Storage buckets per immagini convertite in AVIF).
- **Pagamenti & Notifiche:** PayPal JS SDK per pagamenti online e notifiche ordini dirette via WhatsApp direct links (`wa.me`).
- **SEO & Structured Data:** `@astrojs/sitemap`, Canonical URLs, OpenGraph e Schema.org JSON-LD (`LocalBusiness`, `Product`, `BreadcrumbList`, `FAQPage`).

---

## 🧭 Funzionalità Principali

1. **Catalogo Prodotti & Filtri:**
   - Suddivisione per reparti: *Cartoleria & Scuola*, *Edicola & Quotidiani*, *Bar & Idee Regalo*.
   - Filtri in tempo reale per testo, reparto, marca, fascia di prezzo e ordinamento dinamico.
   - Nascondimento automatico dallo store pubblico degli articoli a scorte zero o con `disponibile: false`.

2. **Carrello & Checkout Lean:**
   - Carrello laterale interattivo (drawer) con validazione quantità rispetto alle scorte disponibili a magazzino.
   - Selezione modalità di ricezione: **Ritiro in Negozio** (gratuito) con scelta di data e fascia oraria o **Spedizione a Domicilio**.
   - Metodi di pagamento: Contanti/POS al ritiro oppure PayPal/Carta online.
   - Scalo scorte atomico post-ordine e disattivazione automatica ad esaurimento giacenza.
   - Generazione ricevuta digitale con QR Code per il ritiro rapido al bancone.

3. **Pannello Admin (`/admin`):**
   - Gestione catalogo completa: creazione, modifica, upload immagini con conversione AVIF client-side.
   - Switch rapido "Online / Off" per attivare o disattivare istantaneamente la visibilità dei prodotti nello store.
   - Gestione e monitoraggio ordini in tempo reale con notifiche audio/visive.

4. **SEO & Prestazioni:**
   - Generazione automatica di `sitemap-index.xml` e `sitemap-0.xml` (escluse rotte private `/admin/**`, `/checkout/**`, `/conferma/**`).
   - Schede prodotto dinamiche SSG con OpenGraph per WhatsApp e social network.
   - Schema JSON-LD `LocalBusiness` per Castelnuovo Bocca d'Adda e Bassa Lodigiana.
   - Sezione FAQ semantica con schema `FAQPage` per Rich Snippets di Google.

5. **Accessibilità & CRO (WCAG 2.1 AA):**
   - Alt text significativi su tutte le immagini con contestualizzazione locale.
   - `aria-label` descrittivi su tutti i comandi icona (carrello, selettori quantità, switch admin, eliminazione).
   - Gestione tastiera e focus rings dedicati (`focus-visible:ring-[#2C3E50]`).
   - Tutela della privacy: rimossi numeri telefonici in chiaro a favore di assistenza diretta e sicura tramite WhatsApp.

---

## 🛠️ Comandi di Sviluppo

Tutti i comandi vengono eseguiti dalla root del progetto:

```bash
# Installazione dipendenze
npm install

# Avvio server di sviluppo locale (http://localhost:4321)
npm run dev

# Controllo tipi TypeScript
npx -p typescript tsc --noEmit

# Compilazione produzione statica (output in ./dist/)
npm run build

# Anteprima locale della build statica
npm run preview
```

---

## 🔐 Configurazione Variabili d'Ambiente (`.env`)

Crea un file `.env` nella radice del progetto:

```env
PUBLIC_SUPABASE_URL=https://tuo-progetto.supabase.co
PUBLIC_SUPABASE_ANON_KEY=la-tua-anon-key
PUBLIC_PAYPAL_CLIENT_ID=il-tuo-paypal-client-id
```

---

## 📄 Informazioni Attività

- **Attività:** Brilla Cafe’ (Brilla SAS di Bricchi Sara e c.)
- **Sede:** Via Umberto I, 35 – 26843 Castelnuovo Bocca d’Adda (LO)
- **Partita IVA:** `11824030966`
- **Sito Ufficiale:** [https://brillacafe.it](https://brillacafe.it)
