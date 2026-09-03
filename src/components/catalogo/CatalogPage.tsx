import React, { useEffect, useState, useMemo } from 'react';
import { supabase } from '../../lib/supabase';
import ProductCard, { type Product } from './ProductCard';
import FilterSidebar from './FilterSidebar';
import { SlidersHorizontal, PackageX, Sparkles } from 'lucide-react';

const FALLBACK_ALL_PRODUCTS: Product[] = [
  {
    id: 1,
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
  const [loading, setLoading] = useState(true);

  // Stati dei filtri
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState(initialTipo);
  const [selectedMarca, setSelectedMarca] = useState('all');
  const [sortBy, setSortBy] = useState<'featured' | 'price-asc' | 'price-desc' | 'name'>('featured');
  const [showMobileFilters, setShowMobileFilters] = useState(false);

  // Leggi i parametri query dall'URL se presenti nel browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlTipo = params.get('tipo');
      const urlSearch = params.get('q');
      if (urlTipo) setSelectedTipo(urlTipo);
      if (urlSearch) setSearchTerm(urlSearch);
    }
  }, []);

  // Fetch da Supabase
  useEffect(() => {
    async function loadProducts() {
      try {
        const { data, error } = await supabase
          .from('prodotti')
          .select('*')
          .order('id', { ascending: true });

        if (!error && data && data.length > 0) {
          setProducts(data as Product[]);
        }
      } catch (err) {
        console.warn('Uso i dati fallback per il catalogo:', err);
      } finally {
        setLoading(false);
      }
    }

    loadProducts();
  }, []);

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

  // Lista univoca di marche disponibili
  const availableMarcas = useMemo(() => {
    const marcas = products
      .map((p) => p.marca)
      .filter((m): m is string => Boolean(m && m.trim() !== ''));
    return Array.from(new Set(marcas)).sort();
  }, [products]);

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
  }, [products, selectedTipo, selectedMarca, currentMaxPrice, searchTerm, sortBy]);

  const handleResetFilters = () => {
    setSearchTerm('');
    setSelectedTipo('all');
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
            onTipoChange={setSelectedTipo}
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
                onTipoChange={(t) => { setSelectedTipo(t); setShowMobileFilters(false); }}
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
          {filteredProducts.length === 0 ? (
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
