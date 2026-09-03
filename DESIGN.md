# DESIGN.md — Brilla Cafe Design System & Visual Specification

> Specifiche di design, token visivi e principi UI per Brilla Cafe (Castelnuovo Bocca d'Adda).

---

## 🌟 Identità & Moodboard
- **Atmosfera:** Calda, accogliente, solare e rassicurante come il bar-cartoleria di paese moderno.
- **Tonalità principali:** Ambra caldo tostato, crema avorio vellutato e antracite profondo per contrasto tipografico eccellente.
- **Anti-cliché:** No viola, no layout template anonimi, micro-interazioni curate, tipografia con contrasti decisi e badge categoria immediatamente distinguibili.

---

## 🎨 Token Colori

### 1. Brand Core
| Token | HEX / Valore | Utilizzo |
|---|---|---|
| `--color-brand-amber` | `#D4A017` | Primario: bottoni CTA, badge evidenza, accenti attivi |
| `--color-brand-dark` | `#1C1917` | Secondario / Dark: testi principali, footer, titoli |
| `--color-brand-cream` | `#FFF8F0` | Sfondo globale: superfici calde, card alternate |

### 2. Categorie Distintive
| Token | HEX / Valore | Sezione / Categoria |
|---|---|---|
| `--color-badge-cartoleria` | `#3B82F6` | Cartoleria & Scuola (Blu affidabile e fresco) |
| `--color-badge-edicola` | `#10B981` | Edicola & Riviste (Verde natura e novità) |
| `--color-badge-gift` | `#F43F5E` | Bar & Gift / Souvenir (Rosa corallo energico e festoso) |

### 3. Neutri e Superfici
- **Superficie Card:** `rgba(255, 255, 255, 0.85)` con `backdrop-blur-md`
- **Bordi:** `rgba(28, 25, 23, 0.08)`
- **Ombre:** `shadow-sm` per card standard, `shadow-xl shadow-brand-dark/5` per modali e drawer

### 4. Accessibilità & Focus Rings (WCAG 2.1 AA)
- **Focus Ring Globale:** `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2C3E50]` per pulsanti, link interattivi, campi input e selettori.
- **Rapporto di Contrasto:** Minimo 4.5:1 per testi normali e 3:1 per elementi grafici e testi grandi rispetto allo sfondo. I badge su fondo chiaro utilizzano varianti scure (es. `text-amber-950 bg-amber-200/90` o `text-emerald-800`).

---

## ✍️ Tipografia
- **Font Sans:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Heading 1:** Bold 36px–48px con tracking leggermente stretto
- **Heading 2/3:** Semibold 20px–28px
- **Body:** Regular 15px–16px con line-height 1.6
- **Caption / Badge:** Medium/Semibold 12px–13px uppercase o pill arrotondate

---

## 🧱 Componenti & Pattern
- **Pill Badges:** Bordi arrotondati completi (`rounded-full`), testo compatto, icone coordinate.
- **Product Card:** Hover lift sottile (`-translate-y-1`), ratio immagine coerente `aspect-square`, prezzo in evidenza con sconto calcolato in percentuale.
- **Drawer Carrello:** Slide-in fluido da destra con backdrop opaco sfocato, auto-focus sul pulsante di chiusura e chiusura tramite tasto ESC.
- **CTA Orientate all'Azione (CRO):** Etichette ad alta conversione con verbo attivo (es. `⚡ Ordina e Ritira al Banco`, `🎒 Esplora il Reparto Scuola`).
- **Feedback & WhatsApp:** Pulsanti con icona WhatsApp verde smeraldo per immediatezza d'uso e privacy preservata senza numeri telefonici mostrati in chiaro.

