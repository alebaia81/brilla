import React from 'react';
import { Search, X, RotateCcw } from 'lucide-react';

interface FilterSidebarProps {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedTipo: string;
  onTipoChange: (tipo: string) => void;
  selectedMarca: string;
  onMarcaChange: (marca: string) => void;
  availableMarcas: string[];
  maxPrice: number;
  currentMaxPrice: number;
  onMaxPriceChange: (price: number) => void;
  onReset: () => void;
}

export default function FilterSidebar({
  searchTerm,
  onSearchChange,
  selectedTipo,
  onTipoChange,
  selectedMarca,
  onMarcaChange,
  availableMarcas,
  maxPrice,
  currentMaxPrice,
  onMaxPriceChange,
  onReset,
}: FilterSidebarProps) {
  const hasActiveFilters = Boolean(
    searchTerm || selectedTipo !== 'all' || selectedMarca !== 'all' || currentMaxPrice < maxPrice
  );

  return (
    <div className="bg-white rounded-3xl p-6 border border-brand-dark/10 shadow-sm space-y-8 sticky top-24">
      
      {/* Intestazione Filtri */}
      <div className="flex items-center justify-between pb-4 border-b border-brand-dark/10">
        <h3 className="text-base font-extrabold text-brand-dark flex items-center gap-2">
          <span>🔍 Filtra Prodotti</span>
        </h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Azzera</span>
          </button>
        )}
      </div>

      {/* 1. Ricerca Testuale Full-Text */}
      <div className="space-y-2">
        <label htmlFor="catalog-search-input" className="text-xs font-bold text-brand-dark uppercase tracking-wider block">
          Cerca per Nome o Parola
        </label>
        <div className="relative">
          <input
            id="catalog-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Es. quaderno, penna, mug..."
            className="w-full pl-9 pr-8 py-2.5 text-xs bg-brand-cream/50 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2C3E50] transition-all text-brand-dark"
          />
          <Search className="w-4 h-4 text-brand-dark/40 absolute left-3 top-3" aria-hidden="true" />
          {searchTerm && (
            <button
              type="button"
              onClick={() => onSearchChange('')}
              className="absolute right-2.5 top-2.5 text-brand-dark/50 hover:text-brand-dark p-0.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3E50]"
              aria-label="Cancella testo di ricerca"
            >
              <X className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* 2. Reparto / Tipo Prodotto */}
      <div className="space-y-2.5">
        <span className="text-xs font-bold text-brand-dark uppercase tracking-wider block" id="reparto-filter-label">
          Reparto
        </span>
        <div className="flex flex-col gap-1.5" role="group" aria-labelledby="reparto-filter-label">
          {[
            { id: 'all', label: 'Tutte le Categorie', color: 'bg-brand-dark' },
            { id: 'cartoleria', label: 'Cartoleria & Scuola', color: 'bg-badge-cartoleria' },
            { id: 'edicola', label: 'Edicola & Riviste', color: 'bg-badge-edicola' },
            { id: 'bar_gift', label: 'Bar, Caffè & Idee Regalo', color: 'bg-badge-gift' },
          ].map((cat) => {
            const isSelected = selectedTipo === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => onTipoChange(cat.id)}
                aria-pressed={isSelected}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition-all text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#2C3E50] cursor-pointer ${
                  isSelected
                    ? 'bg-brand-dark text-white shadow-sm'
                    : 'bg-brand-cream/40 text-brand-dark/80 hover:bg-brand-cream hover:text-brand-dark'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={`w-2 h-2 rounded-full ${cat.color}`} aria-hidden="true"></span>
                  <span>{cat.label}</span>
                </span>
                {isSelected && <span className="text-[10px] opacity-70" aria-hidden="true">✓</span>}
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Filtro per Marca */}
      {availableMarcas.length > 0 && (
        <div className="space-y-2">
          <label htmlFor="marca-filter-select" className="text-xs font-bold text-brand-dark uppercase tracking-wider block">
            Marca / Editore
          </label>
          <select
            id="marca-filter-select"
            value={selectedMarca}
            onChange={(e) => onMarcaChange(e.target.value)}
            className="w-full px-3 py-2.5 text-xs bg-brand-cream/50 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2C3E50] transition-all text-brand-dark font-medium cursor-pointer"
          >
            <option value="all">Tutte le Marche</option>
            {availableMarcas.map((marca) => (
              <option key={marca} value={marca}>
                {marca}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* 4. Filtro Fascia di Prezzo Max */}
      <div className="space-y-3">
        <div className="flex justify-between items-center text-xs font-bold text-brand-dark">
          <label htmlFor="price-range-input" className="uppercase tracking-wider">Prezzo Massimo</label>
          <span className="text-brand-amber font-extrabold text-sm">
            fino a € {currentMaxPrice.toFixed(2)}
          </span>
        </div>
        <input
          id="price-range-input"
          type="range"
          min="1"
          max={maxPrice > 1 ? maxPrice : 100}
          step="0.5"
          value={currentMaxPrice}
          onChange={(e) => onMaxPriceChange(Number(e.target.value))}
          className="w-full accent-brand-amber cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3E50] rounded-lg"
          aria-valuemin={1}
          aria-valuemax={maxPrice}
          aria-valuenow={currentMaxPrice}
        />
        <div className="flex justify-between text-[10px] text-brand-dark/60 font-semibold" aria-hidden="true">
          <span>€ 1,00</span>
          <span>€ {maxPrice.toFixed(2)}</span>
        </div>
      </div>

    </div>
  );
}
