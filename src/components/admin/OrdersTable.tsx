import React, { useEffect, useState, useRef } from 'react';
import { formatPrice, formatDate } from '../../lib/format';
import OrderDetail, { type Order } from './OrderDetail';
import { Store, Truck, Search, Eye, RefreshCw, Bell, X, Sparkles, ArrowRight, Volume2, VolumeX } from 'lucide-react';

// Generatore di suono notifica leggero e compatibile tramite Web Audio API nativa
function playNotificationChime() {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    if (ctx.state === 'suspended') {
      ctx.resume().catch(() => {});
    }
    const now = ctx.currentTime;

    // Nota 1 (D5 - 587.33 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0, now);
    gain1.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Nota 2 (A5 - 880 Hz, brillante e squillante)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.12);
    gain2.gain.setValueAtTime(0, now + 0.12);
    gain2.gain.linearRampToValueAtTime(0.35, now + 0.15);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.12);
    osc2.stop(now + 0.45);
  } catch (e) {
    console.debug('Audio notification not allowed or unsupported:', e);
  }
}

export default function OrdersTable() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newOrderBanner, setNewOrderBanner] = useState<Order | null>(null);
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('brilla_admin_sound') !== 'false';
    }
    return true;
  });

  const lastKnownIdRef = useRef<string | number | null>(null);

  const toggleSound = () => {
    const next = !soundEnabled;
    setSoundEnabled(next);
    if (typeof window !== 'undefined') {
      localStorage.setItem('brilla_admin_sound', String(next));
    }
    if (next) {
      playNotificationChime();
    }
  };

  const loadOrders = async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await fetch('/api/ordini');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          if (data.length > 0) {
            lastKnownIdRef.current = data[0].id;
          }
          setOrders(data as Order[]);
        }
      } else {
        console.error('[ADMIN ORDERS FETCH ERROR]:', await res.text());
      }
    } catch (err) {
      console.error('Errore nel caricamento ordini:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    // Caricamento ordini iniziale
    loadOrders();

    // Polling ultraleggero ogni 7 secondi per rilevare nuovi ordini in tempo reale
    const interval = setInterval(async () => {
      try {
        const lastId = lastKnownIdRef.current;
        if (!lastId) return;

        const res = await fetch(`/api/ordini?check_latest=true&last_id=${encodeURIComponent(String(lastId))}`);
        if (!res.ok) return;

        const result = (await res.json()) as any;
        if (result && result.has_new && result.latest) {
          setNewOrderBanner(result.latest as Order);
          lastKnownIdRef.current = result.latest.id;
          if (soundEnabled) {
            playNotificationChime();
          }
        }
      } catch (e) {
        // Silenzia errori temporanei di rete nel polling in background
      }
    }, 7000);

    return () => {
      clearInterval(interval);
    };
  }, [soundEnabled]);

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

  const handleBannerDismiss = () => {
    setNewOrderBanner(null);
  };

  const handleBannerRefresh = async () => {
    setNewOrderBanner(null);
    await loadOrders();
  };

  return (
    <div className="space-y-6">
      
      {/* Banner Notifica Nuovo Ordine Realtime Lampeggiante */}
      {newOrderBanner && (
        <div 
          onClick={handleBannerRefresh}
          className="relative overflow-hidden bg-gradient-to-r from-amber-500 via-rose-600 to-amber-600 text-white p-4 sm:p-5 rounded-3xl shadow-2xl border-2 border-amber-300 ring-4 ring-rose-500/40 animate-pulse flex flex-col md:flex-row items-start md:items-center justify-between gap-4 cursor-pointer transition-all hover:brightness-105"
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-white text-rose-600 flex items-center justify-center shrink-0 shadow-md">
              <Bell className="w-6 h-6 animate-bounce" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-black uppercase tracking-wider bg-white text-rose-700 px-3 py-1 rounded-full shadow-xs">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                  Nuovo ordine ricevuto! Clicca per aggiornare la lista
                </span>
                <span className="text-xs font-mono font-bold bg-black/30 px-2 py-0.5 rounded-lg text-white">
                  {newOrderBanner.numero_ordine}
                </span>
              </div>
              <p className="text-xs sm:text-sm font-extrabold text-white mt-1.5">
                {newOrderBanner.cliente_nome} ha ordinato per {formatPrice(newOrderBanner.totale_ordine)} ({newOrderBanner.tipo_ordine === 'ritiro' ? 'Ritiro al Banco' : 'Spedizione a domicilio'})
              </p>
            </div>
          </div>

          <div 
            className="flex items-center gap-2 self-end md:self-auto shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={handleBannerRefresh}
              className="px-4 py-2.5 bg-white text-rose-700 hover:bg-rose-50 transition-all rounded-xl font-black text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Aggiorna Lista</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setSelectedOrder(newOrderBanner);
                setNewOrderBanner(null);
              }}
              className="px-4 py-2.5 bg-brand-dark text-white hover:bg-neutral-800 transition-all rounded-xl font-bold text-xs inline-flex items-center gap-1.5 shadow-md cursor-pointer"
            >
              <span>Gestisci</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleBannerDismiss}
              className="p-2.5 bg-black/30 hover:bg-black/50 text-white rounded-xl transition-colors cursor-pointer"
              title="Silenzia / Chiudi avviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Header & Filtri */}
      <div className="bg-white p-6 rounded-3xl border border-brand-dark/10 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-extrabold text-brand-dark">Gestione Ordini Clienti</h2>
          <p className="text-xs text-brand-dark/60 mt-0.5">
            {orders.length} ordini registrati. Clicca su un ordine per vedere i dettagli e inviare il messaggio WhatsApp.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          {/* Toggle Suono Notifiche */}
          <button
            type="button"
            onClick={toggleSound}
            className={`p-2.5 rounded-xl border transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer ${
              soundEnabled
                ? 'bg-amber-50 border-amber-200 text-amber-900 hover:bg-amber-100'
                : 'bg-neutral-100 border-neutral-200 text-neutral-500 hover:bg-neutral-200'
            }`}
            title={soundEnabled ? 'Suono notifiche attivo (clicca per silenziare)' : 'Suono notifiche disattivato (clicca per attivare)'}
          >
            {soundEnabled ? (
              <>
                <Volume2 className="w-4 h-4 text-amber-600" />
                <span className="hidden sm:inline">Suono Attivo</span>
              </>
            ) : (
              <>
                <VolumeX className="w-4 h-4 text-neutral-400" />
                <span className="hidden sm:inline">Muto</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => loadOrders()}
            className="p-2.5 rounded-xl bg-brand-cream hover:bg-brand-dark hover:text-white transition-colors cursor-pointer"
            title="Ricarica ordini"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
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
