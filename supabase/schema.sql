-- YUKGO.LIVE Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============ EVENTS TABLE ============
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  event_date DATE,
  event_time TIME,
  end_date DATE,
  venue_name TEXT,
  address TEXT,
  city TEXT NOT NULL DEFAULT 'Jakarta',
  category TEXT NOT NULL DEFAULT 'other',
  price_min INTEGER DEFAULT 0,
  price_max INTEGER DEFAULT 0,
  currency TEXT DEFAULT 'IDR',
  is_free BOOLEAN DEFAULT true,
  description TEXT,
  image_url TEXT,
  ticket_url TEXT,
  source TEXT,
  source_id TEXT,
  status TEXT DEFAULT 'pending_review',
  featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ VENUES TABLE ============
CREATE TABLE IF NOT EXISTS venues (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT,
  description TEXT,
  address TEXT,
  city TEXT NOT NULL DEFAULT 'Jakarta',
  capacity INTEGER,
  price_range TEXT,
  facilities TEXT[],
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  image_url TEXT,
  google_rating DECIMAL(2,1),
  status TEXT DEFAULT 'active',
  claimed BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ VENDORS TABLE ============
CREATE TABLE IF NOT EXISTS vendors (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  type TEXT,
  description TEXT,
  city TEXT NOT NULL DEFAULT 'Jakarta',
  service_area TEXT,
  price_range TEXT,
  phone TEXT,
  email TEXT,
  website TEXT,
  instagram TEXT,
  image_url TEXT,
  rating DECIMAL(2,1),
  status TEXT DEFAULT 'active',
  claimed BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============ INDEXES ============
CREATE INDEX IF NOT EXISTS idx_events_city ON events(city);
CREATE INDEX IF NOT EXISTS idx_events_category ON events(category);
CREATE INDEX IF NOT EXISTS idx_events_date ON events(event_date);
CREATE INDEX IF NOT EXISTS idx_events_status ON events(status);
CREATE INDEX IF NOT EXISTS idx_events_featured ON events(featured);
CREATE INDEX IF NOT EXISTS idx_venues_city ON venues(city);
CREATE INDEX IF NOT EXISTS idx_vendors_city ON vendors(city);

-- ============ RLS POLICIES (Public Read) ============
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE venues ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read events" ON events FOR SELECT USING (status = 'approved' OR status = 'pending_review');
CREATE POLICY "Public read venues" ON venues FOR SELECT USING (status = 'active');
CREATE POLICY "Public read vendors" ON vendors FOR SELECT USING (status = 'active');
