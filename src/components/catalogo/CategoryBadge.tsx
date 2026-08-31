import React from 'react';

interface CategoryBadgeProps {
  tipo: string;
  className?: string;
}

export default function CategoryBadge({ tipo, className = '' }: CategoryBadgeProps) {
  let label = 'Articolo';
  let colorClasses = 'bg-brand-dark/10 text-brand-dark border-brand-dark/20';
  let dotColor = 'bg-brand-dark';

  switch (tipo?.toLowerCase()) {
    case 'cartoleria':
      label = 'Cartoleria & Scuola';
      colorClasses = 'bg-blue-50 text-blue-800 border-blue-200/80';
      dotColor = 'bg-badge-cartoleria';
      break;
    case 'edicola':
      label = 'Edicola & Riviste';
      colorClasses = 'bg-emerald-50 text-emerald-800 border-emerald-200/80';
      dotColor = 'bg-badge-edicola';
      break;
    case 'bar_gift':
    case 'bar-gift':
      label = 'Bar & Idee Regalo';
      colorClasses = 'bg-rose-50 text-rose-800 border-rose-200/80';
      dotColor = 'bg-badge-gift';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${colorClasses} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`}></span>
      <span>{label}</span>
    </span>
  );
}
