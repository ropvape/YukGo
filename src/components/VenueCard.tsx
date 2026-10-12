'use client';
import { Link } from '@/i18n/routing';
import { MapPin, Star, Users } from 'lucide-react';
import { useLocale } from 'next-intl';

interface VenueCardProps {
  name: string;
  slug: string;
  type: string;
  city: string;
  address: string;
  image_url: string;
  capacity?: number | null;
  google_rating?: number | null;
  featured?: boolean;
}

export default function VenueCard({ name, slug, type, city, address, image_url, capacity, google_rating, featured }: VenueCardProps) {
  const locale = useLocale();

  return (
    <Link href={`/venues#${slug}`} className="group">
      <article className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300">
        <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
          <img
            src={image_url}
            alt={name}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            onError={(e) => {
              (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" fill="%23f3f4f6"><rect width="400" height="225"/><text x="50%" y="50%" font-family="sans-serif" font-size="18" fill="%239ca3af" text-anchor="middle" dy=".3em">Venue</text></svg>';
            }}
          />
          {featured && (
            <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
              ★ {locale === 'id' ? 'Unggulan' : 'Featured'}
            </div>
          )}
        </div>
        <div className="p-4">
          <div className="text-xs font-medium text-blue-600 uppercase tracking-wide mb-1">{type}</div>
          <h3 className="font-semibold text-gray-900 text-base mb-1 group-hover:text-blue-700 transition-colors">{name}</h3>
          <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-2">
            <MapPin size={14} />
            <span>{city}</span>
          </div>
          <div className="flex items-center gap-4 text-sm">
            {google_rating && (
              <div className="flex items-center gap-1 text-blue-600">
                <Star size={14} fill="currentColor" />
                <span className="font-medium">{google_rating}</span>
              </div>
            )}
            {capacity && (
              <div className="flex items-center gap-1 text-gray-500">
                <Users size={14} />
                <span>{capacity.toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </article>
    </Link>
  );
}
