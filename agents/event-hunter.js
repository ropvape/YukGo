#!/usr/bin/env node

/**
 * YUKGO.LIVE — Agent 1: EVENT HUNTER v2
 * ========================================
 * Automated event discovery & data collection pipeline.
 * 
 * Sources:
 *   1. Eventbrite (Indonesia events — JSON-LD scraping)
 *   2. 10times.com (B2B/trade shows — rotating UA)
 *   3. Loket.com (concerts/festivals — REST API)
 *   4. Tiketapasaja.com (local events)
 *   5. Goers / goersapp.com (local events — SPA scraping)
 *   6. indonesia.travel (government events — HTML scraping)
 *   7. Meetup.com (community events — GraphQL API)
 *   8. Social Media (Instagram/Threads/TikTok — Google search)
 *   9. Tiket.com (Indonesian ticketing platform)
 *  10. Kumpul.co (Indonesian community events)
 *
 * Usage:
 *   node agents/event-hunter.js              # Full run (all sources, all cities)
 *   node agents/event-hunter.js --test       # Test run (1 source, 5 events)
 *   node agents/event-hunter.js --source=eventbrite
 *   node agents/event-hunter.js --city=Surabaya
 *   node agents/event-hunter.js --cities=all # All cities
 */

import * as cheerio from 'cheerio';

// ──────────────────────────────────────────
// CONFIGURATION
// ──────────────────────────────────────────

const CONFIG = {
  cities: ['Jakarta', 'Surabaya', 'Bandung', 'Bali', 'Yogyakarta'],
  defaultCity: 'Jakarta',
  maxEventsPerSource: 100,
  requestDelay: 1500,
  
  // Rotating user agents to avoid 403 blocks
  userAgents: [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:128.0) Gecko/20100101 Firefox/128.0',
    'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  ],
  
  outputDir: './data/events',
};

function getRandomUA() {
  return CONFIG.userAgents[Math.floor(Math.random() * CONFIG.userAgents.length)];
}

// ──────────────────────────────────────────
// UTILITY FUNCTIONS
// ──────────────────────────────────────────

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg === '--test') args.test = true;
    else if (arg.startsWith('--source=')) args.source = arg.split('=')[1];
    else if (arg.startsWith('--city=')) args.city = arg.split('=')[1];
    else if (arg === '--cities=all') args.allCities = true;
  });
  return args;
}

function log(agent, message, level = 'INFO') {
  const timestamp = new Date().toISOString().slice(11, 19);
  const prefix = { 'INFO': '✓', 'WARN': '⚠', 'ERROR': '✗', 'DATA': '→' }[level] || '•';
  console.log(`[${timestamp}] ${prefix} [${agent}] ${message}`);
}

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

function slugify(text) {
  return text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/[\s_]+/g, '-').replace(/^-+|-+$/g, '').slice(0, 100);
}

