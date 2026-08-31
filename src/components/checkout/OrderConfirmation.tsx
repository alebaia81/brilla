import React, { useEffect, useState } from 'react';
import { formatPrice } from '../../lib/format';
import { CheckCircle2, Store, Truck, MessageSquare, ArrowRight, Home } from 'lucide-react';

export default function OrderConfirmation() {
  const [orderNumber, setOrderNumber] = useState('ORD-2026-DEMO');
  const [tipo, setTipo] = useState<'ritiro' | 'spedizione'>('ritiro');
  const [nome, setNome] = useState('Cliente');
  const [totale, setTotale] = useState('0.00');
  const [fascia, setFascia] = useState('');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      if (params.get('ordine')) setOrderNumber(params.get('ordine')!);
      if (params.get('tipo') === 'spedizione') setTipo('spedizione');
      if (params.get('nome')) setNome(params.get('nome')!);
      if (params.get('totale')) setTotale(params.get('totale')!);
      if (params.get('fascia')) setFascia(params.get('fascia')!);
    }
  }, []);

  const whatsAppText = encodeURIComponent(
    `Ciao Brilla Cafe! 👋 Ho appena effettuato l'ordine #${orderNumber} a nome ${nome}.`
  );

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-20">
      
      <div className="bg-white rounded-3xl p-8 sm:p-12 border border-brand-dark/10 shadow-xl text-center space-y-6 relative overflow-hidden">
        
        <div className="w-20 h-20 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto shadow-inner animate-bounce">
          <CheckCircle2 className="w-10 h-10" />
        </div>

        <div>
          <span className="px-3 py-1 rounded-full bg-emerald-100 text-emerald-800 text-xs font-bold uppercase tracking-wider inline-block mb-2">
            Ordine Ricevuto con Successo!
          </span>
          <h1 className="text-3xl sm:text-4xl font-black text-brand-dark tracking-tight">
            Grazie per il tuo acquisto, {nome}!
          </h1>
          <p className="text-sm text-brand-dark/70 mt-2">
            Il tuo ordine è stato registrato ed è pronto per essere preparato.
          </p>
        </div>

        {/* Box Dettagli Ordine */}
        <div className="p-6 rounded-2xl bg-brand-cream/60 border border-brand-dark/10 text-left space-y-4 max-w-lg mx-auto text-xs sm:text-sm">
          
          <div className="flex justify-between items-center pb-3 border-b border-brand-dark/10">
            <span className="text-brand-dark/60 font-semibold">Codice Ordine:</span>
            <span className="font-mono font-extrabold text-brand-dark text-base">{orderNumber}</span>
          </div>

          <div className="flex justify-between items-center pb-3 border-b border-brand-dark/10">
            <span className="text-brand-dark/60 font-semibold">Importo Totale:</span>
            <span className="font-extrabold text-brand-amber text-lg">
              {formatPrice(Number(totale))}
            </span>
          </div>

          <div className="flex justify-between items-start pb-3 border-b border-brand-dark/10">
            <span className="text-brand-dark/60 font-semibold">Modalità:</span>
            <span className="font-bold text-brand-dark flex items-center gap-1.5 text-right">
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

          {tipo === 'ritiro' && fascia && (
            <div className="flex justify-between items-start">
              <span className="text-brand-dark/60 font-semibold">Fascia oraria:</span>
              <span className="font-bold text-emerald-900 text-right">{fascia}</span>
            </div>
          )}

        </div>

        {/* Istruzioni pratiche */}
        <div className="p-4 rounded-2xl bg-white border border-brand-dark/10 text-xs text-brand-dark/80 max-w-lg mx-auto leading-relaxed">
          {tipo === 'ritiro' ? (
            <p>
              📍 Ti aspettiamo presso il nostro locale a <strong>Castelnuovo Bocca d'Adda</strong> in Via Umberto I, 35. Potrai saldare l'importo al momento del ritiro in cassa!
            </p>
          ) : (
            <p>
              📦 Il tuo pacco verrà imballato con cura e spedito a breve. Riceverai aggiornamenti sul tracking della spedizione.
            </p>
          )}
        </div>

        {/* Pulsante Contatto WhatsApp */}
        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-4 max-w-md mx-auto">
          
          <a
            href={`https://wa.me/393401234567?text=${whatsAppText}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto px-6 py-3.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-2xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <MessageSquare className="w-4 h-4" />
            <span>Scrivi al Negozio su WhatsApp</span>
          </a>

          <a
            href="/"
            className="w-full sm:w-auto px-6 py-3.5 bg-brand-dark hover:bg-brand-dark/90 text-white text-xs font-bold rounded-2xl transition-all flex items-center justify-center gap-2"
          >
            <Home className="w-4 h-4" />
            <span>Torna alla Home</span>
          </a>

        </div>

      </div>

    </div>
  );
}
