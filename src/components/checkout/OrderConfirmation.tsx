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
  Sparkles,
  Share2,
  Calendar,
  Clock,
  MapPin,
  FileCheck
} from 'lucide-react';

export default function OrderConfirmation() {
  const [orderNumber, setOrderNumber] = useState('ORD-2026-DEMO');
  const [tipo, setTipo] = useState<'ritiro' | 'spedizione'>('ritiro');
  const [nome, setNome] = useState('Cliente');
  const [telefono, setTelefono] = useState('');
  const [totale, setTotale] = useState('0.00');
  const [fascia, setFascia] = useState('');
  const [dataRitiro, setDataRitiro] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('ordine')) setOrderNumber(params.get('ordine')!);
      if (params.get('tipo') === 'spedizione') setTipo('spedizione');
      if (params.get('nome')) setNome(params.get('nome')!);
      if (params.get('telefono')) setTelefono(params.get('telefono')!);
      if (params.get('totale')) setTotale(params.get('totale')!);
      if (params.get('fascia')) setFascia(params.get('fascia')!);
      if (params.get('data')) setDataRitiro(params.get('data')!);
    }
  }, []);

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  const handleShare = async () => {
    if (typeof navigator !== 'undefined' && navigator.share) {
      try {
        await navigator.share({
          title: `Ricevuta Ordine ${orderNumber} - Brilla Cafe`,
          text: `Ordine #${orderNumber} a nome ${nome} presso Brilla Cafe. Totale: € ${totale}${tipo === 'ritiro' ? ` (Ritiro: ${dataRitiro} ore ${fascia})` : ''}`,
          url: window.location.href,
        });
      } catch (err) {
        // Share annullato dall'utente
      }
    } else {
      // Fallback: copia link o testo negli appunti
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
      : `📦 *Modalità:* Spedizione a domicilio\n`) +
    `💰 *Totale da Saldare:* € ${Number(totale).toFixed(2)}\n\n` +
    `_Conserva questo messaggio per il ritiro in cassa!_`;

  // Link diretto wa.me con il numero di telefono del cliente (apre la chat con se stessa)
  const whatsAppPersonalLink = telefono 
    ? buildWhatsAppLink(telefono, rawMessage)
    : `https://wa.me/?text=${encodeURIComponent(rawMessage)}`;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-16">
      
      {/* Intestazione di Successo */}
      <div className="text-center space-y-3 mb-8 print:hidden">
        <div className="w-16 h-16 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
          <CheckCircle2 className="w-8 h-8" />
        </div>
        <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider inline-block">
          Ordine Ricevuto con Successo!
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-brand-dark tracking-tight">
          Grazie per il tuo ordine, {nome}!
        </h1>
        <p className="text-xs sm:text-sm text-brand-dark/70 max-w-md mx-auto">
          Di seguito trovi il tuo <strong className="text-brand-dark">Ticket di Ritiro &amp; Ricevuta Digitale</strong>. Mostralo al bancone o salvalo per averlo sempre a portata di mano.
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
                includeMargin={false}
              />
            </div>

            <div className="text-center sm:text-left space-y-1.5 flex-1">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-brand-amber/20 text-brand-dark text-[11px] font-bold">
                <QrCode className="w-3.5 h-3.5 text-amber-700" />
                <span>Pass per il Bancone</span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-brand-dark">
                Mostra questo QR Code in Negozio
              </h3>
              <p className="text-xs text-brand-dark/70 leading-relaxed">
                All'arrivo da Brilla Cafe, mostra questo schermo oppure comunica il codice <strong className="font-mono text-brand-dark">{orderNumber}</strong> per ritirare e saldare velocemente il tuo acquisto.
              </p>
            </div>

          </div>

          {/* Dati Riepilogo Ordine */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm">
            
            <div className="p-4 rounded-2xl bg-white border border-brand-dark/10 space-y-1">
              <span className="text-brand-dark/50 font-semibold block text-[11px]">Intestatario Ordine</span>
              <span className="font-extrabold text-brand-dark block text-sm">{nome}</span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-brand-dark/10 space-y-1">
              <span className="text-brand-dark/50 font-semibold block text-[11px]">Totale da Saldare</span>
              <span className="font-black text-brand-amber block text-base sm:text-lg">
                {formatPrice(Number(totale))}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white border border-brand-dark/10 space-y-1">
              <span className="text-brand-dark/50 font-semibold block text-[11px]">Modalità Scelta</span>
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
                {tipo === 'ritiro' ? 'Giorno & Fascia Ritiro' : 'Stato'}
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
                <span className="font-bold text-brand-dark">In preparazione per la spedizione</span>
              )}
            </div>

          </div>

          {/* Indirizzo & Info Negozio */}
          {tipo === 'ritiro' && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 border border-emerald-200 text-emerald-950 text-xs flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-emerald-700 shrink-0 mt-0.5" />
              <div>
                <strong className="block font-bold">Punto di Ritiro:</strong>
                <span>Brilla Cafe – Via Umberto I, 35, 26843 Castelnuovo Bocca d'Adda (LO). Tel: +39 350 020 6743.</span>
              </div>
            </div>
          )}

        </div>

        {/* Footer Card con linea scontrino */}
        <div className="bg-brand-cream/50 px-6 py-4 border-t border-brand-dark/10 text-center text-[11px] text-brand-dark/60 font-mono">
          ✦ BRILLA SAS • P.IVA 11824030966 • GRAZIE DELLA TUA VISITA ✦
        </div>

      </div>

      {/* HUB AZIONI: SALVA SU WHATSAPP, STAMPA PDF, CONDIVIDI (Nascosto in fase di stampa) */}
      <div className="mt-8 space-y-4 print:hidden">
        
        <h3 className="text-center text-xs font-bold uppercase tracking-wider text-brand-dark/60">
          Salva o condividi la tua ricevuta
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-w-xl mx-auto">
          
          {/* 1. Salva Promemoria nella chat personale WhatsApp tramite wa.me/{telefonoCliente} */}
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

          {/* 2. Stampa o Salva PDF */}
          <button
            type="button"
            onClick={handlePrint}
            className="p-4 rounded-2xl bg-brand-dark hover:bg-black text-white text-xs font-extrabold shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Printer className="w-4 h-4 text-brand-amber" />
            <span>Stampa / Salva PDF</span>
          </button>

          {/* 3. Condividi / Copia Link */}
          <button
            type="button"
            onClick={handleShare}
            className="p-3.5 rounded-2xl bg-white hover:bg-brand-cream border border-brand-dark/15 text-brand-dark text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Share2 className="w-4 h-4 text-brand-dark/70" />
            <span>{copied ? '✓ Link Copiato!' : 'Condividi Ricevuta'}</span>
          </button>

          {/* 4. Torna alla Home */}
          <a
            href="/"
            className="p-3.5 rounded-2xl bg-white hover:bg-brand-cream border border-brand-dark/15 text-brand-dark text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 text-brand-dark/70" />
            <span>Torna alla Home</span>
          </a>

        </div>

        {/* Link di contatto diretto con il negozio */}
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
