'use client';

import { useState } from 'react';
import { Building2, MapPin, Star, Users, Search, Filter } from 'lucide-react';

const SAMPLE_VENUES = [
  {
    id: '1',
    name: 'Jakarta Convention Center (JCC)',
    slug: 'jakarta-convention-center',
    type: 'Convention Center',
    city: 'Jakarta',
    address: 'Jalan Gatot Subroto, Senayan',
    capacity: 5000,
    google_rating: 4.5,
    image_url: 'https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=600&h=400&fit=crop',
    featured: true,
    facilities: ['Parking', 'WiFi', 'Catering', 'AV Equipment'],
  },
  {
    id: '2',
    name: 'ICE BSD City',
    slug: 'ice-bsd-city',
    type: 'Exhibition Center',
    city: 'Tangerang',
    address: 'Jl. BSD Grand Boulevard, BSD City',
    capacity: 10000,
    google_rating: 4.4,
    image_url: 'https://images.unsplash.com/photo-1505236858219-8359eb29e329?w=600&h=400&fit=crop',
    featured: true,
    facilities: ['Parking', 'WiFi', 'Food Court', 'Loading Dock'],
  },
  {
    id: '3',
    name: 'The Ritz-Carlton Jakarta Pacific Place',
    slug: 'ritz-carlton-jakarta',
    type: 'Hotel Ballroom',
    city: 'Jakarta',
    address: 'Jl. Jend. Sudirman Kav. 52-53',
    capacity: 1200,
    google_rating: 4.7,
    image_url: 'https://images.unsplash.com/photo-1519167758481-83f550bb49b3?w=600&h=400&fit=crop',
    featured: true,
    facilities: ['Parking', 'WiFi', 'Catering', 'Accommodation'],
  },
  {
    id: '4',
    name: 'JIExpo Kemayoran',
    slug: 'jiexpo-kemayoran',
    type: 'Exhibition Center',
    city: 'Jakarta',
    address: 'Jl. Benyamin Suaeb, Kemayoran',
    capacity: 8000,
    google_rating: 4.2,
    image_url: 'https://images.unsplash.com/photo-1492684223066-81342ee5ff30?w=600&h=400&fit=crop',
    featured: false,
    facilities: ['Parking', 'WiFi', 'Loading Dock', 'Outdoor Space'],
  },
  {
    id: '5',
    name: 'AYANA Midplaza Jakarta',
    slug: 'ayana-midplaza',
    type: 'Hotel Ballroom',
    city: 'Jakarta',
    address: 'Jl. Jend. Sudirman Kav. 10-11',
    capacity: 800,
    google_rating: 4.5,
    image_url: 'https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=600&h=400&fit=crop',
    featured: false,
    facilities: ['Parking', 'WiFi', 'Catering', 'Spa'],
  },
  {
    id: '6',
    name: 'JW Marriott Jakarta',
    slug: 'jw-marriott-jakarta',
    type: 'Hotel Ballroom',
    city: 'Jakarta',
    address: 'Jl. DR. Ide Anak Agung Gde Agung',
    capacity: 1500,
    google_rating: 4.6,
    image_url: 'https://images.unsplash.com/photo-1566073771259-6a8506099945?w=600&h=400&fit=crop',
    featured: true,
    facilities: ['Parking', 'WiFi', 'Catering', 'Accommodation', 'Pool'],
  },
];

const VENUE_TYPES = ['All Types', 'Convention Center', 'Exhibition Center', 'Hotel Ballroom', 'Outdoor Venue', 'Restaurant'];

