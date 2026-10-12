export interface Event {
  id: string;
  title: string;
  slug: string;
  date: string;
  time: string;
  end_date: string;
  venue_name: string | null;
  address: string | null;
  city: string;
  category: string;
  price_min: number;
  price_max: number;
  currency: string;
  description: string;
  image_url: string;
  ticket_url: string;
  organizer: string | null;
  source: string;
  source_id: string;
  discovered_at: string;
  status: string;
  featured?: boolean;
  view_count?: number;
  is_free?: boolean;
}

export interface Venue {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  address: string;
  city: string;
  capacity: number | null;
  price_range: string;
  facilities: string[];
  phone: string;
  email: string;
  website: string;
  instagram: string;
  image_url: string;
  google_rating: number | null;
  status: string;
  claimed: boolean;
  featured: boolean;
}

export interface Vendor {
  id: string;
  name: string;
  slug: string;
  type: string;
  description: string;
  city: string;
  service_area: string;
  price_range: string;
  phone: string;
  email: string;
  website: string;
  instagram: string;
  image_url: string;
  rating: number | null;
  status: string;
  claimed: boolean;
  featured: boolean;
}

export const CATEGORIES = [
  { id: 'all', name: 'All Events', icon: '🎯' },
  { id: 'tech', name: 'Tech', icon: '💻' },
  { id: 'business', name: 'Business', icon: '💼' },
  { id: 'arts', name: 'Arts & Culture', icon: '🎨' },
  { id: 'music', name: 'Music', icon: '🎵' },
  { id: 'food', name: 'Food & Drink', icon: '🍜' },
  { id: 'sports', name: 'Sports', icon: '⚽' },
  { id: 'education', name: 'Education', icon: '📚' },
  { id: 'nightlife', name: 'Nightlife', icon: '🌙' },
  { id: 'community', name: 'Community', icon: '🤝' },
  { id: 'other', name: 'Other', icon: '📌' },
] as const;

export type CategoryId = (typeof CATEGORIES)[number]['id'];

export const CITIES = [
  'Jakarta',
  'Bandung',
  'Surabaya',
  'Bali',
  'Yogyakarta',
  'Medan',
  'Semarang',
  'Makassar',
] as const;
