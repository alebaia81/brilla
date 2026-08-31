# 🧠 Project Memory — Brilla Cafe

> Memoria persistente del progetto. Aggiornata costantemente con lo stato di avanzamento, decisioni di brand, testi ufficiali e stato deploy.

---

## 📍 Stato Corrente del Progetto (31 Agosto 2026)
- **Stato:** Sviluppo completato con successo. Tutte le 17 route statiche SSG compilano regolarmente.
- **Repository Git:** `https://github.com/alebaia81/brilla.git` (Branch `main`, sincronizzato).
- **Prossimo Step Operativo:** Deploy su **GitHub Pages** (o hosting definitivo Hostinger).

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

| Componente | Implementazione | Note |
|---|---|---|
| **Core** | Astro SSG (`output: 'static'`) | Genera 17 pagine HTML statiche in `dist/` |
| **UI Reattiva** | React 19 (`client:load` / `client:visible`) | Carrello Nanostores, Catalogo filtrabile, Checkout, Admin |
| **Backend & Storage** | Supabase PostgreSQL + Storage | Client-side anon key, RLS off come da specifiche |
| **Pagamenti** | PayPal JS SDK | Client-side per ordini con spedizione |
| **Notifiche** | WhatsApp Link | `wa.me/393500206743` con messaggio ordine compilato |
| **Privacy & Cookie** | GDPR Compliance | Pagine `/privacy` e `/cookie` + Banner con localStorage |
| **Local SEO** | Schema.org JSON-LD | `LocalBusiness`, geo-coordinates e orari per Castelnuovo Bocca d'Adda |

---

## 🚀 Log Ultimi Commit

- `e148fcc` — feat(design): embed 3 official category photos and remove cartoonish emojis with editorial UI styling
- `f6f1def` — refactor(hero): remove 3 pill cards and enhance conversion copywriting with store pickup emphasis
- `aa5017d` — feat: replace 'gift' nomenclature with 'idee regalo' across all components and pages
- `206257f` — fix: resolve zero rendering under badge when discount is 0 and replace corrupted National Geographic image
- `43c72cf` — feat: add official Chi Siamo about section and update home hero copy
- `6327948` — style: remove external reviews link button from reviews section
- `15dc424` — feat: add 6 verified Google reviews to home showcase
