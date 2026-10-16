'use client';

import { useState, useEffect } from 'react';
import { Link } from '@/i18n/routing';
import { ArrowRight, Calendar, MapPin, Building2, Users } from 'lucide-react';
import SearchBar from '@/components/SearchBar';
import EventCard from '@/components/EventCard';
import UpcomingEventsTable from '@/components/UpcomingEventsTable';
import { fetchEvents } from '@/data/events';
import { CATEGORIES, Event } from '@/lib/types';
import { useRouter } from 'next/navigation';
import { useTranslations } from 'next-intl';

export default function HomePage() {
  const router = useRouter();
  const t = useTranslations('home');
  const tc = useTranslations('categories');
  const tcommon = useTranslations('common');
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    fetchEvents().then((data) => {
      setEvents(data);
      setLoading(false);
    });
  }, []);

  const featuredEvents = events.slice(0, 6);
  const filteredEvents = selectedCategory === 'all'
    ? events.slice(0, 12)
    : events.filter(e => e.category === selectedCategory).slice(0, 12);

  const handleSearch = (query: string) => {
    if (query.trim()) {
      router.push(`/events?q=${encodeURIComponent(query)}`);
    }
  };

  const stats = [
    { label: t('stats.eventsListed'), value: events.length + '+', icon: Calendar },
    { label: t('stats.citiesCovered'), value: '8+', icon: MapPin },
    { label: t('stats.venues'), value: '50+', icon: Building2 },
    { label: t('stats.monthlyVisitors'), value: '10K+', icon: Users },
  ];

  const statBgClasses = ['stat-card-1', 'stat-card-2', 'stat-card-3', 'stat-card-4'];
  const statIconColors = ['text-[#5B5BF7]', 'text-[#7C3AED]', 'text-[#06B6D4]', 'text-[#5B5BF7]'];

  return (
    <div>
      {/* Hero Section */}
      <section className="relative bg-hero-mesh overflow-hidden">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-20 -right-20 w-96 h-96 bg-[#5B5BF7] rounded-full opacity-[0.07] blur-3xl animate-float" />
          <div className="absolute -bottom-32 -left-32 w-80 h-80 bg-[#7C3AED] rounded-full opacity-[0.06] blur-3xl animate-float-delayed" />
          <div className="absolute top-1/3 right-1/4 w-64 h-64 bg-[#06B6D4] rounded-full opacity-[0.05] blur-3xl animate-float-slow" />
          <div className="absolute top-20 left-[15%] w-16 h-16 border-2 border-[#5B5BF7]/10 rounded-xl rotate-12 animate-float" />
          <div className="absolute bottom-32 right-[10%] w-12 h-12 border-2 border-[#7C3AED]/10 rounded-full animate-float-delayed" />
          <div className="absolute top-1/2 left-[8%] w-8 h-8 bg-[#06B6D4]/10 rounded-lg rotate-45 animate-float-slow" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 md:py-36">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 px-5 py-2 bg-white/80 backdrop-blur-sm border border-[#5B5BF7]/15 rounded-full text-sm font-medium mb-8 shadow-sm">
              <span className="animate-pulse">🔥</span>
              <span className="text-gray-700">{events.length} {t('heroBadge')}</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-7xl font-bold text-gray-900 leading-[1.1] mb-6 tracking-tight">
              {t('heroTitle1')}
              <br />
              <span className="text-gradient">{t('heroTitle2')}</span>
            </h1>

            <p className="text-lg md:text-xl text-gray-500 mb-10 max-w-2xl mx-auto leading-relaxed">
              {t('heroSubtitle')}
            </p>

            <div className="max-w-2xl mx-auto mb-10">
              <SearchBar
                placeholder={tcommon('searchPlaceholder')}
                onSearch={handleSearch}
              />
            </div>

            <div className="flex flex-wrap justify-center gap-2.5">
              {CATEGORIES.slice(1, 6).map((cat) => (
                <Link
                  key={cat.id}
                  href={`/events?category=${cat.id}`}
                  className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-white border border-gray-200/80 rounded-full text-sm font-medium text-gray-700 hover:border-[#5B5BF7]/40 hover:bg-[#5B5BF7]/5 hover:text-[#5B5BF7] transition-all shadow-sm"
                >
                  <span>{cat.icon}</span>
                  <span>{tc(cat.id)}</span>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="bg-white border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
            {stats.map((stat, idx) => (
              <div
                key={stat.label}
                className={`text-center rounded-2xl p-5 ${statBgClasses[idx]} border border-gray-100/80`}
              >
                <div className="inline-flex items-center justify-center w-11 h-11 bg-white rounded-xl mb-3 shadow-sm">
                  <stat.icon size={22} className={statIconColors[idx]} />
                </div>
                <div className="text-2xl md:text-3xl font-bold text-gray-900">{stat.value}</div>
                <div className="text-sm text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Events */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#5B5BF7] to-[#7C3AED] rounded-full" />
              <span className="text-xs font-semibold text-[#5B5BF7] uppercase tracking-wider">{t('featured.title')}</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">{t('featured.title')}</h2>
            <p className="text-gray-500 mt-2">{t('featured.subtitle')}</p>
          </div>
          <Link
            href="/events"
            className="hidden sm:flex items-center gap-1.5 text-[#5B5BF7] hover:text-[#4338CA] font-semibold text-sm transition-colors"
          >
            {tcommon('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {featuredEvents.map((event) => (
            <EventCard key={event.id} event={event} />
          ))}
        </div>

        <div className="text-center mt-10 sm:hidden">
          <Link
            href="/events"
            className="inline-flex items-center gap-1.5 text-[#5B5BF7] hover:text-[#4338CA] font-semibold text-sm"
          >
            {tcommon('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>
      </section>

      {/* Upcoming Events Table */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="flex items-end justify-between mb-8">
          <div>
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#5B5BF7] to-[#7C3AED] rounded-full" />
              <span className="text-xs font-semibold text-[#5B5BF7] uppercase tracking-wider">Upcoming</span>
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">Upcoming Events</h2>
            <p className="text-gray-500 mt-2">What&apos;s happening next — sorted by date</p>
          </div>
          <Link
            href="/events"
            className="hidden sm:flex items-center gap-1.5 text-[#5B5BF7] hover:text-[#4338CA] font-semibold text-sm transition-colors"
          >
            {tcommon('viewAll')} <ArrowRight size={16} />
          </Link>
        </div>
        <UpcomingEventsTable />
      </section>

      {/* Browse by Category */}
      <section className="bg-[#F8FAFF] bg-grid-pattern py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 mb-3">
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#7C3AED] to-[#06B6D4] rounded-full" />
              <span className="text-xs font-semibold text-[#7C3AED] uppercase tracking-wider">{t('categories.title')}</span>
              <div className="w-8 h-0.5 bg-gradient-to-r from-[#06B6D4] to-[#5B5BF7] rounded-full" />
            </div>
            <h2 className="text-2xl md:text-4xl font-bold text-gray-900 tracking-tight">{t('categories.title')}</h2>
            <p className="text-gray-500 mt-2">{t('categories.subtitle')}</p>
          </div>

          <div className="flex flex-wrap justify-center gap-2.5 mb-12">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                selectedCategory === 'all'
                  ? 'pill-active'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-[#5B5BF7]/40 hover:text-[#5B5BF7] shadow-sm'
              }`}
            >
              🎯 {t('categories.allEvents')}
            </button>
            {CATEGORIES.slice(1).map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.id)}
                className={`inline-flex items-center gap-1.5 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  selectedCategory === cat.id
                    ? 'pill-active'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-[#5B5BF7]/40 hover:text-[#5B5BF7] shadow-sm'
                }`}
              >
                {cat.icon} {tc(cat.id)}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {filteredEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        </div>
      </section>

      {/* Venue CTA */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        <div className="grid md:grid-cols-2 gap-6">
          <div className="relative bg-gray-950 rounded-3xl p-8 md:p-10 text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-950 to-gray-900" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-[#5B5BF7]/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-[#5B5BF7]/20 flex items-center justify-center mb-5">
                <Building2 size={24} className="text-[#818CF8]" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">{t('venueCta.title')}</h3>
              <p className="text-gray-400 mb-8 leading-relaxed">{t('venueCta.subtitle')}</p>
              <Link
                href="/venues"
                className="inline-flex items-center gap-2 bg-[#5B5BF7] hover:bg-[#4338CA] text-white font-semibold px-7 py-3.5 rounded-full transition-all shadow-lg shadow-indigo-500/25 hover:shadow-xl hover:shadow-indigo-500/30"
              >
                {tcommon('learnMore')} <ArrowRight size={16} />
              </Link>
            </div>
          </div>

          <div className="relative rounded-3xl p-8 md:p-10 text-white overflow-hidden bg-gradient-to-br from-[#5B5BF7] via-[#7C3AED] to-[#06B6D4]">
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-white/10 rounded-full blur-3xl" />
            <div className="relative">
              <div className="w-12 h-12 rounded-2xl bg-white/20 flex items-center justify-center mb-5">
                <Users size={24} className="text-white" />
              </div>
              <h3 className="text-xl md:text-2xl font-bold mb-3">{t('vendorCta.title')}</h3>
              <p className="text-white/80 mb-8 leading-relaxed">{t('vendorCta.subtitle')}</p>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 bg-white text-[#5B5BF7] font-semibold px-7 py-3.5 rounded-full transition-all hover:bg-gray-50 shadow-lg"
              >
                {tcommon('getStarted')} <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
