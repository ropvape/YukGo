'use client';

import { CATEGORIES, CITIES } from '@/lib/types';
import { useTranslations } from 'next-intl';

interface FilterBarProps {
  selectedCategory: string;
  selectedCity: string;
  dateRange: string;
  showFree: boolean;
  onCategoryChange: (cat: string) => void;
  onCityChange: (city: string) => void;
  onDateRangeChange: (range: string) => void;
  onFreeChange: (free: boolean) => void;
}

export default function FilterBar({
  selectedCategory,
  selectedCity,
  dateRange,
  showFree,
  onCategoryChange,
  onCityChange,
  onDateRangeChange,
  onFreeChange,
}: FilterBarProps) {
  const t = useTranslations('events.filters');
  const tc = useTranslations('categories');

  return (
    <div className="flex flex-wrap gap-3">
      {/* Category */}
      <select
        value={selectedCategory}
        onChange={(e) => onCategoryChange(e.target.value)}
        className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px]"
      >
        <option value="all">{t('allCategories')}</option>
        {CATEGORIES.slice(1).map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.icon} {tc(cat.id)}
          </option>
        ))}
      </select>

      {/* City */}
      <select
        value={selectedCity}
        onChange={(e) => onCityChange(e.target.value)}
        className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]"
      >
        <option value="all">{t('allCities')}</option>
        {CITIES.map((city) => (
          <option key={city} value={city}>{city}</option>
        ))}
      </select>

      {/* Date Range */}
      <select
        value={dateRange}
        onChange={(e) => onDateRangeChange(e.target.value)}
        className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[130px]"
      >
        <option value="all">{t('anyDate')}</option>
        <option value="today">{t('today')}</option>
        <option value="week">{t('thisWeek')}</option>
        <option value="month">{t('thisMonth')}</option>
        <option value="upcoming">{t('upcoming')}</option>
      </select>

      {/* Free Only */}
      <button
        onClick={() => onFreeChange(!showFree)}
        className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
          showFree
            ? 'bg-blue-500 border-blue-500 text-white'
            : 'bg-white border border-gray-200 text-gray-600 hover:border-blue-400'
        }`}
      >
        {t('freeOnly')}
      </button>
    </div>
  );
}
