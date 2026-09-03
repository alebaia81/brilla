import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import ProductCard, { type Product } from './ProductCard';
import FilterSidebar from './FilterSidebar';
import { SlidersHorizontal, PackageX, Sparkles } from 'lucide-react';

export interface Category {
  id: string | number;
  nome: string;
  slug: string;
  tipo_categoria?: string;
  tipo?: string;
  ordine?: number;
}

export const FALLBACK_CATEGORIES: Category[] = [
  { id: '5d67032f-be4c-4eec-be15-970e13b0d907', nome: 'Penne e Matite', slug: 'penne-matite', tipo_categoria: 'cartoleria' },
  { id: 'b29b07be-f379-4f6f-bc87-fd9f5ae0fb82', nome: 'Quaderni e Carta', slug: 'quaderni-carta', tipo_categoria: 'cartoleria' },
  { id: '922ae16b-c354-4f8f-a7de-334ce6b8c2c2', nome: 'Riviste Mensili', slug: 'riviste-mensili', tipo_categoria: 'edicola' },
  { id: 'e2af0565-6b0f-4aca-b703-1adc197f2cf0', nome: 'Fumetti e Giornali', slug: 'fumetti-giornali', tipo_categoria: 'edicola' },
  { id: '7bd588c2-783c-45ad-98eb-80b9c1d09def', nome: 'Tazze e Mug', slug: 'tazze-mug', tipo_categoria: 'bar_gift' },
  { id: '47e238c8-00a9-474b-9196-4ec40538355e', nome: 'Gadget e Ricordi', slug: 'gadget-ricordi', tipo_categoria: 'bar_gift' },
];