function estimatePrice(text) {
  if (!text) return { min: 0, max: 0 };
  if (/gratis|free|tanpa biaya/i.test(text)) return { min: 0, max: 0 };
  const matches = text.match(/[\d.,]+/g);
  if (!matches) return { min: 0, max: 0 };
  const prices = matches.map(m => {
    let n = parseInt(m.replace(/[.,]/g, ''));
    if (/k$/i.test(text)) n *= 1000;
    return n;
  }).filter(n => n > 0 && n < 100000000);
  if (prices.length === 0) return { min: 0, max: 0 };
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

function categorizeEvent(title, description = '') {
  const text = `${title} ${description}`.toLowerCase();
  const categories = {
    music: /music|musik|concert|konser|festival|dj|band|gig|live music|acoustic/i,
    tech: /tech|teknologi|conference|summit|hackathon|startup|coding|ai|blockchain/i,
    food: /food|culinary|kuliner|food festival|taste|chef|cooking|makan/i,
    sports: /sport|olahraga|marathon|running|football|basketball|yoga|fitness|race/i,
    arts: /art|seni|exhibition|pameran|gallery|theater|teater|dance|tari|film|movie/i,
    business: /business|bisnis|networking|entrepreneur|investor|workshop|training/i,
    community: /community|komunitas|meetup|gathering|reunion|charity|volunteer/i,
    nightlife: /nightlife|party|club|clubbing|bar|lounge|halloween|new year/i,
    education: /education|edukasi|seminar|kuliah|pelatihan|belajar|class|kelas/i,
    fashion: /fashion|mode|runway|show|design|clothing|style/i,
  };
  for (const [cat, regex] of Object.entries(categories)) {
    if (regex.test(text)) return cat;
  }
  return 'other';
}

// ──────────────────────────────────────────
// HTTP HELPERS
// ──────────────────────────────────────────

async function fetchPage(url, extraHeaders = {}) {
  const ua = getRandomUA();
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
        'Accept-Language': 'id-ID,id;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'sec-ch-ua': '"Chromium";v="126", "Google Chrome";v="126"',
        'sec-ch-ua-mobile': '?0',
        'sec-ch-ua-platform': '"Windows"',
        'sec-fetch-dest': 'document',
        'sec-fetch-mode': 'navigate',
        'sec-fetch-site': 'none',
        'sec-fetch-user': '?1',
        'upgrade-insecure-requests': '1',
        'Cache-Control': 'no-cache',
        ...extraHeaders,
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(20000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    return await response.text();
  } catch (err) {
    throw new Error(`Failed to fetch ${url}: ${err.message}`);
  }
}

async function fetchJSON(url, headers = {}) {
  const response = await fetch(url, {
    headers: { 'User-Agent': getRandomUA(), 'Accept': 'application/json', ...headers },
    signal: AbortSignal.timeout(20000),
  });
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  return await response.json();
}

// ──────────────────────────────────────────
// SOURCE 1: EVENTBRITE (Multi-city)
// ──────────────────────────────────────────

async function crawlEventbrite(city = 'Jakarta', testMode = false) {
  log('Eventbrite', `Crawling events in ${city}...`);
  const events = [];
  
  try {
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const searchUrl = `https://www.eventbrite.com/d/indonesia--${citySlug}/events/`;
    const html = await fetchPage(searchUrl);
    const $ = cheerio.load(html);
    
    // Extract from JSON-LD
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const data = JSON.parse($(el).html());
        if (data['@type'] === 'ItemList' || Array.isArray(data)) {
          const items = data.itemListElement || data;
          items.forEach(item => {
            const event = item.item || item;
            if (event['@type'] === 'Event' || event.name) {
              events.push({
                title: event.name || 'Untitled',
                date: event.startDate ? event.startDate.slice(0, 10) : null,
                time: event.startDate ? event.startDate.slice(11, 16) : null,
                end_date: event.endDate ? event.endDate.slice(0, 10) : null,
                venue_name: event.location?.name || null,
                address: event.location?.address?.streetAddress || null,
                city: city,
                category: categorizeEvent(event.name, event.description),
                price_min: event.offers?.lowPrice || 0,
                price_max: event.offers?.highPrice || 0,
                currency: event.offers?.priceCurrency || 'IDR',
                description: event.description ? event.description.slice(0, 500) : null,
                image_url: event.image || null,
                ticket_url: event.url || null,
                organizer: event.organizer?.name || null,
                source: 'eventbrite',
                source_id: event['@id'] || event.url || `eb-${Date.now()}-${i}`,
              });
            }
          });
        }
      } catch (e) { /* skip */ }
    });
    
    // Fallback: parse HTML cards
    if (events.length === 0) {
      $('[class*="event-card"], [class*="EventCard"], article').each((i, el) => {
        const title = $(el).find('h2, h3, [class*="title"]').first().text().trim();
        const dateText = $(el).find('time, [class*="date"]').first().text().trim();
        const link = $(el).find('a').first().attr('href');
        const img = $(el).find('img').first().attr('src');
        if (title && title.length > 3) {
          events.push({
            title, date: dateText || null, time: null,
            venue_name: null, address: null, city,
            category: categorizeEvent(title),
            price_min: 0, price_max: 0, currency: 'IDR',
            description: null, image_url: img || null,
            ticket_url: link ? `https://www.eventbrite.com${link}` : null,
            organizer: null, source: 'eventbrite',
            source_id: `eb-html-${slugify(title)}`,
          });
        }
      });
    }
    
    log('Eventbrite', `Found ${events.length} events in ${city}`, 'DATA');
  } catch (err) {
    log('Eventbrite', `Error: ${err.message}`, 'ERROR');
  }
  
  return testMode ? events.slice(0, 5) : events;
}

// ──────────────────────────────────────────
// SOURCE 2: 10TIMES.COM (Rotating UA)
// ──────────────────────────────────────────

