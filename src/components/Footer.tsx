'use client';

import { Link } from '@/i18n/routing';
import { Mail, MapPin } from 'lucide-react';
import { useTranslations } from 'next-intl';

export default function Footer() {
  const t = useTranslations('footer');
  const tc = useTranslations('categories');

  return (
    <footer className="bg-gray-950 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                <span className="font-bold text-white text-lg">Y</span>
              </div>
              <span className="font-bold text-xl text-white">
                yukgo<span className="text-blue-500">.live</span>
              </span>
            </Link>
            <p className="text-gray-400 text-sm leading-relaxed">
              {t('description')}
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('explore')}</h4>
            <ul className="space-y-2">
              <li><Link href="/events" className="text-gray-400 hover:text-blue-500 transition-colors text-sm">{t('allEvents')}</Link></li>
              <li><Link href="/venues" className="text-gray-400 hover:text-blue-500 transition-colors text-sm">{t('venues')}</Link></li>
              <li><Link href="/about" className="text-gray-400 hover:text-blue-500 transition-colors text-sm">{t('aboutUs')}</Link></li>
            </ul>
          </div>

          {/* Categories */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('categories')}</h4>
            <ul className="space-y-2">
              <li><Link href="/events?category=tech" className="text-gray-400 hover:text-blue-500 transition-colors text-sm">{tc('tech')}</Link></li>
              <li><Link href="/events?category=business" className="text-gray-400 hover:text-blue-500 transition-colors text-sm">{tc('business')}</Link></li>
              <li><Link href="/events?category=music" className="text-gray-400 hover:text-blue-500 transition-colors text-sm">{tc('music')}</Link></li>
              <li><Link href="/events?category=arts" className="text-gray-400 hover:text-blue-500 transition-colors text-sm">{tc('arts')}</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="text-white font-semibold mb-4">{t('contact')}</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <Mail size={14} />
                <span>hello@yukgo.live</span>
              </li>
              <li className="flex items-center gap-2 text-sm text-gray-400">
                <MapPin size={14} />
                <span>Jakarta, Indonesia</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gray-800 mt-10 pt-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-gray-500">
            © 2026 yukgo.live. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-gray-500">
            <Link href="/about" className="hover:text-blue-500 transition-colors">{t('privacy')}</Link>
            <Link href="/about" className="hover:text-blue-500 transition-colors">{t('terms')}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
