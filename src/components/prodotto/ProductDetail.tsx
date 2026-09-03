import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice } from '../../lib/format';
import { addToCart } from '../../lib/cart-store';
import CategoryBadge from '../catalogo/CategoryBadge';
import { type Product } from '../catalogo/ProductCard';
import { 
  ShoppingBag, 
  Check, 
  Plus, 
  Minus, 
  Store, 
  Truck, 
  Calendar, 
  ArrowLeft,
  Share2,
  PackageX
} from 'lucide-react';

// Database di fallback completo con tutti gli articoli di prova
const ALL_FALLBACK_PRODUCTS: Record<string, Product> = {
  'set-10-penne-sfera-retrattili': {
    id: 1,
    nome: 'Set 10 Penne a Sfera Retrattili Soft Touch',
    slug: 'set-10-penne-sfera-retrattili',
    descrizione: 'Set professionale a sfera scorrevole con impugnatura soft touch gommata. Inchiostro ad asciugatura rapida ad alta scorrevolezza. Ideale sia per la scuola che per l\'ufficio.',
    marca: 'BIC',
    tipo_prodotto: 'cartoleria',
    prezzo: 6.50,
    sconto_percentuale: 10,
    prezzo_scontato: 5.85,
    quantita_disponibile: 15,
    immagine_url: 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
  },
  'quadernone-maxi-a4-righe-100g': {
    id: 2,
    nome: 'Quadernone Maxi A4 a Righe 100g',
    slug: 'quadernone-maxi-a4-righe-100g',
    descrizione: 'Quadernone resistente con carta pregiata da 100g antispanciamento. Copertina plastificata lucida e punto metallico rinforzato.',
    marca: 'Pigna',
    tipo_prodotto: 'cartoleria',
    prezzo: 2.80,
    sconto_percentuale: 0,
    prezzo_scontato: 2.80,
    quantita_disponibile: 30,
    immagine_url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=800&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
  },
  'evidenziatori-pastel-edition-6pz': {
    id: 3,
    nome: 'Evidenziatori Pastel Edition (Set 6pz)',
    slug: 'evidenziatori-pastel-edition-6pz',
    descrizione: 'Tonalità pastello delicate per studio, appunti e bullet journal. Doppia ampiezza di tratto (2mm e 5mm).',
    marca: 'Stabilo',
    tipo_prodotto: 'cartoleria',
    prezzo: 8.90,
    sconto_percentuale: 15,
    prezzo_scontato: 7.56,
    quantita_disponibile: 3, // Esempio disponibilità limitata
    immagine_url: 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=800&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: false,
  },
  'zaino-scuola-viaggio-idrorepellente': {
    id: 4,
    nome: 'Zaino Scuola & Viaggio Idrorepellente',
    slug: 'zaino-scuola-viaggio-idrorepellente',
    descrizione: 'Schienale ergonomico traspirante, tasca porta borraccia e scomparto imbottito per PC fino a 15.6 pollici. Tessuto tecnico impermeabile.',
    marca: 'Invicta',
    tipo_prodotto: 'cartoleria',
    prezzo: 49.90,
    sconto_percentuale: 20,
    prezzo_scontato: 39.92,
    quantita_disponibile: 8,
    immagine_url: 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
  },
  'national-geographic-italia-mese': {
    id: 5,
    nome: 'National Geographic Italia - Edizione Mese',
    slug: 'national-geographic-italia-mese',
    descrizione: 'Reportage esclusivi sul pianeta, natura incontaminata, scienza, esplorazione e culture del mondo con fotografie straordinarie.',
    marca: 'Gedi',
    tipo_prodotto: 'edicola',
    prezzo: 5.90,
    sconto_percentuale: 0,
    prezzo_scontato: 5.90,
    quantita_disponibile: 12,
    immagine_url: 'https://images.unsplash.com/photo-1547036967-23d11aacaee0?w=800&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
    in_edicola_questo_mese: true,
    periodicita: 'mensile',
  },
  'la-gazzetta-dello-sport-mag': {
    id: 6,
    nome: 'La Gazzetta dello Sport + Magazine',
    slug: 'la-gazzetta-dello-sport-mag',
    descrizione: 'Il quotidiano sportivo più letto d\'Italia con tutti gli approfondimenti sul calcio, motori e gli altri sport, con inserto speciale.',
    marca: 'RCS',
    tipo_prodotto: 'edicola',
    prezzo: 2.00,
    sconto_percentuale: 0,
    prezzo_scontato: 2.00,
    quantita_disponibile: 20,
    immagine_url: 'https://images.unsplash.com/photo-1585829365295-ab7cd400c167?w=800&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: false,
    in_edicola_questo_mese: true,
    periodicita: 'giornaliero',
  },
  'topolino-fumetto-da-collezione': {
    id: 7,
    nome: 'Topolino Fumetto da Collezione',
    slug: 'topolino-fumetto-da-collezione',
    descrizione: 'L\'intramontabile fumetto a colori per grandi e piccini con storie inedite, rubriche e gadget speciale allegato.',
    marca: 'Panini Comics',
    tipo_prodotto: 'edicola',
    prezzo: 3.50,
    sconto_percentuale: 0,
    prezzo_scontato: 3.50,
    quantita_disponibile: 10,
    immagine_url: 'https://images.unsplash.com/photo-1607604276583-eef5d076aa5f?w=800&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
    in_edicola_questo_mese: true,
    periodicita: 'settimanale',
  },
  'tazza-mug-artigianale-brilla': {
    id: 8,
    nome: 'Tazza Mug Artigianale "Brilla Castelnuovo"',
    slug: 'tazza-mug-artigianale-brilla',
    descrizione: 'Tazza in ceramica smaltata a mano con grafica skyline di Castelnuovo Bocca d\'Adda. Perfetta per il caffè mattutino o come ricordo speciale.',
    marca: 'Brilla Cafe',
    tipo_prodotto: 'bar_gift',
    prezzo: 11.50,
    sconto_percentuale: 0,
    prezzo_scontato: 11.50,
    quantita_disponibile: 20,
    immagine_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
  },
  'confezione-cioccolatini-praline-250g': {
    id: 9,
    nome: 'Confezione Cioccolatini & Praline 250g',
    slug: 'confezione-cioccolatini-praline-250g',
    descrizione: 'Selezione artigianale di cioccolato piemontese fondente e al latte con ripieno morbido e granella di nocciole tostate.',
    marca: 'Artigianale',
    tipo_prodotto: 'bar_gift',
    prezzo: 9.90,
    sconto_percentuale: 10,
    prezzo_scontato: 8.91,
    quantita_disponibile: 14,
    immagine_url: 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?w=800&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: true,
  },
  'bottiglia-termica-inox-500ml-brilla': {
    id: 10,
    nome: 'Bottiglia Termica Inox 500ml Brilla Edition',
    slug: 'bottiglia-termica-inox-500ml-brilla',
    descrizione: 'Bottiglia termica a doppio strato in acciaio inossidabile 18/8. Mantiene bevande calde per 12h e fredde per 24h. 100% ermetica e priva di BPA.',
    marca: 'Brilla Cafe',
    tipo_prodotto: 'bar_gift',
    prezzo: 16.00,
    sconto_percentuale: 0,
    prezzo_scontato: 16.00,
    quantita_disponibile: 18,
    immagine_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800&auto=format&fit=crop&q=80',
    disponibile: true,
    in_evidenza: false,
  },
};