async function crawl10times(city = 'Jakarta', testMode = false) {
  log('10times', `Crawling B2B events in ${city}...`);
  const events = [];
  const citySlug = city.toLowerCase().replace(/\s+/g, '-');
  
  try {
    const url = `https://10times.com/${citySlug}-id`;
    const html = await fetchPage(url, {
      'Referer': 'https://www.google.com/',
      'sec-fetch-site': 'cross-site',
    });
    const $ = cheerio.load(html);
    
    // Extract from JSON-LD
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const data = JSON.parse($(el).html());
        if (data['@type'] === 'ItemList' && data.itemListElement) {
          data.itemListElement.forEach((item, idx) => {
            const event = item.item || item;
            if (event['@type'] === 'Event' || event.name) {
              const venue = Array.isArray(event.location)
                ? event.location.find(l => l['@type'] === 'Place')
                : event.location;
              events.push({
                title: event.name || 'Untitled',
                date: event.startDate ? event.startDate.slice(0, 10) : null,
                time: null,
                end_date: event.endDate ? event.endDate.slice(0, 10) : null,
                venue_name: venue?.name || null,
                address: venue?.address?.streetAddress || null,
                city: venue?.address?.addressLocality || city,
                category: categorizeEvent(event.name, event.description),
                price_min: event.offers?.lowPrice || 0,
                price_max: event.offers?.highPrice || 0,
                currency: event.offers?.priceCurrency || 'IDR',
                description: event.description ? event.description.slice(0, 500) : null,
                image_url: Array.isArray(event.image) ? event.image[0] : event.image || null,
                ticket_url: event.url || null,
                organizer: event.organizer?.name || null,
                source: '10times',
                source_id: `10t-${slugify(event.name || `event-${idx}`)}`,
              });
            }
          });
        }
      } catch (e) { /* skip */ }
    });
    
    // Fallback: HTML table rows
    if (events.length === 0) {
      $('tr.row, .event-card, [class*="event-item"], .col-12.col-lg-4').each((i, el) => {
        const title = $(el).find('h2, h3, a[href*="/e/"], strong a').first().text().trim();
        const dateText = $(el).find('.eventTime, .date, time').first().text().trim();
        const venue = $(el).find('.venue, [class*="location"]').first().text().trim();
        const link = $(el).find('a').first().attr('href');
        const img = $(el).find('img').first().attr('src');
        if (title && title.length > 3) {
          events.push({
            title, date: dateText || null, time: null,
            venue_name: venue || null, address: null, city,
            category: categorizeEvent(title),
            price_min: 0, price_max: 0, currency: 'IDR',
            description: null, image_url: img || null,
            ticket_url: link ? (link.startsWith('http') ? link : `https://10times.com${link}`) : null,
            organizer: null, source: '10times',
            source_id: `10t-${slugify(title)}`,
          });
        }
      });
    }
    
    log('10times', `Found ${events.length} events in ${city}`, 'DATA');
  } catch (err) {
    log('10times', `Error: ${err.message}`, 'ERROR');
  }
  
  return testMode ? events.slice(0, 5) : events;
}

// ──────────────────────────────────────────
// SOURCE 3: LOKET.COM (REST API)
// ──────────────────────────────────────────

async function crawlLoket(city = 'Jakarta', testMode = false) {
  log('Loket', `Crawling events in ${city}...`);
  const events = [];
  const LOKET_API = 'https://rest.loket.com/fusio/api/v1/public/search';
  
  const searchQueries = [
    `konser ${city}`, `festival ${city}`, `seminar ${city}`,
    `workshop ${city}`, `event ${city}`, `musik ${city}`, `olahraga ${city}`,
  ];
  
  try {
    for (const query of searchQueries) {
      try {
        const response = await fetch(LOKET_API, {
          method: 'POST',
          headers: {
            'User-Agent': getRandomUA(),
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Accept-Language': 'id-ID',
            'Referer': 'https://loket.com/search',
            'Origin': 'https://loket.com',
          },
          body: JSON.stringify({ query }),
          signal: AbortSignal.timeout(15000),
        });
        
        if (!response.ok) continue;
        const data = await response.json();
        
        if (data.status && data.result?.event) {
          for (const event of data.result.event) {
            if (events.find(e => e.ticket_url === event.url)) continue;
            events.push({
              title: event.name || 'Untitled',
              date: null, time: null, end_date: null,
              venue_name: event.location?.name || null,
              address: null,
              city: event.location?.district || city,
              category: categorizeEvent(event.name),
              price_min: 0, price_max: 0, currency: 'IDR',
              description: null,
              image_url: event.image_url || null,
              ticket_url: event.url || null,
              organizer: null, source: 'loket',
              source_id: `lkt-${slugify(event.name || `event-${Date.now()}`)}`,
            });
          }
        }
        await sleep(1000);
      } catch (e) {
        log('Loket', `Query "${query}" failed: ${e.message}`, 'WARN');
      }
    }
    
    log('Loket', `Found ${events.length} events in ${city}`, 'DATA');
  } catch (err) {
    log('Loket', `Error: ${err.message}`, 'ERROR');
  }
  
  return testMode ? events.slice(0, 5) : events;
}

// ──────────────────────────────────────────
// SOURCE 4: TIKETAPASAJA.COM
// ──────────────────────────────────────────

async function crawlTiketapasaja(testMode = false) {
  log('Tiketapasaja', 'Crawling events...');
  const events = [];
  
  try {
    const html = await fetchPage('https://tiketapasaja.com');
    const $ = cheerio.load(html);
    
    $('[class*="event"], [class*="card"], article, .item').each((i, el) => {
      const title = $(el).find('h2, h3, h4, .title, [class*="title"]').first().text().trim();
      const dateText = $(el).find('.date, time, [class*="date"]').first().text().trim();
      const venue = $(el).find('.location, .venue, [class*="location"]').first().text().trim();
      const price = $(el).find('.price, [class*="price"]').first().text().trim();
      const link = $(el).find('a').first().attr('href');
      const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');
      
      if (title && title.length > 3) {
        const priceInfo = estimatePrice(price);
        events.push({
          title, date: dateText || null, time: null,
          venue_name: venue || null, address: null, city: 'Jakarta',
          category: categorizeEvent(title),
          price_min: priceInfo.min, price_max: priceInfo.max, currency: 'IDR',
          description: null, image_url: img || null,
          ticket_url: link ? (link.startsWith('http') ? link : `https://tiketapasaja.com${link}`) : null,
          organizer: null, source: 'tiketapasaja',
          source_id: `tta-${slugify(title)}`,
        });
      }
    });
    
    log('Tiketapasaja', `Found ${events.length} events`, 'DATA');
  } catch (err) {
    log('Tiketapasaja', `Error: ${err.message}`, 'ERROR');
  }
  
  return testMode ? events.slice(0, 5) : events;
}

