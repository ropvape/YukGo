# YUKGO.LIVE — AI Agent Architecture
## Sistem Otomatis untuk Event Discovery & Content Pipeline

**Author:** Dhanu (PT Peruri Properti)  
**Date:** Juni 2026  
**Version:** 1.0

---

## 1. OVERVIEW

Yukgo.live akan menjadi platform event terlengkap di Indonesia yang dijalankan
oleh 1 orang (Anda) dibantu oleh 4 AI Agent yang bekerja 24/7.

```
┌─────────────────────────────────────────────────────────────────┐
│                         YUKGO.LIVE                              │
│                    "One Person, Four Agents"                     │
│                                                                  │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐        │
│  │ AGENT 1  │  │ AGENT 2  │  │ AGENT 3  │  │ AGENT 4  │        │
│  │ Event    │  │ Content  │  │ Social   │  │ Outreach │        │
│  │ Hunter   │  │ Factory  │  │ Manager  │  │ Bot      │        │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └────┬─────┘        │
│       │              │              │              │              │
│       ▼              ▼              ▼              ▼              │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              SHARED DATABASE (Supabase)              │        │
│  │  events | venues | vendors | articles | leads        │        │
│  └─────────────────────────────────────────────────────┘        │
│       │                                                          │
│       ▼                                                          │
│  ┌─────────────────────────────────────────────────────┐        │
│  │              YUKGO.LIVE WEBSITE (Next.js)            │        │
│  │  Event Discovery | Venue Directory | Articles         │        │
│  └─────────────────────────────────────────────────────┘        │
│                                                                  │
│       ▲ USER (Anda) = Reviewer & Approver                       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 2. DATA SOURCES — TEMPAT AGENT MENGAMBIL DATA

### TIER 1: API Langsung (Paling Mudah & Legal)

| Source           | URL                              | Tipe Event              | Metode        |
|------------------|----------------------------------|-------------------------|---------------|
| Eventbrite       | eventbrite.com/d/indonesia       | Concerts, workshops     | REST API      |
| Tiket.com        | tiket.com (Things To Do)         | Attractions, events     | Affiliate API |
| Ticketmaster     | developer.ticketmaster.com       | Concerts, sports        | Discovery API |

### TIER 2: Web Scraping (Butuh Crawlee + Playwright)

| Source           | URL                              | Tipe Event              | Difficulty    |
|------------------|----------------------------------|-------------------------|---------------|
| Loket.com        | loket.com/search                 | Concerts, festivals     | Medium        |
| 10times.com      | 10times.com/jakarta-id           | B2B, trade shows        | Easy          |
| Tiketapasaja     | tiketapasaja.com                 | Local events            | Easy          |
| Goers            | goersapp.com                     | Events, attractions     | Medium        |

### TIER 3: Discovery Layer (Untuk Menemukan Event Baru)

| Source           | URL                              | Metode                  |
|------------------|----------------------------------|-------------------------|
| Google Events    | SerpApi google_events engine     | Paid API ($50/bulan)    |
| Facebook Events  | Apify Facebook Events Scraper    | Apify actor             |
| Schema.org       | Crawling situs venue langsung    | Detect Event markup     |
| Instagram        | Monitor hashtag #eventjakarta    | Manual + AI parsing     |

### TIER 4: Manual Enrichment

| Source           | Contoh                           |
|------------------|----------------------------------|
| Venue website    | JCC, ICE BSD, Hotel chains       |
| Event organizer  | Dyandra, Rajawali, Livescape     |
| Pemerintah       | enjoy.jakarta.go.id              |

---

## 3. THE FOUR AGENTS — DETAIL ARSITEKTUR

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### AGENT 1: EVENT HUNTER
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tugas: Cari, scrape, dan kumpulkan data event dari semua sumber.

```
SCHEDULE: Setiap 6 jam (4x sehari)