interface ProductDetailProps {
  slug: string;
}

export default function ProductDetail({ slug }: ProductDetailProps) {
  // Risolve prima il prodotto corrispondente allo slug specifico
  const getInitialProduct = () => {
    if (slug && ALL_FALLBACK_PRODUCTS[slug]) {
      return ALL_FALLBACK_PRODUCTS[slug];
    }
    return null;
  };

  const [product, setProduct] = useState<Product | null>(getInitialProduct());
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [loading, setLoading] = useState(!getInitialProduct());
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    async function loadProduct() {
      if (!slug) return;
      try {
        const { data, error } = await supabase
          .from('prodotti')
          .select('*')
          .eq('slug', slug)
          .single();

        if (!error && data) {
          setProduct(data as Product);
        } else if (ALL_FALLBACK_PRODUCTS[slug]) {
          setProduct(ALL_FALLBACK_PRODUCTS[slug]);
        }
      } catch (err) {
        if (ALL_FALLBACK_PRODUCTS[slug]) {
          setProduct(ALL_FALLBACK_PRODUCTS[slug]);
        }
      } finally {
        setLoading(false);
      }
    }

    loadProduct();
  }, [slug]);

  if (!product && !loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-brand-cream flex items-center justify-center mx-auto mb-4 text-brand-dark/40">
          <PackageX className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-bold text-brand-dark mb-2">Prodotto non trovato</h2>
        <p className="text-xs text-brand-dark/60 mb-6">
          L'articolo che stai cercando non è disponibile o è stato rimosso.
        </p>
        <a
          href="/catalogo"
          className="inline-flex items-center gap-2 px-6 py-3 bg-brand-amber text-white text-xs font-bold rounded-xl shadow-md"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna al Catalogo</span>
        </a>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-xs text-brand-dark/50 font-bold">
        Caricamento dettagli prodotto in corso...
      </div>
    );
  }

  const activePrice = product.prezzo_scontato && product.prezzo_scontato > 0 
    ? product.prezzo_scontato 
    : product.prezzo;

  const hasDiscount = Boolean(product.sconto_percentuale && product.sconto_percentuale > 0);

  const isOutOfStock = product.disponibile === false || (product.quantita_disponibile != null && product.quantita_disponibile <= 0);
  const isLowStock = !isOutOfStock && product.quantita_disponibile != null && product.quantita_disponibile < 5;
  const maxStock = product.quantita_disponibile != null ? Math.max(0, product.quantita_disponibile) : 99;

  const handleAddToCart = () => {
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
    }, quantity);

    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = () => {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-14">
      
      {/* Breadcrumb e Ritorno */}
      <div className="mb-8 flex items-center justify-between">
        <a
          href="/catalogo"
          className="inline-flex items-center gap-2 text-xs font-bold text-brand-dark/70 hover:text-brand-amber transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Torna al Catalogo</span>
        </a>

        <button
          type="button"
          onClick={handleShare}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-brand-dark/15 text-xs font-semibold text-brand-dark hover:bg-brand-dark hover:text-white transition-all shadow-2xs cursor-pointer"
        >
          <Share2 className="w-3.5 h-3.5" />
          <span>{copied ? 'Link Copiato! ✓' : 'Condividi'}</span>
        </button>
      </div>

      {/* Scheda a 2 Colonne */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 bg-white rounded-3xl p-6 sm:p-10 border border-brand-dark/10 shadow-sm">
        
        {/* Colonna Sinistra: Immagine Grande */}
        <div className="lg:col-span-6">
          <div className="relative aspect-square rounded-3xl bg-brand-cream/30 border border-brand-dark/10 overflow-hidden shadow-inner p-6 sm:p-8 flex items-center justify-center">
            <img
              src={product.immagine_url || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=800&auto=format&fit=crop&q=80'}
              alt={product.nome}
              className={`max-w-full max-h-full object-contain drop-shadow-md ${isOutOfStock ? 'grayscale-[30%]' : ''}`}
              loading="eager"
            />
            
            <div className="absolute top-4 left-4 flex flex-col gap-2 z-10 pointer-events-none">
              <CategoryBadge tipo={product.tipo_prodotto} className="text-xs py-1 px-3" />
              {Boolean(hasDiscount && !isOutOfStock) && (
                <span className="px-2.5 py-1 rounded-full text-xs font-bold text-white bg-rose-600 shadow-sm self-start">
                  Sconto del {product.sconto_percentuale}%
                </span>
              )}
              {isOutOfStock ? (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold text-white bg-neutral-900 shadow-sm self-start">
                  Esaurito
                </span>
              ) : isLowStock ? (
                <span className="px-3 py-1 rounded-full text-xs font-extrabold text-amber-950 bg-amber-400 shadow-sm self-start">
                  Solo {product.quantita_disponibile} rimasti!
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {/* Colonna Destra: Dettagli, Prezzo & Acquisto */}
        <div className="lg:col-span-6 flex flex-col justify-between">
          
          <div className="space-y-6">
            
            {/* Titolo e Marca */}
            <div>
              {product.marca && (
                <span className="text-xs font-bold uppercase tracking-widest text-brand-dark/50 block mb-1">
                  {product.marca}
                </span>
              )}
              <h1 className="text-2xl sm:text-3xl font-black text-brand-dark tracking-tight leading-tight">
                {product.nome}
              </h1>
            </div>

            {/* Prezzo & Box Stato Scorte */}
            <div className="p-4 sm:p-5 rounded-2xl bg-brand-cream/60 border border-brand-dark/10 space-y-3">
              <div className="flex items-baseline gap-3">
                <span className="text-3xl sm:text-4xl font-black text-brand-dark">
                  {formatPrice(activePrice)}
                </span>
                {hasDiscount && (
                  <span className="text-sm font-semibold text-brand-dark/40 line-through">
                    {formatPrice(product.prezzo)}
                  </span>
                )}
                <span className="text-xs text-brand-dark/50 ml-auto">IVA inclusa</span>
              </div>

              {/* Box Disponibilità / Giacenza */}
              <div className="pt-2.5 border-t border-brand-dark/10 flex items-center justify-between text-xs">
                {isOutOfStock ? (
                  <span className="inline-flex items-center gap-1.5 font-bold text-rose-700">
                    <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-pulse" />
                    Al momento esaurito a magazzino
                  </span>
                ) : isLowStock ? (
                  <span className="inline-flex items-center gap-1.5 font-extrabold text-amber-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 animate-ping" />
                    ⚡ Solo {product.quantita_disponibile} pezzi disponibili!
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1.5 font-bold text-emerald-800">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    Disponibile in negozio {product.quantita_disponibile != null ? `(${product.quantita_disponibile} pz)` : ''}
                  </span>
                )}
                <span className="text-[11px] text-brand-dark/60 font-medium">
                  Castelnuovo Bocca d'Adda
                </span>
              </div>
            </div>

            {/* Sezione Edicola Speciale (se applicabile) */}
            {(product.in_edicola_questo_mese || product.periodicita) && (
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
                <Calendar className="w-5 h-5 text-emerald-700 mt-0.5 flex-shrink-0" />
                <div className="text-xs leading-relaxed">
                  <strong className="block font-bold">Pubblicazione in Edicola</strong>
                  {product.periodicita && <span>Uscita con periodicità {product.periodicita}. </span>}
                  <span>Disponibile con Scegli &amp; Ritira in negozio o spedizione rapida.</span>
                </div>
              </div>
            )}

            {/* Descrizione */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-brand-dark/70">
                Descrizione Articolo
              </h3>
              <p className="text-sm text-brand-dark/80 leading-relaxed">
                {product.descrizione || 'Nessuna descrizione aggiuntiva fornita per questo articolo.'}
              </p>
            </div>

            {/* Selettore Quantità & Bottone Aggiungi */}
            <div className="pt-4 border-t border-brand-dark/10 space-y-4">
              <div className="flex items-center gap-4">
                
                <div className={`flex items-center border-2 rounded-2xl bg-brand-cream/40 p-1 ${isOutOfStock ? 'opacity-40 border-brand-dark/10 pointer-events-none' : 'border-brand-dark/20'}`}>
                  <button
                    type="button"
                    disabled={quantity <= 1 || isOutOfStock}
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="p-2 text-brand-dark/70 hover:text-brand-dark rounded-xl hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Diminuisci quantità"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="px-4 text-sm font-bold text-brand-dark min-w-[36px] text-center">
                    {isOutOfStock ? 0 : quantity}
                  </span>
                  <button
                    type="button"
                    disabled={quantity >= maxStock || isOutOfStock}
                    onClick={() => setQuantity(Math.min(maxStock, quantity + 1))}
                    className="p-2 text-brand-dark/70 hover:text-brand-dark rounded-xl hover:bg-white transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer"
                    aria-label="Aumenta quantità"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={isOutOfStock}
                  className={`flex-1 py-4 px-6 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 shadow-md transition-all active:scale-[0.99] ${
                    isOutOfStock
                      ? 'bg-neutral-200 text-neutral-400 cursor-not-allowed shadow-none'
                      : added
                      ? 'bg-emerald-600 text-white shadow-emerald-600/30'
                      : 'bg-brand-amber hover:bg-brand-amber/90 text-white shadow-brand-amber/30 hover:shadow-lg cursor-pointer'
                  }`}
                >
                  {isOutOfStock ? (
                    <>
                      <PackageX className="w-5 h-5" />
                      <span>Prodotto Esaurito</span>
                    </>
                  ) : added ? (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Aggiunto al Carrello!</span>
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="w-5 h-5" />
                      <span>Aggiungi al Carrello ({formatPrice(activePrice * quantity)})</span>
                    </>
                  )}
                </button>

              </div>
              {!isOutOfStock && product.quantita_disponibile != null && quantity >= maxStock && (
                <p className="text-[11px] font-bold text-amber-800">
                  Hai raggiunto la quantità massima disponibile ({maxStock} pz).
                </p>
              )}
            </div>

            {/* Garanzie e Modalità Ritiro */}
            <div className="grid grid-cols-2 gap-3 pt-4 text-xs text-brand-dark/75">
              <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-cream/50 border border-brand-dark/5">
                <Store className="w-4 h-4 text-brand-amber flex-shrink-0" />
                <span>Scegli &amp; Ritira gratuito</span>
              </div>
              <div className="flex items-center gap-2 p-3 rounded-xl bg-brand-cream/50 border border-brand-dark/5">
                <Truck className="w-4 h-4 text-brand-amber flex-shrink-0" />
                <span>Spedizione con corriere</span>
              </div>
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
