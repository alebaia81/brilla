import React, { useState } from 'react';
import { verifyAdminPassword, setAdminSession } from '../../lib/admin-auth';
import { Lock, ArrowRight, ShieldCheck, AlertCircle } from 'lucide-react';

interface AdminLoginProps {
  onSuccess: () => void;
}

export default function AdminLogin({ onSuccess }: AdminLoginProps) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);

    try {
      const isValid = await verifyAdminPassword(password);
      if (isValid) {
        setAdminSession();
        onSuccess();
      } else {
        setError(true);
      }
    } catch (err) {
      setError(true);
    } finally {
      setLoading(false);
    }
  };

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

        {error && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            <span>Password non corretta. Riprova.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-left">
          <div>
            <label className="block text-xs font-bold text-brand-dark mb-1.5 uppercase tracking-wider">
              Password Admin
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Inserisci password..."
              className="w-full px-4 py-3 bg-brand-cream/50 border border-brand-dark/15 rounded-xl text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand-amber text-brand-dark"
            />
            <span className="text-[10px] text-brand-dark/40 mt-1 block">
              Password predefinita: <code className="bg-brand-dark/5 px-1 py-0.5 rounded">brilla2026</code>
            </span>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3.5 px-6 bg-brand-amber hover:bg-brand-amber/90 text-white text-xs font-bold rounded-xl shadow-md transition-all flex items-center justify-center gap-2"
          >
            <span>{loading ? 'Verifica in corso...' : 'Entra nella Dashboard'}</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </form>

        <div className="pt-4 border-t border-brand-dark/5 flex items-center justify-center gap-2 text-[11px] text-brand-dark/50">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <span>Accesso crittografato client-side SHA-256</span>
        </div>

      </div>
    </div>
  );
}