WORKFLOW:
  ┌─────────────┐
  │ 1. TRIGGER   │ ← Cron / QStash setiap 6 jam
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 2. FETCH     │ ← Ambil data dari Tier 1 (API) + Tier 2 (scrape)
  │    - Eventbrite API: /events/search/?location.address=Jakarta
  │    - Loket.com: scrape /search?tab=things-to-do
  │    - 10times.com: scrape /jakarta-id
  │    - Tiketapasaja.com: scrape halaman utama
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 3. EXTRACT   │ ← Parse HTML → JSON menggunakan AI (GPT-4o-mini)
  │    Input: raw HTML dari halaman event
  │    Output: {title, date, time, venue, address, category,
  │             price_min, price_max, description, image_url,
  │             ticket_url, source, source_id}
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 4. DEDUPE    │ ← Cek duplikat berdasarkan:
  │    - Judul mirip (fuzzy match, threshold 0.85)
  │    - Tanggal sama + venue sama
  │    - source_id yang sudah ada
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 5. ENRICH    │ ← Tambahkan data yang kurang:
  │    - Geocode alamat → lat/long (OpenStreetMap API)
  │    - Kategori otomatis (AI classify: music, tech, food, dll)
  │    - Estimasi harga tiket jika tidak ada
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 6. SAVE      │ ← Simpan ke Supabase (tabel: events)
  │    Status: "pending_review" (Anda approve sebelum publish)
  └──────────────┘

OUTPUT PER HARI: 50-200 event baru (tergantung musim)
```

**Technical Implementation:**
```javascript
// Agent 1: Event Hunter — Core Structure
// File: agents/event-hunter.js

import { PlaywrightCrawler } from 'crawlee';
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
const openai = new OpenAI();

// Source configs
const SOURCES = [
  {
    name: 'eventbrite',
    type: 'api',
    fetch: async () => {
      const res = await fetch(
        `https://www.eventbriteapi.com/v3/events/search/` +
        `?location.address=Jakarta&location.within=50km` +
        `&expand=venue,category&page_size=50`,
        { headers: { 'Authorization': `Bearer ${EVENTBRITE_TOKEN}` } }
      );
      return res.json();
    }
  },
  {
    name: 'loket',
    type: 'scrape',
    url: 'https://loket.com/search?tab=things-to-do',
    extract: 'playwright' // JS-rendered, needs browser
  },
  {
    name: '10times',
    type: 'scrape',
    url: 'https://10times.com/jakarta-id',
    extract: 'cheerio' // Static HTML
  }
];

// AI-powered HTML → structured data extraction
async function extractEventFromHTML(html, source) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    response_format: { type: 'json_object' },
    messages: [
      {
        role: 'system',
        content: `Extract event data from this HTML. Return JSON:
{
  "events": [
    {
      "title": "...",
      "date": "YYYY-MM-DD",
      "time": "HH:MM",
      "end_date": "YYYY-MM-DD or null",
      "venue_name": "...",
      "address": "...",
      "city": "...",
      "category": "music|tech|food|sports|arts|business|community|other",
      "price_min": 0,
      "price_max": 0,
      "currency": "IDR",
      "description": "...",
      "image_url": "...",
      "ticket_url": "...",
      "organizer": "..."
    }
  ]
}`
      },
      { role: 'user', content: html.slice(0, 30000) } // Limit token
    ]
  });
  return JSON.parse(response.choices[0].message.content);
}

// Deduplication check
async function isDuplicate(event) {
  const { data } = await supabase
    .from('events')
    .select('id')
    .or(
      `title.ilike.%${event.title}%,` +
      `and(venue_name.eq.${event.venue_name},` +
      `event_date.eq.${event.date})`
    )
    .limit(1);
  return data && data.length > 0;
}

