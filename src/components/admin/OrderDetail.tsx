import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate } from '../../lib/format';
import { buildWhatsAppLink, generateStatusMessage } from '../../lib/whatsapp';
import { 
  ArrowLeft, 
  MessageSquare, 
  Store, 
  Truck, 
  CheckCircle2, 
  Clock, 
  PackageCheck,
  User,
  Phone,
  Mail,
  MapPin
} from 'lucide-react';

export interface Order {
  id: number;
  numero_ordine: string;
  cliente_nome: string;
  cliente_email: string;
  cliente_telefono: string;
  tipo_ordine: 'spedizione' | 'ritiro';
  stato: 'in_sospeso' | 'pagato' | 'in_allestimento' | 'pronto' | 'completato' | 'annullato';
  data_ritiro_prevista?: string | null;
  fascia_ritiro?: string | null;
  indirizzo_spedizione?: string | null;
  citta_spedizione?: string | null;
  cap_spedizione?: string | null;
  costo_spedizione: number;
  totale_articoli: number;
  totale_ordine: number;
  note_cliente?: string | null;
  pagamento_id_paypal?: string | null;
  created_at: string;
}

interface OrderDetailProps {
  order: Order;
  onBack: () => void;
  onOrderUpdated: () => void;
}

export default function OrderDetail({ order, onBack, onOrderUpdated }: OrderDetailProps) {
  const [items, setItems] = useState<any[]>([]);
  const [currentStatus, setCurrentStatus] = useState(order.stato);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    async function loadItems() {
      try {
        const { data } = await supabase
          .from('ordine_articoli')
          .select('*')
          .eq('ordine_id', order.id);

        if (data) setItems(data);
      } catch (err) {
        console.error('Errore nel caricamento degli articoli dell\'ordine:', err);
      }
    }

    loadItems();
  }, [order.id]);

  const handleStatusChange = async (newStatus: any) => {
    setUpdating(true);
    try {
      const { error } = await supabase
        .from('ordini')
        .update({ stato: newStatus })
        .eq('id', order.id);

      if (error) throw error;
      setCurrentStatus(newStatus);
      onOrderUpdated();
    } catch (err: any) {
      alert('Errore aggiornamento stato: ' + err.message);
    } finally {
      setUpdating(false);
    }
  };

  // Genera URL WhatsApp per notifica cliente
  const whatsAppUrl = buildWhatsAppLink(
    order.cliente_telefono,
    generateStatusMessage(order, currentStatus)
  );

  return (
    <div className="space-y-6">
      
      {/* Header Dettaglio */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-brand-dark/10 shadow-sm">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="p-2.5 rounded-xl bg-brand-cream hover:bg-brand-dark hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] uppercase font-bold text-brand-dark/50 tracking-wider">
              Dettaglio Ordine
            </span>
            <h2 className="text-xl font-extrabold text-brand-dark font-mono">
              {order.numero_ordine}
            </h2>
          </div>
        </div>

        {/* Notifica WhatsApp Diretta */}
        <a
          href={whatsAppUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="px-5 py-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 self-start sm:self-auto"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Apri Chat WhatsApp Cliente</span>
        </a>
      </div>

      {/* Contenuto a 2 Colonne */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Colonna Sinistra: Articoli e Cambio Stato */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* Gestione Stato */}
          <div className="bg-white rounded-3xl p-6 border border-brand-dark/10 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-brand-dark uppercase tracking-wider">
              Stato di Avanzamento
            </h3>
            
            <div className="flex flex-wrap gap-2">
              {[
                { id: 'in_sospeso', label: 'In Sospeso', color: 'bg-amber-100 text-amber-800' },
                { id: 'pagato', label: 'Pagato (PayPal)', color: 'bg-blue-100 text-blue-800' },
                { id: 'in_allestimento', label: 'In Allestimento', color: 'bg-indigo-100 text-indigo-800' },
                { id: 'pronto', label: 'Pronto per il Ritiro', color: 'bg-emerald-100 text-emerald-800' },
                { id: 'spedito', label: 'Spedito con Corriere', color: 'bg-purple-100 text-purple-800' },
                { id: 'completato', label: 'Completato / Consegnato', color: 'bg-gray-100 text-gray-800' },
                { id: 'annullato', label: 'Annullato', color: 'bg-rose-100 text-rose-800' },
              ].map((st) => (
                <button
                  key={st.id}
                  type="button"
                  disabled={updating}
                  onClick={() => handleStatusChange(st.id)}
                  className={`px-3.5 py-2 rounded-xl text-xs font-bold transition-all ${
                    currentStatus === st.id
                      ? `${st.color} ring-2 ring-brand-dark shadow-sm`
                      : 'bg-brand-cream/60 text-brand-dark/60 hover:text-brand-dark hover:bg-brand-cream'
                  }`}
                >
                  {st.label}
                </button>
              ))}
            </div>
          </div>

          {/* Tabella Articoli Ordinati */}
          <div className="bg-white rounded-3xl p-6 border border-brand-dark/10 shadow-sm space-y-4">
            <h3 className="text-sm font-extrabold text-brand-dark uppercase tracking-wider">
              Articoli Inclusi ({items.length})
            </h3>

            {items.length === 0 ? (
              <p className="text-xs text-brand-dark/50 py-4 text-center">
                Caricamento articoli o ordine senza righe registrate.
              </p>
            ) : (
              <div className="divide-y divide-brand-dark/5 text-xs">
                {items.map((it) => {
                  const price = Number(it.prezzo_unitario ?? it.prezzo_al_momento ?? 0);
                  const qty = Number(it.quantita ?? 1);
                  const lineTotal = it.subtotale != null ? Number(it.subtotale) : (price * qty);

                  return (
                    <div key={it.id} className="py-3 flex justify-between items-center">
                      <div>
                        <span className="font-bold text-brand-dark block">{it.nome_prodotto}</span>
                        <span className="text-[10px] text-brand-dark/50">
                          {qty} × {formatPrice(price)}
                        </span>
                      </div>
                      <span className="font-bold text-brand-dark">
                        {formatPrice(lineTotal)}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

        </div>

        {/* Colonna Destra: Info Cliente e Consegna */}
        <aside className="lg:col-span-4 space-y-6">
          
          <div className="bg-white rounded-3xl p-6 border border-brand-dark/10 shadow-sm space-y-4 text-xs">
            <h3 className="text-sm font-extrabold text-brand-dark uppercase tracking-wider pb-3 border-b border-brand-dark/10">
              Dati del Cliente
            </h3>

            <div className="space-y-3">
              <div className="flex items-center gap-2.5 text-brand-dark">
                <User className="w-4 h-4 text-brand-amber flex-shrink-0" />
                <span className="font-bold">{order.cliente_nome}</span>
              </div>

              <div className="flex items-center gap-2.5 text-brand-dark/80">
                <Phone className="w-4 h-4 text-brand-amber flex-shrink-0" />
                <a href={`tel:${order.cliente_telefono}`} className="hover:underline">
                  {order.cliente_telefono}
                </a>
              </div>

              <div className="flex items-center gap-2.5 text-brand-dark/80">
                <Mail className="w-4 h-4 text-brand-amber flex-shrink-0" />
                <a href={`mailto:${order.cliente_email}`} className="hover:underline truncate">
                  {order.cliente_email}
                </a>
              </div>
            </div>

            {/* Modalità Ricezione */}
            <div className="pt-4 border-t border-brand-dark/10 space-y-2">
              <span className="font-bold text-brand-dark block uppercase tracking-wider text-[10px]">
                Modalità Ricezione
              </span>

              {order.tipo_ordine === 'ritiro' ? (
                <div className="p-3 rounded-xl bg-emerald-50 text-emerald-900 leading-tight space-y-1">
                  <div className="font-bold flex items-center gap-1.5">
                    <Store className="w-3.5 h-3.5 text-emerald-700" />
                    <span>Ritiro in Negozio</span>
                  </div>
                  {order.fascia_ritiro && (
                    <div className="text-[11px]">Fascia: {order.fascia_ritiro}</div>
                  )}
                  {order.data_ritiro_prevista && (
                    <div className="text-[11px]">Data: {order.data_ritiro_prevista}</div>
                  )}
                </div>
              ) : (
                <div className="p-3 rounded-xl bg-brand-cream/60 text-brand-dark leading-tight space-y-1">
                  <div className="font-bold flex items-center gap-1.5 text-brand-amber">
                    <Truck className="w-3.5 h-3.5" />
                    <span>Spedizione con Corriere</span>
                  </div>
                  <div className="text-[11px] text-brand-dark/80">
                    {order.indirizzo_spedizione}, {order.cap_spedizione} {order.citta_spedizione}
                  </div>
                </div>
              )}
            </div>

            {/* Note cliente */}
            {order.note_cliente && (
              <div className="pt-3 border-t border-brand-dark/10">
                <span className="text-[10px] font-bold text-brand-dark/50 uppercase block mb-1">
                  Note del Cliente
                </span>
                <p className="text-xs text-brand-dark/70 bg-brand-cream/40 p-2.5 rounded-xl">
                  {order.note_cliente}
                </p>
              </div>
            )}

            {/* Totale */}
            <div className="pt-4 border-t border-brand-dark/10 flex justify-between items-baseline">
              <span className="font-extrabold text-brand-dark text-sm">Totale Ordine:</span>
              <span className="text-xl font-black text-brand-amber">
                {formatPrice(order.totale_ordine)}
              </span>
            </div>

          </div>

        </aside>

      </div>

    </div>
  );
}