// ──────────────────────────────────────────
// SOURCE 5: GOERS / GOERSAPP.COM (Playwright SPA)
// ──────────────────────────────────────────

async function crawlGoers(city = 'Jakarta', testMode = false) {
  log('Goers', `Crawling events in ${city} (Playwright)...`);
  const events = [];
  
  try {
    const { chromium } = await import('playwright');
    const browser = await chromium.launch({ headless: true });
    const context = await browser.newContext({
      userAgent: getRandomUA(),
      viewport: { width: 1280, height: 800 },
    });
    const page = await context.newPage();
    
    // Navigate to Goers explore page
    const cityParam = city === 'Jakarta' ? '&filter=region:Jakarta' : `&filter=region:${city}`;
    await page.goto(`https://www.goersapp.com/explore?type=events${cityParam}`, {
      waitUntil: 'networkidle',
      timeout: 30000,
    });
    
    // Scroll to load more events
    for (let i = 0; i < 5; i++) {
      await page.evaluate(() => window.scrollBy(0, 1000));
      await page.waitForTimeout(1500);
    }
    
    // Extract event data directly from DOM
    const rawEvents = await page.evaluate(() => {
      const results = [];
      const seen = new Set();
      
      document.querySelectorAll('a[href*="/events/"]').forEach(a => {
        const href = a.href;
        if (seen.has(href)) return;
        seen.add(href);
        
        const titleEl = a.querySelector('div[class*="text--bold"]');
        if (!titleEl) return;
        
        const title = titleEl.textContent.trim();
        const labels = [...a.querySelectorAll('div[class*="label"]')].map(l => l.textContent.trim());
        const imgEl = a.querySelector('img');
        const footerEl = a.querySelector('div[class*="footer"]');
        const priceEl = footerEl?.querySelector('div[class*="text--bold"]');
        
        // Parse labels: [organizer, organizer, venue+city, venue+city, date, date, ...]
        const venue = labels[2] || null;
        const dateStr = labels[4] || labels[5] || null;
        const price = priceEl?.textContent?.trim() || null;
        
        results.push({
          title,
          venue,
          dateStr,
          price,
          image: imgEl?.src || null,
          url: href,
          organizer: labels[0] || null,
        });
      });
      return results;
    });
    
    log('Goers', `Found ${rawEvents.length} events in ${city}`, 'DATA');
    
    // Process raw events
    for (const ev of rawEvents.slice(0, testMode ? 5 : CONFIG.maxEventsPerSource)) {
      // Parse venue: "Venue Name, City"
      let venueName = null;
      let eventCity = city;
      if (ev.venue) {
        const parts = ev.venue.split(',').map(s => s.trim());
        venueName = parts[0] || null;
        if (parts.length > 1) eventCity = parts[parts.length - 1];
      }
      
      // Parse price
      let priceMin = 0, priceMax = 0;
      if (ev.price) {
        if (/free|gratis/i.test(ev.price)) {
          priceMin = 0; priceMax = 0;
        } else {
          const priceInfo = estimatePrice(ev.price);
          priceMin = priceInfo.min;
          priceMax = priceInfo.max;
        }
      }
      
      events.push({
        title: ev.title,
        date: null, // Date parsing from "Today - 30 Jun '26" is complex, keep null
        time: null,
        end_date: null,
        venue_name: venueName,
        address: null,
        city: eventCity,
        category: categorizeEvent(ev.title),
        price_min: priceMin,
        price_max: priceMax,
        currency: 'IDR',
        description: null,
        image_url: ev.image,
        ticket_url: ev.url,
        organizer: ev.organizer,
        source: 'goers',
        source_id: `goers-${slugify(ev.title)}`,
      });
    }
    
    await browser.close();
    log('Goers', `Processed ${events.length} events from ${city}`, 'DATA');
  } catch (err) {
    log('Goers', `Error: ${err.message}`, 'ERROR');
  }
  
  return testMode ? events.slice(0, 5) : events;
}

// ──────────────────────────────────────────
// SOURCE 6: INDONESIA.TRAVEL (Government)
// ──────────────────────────────────────────

