'use client';

import { Link } from '@/i18n/routing';
import { Event } from '@/lib/types';
import CategoryBadge from './CategoryBadge';
import { Calendar, MapPin } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';

interface EventCardProps {
  event: Event;
}

export default function EventCard({ event }: EventCardProps) {
  const locale = useLocale();
  const t = useTranslations('common');
  const eventDate = new Date(event.date);
  const day = eventDate.getDate();
  const month = eventDate.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', { month: 'short' });

  return (
    <Link href={`/events/${event.slug}`} className="group block h-full">
      <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 h-full flex flex-col card-glow gradient-border">
        {/* Image */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gray-100">
          <img
            src={event.image_url}
            alt={event.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="250" fill="%23f3f4f6"><rect width="400" height="250"/><text x="50% y="50%" font-family="sans-serif" font-size="18" fill="%239ca3af" text-anchor="middle" dy=".3em">No Image</text></svg>';
            }}
          />
          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          {/* Date Badge */}
          <div className="absolute top-3 left-3 bg-white rounded-xl shadow-lg shadow-black/10 px-3 py-1.5 text-center min-w-[50px] border border-white/50">
            <div className="text-xs font-semibold text-[#5B5BF7] uppercase tracking-wide">{month}</div>
            <div className="text-lg font-bold text-gray-900 leading-tight">{day}</div>
          </div>
          {/* Free Badge */}
          {event.is_free && (
            <div className="absolute top-3 right-3 bg-emerald-500 text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md shadow-emerald-500/30">
              {t('free').toUpperCase()}
            </div>
          )}
          {event.featured && !event.is_free && (
            <div className="absolute top-3 right-3 bg-gradient-to-r from-[#5B5BF7] to-[#7C3AED] text-white text-xs font-bold px-2.5 py-1 rounded-full shadow-md shadow-indigo-500/30">
              ★ {locale === 'id' ? 'Unggulan' : 'Featured'}
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-5 flex-1 flex flex-col">
          <div className="mb-2.5">
            <CategoryBadge category={event.category} />
          </div>
          <h3 className="font-semibold text-gray-900 text-base leading-snug mb-2 line-clamp-2 group-hover:text-[#5B5BF7] transition-colors duration-200">
            {event.title}
          </h3>
          <p className="text-gray-500 text-sm line-clamp-2 mb-4 flex-1">
            {event.description}
          </p>
          <div className="space-y-2 mt-auto pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} className="text-[#5B5BF7]/60" />
              <span>{eventDate.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })}</span>
            </div>
            {event.venue_name && (
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <MapPin size={14} className="text-[#5B5BF7]/60" />
                <span className="truncate">{event.venue_name}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
