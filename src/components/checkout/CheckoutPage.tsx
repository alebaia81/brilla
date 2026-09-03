import React, { useState } from 'react';
import { useStore } from '@nanostores/react';
import { $cartStore, clearCart, type CartItem } from '../../lib/cart-store';
import { supabase } from '../../lib/supabase';

export const CheckoutPage = () => {
  const cart = useStore($cartStore);
  const [orderType, setOrderType] = useState<'ritiro' | 'spedizione'>('ritiro');
  const [nome, setNome] = useState('');
  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [indirizzo, setIndirizzo] = useState('');
  const [citta, setCitta] = useState('Castelnuovo Bocca d\'Adda');
  const [cap, setCap] = useState('26843');
  const getTodayIso = () => {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const getTomorrowIso = () => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const [dataRitiro, setDataRitiro] = useState(getTodayIso());
  const [fascia, setFascia] = useState('10:00 - 12:30 (Metà Mattinata)');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Risolve gli articoli dello store in modo sicuro
  const items: CartItem[] = Array.isArray(cart) ? cart : ((cart as any)?.items || []);

  const totalQty = items.reduce((sum, item) => sum + (Number(item.quantita) || 1), 0);
  const subtotal = items.reduce((sum, item) => {
    const activePrice = item.prezzo_scontato && item.prezzo_scontato > 0 
      ? Number(item.prezzo_scontato) 
      : (Number(item.prezzo) || 0);
    return sum + activePrice * (Number(item.quantita) || 1);
  }, 0);

  const shippingCost = orderType === 'spedizione' ? 5.90 : 0;
  const finalTotal = subtotal + shippingCost;

  // 1. Invio e salvataggio reale dell'ordine su Supabase
  const handleConfirmOrder = async () => {
    if (!nome.trim() || !telefono.trim()) {
      setErrorMsg('Per favore compila tutti i campi obbligatori (Nome e Telefono).');
      return;
    }

    if (orderType === 'spedizione' && !indirizzo.trim()) {
      setErrorMsg('Per favore inserisci l\'indirizzo completo di spedizione.');
      return;
    }

    if (orderType === 'ritiro' && !dataRitiro) {
      setErrorMsg('Per favore seleziona il giorno desiderato per il ritiro.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Il tuo carrello è vuoto.');
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);

    const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
    const orderNumber = `ORD-${dateStr}-${randomSuffix}`;

    try {
      // 1.1 Inserimento Ordine Principale
      const orderPayload = {
        numero_ordine: orderNumber,
        cliente_nome: nome.trim(),
        cliente_email: (email && email.trim()) ? email.trim() : `${telefono.replace(/\s+/g, '')}@cliente.brillacafe.it`,
        cliente_telefono: telefono.trim(),
        tipo_ordine: orderType,
        stato: 'in_sospeso',
        data_ritiro_prevista: orderType === 'ritiro' ? (dataRitiro || getTodayIso()) : null,
        fascia_ritiro: orderType === 'ritiro' ? fascia : null,
        indirizzo_spedizione: orderType === 'spedizione' ? indirizzo.trim() : null,
        citta_spedizione: orderType === 'spedizione' ? citta.trim() : null,
        cap_spedizione: orderType === 'spedizione' ? cap.trim() : null,
        costo_spedizione: shippingCost,
        totale_articoli: subtotal,
        totale_ordine: finalTotal,
        note_cliente: orderType === 'spedizione' 
          ? `Spedizione: ${indirizzo.trim()}, ${citta.trim()} ${cap.trim()}` 
          : `Ritiro: ${dataRitiro} - Fascia: ${fascia}`,
      };

      console.log('[ORDINE PAYLOAD]', orderPayload);

      const { data: orderData, error: orderError } = await supabase
        .from('ordini')
        .insert([orderPayload])
        .select()
        .single();

      if (orderError) {
        console.error('[ERRORE INSERIMENTO ORDINE SUPABASE]:', orderError);
        setErrorMsg(`Impossibile registrare l'ordine nel database: ${orderError.message || 'Verifica la connessione o i permessi RLS.'}`);
        setIsSubmitting(false);
        return; // NON PROCEDERE AL REDIRECT SE C'È ERRORE!
      }

      console.log('[ORDINE INSERITO CON SUCCESSO]:', orderData);

      // 1.2 Inserimento Articoli dell'Ordine
      if (orderData && items.length > 0) {
        const isValidUUID = (str: any) =>
          typeof str === 'string' &&
          /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(str);

        const righe = items.map((item: any) => {
          const unitPrice = Number(
            item.prezzo_scontato && item.prezzo_scontato > 0
              ? item.prezzo_scontato
              : (item.prezzo || item.price || 0)
          );
          const itemQty = Number(item.quantity || item.quantita || 1);
          const itemName = item.nome || item.titolo || item.name || 'Articolo';
          const sub = unitPrice * itemQty;

          return {
            ordine_id: orderData.id,
            prodotto_id: isValidUUID(item.id) ? item.id : null,
            nome_prodotto: itemName,
            quantita: itemQty,
            prezzo_unitario: unitPrice,
            prezzo_al_momento: unitPrice,
            subtotale: sub,
          };
        });

        const { error: itemsError } = await supabase
          .from('ordine_articoli')
          .insert(righe);

        if (itemsError) {
          console.error('[ERRORE INSERIMENTO ARTICOLI ORDINE]:', itemsError);
        } else {
          console.log('[ARTICOLI ORDINE INSERITI CON SUCCESSO]:', righe.length);
        }
      }

      // 1.3 Pulisci il carrello ed esegui il redirect solo dopo il successo su Supabase
      clearCart();
      window.location.href = `/conferma?ordine=${orderNumber}&tipo=${orderType}&nome=${encodeURIComponent(nome)}&telefono=${encodeURIComponent(telefono)}&totale=${finalTotal.toFixed(2)}&fascia=${encodeURIComponent(fascia)}&data=${encodeURIComponent(dataRitiro)}`;
    } catch (err: any) {
      console.error('[ECCEZIONE CREAZIONE ORDINE]:', err);
      setErrorMsg(`Errore imprevisto: ${err.message || 'Riprova tra poco.'}`);
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <div className="mb-6">
        <a href="/catalogo" className="text-xs font-bold text-neutral-500 hover:text-neutral-900 mb-2 inline-block">
          ← Torna al Catalogo
        </a>
        <h1 className="text-3xl font-black text-neutral-900">Completa il tuo Ordine</h1>
      </div>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold">
          ⚠️ {errorMsg}
        </div>
      )}
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Modulo Dati e Scelta */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm">
            <h2 className="text-base font-bold mb-4 text-neutral-900">1. Scegli la modalità</h2>
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => setOrderType('ritiro')}
                className={`p-4 rounded-xl border-2 font-bold text-left transition cursor-pointer ${
                  orderType === 'ritiro' ? 'border-amber-500 bg-amber-50/50 text-amber-950 shadow-sm' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                🏪 Ritiro in Negozio
                <span className="block text-xs font-normal text-neutral-500 mt-1">Gratuito • Paga al ritiro</span>
              </button>
              <button
                type="button"
                onClick={() => setOrderType('spedizione')}
                className={`p-4 rounded-xl border-2 font-bold text-left transition cursor-pointer ${
                  orderType === 'spedizione' ? 'border-amber-500 bg-amber-50/50 text-amber-950 shadow-sm' : 'border-neutral-200 hover:border-neutral-300'
                }`}
              >
                📦 Spedizione a Casa
                <span className="block text-xs font-normal text-neutral-500 mt-1">Spedizione (+ € 5.90)</span>
              </button>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm space-y-4">
            <h2 className="text-base font-bold text-neutral-900">2. I tuoi dati</h2>
            
            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Nome e Cognome *</label>
              <input 
                type="text" 
                required
                value={nome} 
                onChange={(e) => setNome(e.target.value)} 
                placeholder="es. Mario Rossi" 
                className="w-full p-3 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Numero di Telefono (per avviso WhatsApp) *</label>
              <input 
                type="tel" 
                required
                value={telefono} 
                onChange={(e) => setTelefono(e.target.value)} 
                placeholder="es. 340 1234567" 
                className="w-full p-3 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-700 mb-1">Email (opzionale)</label>
              <input 
                type="email" 
                value={email} 
                onChange={(e) => setEmail(e.target.value)} 
                placeholder="mario.rossi@email.it" 
                className="w-full p-3 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
              />
            </div>

            {orderType === 'ritiro' ? (
              <div className="space-y-4 pt-2 border-t border-neutral-100">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-neutral-700">
                      📅 Giorno di Ritiro Desiderato *
                    </label>
                    <div className="flex gap-1.5">
                      <button
                        type="button"
                        onClick={() => setDataRitiro(getTodayIso())}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          dataRitiro === getTodayIso()
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        Oggi
                      </button>
                      <button
                        type="button"
                        onClick={() => setDataRitiro(getTomorrowIso())}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition cursor-pointer ${
                          dataRitiro === getTomorrowIso()
                            ? 'bg-amber-500 text-white shadow-xs'
                            : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200'
                        }`}
                      >
                        Domani
                      </button>
                    </div>
                  </div>
                  <input
                    type="date"
                    required
                    min={getTodayIso()}
                    value={dataRitiro}
                    onChange={(e) => setDataRitiro(e.target.value)}
                    className="w-full p-3 rounded-lg border border-neutral-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  />
                  <span className="block text-[11px] text-neutral-500 mt-1">
                    Orario di apertura: Lun-Sab 06:30–12:30 / 15:30–19:30 • Dom 07:00–12:30
                  </span>
                </div>

                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">
                    ⏰ Fascia oraria di ritiro
                  </label>
                  <select 
                    value={fascia} 
                    onChange={(e) => setFascia(e.target.value)}
                    className="w-full p-3 rounded-lg border border-neutral-300 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500 cursor-pointer"
                  >
                    <option value="08:00 - 10:00 (Prima Mattina)">08:00 - 10:00 (Prima Mattina)</option>
                    <option value="10:00 - 12:30 (Metà Mattinata)">10:00 - 12:30 (Metà Mattinata)</option>
                    <option value="16:00 - 18:00 (Pomeriggio)">16:00 - 18:00 (Pomeriggio)</option>
                    <option value="18:00 - 19:30 (Sera)">18:00 - 19:30 (Sera)</option>
                  </select>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-neutral-700 mb-1">Indirizzo di Spedizione Completo *</label>
                  <input 
                    type="text" 
                    required
                    value={indirizzo} 
                    onChange={(e) => setIndirizzo(e.target.value)} 
                    placeholder="Via, Piazza, Numero Civico" 
                    className="w-full p-3 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">Città</label>
                    <input 
                      type="text" 
                      value={citta} 
                      onChange={(e) => setCitta(e.target.value)} 
                      className="w-full p-3 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-neutral-700 mb-1">CAP</label>
                    <input 
                      type="text" 
                      value={cap} 
                      onChange={(e) => setCap(e.target.value)} 
                      className="w-full p-3 rounded-lg border border-neutral-300 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500"
                    />
                  </div>
                </div>
              </div>
            )}

            <button 
              type="button" 
              disabled={isSubmitting}
              onClick={handleConfirmOrder}
              className="w-full py-4 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-bold rounded-xl shadow-md transition cursor-pointer text-sm"
            >
              {isSubmitting 
                ? 'Salvataggio ordine in corso...' 
                : (orderType === 'ritiro' 
                    ? `Conferma Ordine con Ritiro (€ ${finalTotal.toFixed(2)})` 
                    : `Conferma Spedizione (€ ${finalTotal.toFixed(2)})`)}
            </button>
          </div>
        </div>

        {/* Riepilogo Ordine */}
        <div className="bg-white p-6 rounded-2xl border border-neutral-200 shadow-sm h-fit space-y-4">
          <h3 className="font-bold text-base border-b pb-3 text-neutral-900 flex justify-between items-center">
            <span>Riepilogo Carrello</span>
            <span className="text-xs bg-teal-50 text-teal-700 px-2.5 py-1 rounded-full font-extrabold">
              {totalQty} {totalQty === 1 ? 'articolo' : 'articoli'}
            </span>
          </h3>

          {items.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-xs text-neutral-500 mb-3">Nessun articolo selezionato.</p>
              <a href="/catalogo" className="text-xs font-bold text-teal-600 hover:underline">
                Aggiungi prodotti dal catalogo
              </a>
            </div>
          ) : (
            <div className="space-y-3 divide-y divide-neutral-100 max-h-80 overflow-y-auto pr-1">
              {items.map((item: any, idx: number) => {
                const unitPrice = Number(item.prezzo_scontato && item.prezzo_scontato > 0 ? item.prezzo_scontato : (item.prezzo || item.price || 0));
                const itemQty = Number(item.quantita) || 1;
                return (
                  <div key={idx} className="pt-2.5 first:pt-0 flex justify-between items-center text-xs">
                    <div className="min-w-0 pr-2">
                      <p className="font-bold text-neutral-900 truncate">{item.nome || item.title}</p>
                      <p className="text-[11px] text-neutral-500">€ {unitPrice.toFixed(2)} × {itemQty}</p>
                    </div>
                    <span className="font-bold text-neutral-900 shrink-0">
                      € {(unitPrice * itemQty).toFixed(2)}
                    </span>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t pt-3 space-y-1.5 text-xs">
            <div className="flex justify-between text-neutral-600">
              <span>Subtotale articoli</span>
              <span className="font-bold text-neutral-900">€ {subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-neutral-600">
              <span>Consegna</span>
              <span className="font-bold text-neutral-900">
                {orderType === 'ritiro' ? 'Gratuita' : `€ ${shippingCost.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between text-sm font-black text-neutral-900 border-t pt-2 mt-2">
              <span>Totale Ordine</span>
              <span className="text-teal-600 text-lg">€ {finalTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CheckoutPage;
