import React from 'react';
import { useStore } from '@nanostores/react';
import { ShoppingBag } from 'lucide-react';
import { $cartStore, openCart } from '../../lib/cart-store';

export default function CartIcon() {
  const cart = useStore($cartStore);
  const items = Array.isArray(cart) ? cart : [];
  const totalQuantity = items.reduce((acc, i) => acc + (Number(i.quantita) || 1), 0);

  return (
    <button
      type="button"
      onClick={openCart}
      aria-label={`Visualizza carrello, ${totalQuantity} articoli presenti`}
      className="relative p-2.5 rounded-full text-brand-dark hover:text-brand-amber hover:bg-brand-dark/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2C3E50] cursor-pointer"
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
