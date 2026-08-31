import React from 'react';
import { useStore } from '@nanostores/react';
import { ShoppingBag } from 'lucide-react';
import { $totalQuantity, openCart } from '../../lib/cart-store';

export default function CartIcon() {
  const totalQuantity = useStore($totalQuantity);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Visualizza carrello, ${totalQuantity} articoli presenti`}
      className="relative p-2.5 rounded-full text-brand-dark hover:text-brand-amber hover:bg-brand-dark/5 transition-colors focus:outline-none focus:ring-2 focus:ring-brand-amber"
    >
      <ShoppingBag className="w-6 h-6 stroke-[1.8]" />
      {totalQuantity > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center min-w-[20px] h-5 px-1 text-xs font-bold text-white bg-brand-amber rounded-full shadow-sm animate-pulse">
          {totalQuantity > 99 ? '99+' : totalQuantity}
        </span>
      )}
    </button>
  );
}
