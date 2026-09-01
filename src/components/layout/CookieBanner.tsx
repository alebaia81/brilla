import React, { useEffect, useState } from 'react';
import { Cookie, X } from 'lucide-react';

const CONSENT_KEY = 'brilla_cookie_consent';

export default function CookieBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const consented = localStorage.getItem(CONSENT_KEY);
      if (!consented) {
        // Mostra il banner dopo 1 secondo per fluidità visiva
        const timer = setTimeout(() => setVisible(true), 800);
        return () => clearTimeout(timer);
      }
    }
  }, []);

  const handleAccept = () => {
    try {
      localStorage.setItem(CONSENT_KEY, 'accepted_' + Date.now());
    } catch (e) {}
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      role="region"
      aria-label="Informativa sui cookie"
      className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 animate-fadeIn"
    >
      <div className="bg-brand-dark text-white p-5 rounded-3xl shadow-2xl border border-white/10 flex flex-col gap-3.5 backdrop-blur-md">
        
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2 text-brand-amber font-bold text-xs uppercase tracking-wider">
            <Cookie className="w-4 h-4" />
            <span>Cookie Tecnici &amp; Privacy</span>
          </div>
          <button
            type="button"
            onClick={handleAccept}
            className="text-white/40 hover:text-white transition-colors p-1"
            aria-label="Chiudi avviso cookie"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <p className="text-xs text-white/80 leading-relaxed">
          Utilizziamo esclusivamente <strong>cookie tecnici necessari</strong> per il corretto funzionamento del sito e per memorizzare i prodotti nel tuo carrello. Nessun tracciamento pubblicitario o profilazione.
        </p>

        <div className="flex items-center justify-between gap-3 pt-1">
          <a
            href="/cookie"
            className="text-[11px] text-white/60 hover:text-brand-amber underline transition-colors"
          >
            Leggi la Cookie Policy
          </a>

          <button
            type="button"
            onClick={handleAccept}
            className="px-4 py-2 bg-brand-amber hover:bg-brand-amber/90 text-white text-xs font-bold rounded-xl shadow-md transition-all active:scale-95"
          >
            Ho capito
          </button>
        </div>

      </div>
    </div>
  );
}