async function crawlIndonesiaTravel(testMode = false) {
  log('Indonesia.travel', 'Crawling government events...');
  const events = [];
  
  try {
    const url = 'https://www.indonesia.travel/gb/en/events';
    const html = await fetchPage(url);
    const $ = cheerio.load(html);
    
    // Parse event cards — government portal uses consistent card structure
    $('.event-card, .card, article, [class*="event-item"], .col-md-4, .col-lg-4').each((i, el) => {
      const title = $(el).find('h2, h3, h4, .title, [class*="title"]').first().text().trim();
      const dateText = $(el).find('.date, time, [class*="date"]').first().text().trim();
      const venue = $(el).find('.location, .venue, [class*="location"]').first().text().trim();
      const link = $(el).find('a').first().attr('href');
      const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');
      const desc = $(el).find('p, .description, [class*="desc"]').first().text().trim();
      
      if (title && title.length > 5 && !title.includes('Indonesia Travel')) {
        events.push({
          title, date: dateText || null, time: null,
          venue_name: venue || null, address: null,
          city: venue || 'Indonesia',
          category: categorizeEvent(title, desc),
          price_min: 0, price_max: 0, currency: 'IDR',
          description: desc ? desc.slice(0, 500) : null,
          image_url: img || null,
          ticket_url: link ? (link.startsWith('http') ? link : `https://www.indonesia.travel${link}`) : null,
          organizer: 'Kemenparekraf',
          source: 'indonesia-travel',
          source_id: `gov-${slugify(title)}`,
        });
      }
    });
    
    log('Indonesia.travel', `Found ${events.length} events`, 'DATA');
  } catch (err) {
    log('Indonesia.travel', `Error: ${err.message}`, 'ERROR');
  }
  
  return testMode ? events.slice(0, 5) : events;
}

// ──────────────────────────────────────────
// SOURCE 7: MEETUP.COM (Public GraphQL API)
// ──────────────────────────────────────────

async function crawlMeetup(city = 'Jakarta', testMode = false) {
  log('Meetup', `Crawling events in ${city}...`);
  const events = [];

  try {
    // Use Meetup's public GraphQL endpoint (no auth needed for public events)
    const cityCoords = {
      'Jakarta': { lat: -6.2088, lon: 106.8456 },
      'Surabaya': { lat: -7.2575, lon: 112.7521 },
      'Bandung': { lat: -6.9175, lon: 107.6191 },
      'Bali': { lat: -8.3405, lon: 115.092 },
      'Yogyakarta': { lat: -7.7956, lon: 110.3695 },
    };
    const coords = cityCoords[city] || cityCoords['Jakarta'];

    // Search via Meetup's findEvents endpoint
    const searchUrl = `https://www.meetup.com/gql2?query=query{rankedEvents(first:20,lat:${coords.lat},lon:${coords.lon},categoryId:0,startDate:"${new Date().toISOString().slice(0, 10)}"){edges{node{id,title,dateTime,endDateTime,eventUrl,description,venue{name,address,city},group{name,urlName},eventType,isOnline,maxTickets{price{amount,currencyCode}}}}}}`;

    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'User-Agent': getRandomUA(),
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(15000),
    });

    if (response.ok) {
      const data = await response.json();
      const edges = data?.data?.rankedEvents?.edges || [];

      for (const edge of edges) {
        const node = edge.node;
        if (node.isOnline) continue; // Skip online events

        const venue = node.venue;
        const venueCity = venue?.city || city;
        // Only include if city matches or is nearby
        if (!venueCity.toLowerCase().includes(city.toLowerCase().slice(0, 4)) &&
            !city.toLowerCase().includes(venueCity.toLowerCase().slice(0, 4))) continue;

        events.push({
          title: node.title || 'Untitled',
          date: node.dateTime ? node.dateTime.slice(0, 10) : null,
          time: node.dateTime ? node.dateTime.slice(11, 16) : null,
          end_date: node.endDateTime ? node.endDateTime.slice(0, 10) : null,
          venue_name: venue?.name || null,
          address: venue?.address || null,
          city: venueCity,
          category: categorizeEvent(node.title, node.description || ''),
          price_min: node.maxTickets?.price?.amount || 0,
          price_max: node.maxTickets?.price?.amount || 0,
          currency: node.maxTickets?.price?.currencyCode || 'IDR',
          description: node.description ? node.description.slice(0, 500) : null,
          image_url: null,
          ticket_url: node.eventUrl || null,
          organizer: node.group?.name || null,
          source: 'meetup',
          source_id: `meetup-${node.id || slugify(node.title)}`,
        });
      }
    }

    log('Meetup', `Found ${events.length} events in ${city}`, 'DATA');
  } catch (err) {
    log('Meetup', `Error: ${err.message}`, 'ERROR');
  }

  return testMode ? events.slice(0, 5) : events;
}

// ──────────────────────────────────────────
// SOURCE 8: GOOGLE SOCIAL SEARCH (Instagram/Threads/TikTok events)
// ──────────────────────────────────────────