// Main pipeline
async function runEventHunter() {
  console.log(`[EventHunter] Starting at ${new Date().toISOString()}`);
  
  let totalNew = 0;
  
  for (const source of SOURCES) {
    try {
      let rawData;
      
      if (source.type === 'api') {
        rawData = await source.fetch();
      } else {
        // Scrape with Crawlee
        rawData = await scrapeWithCrawlee(source.url, source.extract);
      }
      
      // AI extraction
      const { events } = await extractEventFromHTML(rawData, source.name);
      
      for (const event of events) {
        if (await isDuplicate(event)) continue;
        
        // Save to database
        await supabase.from('events').insert({
          title: event.title,
          event_date: event.date,
          event_time: event.time,
          end_date: event.end_date,
          venue_name: event.venue_name,
          address: event.address,
          city: event.city || 'Jakarta',
          category: event.category,
          price_min: event.price_min,
          price_max: event.price_max,
          currency: event.currency || 'IDR',
          description: event.description,
          image_url: event.image_url,
          ticket_url: event.ticket_url,
          organizer: event.organizer,
          source: source.name,
          status: 'pending_review',
          discovered_at: new Date().toISOString()
        });
        
        totalNew++;
      }
      
      console.log(`[EventHunter] ${source.name}: ${events.length} events processed`);
    } catch (err) {
      console.error(`[EventHunter] ERROR on ${source.name}:`, err.message);
    }
  }
  
  console.log(`[EventHunter] Done. ${totalNew} new events added.`);
  return { newEvents: totalNew };
}
```

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### AGENT 2: CONTENT FACTORY
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tugas: Ubah data event mentah jadi konten yang menarik dan SEO-friendly.

```
SCHEDULE: Setiap 12 jam (2x sehari) atau trigger setelah Agent 1 selesai

WORKFLOW:
  ┌─────────────┐
  │ 1. TRIGGER   │ ← Setelah Agent 1 selesai, atau cron 12 jam
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 2. QUERY     │ ← Ambil event berstatus "pending_review" dari DB
  │              │   Prioritas: event minggu ini, event populer
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 3. GENERATE  │ ← AI buat konten untuk SETIAP event:
  │    a. SEO title & meta description
  │    b. Rich description (200-500 kata, engaging)
  │    c. "What to expect" section
  │    d. Venue info snippet
  │    e. Related events suggestion
  │    f. Social media caption (IG, TikTok, Twitter)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 4. CURATE    │ ← Buat curated articles:
  │    a. "X Event Seru di Jakarta Minggu Ini" (weekly)
  │    b. "Festival Musik Terbaik Q3 2026" (monthly)
  │    c. "Venue Terbaru di Jakarta" (bi-weekly)
  │    d. "Event Gratis Bulan Ini" (monthly)
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 5. SAVE      │ ← Simpan ke DB:
  │    - Update event: status → "content_ready"
  │    - Insert articles baru
  │    - Insert social_posts (siap di-publish Agent 3)
  └──────────────┘
```

**Content Generation Prompt Template:**
```javascript
const ARTICLE_PROMPT = `You are a Jakarta-based event journalist writing for 
yukgo.live, Indonesia's event discovery platform.

Write an engaging article about this event in BAHASA INDONESIA:

Event: {title}
Date: {date} at {time}
Venue: {venue}, {address}
Price: {price_range}
Category: {category}
Description: {raw_description}

Write in this structure:
1. HEADLINE: Catchy, SEO-friendly, max 60 chars
2. LEAD PARAGRAPH: Hook the reader (who, what, when, where, why should they go)
3. WHAT TO EXPECT: 3-4 bullet points of what attendees can look forward to
4. VENUE INFO: Brief about the venue (capacity, facilities, parking)
5. TICKET INFO: Price tiers, where to buy, early bird deals
6. PRO TIPS: 2-3 practical tips (transport, what to wear, what to bring)

Tone: Exciting but informative. Like a friend who always knows the best events.
Use emoji sparingly (2-3 max).
Total length: 300-500 words.

Also generate:
- SEO title (max 60 chars)
- Meta description (max 155 chars)
- Instagram caption (max 2200 chars, with hashtags)
- TikTok caption (max 150 chars)
`;
```

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### AGENT 3: SOCIAL MEDIA MANAGER
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tugas: Publish konten ke social media secara otomatis.

```
SCHEDULE: 3x sehari (pagi 8am, siang 12pm, sore 5pm — peak engagement)

