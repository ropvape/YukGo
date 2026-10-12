'use client';

import { useMemo } from 'react';
import { Link } from '@/i18n/routing';
import { Calendar, MapPin, ArrowRight, ChevronRight } from 'lucide-react';
import { useLocale, useTranslations } from 'next-intl';
import { sampleEvents } from '@/data/events';
import { CATEGORIES } from '@/lib/types';

function getWeekNumber(date: Date): number {
  const d = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  return Math.ceil((((d.getTime() - yearStart.getTime()) / 86400000) + 1) / 7);
}

function getWeekLabel(date: Date, locale: string): string {
  const weekStart = new Date(date);
  const day = weekStart.getDay();
  const diff = weekStart.getDate() - day + (day === 0 ? -6 : 1);
  weekStart.setDate(diff);
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekEnd.getDate() + 6);

  const opts: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric' };
  const startStr = weekStart.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', opts);
  const endStr = weekEnd.toLocaleDateString(locale === 'id' ? 'id-ID' : 'en-US', opts);
  return `${startStr} – ${endStr}`;
}

function formatPrice(event: { is_free?: boolean; price_min: number; price_max: number; currency: string }, locale: string): { text: string; isFree: boolean } {
  if (event.is_free) return { text: 'FREE', isFree: true };
  if (event.price_min === 0 && event.price_max === 0) return { text: 'FREE', isFree: true };
  if (event.price_min === event.price_max) {
    return { text: `Rp${(event.price_min / 1000).toFixed(0)}K`, isFree: false };
  }
  return { text: `Rp${(event.price_min / 1000).toFixed(0)}K – Rp${(event.price_max / 1000).toFixed(0)}K`, isFree: false };
}

const CATEGORY_COLORS: Record<string, string> = {
  tech: 'bg-blue-50 text-blue-700 border-blue-200',
  business: 'bg-amber-50 text-amber-700 border-amber-200',
  arts: 'bg-purple-50 text-purple-700 border-purple-200',
  music: 'bg-pink-50 text-pink-700 border-pink-200',
  food: 'bg-orange-50 text-orange-700 border-orange-200',
  sports: 'bg-green-50 text-green-700 border-green-200',
  education: 'bg-indigo-50 text-indigo-700 border-indigo-200',
  nightlife: 'bg-violet-50 text-violet-700 border-violet-200',
  community: 'bg-teal-50 text-teal-700 border-teal-200',
  other: 'bg-gray-50 text-gray-600 border-gray-200',
};

interface GroupedEvents {
  weekLabel: string;
  events: typeof sampleEvents;
}

