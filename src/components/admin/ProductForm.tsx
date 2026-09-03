import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { slugify, formatPrice } from '../../lib/format';
import ImageUploader from './ImageUploader';
import { type Product } from '../catalogo/ProductCard';
import { Save, ArrowLeft, Loader2, Sparkles, Tag, DollarSign, BookOpen, Newspaper, Coffee, AlertCircle, Layers } from 'lucide-react';

interface CategoryOption {
  id: string | number;
  nome: string;
  slug: string;
  tipo_categoria?: string;
  tipo?: string;
}

const FALLBACK_CATEGORIES: CategoryOption[] = [
  { id: '5d67032f-be4c-4eec-be15-970e13b0d907', nome: 'Penne e Matite', slug: 'penne-matite', tipo_categoria: 'cartoleria' },
  { id: 'b29b07be-f379-4f6f-bc87-fd9f5ae0fb82', nome: 'Quaderni e Carta', slug: 'quaderni-carta', tipo_categoria: 'cartoleria' },
  { id: '922ae16b-c354-4f8f-a7de-334ce6b8c2c2', nome: 'Riviste Mensili', slug: 'riviste-mensili', tipo_categoria: 'edicola' },
  { id: 'e2af0565-6b0f-4aca-b703-1adc197f2cf0', nome: 'Fumetti e Giornali', slug: 'fumetti-giornali', tipo_categoria: 'edicola' },
  { id: '7bd588c2-783c-45ad-98eb-80b9c1d09def', nome: 'Tazze e Mug', slug: 'tazze-mug', tipo_categoria: 'bar_gift' },
  { id: '47e238c8-00a9-474b-9196-4ec40538355e', nome: 'Gadget e Ricordi', slug: 'gadget-ricordi', tipo_categoria: 'bar_gift' },
];

interface ProductFormProps {
  initialProduct?: Product | null;
  onSave: () => void;
  onCancel: () => void;
}

