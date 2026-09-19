import React, { useState } from 'react';
import { ShoppingBag, Check, Plus, Minus, ChevronDown, ChevronUp } from 'lucide-react';
import { formatPrice } from '../../lib/format';
import { addToCart, openCart } from '../../lib/cart-store';
import CategoryBadge from './CategoryBadge';

export interface Product {
  id: number | string;
  categoria_id?: string | null;
  nome: string;
  slug: string;
  descrizione?: string | null;
  marca?: string | null;
  tipo_prodotto: string;
  prezzo: number;
  prezzo_originale?: number | null;
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
  const [quantity, setQuantity] = useState<number>(1);
  const [added, setAdded] = useState<boolean>(false);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);

  // Immagine con fallback ad alta risoluzione
  const imgSrc = product.immagine_url || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=600&auto=format&fit=crop&q=80';

  const activePrice = product.prezzo_scontato && product.prezzo_scontato > 0 
    ? product.prezzo_scontato 
    : (product.sconto_percentuale && product.sconto_percentuale > 0
        ? Number((product.prezzo * (1 - product.sconto_percentuale / 100)).toFixed(2))
        : product.prezzo);

  const hasDiscount = Boolean(
    (product.sconto_percentuale && product.sconto_percentuale > 0) ||
    (product.prezzo_scontato && product.prezzo_scontato < product.prezzo)
  );

  const isOutOfStock = product.disponibile === false || (product.quantita_disponibile != null && product.quantita_disponibile <= 0);
  const isLowStock = !isOutOfStock && product.quantita_disponibile != null && product.quantita_disponibile < 5;
  const maxAvailable = product.quantita_disponibile != null ? Math.max(1, product.quantita_disponibile) : 99;

  // Gestione selettore quantità
  const handleDecrease = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrease = () => {
    setQuantity((prev) => Math.min(maxAvailable, prev + 1));
  };

  // Aggiunta al carrello e apertura automatica CartDrawer
  const handleAddToCart = () => {
    if (isOutOfStock) return;
    
    addToCart({
      id: product.id,
      slug: product.slug,
      nome: product.nome,
      marca: product.marca,
      prezzo: product.prezzo,
      prezzo_scontato: activePrice < product.prezzo ? activePrice : null,
      immagine_url: imgSrc,
      tipo_prodotto: product.tipo_prodotto,
      quantita_disponibile: product.quantita_disponibile,
    }, quantity);

    setAdded(true);
    // Feedback visivo immediato e apertura drawer
    openCart();
    setTimeout(() => {
      setAdded(false);
      setQuantity(1);
    }, 1500);
  };

  // Gestione testo lungo con soglia di taglio elegante
  const descriptionText = (product.descrizione || '').trim();
  const shouldTruncate = descriptionText.length > 120;
  const displayText = isExpanded || !shouldTruncate
    ? descriptionText
    : `${descriptionText.slice(0, 115)}...`;

  return (
    <div 
      className={`group relative rounded-3xl bg-white border border-brand-dark/10 hover:border-brand-amber/40 shadow-sm hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full overflow-hidden ${
        isOutOfStock ? 'opacity-85' : ''
      }`}
    >
      {/* 1. SEZIONE SUPERIORE: Immagine e Badges */}
      <div>
        <div className="relative aspect-square bg-stone-100/70 overflow-hidden p-4 flex items-center justify-center">
          <img
            key={`${product.id}-${imgSrc}`}
            src={imgSrc}
            alt={product.nome}
            className={`w-full h-full object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-xs ${
              isOutOfStock ? 'grayscale-[30%]' : ''
            }`}
            loading="lazy"
          />

          {/* Badges in sovrimpressione */}
          <div className="absolute top-3 left-3 flex flex-col gap-1.5 items-start z-10 pointer-events-none">
            <CategoryBadge tipo={product.tipo_prodotto} />
            
            {hasDiscount && !isOutOfStock && (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold text-white bg-rose-600 shadow-xs">
                -{product.sconto_percentuale}%
              </span>
            )}

            {isOutOfStock ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-white bg-neutral-800 shadow-xs">
                Esaurito
              </span>
            ) : isLowStock ? (
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold text-amber-950 bg-amber-400 shadow-xs">
                Solo {product.quantita_disponibile} rimasti
              </span>
            ) : null}
          </div>
        </div>

        {/* 2. SEZIONE CORPO: Informazioni prodotto e Descrizione completa */}
        <div className="p-5 pb-3">
          {product.marca && (
            <span className="text-[11px] font-bold tracking-wider text-brand-dark/60 uppercase block mb-1">
              {product.marca}
            </span>
          )}

          <h3 className="text-base font-bold text-brand-dark leading-snug">
            {product.nome}
          </h3>

          {descriptionText && (
            <div className="mt-2 text-xs text-brand-dark/70 leading-relaxed">
              <span>{displayText}</span>
              {shouldTruncate && (
                <button
                  type="button"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="inline-flex items-center gap-0.5 text-xs font-bold text-brand-amber hover:text-brand-dark hover:underline ml-1.5 focus:outline-none cursor-pointer transition-colors"
                  aria-expanded={isExpanded}
                >
                  {isExpanded ? (
                    <>
                      <span>Riduci</span>
                      <ChevronUp className="w-3.5 h-3.5 inline" />
                    </>
                  ) : (
                    <>
                      <span>Mostra di più</span>
                      <ChevronDown className="w-3.5 h-3.5 inline" />
                    </>
                  )}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 3. SEZIONE INFERIORE: Prezzo, Quantità e Azione di Acquisto */}
      <div className="p-5 pt-3 mt-auto border-t border-brand-dark/5 bg-stone-50/40">
        <div className="flex items-baseline justify-between mb-3">
          <div>
            <div className="flex items-baseline gap-2">
              <span className="text-xl font-black text-brand-dark">
                {formatPrice(activePrice)}
              </span>
              {hasDiscount && (
                <span className="text-xs text-brand-dark/45 line-through">
                  {formatPrice(product.prezzo)}
                </span>
              )}
            </div>
            {isOutOfStock ? (
              <span className="text-[10px] text-neutral-500 font-bold block mt-0.5">
                Non disponibile al momento
              </span>
            ) : product.periodicita ? (
              <span className="text-[10px] text-emerald-800 font-semibold block mt-0.5">
                Periodicità: {product.periodicita}
              </span>
            ) : (
              <span className="text-[10px] text-brand-dark/50 block mt-0.5">
                IVA inclusa • Ritiro o Spedizione
              </span>
            )}
          </div>
        </div>

        {/* Controlli di acquisto: Selettore Quantità + Pulsante Aggiungi al Carrello */}
        <div className="flex items-center gap-2">
          {/* Selettore Quantità */}
          {!isOutOfStock && (
            <div className="flex items-center border border-brand-dark/15 rounded-2xl bg-white px-1.5 py-1 shadow-2xs">
              <button
                type="button"
                onClick={handleDecrease}
                disabled={quantity <= 1}
                aria-label="Diminuisci quantità"
                className="w-7 h-7 flex items-center justify-center rounded-xl text-brand-dark/70 hover:text-brand-dark hover:bg-brand-cream active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
              >
                <Minus className="w-3.5 h-3.5" />
              </button>
              <span className="w-8 text-center text-xs font-bold text-brand-dark select-none">
                {quantity}
              </span>
              <button
                type="button"
                onClick={handleIncrease}
                disabled={quantity >= maxAvailable}
                aria-label="Aumenta quantità"
                className="w-7 h-7 flex items-center justify-center rounded-xl text-brand-dark/70 hover:text-brand-dark hover:bg-brand-cream active:scale-95 disabled:opacity-30 disabled:pointer-events-none cursor-pointer transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          {/* Pulsante Aggiungi al Carrello */}
          <button
            type="button"
            onClick={handleAddToCart}
            disabled={isOutOfStock}
            aria-label={isOutOfStock ? `${product.nome} è esaurito` : `Aggiungi ${quantity} di ${product.nome} al carrello`}
            className={`flex-1 py-2.5 px-3.5 rounded-2xl font-bold text-xs flex items-center justify-center gap-2 transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-brand-dark ${
              isOutOfStock
                ? 'bg-neutral-100 text-neutral-400 border border-neutral-200 cursor-not-allowed'
                : added
                ? 'bg-emerald-600 text-white shadow-md'
                : 'bg-brand-dark text-brand-cream hover:bg-brand-amber hover:text-white shadow-xs hover:shadow-md active:scale-98 cursor-pointer'
            }`}
          >
            {added ? (
              <>
                <Check className="w-4 h-4" aria-hidden="true" />
                <span>Aggiunto!</span>
              </>
            ) : isOutOfStock ? (
              <span>Esaurito</span>
            ) : (
              <>
                <ShoppingBag className="w-4 h-4" aria-hidden="true" />
                <span>Aggiungi al Carrello</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
