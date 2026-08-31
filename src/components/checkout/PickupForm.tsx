import React from 'react';

export interface PickupFormData {
  fasciaRitiro: string;
  dataRitiro: string;
  noteRitiro: string;
}

interface PickupFormProps {
  data: PickupFormData;
  onChange: (data: PickupFormData) => void;
}

const FASCE_ORARIE = [
  '08:00 – 10:00 (Mattina presto)',
  '10:00 – 12:30 (Metà mattinata)',
  '14:00 – 16:30 (Pomeriggio)',
  '16:30 – 19:30 (Tardo pomeriggio)',
];

export default function PickupForm({ data, onChange }: PickupFormProps) {
  const handleChange = (field: keyof PickupFormData, value: string) => {
    onChange({
      ...data,
      [field]: value,
    });
  };

  // Calcola data minima di ritiro: oggi o domani
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="space-y-4 p-5 rounded-2xl bg-emerald-50/50 border border-emerald-200">
      
      <div className="flex items-center justify-between pb-3 border-emerald-200/60">
        <h4 className="text-sm font-bold text-emerald-950 flex items-center gap-2">
          <span>🛍️ Scegli &amp; Ritira in Negozio (Zero Spese)</span>
        </h4>
        <span className="text-xs font-bold text-emerald-700 bg-emerald-100 px-2.5 py-0.5 rounded-full">
          Gratuito
        </span>
      </div>

      <div className="p-3 rounded-xl bg-white/80 border border-emerald-200/50 text-xs text-emerald-900 leading-relaxed">
        <strong>Dove ritirare:</strong> Brilla Cafe’, Via Umberto I, 35, Castelnuovo Bocca d'Adda.<br />
        <strong>Pagamento:</strong> Pagherai direttamente al momento del ritiro (contanti o carta/POS)!
      </div>

      <div className="space-y-3 text-xs">
        
        <div>
          <label className="block font-bold text-emerald-950 mb-1">
            Giorno di Ritiro Previsto *
          </label>
          <input
            type="date"
            required
            min={today}
            value={data.dataRitiro || today}
            onChange={(e) => handleChange('dataRitiro', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-brand-dark"
          />
        </div>

        <div>
          <label className="block font-bold text-emerald-950 mb-1">
            Fascia Oraria di Ritiro Preferita *
          </label>
          <select
            value={data.fasciaRitiro}
            onChange={(e) => handleChange('fasciaRitiro', e.target.value)}
            className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 font-medium text-brand-dark"
          >
            {FASCE_ORARIE.map((fascia) => (
              <option key={fascia} value={fascia}>
                {fascia}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block font-bold text-emerald-950 mb-1">
            Note o Istruzioni Aggiuntive (Opzionale)
          </label>
          <input
            type="text"
            value={data.noteRitiro}
            onChange={(e) => handleChange('noteRitiro', e.target.value)}
            placeholder="Es. passerà mia figlia a ritirare"
            className="w-full px-3.5 py-2.5 bg-white border border-emerald-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 text-brand-dark"
          />
        </div>

      </div>

    </div>
  );
}