export default function VenuesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedType, setSelectedType] = useState('All Types');
  const [selectedCity, setSelectedCity] = useState('all');

  const filteredVenues = SAMPLE_VENUES.filter(venue => {
    const matchesSearch = !searchQuery ||
      venue.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      venue.city.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = selectedType === 'All Types' || venue.type === selectedType;
    const matchesCity = selectedCity === 'all' || venue.city === selectedCity;
    return matchesSearch && matchesType && matchesCity;
  });

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-2">Venues</h1>
          <p className="text-gray-500">
            Find the perfect venue for your next event in Indonesia
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search venues..."
              className="w-full pl-11 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {VENUE_TYPES.map(type => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
          <select
            value={selectedCity}
            onChange={(e) => setSelectedCity(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl bg-white text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Cities</option>
            <option value="Jakarta">Jakarta</option>
            <option value="Tangerang">Tangerang</option>
            <option value="Bandung">Bandung</option>
            <option value="Bali">Bali</option>
          </select>
        </div>

        {/* Results */}
        <div className="mb-4 text-sm text-gray-500">
          {filteredVenues.length} venues found
        </div>

        {/* Venues Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredVenues.map((venue) => (
            <article
              key={venue.id}
              id={venue.slug}
              className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-blue-200 transition-all duration-300"
            >
              <div className="relative aspect-[16/9] overflow-hidden bg-gray-100">
                <img
                  src={venue.image_url}
                  alt={venue.name}
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src = 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="225" fill="%23f3f4f6"><rect width="400" height="225"/><text x="50%" y="50%" font-family="sans-serif" font-size="18" fill="%239ca3af" text-anchor="middle" dy=".3em">Venue</text></svg>';
                  }}
                />
                {venue.featured && (
                  <div className="absolute top-3 right-3 bg-blue-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    ★ Featured
                  </div>
                )}
                <div className="absolute bottom-3 left-3 bg-black/70 text-white text-xs font-medium px-2.5 py-1 rounded-full">
                  {venue.type}
                </div>
              </div>

              <div className="p-5">
                <h3 className="font-semibold text-gray-900 text-lg mb-2">{venue.name}</h3>

                <div className="flex items-center gap-1.5 text-sm text-gray-500 mb-3">
                  <MapPin size={14} />
                  <span>{venue.address}, {venue.city}</span>
                </div>

                <div className="flex items-center gap-4 mb-4">
                  {venue.google_rating && (
                    <div className="flex items-center gap-1">
                      <Star size={14} className="text-blue-600 fill-blue-500" />
                      <span className="text-sm font-medium text-gray-900">{venue.google_rating}</span>
                    </div>
                  )}
                  {venue.capacity && (
                    <div className="flex items-center gap-1 text-gray-500">
                      <Users size={14} />
                      <span className="text-sm">{venue.capacity.toLocaleString()} capacity</span>
                    </div>
                  )}
                </div>

                {/* Facilities */}
                <div className="flex flex-wrap gap-1.5">
                  {venue.facilities.slice(0, 3).map((f) => (
                    <span key={f} className="px-2 py-0.5 bg-gray-100 text-gray-600 text-xs rounded-full">
                      {f}
                    </span>
                  ))}
                  {venue.facilities.length > 3 && (
                    <span className="px-2 py-0.5 bg-gray-100 text-gray-500 text-xs rounded-full">
                      +{venue.facilities.length - 3} more
                    </span>
                  )}
                </div>
              </div>
            </article>
          ))}
        </div>

        {filteredVenues.length === 0 && (
          <div className="text-center py-20">
            <div className="text-5xl mb-4">🏛️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No venues found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
          </div>
        )}

        {/* CTA */}
        <div className="mt-16 bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl p-8 md:p-12 text-center text-white">
          <div className="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Building2 size={28} className="text-black" />
          </div>
          <h2 className="text-2xl md:text-3xl font-bold mb-3">Own a Venue?</h2>
          <p className="text-gray-300 max-w-lg mx-auto mb-6">
            List your venue on yukgo.live and reach thousands of event organizers looking for the perfect space.
          </p>
          <button className="bg-blue-500 hover:bg-blue-600 text-white font-semibold px-8 py-3.5 rounded-full transition-colors">
            List Your Venue
          </button>
        </div>
      </div>
    </div>
  );
}