export default function UpcomingEventsTable() {
  const locale = useLocale();
  const tcommon = useTranslations('common');
  const tc = useTranslations('categories');

  const groupedEvents = useMemo<GroupedEvents[]>(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const upcoming = [...sampleEvents]
      .filter(e => new Date(e.date) >= now)
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
      .slice(0, 20);

    const groups: GroupedEvents[] = [];
    let currentWeek = -1;

    for (const event of upcoming) {
      const eventDate = new Date(event.date);
      const week = getWeekNumber(eventDate);
      const year = eventDate.getFullYear();
      const weekKey = year * 100 + week;

      if (weekKey !== currentWeek) {
        currentWeek = weekKey;
        groups.push({
          weekLabel: getWeekLabel(eventDate, locale),
          events: [],
        });
      }
      groups[groups.length - 1].events.push(event);
    }

    return groups;
  }, [locale]);

  if (groupedEvents.length === 0) return null;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
      {/* Desktop Table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-100">
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 w-[130px]">
                {tcommon('date') || 'Date'}
              </th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4">
                {tcommon('title') || 'Title'}
              </th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 w-[140px]">
                <span className="flex items-center gap-1.5">
                  <MapPin size={12} />
                  {tcommon('city') || 'City'}
                </span>
              </th>
              <th className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 w-[150px]">
                {tcommon('category') || 'Category'}
              </th>
              <th className="text-right text-xs font-semibold text-gray-400 uppercase tracking-wider px-6 py-4 w-[110px]">
                {tcommon('price') || 'Price'}
              </th>
            </tr>
          </thead>
          <tbody>
            {groupedEvents.map((group) => (
              <>
                {/* Week header */}
                <tr key={`week-${group.weekLabel}`} className="week-header">
                  <td colSpan={5} className="px-6 py-2.5 bg-indigo-50/60">
                    <div className="flex items-center gap-2">
                      <Calendar size={13} className="text-[#5B5BF7]/50" />
                      <span className="text-xs font-semibold text-[#5B5BF7]/70 uppercase tracking-wider">
                        {group.weekLabel}
                      </span>
                    </div>
                  </td>
                </tr>
                {/* Event rows */}
                {group.events.map((event, idx) => {
                  const eventDate = new Date(event.date);
                  const day = eventDate.getDate();
                  const month = eventDate.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', { month: 'short' });
                  const cat = CATEGORIES.find(c => c.id === event.category);
                  const catColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other;
                  const price = formatPrice(event, locale);

                  return (
                    <tr
                      key={event.id}
                      className="table-row-hover border-b border-gray-50 last:border-0 transition-colors duration-150"
                    >
                      {/* Date */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-lg font-bold text-[#5B5BF7]">{day}</span>
                          <span className="text-sm text-gray-400 font-medium">{month}</span>
                        </div>
                      </td>
                      {/* Title */}
                      <td className="px-6 py-4">
                        <Link
                          href={`/events/${event.slug}`}
                          className="text-sm font-semibold text-gray-900 hover:text-[#5B5BF7] transition-colors duration-200 line-clamp-1"
                        >
                          {event.title}
                        </Link>
                        {event.venue_name && (
                          <p className="text-xs text-gray-400 mt-0.5 line-clamp-1">{event.venue_name}</p>
                        )}
                      </td>
                      {/* City */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="text-sm text-gray-600">{event.city}</span>
                      </td>
                      {/* Category */}
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 text-xs font-medium px-2.5 py-1 rounded-full border ${catColor}`}>
                          <span>{cat?.icon || '📌'}</span>
                          <span>{cat ? tc(cat.id) : event.category}</span>
                        </span>
                      </td>
                      {/* Price */}
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        {price.isFree ? (
                          <span className="text-sm font-bold text-emerald-600 bg-emerald-50 px-2.5 py-1 rounded-full">
                            {price.text}
                          </span>
                        ) : (
                          <span className="text-sm font-semibold text-gray-900">{price.text}</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-gray-50">
        {groupedEvents.map((group) => (
          <div key={`mobile-week-${group.weekLabel}`}>
            {/* Mobile week header */}
            <div className="px-4 py-3 bg-indigo-50/60 sticky top-0 z-10">
              <div className="flex items-center gap-2">
                <Calendar size={13} className="text-[#5B5BF7]/50" />
                <span className="text-xs font-semibold text-[#5B5BF7]/70 uppercase tracking-wider">
                  {group.weekLabel}
                </span>
              </div>
            </div>
            {/* Mobile event cards */}
            {group.events.map((event) => {
              const eventDate = new Date(event.date);
              const day = eventDate.getDate();
              const month = eventDate.toLocaleString(locale === 'id' ? 'id-ID' : 'en-US', { month: 'short' });
              const cat = CATEGORIES.find(c => c.id === event.category);
              const catColor = CATEGORY_COLORS[event.category] || CATEGORY_COLORS.other;
              const price = formatPrice(event, locale);

              return (
                <Link
                  key={event.id}
                  href={`/events/${event.slug}`}
                  className="block px-4 py-4 table-row-hover transition-colors duration-150"
                >
                  <div className="flex items-start gap-3">
                    {/* Date block */}
                    <div className="flex-shrink-0 w-12 h-12 bg-indigo-50 rounded-xl flex flex-col items-center justify-center">
                      <span className="text-base font-bold text-[#5B5BF7] leading-tight">{day}</span>
                      <span className="text-[10px] text-[#5B5BF7]/60 font-medium uppercase">{month}</span>
                    </div>
                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <h4 className="text-sm font-semibold text-gray-900 line-clamp-2 leading-snug">
                        {event.title}
                      </h4>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <span className={`inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full border ${catColor}`}>
                          <span>{cat?.icon || '📌'}</span>
                          <span>{cat ? tc(cat.id) : event.category}</span>
                        </span>
                        {price.isFree ? (
                          <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            {price.text}
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-gray-500">{price.text}</span>
                        )}
                      </div>
                    </div>
                    {/* Arrow */}
                    <ChevronRight size={16} className="text-gray-300 flex-shrink-0 mt-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        ))}
      </div>

      {/* View All Link */}
      <div className="px-6 py-4 border-t border-gray-100 bg-gray-50/50">
        <Link
          href="/events"
          className="inline-flex items-center gap-2 text-[#5B5BF7] hover:text-[#4338CA] font-semibold text-sm transition-colors group"
        >
          {tcommon('viewAll') || 'View All Events'}
          <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
}