WORKFLOW:
  ┌─────────────┐
  │ 1. TRIGGER   │ ← Cron 3x sehari
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 2. PICK      │ ← Ambil social_posts yang belum di-publish
  │              │   Prioritas: event terdekat, weekend events
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 3. ADAPT     │ ← Sesuaikan format per platform:
  │    - Instagram: caption + hashtags + image
  │    - TikTok: short caption (jika ada video)
  │    - Twitter/X: concise + link
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 4. PUBLISH   │ ← Post ke platform via API:
  │    - Instagram: Meta Graph API (Business Account)
  │    - TikTok: TikTok Marketing API
  │    - Twitter/X: Twitter API v2
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 5. TRACK     │ ← Monitor engagement:
  │    - Likes, comments, shares, saves
  │    - Update DB dengan metrics
  │    - Flag high-performing content untuk repost
  └──────────────┘
```

**CATATAN PENTING:** 
- Instagram & TikTok API butuh Business Account + API approval
- Alternatif: gunakan tools seperti Buffer, Later, atau Hootsuite API
- Untuk MVP: bisa manual approval dulu, agent siapkan draft, Anda post

---

### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
### AGENT 4: OUTREACH BOT
### ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Tugas: Cari venue & vendor baru, kirim undangan untuk listing di yukgo.live.

```
SCHEDULE: Setiap hari (1x sehari, weekday only)

WORKFLOW:
  ┌─────────────┐
  │ 1. DISCOVER  │ ← Cari venue/vendor baru:
  │    - Google Maps API: cari "venue Jakarta", "wedding venue"
  │    - Instagram: cari akun venue/vendor populer
  │    - Dari data event: venue yang belum ada di DB kita
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 2. ENRICH    │ ← Kumpulkan data:
  │    - Nama, alamat, telepon, email, IG, website
  │    - Tipe venue, kapasitas, harga sewa
  │    - Rating Google, jumlah review
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 3. DRAFT     │ ← Buat email/DM personal:
  │    - Perkenalkan yukgo.live
  │    - Tawarkan listing GRATIS (free tier)
  │    - Highlight benefit: exposure ke event-goers
  │    - Include link untuk claim listing
  └──────┬──────┘
         ▼
  ┌─────────────┐
  │ 4. QUEUE     │ ← Simpan ke outreach_queue
  │              │   Anda review & approve sebelum kirim
  │              │   (jangan auto-kirim, spam = bad reputation)
  └──────────────┘

TARGET: 10-20 outreach per hari → 200-400 per bulan
CONVERSION TARGET: 5-10% → 10-40 venue/vendor baru per bulan
```

---

## 4. TECH STACK

```
┌─────────────────────────────────────────────────────────────┐
│                     TECHNOLOGY STACK                         │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  FRONTEND                                                    │
│  ├─ Next.js 15 (React)         → Website yukgo.live         │
│  ├─ Tailwind CSS               → Styling                    │
│  └─ Vercel                     → Hosting & Deploy           │
│                                                              │
│  BACKEND                                                     │
│  ├─ Next.js API Routes         → Backend API                │
│  ├─ Supabase (PostgreSQL)      → Database + Auth + Storage  │
│  └─ Upstash (Redis)            → Queue & Caching            │
│                                                              │
│  AI & SCRAPING                                               │
│  ├─ OpenAI GPT-4o-mini         → Content generation         │
│  ├─ Crawlee + Playwright       → Web scraping               │
│  └─ Cheerio                    → HTML parsing (static pages)│
│                                                              │
│  SCHEDULING                                                  │
│  ├─ Upstash QStash             → Serverless cron jobs       │
│  └─ Vercel Cron                → Backup scheduling          │
│                                                              │
│  EXTERNAL APIs                                               │
│  ├─ Eventbrite API             → Event data                 │
│  ├─ Google Maps API            → Venue geocoding            │
│  ├─ SerpApi                    → Google Events discovery    │
│  └─ OpenStreetMap / Nominatim  → Free geocoding fallback    │
│                                                              │
│  MONITORING                                                  │
│  ├─ Vercel Analytics           → Website traffic            │
│  └─ Custom dashboard           → Agent health & metrics     │
│                                                              │
│  COST ESTIMATE (Monthly)                                     │
│  ├─ Vercel Pro                  $20                          │
│  ├─ Supabase Pro                $25                          │
│  ├─ OpenAI API (GPT-4o-mini)    $10-30                       │
│  ├─ Upstash QStash              $10                          │
│  ├─ SerpApi                     $50                          │
│  ├─ Domain (yukgo.live)         $1                           │
│  ├─ Proxy (if needed)           $0-75                        │
│  └─ TOTAL                       ~$120-210/bulan (~Rp 2-3jt) │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 5. DATABASE SCHEMA (Supabase/PostgreSQL)