export default function ProductForm({ initialProduct, onSave, onCancel }: ProductFormProps) {
  const [nome, setNome] = useState(initialProduct?.nome || '');
  const [slug, setSlug] = useState(initialProduct?.slug || '');
  const [descrizione, setDescrizione] = useState(initialProduct?.descrizione || '');
  const [marca, setMarca] = useState(initialProduct?.marca || '');
  const [tipoProdotto, setTipoProdotto] = useState(initialProduct?.tipo_prodotto || 'cartoleria');
  const [categoriaId, setCategoriaId] = useState<string>(
    initialProduct?.categoria_id ? String(initialProduct.categoria_id) : ''
  );
  const [categories, setCategories] = useState<CategoryOption[]>(FALLBACK_CATEGORIES);

  useEffect(() => {
    async function loadCategories() {
      try {
        const { data, error } = await supabase
          .from('categorie')
          .select('id, nome, slug, tipo_categoria, ordine')
          .order('ordine', { ascending: true });

        if (!error && data && data.length > 0) {
          setCategories(data as CategoryOption[]);
        }
      } catch (err) {
        console.warn('Uso categorie fallback in ProductForm:', err);
      }
    }

    loadCategories();
  }, []);
  const [prezzo, setPrezzo] = useState(initialProduct?.prezzo ? String(initialProduct.prezzo) : '5.00');
  const [sconto, setSconto] = useState(initialProduct?.sconto_percentuale ? String(initialProduct.sconto_percentuale) : '0');
  const [immagineUrl, setImmagineUrl] = useState(initialProduct?.immagine_url || '');
  const [quantitaDisponibile, setQuantitaDisponibile] = useState(
    initialProduct?.quantita_disponibile != null ? String(initialProduct.quantita_disponibile) : '10'
  );
  const [inEvidenza, setInEvidenza] = useState(initialProduct?.in_evidenza || false);
  const [inEdicola, setInEdicola] = useState(initialProduct?.in_edicola_questo_mese || false);
  const [periodicita, setPeriodicita] = useState(initialProduct?.periodicita || 'mensile');
  const [disponibile, setDisponibile] = useState(
    initialProduct ? (initialProduct.disponibile !== false && (initialProduct.quantita_disponibile == null || initialProduct.quantita_disponibile > 0)) : true
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNomeChange = (val: string) => {
    setNome(val);
    if (!initialProduct) {
      setSlug(slugify(val));
    }
  };

  const handleStockChange = (val: string) => {
    setQuantitaDisponibile(val);
    const num = parseInt(val, 10);
    if (!isNaN(num) && num <= 0) {
      setDisponibile(false);
    } else if (!isNaN(num) && num > 0 && !disponibile) {
      setDisponibile(true);
    }
  };

  // Calcolo dinamico prezzo finale scontato
  const numPrezzo = parseFloat(prezzo) || 0;
  const numSconto = parseFloat(sconto) || 0;
  const prezzoFinale = numSconto > 0 ? numPrezzo * (1 - numSconto / 100) : numPrezzo;
  const risparmio = numPrezzo - prezzoFinale;

  const normalizedTipo = tipoProdotto === 'bar-gift' ? 'bar_gift' : tipoProdotto;
  const filteredSubcats = categories.filter((c) => {
    const catTipo = c.tipo_categoria || c.tipo;
    return catTipo === normalizedTipo;
  });

  const handleSelectTipo = (newTipo: string) => {
    setTipoProdotto(newTipo);
    const norm = newTipo === 'bar-gift' ? 'bar_gift' : newTipo;
    const belongs = categories.some((c) => String(c.id) === categoriaId && (c.tipo_categoria || c.tipo) === norm);
    if (!belongs) {
      setCategoriaId('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      setError('Il nome del prodotto è obbligatorio.');
      return;
    }

    setSaving(true);
    setError(null);

    const numStock = Math.max(0, parseInt(quantitaDisponibile, 10) || 0);
    const isActuallyAvailable = numStock > 0 ? disponibile : false;
    const calcPrezzoScontato = numSconto > 0 
      ? Number((numPrezzo * (1 - numSconto / 100)).toFixed(2)) 
      : null;

    const payload = {
      categoria_id: categoriaId ? categoriaId : null,
      nome: nome.trim(),
      slug: slug || slugify(nome),
      descrizione: descrizione.trim(),
      marca: marca.trim() || null,
      tipo_prodotto: tipoProdotto,
      prezzo: Number(numPrezzo.toFixed(2)),
      sconto_percentuale: Number(numSconto.toFixed(2)),
      prezzo_scontato: calcPrezzoScontato,
      immagine_url: immagineUrl || null,
      quantita_disponibile: numStock,
      in_evidenza: inEvidenza,
      in_edicola_questo_mese: inEdicola,
      periodicita: tipoProdotto === 'edicola' ? periodicita : null,
      disponibile: isActuallyAvailable,
    };

    try {
      if (initialProduct?.id) {
        const { error: updateError } = await supabase
          .from('prodotti')
          .update(payload)
          .eq('id', initialProduct.id);

        if (updateError) throw updateError;
      } else {
        const { error: insertError } = await supabase
          .from('prodotti')
          .insert(payload);

        if (insertError) throw insertError;
      }

      onSave();
    } catch (err: any) {
      console.error('Errore nel salvataggio del prodotto:', err);
      setError(err.message || 'Errore durante il salvataggio nel database.');
    } finally {
      setSaving(false);
    }
  };

  const reparti = [
    {
      id: 'cartoleria',
      label: 'Cartoleria & Scuola',
      icon: BookOpen,
      color: 'border-badge-cartoleria bg-badge-cartoleria/10 text-badge-cartoleria',
      badgeColor: 'bg-badge-cartoleria',
    },
    {
      id: 'edicola',
      label: 'Edicola & Riviste',
      icon: Newspaper,
      color: 'border-badge-edicola bg-badge-edicola/10 text-badge-edicola',
      badgeColor: 'bg-badge-edicola',
    },
    {
      id: 'bar_gift',
      label: 'Bar, Caffè & Gift',
      icon: Coffee,
      color: 'border-badge-gift bg-badge-gift/10 text-badge-gift',
      badgeColor: 'bg-badge-gift',
    },
  ];

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-dark/10 shadow-sm space-y-8">
      
      {/* Header del Form */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-brand-dark/10">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="p-2.5 rounded-xl bg-brand-cream hover:bg-brand-dark/10 text-brand-dark transition-colors flex items-center gap-1.5 text-xs font-bold"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Torna al Catalogo</span>
          </button>

          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-cyan block">
              {initialProduct ? 'Modifica Articolo' : 'Nuovo Inserimento'}
            </span>
            <h2 className="text-xl font-black text-brand-dark">
              {initialProduct ? initialProduct.nome : 'Aggiungi Prodotto al Catalogo'}
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3 self-end sm:self-auto">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2.5 rounded-xl bg-gray-100 hover:bg-gray-200 text-brand-dark/70 text-xs font-bold transition-colors"
          >
            Annulla
          </button>
          
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2.5 rounded-xl bg-brand-cyan hover:bg-brand-cyan/90 text-white text-xs font-bold shadow-md shadow-brand-cyan/25 transition-all flex items-center gap-2 disabled:opacity-50"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Salvataggio...</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Salva Prodotto</span>
              </>
            )}
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Grid a 2 Colonne: Sinistra (Foto & Opzioni) + Destra (Dettagli & Prezzi) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* COLONNA SINISTRA: Foto AVIF & Impostazioni Visibilità */}
        <div className="lg:col-span-5 space-y-6">
          
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-brand-dark mb-2">
              1. Immagine Prodotto (Auto-AVIF) *
            </label>
            <ImageUploader
              currentImageUrl={immagineUrl}
              onImageUploaded={setImmagineUrl}
            />
          </div>

          {/* Opzioni di Visibilità */}
          <div className="p-5 rounded-2xl bg-brand-cream/60 border border-brand-dark/10 space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-dark">
              Visibilità &amp; Stato
            </h4>

            {/* Campo Quantità Disponibile / Giacenza */}
            <div className="p-3.5 rounded-xl bg-white border border-brand-dark/10 space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-brand-dark uppercase tracking-wider">
                  Quantità Disponibile / Giacenza *
                </label>
                {parseInt(quantitaDisponibile, 10) === 0 ? (
                  <span className="text-[10px] font-extrabold text-rose-700 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full">
                    Esaurito (0 pz)
                  </span>
                ) : parseInt(quantitaDisponibile, 10) < 5 ? (
                  <span className="text-[10px] font-extrabold text-amber-800 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                    Scorte Basse ({quantitaDisponibile} pz)
                  </span>
                ) : (
                  <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                    In Magazzino ({quantitaDisponibile} pz)
                  </span>
                )}
              </div>
              <input
                type="number"
                min="0"
                step="1"
                required
                value={quantitaDisponibile}
                onChange={(e) => handleStockChange(e.target.value)}
                placeholder="Es. 10"
                className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan font-black text-brand-dark text-sm"
              />
              <span className="text-[10px] text-brand-dark/50 block">
                Se impostata a 0, il prodotto viene automaticamente contrassegnato come "Esaurito" per i clienti.
              </span>
            </div>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-brand-dark/5 cursor-pointer hover:border-brand-cyan/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <span className={`w-2.5 h-2.5 rounded-full ${disponibile ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                <div>
                  <span className="text-xs font-bold text-brand-dark block">
                    {disponibile ? 'Articolo Disponibile' : 'Articolo Non Disponibile / Esaurito'}
                  </span>
                  <span className="text-[10px] text-brand-dark/60">
                    {disponibile ? 'Visibile per acquisto e prenotazione' : 'Disabilitato per acquisto'}
                  </span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={disponibile}
                onChange={(e) => {
                  const checked = e.target.checked;
                  setDisponibile(checked);
                  if (checked && parseInt(quantitaDisponibile, 10) === 0) {
                    setQuantitaDisponibile('1');
                  }
                }}
                className="w-4 h-4 rounded text-brand-cyan focus:ring-brand-cyan"
              />
            </label>

            <label className="flex items-center justify-between p-3 rounded-xl bg-white border border-brand-dark/5 cursor-pointer hover:border-brand-amber/40 transition-colors">
              <div className="flex items-center gap-2.5">
                <Sparkles className="w-4 h-4 text-brand-amber" />
                <div>
                  <span className="text-xs font-bold text-brand-dark block">Mostra in Evidenza (Home)</span>
                  <span className="text-[10px] text-brand-dark/60">In primo piano nella vetrina principale</span>
                </div>
              </div>
              <input
                type="checkbox"
                checked={inEvidenza}
                onChange={(e) => setInEvidenza(e.target.checked)}
                className="w-4 h-4 rounded text-brand-amber focus:ring-brand-amber"
              />
            </label>

            {tipoProdotto === 'edicola' && (
              <div className="p-3 rounded-xl bg-emerald-50/70 border border-emerald-200/80 space-y-2">
                <label className="flex items-center justify-between cursor-pointer">
                  <div>
                    <span className="text-xs font-bold text-emerald-950 block">📰 In Edicola questo Mese</span>
                    <span className="text-[10px] text-emerald-800/80">Evidenzia come pubblicazione recente</span>
                  </div>
                  <input
                    type="checkbox"
                    checked={inEdicola}
                    onChange={(e) => setInEdicola(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                </label>

                <div className="pt-2 border-t border-emerald-200/60">
                  <label className="block text-[10px] font-bold text-emerald-900 mb-1">
                    Periodicità Pubblicazione
                  </label>
                  <select
                    value={periodicita}
                    onChange={(e) => setPeriodicita(e.target.value)}
                    className="w-full px-2.5 py-1.5 bg-white border border-emerald-300 rounded-lg text-xs font-semibold text-emerald-950"
                  >
                    <option value="giornaliero">Giornaliero</option>
                    <option value="settimanale">Settimanale</option>
                    <option value="mensile">Mensile</option>
                    <option value="speciale">Edizione Speciale / Gadget</option>
                  </select>
                </div>
              </div>
            )}
          </div>

        </div>

        {/* COLONNA DESTRA: Dettagli, Reparto & Calcolo Prezzi */}
        <div className="lg:col-span-7 space-y-6">
          
          {/* Selettore Reparto Visivo */}
          <div>
            <label className="block text-xs font-extrabold uppercase tracking-wider text-brand-dark mb-2">
              2. Reparto del Negozio *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {reparti.map((rep) => {
                const Icon = rep.icon;
                const isSelected = tipoProdotto === rep.id || (rep.id === 'bar_gift' && tipoProdotto === 'bar-gift');

                return (
                  <button
                    key={rep.id}
                    type="button"
                    onClick={() => handleSelectTipo(rep.id)}
                    className={`p-3.5 rounded-2xl border-2 text-left transition-all flex flex-col justify-between gap-2 ${
                      isSelected
                        ? `${rep.color} font-bold shadow-sm scale-[1.02]`
                        : 'border-brand-dark/10 bg-white text-brand-dark/70 hover:border-brand-dark/30'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <Icon className="w-5 h-5" />
                      <span className={`w-2 h-2 rounded-full ${isSelected ? rep.badgeColor : 'bg-gray-300'}`} />
                    </div>
                    <span className="text-xs leading-tight block">{rep.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selettore Sottocategoria Specifica */}
          <div className="p-4 rounded-2xl bg-brand-cream/40 border border-brand-dark/10 space-y-2">
            <div className="flex items-center justify-between">
              <label className="flex items-center gap-1.5 text-xs font-extrabold uppercase tracking-wider text-brand-dark">
                <Layers className="w-3.5 h-3.5 text-brand-cyan" />
                <span>Sottocategoria Specifica (Opzionale)</span>
              </label>
              {filteredSubcats.length > 0 && (
                <span className="text-[10px] text-brand-dark/60 font-semibold">
                  {filteredSubcats.length} categorie per questo reparto
                </span>
              )}
            </div>

            <select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-white border border-brand-dark/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-cyan text-xs font-bold text-brand-dark cursor-pointer shadow-2xs"
            >
              <option value="">Nessuna / Categoria Generale del Reparto</option>
              {filteredSubcats.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.nome}
                </option>
              ))}
            </select>
            <p className="text-[10px] text-brand-dark/60">
              Assegnando una sottocategoria, il prodotto potrà essere filtrato rapidamente tramite i pulsanti a pillola nel catalogo.
            </p>
          </div>

          {/* Nome e Marca */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="sm:col-span-2">
              <label className="block font-bold text-brand-dark mb-1 uppercase tracking-wider">
                Nome Articolo / Prodotto *
              </label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => handleNomeChange(e.target.value)}
                placeholder="Es. Quadernone Maxi A4 a Righe 100g"
                className="w-full px-4 py-3 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan font-bold text-brand-dark text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-brand-dark mb-1 uppercase tracking-wider">
                Marca / Editore
              </label>
              <input
                type="text"
                value={marca}
                onChange={(e) => setMarca(e.target.value)}
                placeholder="Es. BIC, Pigna, Panini, RCS"
                className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan font-medium text-brand-dark"
              />
            </div>

            <div>
              <label className="block font-bold text-brand-dark mb-1 uppercase tracking-wider">
                Slug URL (Auto-generato)
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="quaderno-maxi-a4"
                className="w-full px-3.5 py-2.5 bg-gray-50 border border-brand-dark/15 rounded-xl text-brand-dark/70 font-mono text-[11px]"
              />
            </div>
          </div>

          {/* Prezzi & Sconti con Anteprima Calcolo Live */}
          <div className="p-5 rounded-2xl bg-white border border-brand-dark/10 shadow-sm space-y-4">
            <h4 className="text-xs font-extrabold uppercase tracking-wider text-brand-dark flex items-center gap-1.5">
              <DollarSign className="w-4 h-4 text-brand-cyan" />
              Prezzo di Vendita &amp; Promozioni
            </h4>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <label className="block font-bold text-brand-dark mb-1">
                  Prezzo di Listino (€) *
                </label>
                <input
                  type="number"
                  step="0.05"
                  min="0"
                  required
                  value={prezzo}
                  onChange={(e) => setPrezzo(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan font-black text-brand-dark text-base"
                />
              </div>

              <div>
                <label className="block font-bold text-brand-dark mb-1">
                  Sconto (%)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  max="100"
                  value={sconto}
                  onChange={(e) => setSconto(e.target.value)}
                  placeholder="0"
                  className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan font-black text-brand-dark text-base"
                />
              </div>
            </div>

            {/* Live Calculation Preview Card */}
            <div className="p-3.5 rounded-xl bg-brand-cream/60 border border-brand-dark/10 flex items-center justify-between text-xs">
              <div>
                <span className="text-[10px] font-bold text-brand-dark/60 uppercase block">Prezzo Finale Cliente</span>
                <span className="text-lg font-black text-brand-dark">
                  {formatPrice(prezzoFinale)}
                </span>
              </div>

              {numSconto > 0 ? (
                <div className="text-right">
                  <span className="px-2.5 py-1 rounded-full bg-rose-500 text-white text-[10px] font-extrabold inline-block mb-0.5">
                    -{numSconto}% SCONTO
                  </span>
                  <span className="text-[10px] text-brand-dark/60 block font-semibold">
                    Risparmio cliente: {formatPrice(risparmio)}
                  </span>
                </div>
              ) : (
                <span className="text-[11px] text-brand-dark/60 font-semibold">Nessun sconto applicato</span>
              )}
            </div>

          </div>

          {/* Descrizione */}
          <div className="text-xs">
            <label className="block font-bold text-brand-dark mb-1 uppercase tracking-wider">
              Descrizione Dettagliata
            </label>
            <textarea
              rows={4}
              value={descrizione}
              onChange={(e) => setDescrizione(e.target.value)}
              placeholder="Fornisci dettagli su formato, materiali, numero pagine o caratteristiche speciali del prodotto..."
              className="w-full px-4 py-3 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-cyan text-brand-dark leading-relaxed"
            />
          </div>

        </div>

      </div>

    </form>
  );
}
