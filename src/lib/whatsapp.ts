/**
 * Utility per generazione deep-link diretti WhatsApp (wa.me)
 * Senza API esterne, 100% compliant con privacy e hosting statico.
 */

export interface OrderDataForWhatsApp {
  numero_ordine: string;
  cliente_nome: string;
  cliente_telefono: string;
  tipo_ordine: 'spedizione' | 'ritiro';
  totale_ordine: number;
  fascia_ritiro?: string | null;
  data_ritiro_prevista?: string | null;
  stato?: string;
}

/**
 * Pulisce e formatta il numero di telefono per il formato internazionale WhatsApp (es. 393401234567).
 */
export function formatPhoneForWhatsApp(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  if (digits.startsWith('39')) {
    return digits;
  }
  if (digits.startsWith('0039')) {
    return digits.substring(2);
  }
  if (digits.length === 10 && (digits.startsWith('3') || digits.startsWith('0'))) {
    return `39${digits}`;
  }
  return digits;
}

/**
 * Crea un link wa.me pronto per l'amministratore con testo pre-compilato.
 */
export function buildWhatsAppLink(phone: string, text: string): string {
  const cleanNumber = formatPhoneForWhatsApp(phone);
  const encodedText = encodeURIComponent(text);
  return `https://wa.me/${cleanNumber}?text=${encodedText}`;
}

/**
 * Genera il messaggio WhatsApp di notifica per il cliente in base allo stato dell'ordine.
 */
export function generateStatusMessage(order: OrderDataForWhatsApp, newStatus: string): string {
  const isPickup = order.tipo_ordine === 'ritiro';

  switch (newStatus) {
    case 'in_allestimento':
      return `Ciao ${order.cliente_nome}! 👋\nAbbiamo preso in carico il tuo ordine *#${order.numero_ordine}* presso *Brilla Cafe*.\nLo stiamo preparando per te! Ti avviseremo appena sarà pronto.`;

    case 'pronto':
      if (isPickup) {
        let pickupDetails = '';
        if (order.data_ritiro_prevista && order.fascia_ritiro) {
          pickupDetails = ` (previsto per il ${order.data_ritiro_prevista}, fascia: ${order.fascia_ritiro})`;
        } else if (order.data_ritiro_prevista) {
          pickupDetails = ` (previsto per il ${order.data_ritiro_prevista})`;
        } else if (order.fascia_ritiro) {
          pickupDetails = ` (fascia oraria: ${order.fascia_ritiro})`;
        }
        return `Ciao ${order.cliente_nome}! 🎉\nIl tuo ordine *#${order.numero_ordine}* è pronto per il ritiro presso *Brilla Cafe* in Via Umberto I, 35 a Castelnuovo Bocca d'Adda${pickupDetails}.\nTotale da saldare in cassa: *€ ${order.totale_ordine.toFixed(2)}*.\nTi aspettiamo! ☕📚`;
      } else {
        return `Ciao ${order.cliente_nome}! 📦\nIl tuo ordine *#${order.numero_ordine}* è pronto e imballato per la spedizione! Riceverai il codice di tracciamento a breve.`;
      }

    case 'spedito':
      return `Ciao ${order.cliente_nome}! 🚚\nIl tuo ordine *#${order.numero_ordine}* è stato affidato al corriere espresso. Grazie per aver scelto *Brilla Cafe*!`;

    case 'completato':
      return `Grazie mille ${order.cliente_nome} per il tuo acquisto presso *Brilla Cafe*! 🙏\nSperiamo di rivederti presto a trovarci o sul nostro shop online. Buona giornata! ✨`;

    case 'annullato':
      return `Ciao ${order.cliente_nome},\nti confermiamo che il tuo ordine *#${order.numero_ordine}* presso *Brilla Cafe* è stato annullato. Per qualsiasi dubbio non esitare a scriverci.`;

    default:
      return `Ciao ${order.cliente_nome},\naggiornamento per il tuo ordine *#${order.numero_ordine}* presso *Brilla Cafe*. Totale: € ${order.totale_ordine.toFixed(2)}.`;
  }
}
