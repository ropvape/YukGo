import { Event } from '@/lib/types';

// Fetch events dari Supabase via API
export async function fetchEvents(): Promise<Event[]> {
  try {
    const res = await fetch('/api/events', { cache: 'no-store' });
    const json = await res.json();
    
    if (!json.success || !json.data) return [];
    
    return json.data.map((e: any) => ({
      id: e.id,
      title: e.title,
      slug: e.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
      date: e.date,
      time: '',
      end_date: e.date,
      venue_name: e.venue,
      address: null,
      city: e.city || '',
      category: e.category || 'other',
      price_min: 0,
      price_max: 0,
      currency: 'IDR',
      description: '',
      image_url: '',
      ticket_url: e.source_url || '',
      organizer: null,
      source: 'yukgo',
      source_id: e.id,
      discovered_at: e.created_at,
      status: 'published',
      featured: false,
      view_count: 0,
      is_free: true,
    }));
  } catch (err) {
    console.error('Failed to fetch events:', err);
    return [];
  }
}

// Fallback kalau API belum jalan
export const sampleEvents: Event[] = [];

export function getFeaturedEvents(events: Event[]): Event[] {
  return events.filter(e => e.featured);
}

export function getEventBySlug(events: Event[], slug: string): Event | undefined {
  return events.find(e => e.slug === slug);
}

export function searchEvents(events: Event[], query: string): Event[] {
  const q = query.toLowerCase();
  return events.filter(e =>
    e.title.toLowerCase().includes(q) ||
    e.city.toLowerCase().includes(q) ||
    e.category.toLowerCase().includes(q)
  );
}
