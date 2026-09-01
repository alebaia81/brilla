import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { type Product } from '../catalogo/ProductCard';
import ProductForm from './ProductForm';
import { formatPrice } from '../../lib/format';
import CategoryBadge from '../catalogo/CategoryBadge';
import { Plus, Edit2, Trash2, Search, Sparkles } from 'lucide-react';

export default function ProductManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

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

  const handleDelete = async (id: number, name: string) => {
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

  const filteredProducts = products.filter((p) => {
    if (!searchTerm.trim()) return true;
    const q = searchTerm.toLowerCase();
    return (
      p.nome?.toLowerCase().includes(q) ||
      p.marca?.toLowerCase().includes(q) ||
      p.tipo_prodotto?.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      
      {/* Header & Azioni */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-brand-dark/10 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-brand-dark">Gestione Catalogo Prodotti</h2>
          <p className="text-xs text-brand-dark/60 mt-0.5">
            {products.length} articoli totali presenti nel database.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsCreating(true)}
            className="px-5 py-2.5 bg-brand-cyan hover:bg-brand-cyan/90 text-white text-xs font-bold rounded-xl shadow-md shadow-brand-cyan/20 transition-all flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            <span>Aggiungi Prodotto</span>
          </button>
        </div>
      </div>

      {/* Ricerca Veloce */}
      <div className="relative">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Cerca per nome, marca o reparto..."
          className="w-full pl-10 pr-4 py-3 bg-white border border-brand-dark/10 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-cyan shadow-2xs"
        />
        <Search className="w-4 h-4 text-brand-dark/40 absolute left-3.5 top-3.5" />
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
                <th className="py-3.5 px-4">Stato</th>
                <th className="py-3.5 px-4 text-right">Azioni</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-dark/5">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-brand-dark/50">
                    Nessun prodotto trovato.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => (
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
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          p.disponibile !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                        }`}>
                          {p.disponibile !== false ? 'Disponibile' : 'Esaurito'}
                        </span>
                        {p.in_evidenza && (
                          <span className="text-[9px] text-brand-amber font-bold flex items-center gap-0.5">
                            <Sparkles className="w-2.5 h-2.5" /> In Evidenza
                          </span>
                        )}
                      </div>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => setEditingProduct(p)}
                          className="p-2 rounded-lg bg-brand-cream hover:bg-brand-dark hover:text-white transition-colors text-brand-dark"
                          aria-label="Modifica prodotto"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDelete(p.id, p.nome)}
                          className="p-2 rounded-lg bg-rose-50 hover:bg-rose-600 hover:text-white transition-colors text-rose-700"
                          aria-label="Elimina prodotto"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}
