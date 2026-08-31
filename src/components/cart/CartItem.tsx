import React from 'react';
import { Plus, Minus, Trash2 } from 'lucide-react';
import { formatPrice } from '../../lib/format';
import { type CartItem as CartItemType, updateItemQuantity, removeFromCart } from '../../lib/cart-store';

interface CartItemProps {
  item: CartItemType;
}

export default function CartItem({ item }: CartItemProps) {
  const activePrice = item.prezzo_scontato && item.prezzo_scontato > 0 
    ? item.prezzo_scontato 
    : item.prezzo;

  return (
    <div className="flex items-center gap-3 py-3 border-b border-brand-dark/10 last:border-b-0">
      {/* Thumbnail */}
      <div className="w-16 h-16 rounded-lg bg-brand-cream border border-brand-dark/10 overflow-hidden flex-shrink-0">
        <img
          src={item.immagine_url || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&auto=format&fit=crop&q=80'}
          alt={item.nome}
          className="w-full h-full object-cover"
          loading="lazy"
        />
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <h4 className="text-sm font-semibold text-brand-dark truncate">{item.nome}</h4>
        {item.marca && (
          <p className="text-xs text-brand-dark/60 truncate">{item.marca}</p>
        )}
        <div className="flex items-center gap-2 mt-1">
          <span className="text-sm font-bold text-brand-dark">{formatPrice(activePrice)}</span>
          {item.prezzo_scontato && item.prezzo_scontato < item.prezzo && (
            <span className="text-xs text-brand-dark/40 line-through">
              {formatPrice(item.prezzo)}
            </span>
          )}
        </div>
      </div>

      {/* Selettore quantità */}
      <div className="flex items-center border border-brand-dark/20 rounded-lg bg-white overflow-hidden shadow-2xs">
        <button
          type="button"
          onClick={() => updateItemQuantity(item.id, -1)}
          className="p-1 text-brand-dark/70 hover:bg-brand-dark/10 hover:text-brand-dark transition-colors"
          aria-label="Riduci quantità"
        >
          <Minus className="w-3.5 h-3.5" />
        </button>
        <span className="px-2 text-xs font-semibold text-brand-dark min-w-[20px] text-center">
          {item.quantita}
        </span>
        <button
          type="button"
          onClick={() => updateItemQuantity(item.id, 1)}
          className="p-1 text-brand-dark/70 hover:bg-brand-dark/10 hover:text-brand-dark transition-colors"
          aria-label="Aumenta quantità"
        >
          <Plus className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Rimuovi */}
      <button
        type="button"
        onClick={() => removeFromCart(item.id)}
        className="p-1.5 text-brand-dark/40 hover:text-red-600 transition-colors"
        aria-label="Rimuovi dal carrello"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}
