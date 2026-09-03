import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import { type Product } from '../catalogo/ProductCard';
import ProductForm from './ProductForm';
import { formatPrice } from '../../lib/format';
import CategoryBadge from '../catalogo/CategoryBadge';
import { Plus, Edit2, Trash2, Search, Sparkles, X, Filter } from 'lucide-react';

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Filtri client-side
  const [selectedReparto, setSelectedReparto] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStato, setSelectedStato] = useState<'all' | 'attivi' | 'disattivati'>('all');

  const loadProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('prodotti')
        .select('*')
        .order('id', { ascending: false });

      if (!error && data) {
        setProducts(data as Product[]);
      }
    } catch (err) {
      console.error('Errore nel caricamento dei prodotti:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, []);

  const handleDelete = async (id: number | string, name: string) => {
    if (!window.confirm(`Sei sicuro di voler eliminare "${name}" dal catalogo?`)) {
      return;
    }

    try {
      const { error } = await supabase.from('prodotti').delete().eq('id', id);
      if (error) throw error;
      setProducts(products.filter((p) => p.id !== id));
    } catch (err: any) {
      alert('Errore durante l\'eliminazione: ' + err.message);
    }
  };

  const handleToggleOnline = async (product: Product) => {
    const isCurrentlyOnline = product.disponibile !== false && (product.quantita_disponibile == null || product.quantita_disponibile > 0);
    const newStatus = !isCurrentlyOnline;

    // Se si tenta di attivare un articolo con scorte a 0
    if (newStatus && product.quantita_disponibile != null && product.quantita_disponibile <= 0) {
      alert("Imposta prima una giacenza superiore a 0 per pubblicare l'articolo.");
      return;
    }

    // Aggiornamento ottimistico dello stato locale
    setProducts((prev) =>
      prev.map((p) => (p.id === product.id ? { ...p, disponibile: newStatus } : p))
    );

    try {
      const { error } = await supabase
        .from('prodotti')
        .update({ disponibile: newStatus })
        .eq('id', product.id);

      if (error) throw error;
    } catch (err: any) {
      console.error('Errore aggiornamento stato online:', err);
      alert(`Errore durante l'aggiornamento: ${err.message || 'Riprova tra poco.'}`);
      // Rollback
      setProducts((prev) =>
        prev.map((p) => (p.id === product.id ? { ...p, disponibile: product.disponibile } : p))
      );
    }
  };

  // Definizione dei reparti disponibili
  const reparti = [
    { id: 'all', label: 'Tutti i Reparti' },
    { id: 'cartoleria', label: 'Cartoleria & Scuola', color: 'bg-badge-cartoleria' },
    { id: 'edicola', label: 'Edicola & Riviste', color: 'bg-badge-edicola' },
    { id: 'bar_gift', label: 'Bar, Caffè & Idee Regalo', color: 'bg-badge-gift' },
  ];

  // Conteggio dinamico degli articoli per ciascun reparto
  const repartoCounts = useMemo(() => {
    const counts: Record<string, number> = {
      all: products.length,
      cartoleria: 0,
      edicola: 0,
      bar_gift: 0,
    };

    products.forEach((p) => {
      const t = (p.tipo_prodotto || (p as any).tipo || (p as any).categoria_tipo || '').replace('-', '_');
      if (t && counts[t] !== undefined) {
        counts[t]++;
      }
    });

    return counts;
  }, [products]);

  // Logica di filtraggio client-side completa
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Filtro Macro-Reparto
      const tipo = (p.tipo_prodotto || (p as any).tipo || (p as any).categoria_tipo || '').replace('-', '_');
      const matchReparto = selectedReparto === 'all' || tipo === selectedReparto;

      // 2. Filtro Query Testo (nome o marca)
      const q = searchTerm.toLowerCase().trim();
      const matchQuery =
        !q ||
        (p.nome && p.nome.toLowerCase().includes(q)) ||
        (p.marca && p.marca.toLowerCase().includes(q));

      // 3. Filtro Stato Disponibilità
      const isZeroStock = p.quantita_disponibile != null && p.quantita_disponibile <= 0;
      const isAttivo = p.disponibile !== false && !isZeroStock;
      const matchStato =
        selectedStato === 'all'
          ? true
          : selectedStato === 'attivi'
          ? isAttivo
          : !isAttivo;

      return matchReparto && matchQuery && matchStato;
    });
  }, [products, selectedReparto, searchTerm, selectedStato]);

  const hasActiveFilters = selectedReparto !== 'all' || searchTerm.trim() !== '' || selectedStato !== 'all';

  const handleResetFilters = () => {
    setSelectedReparto('all');
    setSearchTerm('');
    setSelectedStato('all');
  };

  if (isCreating || editingProduct) {
    return (
      <ProductForm
        initialProduct={editingProduct}
        onSave={() => {
          setIsCreating(false);
          setEditingProduct(null);
          loadProducts();
        }}
        onCancel={() => {
          setIsCreating(false);
          setEditingProduct(null);
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      
      {/* Header & Azioni */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-brand-dark/10 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-brand-dark">Gestione Catalogo Prodotti</h2>
          <p className="text-xs text-brand-dark/60 mt-0.5">
            {products.length} articoli totali presenti nel database · {filteredProducts.length} visualizzati.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-5 py-2.5 bg-brand-cyan hover:bg-brand-cyan/90 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-cyan/20 transition-all flex items-center gap-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2C3E50] cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Prodotto</span>
          </button>
        </div>
      </div>

      {/* Barra Filtri Completa: Tabs Reparti + Ricerca + Selettore Stato */}
      <div className="bg-white p-4 sm:p-5 rounded-3xl border border-brand-dark/10 shadow-sm space-y-4">
        
        {/* Riga 1: Tabs Reparto con Contatori Numerici */}
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 max-w-full scrollbar-none" role="tablist" aria-label="Filtra per reparto">
            {reparti.map((rep) => {
              const isSelected = selectedReparto === rep.id;
              const count = repartoCounts[rep.id] ?? 0;

              return (
                <button
                  key={rep.id}
                  type="button"
                  role="tab"
                  aria-selected={isSelected}
                  aria-pressed={isSelected}
                  onClick={() => setSelectedReparto(rep.id)}
                  className={`px-3.5 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-2xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#2C3E50] cursor-pointer ${
                    isSelected
                      ? 'bg-brand-dark text-white shadow-sm scale-[1.02]'
                      : 'bg-brand-cream/50 text-brand-dark/75 hover:bg-brand-cream hover:text-brand-dark border border-brand-dark/10'
                  }`}
                >
                  {rep.color && (
                    <span className={`w-2 h-2 rounded-full ${rep.color}`} aria-hidden="true" />
                  )}
                  <span>{rep.label}</span>
                  <span
                    className={`text-[10px] px-2 py-0.5 rounded-full font-black ${
                      isSelected
                        ? 'bg-white/20 text-white'
                        : 'bg-brand-dark/10 text-brand-dark'
                    }`}
                  >
                    {count}
                  </span>
                </button>
              );
            })}
          </div>

          {hasActiveFilters && (
            <button
              type="button"
              onClick={handleResetFilters}
              className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 px-3 py-1.5 rounded-xl hover:bg-rose-50 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-600 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
              <span>Azzera filtri</span>
            </button>
          )}
        </div>

        {/* Riga 2: Ricerca Testuale & Selettore Stato */}
        <div className="pt-3 border-t border-brand-dark/5 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          
          {/* Campo Ricerca Testo */}
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Cerca per nome prodotto o marca..."
              aria-label="Cerca articoli nel catalogo per nome o marca"
              className="w-full pl-9 pr-8 py-2.5 bg-brand-cream/40 border border-brand-dark/10 rounded-xl text-xs text-brand-dark focus:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#2C3E50] transition-all"
            />
            <Search className="w-4 h-4 text-brand-dark/40 absolute left-3 top-2.5" aria-hidden="true" />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-brand-dark/40 hover:text-brand-dark p-0.5 rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3E50]"
                aria-label="Cancella testo di ricerca"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Mini-selettore Stato Disponibilità */}
          <div className="flex items-center gap-2 bg-brand-cream/40 px-3 py-1.5 rounded-xl border border-brand-dark/10 text-xs font-semibold">
            <Filter className="w-3.5 h-3.5 text-brand-dark/50 flex-shrink-0" aria-hidden="true" />
            <label htmlFor="stato-filter-select" className="text-brand-dark/60 whitespace-nowrap text-[11px] font-bold">
              Stato:
            </label>
            <select
              id="stato-filter-select"
              value={selectedStato}
              onChange={(e: any) => setSelectedStato(e.target.value)}
              aria-label="Filtra per stato di disponibilità"
              className="bg-transparent text-brand-dark font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3E50] rounded-lg px-1 cursor-pointer"
            >
              <option value="all">Tutti gli stati ({products.length})</option>
              <option value="attivi">Solo Attivi nello Store</option>
              <option value="disattivati">Solo Disattivati / Esauriti</option>
            </select>
          </div>

        </div>

      </div>

      {/* Tabella / Lista Prodotti */}
      <div className="bg-white rounded-3xl border border-brand-dark/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            <thead className="bg-brand-cream/60 border-b border-brand-dark/10 text-brand-dark uppercase tracking-wider font-extrabold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Articolo</th>
                <th className="py-3.5 px-4">Reparto</th>
                <th className="py-3.5 px-4">Prezzo</th>
                <th className="py-3.5 px-4">Stato Scorte</th>
                <th className="py-3.5 px-4 text-center">Online / Attivo</th>
                <th className="py-3.5 px-4 text-right">Azioni</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-dark/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-16 text-center text-brand-dark/60 space-y-2">
                    <p className="text-sm font-bold text-brand-dark">
                      {selectedReparto !== 'all'
                        ? 'Nessun prodotto trovato per questo reparto.'
                        : 'Nessun prodotto trovato.'}
                    </p>
                    <p className="text-xs text-brand-dark/50">
                      Prova a modificare i filtri di ricerca o la selezione dello stato.
                    </p>
                    {hasActiveFilters && (
                      <button
                        type="button"
                        onClick={handleResetFilters}
                        className="inline-flex items-center gap-1 px-4 py-1.5 bg-brand-dark text-white text-xs font-semibold rounded-xl hover:bg-brand-dark/90 transition-colors mt-2 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3E50]"
                      >
                        Reimposta tutti i filtri
                      </button>
                    )}
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const isZeroStock = p.quantita_disponibile != null && p.quantita_disponibile <= 0;
                  const isOnline = !isZeroStock && p.disponibile !== false;

                  return (
                    <tr key={p.id} className="hover:bg-brand-cream/20 transition-colors">
                      
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <img
                            src={p.immagine_url || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=100&auto=format&fit=crop&q=80'}
                            alt={p.nome}
                            className="w-10 h-10 rounded-xl object-cover bg-brand-cream border border-brand-dark/10 flex-shrink-0"
                          />
                          <div>
                            <span className="font-bold text-brand-dark block line-clamp-1">{p.nome}</span>
                            <span className="text-[10px] text-brand-dark/50">{p.marca || 'Nessuna marca'}</span>
                          </div>
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <CategoryBadge tipo={p.tipo_prodotto} />
                      </td>

                      <td className="py-3.5 px-4 font-bold text-brand-dark">
                        {formatPrice(p.prezzo_scontato || p.prezzo)}
                        {p.sconto_percentuale ? (
                          <span className="text-[10px] text-rose-600 block">-{p.sconto_percentuale}%</span>
                        ) : null}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex flex-col gap-1 items-start">
                          {!isZeroStock && p.disponibile !== false ? (
                            p.quantita_disponibile != null && p.quantita_disponibile < 5 ? (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300">
                                Solo {p.quantita_disponibile} pz!
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                                Disponibile {p.quantita_disponibile != null ? `(${p.quantita_disponibile} pz)` : ''}
                              </span>
                            )
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">
                              {isZeroStock ? 'Esaurito (0 pz)' : 'Disattivato'}
                            </span>
                          )}
                          {p.in_evidenza && (
                            <span className="text-[9px] text-brand-amber font-bold flex items-center gap-0.5">
                              <Sparkles className="w-2.5 h-2.5" /> In Evidenza
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Colonna Online / Attivo con Switch Toggle Rapido */}
                      <td className="py-3.5 px-4 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            type="button"
                            role="switch"
                            aria-checked={isOnline}
                            onClick={() => handleToggleOnline(p)}
                            aria-label={`Imposta visibilità online per ${p.nome}`}
                            className={`relative inline-flex h-5 w-9 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2C3E50] ${
                              isOnline ? 'bg-emerald-600' : 'bg-neutral-300'
                            }`}
                            title={
                              isZeroStock
                                ? "Scorte a 0: imposta una giacenza > 0 per pubblicare"
                                : isOnline
                                ? "Articolo visibile nello Store (clicca per nascondere)"
                                : "Articolo nascosto dallo Store (clicca per pubblicare)"
                            }
                          >
                            <span
                              aria-hidden="true"
                              className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-md ring-0 transition duration-200 ease-in-out ${
                                isOnline ? 'translate-x-4' : 'translate-x-0'
                              }`}
                            />
                          </button>
                          <span className={`text-[10px] font-bold min-w-[42px] text-left ${isOnline ? 'text-emerald-800' : 'text-neutral-500'}`}>
                            {isOnline ? 'Online' : 'Off'}
                          </span>
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => setEditingProduct(p)}
                            className="p-2 rounded-lg bg-brand-cream hover:bg-brand-dark hover:text-white transition-colors text-brand-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-[#2C3E50] cursor-pointer"
                            aria-label={`Modifica articolo ${p.nome}`}
                          >
                            <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(p.id, p.nome)}
                            className="p-2 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white transition-colors text-rose-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-rose-600 cursor-pointer"
                            aria-label={`Elimina articolo ${p.nome}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                          </button>
                        </div>
                      </td>

                    </tr>
                  );
                })
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}
