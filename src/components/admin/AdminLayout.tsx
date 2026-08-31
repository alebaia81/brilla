import React, { useEffect, useState } from 'react';
import { isAdminAuthenticated, clearAdminSession } from '../../lib/admin-auth';
import AdminLogin from './AdminLogin';
import OrdersTable from './OrdersTable';
import ProductManager from './ProductManager';
import CategoryManager from './CategoryManager';
import { ShoppingBag, Package, Tags, LogOut, Store, ArrowLeft } from 'lucide-react';

interface AdminLayoutProps {
  initialTab?: 'ordini' | 'prodotti' | 'categorie';
}

export default function AdminLayout({ initialTab = 'ordini' }: AdminLayoutProps) {
  const [authenticated, setAuthenticated] = useState(false);
  const [activeTab, setActiveTab] = useState<'ordini' | 'prodotti' | 'categorie'>(initialTab);
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    setAuthenticated(isAdminAuthenticated());
    setChecking(false);
  }, []);

  const handleLogout = () => {
    clearAdminSession();
    setAuthenticated(false);
  };

  if (checking) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <span className="text-xs text-brand-dark/50 font-bold">Verifica autorizzazione...</span>
      </div>
    );
  }

  if (!authenticated) {
    return <AdminLogin onSuccess={() => setAuthenticated(true)} />;
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
      
      {/* Header Admin Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 mb-8 border-b border-brand-dark/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-dark text-brand-amber flex items-center justify-center font-bold text-lg shadow-sm">
            🔒
          </div>
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-brand-amber block">
              Pannello di Amministrazione
            </span>
            <h1 className="text-2xl font-black text-brand-dark">
              Brilla Cafe Manager
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            className="px-3.5 py-2 rounded-xl bg-white border border-brand-dark/15 text-xs font-semibold text-brand-dark hover:bg-brand-cream transition-colors flex items-center gap-1.5"
          >
            <Store className="w-3.5 h-3.5 text-brand-amber" />
            <span>Vai al Negozio</span>
          </a>

          <button
            type="button"
            onClick={handleLogout}
            className="px-3.5 py-2 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-600 hover:text-white transition-colors text-xs font-bold flex items-center gap-1.5 shadow-2xs"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Esci</span>
          </button>
        </div>
      </div>

      {/* Navigazione Tab */}
      <div className="flex items-center gap-2 mb-8 bg-white p-2 rounded-2xl border border-brand-dark/10 shadow-2xs self-start overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab('ordini')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'ordini'
              ? 'bg-brand-dark text-white shadow-sm'
              : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-cream'
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          <span>Ordini &amp; WhatsApp</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('prodotti')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'prodotti'
              ? 'bg-brand-dark text-white shadow-sm'
              : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-cream'
          }`}
        >
          <Package className="w-4 h-4" />
          <span>Catalogo &amp; Foto AVIF</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('categorie')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'categorie'
              ? 'bg-brand-dark text-white shadow-sm'
              : 'text-brand-dark/70 hover:text-brand-dark hover:bg-brand-cream'
          }`}
        >
          <Tags className="w-4 h-4" />
          <span>Categorie Reparti</span>
        </button>
      </div>

      {/* Contenuto Tab Attiva */}
      <div>
        {activeTab === 'ordini' && <OrdersTable />}
        {activeTab === 'prodotti' && <ProductManager />}
        {activeTab === 'categorie' && <CategoryManager />}
      </div>

    </div>
  );
}
