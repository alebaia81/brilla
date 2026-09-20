import React, { useState } from 'react';
import {
  PayPalScriptProvider,
  PayPalButtons,
  usePayPalScriptReducer,
  type ReactPayPalScriptOptions,
} from '@paypal/react-paypal-js';
import { clearCart } from '../../lib/cart-store';
import { AlertCircle, CheckCircle2, Info, Loader2, RefreshCw, X } from 'lucide-react';

export interface PayPalButtonProps {
  amount: number;
  subtotal?: number;
  shippingCost?: number;
  carrello?: any[];
  cliente?: {
    nome?: string;
    email?: string;
    telefono?: string;
    tipo_ordine?: 'ritiro' | 'spedizione';
    indirizzo?: string;
    citta?: string;
    cap?: string;
    data_ritiro?: string;
    fascia?: string;
    [key: string]: any;
  };
  disabled?: boolean;
  onSuccess?: (orderId: string, paypalOrderId: string) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
}

/**
 * Componente interno per il rendering controllato dei pulsanti PayPal
 * tramite usePayPalScriptReducer
 */
function PayPalButtonsInner({
  amount,
  subtotal,
  shippingCost,
  carrello,
  cliente,
  disabled,
  onSuccess,
  onError,
  onCancel,
  setFeedback,
}: {
  amount: string;
  subtotal?: number;
  shippingCost?: number;
  carrello: any[];
  cliente: Record<string, any>;
  disabled: boolean;
  onSuccess?: (orderId: string, paypalOrderId: string) => void;
  onError?: (error: any) => void;
  onCancel?: () => void;
  setFeedback: React.Dispatch<
    React.SetStateAction<{
      type: 'error' | 'cancel' | 'loading' | 'success' | null;
      message: string | null;
    }>
  >;
}) {
  const [{ isPending, isRejected }, dispatch] = usePayPalScriptReducer();

  if (isPending) {
    return (
      <div className="p-5 rounded-2xl border border-neutral-200 bg-neutral-50/80 flex flex-col items-center justify-center gap-2 text-center text-xs text-neutral-500 min-h-[110px]">
        <Loader2 className="w-5 h-5 text-amber-600 animate-spin" />
        <span>Caricamento dell'ambiente sicuro PayPal...</span>
      </div>
    );
  }

  if (isRejected) {
    return (
      <div className="p-4 rounded-2xl border border-rose-200 bg-rose-50 text-xs text-rose-900 space-y-3">
        <div className="flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Impossibile inizializzare l'SDK di PayPal (Errore 400)</p>
            <p className="text-neutral-700 leading-relaxed">
              Il server di PayPal ha rifiutato la richiesta. Verifica che il{' '}
              <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">
                PUBLIC_PAYPAL_CLIENT_ID
              </code>{' '}
              nel file <code className="bg-rose-100 px-1 py-0.5 rounded font-mono text-[11px]">.env</code> sia un Client ID Sandbox valido associato alla tua Sandbox App di PayPal Developer.
            </p>
          </div>
        </div>

        <div className="pt-2 border-t border-rose-200/60 flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => {
              // Ricarica lo script PayPal
              dispatch({
                type: 0 as any, // DISPATCH_ACTION.LOADING_STATUS
                value: 'pending' as any,
              });
              window.location.reload();
            }}
            className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-medium hover:bg-rose-700 transition flex items-center gap-1.5 cursor-pointer text-xs"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Ricarica pagina
          </button>
        </div>
      </div>
    );
  }

  return (
    <PayPalButtons
      style={{
        layout: 'vertical',
        color: 'gold',
        shape: 'rect',
        label: 'pay',
        borderRadius: 12,
        height: 48,
      }}
      disabled={disabled}
      createOrder={async () => {
        setFeedback({ type: null, message: null });
        try {
          const res = await fetch('/api/paypal/create-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              totale: Number(amount),
              subtotale: subtotal != null ? Number(subtotal) : Number(amount),
              costo_spedizione: shippingCost != null ? Number(shippingCost) : 0,
              tipo_ordine: cliente?.tipo_ordine || 'ritiro',
              carrello: carrello,
              descrizione: 'Ordine online Brilla Cafe',
            }),
          });

          const data: any = await res.json();
          if (!res.ok || !data.id) {
            throw new Error(data.error || "Impossibile inizializzare l'ordine su PayPal.");
          }

          return data.id;
        } catch (err: any) {
          const errorText = err.message || "Errore durante la creazione dell'ordine.";
          setFeedback({ type: 'error', message: errorText });
          if (onError) onError(err);
          throw err;
        }
      }}
      onApprove={async (data) => {
        setFeedback({
          type: 'loading',
          message: 'Conferma e cattura del pagamento in corso...',
        });

        try {
          console.log('[PAYPAL onApprove] Ordine autorizzato da PayPal, avvio cattura:', data.orderID);

          const res = await fetch('/api/paypal/capture-order', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              orderID: data.orderID,
              carrello: carrello,
              cliente: cliente,
              totale: Number(amount),
              subtotale: subtotal != null ? Number(subtotal) : Number(amount),
              costo_spedizione: shippingCost != null ? Number(shippingCost) : 0,
            }),
          });

          let captureData: any = {};
          try {
            captureData = await res.json();
          } catch (jsonErr) {
            console.error('[PAYPAL onApprove] Risposta API non valida o non JSON:', jsonErr);
            throw new Error(`Risposta del server non valida (HTTP ${res.status}). Ricarica per verificare lo stato dell'ordine.`);
          }

          if (!res.ok || !captureData.success) {
            throw new Error(captureData.error || 'Cattura del pagamento fallita o non confermata.');
          }

          console.log('[PAYPAL onApprove] Pagamento confermato e salvato:', captureData);

          // Ricava il codice ordine con priorità: result.codice_ordine || result.id
          const codiceOrdine = 
            captureData.codice_ordine || 
            captureData.codiceOrdine || 
            captureData.numeroOrdine || 
            captureData.numero_ordine || 
            captureData.ordineId || 
            captureData.orderId || 
            captureData.id || 
            data.orderID;

          const orderIdParam = captureData.ordineId || captureData.orderId || captureData.id || data.orderID;
          const nomeParam = encodeURIComponent(cliente.nome || '');
          const telefonoParam = encodeURIComponent(cliente.telefono || '');
          const tipoParam = encodeURIComponent(cliente.tipo_ordine || 'ritiro');
          const dataParam = encodeURIComponent(cliente.data_ritiro || '');
          const fasciaParam = encodeURIComponent(cliente.fascia || '');

          // Salva i dettagli completi in sessionStorage come fallback immediato per /conferma
          try {
            sessionStorage.setItem('brilla_last_order', JSON.stringify({
              id: orderIdParam,
              numero_ordine: codiceOrdine,
              codice_ordine: codiceOrdine,
              numeroOrdine: codiceOrdine,
              codiceOrdine: codiceOrdine,
              cliente_nome: cliente.nome || '',
              cliente_email: cliente.email || '',
              cliente_telefono: cliente.telefono || '',
              tipo_ordine: cliente.tipo_ordine || 'ritiro',
              totale_ordine: Number(amount),
              costo_spedizione: Number(shippingCost || 0),
              data_ritiro_prevista: cliente.data_ritiro || '',
              fascia_ritiro: cliente.fascia || '',
              indirizzo_spedizione: cliente.indirizzo || '',
              citta_spedizione: cliente.citta || '',
              cap_spedizione: cliente.cap || '',
              pagamento_id_paypal: data.orderID,
              stato: 'pagato',
              ordine_articoli: carrello.map((c: any) => ({
                id: c.id || crypto.randomUUID(),
                nome_prodotto: c.nome_prodotto || c.nome || 'Articolo',
                quantita: c.quantita || 1,
                prezzo_unitario: Number(c.prezzo_unitario || c.prezzo || 0),
                subtotale: Number(c.subtotale || (Number(c.prezzo_unitario || c.prezzo || 0) * Number(c.quantita || 1))),
              })),
            }));
          } catch (e) {
            console.warn('[PAYPAL onApprove] Errore salvataggio sessionStorage:', e);
          }

          // Pulisci il carrello contestualmente al redirect
          clearCart();

          if (onSuccess) {
            onSuccess(captureData.ordineId || captureData.orderId, captureData.paypalOrderId);
          }

          // Reindirizzamento esplicito alla rotta /conferma?ordine=... con parametri di supporto
          const confirmUrl = `/conferma?ordine=${encodeURIComponent(codiceOrdine)}&id=${encodeURIComponent(orderIdParam)}&paypal_id=${encodeURIComponent(data.orderID)}&totale=${encodeURIComponent(amount)}&nome=${nomeParam}&telefono=${telefonoParam}&tipo=${tipoParam}&data=${dataParam}&fascia=${fasciaParam}`;

          window.location.href = confirmUrl;
        } catch (err: any) {
          console.error('[PAYPAL onApprove ERROR]:', err);
          const errorText = err.message || 'Errore durante la conferma del pagamento con PayPal.';
          setFeedback({ type: 'error', message: errorText });
          if (onError) onError(err);
          if (typeof window !== 'undefined') {
            window.scrollTo({ top: 0, behavior: 'smooth' });
          }
        }
      }}
      onCancel={() => {
        setFeedback({
          type: 'cancel',
          message: 'Pagamento con PayPal annullato. Nessun addebito effettuato.',
        });
        if (onCancel) onCancel();
      }}
      onError={(err: any) => {
        console.error('[PAYPAL SDK ERROR]:', err);
        setFeedback({
          type: 'error',
          message: 'Si è verificato un errore durante la connessione con PayPal. Riprova tra poco.',
        });
        if (onError) onError(err);
      }}
    />
  );
}

