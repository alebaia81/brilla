import React from 'react';
import { PayPalScriptProvider, PayPalButtons } from '@paypal/react-paypal-js';

interface PayPalButtonProps {
  amount: number;
  onSuccess: (orderId: string) => void;
  onError: (error: any) => void;
  disabled?: boolean;
}

export default function PayPalButton({ amount, onSuccess, onError, disabled = false }: PayPalButtonProps) {
  const clientId = (typeof window !== 'undefined' && (window as any).PUBLIC_PAYPAL_CLIENT_ID) 
    || import.meta.env.PUBLIC_PAYPAL_CLIENT_ID 
    || 'test';

  if (disabled) {
    return (
      <div className="p-4 rounded-2xl bg-brand-dark/5 border border-brand-dark/10 text-center text-xs text-brand-dark/60">
        Compila tutti i campi obbligatori di spedizione prima di procedere con PayPal.
      </div>
    );
  }

  return (
    <div className="w-full">
      <PayPalScriptProvider
        options={{
          clientId: clientId,
          currency: 'EUR',
          intent: 'capture',
        }}
      >
        <PayPalButtons
          style={{
            layout: 'vertical',
            color: 'gold',
            shape: 'rect',
            label: 'pay',
            borderRadius: 16,
            height: 48,
          }}
          createOrder={(data, actions) => {
            return actions.order.create({
              intent: 'CAPTURE',
              purchase_units: [
                {
                  amount: {
                    currency_code: 'EUR',
                    value: amount.toFixed(2),
                  },
                  description: 'Ordine online Brilla Cafe (Castelnuovo Bocca d\'Adda)',
                },
              ],
            });
          }}
          onApprove={async (data, actions) => {
            try {
              if (actions.order) {
                const details = await actions.order.capture();
                onSuccess(details.id || data.orderID);
              } else {
                onSuccess(data.orderID);
              }
            } catch (err) {
              onError(err);
            }
          }}
          onError={(err) => {
            console.error('Errore durante il pagamento PayPal:', err);
            onError(err);
          }}
        />
      </PayPalScriptProvider>
    </div>
  );
}