```sql
-- ============================================
-- YUKGO.LIVE DATABASE SCHEMA
-- ============================================

-- EVENTS: Semua event yang di-crawl
CREATE TABLE events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  event_date DATE NOT NULL,
  event_time TIME,
  end_date DATE,
  end_time TIME,
  
  -- Venue info
  venue_id UUID REFERENCES venues(id),
  venue_name VARCHAR(255),
  address TEXT,
  city VARCHAR(100) DEFAULT 'Jakarta',
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  -- Event details
  category VARCHAR(50), -- music, tech, food, sports, arts, business, community
  subcategory VARCHAR(50),
  description TEXT,
  rich_content TEXT, -- AI-generated rich HTML content
  
  -- Pricing
  price_min DECIMAL(12, 2) DEFAULT 0,
  price_max DECIMAL(12, 2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'IDR',
  is_free BOOLEAN DEFAULT false,
  
  -- Media
  image_url TEXT,
  gallery_urls JSONB DEFAULT '[]',
  
  -- Links
  ticket_url TEXT,
  source VARCHAR(50), -- eventbrite, loket, 10times, manual
  source_id VARCHAR(255),
  source_url TEXT,
  
  -- Metadata
  organizer VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending_review', -- pending_review, content_ready, published, archived
  featured BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  
  -- SEO
  seo_title VARCHAR(60),
  meta_description VARCHAR(155),
  
  -- Timestamps
  discovered_at TIMESTAMPTZ DEFAULT NOW(),
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VENUES: Tempat/event space
CREATE TABLE venues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  type VARCHAR(50), -- hotel, convention_center, outdoor, restaurant, club, gallery
  description TEXT,
  
  address TEXT,
  city VARCHAR(100),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  
  capacity INTEGER,
  price_range VARCHAR(100), -- "Rp 5-50 juta"
  facilities JSONB DEFAULT '[]', -- ["parking", "wifi", "sound_system", "catering"]
  
  phone VARCHAR(30),
  email VARCHAR(255),
  website TEXT,
  instagram VARCHAR(100),
  
  image_url TEXT,
  gallery_urls JSONB DEFAULT '[]',
  
  google_rating DECIMAL(2, 1),
  google_review_count INTEGER,
  
  status VARCHAR(20) DEFAULT 'active',
  claimed BOOLEAN DEFAULT false, -- venue owner sudah claim listing
  featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- VENDORS: Jasa event (catering, dekorasi, fotografer, dll)
CREATE TABLE vendors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  type VARCHAR(50), -- catering, decoration, photography, mc, sound_system, lighting
  description TEXT,
  
  city VARCHAR(100),
  service_area JSONB DEFAULT '[]', -- ["Jakarta", "Bekasi", "Tangerang"]
  
  price_range VARCHAR(100),
  min_order DECIMAL(12, 2),
  
  phone VARCHAR(30),
  email VARCHAR(255),
  website TEXT,
  instagram VARCHAR(100),
  
  image_url TEXT,
  portfolio_urls JSONB DEFAULT '[]',
  
  rating DECIMAL(2, 1),
  review_count INTEGER,
  
  status VARCHAR(20) DEFAULT 'active',
  claimed BOOLEAN DEFAULT false,
  featured BOOLEAN DEFAULT false,
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ARTICLES: Konten editorial
CREATE TABLE articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  slug VARCHAR(255) UNIQUE,
  content TEXT NOT NULL,
  excerpt VARCHAR(500),
  
  type VARCHAR(30), -- event_review, weekly_roundup, venue_spotlight, guide
  category VARCHAR(50),
  
  image_url TEXT,
  author VARCHAR(100) DEFAULT 'Yukgo Team',
  
  seo_title VARCHAR(60),
  meta_description VARCHAR(155),
  
  status VARCHAR(20) DEFAULT 'draft', -- draft, published
  view_count INTEGER DEFAULT 0,
  
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- SOCIAL POSTS: Queue untuk social media
CREATE TABLE social_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform VARCHAR(20), -- instagram, tiktok, twitter
  content_type VARCHAR(20), -- post, story, reel
  
  caption TEXT NOT NULL,
  hashtags TEXT,
  image_url TEXT,
  video_url TEXT,
  link TEXT,
  
  related_event_id UUID REFERENCES events(id),
  related_article_id UUID REFERENCES articles(id),
  
  status VARCHAR(20) DEFAULT 'draft', -- draft, approved, posted, failed
  scheduled_at TIMESTAMPTZ,
  posted_at TIMESTAMPTZ,
  
  -- Engagement metrics (setelah post)
  likes INTEGER DEFAULT 0,
  comments INTEGER DEFAULT 0,
  shares INTEGER DEFAULT 0,
  saves INTEGER DEFAULT 0,
  reach INTEGER DEFAULT 0,
  
  external_post_id VARCHAR(255), -- ID post di platform
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- OUTREACH: Pipeline venue/vendor outreach
CREATE TABLE outreach (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type VARCHAR(10), -- venue, vendor
  target_name VARCHAR(255),
  target_email VARCHAR(255),
  target_phone VARCHAR(30),
  target_instagram VARCHAR(100),
  
  venue_id UUID REFERENCES venues(id),
  vendor_id UUID REFERENCES vendors(id),
  
  channel VARCHAR(20), -- email, instagram_dm, whatsapp, phone
  message_template TEXT,
  message_sent TEXT,
  
  status VARCHAR(20) DEFAULT 'draft', -- draft, approved, sent, responded, converted, rejected
  sent_at TIMESTAMPTZ,
  responded_at TIMESTAMPTZ,
  notes TEXT,
  
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- AGENT LOGS: Monitoring agent activity
CREATE TABLE agent_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  agent_name VARCHAR(50), -- event_hunter, content_factory, social_manager, outreach_bot
  action VARCHAR(50),
  details JSONB,
  status VARCHAR(20), -- success, error, warning
  duration_ms INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- INDEXES
CREATE INDEX idx_events_date ON events(event_date);
CREATE INDEX idx_events_city ON events(city);
CREATE INDEX idx_events_category ON events(category);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_featured ON events(featured);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_type ON venues(type);
CREATE INDEX idx_vendors_type ON vendors(type);
CREATE INDEX idx_social_status ON social_posts(status);
CREATE INDEX idx_outreach_status ON outreach(status);
```

