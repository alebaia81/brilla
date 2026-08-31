import React, { useEffect, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { formatPrice, formatDate } from '../../lib/format';
import OrderDetail, { type Order } from './OrderDetail';
import { Store, Truck, Search, Eye, Filter, RefreshCw } from 'lucide-react';

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('ordini')
        .select('*')
        .order('created_at', { ascending: false });

      if (!error && data) {
        setOrders(data as Order[]);
      }
    } catch (err) {
      console.error('Errore nel caricamento ordini:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, []);

  if (selectedOrder) {
    return (
      <OrderDetail
        order={selectedOrder}
        onBack={() => setSelectedOrder(null)}
        onOrderUpdated={() => {
          loadOrders();
        }}
      />
    );
  }

  const filteredOrders = orders.filter((ord) => {
    if (statusFilter !== 'all' && ord.stato !== statusFilter) {
      return false;
    }
    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      const matchNum = ord.numero_ordine?.toLowerCase().includes(q);
      const matchClient = ord.cliente_nome?.toLowerCase().includes(q);
      const matchPhone = ord.cliente_telefono?.includes(q);
      if (!matchNum && !matchClient && !matchPhone) return false;
    }
    return true;
  });

  const getStatusBadge = (stato: string) => {
    switch (stato) {
      case 'in_sospeso':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800">In Sospeso</span>;
      case 'pagato':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800">Pagato PayPal</span>;
      case 'in_allestimento':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-100 text-indigo-800">In Allestimento</span>;
      case 'pronto':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">Pronto per il Ritiro</span>;
      case 'spedito':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-purple-100 text-purple-800">Spedito</span>;
      case 'completato':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">Completato</span>;
      case 'annullato':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-rose-100 text-rose-800">Annullato</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gray-100 text-gray-800">{stato}</span>;
    }
  };

  return (
    <div className="space-y-6">
      
      {/* Header & Filtri */}
      <div className="bg-white p-6 rounded-3xl border border-brand-dark/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-brand-dark">Gestione Ordini Clienti</h2>
          <p className="text-xs text-brand-dark/60 mt-0.5">
            {orders.length} ordini registrati. Clicca su un ordine per vedere i dettagli e inviare il messaggio WhatsApp.
          </p>
        </div>

        <button
          type="button"
          onClick={loadOrders}
          className="p-2.5 rounded-xl bg-brand-cream hover:bg-brand-dark hover:text-white transition-colors self-start sm:self-auto"
          title="Ricarica ordini"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {/* Controlli Filtri & Search */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Cerca per codice ordine, nome cliente o cellulare..."
            className="w-full pl-10 pr-4 py-3 bg-white border border-brand-dark/10 rounded-2xl text-xs focus:outline-none focus:ring-2 focus:ring-brand-amber shadow-2xs"
          />
          <Search className="w-4 h-4 text-brand-dark/40 absolute left-3.5 top-3.5" />
        </div>

        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="bg-white px-4 py-3 border border-brand-dark/10 rounded-2xl text-xs font-bold focus:outline-none focus:ring-2 focus:ring-brand-amber shadow-2xs cursor-pointer"
        >
          <option value="all">Tutti gli Stati</option>
          <option value="in_sospeso">In Sospeso (Da preparare)</option>
          <option value="pagato">Pagati (PayPal)</option>
          <option value="in_allestimento">In Allestimento</option>
          <option value="pronto">Pronti per il Ritiro</option>
          <option value="spedito">Spediti</option>
          <option value="completato">Completati</option>
          <option value="annullato">Annullati</option>
        </select>
      </div>

      {/* Tabella Ordini */}
      <div className="bg-white rounded-3xl border border-brand-dark/10 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            
            <thead className="bg-brand-cream/60 border-b border-brand-dark/10 text-brand-dark uppercase tracking-wider font-extrabold text-[10px]">
              <tr>
                <th className="py-3.5 px-4">Codice &amp; Data</th>
                <th className="py-3.5 px-4">Cliente</th>
                <th className="py-3.5 px-4">Modalità</th>
                <th className="py-3.5 px-4">Totale</th>
                <th className="py-3.5 px-4">Stato</th>
                <th className="py-3.5 px-4 text-right">Azione</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-brand-dark/5">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-brand-dark/50">
                    Nessun ordine trovato con i criteri selezionati.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((ord) => (
                  <tr
                    key={ord.id}
                    onClick={() => setSelectedOrder(ord)}
                    className="hover:bg-brand-cream/30 transition-colors cursor-pointer"
                  >
                    
                    <td className="py-3.5 px-4">
                      <span className="font-mono font-bold text-brand-dark block">{ord.numero_ordine}</span>
                      <span className="text-[10px] text-brand-dark/50">{formatDate(ord.created_at)}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="font-bold text-brand-dark block">{ord.cliente_nome}</span>
                      <span className="text-[10px] text-brand-dark/50">{ord.cliente_telefono}</span>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-flex items-center gap-1 font-semibold text-brand-dark">
                        {ord.tipo_ordine === 'ritiro' ? (
                          <>
                            <Store className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Scegli &amp; Ritira</span>
                          </>
                        ) : (
                          <>
                            <Truck className="w-3.5 h-3.5 text-brand-amber" />
                            <span>Spedizione</span>
                          </>
                        )}
                      </span>
                    </td>

                    <td className="py-3.5 px-4 font-black text-brand-dark">
                      {formatPrice(ord.totale_ordine)}
                    </td>

                    <td className="py-3.5 px-4">
                      {getStatusBadge(ord.stato)}
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedOrder(ord);
                        }}
                        className="px-3 py-1.5 rounded-xl bg-brand-dark text-white hover:bg-brand-amber transition-colors font-bold text-[11px] inline-flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" />
                        <span>Gestisci</span>
                      </button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>

    </div>
  );
}
