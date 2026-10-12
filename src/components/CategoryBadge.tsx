'use client';

import { CATEGORIES } from '@/lib/types';
import { useTranslations } from 'next-intl';

interface CategoryBadgeProps {
  category: string;
  size?: 'sm' | 'md';
}

export default function CategoryBadge({ category, size = 'sm' }: CategoryBadgeProps) {
  const tc = useTranslations('categories');
  const cat = CATEGORIES.find(c => c.id === category);
  const label = cat ? tc(cat.id) : category;
  const icon = cat ? cat.icon : '📌';

  return (
    <span
      className={`inline-flex items-center gap-1 font-medium rounded-full ${
        size === 'sm'
          ? 'px-2 py-0.5 text-xs'
          : 'px-3 py-1 text-sm'
      } bg-blue-50 text-blue-800 border border-blue-200`}
    >
      <span>{icon}</span>
      <span>{label}</span>
    </span>
  );
}
