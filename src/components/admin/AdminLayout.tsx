import React, { useEffect, useState } from 'react';
import { isAdminAuthenticated, setAdminSession, clearAdminSession, verifyAdminPassword } from '../../lib/admin-auth';
import OrdersTable from './OrdersTable';
import ProductManager from './ProductManager';
import CategoryManager from './CategoryManager';
import { 
  ShoppingBag, 
  Package, 
  Tags, 
  LogOut, 
  Store, 
  ShieldCheck, 
  Menu, 
  X, 
  ChevronRight,
  Lock,
  ArrowRight,
  AlertCircle
} from 'lucide-react';

interface AdminLayoutProps {
  initialTab?: 'ordini' | 'prodotti' | 'categorie';
}

export default function AdminLayout({ initialTab = 'ordini' }: AdminLayoutProps) {
  const [authenticated, setAuthenticated] = useState<boolean>(false);
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState(false);
  const [activeTab, setActiveTab] = useState<'ordini' | 'prodotti' | 'categorie'>(initialTab);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (isAdminAuthenticated()) {
      setAuthenticated(true);
    }
  }, []);

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = (password || (document.getElementById('admin-password-input') as HTMLInputElement)?.value || '').trim();
    if (verifyAdminPassword(clean)) {
      setAdminSession();
      setAuthenticated(true);
      setLoginError(false);
    } else {
      setLoginError(true);
    }
  };

  const handleLogout = () => {
    clearAdminSession();
    setAuthenticated(false);
    setPassword('');
  };

  if (!authenticated) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-md bg-white rounded-3xl p-8 sm:p-10 border border-brand-dark/10 shadow-xl text-center space-y-6">
          
          <div className="w-16 h-16 rounded-2xl bg-brand-dark text-brand-amber flex items-center justify-center mx-auto shadow-md">
            <Lock className="w-8 h-8" />
          </div>

          <div>
            <span className="px-3 py-1 rounded-full bg-brand-dark/5 text-brand-dark text-xs font-bold uppercase tracking-wider inline-block mb-2">
              Pannello Esercente
            </span>
            <h1 className="text-2xl font-black text-brand-dark">
              Accesso Area Riservata
            </h1>
            <p className="text-xs text-brand-dark/60 mt-1">
              Inserisci la password di amministrazione per gestire ordini e catalogo.
            </p>
          </div>

          {loginError && (
            <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 text-left">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              <span>Password non corretta. Riprova.</span>
            </div>
          )}

          <form onSubmit={handleLoginSubmit} className="space-y-4 text-left">
            <div>
              <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wider">
                Password Admin
              </label>
              <input
                id="admin-password-input"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Inserisci password..."
                className="w-full px-4 py-3 bg-brand-cream/50 border border-brand-dark/15 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber text-brand-dark cursor-text"
              />
              <span className="text-[10px] text-brand-dark/40 mt-1 block">
                Password predefinita: <code className="bg-brand-dark/5 px-1 py-0.5 rounded font-mono font-bold">brilla2026</code>
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-3.5 px-6 bg-brand-amber hover:bg-brand-amber/90 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
            >
              <span>Entra nella Dashboard</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <div className="pt-4 border-t border-brand-dark/5 flex items-center justify-center gap-2 text-[11px] text-brand-dark/50">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Accesso protetto</span>
          </div>

        </div>
      </div>
    );
  }

  const navItems = [
    {
      id: 'ordini' as const,
      label: 'Gestione Ordini',
      subtitle: 'Ricevuti & WhatsApp',
      icon: ShoppingBag,
      badge: null,
    },
    {
      id: 'prodotti' as const,
      label: 'Catalogo Prodotti',
      subtitle: 'Articoli, Prezzi & Foto',
      icon: Package,
      badge: null,
    },
    {
      id: 'categorie' as const,
      label: 'Categorie & Reparti',
      subtitle: 'Cartoleria, Edicola, Bar',
      icon: Tags,
      badge: null,
    },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
      
      {/* Top Header Mobile */}
      <div className="md:hidden flex items-center justify-between bg-brand-dark text-white p-4 rounded-2xl mb-6 shadow-md">
        <div className="flex items-center gap-3">
          <img src="/logo.jpeg" alt="Logo" className="w-9 h-9 rounded-xl object-cover border border-white/20" />
          <div>
            <span className="text-xs font-black block leading-tight">Brilla Cafe Manager</span>
            <span className="text-[10px] text-brand-cyan font-bold uppercase">Pannello Admin</span>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>

      {/* Grid Layout Desktop: Sidebar a Sinistra (3 col) + Contenuto Principale (9 col) */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
        
        {/* SIDEBAR VERTICALE */}
        <aside
          className={`md:col-span-4 lg:col-span-3 space-y-6 ${
            mobileMenuOpen ? 'block' : 'hidden md:block'
          }`}
        >
          <div className="bg-brand-dark text-white rounded-3xl p-6 shadow-xl border border-brand-dark/20 space-y-6">
            
            {/* Header Sidebar Brand */}
            <div className="flex items-center gap-3.5 pb-5 border-b border-white/10">
              <img
                src="/logo.jpeg"
                alt="Brilla Cafe Manager"
                className="w-12 h-12 rounded-2xl object-cover shadow-md border-2 border-white/20 flex-shrink-0"
              />
              <div>
                <span className="text-base font-black tracking-tight text-white block leading-tight">
                  Brilla <span className="text-brand-cyan font-bold">Cafe'</span>
                </span>
                <span className="text-[10px] text-white/60 font-semibold flex items-center gap-1 mt-0.5">
                  <ShieldCheck className="w-3 h-3 text-emerald-400" />
                  Sessione Protetta
                </span>
              </div>
            </div>

            {/* Menu Navigazione Verticale */}
            <nav className="space-y-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider text-white/40 block px-2 mb-1">
                Menu Principale
              </span>

              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setActiveTab(item.id);
                      setMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center justify-between p-3.5 rounded-2xl text-left transition-all cursor-pointer ${
                      isActive
                        ? 'bg-brand-cyan text-white font-bold shadow-md shadow-brand-cyan/25 translate-x-1'
                        : 'text-white/75 hover:bg-white/10 hover:text-white font-semibold'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                          isActive ? 'bg-white/20 text-white' : 'bg-white/5 text-white/70'
                        }`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-xs block leading-tight">{item.label}</span>
                        <span className={`text-[10px] block ${isActive ? 'text-white/80' : 'text-white/40'}`}>
                          {item.subtitle}
                        </span>
                      </div>
                    </div>
                    <ChevronRight className={`w-4 h-4 transition-transform ${isActive ? 'opacity-100 translate-x-0.5' : 'opacity-40'}`} />
                  </button>
                );
              })}
            </nav>

            {/* Azioni Rapide Footer Sidebar */}
            <div className="pt-4 border-t border-white/10 space-y-2">
              <a
                href="/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full px-3.5 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 text-white/90 text-xs font-semibold transition-all flex items-center justify-between group"
              >
                <div className="flex items-center gap-2">
                  <Store className="w-4 h-4 text-brand-cyan" />
                  <span>Vedi Negozio Online</span>
                </div>
                <ChevronRight className="w-3.5 h-3.5 opacity-40 group-hover:translate-x-0.5 transition-transform" />
              </a>

              <button
                type="button"
                onClick={handleLogout}
                className="w-full px-3.5 py-2.5 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 hover:text-rose-200 text-xs font-bold transition-all flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <LogOut className="w-4 h-4" />
                  <span>Esci dal Pannello</span>
                </div>
              </button>
            </div>

          </div>
        </aside>

        {/* CONTENUTO PRINCIPALE (9 col su Desktop) */}
        <main className="md:col-span-8 lg:col-span-9 min-h-[600px]">
          {activeTab === 'ordini' && <OrdersTable />}
          {activeTab === 'prodotti' && <ProductManager />}
          {activeTab === 'categorie' && <CategoryManager />}
        </main>

      </div>

    </div>
  );
}
