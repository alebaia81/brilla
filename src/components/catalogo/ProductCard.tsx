import React from 'react';
import { ShoppingBag, Eye, Check } from 'lucide-react';
import { formatPrice } from '../../lib/format';
import { addToCart } from '../../lib/cart-store';
import CategoryBadge from './CategoryBadge';

export interface Product {
  id: number | string;
  categoria_id?: number | string | null;
  nome: string;
  slug: string;
  descrizione?: string | null;
  marca?: string | null;
  tipo_prodotto: string;
  prezzo: number;
  sconto_percentuale?: number | null;
  prezzo_scontato?: number | null;
  immagine_url?: string | null;
  quantita_disponibile?: number | null;
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

  const hasDiscount = Boolean(product.sconto_percentuale && product.sconto_percentuale > 0);

  const isOutOfStock = product.disponibile === false || (product.quantita_disponibile != null && product.quantita_disponibile <= 0);
  const isLowStock = !isOutOfStock && product.quantita_disponibile != null && product.quantita_disponibile < 5;

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isOutOfStock) return;
    
    addToCart({
      id: product.id,
      slug: product.slug,
      nome: product.nome,
      marca: product.marca,
      prezzo: product.prezzo,
      prezzo_scontato: product.prezzo_scontato,
      immagine_url: product.immagine_url,
      tipo_prodotto: product.tipo_prodotto,
      quantita_disponibile: product.quantita_disponibile,
    }, 1);

    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  return (
    <div className={`group relative rounded-3xl bg-white border border-brand-dark/10 hover:border-brand-amber/40 shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col overflow-hidden ${isOutOfStock ? 'opacity-85' : ''}`}>
      
      {/* Container Immagine con Adattamento Completo */}
      <a href={`/prodotto/${product.slug}`} className="block relative aspect-square bg-brand-cream/30 overflow-hidden p-3 flex items-center justify-center">
        <img
          src={product.immagine_url || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80'}
          alt={product.nome}
          className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-xs ${isOutOfStock ? 'grayscale-[30%]' : ''}`}
          loading="lazy"
        />

        {/* Badges in sovrimpressione */}
        <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10 pointer-events-none">
          <CategoryBadge tipo={product.tipo_prodotto} />
          
          {hasDiscount && !isOutOfStock && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white bg-rose-600 shadow-sm">
              -{product.sconto_percentuale}%
            </span>
          )}

          {isOutOfStock ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white bg-neutral-800 shadow-sm">
              Esaurito
            </span>
          ) : isLowStock ? (
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-amber-950 bg-amber-400 shadow-sm">
              Solo {product.quantita_disponibile} disponibili
            </span>
          ) : null}
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
            {isOutOfStock ? (
              <span className="text-[10px] text-neutral-500 font-bold block">
                Al momento non disponibile
              </span>
            ) : product.periodicita ? (
              <span className="text-[10px] text-emerald-700 font-medium block">
                Uscita {product.periodicita}
              </span>
            ) : isLowStock ? (
              <span className="text-[10px] text-amber-700 font-bold block">
                Ultimi pezzi a magazzino
              </span>
            ) : null}
          </div>

          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={isOutOfStock ? `${product.nome} è esaurito` : `Aggiungi ${product.nome} al carrello`}
            title={isOutOfStock ? 'Prodotto esaurito' : 'Aggiungi al carrello'}
            className={`p-3 rounded-2xl font-semibold transition-all duration-200 flex items-center justify-center ${
              isOutOfStock
                ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-brand-dark text-brand-cream hover:bg-brand-amber hover:text-white shadow-sm hover:shadow-md active:scale-95 cursor-pointer'
            }`}
          >
            {added ? <Check className="w-4 h-4" /> : <ShoppingBag className="w-4 h-4" />}
          </button>
        </div>

      </div>

    </div>
  );
}
