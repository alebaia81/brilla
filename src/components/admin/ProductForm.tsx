import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { slugify } from '../../lib/format';
import ImageUploader from './ImageUploader';
import { type Product } from '../catalogo/ProductCard';
import { Save, ArrowLeft, Loader2, Check } from 'lucide-react';

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
  const [prezzo, setPrezzo] = useState(initialProduct?.prezzo ? String(initialProduct.prezzo) : '5.00');
  const [sconto, setSconto] = useState(initialProduct?.sconto_percentuale ? String(initialProduct.sconto_percentuale) : '0');
  const [immagineUrl, setImmagineUrl] = useState(initialProduct?.immagine_url || '');
  const [inEvidenza, setInEvidenza] = useState(initialProduct?.in_evidenza || false);
  const [inEdicola, setInEdicola] = useState(initialProduct?.in_edicola_questo_mese || false);
  const [periodicita, setPeriodicita] = useState(initialProduct?.periodicita || 'mensile');
  const [disponibile, setDisponibile] = useState(initialProduct?.disponibile !== false);

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleNomeChange = (val: string) => {
    setNome(val);
    if (!initialProduct) {
      setSlug(slugify(val));
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

    // Mappa tipo categoria su ID (1: Cartoleria, 2: Edicola, 3: Bar & Gift)
    let catId = 1;
    if (tipoProdotto === 'edicola') catId = 2;
    if (tipoProdotto === 'bar_gift' || tipoProdotto === 'bar-gift') catId = 3;

    const payload = {
      categoria_id: catId,
      nome: nome.trim(),
      slug: slug || slugify(nome),
      descrizione: descrizione.trim(),
      marca: marca.trim() || null,
      tipo_prodotto: tipoProdotto,
      prezzo: Number(prezzo),
      sconto_percentuale: Number(sconto) || 0,
      immagine_url: immagineUrl || null,
      in_evidenza: inEvidenza,
      in_edicola_questo_mese: inEdicola,
      periodicita: tipoProdotto === 'edicola' ? periodicita : null,
      disponibile: disponibile,
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
      setError(err.message || 'Errore nel salvataggio.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-dark/10 shadow-sm space-y-6">
      
      {/* Header del Form */}
      <div className="flex items-center justify-between pb-4 border-b border-brand-dark/10">
        <button
          type="button"
          onClick={onCancel}
          className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark/60 hover:text-brand-dark transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Indietro</span>
        </button>

        <h3 className="text-base font-extrabold text-brand-dark">
          {initialProduct ? `Modifica: ${initialProduct.nome}` : 'Nuovo Prodotto a Catalogo'}
        </h3>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
          ⚠️ {error}
        </div>
      )}

      {/* 1. Informazioni Generali */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
        
        <div className="sm:col-span-2">
          <label className="block font-bold text-brand-dark mb-1 uppercase tracking-wider">
            Nome Articolo *
          </label>
          <input
            type="text"
            required
            value={nome}
            onChange={(e) => handleNomeChange(e.target.value)}
            placeholder="Es. Quaderno Maxi A4 Righe 100g"
            className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber font-semibold text-brand-dark"
          />
        </div>

        <div>
          <label className="block font-bold text-brand-dark mb-1 uppercase tracking-wider">
            Reparto / Sezione *
          </label>
          <select
            value={tipoProdotto}
            onChange={(e) => setTipoProdotto(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber font-medium text-brand-dark"
          >
            <option value="cartoleria">Cartoleria &amp; Scuola</option>
            <option value="edicola">Edicola &amp; Riviste</option>
            <option value="bar_gift">Bar, Caffè &amp; Idee Regalo</option>
          </select>
        </div>

        <div>
          <label className="block font-bold text-brand-dark mb-1 uppercase tracking-wider">
            Marca / Editore
          </label>
          <input
            type="text"
            value={marca}
            onChange={(e) => setMarca(e.target.value)}
            placeholder="Es. Pigna, BIC, RCS, Brilla"
            className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber text-brand-dark"
          />
        </div>

      </div>

      {/* 2. Prezzo e Sconti */}
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div>
          <label className="block font-bold text-brand-dark mb-1 uppercase tracking-wider">
            Prezzo Base (€) *
          </label>
          <input
            type="number"
            step="0.10"
            min="0"
            required
            value={prezzo}
            onChange={(e) => setPrezzo(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber font-bold text-brand-dark"
          />
        </div>

        <div>
          <label className="block font-bold text-brand-dark mb-1 uppercase tracking-wider">
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
            className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber font-bold text-brand-dark"
          />
        </div>
      </div>

      {/* 3. Image Uploader AVIF */}
      <div className="pt-2">
        <ImageUploader
          currentImageUrl={immagineUrl}
          onImageUploaded={setImmagineUrl}
        />
      </div>

      {/* 4. Descrizione */}
      <div className="text-xs">
        <label className="block font-bold text-brand-dark mb-1 uppercase tracking-wider">
          Descrizione Dettagliata
        </label>
        <textarea
          rows={3}
          value={descrizione}
          onChange={(e) => setDescrizione(e.target.value)}
          placeholder="Dettagli sulle caratteristiche, dimensioni, materiali..."
          className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber text-brand-dark leading-relaxed"
        />
      </div>

      {/* 5. Toggles Speciali */}
      <div className="p-4 rounded-2xl bg-brand-cream/50 border border-brand-dark/10 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={inEvidenza}
            onChange={(e) => setInEvidenza(e.target.checked)}
            className="w-4 h-4 rounded text-brand-amber focus:ring-brand-amber"
          />
          <span className="font-bold text-brand-dark">✨ Mostra in Home</span>
        </label>

        {tipoProdotto === 'edicola' && (
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={inEdicola}
              onChange={(e) => setInEdicola(e.target.checked)}
              className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
            />
            <span className="font-bold text-emerald-900">📰 In Edicola questo Mese</span>
          </label>
        )}

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={disponibile}
            onChange={(e) => setDisponibile(e.target.checked)}
            className="w-4 h-4 rounded text-brand-dark focus:ring-brand-dark"
          />
          <span className="font-bold text-brand-dark">Disponibile</span>
        </label>

      </div>

      {/* Pulsanti Azione */}
      <div className="flex items-center justify-end gap-3 pt-4 border-t border-brand-dark/10">
        <button
          type="button"
          onClick={onCancel}
          className="px-5 py-2.5 text-xs font-bold text-brand-dark/70 hover:bg-brand-cream rounded-xl transition-colors"
        >
          Annulla
        </button>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 bg-brand-amber hover:bg-brand-amber/90 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center gap-2"
        >
          {saving ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Salvataggio...</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>{initialProduct ? 'Salva Modifiche' : 'Crea Prodotto'}</span>
            </>
          )}
        </button>
      </div>

    </form>
  );
}