---

## 6. YOUR DAILY WORKFLOW (Anda = 1 Orang)

```
PAGI (30 menit):
  ┌────────────────────────────────────────────┐
  │ 1. Buka Dashboard yukgo.live/admin         │
  │ 2. Review event baru dari Agent 1          │
  │    → Approve / Reject / Edit               │
  │ 3. Review artikel dari Agent 2             │
  │    → Approve / Edit / Publish              │
  │ 4. Cek social media metrics dari Agent 3   │
  └────────────────────────────────────────────┘

SIANG (15 menit):
  ┌────────────────────────────────────────────┐
  │ 1. Review outreach queue dari Agent 4      │
  │    → Approve email yang akan dikirim       │
  │ 2. Reply venue/vendor yang sudah respond   │
  └────────────────────────────────────────────┘

SORE (15 menit):
  ┌────────────────────────────────────────────┐
  │ 1. Check trending events / news            │
  │ 2. Tambahkan event manual jika ada         │
  │ 3. Review weekly analytics                 │
  └────────────────────────────────────────────┘

TOTAL WAKTU: ~1 jam/hari
SISANYA: Agent bekerja otomatis 24/7
```

---

## 7. PHASED IMPLEMENTATION PLAN

### FASE 1: FOUNDATION (Minggu 1-2)
```
□ Setup Next.js project
□ Setup Supabase database (jalankan schema di atas)
□ Deploy landing page yang sudah ada ke Next.js
□ Build admin dashboard (basic: CRUD events)
□ Setup Eventbrite API integration (Agent 1 subset)
```

