import React from 'react';

export interface ShippingFormData {
  indirizzo: string;
  citta: string;
  cap: string;
  noteSpedizione: string;
}

interface ShippingFormProps {
  data: ShippingFormData;
  onChange: (data: ShippingFormData) => void;
  shippingCost: number;
}

export default function ShippingForm({ data, onChange, shippingCost }: ShippingFormProps) {
  const handleChange = (field: keyof ShippingFormData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-brand-cream/40 border border-brand-dark/10">
      
      <div className="flex items-center justify-between pb-3 border-b border-brand-dark/10">
        <h4 className="text-sm font-bold text-brand-dark flex items-center gap-2">
          <span>📦 Dati di Spedizione</span>
        </h4>
        <span className="text-xs font-bold text-brand-amber bg-brand-amber/15 px-2.5 py-0.5 rounded-full">
          Costo fisso: € {shippingCost.toFixed(2)}
        </span>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <label className="block font-bold text-brand-dark mb-1">
            Indirizzo (Via, Piazza e Numero Civico) *
          </label>
          <input
            type="text"
            required
            value={data.indirizzo}
            onChange={(e) => handleChange('indirizzo', e.target.value)}
            placeholder="Es. Via Garibaldi 12"
            className="w-full px-3.5 py-2.5 bg-white border border-brand-dark/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block font-bold text-brand-dark mb-1">
              Città / Comune *
            </label>
            <input
              type="text"
              required
              value={data.citta}
              onChange={(e) => handleChange('citta', e.target.value)}
              placeholder="Es. Castelnuovo Bocca d'Adda"
              className="w-full px-3.5 py-2.5 bg-white border border-brand-dark/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber"
            />
          </div>

          <div>
            <label className="block font-bold text-brand-dark mb-1">
              CAP *
            </label>
            <input
              type="text"
              required
              value={data.cap}
              onChange={(e) => handleChange('cap', e.target.value)}
              placeholder="Es. 26843"
              maxLength={5}
              className="w-full px-3.5 py-2.5 bg-white border border-brand-dark/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber"
            />
          </div>
        </div>

        <div>
          <label className="block font-bold text-brand-dark mb-1">
            Note per il Corriere (Opzionale)
          </label>
          <input
            type="text"
            value={data.noteSpedizione}
            onChange={(e) => handleChange('noteSpedizione', e.target.value)}
            placeholder="Es. Citofono Rossi, scala B"
            className="w-full px-3.5 py-2.5 bg-white border border-brand-dark/15 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand-amber"
          />
        </div>
      </div>

    </div>
  );
}