async function crawlSocialEvents(city = 'Jakarta', testMode = false) {
  log('Social', `Searching social media events in ${city}...`);
  const events = [];

  const queries = [
    `site:instagram.com event ${city} 2026`,
    `site:instagram.com acara ${city} 2026`,
    `site:instagram.com festival ${city} 2026`,
    `site:instagram.com konser ${city} 2026`,
    `site:instagram.com workshop ${city} 2026`,
    `site:threads.net event ${city} indonesia`,
    `site:tiket.com event ${city}`,
  ];

  try {
    for (const query of queries) {
      try {
        const searchUrl = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=10&gl=id`;
        const html = await fetchPage(searchUrl, {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'id-ID,id;q=0.9,en;q=0.8',
        });
        const $ = cheerio.load(html);

        // Parse Google search results
        $('div.g, div[data-sokoban-container]').each((i, el) => {
          const linkEl = $(el).find('a[href]').first();
          const href = linkEl.attr('href') || '';
          const title = $(el).find('h3').first().text().trim();
          const snippet = $(el).find('div[data-sncf], div.VwiC3b, span.aCOpRe').first().text().trim();

          if (!title || title.length < 5) return;
          // Only keep social media results
          if (!href.includes('instagram.com') && !href.includes('threads.net') &&
              !href.includes('tiket.com') && !href.includes('tiktok.com')) return;

          // Try to extract date from snippet
          const dateMatch = snippet.match(/(\d{1,2})\s*(Januari|Februari|Maret|April|Mei|Juni|Juli|Agustus|September|Oktober|November|Desember|January|February|March|April|May|June|July|August|September|October|November|December)\s*(\d{4})/i);
          let date = null;
          if (dateMatch) {
            const months = { 'januari': '01', 'february': '02', 'maret': '03', 'april': '04', 'mei': '05', 'juni': '06', 'juli': '07', 'agustus': '08', 'september': '09', 'oktober': '10', 'november': '11', 'desember': '12', 'january': '01', 'february': '02', 'march': '03', 'april': '04', 'may': '05', 'june': '06', 'july': '07', 'august': '08', 'september': '09', 'october': '10', 'november': '11', 'december': '12' };
            const monthNum = months[dateMatch[2].toLowerCase()] || '01';
            date = `${dateMatch[3]}-${monthNum}-${dateMatch[1].padStart(2, '0')}`;
          }

          let source = 'instagram';
          if (href.includes('threads.net')) source = 'threads';
          else if (href.includes('tiket.com')) source = 'tiket';
          else if (href.includes('tiktok.com')) source = 'tiktok';

          events.push({
            title: title.slice(0, 200),
            date, time: null, end_date: null,
            venue_name: null, address: null, city,
            category: categorizeEvent(title, snippet),
            price_min: 0, price_max: 0, currency: 'IDR',
            description: snippet ? snippet.slice(0, 300) : null,
            image_url: null,
            ticket_url: href.startsWith('http') ? href : null,
            organizer: null, source,
            source_id: `social-${source}-${slugify(title)}`,
          });
        });

        await sleep(2000); // Be nice to Google
      } catch (e) {
        log('Social', `Query failed: ${e.message}`, 'WARN');
      }
    }

    log('Social', `Found ${events.length} social events in ${city}`, 'DATA');
  } catch (err) {
    log('Social', `Error: ${err.message}`, 'ERROR');
  }

  return testMode ? events.slice(0, 5) : events;
}

// ──────────────────────────────────────────
// SOURCE 9: TIKET.COM (Indonesian ticketing platform)
// ──────────────────────────────────────────

async function crawlTiketcom(city = 'Jakarta', testMode = false) {
  log('Tiket.com', `Crawling events in ${city}...`);
  const events = [];

  try {
    const citySlug = city.toLowerCase().replace(/\s+/g, '-');
    const url = `https://www.tiket.com/event/${citySlug}`;
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    // Parse event cards
    $('[class*="event"], [class*="card"], article, .item, [data-testid*="event"]').each((i, el) => {
      const title = $(el).find('h2, h3, h4, [class*="title"], [class*="name"]').first().text().trim();
      const dateText = $(el).find('time, [class*="date"], [class*="time"]').first().text().trim();
      const venue = $(el).find('[class*="location"], [class*="venue"]').first().text().trim();
      const price = $(el).find('[class*="price"], [class*="harga"]').first().text().trim();
      const link = $(el).find('a').first().attr('href');
      const img = $(el).find('img').first().attr('src') || $(el).find('img').first().attr('data-src');

      if (title && title.length > 3) {
        const priceInfo = estimatePrice(price);
        events.push({
          title, date: dateText || null, time: null,
          venue_name: venue || null, address: null, city,
          category: categorizeEvent(title),
          price_min: priceInfo.min, price_max: priceInfo.max, currency: 'IDR',
          description: null, image_url: img || null,
          ticket_url: link ? (link.startsWith('http') ? link : `https://www.tiket.com${link}`) : null,
          organizer: null, source: 'tiket',
          source_id: `tiket-${slugify(title)}`,
        });
      }
    });

    log('Tiket.com', `Found ${events.length} events in ${city}`, 'DATA');
  } catch (err) {
    log('Tiket.com', `Error: ${err.message}`, 'ERROR');
  }

  return testMode ? events.slice(0, 5) : events;
}

// ──────────────────────────────────────────
// SOURCE 10: KUMPUL.COM (Indonesian community events)
// ──────────────────────────────────────────

async function crawlKumpul(city = 'Jakarta', testMode = false) {
  log('Kumpul', `Crawling community events in ${city}...`);
  const events = [];

  try {
    const url = 'https://kumpul.co/events';
    const html = await fetchPage(url);
    const $ = cheerio.load(html);

    $('[class*="event"], [class*="card"], article, .item').each((i, el) => {
      const title = $(el).find('h2, h3, h4, [class*="title"]').first().text().trim();
      const dateText = $(el).find('time, [class*="date"]').first().text().trim();
      const venue = $(el).find('[class*="location"], [class*="venue"]').first().text().trim();
      const link = $(el).find('a').first().attr('href');
      const img = $(el).find('img').first().attr('src');

      if (title && title.length > 3) {
        events.push({
          title, date: dateText || null, time: null,
          venue_name: venue || null, address: null, city,
          category: categorizeEvent(title),
          price_min: 0, price_max: 0, currency: 'IDR',
          description: null, image_url: img || null,
          ticket_url: link ? (link.startsWith('http') ? link : `https://kumpul.co${link}`) : null,
          organizer: null, source: 'kumpul',
          source_id: `kumpul-${slugify(title)}`,
        });
      }
    });

    log('Kumpul', `Found ${events.length} events in ${city}`, 'DATA');
  } catch (err) {
    log('Kumpul', `Error: ${err.message}`, 'ERROR');
  }

  return testMode ? events.slice(0, 5) : events;
}

// ──────────────────────────────────────────
// DEDUPLICATION ENGINE
// ──────────────────────────────────────────

function deduplicateEvents(events) {
  const seen = new Map();
  const unique = [];
  
  for (const event of events) {
    const key = slugify(event.title) + '|' + (event.date || 'nodate');
    if (!seen.has(key)) {
      seen.set(key, true);
      unique.push(event);
    }
  }
  
  const removed = events.length - unique.length;
  if (removed > 0) log('Dedup', `Removed ${removed} duplicate events`);
  
  return unique;
}

// ──────────────────────────────────────────
// DATA STORAGE
// ──────────────────────────────────────────

import { mkdir, writeFile, readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { join } from 'path';

async function saveEvents(events) {
  if (events.length === 0) return;
  
  const outputDir = CONFIG.outputDir;
  await mkdir(outputDir, { recursive: true });
  
  const today = new Date().toISOString().slice(0, 10);
  const filePath = join(outputDir, `events-${today}.json`);
  
  let existing = [];
  if (existsSync(filePath)) {
    try { existing = JSON.parse(await readFile(filePath, 'utf-8')); } catch (e) {}
  }
  
  const merged = [...events, ...existing];
  const seen = new Set();
  const deduped = merged.filter(e => {
    const key = (e.title || '').toLowerCase().trim();
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
  
  await writeFile(filePath, JSON.stringify(deduped, null, 2));
  log('Storage', `Saved ${deduped.length} events (${events.length} new, ${merged.length - deduped.length} dupes removed) to ${filePath}`, 'DATA');
  
  // Save summary
  const summary = {
    lastRun: new Date().toISOString(),
    totalEvents: deduped.length,
    newEvents: events.length,
    bySource: {}, byCity: {}, byCategory: {},
  };
  
  deduped.forEach(e => {
    summary.bySource[e.source] = (summary.bySource[e.source] || 0) + 1;
    summary.byCity[e.city] = (summary.byCity[e.city] || 0) + 1;
    summary.byCategory[e.category] = (summary.byCategory[e.category] || 0) + 1;
  });
  
  await writeFile(join(outputDir, 'latest-summary.json'), JSON.stringify(summary, null, 2));
  return summary;
}

// ──────────────────────────────────────────
// MAIN PIPELINE
// ──────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const testMode = args.test || false;
  const sourceFilter = args.source;
  const cities = args.allCities ? CONFIG.cities : [args.city || CONFIG.defaultCity];
  
  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     YUKGO.LIVE — Agent 1: EVENT HUNTER v2      ║');
  console.log('║     Automated Event Discovery Pipeline          ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');
  log('Pipeline', `Starting ${testMode ? 'TEST' : 'FULL'} run`);
  log('Pipeline', `Cities: ${cities.join(', ')}`);
  log('Pipeline', `Time: ${new Date().toLocaleString('id-ID')}`);
  console.log('');
  
  const startTime = Date.now();
  let allEvents = [];
  
  for (const city of cities) {
    log('Pipeline', `═══ Processing ${city} ═══`);
    
    if (!sourceFilter || sourceFilter === 'eventbrite') {
      allEvents.push(...await crawlEventbrite(city, testMode));
      if (!testMode) await sleep(CONFIG.requestDelay);
    }
    
    if (!sourceFilter || sourceFilter === '10times') {
      allEvents.push(...await crawl10times(city, testMode));
      if (!testMode) await sleep(CONFIG.requestDelay);
    }
    
    if (!sourceFilter || sourceFilter === 'loket') {
      allEvents.push(...await crawlLoket(city, testMode));
      if (!testMode) await sleep(CONFIG.requestDelay);
    }
    
    if (!sourceFilter || sourceFilter === 'goers') {
      allEvents.push(...await crawlGoers(city, testMode));
      if (!testMode) await sleep(CONFIG.requestDelay);
    }
    
    if (!sourceFilter || sourceFilter === 'tiketapasaja') {
      if (city === 'Jakarta') { // Only Jakarta for this source
        allEvents.push(...await crawlTiketapasaja(testMode));
        if (!testMode) await sleep(CONFIG.requestDelay);
      }
    }

    if (!sourceFilter || sourceFilter === 'meetup') {
      allEvents.push(...await crawlMeetup(city, testMode));
      if (!testMode) await sleep(CONFIG.requestDelay);
    }

    if (!sourceFilter || sourceFilter === 'social') {
      allEvents.push(...await crawlSocialEvents(city, testMode));
      if (!testMode) await sleep(CONFIG.requestDelay);
    }

    if (!sourceFilter || sourceFilter === 'tiket') {
      allEvents.push(...await crawlTiketcom(city, testMode));
      if (!testMode) await sleep(CONFIG.requestDelay);
    }

    if (!sourceFilter || sourceFilter === 'kumpul') {
      if (city === 'Jakarta') {
        allEvents.push(...await crawlKumpul(city, testMode));
        if (!testMode) await sleep(CONFIG.requestDelay);
      }
    }

    if (cities.length > 1) await sleep(2000); // Extra delay between cities
  }
  
  // Indonesia.travel (not city-specific)
  if (!sourceFilter || sourceFilter === 'indonesia-travel') {
    allEvents.push(...await crawlIndonesiaTravel(testMode));
  }
  
  console.log('');
  log('Pipeline', `Total raw events: ${allEvents.length}`);
  
  allEvents = deduplicateEvents(allEvents);
  log('Pipeline', `After dedup: ${allEvents.length} unique events`);
  
  // Enrich
  allEvents = allEvents.map(e => ({
    ...e,
    slug: slugify(e.title),
    discovered_at: new Date().toISOString(),
    status: 'pending_review',
  }));
  
  // Save
  console.log('');
  const summary = await saveEvents(allEvents);
  
  // Print summary
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log('');
  console.log('┌──────────────────────────────────────────────┐');
  console.log('│           RUN SUMMARY                        │');
  console.log('├──────────────────────────────────────────────┤');
  console.log(`│  Duration:    ${duration}s`);
  console.log(`│  New Events:  ${allEvents.length}`);
  console.log(`│  Cities:      ${cities.join(', ')}`);
  console.log(`│  Mode:        ${testMode ? 'TEST' : 'FULL'}`);
  
  if (summary) {
    console.log('│');
    console.log('│  By Source:');
    Object.entries(summary.bySource).sort((a, b) => b[1] - a[1]).forEach(([src, count]) => {
      console.log(`│    ${src}: ${count}`);
    });
    console.log('│');
    console.log('│  By City:');
    Object.entries(summary.byCity).sort((a, b) => b[1] - a[1]).forEach(([c, count]) => {
      console.log(`│    ${c}: ${count}`);
    });
    console.log('│');
    console.log('│  By Category:');
    Object.entries(summary.byCategory).sort((a, b) => b[1] - a[1]).forEach(([cat, count]) => {
      console.log(`│    ${cat}: ${count}`);
    });
  }
  
  console.log('└──────────────────────────────────────────────┘');
  console.log('');
  
  // Print samples
  if (allEvents.length > 0) {
    console.log('┌──────────────────────────────────────────────┐');
    console.log('│           SAMPLE EVENTS                      │');
    console.log('├──────────────────────────────────────────────┤');
    allEvents.slice(0, 8).forEach((e, i) => {
      console.log(`│  ${i + 1}. ${e.title}`);
      console.log(`│     📅 ${e.date || 'TBD'} ${e.time || ''}`);
      console.log(`│     📍 ${e.venue_name || 'TBD'}, ${e.city}`);
      console.log(`│     🏷️  ${e.category} | 💰 ${e.price_min > 0 ? `Rp ${e.price_min.toLocaleString('id-ID')}` : 'Gratis/TBD'}`);
      console.log(`│     🔗 ${e.source}`);
      console.log('│');
    });
    console.log('└──────────────────────────────────────────────┘');
  }
  
  console.log('');
  log('Pipeline', 'Done! ✓');
  console.log('');
  
  return allEvents;
}

main().catch(err => {
  log('Pipeline', `Fatal: ${err.message}`, 'ERROR');
  process.exit(1);
});