### FASE 2: AGENT 1 LIVE (Minggu 3-4)
```
□ Implement Event Hunter (API sources: Eventbrite)
□ Add scraping: Loket.com, 10times.com
□ AI extraction pipeline (GPT-4o-mini)
□ Deduplication & enrichment logic
□ Cron scheduling (QStash)
□ Manual review UI di admin dashboard
```

### FASE 3: CONTENT & DISPLAY (Minggu 5-6)
```
□ Build public-facing event listing page
□ Build venue directory page
□ Implement Content Factory agent
□ SEO optimization (meta tags, sitemap)
□ Search & filter functionality
```

### FASE 4: SOCIAL & OUTREACH (Minggu 7-8)
```
□ Implement Social Media Manager agent
□ Setup Instagram Business API
□ Implement Outreach Bot agent
□ Email templates & tracking
□ Analytics dashboard
```

### FASE 5: MONETIZE (Bulan 3+)
```
□ Featured listing system
□ Subscription tiers for venues/vendors
□ Ticketing integration (if applicable)
□ B2B data reports
□ Landing page untuk advertisers
```

---

## 8. COST BREAKDOWN (Realistis untuk Solo Founder)

```
BULAN 1-2 (Build Phase):
  Domain yukgo.live                     Rp 150rb/tahun
  Vercel Hobby (free tier)              Rp 0
  Supabase Free tier                    Rp 0
  OpenAI API (testing)                  Rp 200rb
  ─────────────────────────────────────
  TOTAL: ~Rp 350rb

BULAN 3+ (Running Phase):
  Vercel Pro                             Rp 350rb/bulan
  Supabase Pro                           Rp 400rb/bulan
  OpenAI API (GPT-4o-mini, ~10k calls)   Rp 300rb/bulan
  Upstash QStash                         Rp 150rb/bulan
  SerpApi (optional)                     Rp 800rb/bulan
  ─────────────────────────────────────
  TOTAL: ~Rp 2-2.5jt/bulan

BREAK-EVEN: ~5 venue subscribers @ Rp 500rb/bulan
```

---

## 9. RISK & MITIGATION

| Risk | Impact | Mitigation |
|------|--------|------------|
| Website di-block scraper | Data pipeline mati | Multi-source, fallback ke API |
| OpenAI cost naik | Budget blown | Gunakan GPT-4o-mini (murah), cache results |
| Kompetitor muncul | Market share hilang | Speed to market, data quality |
| Venue tidak mau listing | Supply kosong | Free tier dulu, manual outreach personal |
| Content AI detectable | Trust issue | Human review semua content, personal touch |

---

## 10. SUCCESS METRICS (90 Hari Pertama)

```
CONTENT:
  ✅ 500+ event ter-crawl dan ter-publish
  ✅ 100+ venue ter-listing
  ✅ 50+ artikel ter-publish
  ✅ 50+ post di social media

TRAFFIC:
  ✅ 10,000 visitor/bulan
  ✅ 2,000 email subscriber
  ✅ 500 Instagram followers

REVENUE:
  ✅ 5 paying venue subscribers
  ✅ Rp 2.5jt/bulan recurring revenue
```

---

*Document ini akan di-update seiring progress implementasi.*
*Next step: Build prototype Agent 1 (Event Hunter).*
