import { atom, computed } from 'nanostores';

export interface CartItem {
  id: number;
  slug: string;
  nome: string;
  marca?: string | null;
  prezzo: number;
  prezzo_scontato?: number | null;
  immagine_url?: string | null;
  quantita: number;
  tipo_prodotto?: string;
}

const STORAGE_KEY = 'brilla_cart_v1';

// Inizializza dallo storage locale in modo sicuro per SSR
function getInitialCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    console.error('Errore nel recupero del carrello da localStorage:', err);
    return [];
  }
}

// Atom principale per il carrello
export const $cart = atom<CartItem[]>(getInitialCart());

// Atom per il controllo visivo del Drawer laterale
export const $isCartOpen = atom<boolean>(false);

// Salva le modifiche su localStorage ogni volta che l'atom cambia nel browser
if (typeof window !== 'undefined') {
  $cart.subscribe((items) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.error('Errore nel salvataggio del carrello:', err);
    }
  });
}

// Computed: conteggio totale articoli
export const $totalQuantity = computed($cart, (items) => {
  return items.reduce((sum, item) => sum + item.quantita, 0);
});

// Computed: subtotale articoli
export const $totalPrice = computed($cart, (items) => {
  return items.reduce((sum, item) => {
    const activePrice = item.prezzo_scontato && item.prezzo_scontato > 0 
      ? item.prezzo_scontato 
      : item.prezzo;
    return sum + activePrice * item.quantita;
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
  const current = $cart.get();
  const existingIndex = current.findIndex((item) => item.id === product.id);

  if (existingIndex > -1) {
    const updated = [...current];
    updated[existingIndex] = {
      ...updated[existingIndex],
      quantita: updated[existingIndex].quantita + quantitaToAdd,
    };
    $cart.set(updated);
  } else {
    $cart.set([
      ...current,
      {
        ...product,
        quantita: Math.max(1, quantitaToAdd),
      },
    ]);
  }
  openCart();
}

export function updateItemQuantity(id: number, delta: number) {
  const current = $cart.get();
  const target = current.find((item) => item.id === id);
  if (!target) return;

  const newQty = target.quantita + delta;
  if (newQty <= 0) {
    removeFromCart(id);
  } else {
    $cart.set(
      current.map((item) =>
        item.id === id ? { ...item, quantita: newQty } : item
      )
    );
  }
}

export function setItemQuantity(id: number, quantita: number) {
  if (quantita <= 0) {
    removeFromCart(id);
    return;
  }
  const current = $cart.get();
  $cart.set(
    current.map((item) =>
      item.id === id ? { ...item, quantita } : item
    )
  );
}

export function removeFromCart(id: number) {
  const current = $cart.get();
  $cart.set(current.filter((item) => item.id !== id));
}

export function clearCart() {
  $cart.set([]);
}