const FALLBACK_ALL_PRODUCTS: Product[] = [
  {
    id: 1,
    categoria_id: '5d67032f-be4c-4eec-be15-970e13b0d907', // Penne e Matite
    nome: 'Set 10 Penne a Sfera Retrattili',
    slug: 'set-10-penne-sfera-retrattili',
    descrizione: 'Set professionale a sfera scorrevole con impugnatura soft touch.',
    marca: 'BIC',
    tipo_prodotto: 'cartoleria',
    prezzo: 6.50,
    sconto_percentuale: 10,
    prezzo_scontato: 5.85,
    quantita_disponibile: 15,
    immagine_url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
  },
  {
    id: 2,
    categoria_id: 'b29b07be-f379-4f6f-bc87-fd9f5ae0fb82', // Quaderni e Carta
    nome: 'Quadernone Maxi A4 a Righe 100g',
    slug: 'quadernone-maxi-a4-righe-100g',
    descrizione: 'Quadernone resistente con carta pregiata da 100g antispanciamento.',
    marca: 'Pigna',
    tipo_prodotto: 'cartoleria',
    prezzo: 2.80,
    sconto_percentuale: 0,
    prezzo_scontato: 2.80,
    quantita_disponibile: 30,
    immagine_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
  },
  {
    id: 3,
    categoria_id: '5d67032f-be4c-4eec-be15-970e13b0d907', // Penne e Matite
    nome: 'Evidenziatori Pastel Edition (Set 6pz)',
    slug: 'evidenziatori-pastel-edition-6pz',
    descrizione: 'Tonalità pastello delicate per studio e bullet journal.',
    marca: 'Stabilo',
    tipo_prodotto: 'cartoleria',
    prezzo: 8.90,
    sconto_percentuale: 15,
    prezzo_scontato: 7.56,
    quantita_disponibile: 3, // Esempio scorte basse
    immagine_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=600&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: false,
  },
  {
    id: 4,
    categoria_id: 'b29b07be-f379-4f6f-bc87-fd9f5ae0fb82', // Quaderni e Carta
    nome: 'Zaino Scuola & Viaggio Idrorepellente',
    slug: 'zaino-scuola-viaggio-idrorepellente',
    descrizione: 'Schienale ergonomico traspirante, tasca porta borraccia e PC 15.6".',
    marca: 'Invicta',
    tipo_prodotto: 'cartoleria',
    prezzo: 49.90,
    sconto_percentuale: 20,
    prezzo_scontato: 39.92,
    quantita_disponibile: 8,
    immagine_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=600&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
  },
  {
    id: 5,
    categoria_id: '922ae16b-c354-4f8f-a7de-334ce6b8c2c2', // Riviste Mensili
    nome: 'National Geographic Italia - Edizione Mese',
    slug: 'national-geographic-italia-mese',
    descrizione: 'Reportage esclusivi sul pianeta, natura, scienza e culture.',
    marca: 'Gedi',
    tipo_prodotto: 'edicola',
    prezzo: 5.90,
    sconto_percentuale: 0,
    prezzo_scontato: 5.90,
    quantita_disponibile: 12,
    immagine_url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=600&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
    in_edicola_questo_mese: true,
    periodicita: 'mensile',
  },
  {
    id: 6,
    categoria_id: 'e2af0565-6b0f-4aca-b703-1adc197f2cf0', // Fumetti e Giornali
    nome: 'La Gazzetta dello Sport + Magazine',
    slug: 'la-gazzetta-dello-sport-mag',
    descrizione: 'Il quotidiano sportivo più letto d\'Italia con inserto weekend.',
    marca: 'RCS',
    tipo_prodotto: 'edicola',
    prezzo: 2.00,
    sconto_percentuale: 0,
    prezzo_scontato: 2.00,
    quantita_disponibile: 20,
    immagine_url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=600&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: false,
    in_edicola_questo_mese: true,
    periodicita: 'giornaliero',
  },
  {
    id: 7,
    categoria_id: 'e2af0565-6b0f-4aca-b703-1adc197f2cf0', // Fumetti e Giornali
    nome: 'Topolino Fumetto da Collezione',
    slug: 'topolino-fumetto-da-collezione',
    descrizione: 'L\'intramontabile fumetto a colori per grandi e piccoli con gadget.',
    marca: 'Panini Comics',
    tipo_prodotto: 'edicola',
    prezzo: 3.50,
    sconto_percentuale: 0,
    prezzo_scontato: 3.50,
    quantita_disponibile: 10,
    immagine_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=600&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
    in_edicola_questo_mese: true,
    periodicita: 'settimanale',
  },
  {
    id: 8,
    categoria_id: '7bd588c2-783c-45ad-98eb-80b9c1d09def', // Tazze e Mug
    nome: 'Tazza Mug Artigianale "Brilla Castelnuovo"',
    slug: 'tazza-mug-artigianale-brilla',
    descrizione: 'Tazza in ceramica smaltata a mano con skyline Castelnuovo Bocca d\'Adda.',
    marca: 'Brilla Cafe',
    tipo_prodotto: 'bar_gift',
    prezzo: 11.50,
    sconto_percentuale: 0,
    prezzo_scontato: 11.50,
    quantita_disponibile: 20,
    immagine_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
  },
  {
    id: 9,
    categoria_id: '47e238c8-00a9-474b-9196-4ec40538355e', // Gadget e Ricordi
    nome: 'Confezione Cioccolatini & Praline 250g',
    slug: 'confezione-cioccolatini-praline-250g',
    descrizione: 'Selezione artigianale di cioccolato piemontese fondente e nocciola.',
    marca: 'Artigianale',
    tipo_prodotto: 'bar_gift',
    prezzo: 9.90,
    sconto_percentuale: 10,
    prezzo_scontato: 8.91,
    quantita_disponibile: 14,
    immagine_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=600&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
  },
  {
    id: 10,
    categoria_id: '47e238c8-00a9-474b-9196-4ec40538355e', // Gadget e Ricordi
    nome: 'Bottiglia Termica Inox 500ml Brilla Edition',
    slug: 'bottiglia-termica-inox-500ml-brilla',
    descrizione: 'Mantiene caldo per 12h e freddo per 24h. Senza BPA.',
    marca: 'Brilla Cafe',
    tipo_prodotto: 'bar_gift',
    prezzo: 16.00,
    sconto_percentuale: 0,
    prezzo_scontato: 16.00,
    quantita_disponibile: 18,
    immagine_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: false,
  },
];

interface CatalogPageProps {
  initialTipo?: string;
}

