import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Plus, Edit2, Trash2, Save, X, Tag } from 'lucide-react';
import CategoryBadge from '../catalogo/CategoryBadge';

interface Category {
  id: string | number;
  nome: string;
  slug: string;
  tipo_categoria?: string;
  tipo?: string;
  descrizione?: string | null;
  ordine?: number;
  icona?: string | null;
}

export default function CategoryManager() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingCat, setEditingCat] = useState<Category | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [saving, setSaving] = useState(false);

  const [nome, setNome] = useState('');
  const [slug, setSlug] = useState('');
  const [tipo, setTipo] = useState('cartoleria');
  const [descrizione, setDescrizione] = useState('');

  const loadCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categorie')
        .select('*')
        .order('ordine', { ascending: true });

      if (error) {
        console.error('Errore nel caricamento categorie:', error);
        return;
      }

      if (data) {
        const mapped = (data as any[]).map((c) => ({
          ...c,
          tipo: c.tipo_categoria || c.tipo || 'cartoleria',
          tipo_categoria: c.tipo_categoria || c.tipo || 'cartoleria',
        }));
        setCategories(mapped);
      }
    } catch (e) {
      console.error('Errore nel caricamento categorie:', e);
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  const handleStartEdit = (cat: Category) => {
    setEditingCat(cat);
    setNome(cat.nome);
    setSlug(cat.slug);
    setTipo(cat.tipo_categoria || cat.tipo || 'cartoleria');
    setDescrizione(cat.descrizione || '');
    setIsCreating(false);
  };

  const handleStartCreate = () => {
    setEditingCat(null);
    setNome('');
    setSlug('');
    setTipo('cartoleria');
    setDescrizione('');
    setIsCreating(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) {
      alert('Inserisci il nome della categoria');
      return;
    }

    setSaving(true);

    const cleanSlug = slug.trim() || nome.trim().toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '');

    const payload = {
      nome: nome.trim(),
      slug: cleanSlug,
      tipo_categoria: tipo, // Valori ammessi: 'cartoleria' | 'edicola' | 'bar_gift'
      descrizione: descrizione.trim() || null,
    };

    try {
      if (editingCat) {
        const { data, error } = await supabase
          .from('categorie')
          .update(payload)
          .eq('id', editingCat.id)
          .select()
          .single();

        if (error) {
          console.error('ERRORE MODIFICA CATEGORIA:', error);
          alert(`Errore modifica: ${error.message}`);
          setSaving(false);
          return;
        }

        if (data) {
          const updated: Category = {
            ...data,
            tipo: data.tipo_categoria || tipo,
            tipo_categoria: data.tipo_categoria || tipo,
          };
          setCategories((prev) => prev.map((c) => (c.id === editingCat.id ? updated : c)));
        }
      } else {
        const { data, error } = await supabase
          .from('categorie')
          .insert([payload])
          .select()
          .single();

        if (error) {
          console.error('ERRORE CREAZIONE CATEGORIA:', error);
          alert(`Errore creazione: ${error.message}`);
          setSaving(false);
          return;
        }

        if (data) {
          const newCat: Category = {
            ...data,
            tipo: data.tipo_categoria || tipo,
            tipo_categoria: data.tipo_categoria || tipo,
          };
          setCategories((prev) => [...prev, newCat]);
        }
      }

      setIsCreating(false);
      setEditingCat(null);
      setNome('');
      setSlug('');
      setTipo('cartoleria');
      setDescrizione('');
    } catch (err: any) {
      console.error('Eccezione salvataggio categoria:', err);
      alert('Errore: ' + (err.message || 'Si è verificato un errore'));
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string | number, catName: string) => {
    if (!window.confirm(`Eliminare la categoria "${catName}"? Attenzione: i prodotti associati potrebbero non avere più una sottocategoria assegnata.`)) {
      return;
    }
    try {
      const { error } = await supabase.from('categorie').delete().eq('id', id);
      if (error) {
        console.error('ERRORE ELIMINAZIONE CATEGORIA:', error);
        alert(`Errore eliminazione: ${error.message}`);
        return;
      }
      setCategories((prev) => prev.filter((c) => c.id !== id));
    } catch (err: any) {
      alert('Errore: ' + err.message);
    }
  };

  return (
    <div className="space-y-6">
      
      <div className="flex items-center justify-between bg-white p-6 rounded-3xl border border-brand-dark/10 shadow-sm">
        <div>
          <h2 className="text-xl font-extrabold text-brand-dark">Gestione Categorie Prodotti</h2>
          <p className="text-xs text-brand-dark/60 mt-0.5">
            Organizza le categorie merceologiche per la catalogazione.
          </p>
        </div>

        {!isCreating && !editingCat && (
          <button
            type="button"
            onClick={handleStartCreate}
            className="px-4 py-2 bg-brand-amber text-white text-xs font-bold rounded-xl shadow-sm flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            <span>Nuova Categoria</span>
          </button>
        )}
      </div>

      {/* Form Inline */}
      {(isCreating || editingCat) && (
        <form onSubmit={handleSave} className="bg-white p-6 rounded-3xl border-2 border-brand-amber/30 space-y-4 text-xs">
          <div className="flex justify-between items-center pb-2 border-b border-brand-dark/10">
            <span className="font-bold text-brand-dark">
              {editingCat ? `Modifica: ${editingCat.nome}` : 'Crea Nuova Categoria'}
            </span>
            <button
              type="button"
              onClick={() => { setIsCreating(false); setEditingCat(null); }}
              className="text-brand-dark/50 hover:text-brand-dark"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block font-bold text-brand-dark mb-1">Nome Categoria *</label>
              <input
                type="text"
                required
                value={nome}
                onChange={(e) => setNome(e.target.value)}
                placeholder="Es. Penne e Matite"
                className="w-full px-3 py-2 bg-brand-cream/40 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-brand-dark mb-1">Slug URL</label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="es. penne-matite"
                className="w-full px-3 py-2 bg-brand-cream/40 border rounded-xl"
              />
            </div>

            <div>
              <label className="block font-bold text-brand-dark mb-1">Reparto Principale *</label>
              <select
                value={tipo}
                onChange={(e) => setTipo(e.target.value)}
                className="w-full px-3 py-2 bg-brand-cream/40 border rounded-xl font-bold"
              >
                <option value="cartoleria">Cartoleria</option>
                <option value="edicola">Edicola</option>
                <option value="bar_gift">Bar &amp; Idee Regalo</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2 bg-brand-amber text-white font-bold rounded-xl shadow-sm flex items-center gap-1.5 disabled:opacity-50 cursor-pointer"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{saving ? 'Salvataggio in corso...' : 'Salva Categoria'}</span>
            </button>
          </div>
        </form>
      )}

      {/* Lista Categorie */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <div
            key={cat.id}
            className="bg-white p-5 rounded-2xl border border-brand-dark/10 shadow-sm flex flex-col justify-between"
          >
            <div>
              <div className="flex items-center justify-between mb-2">
                <CategoryBadge tipo={cat.tipo || cat.tipo_categoria || 'cartoleria'} />
                <span className="text-[10px] font-mono text-brand-dark/40">/{cat.slug}</span>
              </div>
              <h4 className="text-sm font-bold text-brand-dark">{cat.nome}</h4>
              {cat.descrizione && (
                <p className="text-xs text-brand-dark/60 mt-1 line-clamp-2">{cat.descrizione}</p>
              )}
            </div>

            <div className="pt-4 mt-3 border-t border-brand-dark/5 flex justify-end gap-2">
              <button
                type="button"
                onClick={() => handleStartEdit(cat)}
                className="p-1.5 rounded-lg bg-brand-cream text-brand-dark hover:bg-brand-dark hover:text-white transition-colors"
                aria-label="Modifica categoria"
              >
                <Edit2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleDelete(cat.id, cat.nome)}
                className="p-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-colors"
                aria-label="Elimina categoria"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        ))}
      </div>

    </div>
  );
}
