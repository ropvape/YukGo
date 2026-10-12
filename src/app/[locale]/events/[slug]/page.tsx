'use client';

import { useParams } from 'next/navigation';
import { Link } from '@/i18n/routing';
import { Calendar, MapPin, Clock, ExternalLink, ArrowLeft, Share2 } from 'lucide-react';
import CategoryBadge from '@/components/CategoryBadge';
import EventCard from '@/components/EventCard';
import EventImage from '@/components/EventImage';
import { sampleEvents, getEventBySlug } from '@/data/events';

export default function EventDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const event = getEventBySlug(slug);

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Event Not Found</h1>
          <Link href="/events" className="text-blue-500 hover:underline">Back to Events</Link>
        </div>
      </div>
    );
  }

  const relatedEvents = sampleEvents
    .filter(e => e.category === event.category && e.id !== event.id)
    .slice(0, 3);

  const formatDate = (dateStr: string) => {
    if (!dateStr) return 'TBD';
    const date = new Date(dateStr);
    return date.toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Back button */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <Link href="/events" className="inline-flex items-center gap-2 text-gray-500 hover:text-blue-600 transition-colors text-sm">
          <ArrowLeft size={16} />
          Back to Events
        </Link>
      </div>

      {/* Hero */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl overflow-hidden mb-6">
              <EventImage src={event.image_url} alt={event.title} className="w-full h-64 sm:h-80 object-cover" />
            </div>

            <div className="flex items-center gap-3 mb-4">
              <CategoryBadge category={event.category} />
              {event.is_free && (
                <span className="bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full">FREE</span>
              )}
            </div>

            <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>

            {event.description && (
              <div className="prose prose-gray max-w-none mb-8">
                <p className="text-gray-600 leading-relaxed text-lg">{event.description}</p>
              </div>
            )}

            {/* What to Expect */}
            <div className="bg-blue-50 rounded-2xl p-6 mb-8">
              <h2 className="font-semibold text-gray-900 text-lg mb-4">What to Expect</h2>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">1</span>
                  </div>
                  <span className="text-gray-600">Network with industry professionals and like-minded individuals</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">2</span>
                  </div>
                  <span className="text-gray-600">Gain insights from expert speakers and thought leaders</span>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-blue-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-white text-xs font-bold">3</span>
                  </div>
                  <span className="text-gray-600">Discover new opportunities and stay ahead of trends</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Sidebar */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-6">
              {/* Event Details Card */}
              <div className="bg-white border border-gray-200 rounded-2xl p-6 shadow-sm">
                <h3 className="font-semibold text-gray-900 mb-4">Event Details</h3>

                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0 mt-0.5">
                      <Calendar size={18} className="text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Date</p>
                      <p className="font-medium text-gray-900">{formatDate(event.date)}</p>
                      {event.end_date && event.end_date !== event.date && (
                        <p className="text-sm text-gray-500">to {formatDate(event.end_date)}</p>
                      )}
                    </div>
                  </div>

                  {event.time && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <Clock size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Time</p>
                        <p className="font-medium text-gray-900">{event.time}</p>
                      </div>
                    </div>
                  )}

                  {(event.price_min > 0 || event.price_max > 0) && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <span className="text-blue-600 font-bold text-sm">Rp</span>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Price</p>
                        <p className="font-medium text-gray-900">
                          {event.price_min === event.price_max
                            ? `Rp ${event.price_min.toLocaleString('id-ID')}`
                            : `Rp ${event.price_min.toLocaleString('id-ID')} - Rp ${event.price_max.toLocaleString('id-ID')}`}
                        </p>
                      </div>
                    </div>
                  )}

                  {event.venue_name && (
                    <div className="flex items-start gap-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-xl flex items-center justify-center shrink-0">
                        <MapPin size={18} className="text-blue-600" />
                      </div>
                      <div>
                        <p className="text-sm text-gray-500">Venue</p>
                        <p className="font-medium text-gray-900">{event.venue_name}</p>
                        {event.address && <p className="text-sm text-gray-500">{event.address}</p>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 space-y-3">
                  {event.ticket_url && (
                    <a
                      href={event.ticket_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-3.5 rounded-full transition-colors"
                    >
                      Get Tickets
                      <ExternalLink size={16} />
                    </a>
                  )}
                  <button
                    className="flex items-center justify-center gap-2 w-full border border-gray-200 hover:border-blue-400 text-gray-700 font-medium py-3 rounded-full transition-colors"
                  >
                    <Share2 size={16} />
                    Share Event
                  </button>
                </div>
              </div>

              {/* Source Info */}
              <div className="bg-gray-50 rounded-2xl p-4">
                <p className="text-xs text-gray-400">
                  Source: <span className="capitalize">{event.source}</span> •
                  Discovered: {new Date(event.discovered_at).toLocaleDateString('id-ID')}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Related Events */}
        {relatedEvents.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Related Events</h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {relatedEvents.map((e) => (
                <EventCard key={e.id} event={e} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
