# 🧠 Project Memory — Brilla Cafe

> Memoria persistente del progetto. Aggiornata costantemente con lo stato di avanzamento, decisioni di brand, testi ufficiali e stato deploy.

---

## 📍 Stato Corrente del Progetto (3 Settembre 2026)
- **Stato:** Sviluppo completato, immagini locali AVIF integrate, nuovi orari e politica resi registrati e pushati.
- **Repository Git:** `https://github.com/alebaia81/brilla.git` (Branch `main`, commit `21f3966`).
- **Prossimo Step Operativo:** Deploy su hosting definitivo Hostinger (o GitHub Pages).

---

## 📌 Scheda Attività & Dati Fiscali Ufficiali

| Campo | Valore Ufficiale |
|---|---|
| **Ragione Sociale** | Brilla SAS di Bricchi Sara e c. |
| **Insegna** | Brilla Cafe’ |
| **Indirizzo** | Via Umberto I, 35 – 26843 Castelnuovo Bocca d’Adda (LO) |
| **Telefono / WhatsApp** | `+39 350 020 6743` |
| **Partita IVA** | `11824030966` |
| **Codice Destinatario (SDI)** | `W7YVJK9` |
| **Google Rating** | 4.7★ (Castelnuovo Bocca d'Adda) |
| **Orari di Apertura** | Lun–Sab 06:00–14:00 • Dom 07:00–14:00 (Pomeriggio chiuso) |
| **Politica Resi** | Diritto di recesso entro 14 gg dalla ricezione, spedizione reso a carico cliente |

---

## 🎨 Identità Visiva, Logo & Naming

1. **Logo Ufficiale (`public/logo.jpeg`):**
   - Logo circolare ad alta risoluzione con corona turchese/ciano (`#1AA8B8`) e scritta *Brilla Cafe Bar Cartoleria*.
   - Dimensione standard navbar e footer: `96px` (`w-24 h-24`) con altezza navbar `h-28`.
   - Favicon e OpenGraph configurati con il logo.
2. **Palette Colori:**
   - Wordmark `"CAFE’"`: Sempre colorata in ciano ufficiale (`#1AA8B8` / `text-brand-cyan`).
   - Sfondo primario: Panna/Crema (`#FFF8F0` / `bg-brand-cream`).
   - Testi: Scuro ardesia caldo (`#1C1917` / `text-brand-dark`).
   - Accento: Ambra dorato (`#D4A017` / `bg-brand-amber`).
   - Badge Categorie: Cartoleria (`#3B82F6`), Edicola (`#10B981`), Idee Regalo (`#F43F5E`).
3. **Regole di Naming e Terminologia:**
   - ✅ Usare **"Scegli e Ritira"** (o "Scegli & Ritira in Negozio a Zero Spese").
   - ✅ Usare **"Idee Regalo"** (MAI usare solo "Gift").
   - ✅ Usare **"Le Nostre Categorie"** (MAI usare "I nostri 3 reparti").
   - ❌ Vietate emoji infantili/fumettose nella UI: utilizzare dot colorati o badge tipografici minimali.
   - ❌ Vietata qualsiasi sottolineatura decorativa su parole del brand (es. "Cartoleria").

---

## 📝 Copywriting Ufficiale Approvato

### 1. Hero Section Home
- **Lead:** *"Bar, edicola, cartoleria e shop online: la qualità e la familiarità di sempre, ora comodamente anche online."*
- **Sottotitolo con Ritiro:** *"Ordina comodamente dal tuo smartphone con la possibilità di **ritirare l'ordine direttamente in negozio a zero spese** oppure riceverlo a casa con spedizione rapida."*

### 2. Sezione "Chi Siamo" (`AboutSection.astro`)
> *"Benvenuti da Brilla Cafe: molto più di un bar, un'edicola e una cartoleria. Siamo il cuore pulsante di Castelnuovo Bocca d’Adda, nati per accompagnare ogni momento della tua giornata con un sorriso, un ottimo caffè, tutto il necessario per la scuola e l'ufficio e i tuoi quotidiani preferiti, portando la nostra selezione direttamente a casa tua."*

---

## 📸 Asset Fotografici Ufficiali Inseriti

- [`public/cartoleria.jpg`](file:///Volumes/Magazzino/Magazzino/progetti%20web/brilla/public/cartoleria.jpg) — Reparto Cartoleria & Scuola (quaderni, zaini, penne).
- [`public/edicola.jpg`](file:///Volumes/Magazzino/Magazzino/progetti%20web/brilla/public/edicola.jpg) — Reparto Edicola & Quotidiani (riviste, fumetti, giornali).
- [`public/bar.jpg`](file:///Volumes/Magazzino/Magazzino/progetti%20web/brilla/public/bar.jpg) — Reparto Bar, Caffè & Idee Regalo (tazze mug Brilla, souvenir, cioccolateria).
- [`public/cappuccino.avif`](file:///Volumes/Magazzino/Magazzino/progetti%20web/brilla/public/cappuccino.avif) — Immagine principale Hero Section (cappuccino Brilla Cafe in formato ultra-leggero AVIF).
- [`public/locale.avif`](file:///Volumes/Magazzino/Magazzino/progetti%20web/brilla/public/locale.avif) — Immagine ufficiale sezione Chi Siamo (locale Brilla Cafe a Castelnuovo Bocca d'Adda in formato AVIF).

---

## ⭐ Sezione Google Reviews (`GoogleReviews.astro`)
- Rating evidenziato: **4.7 ★★★★★** con 6 testimonianze verificate su 3 colonne:
  1. *Elena B.* (Cliente Abituale - bar & colazioni)
  2. *Marco T.* (Acquisto Verificato - edicola e scuola)
  3. *Sara V.* (Scegli & Ritira - comodità prenotazione)
  4. *Davide M.* (Colazione & Edicola - brioche e fumetti)
  5. *Chiara R.* (Cartoleria & Regali - articoli regalo)
  6. *Paolo G.* (Massima Cortesia - accoglienza titolari)

---

## 🏗️ Architettura Tecnica

| **Core** | Astro SSG (`output: 'static'`) | Genera pagine HTML statiche in `dist/` + Sitemap XML automatica |
| **UI Reattiva** | React 19 (`client:load` / `client:visible`) | Carrello Nanostores, Catalogo filtrabile, Checkout, Admin |
| **Backend & Storage** | Supabase PostgreSQL + Storage | Client-side anon key, RLS off come da specifiche, conversione AVIF |
| **Pagamenti** | PayPal JS SDK | Client-side per ordini con spedizione |
| **Notifiche & Contatti** | WhatsApp Direct Link (`wa.me`) | Privilegiato rispetto al telefono in chiaro per privacy e tracciabilità |
| **Privacy & Cookie** | GDPR Compliance | Pagine `/privacy` e `/cookie` + Banner con localStorage |
| **Local SEO & Rich Snippets** | Schema.org JSON-LD | `LocalBusiness`, `Product`, `BreadcrumbList`, `FAQPage` + canonical tag |
| **Accessibilità (WCAG 2.1 AA)** | Focus-visible & ARIA | `focus-visible:ring-[#2C3E50]`, aria-label su tutti i bottoni icona, drawer focus trapping |

---

## 🚀 Log Ultimi Commit

- `21f3966` — feat(about): replace unsplash photo with official locale.avif image
- `dcebda3` — feat(hero): replace external unsplash image with local cappuccino.avif
- `6f138fb` — style(hero): match Cartoleria word color to Cartoleria & Scuola banner blue
- `daa17bf` — feat: update opening hours to morning only and integrate 14-day return policy
- `87930f0` — feat(catalog): auto-hide out of stock products and add quick toggle in admin
- `80ceec8` — feat: add official brilla logo favicon in svg, webmanifest and png formats
- `6ba19d8` — fix(types): resolve database and cart schema inconsistencies, null safety and stock handling
- `e148fcc` — feat(design): embed 3 official category photos and remove cartoonish emojis with editorial UI styling
- `f6f1def` — refactor(hero): remove 3 pill cards and enhance conversion copywriting with store pickup emphasis
- `aa5017d` — feat: replace 'gift' nomenclature with 'idee regalo' across all components and pages
- `206257f` — fix: resolve zero rendering under badge when discount is 0 and replace corrupted National Geographic image
- `43c72cf` — feat: add official Chi Siamo about section and update home hero copy
- `6327948` — style: remove external reviews link button from reviews section
- `15dc424` — feat: add 6 verified Google reviews to home showcase
