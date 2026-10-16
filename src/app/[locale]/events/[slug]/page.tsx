'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { fetchEvents, getEventBySlug } from '@/data/events';
import { Event } from '@/lib/types';

export default function EventDetailPage() {
  const params = useParams();
  const slug = params?.slug as string;
  const [event, setEvent] = useState<Event | undefined>(undefined);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchEvents().then((events) => {
      setEvent(getEventBySlug(events, slug));
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">Event not found</h1>
          <p className="text-gray-500">Event yang kamu cari nggak ada.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">{event.title}</h1>
        <p className="text-gray-500 mb-6">{event.description}</p>
        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <p><strong>Tanggal:</strong> {event.date}</p>
          <p><strong>Venue:</strong> {event.venue_name}</p>
          <p><strong>Kota:</strong> {event.city}</p>
          <p><strong>Kategori:</strong> {event.category}</p>
        </div>
      </div>
    </div>
  );
}
