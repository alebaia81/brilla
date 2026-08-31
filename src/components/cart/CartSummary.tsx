import React from 'react';
import { useStore } from '@nanostores/react';
import { ShoppingBag, ArrowRight } from 'lucide-react';
import { $totalPrice, $totalQuantity, closeCart } from '../../lib/cart-store';
import { formatPrice } from '../../lib/format';

export default function CartSummary() {
  const totalPrice = useStore($totalPrice);
  const totalQuantity = useStore($totalQuantity);

  if (totalQuantity === 0) {
    return null;
  }

  return (
    <div className="pt-4 mt-auto border-t border-brand-dark/10 bg-white/90">
      <div className="flex justify-between items-baseline mb-2">
        <span className="text-sm text-brand-dark/70">Subtotale ({totalQuantity} articoli)</span>
        <span className="text-xl font-bold text-brand-dark">{formatPrice(totalPrice)}</span>
      </div>
      <p className="text-xs text-brand-dark/50 mb-4">
        Spese di spedizione o opzione ritiro calcolate al checkout.
      </p>
      
      <div className="flex flex-col gap-2">
        <a
          href="/checkout"
          onClick={closeCart}
          className="flex items-center justify-center gap-2 w-full py-3 px-4 bg-brand-amber hover:bg-brand-amber/90 text-white font-semibold rounded-xl shadow-md hover:shadow-lg transition-all active:scale-[0.99]"
        >
          <span>Procedi all'Ordine</span>
          <ArrowRight className="w-4 h-4" />
        </a>

        <button
          type="button"
          onClick={closeCart}
          className="w-full py-2 px-4 text-xs font-medium text-brand-dark/70 hover:text-brand-dark hover:bg-brand-cream rounded-lg transition-colors"
        >
          Continua lo shopping
        </button>
      </div>
    </div>
  );
}
