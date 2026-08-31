import React from 'react';
import { ShoppingBag, Eye, Check } from 'lucide-react';
import { formatPrice } from '../../lib/format';
import { addToCart } from '../../lib/cart-store';
import CategoryBadge from './CategoryBadge';

export interface Product {
  id: number;
  nome: string;
  slug: string;
  descrizione?: string | null;
  marca?: string | null;
  tipo_prodotto: string;
  prezzo: number;
  sconto_percentuale?: number | null;
  prezzo_scontato?: number | null;
  immagine_url?: string | null;
  disponibile?: boolean;
  in_evidenza?: boolean;
  in_edicola_questo_mese?: boolean;
  periodicita?: string | null;
}

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const [added, setAdded] = React.useState(false);

  const activePrice = product.prezzo_scontato && product.prezzo_scontato > 0 
    ? product.prezzo_scontato 
    : product.prezzo;

  const hasDiscount = product.sconto_percentuale && product.sconto_percentuale > 0;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    addToCart({
      id: product.id,
      slug: product.slug,
      nome: product.nome,
      marca: product.marca,
      prezzo: product.prezzo,
      prezzo_scontato: product.prezzo_scontato,
      immagine_url: product.immagine_url,
      tipo_prodotto: product.tipo_prodotto,
    }, 1);

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className="group relative rounded-3xl bg-white border border-brand-dark/10 hover:border-brand-amber/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden">
      
      {/* Container Immagine */}
      <a href={`/prodotto/${product.slug}`} className="block relative aspect-square bg-brand-cream/50 overflow-hidden">
        <img
          src={product.immagine_url || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80'}
          alt={product.nome}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Badges in sovrimpressione */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start">
          <CategoryBadge tipo={product.tipo_prodotto} />
          
          {hasDiscount && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-rose-600 shadow-sm">
              -{product.sconto_percentuale}%
            </span>
          )}

          {product.in_edicola_questo_mese && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-emerald-600 shadow-sm">
              In Edicola
            </span>
          )}
        </div>

        {/* Quick View overlay */}
        <div className="absolute inset-0 bg-brand-dark/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
          <span className="p-3 bg-white/90 text-brand-dark rounded-full shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform">
            <Eye className="w-5 h-5" />
          </span>
        </div>
      </a>

      {/* Dettagli Prodotto */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {product.marca && (
            <span className="text-[11px] font-semibold tracking-wider text-brand-dark/50 uppercase block mb-1">
              {product.marca}
            </span>
          )}

          <a href={`/prodotto/${product.slug}`} className="block group-hover:text-brand-amber transition-colors">
            <h3 className="text-sm font-bold text-brand-dark line-clamp-2 leading-snug">
              {product.nome}
            </h3>
          </a>

          {product.descrizione && (
            <p className="text-xs text-brand-dark/60 line-clamp-2 mt-1.5 leading-relaxed">
              {product.descrizione}
            </p>
          )}
        </div>

        {/* Prezzo e Bottone Aggiungi */}
        <div className="pt-4 mt-3 border-t border-brand-dark/5 flex items-center justify-between gap-2">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-base sm:text-lg font-black text-brand-dark">
                {formatPrice(activePrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-brand-dark/40 line-through">
                  {formatPrice(product.prezzo)}
                </span>
              )}
            </div>
            {product.periodicita && (
              <span className="text-[10px] text-emerald-700 font-medium block">
                Uscita {product.periodicita}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={product.disponibile === false}
            aria-label={`Aggiungi ${product.nome} al carrello`}
            className={`p-3 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center ${
              added
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-brand-dark text-brand-cream hover:bg-brand-amber hover:text-white shadow-sm hover:shadow-md active:scale-95'
            }`}
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>

      </div>

    </div>
  );
}
