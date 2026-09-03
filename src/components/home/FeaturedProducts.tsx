import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import ProductCard, { type Product } from '../catalogo/ProductCard';
import { Sparkles, ArrowRight } from 'lucide-react';

// Dati di fallback eleganti se il DB Supabase non è ancora popolato o offline
const FALLBACK_FEATURED: Product[] = [
  {
    id: 1,
    nome: 'Set 10 Penne a Sfera Retrattili Soft Touch',
    slug: 'set-10-penne-sfera-retrattili',
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
    id: 4,
    nome: 'Zaino Scuola & Viaggio Idrorepellente',
    slug: 'zaino-scuola-viaggio-idrorepellente',
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
    id: 8,
    nome: 'Tazza Mug Artigianale "Brilla Castelnuovo"',
    slug: 'tazza-mug-artigianale-brilla',
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
];

export default function FeaturedProducts() {
  const [products, setProducts] = useState<Product[]>(FALLBACK_FEATURED);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchFeatured() {
      try {
        const { data, error } = await supabase
          .from('prodotti')
          .select('*')
          .eq('in_evidenza', true)
          .limit(8);

        if (!error && data && data.length > 0) {
          setProducts(data as Product[]);
        }
      } catch (err) {
        console.warn('Supabase offline o non ancora configurato, uso i prodotti mockup:', err);
      } finally {
        setLoading(false);
      }
    }

    fetchFeatured();
  }, []);

  return (
    <section className="py-16 sm:py-24 bg-brand-cream/60 border-t border-brand-dark/5">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-amber/15 text-brand-dark text-xs font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3.5 h-3.5 text-brand-amber" />
              <span>Scelti per Te</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-extrabold text-brand-dark tracking-tight">
              Novità &amp; Articoli in Evidenza
            </h2>
            <p className="text-sm text-brand-dark/65 mt-2">
              I prodotti più richiesti del momento a Castelnuovo Bocca d'Adda.
            </p>
          </div>

          <a
            href="/catalogo"
            className="inline-flex items-center gap-2 text-sm font-bold text-brand-dark hover:text-brand-amber transition-colors group self-start sm:self-auto"
          >
            <span>Vedi tutto il catalogo</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </a>
        </div>

        {/* Griglia Prodotti */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

      </div>
    </section>
  );
}
