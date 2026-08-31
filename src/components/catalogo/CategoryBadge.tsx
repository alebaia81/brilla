import React from 'react';

interface CategoryBadgeProps {
  tipo: string;
  className?: string;
}

export default function CategoryBadge({ tipo, className = '' }: CategoryBadgeProps) {
  let label = 'Articolo';
  let colorClasses = 'bg-brand-dark/10 text-brand-dark';
  let icon = '📦';

  switch (tipo?.toLowerCase()) {
    case 'cartoleria':
      label = 'Cartoleria';
      colorClasses = 'bg-blue-100/80 text-blue-800 border-blue-200';
      icon = '✏️';
      break;
    case 'edicola':
      label = 'Edicola';
      colorClasses = 'bg-emerald-100/80 text-emerald-800 border-emerald-200';
      icon = '📰';
      break;
    case 'bar_gift':
    case 'bar-gift':
      label = 'Bar & Gift';
      colorClasses = 'bg-rose-100/80 text-rose-800 border-rose-200';
      icon = '🎁';
      break;
  }

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold border shadow-2xs ${colorClasses} ${className}`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
