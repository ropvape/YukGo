'use client';

import { Link } from '@/i18n/routing';
import { useState } from 'react';
import { Menu, X, Search } from 'lucide-react';
import { useTranslations } from 'next-intl';
import LanguageSwitcher from './LanguageSwitcher';

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const t = useTranslations('nav');

  return (
    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl navbar-gradient-border">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-gradient-to-br from-[#5B5BF7] to-[#7C3AED] shadow-md shadow-indigo-500/20 group-hover:shadow-lg group-hover:shadow-indigo-500/30 transition-shadow">
              <span className="font-bold text-white text-lg">Y</span>
            </div>
            <span className="font-bold text-xl text-gray-900">
              yukgo<span className="text-gradient">.live</span>
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <Link href="/events" className="text-gray-600 hover:text-[#5B5BF7] transition-colors font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-[#5B5BF7] after:to-[#7C3AED] after:transition-all hover:after:w-full">
              {t('events')}
            </Link>
            <Link href="/venues" className="text-gray-600 hover:text-[#5B5BF7] transition-colors font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-[#5B5BF7] after:to-[#7C3AED] after:transition-all hover:after:w-full">
              {t('venues')}
            </Link>
            <Link href="/about" className="text-gray-600 hover:text-[#5B5BF7] transition-colors font-medium relative after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-gradient-to-r after:from-[#5B5BF7] after:to-[#7C3AED] after:transition-all hover:after:w-full">
              {t('about')}
            </Link>
          </div>

          {/* Desktop CTA + Language Switcher */}
          <div className="hidden md:flex items-center gap-3">
            <LanguageSwitcher />
            <Link
              href="/events"
              className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-[#5B5BF7] to-[#7C3AED] hover:from-[#4338CA] hover:to-[#6D28D9] text-white font-semibold rounded-full transition-all shadow-md shadow-indigo-500/25 hover:shadow-lg hover:shadow-indigo-500/30"
            >
              <Search size={16} />
              {t('findEvents')}
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              {isOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Nav */}
        {isOpen && (
          <div className="md:hidden py-4 border-t border-gray-100">
            <div className="flex flex-col gap-3">
              <Link href="/events" className="text-gray-600 hover:text-[#5B5BF7] py-2 font-medium" onClick={() => setIsOpen(false)}>
                {t('events')}
              </Link>
              <Link href="/venues" className="text-gray-600 hover:text-[#5B5BF7] py-2 font-medium" onClick={() => setIsOpen(false)}>
                {t('venues')}
              </Link>
              <Link href="/about" className="text-gray-600 hover:text-[#5B5BF7] py-2 font-medium" onClick={() => setIsOpen(false)}>
                {t('about')}
              </Link>
              <Link
                href="/events"
                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-[#5B5BF7] to-[#7C3AED] text-white font-semibold rounded-full transition-all shadow-md shadow-indigo-500/25 mt-2"
                onClick={() => setIsOpen(false)}
              >
                <Search size={16} />
                {t('findEvents')}
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
