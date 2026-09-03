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
      <div className="flex flex-col items-end gap-1">
        <div className="flex items-center border border-brand-dark/20 rounded-lg bg-white overflow-hidden shadow-2xs">
          <button
            type="button"
            onClick={() => updateItemQuantity(item.id, -1)}
            className="p-1 text-brand-dark/80 hover:bg-brand-dark/10 hover:text-brand-dark transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3E50]"
            aria-label={`Riduci quantità di ${item.nome}`}
          >
            <Minus className="w-3.5 h-3.5" aria-hidden="true" />
          </button>
          <span className="px-2 text-xs font-bold text-brand-dark min-w-[20px] text-center" aria-live="polite">
            {item.quantita}
          </span>
          {(() => {
            const isMaxReached = item.quantita_disponibile != null && item.quantita >= item.quantita_disponibile;
            return (
              <button
                type="button"
                disabled={isMaxReached}
                onClick={() => updateItemQuantity(item.id, 1)}
                className={`p-1 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2C3E50] ${
                  isMaxReached
                    ? 'text-brand-dark/20 cursor-not-allowed bg-brand-cream/60'
                    : 'text-brand-dark/80 hover:bg-brand-dark/10 hover:text-brand-dark cursor-pointer'
                }`}
                title={isMaxReached ? `Massimo disponibile a magazzino (${item.quantita_disponibile} pz)` : 'Aumenta quantità'}
                aria-label={`Aumenta quantità di ${item.nome}`}
              >
                <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              </button>
            );
          })()}
        </div>
        {item.quantita_disponibile != null && item.quantita >= item.quantita_disponibile && (
          <span className="text-[9px] font-extrabold text-amber-950 bg-amber-200/90 px-1.5 py-0.5 rounded">
            Max scorte ({item.quantita_disponibile})
          </span>
        )}
      </div>

      {/* Rimuovi */}
      <button
        type="button"
        onClick={() => removeFromCart(item.id)}
        className="p-1.5 text-brand-dark/50 hover:text-red-700 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-red-600 rounded-lg cursor-pointer"
        aria-label={`Rimuovi ${item.nome} dal carrello`}
      >
        <Trash2 className="w-4 h-4" aria-hidden="true" />
      </button>
    </div>
  );
}
