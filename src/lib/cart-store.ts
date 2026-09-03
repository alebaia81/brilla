import { atom, computed } from 'nanostores';

export interface CartItem {
  id: number | string;
  slug: string;
  nome: string;
  marca?: string | null;
  prezzo: number;
  prezzo_scontato?: number | null;
  immagine_url?: string | null;
  quantita: number;
  tipo_prodotto?: string;
  quantita_disponibile?: number | null;
}

// 1. Chiave unificata LocalStorage
export const CART_STORAGE_KEY = 'brilla_cafe_cart_v1';

// Legge in sicurezza localStorage nel browser (con migrazione automatica da vecchia chiave se presente)
export function readLocalStorage(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem('brilla_cart_v1');
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Errore nel recupero del carrello da localStorage:', err);
    return [];
  }
}

// Atom principale del carrello
export const $cartStore = atom<CartItem[]>(readLocalStorage());
export const $cart = $cartStore;

// Atom per il Drawer laterale
export const $isCartOpen = atom<boolean>(false);

// Sincronizzazione persistente con LocalStorage
if (typeof window !== 'undefined') {
  // Assicura che l'atom contenga subito i dati del browser all'avvio
  const saved = readLocalStorage();
  if (saved.length > 0 && $cartStore.get().length === 0) {
    $cartStore.set(saved);
  }

  // Ogni volta che $cartStore cambia, aggiorna localStorage
  $cartStore.listen((items) => {
    try {
      if (!items || items.length === 0) {
        localStorage.removeItem(CART_STORAGE_KEY);
        localStorage.removeItem('brilla_cart_v1');
      } else {
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
      }
    } catch (err) {
      console.error('Errore nel salvataggio su localStorage:', err);
    }
  });

  // Log di debug come richiesto
  console.log('[DEBUG CART]', {
    store: $cartStore.get(),
    local: localStorage.getItem(CART_STORAGE_KEY) || localStorage.getItem('brilla_cart_v1'),
  });
}

// Computed: conteggio totale articoli
export const $totalQuantity = computed($cartStore, (items) => {
  return items.reduce((sum, item) => sum + (Number(item.quantita) || 1), 0);
});

// Computed: subtotale articoli
export const $totalPrice = computed($cartStore, (items) => {
  return items.reduce((sum, item) => {
    const activePrice = item.prezzo_scontato && item.prezzo_scontato > 0 
      ? Number(item.prezzo_scontato) 
      : (Number(item.prezzo) || 0);
    return sum + activePrice * (Number(item.quantita) || 1);
  }, 0);
});

// Azioni del carrello
export function openCart() {
  $isCartOpen.set(true);
}

export function closeCart() {
  $isCartOpen.set(false);
}

export function toggleCart() {
  $isCartOpen.set(!$isCartOpen.get());
}

export function addToCart(product: Omit<CartItem, 'quantita'>, quantitaToAdd: number = 1) {
  const current = $cartStore.get();
  const existingIndex = current.findIndex((item) => String(item.id) === String(product.id));
  const maxStock = product.quantita_disponibile != null ? Math.max(0, product.quantita_disponibile) : null;

  if (existingIndex > -1) {
    const existing = current[existingIndex];
    let newQty = existing.quantita + quantitaToAdd;
    const effectiveStock = maxStock ?? existing.quantita_disponibile;
    if (effectiveStock != null) {
      newQty = Math.min(effectiveStock, newQty);
    }
    const updated = [...current];
    updated[existingIndex] = {
      ...existing,
      quantita_disponibile: effectiveStock,
      quantita: newQty,
    };
    $cartStore.set(updated);
  } else {
    let initialQty = Math.max(1, quantitaToAdd);
    if (maxStock != null) {
      if (maxStock <= 0) return; // Non aggiungere se esaurito
      initialQty = Math.min(maxStock, initialQty);
    }
    $cartStore.set([
      ...current,
      {
        ...product,
        quantita_disponibile: maxStock,
        quantita: initialQty,
      },
    ]);
  }
  openCart();
}

export function updateItemQuantity(id: number | string, delta: number) {
  const current = $cartStore.get();
  const target = current.find((item) => String(item.id) === String(id));
  if (!target) return;

  const newQty = target.quantita + delta;
  if (newQty <= 0) {
    removeFromCart(id);
  } else {
    if (delta > 0 && target.quantita_disponibile != null && newQty > target.quantita_disponibile) {
      return; // Raggiunto limite scorte disponibili
    }
    $cartStore.set(
      current.map((item) =>
        String(item.id) === String(id) ? { ...item, quantita: newQty } : item
      )
    );
  }
}

export function setItemQuantity(id: number | string, quantita: number) {
  if (quantita <= 0) {
    removeFromCart(id);
    return;
  }
  const current = $cartStore.get();
  const target = current.find((item) => String(item.id) === String(id));
  let capped = quantita;
  if (target?.quantita_disponibile != null) {
    capped = Math.min(target.quantita_disponibile, capped);
  }
  $cartStore.set(
    current.map((item) =>
      String(item.id) === String(id) ? { ...item, quantita: capped } : item
    )
  );
}

export function removeFromCart(id: number | string) {
  const current = $cartStore.get();
  const nextCart = current.filter((item) => String(item.id) !== String(id));
  $cartStore.set(nextCart);
}

export function clearCart() {
  $cartStore.set([]);
}
