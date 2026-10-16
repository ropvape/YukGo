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
  const isValidDate = !isNaN(eventDate.getTime());
  const day = isValidDate ? eventDate.getDate() : '';
  const month = isValidDate
    ? eventDate.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', { month: 'short' })
    : '';

  // Ambil inisial dari judul event (maks 2 kata pertama yang panjangnya > 2 huruf)
  const initials = event.title
    ?.split(' ')
    .filter((w: string) => w.length > 2)
    .slice(0, 2)
    .map((w: string) => w[0]?.toUpperCase())
    .join('') || '📅';

  return (
    <Link href={`/events/${event.slug}`} className="group block h-full">
      <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-300 h-full flex flex-col card-glow gradient-border">
        {/* Image / Placeholder */}
        <div className="relative aspect-[16/10] overflow-hidden bg-gradient-to-br from-[#5B5BF7]/15 via-[#7C3AED]/15 to-[#06B6D4]/15">
          {event.image_url ? (
            <img
              src={event.image_url}
              alt={event.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
              onError={(e) => {
                (e.target as HTMLImageElement).style.display = 'none';
              }}
            />
          ) : (
            <div className="absolute inset-0 flex items-center justify-center px-6">
              <div className="text-center">
                <div className="text-6xl font-bold text-[#5B5BF7]/40 mb-3 leading-none">
                  {initials}
                </div>
                <div className="text-sm font-semibold text-gray-600 line-clamp-2 leading-tight">
                  {event.title}
                </div>
              </div>
            </div>
          )}

          {/* Overlay gradient on hover */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />

          {/* Date Badge — cuma muncul kalau date valid */}
          {isValidDate && (
            <div className="absolute top-3 left-3 bg-white rounded-xl shadow-lg shadow-black/10 px-3 py-1.5 text-center min-w-[50px] border border-white/50">
              <div className="text-xs font-semibold text-[#5B5BF7] uppercase tracking-wide">{month}</div>
              <div className="text-lg font-bold text-gray-900 leading-tight">{day}</div>
            </div>
          )}

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
            {event.description || 'Lihat detail event ini untuk informasi lebih lanjut.'}
          </p>
          <div className="space-y-2 mt-auto pt-3 border-t border-gray-50">
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Calendar size={14} className="text-[#5B5BF7]/60" />
              <span>
                {isValidDate
                  ? eventDate.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    })
                  : event.date}
              </span>
            </div>
            {event.venue_name && event.venue_name !== 'Unknown' && event.venue_name !== 'N/A' && (
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