export default function PayPalButton({
  amount,
  subtotal,
  shippingCost,
  carrello = [],
  cliente = {},
  disabled = false,
  onSuccess,
  onError,
  onCancel,
}: PayPalButtonProps) {
  const [feedback, setFeedback] = useState<{
    type: 'error' | 'cancel' | 'loading' | 'success' | null;
    message: string | null;
  }>({ type: null, message: null });

  // 1. Controllo e lettura del Client ID da PUBLIC_PAYPAL_CLIENT_ID
  const clientId = (import.meta.env.PUBLIC_PAYPAL_CLIENT_ID || '').trim();

  // 2. Determinazione dell'ambiente Sandbox vs Production
  const paypalEnv = (import.meta.env.PUBLIC_PAYPAL_ENV || 'sandbox').trim().toLowerCase();
  const isSandbox = paypalEnv === 'sandbox' || (paypalEnv !== 'live' && paypalEnv !== 'production');

  const safeAmount = Math.max(0.01, Number(amount) || 0).toFixed(2);

  // Se clientId è vuoto o non definito, renderizza avviso senza caricare lo script
  if (!clientId) {
    return (
      <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 text-xs flex items-start gap-2.5">
        <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <p className="font-medium">Configurazione PayPal incompleta</p>
          <p className="text-amber-800 mt-0.5">
            Client ID non configurato. Inserisci <code className="font-mono font-semibold">PUBLIC_PAYPAL_CLIENT_ID</code> nel file <code className="font-mono">.env</code> per abilitare i pagamenti.
          </p>
        </div>
      </div>
    );
  }

  if (disabled) {
    return (
      <div className="p-4 rounded-2xl bg-neutral-100 border border-neutral-200 text-center text-xs text-neutral-600 font-medium">
        Compila tutti i campi obbligatori del modulo prima di procedere al pagamento con PayPal.
      </div>
    );
  }

  // 3. Opzioni per PayPalScriptProvider conformi all'ambiente configurato
  const initialOptions: ReactPayPalScriptOptions = {
    clientId: clientId,
    currency: 'EUR',
    intent: 'capture',
    environment: isSandbox ? 'sandbox' : 'production',
    // In ambiente sandbox punta esplicitamente all'endpoint sandbox
    sdkBaseUrl: isSandbox
      ? 'https://www.sandbox.paypal.com/sdk/js'
      : 'https://www.paypal.com/sdk/js',
  };

  return (
    <div className="w-full space-y-3">
      {/* Feedback utente non bloccante */}
      {feedback.message && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-start justify-between gap-3 animate-fade-in ${
            feedback.type === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : feedback.type === 'cancel'
              ? 'bg-amber-50 border-amber-200 text-amber-800'
              : feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
              : 'bg-teal-50 border-teal-200 text-teal-800'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600" />
            ) : (
              <Info className="w-4 h-4 shrink-0 text-amber-600" />
            )}
            <p className="font-medium leading-relaxed">{feedback.message}</p>
          </div>
          <button
            type="button"
            onClick={() => setFeedback({ type: null, message: null })}
            className="text-neutral-400 hover:text-neutral-700 transition shrink-0 p-0.5 cursor-pointer"
            aria-label="Chiudi avviso"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Script Provider con opzioni sandbox/produzione corrette */}
      <PayPalScriptProvider options={initialOptions}>
        <PayPalButtonsInner
          amount={safeAmount}
          subtotal={subtotal}
          shippingCost={shippingCost}
          carrello={carrello}
          cliente={cliente}
          disabled={disabled}
          onSuccess={onSuccess}
          onError={onError}
          onCancel={onCancel}
          setFeedback={setFeedback}
        />
      </PayPalScriptProvider>
    </div>
  );
}
