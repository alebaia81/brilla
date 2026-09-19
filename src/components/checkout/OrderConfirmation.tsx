import React, { useEffect, useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { formatPrice } from '../../lib/format';
import { buildWhatsAppLink } from '../../lib/whatsapp';
import { 
  CheckCircle2, 
  Store, 
  Truck, 
  MessageSquare, 
  Printer, 
  Home, 
  QrCode, 
  Share2, 
  Calendar, 
  Clock, 
  MapPin, 
  Loader2, 
  PackageCheck,
  CreditCard
} from 'lucide-react';

interface OrderItem {
  id: string;
  nome_prodotto: string;
  quantita: number;
  prezzo_unitario: number;
  subtotale: number;
}

interface OrderData {
  id: string;
  numero_ordine: string;
  cliente_nome: string;
  cliente_email?: string | null;
  cliente_telefono: string;
  tipo_ordine: 'ritiro' | 'spedizione';
  stato: string;
  data_ritiro_prevista?: string | null;
  fascia_ritiro?: string | null;
  indirizzo_spedizione?: string | null;
  citta_spedizione?: string | null;
  cap_spedizione?: string | null;
  costo_spedizione?: number;
  totale_articoli?: number;
  totale_ordine: number;
  note_cliente?: string | null;
  pagamento_id_paypal?: string | null;
  data_pagamento?: string | null;
  creato_il?: string;
  ordine_articoli?: OrderItem[];
}

export default function OrderConfirmation() {
  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  // Fallback transitorio basato su parametri URL prima o in caso di assenza rete
  const [urlParams, setUrlParams] = useState({
    id: '',
    ordine: '',
    nome: '',
    telefono: '',
    totale: '0.00',
    tipo: 'ritiro' as 'ritiro' | 'spedizione',
    data: '',
    fascia: '',
    paypalId: '',
  });

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const idParam = params.get('id') || params.get('ordine') || params.get('paypal_id') || '';
    const ordineParam = params.get('ordine') || idParam;
    const nomeParam = params.get('nome') || '';
    const telefonoParam = params.get('telefono') || '';
    const totaleParam = params.get('totale') || '0.00';
    const tipoParam = (params.get('tipo') === 'spedizione' ? 'spedizione' : 'ritiro') as 'ritiro' | 'spedizione';
    const dataParam = params.get('data') || '';
    const fasciaParam = params.get('fascia') || '';
    const paypalIdParam = params.get('paypal_id') || '';

    setUrlParams({
      id: idParam,
      ordine: ordineParam,
      nome: nomeParam,
      telefono: telefonoParam,
      totale: totaleParam,
      tipo: tipoParam,
      data: dataParam,
      fascia: fasciaParam,
      paypalId: paypalIdParam,
    });

    if (!idParam) {
      setLoading(false);
      return;
    }

    // Interroga D1 tramite l'API /api/ordini?id=...
    const fetchOrderData = async () => {
      try {
        const res = await fetch(`/api/ordini?id=${encodeURIComponent(idParam)}`);
        if (res.ok) {
          const data = (await res.json()) as OrderData;
          if (data && data.id) {
            setOrder(data);
          }
        }
      } catch (err) {
        console.warn('[ORDER CONFIRMATION] Impossibile recuperare i dettagli da D1, uso parametri URL:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderData();
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Risoluzione dei valori reali (preferenza ai dati estratti dal DB D1)
  const orderNumber = order?.numero_ordine || urlParams.ordine || urlParams.id || 'IN ELABORAZIONE';
  const tipo = (order?.tipo_ordine || urlParams.tipo) as 'ritiro' | 'spedizione';
  const nome = order?.cliente_nome || urlParams.nome || 'Cliente';
  const telefono = order?.cliente_telefono || urlParams.telefono || '';
  const totale = order ? Number(order.totale_ordine).toFixed(2) : Number(urlParams.totale).toFixed(2);
  const dataRitiro = order?.data_ritiro_prevista || urlParams.data || '';
  const fascia = order?.fascia_ritiro || urlParams.fascia || '';
  const isPaid = order?.stato === 'pagato' || Boolean(order?.pagamento_id_paypal) || Boolean(urlParams.paypalId);
  const articoli = order?.ordine_articoli || [];

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Ricevuta Ordine ${orderNumber} - Brilla Cafe`,
          text: `Ordine #${orderNumber} a nome ${nome} presso Brilla Cafe. Totale: € ${totale}${tipo === 'ritiro' ? ` (Ritiro: ${dataRitiro} ore ${fascia})` : ''}`,
          url: window.location.href,
        });
      } catch {
        // Share annullato dall'utente
      }
    } else if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  // Testo promemoria WhatsApp completo
  const rawMessage = 
    `*RICEVUTA ORDINE BRILLA CAFE*\n` +
    `Codice Ordine: *#${orderNumber}*\n` +
    `Intestatario: *${nome}*\n` +
    (tipo === 'ritiro' 
      ? `📅 *Giorno Ritiro:* ${dataRitiro || 'Oggi'}\n⏰ *Fascia Oraria:* ${fascia || 'Mattina'}\n📍 *Punto Ritiro:* Brilla Cafe (Via Umberto I, 35 - Castelnuovo Bocca d'Adda)\n` 
      : `📦 *Modalità:* Spedizione a domicilio (${order?.indirizzo_spedizione || ''}, ${order?.citta_spedizione || ''})\n`) +
    (isPaid ? `💳 *Pagamento:* Saldato con PayPal (Totale € ${totale})\n\n` : `💰 *Totale da Saldare:* € ${totale}\n\n`) +
    `_Conserva questo messaggio per il ritiro o la spedizione!_`;

  const whatsAppPersonalLink = telefono 
    ? buildWhatsAppLink(telefono, rawMessage)
    : `https://wa.me/?text=${encodeURIComponent(rawMessage)}`;

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center space-y-4">
        <Loader2 className="w-8 h-8 text-brand-amber animate-spin mx-auto" />
        <p className="text-sm font-bold text-brand-dark">Caricamento ricevuta e dettagli ordine in corso...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      
      {/* Intestazione di Successo */}
      <div className="text-center space-y-3 mb-8 print:hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider inline-block">
          {isPaid ? 'Pagamento Confermato & Ordine Registrato' : 'Ordine Ricevuto con Successo'}
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-brand-dark tracking-tight">
          Grazie per il tuo ordine, {nome}!
        </h1>
        <p className="text-xs sm:text-sm text-brand-dark/70 max-w-md mx-auto">
          {isPaid 
            ? 'La transazione PayPal è andata a buon fine. Di seguito trovi la tua ricevuta digitale ufficiale.'
            : 'Mostra questo ticket al bancone o salvalo sul tuo smartphone per il ritiro.'}
        </p>
      </div>

      {/* TICKET / RICEVUTA DIGITALE IDENTIFICATIVA */}
      <div className="relative bg-white rounded-3xl border-2 border-brand-dark/15 shadow-xl overflow-hidden print:shadow-none print:border-black print:rounded-none">
        
        {/* Header Ticket */}
        <div className="bg-gradient-to-r from-brand-dark via-stone-900 to-brand-dark text-white p-6 sm:p-7 flex flex-col sm:flex-row items-center justify-between gap-4 border-b border-brand-dark/10">
          <div className="flex items-center gap-3.5 text-center sm:text-left">
            <img 
              src="/logo.jpeg" 
              alt="Brilla Cafe" 
              className="w-14 h-14 rounded-full border-2 border-brand-amber object-cover shadow-sm bg-white" 
            />
            <div>
              <span className="text-[10px] font-bold uppercase tracking-widest text-brand-amber block">
                Ricevuta &amp; Pass Ufficiale
              </span>
              <h2 className="text-lg sm:text-xl font-black tracking-tight text-white">
                Brilla Cafe’
              </h2>
              <p className="text-[11px] text-stone-300">
                Via Umberto I, 35 – Castelnuovo Bocca d’Adda (LO)
              </p>
            </div>
          </div>

          <div className="text-center sm:text-right bg-white/10 px-3.5 py-2 rounded-2xl border border-white/10">
            <span className="text-[10px] uppercase font-bold text-white/70 block">Codice Identificativo</span>
            <span className="font-mono font-black text-sm sm:text-base text-brand-amber block">
              {orderNumber}
            </span>
          </div>
        </div>

        {/* Corpo Ticket */}
        <div className="p-6 sm:p-8 space-y-6">
          
          {/* Sezione QR Code & Istruzione */}
          <div className="flex flex-col sm:flex-row items-center gap-6 p-5 rounded-2xl bg-brand-cream/80 border border-brand-dark/10">
            
            <div className="bg-white p-3 rounded-2xl border border-brand-dark/10 shadow-sm shrink-0">
              <QRCodeSVG 
                value={orderNumber} 
                size={130}
                level="M"
              />
            </div>

            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-amber/20 text-brand-dark text-[11px] font-bold">
                <QrCode className="w-3.5 h-3.5 text-amber-700" />
                <span>Pass Ordine</span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-brand-dark">
                {tipo === 'ritiro' ? 'Mostra questo QR Code in Negozio' : 'Ricevuta Spedizione a Domicilio'}
              </h3>
              <p className="text-xs text-brand-dark/70 leading-relaxed">
                {tipo === 'ritiro' 
                  ? `All'arrivo da Brilla Cafe, mostra questo schermo o comunica il codice ${orderNumber} per ritirare velocemente i tuoi prodotti.`
                  : `Il tuo ordine #${orderNumber} è stato registrato ed è in preparazione per la spedizione con corriere.`}
              </p>
            </div>

          </div>

          {/* Dati Riepilogo Ordine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            
            <div className="p-4 rounded-2xl bg-white border border-brand-dark/10 space-y-1">
              <span className="text-brand-dark/50 font-semibold block text-[11px]">Intestatario Ordine</span>
              <span className="font-extrabold text-brand-dark block text-sm">{nome}</span>
              {telefono && <span className="text-[11px] text-brand-dark/60 block">{telefono}</span>}
            </div>

            <div className="p-4 rounded-2xl bg-white border border-brand-dark/10 space-y-1">
              <span className="text-brand-dark/50 font-semibold block text-[11px]">
                {isPaid ? 'Importo Saldato' : 'Totale da Saldare'}
              </span>
              <div className="flex items-center gap-2">
                <span className="font-black text-brand-amber block text-base sm:text-lg">
                  {formatPrice(Number(totale))}
                </span>
                {isPaid && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold">
                    <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                    Pagato PayPal
                  </span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-brand-dark/10 space-y-1">
              <span className="text-brand-dark/50 font-semibold block text-[11px]">Modalità Consegna</span>
              <span className="font-bold text-brand-dark flex items-center gap-1.5">
                {tipo === 'ritiro' ? (
                  <>
                    <Store className="w-4 h-4 text-emerald-600" />
                    <span>Scegli &amp; Ritira in Negozio</span>
                  </>
                ) : (
                  <>
                    <Truck className="w-4 h-4 text-brand-amber" />
                    <span>Spedizione con Corriere</span>
                  </>
                )}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-brand-dark/10 space-y-1">
              <span className="text-brand-dark/50 font-semibold block text-[11px]">
                {tipo === 'ritiro' ? 'Giorno & Fascia Ritiro' : 'Stato Pagamento'}
              </span>
              {tipo === 'ritiro' ? (
                <div className="font-bold text-emerald-950 space-y-0.5">
                  <div className="flex items-center gap-1">
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>{dataRitiro || 'Oggi'}</span>
                  </div>
                  {fascia && (
                    <div className="flex items-center gap-1 text-[11px] text-brand-dark/70 font-normal">
                      <Clock className="w-3 h-3 text-brand-dark/50" />
                      <span>{fascia}</span>
                    </div>
                  )}
                </div>
              ) : (
                <div className="font-bold text-brand-dark flex items-center gap-1.5">
                  <PackageCheck className="w-4 h-4 text-emerald-600" />
                  <span>{isPaid ? 'Pagato • In Preparazione' : 'In attesa di spedizione'}</span>
                </div>
              )}
            </div>

          </div>

          {/* Dettagli Indirizzo di Spedizione reale */}
          {tipo === 'spedizione' && (order?.indirizzo_spedizione || order?.citta_spedizione) && (
            <div className="p-4 rounded-2xl bg-amber-50/70 border border-amber-200 text-amber-950 text-xs flex items-start gap-2.5">
              <Truck className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Indirizzo di Spedizione:</strong>
                <span>
                  {order.indirizzo_spedizione} – {order.cap_spedizione} {order.citta_spedizione}
                </span>
              </div>
            </div>
          )}

          {/* Indirizzo & Info Negozio per Ritiro */}
          {tipo === 'ritiro' && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Punto di Ritiro:</strong>
                <span>Brilla Cafe – Via Umberto I, 35, 26843 Castelnuovo Bocca d'Adda (LO). Tel: +39 350 020 6743.</span>
              </div>
            </div>
          )}

          {/* Dettaglio Prodotti Acquistati da D1 */}
          {articoli && articoli.length > 0 && (
            <div className="p-4 rounded-2xl bg-stone-50 border border-brand-dark/10 space-y-2">
              <h4 className="text-xs font-bold text-brand-dark flex items-center justify-between border-b border-brand-dark/10 pb-2">
                <span>Dettaglio Prodotti ({articoli.length})</span>
                <span className="text-[11px] font-normal text-brand-dark/60">Registrato su Database D1</span>
              </h4>
              <div className="space-y-1.5 divide-y divide-brand-dark/5 text-xs">
                {articoli.map((item, i) => (
                  <div key={i} className="pt-1.5 first:pt-0 flex items-center justify-between">
                    <span className="text-brand-dark font-medium truncate max-w-[200px] sm:max-w-xs">
                      {item.quantita}× {item.nome_prodotto}
                    </span>
                    <span className="font-bold text-brand-dark shrink-0">
                      {formatPrice(item.subtotale)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>

        {/* Footer Card con linea scontrino */}
        <div className="bg-brand-cream/50 px-6 py-4 border-t border-brand-dark/10 text-center text-[11px] text-brand-dark/60 font-mono">
          ✦ BRILLA SAS • P.IVA 11824030966 • GRAZIE DELLA TUA VISITA ✦
        </div>

      </div>

      {/* HUB AZIONI: SALVA SU WHATSAPP, STAMPA PDF, CONDIVIDI */}
      <div className="mt-8 space-y-4 print:hidden">
        
        <h3 className="text-center text-xs font-bold uppercase tracking-wider text-brand-dark/60">
          Salva o condividi la tua ricevuta
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          
          <a
            href={whatsAppPersonalLink}
            target="_blank"
            rel="noopener noreferrer"
            className="p-4 rounded-2xl bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer text-center"
            title="Invia la ricevuta a te stesso nella tua chat personale WhatsApp"
          >
            <MessageSquare className="w-4 h-4 shrink-0" />
            <span>Salva sul tuo WhatsApp</span>
          </a>

          <button
            type="button"
            onClick={handlePrint}
            className="p-4 rounded-2xl bg-brand-dark hover:bg-black text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-brand-amber" />
            <span>Stampa / Salva PDF</span>
          </button>

          <button
            type="button"
            onClick={handleShare}
            className="p-3.5 rounded-2xl bg-white hover:bg-brand-cream border border-brand-dark/15 text-brand-dark text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-brand-dark/70" />
            <span>{copied ? '✓ Link Copiato!' : 'Condividi Ricevuta'}</span>
          </button>

          <a
            href="/"
            className="p-3.5 rounded-2xl bg-white hover:bg-brand-cream border border-brand-dark/15 text-brand-dark text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-brand-dark/70" />
            <span>Torna alla Home</span>
          </a>

        </div>

        <p className="text-center text-[11px] text-brand-dark/60 pt-2">
          Hai bisogno di assistenza sull'ordine?{' '}
          <a
            href={`https://wa.me/393500206743?text=${encodeURIComponent(`Ciao Brilla Cafe! 👋 Ho una domanda sull'ordine #${orderNumber}`)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="font-bold text-emerald-700 hover:underline inline-flex items-center gap-1"
          >
            Scrivi a Brilla Cafe
          </a>
        </p>

      </div>

    </div>
  );
}
