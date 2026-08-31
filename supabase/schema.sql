-- ============================================================
-- BRILLA CAFE — Schema Database Supabase Completo
-- Tabelle: categorie, prodotti, ordini, ordine_articoli, notifiche_whatsapp
-- Include Storage bucket 'product-images', triggers e dati seed
-- ============================================================

-- Abilita estensione pgcrypto per UUID se necessario
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- TIPI ENUM
-- ============================================================

DO $$ BEGIN
    CREATE TYPE tipo_sezione AS ENUM ('cartoleria', 'edicola', 'bar_gift');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE modalita_ordine AS ENUM ('spedizione', 'ritiro');
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE stato_ordine AS ENUM (
      'in_sospeso',
      'pagato',
      'in_allestimento',
      'pronto',
      'completato',
      'annullato'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- FUNZIONI & TRIGGERS (Auto update timestamp)
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- ============================================================
-- TABELLA: categorie
-- ============================================================

CREATE TABLE IF NOT EXISTS categorie (
  id            BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  nome          TEXT NOT NULL UNIQUE,
  slug          TEXT NOT NULL UNIQUE,
  tipo          tipo_sezione NOT NULL DEFAULT 'cartoleria',
  descrizione   TEXT,
  icona         TEXT DEFAULT 'Package',
  colore_badge  TEXT DEFAULT 'badge-cartoleria',
  ordine        INT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- TABELLA: prodotti
-- ============================================================

CREATE TABLE IF NOT EXISTS prodotti (
  id                    BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  categoria_id          BIGINT NOT NULL REFERENCES categorie(id) ON DELETE CASCADE,
  nome                  TEXT NOT NULL,
  slug                  TEXT NOT NULL UNIQUE,
  descrizione           TEXT,
  marca                 TEXT,
  tipo_prodotto         tipo_sezione NOT NULL DEFAULT 'cartoleria',
  prezzo                NUMERIC(10,2) NOT NULL CHECK (prezzo >= 0),
  sconto_percentuale    NUMERIC(5,2) DEFAULT 0 CHECK (sconto_percentuale >= 0 AND sconto_percentuale <= 100),
  prezzo_scontato       NUMERIC(10,2) GENERATED ALWAYS AS (
                          CASE 
                            WHEN sconto_percentuale > 0 THEN ROUND(prezzo * (1 - (sconto_percentuale / 100)), 2)
                            ELSE prezzo
                          END
                        ) STORED,
  immagine_url          TEXT,
  sku                   TEXT UNIQUE,
  quantita_disponibile  INT DEFAULT 10 CHECK (quantita_disponibile >= 0),
  peso_grammi           NUMERIC(10,2) DEFAULT 100,
  periodicita           TEXT,              -- Es. 'mensile', 'settimanale' (per edicola)
  data_pubblicazione    DATE,              -- Per riviste/giornali
  in_edicola_questo_mese BOOLEAN DEFAULT FALSE,
  in_evidenza           BOOLEAN DEFAULT FALSE,
  disponibile           BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT now(),
  updated_at            TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_prodotti_updated_at
BEFORE UPDATE ON prodotti
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Indici performanti
CREATE INDEX IF NOT EXISTS idx_prodotti_categoria ON prodotti(categoria_id);
CREATE INDEX IF NOT EXISTS idx_prodotti_slug ON prodotti(slug);
CREATE INDEX IF NOT EXISTS idx_prodotti_tipo ON prodotti(tipo_prodotto);
CREATE INDEX IF NOT EXISTS idx_prodotti_disponibile ON prodotti(disponibile) WHERE disponibile = TRUE;
CREATE INDEX IF NOT EXISTS idx_prodotti_in_evidenza ON prodotti(in_evidenza) WHERE in_evidenza = TRUE;

-- ============================================================
-- TABELLA: ordini
-- ============================================================

CREATE TABLE IF NOT EXISTS ordini (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  numero_ordine       TEXT NOT NULL UNIQUE, -- es: ORD-20260831-001
  cliente_nome        TEXT NOT NULL,
  cliente_email       TEXT NOT NULL,
  cliente_telefono    TEXT NOT NULL,
  tipo_ordine         modalita_ordine NOT NULL DEFAULT 'ritiro',
  stato               stato_ordine NOT NULL DEFAULT 'in_sospeso',
  data_ritiro_prevista DATE,
  fascia_ritiro       TEXT,                 -- Es. "10:00-12:00"
  indirizzo_spedizione TEXT,
  citta_spedizione    TEXT,
  cap_spedizione      TEXT,
  costo_spedizione    NUMERIC(10,2) DEFAULT 0 CHECK (costo_spedizione >= 0),
  totale_articoli     NUMERIC(10,2) NOT NULL CHECK (totale_articoli >= 0),
  totale_ordine       NUMERIC(10,2) NOT NULL CHECK (totale_ordine >= 0),
  note_cliente        TEXT,
  pagamento_id_paypal TEXT,
  data_pagamento      TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT now(),
  updated_at          TIMESTAMPTZ DEFAULT now()
);

CREATE TRIGGER set_ordini_updated_at
BEFORE UPDATE ON ordini
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

CREATE INDEX IF NOT EXISTS idx_ordini_numero ON ordini(numero_ordine);
CREATE INDEX IF NOT EXISTS idx_ordini_stato ON ordini(stato);
CREATE INDEX IF NOT EXISTS idx_ordini_created ON ordini(created_at DESC);

-- ============================================================
-- TABELLA: ordine_articoli
-- ============================================================

CREATE TABLE IF NOT EXISTS ordine_articoli (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  ordine_id       BIGINT NOT NULL REFERENCES ordini(id) ON DELETE CASCADE,
  prodotto_id     BIGINT NOT NULL REFERENCES prodotti(id) ON DELETE RESTRICT,
  nome_prodotto   TEXT NOT NULL,
  quantita        INT NOT NULL CHECK (quantita > 0),
  prezzo_unitario NUMERIC(10,2) NOT NULL CHECK (prezzo_unitario >= 0),
  subtotale       NUMERIC(10,2) GENERATED ALWAYS AS (quantita * prezzo_unitario) STORED,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ordine_articoli_ordine ON ordine_articoli(ordine_id);

-- ============================================================
-- STORAGE BUCKET: product-images
-- ============================================================

INSERT INTO storage.buckets (id, name, public) 
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Policy pubblica di lettura per le immagini
DO $$ BEGIN
  CREATE POLICY "Public Read Access" 
  ON storage.objects FOR SELECT 
  USING (bucket_id = 'product-images');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- Policy anonima di upload (lean mode: RLS disattivato a livello applicativo)
DO $$ BEGIN
  CREATE POLICY "Public Upload Access" 
  ON storage.objects FOR INSERT 
  WITH CHECK (bucket_id = 'product-images');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- ============================================================
-- DATI DI PROVA (SEED)
-- ============================================================

-- Inserimento Categorie
INSERT INTO categorie (nome, slug, tipo, descrizione, icona, colore_badge, ordine) VALUES
  ('Cartoleria Scuola & Ufficio', 'cartoleria', 'cartoleria', 'Penne, quaderni, zaini e materiale per la scuola e il lavoro', 'BookOpen', 'badge-cartoleria', 1),
  ('Edicola & Riviste',           'edicola',    'edicola',    'Quotidiani, riviste mensili, fumetti e guide speciali',            'Newspaper', 'badge-edicola',    2),
  ('Bar, Caffè & Gift',           'bar-gift',   'bar_gift',   'Tazze personalizzate, souvenir lodigiani, dolci e idee regalo',     'Coffee',    'badge-gift',       3)
ON CONFLICT (slug) DO UPDATE SET
  nome = EXCLUDED.nome,
  tipo = EXCLUDED.tipo,
  descrizione = EXCLUDED.descrizione,
  icona = EXCLUDED.icona,
  colore_badge = EXCLUDED.colore_badge,
  ordine = EXCLUDED.ordine;

-- Inserimento Prodotti Esemplari
INSERT INTO prodotti (
  categoria_id, nome, slug, descrizione, marca, tipo_prodotto, 
  prezzo, sconto_percentuale, immagine_url, sku, quantita_disponibile, 
  in_evidenza, in_edicola_questo_mese, periodicita
) VALUES
  -- Cartoleria
  (1, 'Set 10 Penne a Sfera Retrattili', 'set-10-penne-sfera-retrattili', 'Set professionale a sfera scorrevole con impugnatura soft touch.', 'BIC', 'cartoleria', 6.50, 10, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80', 'CART-PEN-01', 30, TRUE, FALSE, NULL),
  (1, 'Quadernone Maxi A4 a Righe 100g', 'quadernone-maxi-a4-righe-100g', 'Quadernone resistente con carta pregiata da 100g antispanciamento.', 'Pigna', 'cartoleria', 2.80, 0, 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80', 'CART-QUA-02', 50, TRUE, FALSE, NULL),
  (1, 'Evidenziatori Pastel Edition (Set 6pz)', 'evidenziatori-pastel-edition-6pz', 'Tonalità pastello delicate per studio e bullet journal.', 'Stabilo', 'cartoleria', 8.90, 15, 'https://images.unsplash.com/photo-1585336261026-7f37ec2e5b7c?w=600&auto=format&fit=crop&q=80', 'CART-EVI-03', 20, FALSE, FALSE, NULL),
  (1, 'Zaino Scuola & Viaggio Idrorepellente', 'zaino-scuola-viaggio-idrorepellente', 'Schienale ergonomico traspirante, tasca porta borraccia e PC 15.6".', 'Invicta', 'cartoleria', 49.90, 20, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80', 'CART-ZAI-04', 8, TRUE, FALSE, NULL),

  -- Edicola
  (2, 'National Geographic Italia - Edizione Mese', 'national-geographic-italia-mese', 'Reportage esclusivi sul pianeta, natura, scienza e culture.', 'Gedi', 'edicola', 5.90, 0, 'https://images.unsplash.com/photo-1532012164546-f432f2e3edd4?w=600&auto=format&fit=crop&q=80', 'EDI-NAT-01', 15, TRUE, TRUE, 'mensile'),
  (2, 'La Gazzetta dello Sport + Magazine', 'la-gazzetta-dello-sport-mag', 'Il quotidiano sportivo più letto d''Italia con inserto weekend.', 'RCS', 'edicola', 2.00, 0, 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80', 'EDI-GAZ-02', 25, FALSE, TRUE, 'giornaliero'),
  (2, 'Topolino Fumetto da Collezione', 'topolino-fumetto-da-collezione', 'L''intramontabile fumetto a colori per grandi e piccoli con gadget speciale.', 'Panini Comics', 'edicola', 3.50, 0, 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80', 'EDI-TOP-03', 12, TRUE, TRUE, 'settimanale'),

  -- Bar & Gift
  (3, 'Tazza Mug Artigianale "Brilla Castelnuovo"', 'tazza-mug-artigianale-brilla', 'Tazza in ceramica smaltata a mano con grafica skyline Castelnuovo Bocca d''Adda.', 'Brilla Cafe', 'bar_gift', 11.50, 0, 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80', 'GIFT-MUG-01', 20, TRUE, FALSE, NULL),
  (3, 'Confezione Cioccolatini & Praline 250g', 'confezione-cioccolatini-praline-250g', 'Selezione artigianale di cioccolato piemontese fondente e granella di nocciola.', 'Artigianale', 'bar_gift', 9.90, 10, 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80', 'GIFT-CIO-02', 15, TRUE, FALSE, NULL),
  (3, 'Bottiglia Termica Inox 500ml Brilla Edition', 'bottiglia-termica-inox-500ml-brilla', 'Mantiene caldo per 12h e freddo per 24h. Senza BPA.', 'Brilla Cafe', 'bar_gift', 16.00, 0, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80', 'GIFT-BOT-03', 18, FALSE, FALSE, NULL)
ON CONFLICT (slug) DO NOTHING;
