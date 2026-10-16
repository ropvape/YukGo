'use client';

import { Suspense, useState, useMemo, useCallback, useEffect } from 'react';
import { useSearchParams } from 'next/navigation';
import SearchBar from '@/components/SearchBar';
import FilterBar from '@/components/FilterBar';
import EventCard from '@/components/EventCard';
import Pagination from '@/components/Pagination';
import { fetchEvents } from '@/data/events';
import { Event } from '@/lib/types';

const ITEMS_PER_PAGE = 12;

function EventsContent() {
  const searchParams = useSearchParams();
  const initialQuery = searchParams.get('q') || '';
  const initialCategory = searchParams.get('category') || 'all';

  const [allEvents, setAllEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState(initialQuery);
  const [category, setCategory] = useState(initialCategory);
  const [city, setCity] = useState('all');
  const [dateRange, setDateRange] = useState('all');
  const [showFree, setShowFree] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    fetchEvents().then((data) => {
      setAllEvents(data);
      setLoading(false);
    });
  }, []);

  const filteredEvents = useMemo(() => {
    let events = [...allEvents];

    if (query) {
      const q = query.toLowerCase();
      events = events.filter(e =>
        e.title.toLowerCase().includes(q) ||
        e.city.toLowerCase().includes(q) ||
        e.category.toLowerCase().includes(q)
      );
    }

    if (category !== 'all') {
      events = events.filter(e => e.category === category);
    }

    if (city !== 'all') {
      events = events.filter(e => e.city === city);
    }

    if (showFree) {
      events = events.filter(e => e.is_free || e.price_min === 0);
    }

    if (dateRange !== 'all') {
      const now = new Date();
      const today = now.toISOString().split('T')[0];

      events = events.filter(e => {
        const eventDate = e.date;
        switch (dateRange) {
          case 'today':
            return eventDate === today;
          case 'week': {
            const weekEnd = new Date(now);
            weekEnd.setDate(weekEnd.getDate() + 7);
            return eventDate >= today && eventDate <= weekEnd.toISOString().split('T')[0];
          }
          case 'month': {
            const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0);
            return eventDate >= today && eventDate <= monthEnd.toISOString().split('T')[0];
          }
          case 'upcoming':
            return eventDate >= today;
          default:
            return true;
        }
      });
    }

    events.sort((a, b) => a.date.localeCompare(b.date));
    return events;
  }, [allEvents, query, category, city, dateRange, showFree]);

  const totalPages = Math.ceil(filteredEvents.length / ITEMS_PER_PAGE);
  const paginatedEvents = filteredEvents.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSearch = useCallback((q: string) => {
    setQuery(q);
    setCurrentPage(1);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Events</h1>
          <p className="text-gray-500">
            Discover {allEvents.length}+ events across Indonesia
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-6 space-y-4">
          <div className="max-w-xl">
            <SearchBar placeholder="Search events..." onSearch={handleSearch} defaultValue={initialQuery} />
          </div>
          <FilterBar
            selectedCategory={category}
            selectedCity={city}
            dateRange={dateRange}
            showFree={showFree}
            onCategoryChange={(c) => { setCategory(c); setCurrentPage(1); }}
            onCityChange={(c) => { setCity(c); setCurrentPage(1); }}
            onDateRangeChange={(d) => { setDateRange(d); setCurrentPage(1); }}
            onFreeChange={(f) => { setShowFree(f); setCurrentPage(1); }}
          />
        </div>

        <div className="mb-6 text-sm text-gray-500">
          Showing {paginatedEvents.length} of {filteredEvents.length} events
          {query && <span className="font-medium"> for &ldquo;{query}&rdquo;</span>}
        </div>

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500">Loading events...</p>
          </div>
        ) : paginatedEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {paginatedEvents.map((event) => (
              <EventCard key={event.id} event={event} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No events found</h3>
            <p className="text-gray-500">Try adjusting your filters or search terms</p>
          </div>
        )}

        {totalPages > 1 && (
          <div className="mt-10">
            <Pagination currentPage={currentPage} totalPages={totalPages} onPageChange={setCurrentPage} />
          </div>
        )}
      </div>
    </div>
  );
}

export default function EventsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-500">Loading events...</p>
        </div>
      </div>
    }>
      <EventsContent />
    </Suspense>
  );
}
