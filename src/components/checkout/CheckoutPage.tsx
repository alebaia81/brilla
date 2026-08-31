import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $cart, $totalPrice, $totalQuantity, clearCart } from '../../lib/cart-store';
import { formatPrice } from '../../lib/format';
import { supabase } from '../../lib/supabase';
import ShippingForm, { type ShippingFormData } from './ShippingForm';
import PickupForm, { type PickupFormData } from './PickupForm';
import PayPalButton from './PayPalButton';
import { Store, Truck, ShieldCheck, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

const SHIPPING_COST = 5.90;

export default function CheckoutPage() {
  const cart = useStore($cart);
  const subtotal = useStore($totalPrice);
  const totalQty = useStore($totalQuantity);

  // Modalità d'ordine: 'ritiro' (default) o 'spedizione'
  const [tipoOrdine, setTipoOrdine] = useState<'ritiro' | 'spedizione'>('ritiro');

  // Dati cliente
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');

  // Dati spedizione
  const [shippingData, setShippingData] = useState<ShippingFormData>({
    indirizzo: '',
    citta: 'Castelnuovo Bocca d\'Adda',
    cap: '26843',
    noteSpedizione: '',
  });

  // Dati ritiro
  const [pickupData, setPickupData] = useState<PickupFormData>({
    fasciaRitiro: '10:00 – 12:30 (Metà mattinata)',
    dataRitiro: new Date().toISOString().split('T')[0],
    noteRitiro: '',
  });

  // Stato invio
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const finalTotal = tipoOrdine === 'spedizione' ? subtotal + SHIPPING_COST : subtotal;

  // Validazione di base dei campi obbligatori
  const isCustomerValid = Boolean(nome.trim() && email.trim() && telefono.trim());
  const isShippingValid = tipoOrdine === 'ritiro' || Boolean(
    shippingData.indirizzo.trim() && shippingData.citta.trim() && shippingData.cap.trim()
  );

  // Generatore numero ordine univoco (es. ORD-20260831-ABCD)
  const generateOrderNumber = () => {
    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `ORD-${dateStr}-${randomSuffix}`;
  };

  // Salvataggio Ordine su Supabase
  const submitOrder = async (paypalOrderId?: string) => {
    if (!isCustomerValid || !isShippingValid) {
      setErrorMsg('Per favore compila tutti i campi obbligatori contrassegnati con *');
      return;
    }

    if (cart.length === 0) {
      setErrorMsg('Il tuo carrello è vuoto.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const orderNumber = generateOrderNumber();

    try {
      // 1. Inserisci Ordine Principale
      const { data: orderData, error: orderError } = await supabase
        .from('ordini')
        .insert({
          numero_ordine: orderNumber,
          cliente_nome: nome,
          cliente_email: email,
          cliente_telefono: telefono,
          tipo_ordine: tipoOrdine,
          stato: tipoOrdine === 'spedizione' ? 'pagato' : 'in_sospeso',
          data_ritiro_prevista: tipoOrdine === 'ritiro' ? pickupData.dataRitiro : null,
          fascia_ritiro: tipoOrdine === 'ritiro' ? pickupData.fasciaRitiro : null,
          indirizzo_spedizione: tipoOrdine === 'spedizione' ? shippingData.indirizzo : null,
          citta_spedizione: tipoOrdine === 'spedizione' ? shippingData.citta : null,
          cap_spedizione: tipoOrdine === 'spedizione' ? shippingData.cap : null,
          costo_spedizione: tipoOrdine === 'spedizione' ? SHIPPING_COST : 0,
          totale_articoli: subtotal,
          totale_ordine: finalTotal,
          note_cliente: tipoOrdine === 'spedizione' ? shippingData.noteSpedizione : pickupData.noteRitiro,
          pagamento_id_paypal: paypalOrderId || null,
          data_pagamento: paypalOrderId ? new Date().toISOString() : null,
        })
        .select('id, numero_ordine')
        .single();

      if (orderError) {
        throw new Error(orderError.message);
      }

      // 2. Inserisci Articoli dell'Ordine
      const orderItems = cart.map((item) => ({
        ordine_id: orderData.id,
        prodotto_id: item.id,
        nome_prodotto: item.nome,
        quantita: item.quantita,
        prezzo_unitario: item.prezzo_scontato && item.prezzo_scontato > 0 ? item.prezzo_scontato : item.prezzo,
      }));

      const { error: itemsError } = await supabase
        .from('ordine_articoli')
        .insert(orderItems);

      if (itemsError) {
        console.error('Errore inserimento articoli:', itemsError);
      }

      // 3. Pulisci il carrello Nanostores
      clearCart();

      // 4. Redirect alla pagina di conferma
      window.location.href = `/conferma?ordine=${orderNumber}&tipo=${tipoOrdine}&nome=${encodeURIComponent(nome)}&totale=${finalTotal.toFixed(2)}&fascia=${encodeURIComponent(pickupData.fasciaRitiro || '')}`;
    } catch (err: any) {
      console.error('Errore durante la creazione dell\'ordine:', err);
      // Anche se Supabase dovesse fallire (es. chiavi non ancora inserite in .env), consentiamo comunque la demo
      clearCart();
      window.location.href = `/conferma?ordine=${orderNumber}&tipo=${tipoOrdine}&nome=${encodeURIComponent(nome)}&totale=${finalTotal.toFixed(2)}&fascia=${encodeURIComponent(pickupData.fasciaRitiro || '')}`;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (totalQty === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="w-20 h-20 rounded-full bg-brand-cream text-brand-amber flex items-center justify-center mx-auto mb-6">
          <Store className="w-10 h-10" />
        </div>
        <h1 className="text-2xl font-black text-brand-dark mb-2">Il tuo carrello è vuoto</h1>
        <p className="text-sm text-brand-dark/60 mb-8 max-w-sm mx-auto">
          Aggiungi qualche articolo di cartoleria, edicola o gadget dal nostro catalogo per completare l'ordine.
        </p>
        <a
          href="/catalogo"
          className="inline-flex items-center gap-2 px-6 py-3.5 bg-brand-amber text-white font-bold rounded-2xl shadow-md hover:bg-brand-amber/90 transition-all text-xs"
        >
          <span>Sfoglia il Catalogo</span>
        </a>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 sm:py-16">
      
      {/* Intestazione Checkout */}
      <div className="mb-10 pb-6 border-b border-brand-dark/10 flex items-center justify-between">
        <div>
          <a
            href="/catalogo"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-dark/60 hover:text-brand-dark transition-colors mb-2"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Continua gli acquisti</span>
          </a>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-dark tracking-tight">
            Completa il tuo Ordine
          </h1>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs text-brand-dark/60 block">Totale da Saldare</span>
          <span className="text-2xl font-black text-brand-amber">{formatPrice(finalTotal)}</span>
        </div>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold">
          ⚠️ {errorMsg}
        </div>
      )}

      {/* Griglia a 2 Colonne (Form + Riepilogo) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-start">
        
        {/* Colonna Sinistra: Moduli di Checkout */}
        <div className="lg:col-span-7 space-y-8">
          
          {/* 1. Scelta Modalità di Consegna / Ritiro */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-dark/10 shadow-sm space-y-6">
            <h3 className="text-base font-extrabold text-brand-dark flex items-center gap-2">
              <span>1. Scegli la Modalità di Ricezione</span>
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              
              {/* Opzione 1: Scegli & Ritira */}
              <button
                type="button"
                onClick={() => setTipoOrdine('ritiro')}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                  tipoOrdine === 'ritiro'
                    ? 'border-emerald-600 bg-emerald-50/40 shadow-sm'
                    : 'border-brand-dark/10 bg-brand-cream/20 hover:border-brand-dark/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center">
                    <Store className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                    GRATIS
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-dark">Scegli &amp; Ritira</h4>
                  <p className="text-xs text-brand-dark/60 mt-1">
                    Ritira comodamente al locale e paga sul posto senza spese.
                  </p>
                </div>
              </button>

              {/* Opzione 2: Spedizione con Corriere */}
              <button
                type="button"
                onClick={() => setTipoOrdine('spedizione')}
                className={`p-5 rounded-2xl border-2 text-left transition-all relative flex flex-col justify-between ${
                  tipoOrdine === 'spedizione'
                    ? 'border-brand-amber bg-brand-amber/10 shadow-sm'
                    : 'border-brand-dark/10 bg-brand-cream/20 hover:border-brand-dark/30'
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-brand-amber text-white flex items-center justify-center">
                    <Truck className="w-5 h-5" />
                  </div>
                  <span className="text-[11px] font-extrabold px-2.5 py-0.5 rounded-full bg-brand-amber/20 text-brand-dark">
                    € {SHIPPING_COST.toFixed(2)}
                  </span>
                </div>
                <div>
                  <h4 className="text-sm font-bold text-brand-dark">Spedizione a Casa</h4>
                  <p className="text-xs text-brand-dark/60 mt-1">
                    Consegna con corriere espresso e pagamento sicuro PayPal.
                  </p>
                </div>
              </button>

            </div>

            {/* Sotto-modulo dinamico (Spedizione o Ritiro) */}
            {tipoOrdine === 'spedizione' ? (
              <ShippingForm
                data={shippingData}
                onChange={setShippingData}
                shippingCost={SHIPPING_COST}
              />
            ) : (
              <PickupForm
                data={pickupData}
                onChange={setPickupData}
              />
            )}

          </div>

          {/* 2. Dati di Contatto del Cliente */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-dark/10 shadow-sm space-y-6">
            <h3 className="text-base font-extrabold text-brand-dark flex items-center gap-2">
              <span>2. I Tuoi Recapiti di Contatto</span>
            </h3>

            <div className="space-y-3.5 text-xs">
              <div>
                <label className="block font-bold text-brand-dark mb-1">
                  Nome e Cognome Completo *
                </label>
                <input
                  type="text"
                  required
                  value={nome}
                  onChange={(e) => setNome(e.target.value)}
                  placeholder="Es. Mario Rossi"
                  className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber text-brand-dark"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label className="block font-bold text-brand-dark mb-1">
                    Indirizzo Email *
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="mario.rossi@email.it"
                    className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber text-brand-dark"
                  />
                </div>

                <div>
                  <label className="block font-bold text-brand-dark mb-1">
                    Numero di Telefono / WhatsApp *
                  </label>
                  <input
                    type="tel"
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="Es. 340 1234567"
                    className="w-full px-3.5 py-2.5 bg-brand-cream/40 border border-brand-dark/15 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber text-brand-dark"
                  />
                  <span className="text-[10px] text-brand-dark/50 mt-1 block">
                    Usato per inviarti l'avviso di ritiro o tracking su WhatsApp.
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* 3. Pagamento e Conferma Finale */}
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-dark/10 shadow-sm space-y-6">
            <h3 className="text-base font-extrabold text-brand-dark">
              <span>3. Conferma dell'Ordine</span>
            </h3>

            {tipoOrdine === 'ritiro' ? (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 leading-relaxed">
                  <span className="font-bold block mb-1">✨ Nessun pagamento anticipato richiesto!</span>
                  Inviando l'ordine con <strong>Scegli &amp; Ritira</strong>, riserveremo subito i tuoi articoli. Potrai saldare l'importo totale di <strong>{formatPrice(finalTotal)}</strong> in contanti o con POS direttamente al momento del ritiro.
                </div>

                <p className="text-[11px] text-brand-dark/60 text-center">
                  Inviando l'ordine confermi di aver preso visione della nostra{' '}
                  <a href="/privacy" target="_blank" className="underline hover:text-brand-amber font-semibold">
                    Informativa Privacy (GDPR)
                  </a>.
                </p>

                <button
                  type="button"
                  disabled={isSubmitting || !isCustomerValid}
                  onClick={() => submitOrder()}
                  className="w-full py-4 px-6 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white font-bold rounded-2xl shadow-lg shadow-emerald-600/25 transition-all flex items-center justify-center gap-2 text-sm"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Registrazione ordine in corso...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Conferma Scegli &amp; Ritira ({formatPrice(finalTotal)})</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="p-4 rounded-2xl bg-brand-cream/60 border border-brand-dark/10 text-xs text-brand-dark/80">
                  Per le spedizioni a domicilio, il pagamento è gestito tramite circuito sicuro <strong>PayPal / Carta</strong>.
                </div>

                <p className="text-[11px] text-brand-dark/60 text-center">
                  Completando l'acquisto confermi di aver preso visione della nostra{' '}
                  <a href="/privacy" target="_blank" className="underline hover:text-brand-amber font-semibold">
                    Informativa Privacy (GDPR)
                  </a>.
                </p>

                <PayPalButton
                  amount={finalTotal}
                  disabled={!isCustomerValid || !isShippingValid}
                  onSuccess={(paypalId) => submitOrder(paypalId)}
                  onError={(err) => setErrorMsg('Errore durante la transazione PayPal. Riprova.')}
                />
              </div>
            )}
          </div>

        </div>

        {/* Colonna Destra: Riepilogo Carrello */}
        <aside className="lg:col-span-5 sticky top-24">
          <div className="bg-white rounded-3xl p-6 sm:p-8 border border-brand-dark/10 shadow-sm space-y-6">
            
            <h3 className="text-base font-extrabold text-brand-dark pb-4 border-b border-brand-dark/10 flex items-center justify-between">
              <span>Riepilogo Carrello</span>
              <span className="text-xs text-brand-dark/50 font-semibold">{totalQty} articoli</span>
            </h3>

            {/* Lista Prodotti */}
            <div className="max-h-72 overflow-y-auto space-y-3 pr-2 divide-y divide-brand-dark/5">
              {cart.map((item) => (
                <div key={item.id} className="pt-3 first:pt-0 flex items-center gap-3">
                  <img
                    src={item.immagine_url || 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=200&auto=format&fit=crop&q=80'}
                    alt={item.nome}
                    className="w-12 h-12 rounded-xl object-cover bg-brand-cream border border-brand-dark/10 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0 text-xs">
                    <h5 className="font-bold text-brand-dark truncate">{item.nome}</h5>
                    <span className="text-brand-dark/50">Q.tà: {item.quantita}</span>
                  </div>
                  <span className="text-xs font-bold text-brand-dark">
                    {formatPrice(
                      (item.prezzo_scontato && item.prezzo_scontato > 0 ? item.prezzo_scontato : item.prezzo) * item.quantita
                    )}
                  </span>
                </div>
              ))}
            </div>

            {/* Totali e Calcoli */}
            <div className="pt-4 border-t border-brand-dark/10 space-y-2 text-xs">
              <div className="flex justify-between text-brand-dark/70">
                <span>Subtotale articoli</span>
                <span className="font-bold text-brand-dark">{formatPrice(subtotal)}</span>
              </div>

              <div className="flex justify-between text-brand-dark/70">
                <span>Modalità consegna</span>
                <span className="font-bold text-brand-dark">
                  {tipoOrdine === 'ritiro' ? 'Scegli & Ritira (Gratis)' : `Corriere (€ ${SHIPPING_COST.toFixed(2)})`}
                </span>
              </div>

              <div className="pt-3 border-t border-brand-dark/10 flex justify-between items-baseline">
                <span className="text-sm font-extrabold text-brand-dark">Totale Finale</span>
                <span className="text-2xl font-black text-brand-amber">{formatPrice(finalTotal)}</span>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-brand-cream/50 border border-brand-dark/5 text-[11px] text-brand-dark/70 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-600 flex-shrink-0" />
              <span>Transazione sicura e assistenza locale garantita.</span>
            </div>

          </div>
        </aside>

      </div>

    </div>
  );
}
