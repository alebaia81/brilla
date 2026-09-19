import React, { useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { X, ShoppingBag, ArrowRight, Truck } from 'lucide-react';
import { $cart, $isCartOpen, closeCart, $totalQuantity, $totalPrice, FREE_SHIPPING_THRESHOLD } from '../../lib/cart-store';
import { formatPrice } from '../../lib/format';
import CartItem from './CartItem';
import CartSummary from './CartSummary';

export default function CartDrawer() {
  const cart = useStore($cart);
  const isOpen = useStore($isCartOpen);
  const totalQuantity = useStore($totalQuantity);
  const totalPrice = useStore($totalPrice);

  const missingForFreeShipping = Math.max(0, Number((FREE_SHIPPING_THRESHOLD - totalPrice).toFixed(2)));
  const progressPercent = Math.min(100, Math.round((totalPrice / FREE_SHIPPING_THRESHOLD) * 100));
  const hasFreeShipping = totalPrice >= FREE_SHIPPING_THRESHOLD;

  const closeButtonRef = React.useRef<HTMLButtonElement>(null);

  // Blocca lo scroll del body quando il drawer è aperto e porta il focus al pulsante chiudi
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      const timer = setTimeout(() => {
        closeButtonRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Chiudi con ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        closeCart();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden" role="dialog" aria-modal="true" aria-label="Carrello della spesa">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-brand-dark/40 backdrop-blur-xs transition-opacity duration-300 animate-fadeIn"
        onClick={closeCart}
        aria-hidden="true"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col transform transition-transform duration-300 ease-in-out">
          
          {/* Header Drawer */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-brand-dark/10 bg-brand-cream/50">
            <div className="flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-brand-amber" aria-hidden="true" />
              <h3 className="text-lg font-bold text-brand-dark">
                Il tuo Carrello ({totalQuantity})
              </h3>
            </div>
            <button
              ref={closeButtonRef}
              type="button"
              onClick={closeCart}
              className="p-2 text-brand-dark/60 hover:text-brand-dark rounded-full hover:bg-brand-dark/5 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-[#2C3E50] cursor-pointer"
              aria-label="Chiudi carrello della spesa"
            >
              <X className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>

          {/* Barra Informativa Spedizione Gratuita */}
          {cart.length > 0 && (
            <div className="px-6 py-3 bg-amber-500/10 border-b border-brand-dark/10">
              <div className="flex items-center justify-between text-xs mb-1.5">
                {hasFreeShipping ? (
                  <span className="font-bold text-emerald-800 flex items-center gap-1.5">
                    <span aria-hidden="true">🎉</span>
                    <span>Hai sbloccato la <strong>Spedizione Gratuita!</strong></span>
                  </span>
                ) : (
                  <span className="font-medium text-brand-dark/85 flex items-center gap-1.5">
                    <Truck className="w-3.5 h-3.5 text-brand-amber shrink-0" aria-hidden="true" />
                    <span>Ti mancano solo <strong>{formatPrice(missingForFreeShipping)}</strong> per la spedizione gratuita!</span>
                  </span>
                )}
                <span className="text-[10px] font-extrabold text-brand-dark/60">{progressPercent}%</span>
              </div>
              <div className="w-full h-2 bg-neutral-200 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-500 rounded-full ${
                    hasFreeShipping ? 'bg-emerald-600' : 'bg-brand-amber'
                  }`}
                  style={{ width: `${progressPercent}%` }}
                />
              </div>
            </div>
          )}

          {/* Body */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            {cart.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12">
                <div className="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center mb-4 text-brand-amber">
                  <ShoppingBag className="w-8 h-8" />
                </div>
                <h4 className="text-base font-semibold text-brand-dark mb-1">
                  Il tuo carrello è vuoto
                </h4>
                <p className="text-xs text-brand-dark/60 max-w-xs mb-6">
                  Esplora la nostra cartoleria, l'edicola del mese o i gadget del bar per iniziare a riempirlo.
                </p>
                <a
                  href="/catalogo"
                  onClick={closeCart}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-dark text-brand-cream text-xs font-semibold rounded-xl hover:bg-brand-dark/90 transition-colors"
                >
                  <span>Esplora il Catalogo</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </a>
              </div>
            ) : (
              <div className="divide-y divide-brand-dark/5">
                {cart.map((item) => (
                  <CartItem key={item.id} item={item} />
                ))}
              </div>
            )}
          </div>

          {/* Footer Drawer */}
          {cart.length > 0 && (
            <div className="p-6 bg-brand-cream/30 border-t border-brand-dark/10">
              <CartSummary />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