export default function CatalogPage({ initialTipo = 'all' }: CatalogPageProps) {
  const [products, setProducts] = useState<Product[]>(FALLBACK_ALL_PRODUCTS);
  const [categories, setCategories] = useState<Category[]>(FALLBACK_CATEGORIES);
  const [loading, setLoading] = useState(true);

  // Stati dei filtri inizializzati subito in modo sincrono dai parametri URL per prevenire flash
  const [searchTerm, setSearchTerm] = useState(() => {
    if (typeof window !== 'undefined') {
      return new URLSearchParams(window.location.search).get('q') || '';
    }
    return '';
  });

  const [selectedTipo, setSelectedTipo] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('tipo') || params.get('reparto') || params.get('categoria') || initialTipo || 'all';
    }
    return initialTipo || 'all';
  });

  const [selectedCategory, setSelectedCategory] = useState(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('cat') || params.get('sottocategoria') || 'all';
    }
    return 'all';
  });

  const [selectedMarca, setSelectedMarca] = useState('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Sincronizzazione al cambio URL (es. navigazione browser back/forward)
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTipo = params.get('tipo') || params.get('reparto');
      const urlSearch = params.get('q');
      const urlCat = params.get('cat') || params.get('sottocategoria');
      if (urlTipo && urlTipo !== selectedTipo) setSelectedTipo(urlTipo);
      if (urlSearch && urlSearch !== searchTerm) setSearchTerm(urlSearch);
      if (urlCat && urlCat !== selectedCategory) setSelectedCategory(urlCat);
    }
  }, []);

  // Fetch Prodotti e Categorie da Supabase
  useEffect(() => {
    async function loadData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          supabase.from('prodotti').select('*').order('id', { ascending: true }),
          supabase.from('categorie').select('*').order('ordine', { ascending: true })
        ]);

        if (!prodRes.error && prodRes.data && prodRes.data.length > 0) {
          setProducts(prodRes.data as Product[]);
        }

        if (!catRes.error && catRes.data && catRes.data.length > 0) {
          setCategories(catRes.data as Category[]);
        }
      } catch (err) {
        console.warn('Uso i dati fallback per il catalogo:', err);
      } finally {
        setLoading(false);
      }
    }

    loadData();
  }, []);

  const handleTipoChange = (tipo: string) => {
    setSelectedTipo(tipo);
    setSelectedCategory('all');

    // Se la marca precedentemente selezionata non appartiene al nuovo reparto, resetta su 'all'
    if (selectedMarca !== 'all') {
      const normTipo = tipo.replace('-', '_');
      const validInNewTipo = products.some((p) => {
        const matchesTipo = tipo === 'all' || p.tipo_prodotto?.replace('-', '_') === normTipo;
        return matchesTipo && p.marca === selectedMarca;
      });
      if (!validInNewTipo) {
        setSelectedMarca('all');
      }
    }
  };

  // Sottocategorie pertinenti al reparto selezionato
  const currentSubcategories = useMemo(() => {
    if (selectedTipo === 'all') {
      return categories;
    }
    const normTipo = selectedTipo.replace('-', '_');
    return categories.filter((c) => (c.tipo_categoria || c.tipo) === normTipo);
  }, [categories, selectedTipo]);

  // Calcola il prezzo massimo globale per il range slider
  const maxPrice = useMemo(() => {
    if (products.length === 0) return 100;
    return Math.ceil(Math.max(...products.map((p) => Number(p.prezzo) || 0)));
  }, [products]);

  const [currentMaxPrice, setCurrentMaxPrice] = useState(100);

  useEffect(() => {
    if (maxPrice > 0) {
      setCurrentMaxPrice(maxPrice);
    }
  }, [maxPrice]);

  // Lista univoca di marche disponibili (filtrate dinamicamente in base al reparto attivo)
  const availableMarcas = useMemo(() => {
    let prodsToInspect = products;
    if (selectedTipo !== 'all') {
      const normTipo = selectedTipo.replace('-', '_');
      prodsToInspect = products.filter((p) => p.tipo_prodotto?.replace('-', '_') === normTipo);
    }

    const marcas = prodsToInspect
      .map((p) => p.marca)
      .filter((m): m is string => Boolean(m && m.trim() !== ''));
    return Array.from(new Set(marcas)).sort();
  }, [products, selectedTipo]);

  // Se la marca selezionata non appartiene più alle marche disponibili del reparto attivo, resettala a 'all'
  useEffect(() => {
    if (selectedMarca !== 'all' && !availableMarcas.includes(selectedMarca)) {
      setSelectedMarca('all');
    }
  }, [availableMarcas, selectedMarca]);

  // Filtro e ordinamento client-side
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Filtro Reparto
        if (selectedTipo !== 'all') {
          const normTipo = selectedTipo.replace('-', '_');
          const normProdTipo = p.tipo_prodotto?.replace('-', '_');
          if (normProdTipo !== normTipo) return false;
        }

        // Filtro Sottocategoria Specifica (Pillole)
        if (selectedCategory !== 'all') {
          const targetCat = categories.find(
            (c) => String(c.id) === selectedCategory || c.slug === selectedCategory
          );
          const matchesId = p.categoria_id != null && String(p.categoria_id) === selectedCategory;
          const matchesSlug = targetCat && p.categoria_id != null && (p.categoria_id === targetCat.slug || p.categoria_id === targetCat.id);
          if (!matchesId && !matchesSlug) {
            return false;
          }
        }

        // Filtro Marca
        if (selectedMarca !== 'all' && p.marca !== selectedMarca) {
          return false;
        }

        // Filtro Prezzo
        const price = Number(p.prezzo_scontato || p.prezzo);
        if (price > currentMaxPrice) {
          return false;
        }

        // Ricerca testuale
        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const matchName = p.nome?.toLowerCase().includes(q);
          const matchDesc = p.descrizione?.toLowerCase().includes(q);
          const matchBrand = p.marca?.toLowerCase().includes(q);
          if (!matchName && !matchDesc && !matchBrand) return false;
        }

        return true;
      })
      .sort((a, b) => {
        const priceA = Number(a.prezzo_scontato || a.prezzo);
        const priceB = Number(b.prezzo_scontato || b.prezzo);

        if (sortBy === 'price-asc') return priceA - priceB;
        if (sortBy === 'price-desc') return priceB - priceA;
        if (sortBy === 'name') return a.nome.localeCompare(b.nome);
        // Default: featured first
        return (b.in_evidenza ? 1 : 0) - (a.in_evidenza ? 1 : 0);
      });
  }, [products, categories, selectedTipo, selectedCategory, selectedMarca, currentMaxPrice, searchTerm, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTipo('all');
    setSelectedCategory('all');
    setSelectedMarca('all');
    setCurrentMaxPrice(maxPrice);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      
      {/* Header del Catalogo */}
      <div className="mb-10 text-center sm:text-left flex flex-col sm:flex-row sm:items-end justify-between gap-4 pb-6 border-b border-brand-dark/10">
        <div>
          <span className="px-3.5 py-1 rounded-full bg-brand-amber/15 text-brand-dark text-xs font-bold uppercase tracking-wider inline-block mb-2">
            Catalogo Completo
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-dark tracking-tight">
            Esplora gli Articoli di Brilla Cafe
          </h1>
          <p className="text-xs sm:text-sm text-brand-dark/65 mt-1">
            Visualizzati {filteredProducts.length} prodotti pronti per il ritiro in negozio o spedizione.
          </p>
        </div>

        {/* Ordinamento & Toggle Filtri Mobile */}
        <div className="flex items-center gap-3 self-center sm:self-auto">
          
          <button
            type="button"
            onClick={() => setShowMobileFilters(!showMobileFilters)}
            className="lg:hidden flex items-center gap-2 px-4 py-2.5 bg-white border border-brand-dark/15 rounded-2xl text-xs font-bold text-brand-dark shadow-2xs"
          >
            <SlidersHorizontal className="w-4 h-4 text-brand-amber" />
            <span>Filtri</span>
          </button>

          <div className="flex items-center gap-2 bg-white px-3.5 py-2 rounded-2xl border border-brand-dark/15 text-xs font-semibold shadow-2xs">
            <span className="text-brand-dark/50 hidden sm:inline">Ordina:</span>
            <select
              value={sortBy}
              onChange={(e: any) => setSortBy(e.target.value)}
              className="bg-transparent text-brand-dark font-bold focus:outline-none cursor-pointer"
            >
              <option value="featured">In Evidenza</option>
              <option value="price-asc">Prezzo: Min → Max</option>
              <option value="price-desc">Prezzo: Max → Min</option>
              <option value="name">Nome A-Z</option>
            </select>
          </div>

        </div>
      </div>

      {/* Layout a 2 Colonne (Sidebar + Grid) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Sidebar Filtri Desktop */}
        <aside className="hidden lg:block lg:col-span-3">
          <FilterSidebar
            searchTerm={searchTerm}
            onSearchChange={setSearchTerm}
            selectedTipo={selectedTipo}
            onTipoChange={handleTipoChange}
            selectedMarca={selectedMarca}
            onMarcaChange={setSelectedMarca}
            availableMarcas={availableMarcas}
            maxPrice={maxPrice}
            currentMaxPrice={currentMaxPrice}
            onMaxPriceChange={setCurrentMaxPrice}
            onReset={handleResetFilters}
          />
        </aside>

        {/* Modale / Drawer Filtri Mobile */}
        {showMobileFilters && (
          <div className="fixed inset-0 z-50 lg:hidden p-4 bg-brand-dark/50 backdrop-blur-xs flex items-center justify-center">
            <div className="bg-white rounded-3xl w-full max-w-sm max-h-[90vh] overflow-y-auto p-6 shadow-2xl">
              <div className="flex justify-between items-center pb-3 mb-4 border-b">
                <span className="font-bold text-sm">Filtra Articoli</span>
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(false)}
                  className="text-xs font-bold text-brand-amber"
                >
                  Chiudi ✕
                </button>
              </div>
              <FilterSidebar
                searchTerm={searchTerm}
                onSearchChange={setSearchTerm}
                selectedTipo={selectedTipo}
                onTipoChange={(t) => { handleTipoChange(t); setShowMobileFilters(false); }}
                selectedMarca={selectedMarca}
                onMarcaChange={setSelectedMarca}
                availableMarcas={availableMarcas}
                maxPrice={maxPrice}
                currentMaxPrice={currentMaxPrice}
                onMaxPriceChange={setCurrentMaxPrice}
                onReset={handleResetFilters}
              />
            </div>
          </div>
        )}

        {/* Griglia Prodotti */}
        <main className="lg:col-span-9">

          {/* Barra Pillole Sottocategorie */}
          {currentSubcategories.length > 0 && (
            <div className="mb-6 bg-white/70 backdrop-blur-xs p-3 sm:p-4 rounded-3xl border border-brand-dark/10 shadow-2xs">
              <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('all')}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-2xs cursor-pointer ${
                    selectedCategory === 'all'
                      ? 'bg-brand-dark text-white shadow-brand-dark/20 scale-[1.02]'
                      : 'bg-brand-cream/50 text-brand-dark/70 hover:text-brand-dark hover:bg-brand-cream border border-brand-dark/10'
                  }`}
                >
                  <span>Tutti</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                    selectedCategory === 'all' ? 'bg-white/20 text-white' : 'bg-brand-dark/10 text-brand-dark'
                  }`}>
                    {products.filter((p) => {
                      if (selectedTipo === 'all') return true;
                      const normTipo = selectedTipo.replace('-', '_');
                      const normProdTipo = p.tipo_prodotto?.replace('-', '_');
                      return normProdTipo === normTipo;
                    }).length}
                  </span>
                </button>

                {currentSubcategories.map((cat) => {
                  const isSelected = selectedCategory === String(cat.id) || selectedCategory === cat.slug;
                  // Conteggio prodotti per questa categoria nel reparto corrente
                  const count = products.filter((p) => {
                    if (selectedTipo !== 'all') {
                      const normTipo = selectedTipo.replace('-', '_');
                      const normProdTipo = p.tipo_prodotto?.replace('-', '_');
                      if (normProdTipo !== normTipo) return false;
                    }
                    return String(p.categoria_id) === String(cat.id) || p.categoria_id === cat.slug;
                  }).length;

                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => setSelectedCategory(isSelected ? 'all' : String(cat.id))}
                      className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 shadow-2xs cursor-pointer ${
                        isSelected
                          ? 'bg-brand-cyan text-white shadow-brand-cyan/25 scale-[1.02]'
                          : 'bg-white text-brand-dark/70 hover:text-brand-dark hover:bg-brand-cream border border-brand-dark/10'
                      }`}
                    >
                      <span>{cat.nome}</span>
                      {count > 0 && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-extrabold ${
                          isSelected ? 'bg-white/20 text-white' : 'bg-brand-cream text-brand-dark/70'
                        }`}>
                          {count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="rounded-3xl bg-white border border-brand-dark/10 p-4 space-y-4 animate-pulse">
                  <div className="aspect-square bg-stone-100 rounded-2xl" />
                  <div className="space-y-2 pt-2">
                    <div className="h-3 bg-stone-100 rounded-md w-1/3" />
                    <div className="h-4 bg-stone-100 rounded-md w-3/4" />
                    <div className="h-3 bg-stone-100 rounded-md w-1/2" />
                  </div>
                  <div className="h-9 bg-stone-100 rounded-xl w-full" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="rounded-3xl bg-white border border-brand-dark/10 p-12 text-center flex flex-col items-center justify-center min-h-[350px]">
              <div className="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center text-brand-dark/40 mb-4">
                <PackageX className="w-8 h-8" />
              </div>
              <h3 className="text-lg font-bold text-brand-dark mb-1">
                Nessun prodotto trovato
              </h3>
              <p className="text-xs text-brand-dark/60 max-w-sm mb-6">
                Prova a modificare i filtri, cercare con un termine diverso o azzerare la ricerca.
              </p>
              <button
                type="button"
                onClick={handleResetFilters}
                className="px-5 py-2.5 bg-brand-dark text-white text-xs font-bold rounded-xl hover:bg-brand-amber transition-colors"
              >
                Azzera tutti i filtri
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 sm:gap-8">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>

      </div>

    </div>
  );
}
