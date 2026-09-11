-- ============================================================
-- BRILLA CAFE — Schema Database Cloudflare D1 (SQLite)
-- Database: brilla-cafe-db
-- ============================================================

-- Tabella Categorie
CREATE TABLE IF NOT EXISTS categorie (
  id             TEXT PRIMARY KEY,
  nome           TEXT NOT NULL,
  slug           TEXT NOT NULL UNIQUE,
  tipo_categoria TEXT NOT NULL DEFAULT 'cartoleria',
  descrizione    TEXT,
  icona          TEXT,
  ordine         INTEGER DEFAULT 0,
  creato_il      TEXT DEFAULT (datetime('now'))
);

-- Tabella Prodotti
CREATE TABLE IF NOT EXISTS prodotti (
  id                     TEXT PRIMARY KEY,
  categoria_id           TEXT,
  nome                   TEXT NOT NULL,
  slug                   TEXT NOT NULL UNIQUE,
  descrizione            TEXT,
  marca                  TEXT,
  tipo_prodotto          TEXT NOT NULL DEFAULT 'cartoleria',
  prezzo                 REAL NOT NULL DEFAULT 0.0,
  sconto_percentuale     REAL DEFAULT 0.0,
  prezzo_scontato        REAL,
  immagine_url           TEXT,
  sku                    TEXT,
  quantita_disponibile   INTEGER NOT NULL DEFAULT 10,
  peso_grammi            REAL DEFAULT 100,
  periodicita            TEXT,
  in_edicola_questo_mese INTEGER DEFAULT 0,
  in_evidenza            INTEGER DEFAULT 0,
  disponibile            INTEGER DEFAULT 1,
  creato_il              TEXT DEFAULT (datetime('now')),
  aggiornato_il          TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_prodotti_slug ON prodotti(slug);
CREATE INDEX IF NOT EXISTS idx_prodotti_tipo ON prodotti(tipo_prodotto);
CREATE INDEX IF NOT EXISTS idx_prodotti_disponibile ON prodotti(disponibile);
CREATE INDEX IF NOT EXISTS idx_prodotti_in_evidenza ON prodotti(in_evidenza);

-- Tabella Ordini
CREATE TABLE IF NOT EXISTS ordini (
  id                   TEXT PRIMARY KEY,
  numero_ordine        TEXT NOT NULL UNIQUE,
  cliente_nome         TEXT NOT NULL,
  cliente_email        TEXT,
  cliente_telefono     TEXT NOT NULL,
  tipo_ordine          TEXT NOT NULL DEFAULT 'ritiro',
  stato                TEXT NOT NULL DEFAULT 'in_sospeso',
  data_ritiro_prevista TEXT,
  fascia_ritiro        TEXT,
  indirizzo_spedizione TEXT,
  citta_spedizione     TEXT,
  cap_spedizione       TEXT,
  costo_spedizione     REAL DEFAULT 0.0,
  totale_articoli      REAL NOT NULL DEFAULT 0.0,
  totale_ordine        REAL NOT NULL DEFAULT 0.0,
  note_cliente         TEXT,
  pagamento_id_paypal  TEXT,
  data_pagamento       TEXT,
  creato_il            TEXT DEFAULT (datetime('now')),
  aggiornato_il        TEXT DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_ordini_numero ON ordini(numero_ordine);
CREATE INDEX IF NOT EXISTS idx_ordini_stato ON ordini(stato);
CREATE INDEX IF NOT EXISTS idx_ordini_creato_il ON ordini(creato_il DESC);

-- Tabella Ordine Articoli
CREATE TABLE IF NOT EXISTS ordine_articoli (
  id              TEXT PRIMARY KEY,
  ordine_id       TEXT NOT NULL,
  prodotto_id     TEXT,
  nome_prodotto   TEXT NOT NULL,
  quantita        INTEGER NOT NULL DEFAULT 1,
  prezzo_unitario REAL NOT NULL DEFAULT 0.0,
  subtotale       REAL NOT NULL DEFAULT 0.0,
  creato_il       TEXT DEFAULT (datetime('now')),
  FOREIGN KEY (ordine_id) REFERENCES ordini(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_ordine_articoli_ordine ON ordine_articoli(ordine_id);
