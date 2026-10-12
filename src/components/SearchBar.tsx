'use client';

import { Search } from 'lucide-react';
import { useState } from 'react';
import { useTranslations } from 'next-intl';

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
  defaultValue?: string;
  size?: 'sm' | 'lg';
  buttonText?: string;
}

export default function SearchBar({ placeholder, onSearch, defaultValue = '', size = 'sm', buttonText }: SearchBarProps) {
  const t = useTranslations('common');
  const [query, setQuery] = useState(defaultValue);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch?.(query);
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={size === 'lg' ? 20 : 18} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder || t('searchPlaceholder')}
          className={`w-full pl-12 pr-4 border border-gray-200 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white shadow-sm ${
            size === 'lg' ? 'py-4 text-lg' : 'py-3 text-sm'
          }`}
        />
        {onSearch && (
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-full transition-colors px-5 py-2 text-sm"
          >
            {buttonText || t('search')}
          </button>
        )}
      </div>
    </form>
  );
}
