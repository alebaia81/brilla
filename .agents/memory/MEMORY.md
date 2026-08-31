# 🧠 Project Memory — Brilla Cafe

> Memoria persistente del progetto. Letta ad ogni inizio sessione.

---

## Stato Corrente
Inizializzazione del progetto e-commerce per Brilla Cafe (Cartoleria, Edicola, Bar/Gift a Castelnuovo Bocca d'Adda).

---

## 📌 Progetto

| Campo | Valore |
|---|---|
| **Nome** | Brilla Cafe |
| **Tipo** | E-commerce statico (lean) |
| **Attività** | Cartoleria, Edicola, Bar/Gift |
| **Località** | Castelnuovo Bocca d'Adda |
| **Hosting target** | Hostinger (shared hosting, solo file statici via FTP/SFTP) |
| **Lingua UI** | Italiano |
| **Lingua codice** | Inglese (variabili, funzioni), commenti in italiano |

---

## 🏗️ Decisioni Architetturali Prese

### Stack Tecnologico
| Layer | Tecnologia | Note |
|---|---|---|
| **Framework** | Astro | `output: 'static'`, SSG only |
| **Componenti interattivi** | React | `client:load` / `client:visible` (isole interattive) |
| **Styling** | Tailwind CSS | Mobile-first, responsive |
| **Icone** | Lucide React | `lucide-react` |
| **Database** | Supabase (PostgreSQL) | Client-side via `@supabase/supabase-js` |
| **Storage media** | Supabase Storage | Bucket per foto prodotti, formato AVIF |
| **Pagamenti** | PayPal | `@paypal/react-paypal-js`, client-side only, per ordini con spedizione |
| **Notifiche ordini** | WhatsApp | Deep link `wa.me/` con messaggi preimpostati |

### Funzionalità Chiave
- **Ritiro in Negozio:** Ordine salvato su Supabase con stato `in_sospeso` e fascia oraria di ritiro.
- **Comunicazione Admin:** Deep link diretti WhatsApp (`wa.me`) con messaggi preimpostati per l'amministratore.
- **Media:** Compressione e conversione automatica in formato AVIF lato client prima dell'upload su Supabase Storage.
- **Deploy:** Build statica (`/dist`) per deploy diretto su Hostinger via FTP/SFTP.

### Vincoli Architetturali
1. **NO SSR / NO Node runtime** — Il deploy è su hosting condiviso, solo cartella `dist/` statica.
2. **RLS Supabase disattivato** — Scelta lean voluta dal progetto.
3. **Nessun backend** — Pagamenti, notifiche e accesso dati tutti client-side.

---

## 📂 Struttura Prevista

```
brilla/
├── src/
│   ├── components/    # Componenti React (.tsx) e Astro (.astro)
│   ├── layouts/       # Layout principali
│   ├── pages/         # Pagine Astro (routing file-based)
│   ├── lib/           # Utility, client Supabase (supabase.js), helpers
│   └── styles/        # CSS globali / Tailwind config
├── public/            # Asset statici
├── .env               # SUPABASE_URL, SUPABASE_ANON_KEY, PAYPAL_CLIENT_ID
├── astro.config.mjs
├── tailwind.config.mjs
├── package.json
└── AGENTS.md
```

---

## 🗺️ Roadmap di Sviluppo

- [x] **Fase 1: Setup & Struttura Base** ✅
  - Inizializzazione progetto Astro con integrazioni React e Tailwind.
  - Configurazione client Supabase (`src/lib/supabase.js`) e variabili `.env`.
  - Script SQL di creazione tabelle (`prodotti`, `categorie`, `ordini`, `ordine_articoli`).

- [x] **Fase 2: Layout & Catalogo** ✅
  - Header con carrello interattivo e Footer con link Admin.
  - Home page vetrina (3 sezioni: Cartoleria, Edicola, Bar/Gift + novità del mese).
  - Pagina catalogo (`/catalogo`) con filtri reattivi React per categoria, marca, prezzo e ricerca full-text.

- [x] **Fase 3: Scheda Prodotto, Carrello & Checkout** ✅
  - Pagina dinamica prodotto (`/prodotto/[slug]`).
  - Carrello React con Nanostores e gestione stato locale (quantità, modalità spedizione / ritiro in negozio).
  - Flusso di pagamento PayPal client-side e conferma ordine.

- [x] **Fase 4: Dashboard Admin & Notifiche WhatsApp** ✅
  - Area riservata `/admin` protetta da login con sessione locale.
  - Gestione ordini con cambio stato e bottone automatico `wa.me`.
  - CRUD prodotti e categorie con upload/conversione AVIF su Supabase Storage.

- [x] **Fase 5: SEO Locale & Ottimizzazioni** ✅
  - Metadati OpenGraph, JSON-LD Schema.org (`LocalBusiness`, `Product`, `ItemList`).
  - Generazione Sitemap, Robots.txt e validazione build statica SSG.

---

## 🎯 Convenzioni

- **Naming componenti:** PascalCase per React (`.tsx`), kebab-case per Astro (`.astro`)
- **Naming file/cartelle:** kebab-case
- **Import paths:** Usare alias Astro (`@/components/...`)
- **Commit messages:** In italiano, formato `tipo: descrizione` (es. `feat: aggiunta carrello`)

---

## 📝 Cronologia Decisioni

| Data | Decisione |
|---|---|
| 2026-08-31 | Progetto inizializzato. Stack definito: Astro + React + Tailwind + Supabase + PayPal. Hosting Hostinger (static). |
| 2026-08-31 | AG Kit installato (v2026.7.27). |
| 2026-08-31 | Definita roadmap 5 fasi: Setup → Layout/Catalogo → Prodotto/Carrello/Checkout → Admin/WhatsApp → SEO. |
| 2026-08-31 | Stabilito modello ritiro in negozio con stato `in_sospeso` e fascia oraria. |

---

## ⚠️ Note & Gotchas

- La versione `@vudovn/ag-kit@2026.8.31` ha un bug (cerca `.agent` invece di `.agents`). Usare `2026.7.27`.
- Su Hostinger shared hosting non è possibile eseguire processi Node. Il sito deve essere puramente statico.
- Le tabelle Supabase previste: `prodotti`, `categorie`, `ordini`, `ordine_articoli`.
