#!/usr/bin/env node

/**
 * YUKGO.LIVE — Agent 2: CONTENT FACTORY
 * ========================================
 * Takes raw event data and generates rich, engaging content in Bahasa Indonesia.
 *
 * Features:
 *   - SEO-optimized titles & meta descriptions
 *   - Rich event descriptions (Bahasa Indonesia)
 *   - 'What to Expect' bullet points
 *   - Practical info (venue, transport, what to bring)
 *   - Instagram captions with hashtags
 *   - Short social captions for Twitter/TikTok
 *   - Curated article drafts (weekly roundup, free events)
 *   - Cost estimation for API usage
 *
 * Usage:
 *   node agents/content-factory.js              # Full run
 *   node agents/content-factory.js --test       # Test run (3 events only)
 *   node agents/content-factory.js --input=path # Custom input file
 *
 * Environment:
 *   OPENAI_API_KEY  — For AI content generation (optional, uses template fallback)
 */

import { readFile, writeFile, mkdir, readdir } from 'fs/promises';
import { existsSync } from 'fs';
import { join, basename } from 'path';

// ──────────────────────────────────────────
// CONFIGURATION
// ──────────────────────────────────────────

const CONFIG = {
  // Input
  eventsDir: './data/events',
  defaultInput: 'events-2026-06-11.json',

  // Output
  outputDir: './data/content',
  articlesDir: './data/content/articles',
  socialDir: './data/content/social-posts',

  // OpenAI
  model: 'gpt-4o-mini',
  maxTokens: 2000,

  // Cost estimation (USD per 1K tokens)
  costPerInputToken: 0.00015,   // $0.15 / 1M input tokens
  costPerOutputToken: 0.00060,  // $0.60 / 1M output tokens

  // Content limits
  seoTitleMax: 60,
  metaDescMax: 155,
  descMinWords: 200,
  descMaxWords: 400,
  instagramMax: 2200,
  socialMax: 150,
};

// ──────────────────────────────────────────
// UTILITY FUNCTIONS
// ──────────────────────────────────────────

function parseArgs() {
  const args = {};
  process.argv.slice(2).forEach(arg => {
    if (arg === '--test') args.test = true;
    else if (arg.startsWith('--input=')) args.input = arg.split('=')[1];
  });
  return args;
}

function log(agent, message, level = 'INFO') {
  const timestamp = new Date().toISOString().slice(11, 19);
  const prefix = {
    'INFO': '✓',
    'WARN': '⚠',
    'ERROR': '✗',
    'DATA': '→',
    'AI': '🤖',
    'MONEY': '💰',
  }[level] || '•';
  console.log(`[${timestamp}] ${prefix} [${agent}] ${message}`);
}

function truncate(str, maxLen) {
  if (!str) return '';
  if (str.length <= maxLen) return str;
  return str.slice(0, maxLen - 3) + '...';
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 100);
}

function formatDate(dateStr) {
  if (!dateStr) return 'TBD';
  const d = new Date(dateStr);
  const months = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  return `${days[d.getDay()]}, ${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}

function categoryLabel(cat) {
  const labels = {
    music: 'Musik & Konser',
    tech: 'Teknologi',
    food: 'Kuliner',
    sports: 'Olahraga',
    arts: 'Seni & Budaya',
    business: 'Bisnis',
    community: 'Komunitas',
    nightlife: 'Nightlife',
    education: 'Edukasi',
    fashion: 'Fashion',
    other: 'Event',
  };
  return labels[cat] || 'Event';
}

function generateHashtags(event) {
  const base = ['#yukgo', '#jakarta', '#eventjakarta'];
  const catTags = {
    music: ['#musik', '#konser', '#livemusic'],
    tech: ['#teknologi', '#techsummit', '#startup'],
    food: ['#kuliner', '#foodfestival', '#jakartafood'],
    sports: ['#olahraga', '#fitness', '#sehat'],
    arts: ['#seni', '#pameran', '#budaya'],
    business: ['#bisnis', '#networking', '#entrepreneur'],
    community: ['#komunitas', '#meetup', '#gathering'],
    nightlife: ['#nightlife', '#party', '#jakartanight'],
    education: ['#edukasi', '#pelatihan', '#belajar'],
    fashion: ['#fashion', '#style', '#runway'],
    other: ['#event', '#hiburan'],
  };
  const cat = catTags[event.category] || catTags.other;
  const titleWords = event.title
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 3)
    .slice(0, 3)
    .map(w => `#${w}`);
  return [...new Set([...base, ...cat, ...titleWords])].slice(0, 15);
}

function estimateCost(eventCount) {
  // Rough estimation: ~800 tokens input, ~1500 tokens output per event
  const inputTokensPerEvent = 800;
  const outputTokensPerEvent = 1500;
  const totalInput = inputTokensPerEvent * eventCount;
  const totalOutput = outputTokensPerEvent * eventCount;
  const cost = (totalInput / 1000000) * (CONFIG.costPerInputToken * 1000) +
               (totalOutput / 1000000) * (CONFIG.costPerOutputToken * 1000);
  return {
    inputTokens: totalInput,
    outputTokens: totalOutput,
    totalTokens: totalInput + totalOutput,
    estimatedCostUSD: cost,
    estimatedCostIDR: cost * 16000,
  };
}

// ──────────────────────────────────────────
// TEMPLATE-BASED FALLBACK (No API Key)
// ──────────────────────────────────────────

function generateTemplateContent(event) {
  const title = truncate(event.title, CONFIG.seoTitleMax);
  const venue = event.venue_name || 'venue yang akan diinformasikan';
  const date = formatDate(event.date);
  const cat = categoryLabel(event.category);
  const price = event.price_min > 0
    ? `Rp ${event.price_min.toLocaleString('id-ID')}`
    : 'Gratis';
  const endDate = event.end_date && event.end_date !== event.date
    ? ` hingga ${formatDate(event.end_date)}`
    : '';

  // SEO Title
  const seoTitle = truncate(`${title} | ${event.city} ${event.date?.slice(0, 4) || '2026'}`, CONFIG.seoTitleMax);

  // Meta Description
  const metaDesc = truncate(
    `${title} berlangsung di ${venue}, ${event.city} pada ${date}. ${cat}. ${price}. ${event.description ? event.description.slice(0, 80) : ''}`.trim(),
    CONFIG.metaDescMax
  );

  // Rich Description (Bahasa Indonesia)
  const desc = `${title} adalah salah satu ${cat.toLowerCase()} yang patut kamu kunjungi di ${event.city}. Acara ini akan berlangsung pada ${date}${endDate} di ${venue}.

${event.description || `Acara ini menawarkan pengalaman menarik bagi para pengunjung yang tertarik dengan dunia ${cat.toLowerCase()}. Dengan lokasi strategis di ${event.city}, acara ini mudah dijangkau oleh siapa saja.`}

${event.price_min > 0
  ? `Tiket masuk dibanderol mulai dari ${price}. Pastikan kamu memesan tiket lebih awal karena kuota terbatas.`
  : 'Kabar baiknya, acara ini GRATIS! Jadi jangan sampai melewatkan kesempatan emas ini.'
}

Acara ini sangat cocok untuk kamu yang ingin menambah wawasan, memperluas jaringan, dan tentunya bersenang-senang. Yuk, ajak teman-temanmu dan nikmati pengalaman seru bersama!`;

  // What to Expect
  const whatToExpect = [
    `Pengalaman ${cat.toLowerCase()} yang berkualitas di ${venue}`,
    event.price_min > 0 ? `Investasi mulai dari ${price}` : 'Gratis tanpa biaya masuk',
    `Bertemu dengan komunitas ${cat.toLowerCase()} di ${event.city}`,
    'Kesempatan networking dan memperluas relasi',
  ];

  // Practical Info
  const practicalInfo = {
    venue: venue,
    address: event.address || 'Alamat akan diinformasikan',
    city: event.city,
    transport: event.venue_name
      ? `Lokasi dapat diakses dengan TransJakarta, KRL, atau ojek online. Disarankan untuk menggunakan transportasi umum karena keterbatasan tempat parkir.`
      : 'Detail transportasi akan diinformasikan lebih lanjut.',
    whatToBring: [
      'Kartu identitas (KTP/SIM)',
      'Tiket cetak atau digital',
      'Power bank dan charger',
      'Uang tunai secukupnya',
    ],
    tips: 'Datang 30 menit sebelum acara dimulai untuk mendapatkan tempat terbaik.',
  };

  // Instagram Caption
  const hashtags = generateHashtags(event);
  const instagramCaption = `✨ ${title} ✨

📅 ${date}${endDate}
📍 ${venue}, ${event.city}
💰 ${price}

${event.description ? event.description.slice(0, 200) : `Jangan lewatkan ${cat.toLowerCase()} seru ini! Acara ini akan memberikan pengalaman yang tak terlupakan.`}

Yuk, datang dan rasakan sendiri keseruannya! Ajak teman-temanmu sekarang! 🎉

🔗 Link tiket di bio!

${hashtags.join(' ')}`;

  // Social Caption (Twitter/TikTok)
  const socialCaption = truncate(
    `🎉 ${title} — ${date} di ${event.city}! ${price}. ${event.price_min === 0 ? 'Gratis!' : ''} Yuk datang! ${hashtags.slice(0, 3).join(' ')}`,
    CONFIG.socialMax
  );

  return {
    seo_title: seoTitle,
    meta_description: metaDesc,
    description: desc,
    what_to_expect: whatToExpect,
    practical_info: practicalInfo,
    instagram_caption: instagramCaption,
    social_caption: socialCaption,
    hashtags,
    generated_with: 'template',
    generated_at: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────
// AI-BASED CONTENT GENERATION (OpenAI)
// ──────────────────────────────────────────

async function generateAIContent(event, openai) {
  const prompt = `Kamu adalah penulis konten profesional untuk platform event discovery bernama Yukgo.live yang berfokus pada event di Indonesia, terutama Jakarta.

Buatkan konten untuk event berikut dalam Bahasa Indonesia:

JUDUL: ${event.title}
TANGGAL: ${event.date || 'TBD'}
AKHIR: ${event.end_date || 'TBD'}
VENUE: ${event.venue_name || 'TBD'}
ALAMAT: ${event.address || 'TBD'}
KOTA: ${event.city || 'Jakarta'}
KATEGORI: ${categoryLabel(event.category)}
HARGA: ${event.price_min > 0 ? `Rp ${event.price_min.toLocaleString('id-ID')}` : 'Gratis'}
DESKRIPSI: ${event.description || 'Tidak ada deskripsi'}

Buatkan output dalam format JSON dengan field berikut:
{
  "seo_title": "Judul SEO maksimal 60 karakter, menarik dan mengandung keyword",
  "meta_description": "Meta deskripsi maksimal 155 karakter untuk SEO",
  "description": "Deskripsi event 200-400 kata dalam Bahasa Indonesia yang engaging, informatif, dan mengajak pembaca untuk datang",
  "what_to_expect": ["3-4 bullet point tentang apa yang bisa diharapkan pengunjung"],
  "practical_info": {
    "venue": "Nama venue",
    "address": "Alamat lengkap",
    "city": "Kota",
    "transport": "Tips transportasi ke lokasi",
    "whatToBring": ["Daftar barang yang perlu dibawa"],
    "tips": "Tips praktis untuk pengunjung"
  },
  "instagram_caption": "Caption Instagram yang engaging, maksimal 2200 karakter, dengan emoji dan hashtag",
  "social_caption": "Caption pendek untuk Twitter/TikTok, maksimal 150 karakter"
}

PENTING:
- Gunakan Bahasa Indonesia yang natural dan engaging
- Sertakan emoji yang relevan
- Buat konten yang mengajak (call to action)
- Instagram caption harus include hashtags populer Indonesia
- Social caption harus singkat dan catchy
- Hanya output JSON, tidak perlu penjelasan tambahan`;

  try {
    const completion = await openai.chat.completions.create({
      model: CONFIG.model,
      messages: [
        {
          role: 'system',
          content: 'Kamu adalah content writer profesional untuk platform event discovery Indonesia. Selalu jawab dalam format JSON yang valid.'
        },
        { role: 'user', content: prompt }
      ],
      max_tokens: CONFIG.maxTokens,
      temperature: 0.7,
    });

    const response = completion.choices[0]?.message?.content;
    if (!response) throw new Error('Empty response from OpenAI');

    // Parse JSON from response (handle markdown code blocks)
    let jsonStr = response;
    const jsonMatch = response.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) jsonStr = jsonMatch[1];

    const content = JSON.parse(jsonStr.trim());
    content.generated_with = 'openai';
    content.generated_at = new Date().toISOString();
    content.hashtags = content.instagram_caption
      ? (content.instagram_caption.match(/#\S+/g) || []).filter(h => h.length > 2)
      : generateHashtags(event);

    // Track token usage
    const usage = completion.usage;
    content._tokens = {
      prompt: usage?.prompt_tokens || 0,
      completion: usage?.completion_tokens || 0,
      total: usage?.total_tokens || 0,
    };

    return content;
  } catch (err) {
    log('OpenAI', `AI generation failed: ${err.message}, falling back to template`, 'WARN');
    return generateTemplateContent(event);
  }
}

// ──────────────────────────────────────────
// ARTICLE GENERATORS
// ──────────────────────────────────────────

function generateWeeklyRoundup(events, usedAI = false) {
  const today = new Date();
  const nextWeek = new Date(today);
  nextWeek.setDate(today.getDate() + 7);

  // Filter events for this week (or all if dates are in future)
  const thisWeek = events.filter(e => {
    if (!e.date) return false;
    const d = new Date(e.date);
    return d >= today && d <= nextWeek;
  });

  // If no events this week, take the nearest upcoming ones
  const targetEvents = thisWeek.length > 0 ? thisWeek : events.slice(0, 10);

  const eventCount = targetEvents.length;
  const title = `${eventCount} Event Seru di Jakarta Minggu Ini`;

  const intro = `Jakarta kembali menghadirkan berbagai event menarik minggu ini! Dari ${categoryLabel(targetEvents[0]?.category)} hingga ${categoryLabel(targetEvents[targetEvents.length - 1]?.category)}, ada banyak pilihan seru yang bisa kamu kunjungi. Yuk, simak rekomendasi dari Yukgo.live!`;

  const eventList = targetEvents.map((e, i) => ({
    rank: i + 1,
    title: e.title,
    slug: e.slug,
    date: e.date,
    venue: e.venue_name || 'TBD',
    category: categoryLabel(e.category),
    price: e.price_min > 0 ? `Rp ${e.price_min.toLocaleString('id-ID')}` : 'Gratis',
    highlight: e.description ? e.description.slice(0, 120) : `Event ${categoryLabel(e.category)} yang wajib dikunjungi.`,
  }));

  const conclusion = `Itu dia ${eventCount} event seru yang bisa kamu kunjungi minggu ini di Jakarta! Jangan lupa untuk booking tiket lebih awal dan ajak teman-temanmu. Pantau terus Yukgo.live untuk rekomendasi event terbaru! 🎉`;

  return {
    type: 'weekly_roundup',
    title,
    seo_title: truncate(`${title} | Yukgo.live`, CONFIG.seoTitleMax),
    meta_description: truncate(`Rekomendasi ${eventCount} event seru di Jakarta minggu ini. Temukan event menarik dari berbagai kategori hanya di Yukgo.live!`, CONFIG.metaDescMax),
    intro,
    events: eventList,
    conclusion,
    generated_with: usedAI ? 'openai' : 'template',
    generated_at: new Date().toISOString(),
  };
}

function generateFreeEventsArticle(events, usedAI = false) {
  const freeEvents = events.filter(e => e.price_min === 0);
  const monthNames = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];
  const currentMonth = monthNames[new Date().getMonth()];
  const eventCount = freeEvents.length;

  const title = `${eventCount} Event Gratis di Jakarta Bulan ${currentMonth}`;

  const intro = `Siapa bilang seru harus mahal? Di Jakarta, ada banyak event gratis yang bisa kamu nikmati bulan ${currentMonth} ini! Yukgo.live sudah merangkum ${eventCount} event gratis yang wajib kamu kunjungi. Simak daftarnya!`;

  const eventList = freeEvents.map((e, i) => ({
    rank: i + 1,
    title: e.title,
    slug: e.slug,
    date: e.date,
    venue: e.venue_name || 'TBD',
    category: categoryLabel(e.category),
    description: e.description ? e.description.slice(0, 150) : `Event ${categoryLabel(e.category)} gratis yang sayang untuk dilewatkan.`,
  }));

  const tips = [
    'Daftar lebih awal karena kuota biasanya terbatas',
    'Cek syarat dan ketentuan sebelum datang',
    'Simpan bukti registrasi di handphone',
    'Datang lebih awal untuk mendapatkan spot terbaik',
  ];

  const conclusion = `Nah, itu dia ${eventCount} event gratis yang bisa kamu nikmati di Jakarta bulan ${currentMonth}! Jangan sampai kelewatan ya. Follow Yukgo.live untuk update event gratis terbaru setiap minggunya! 🆓🎉`;

  return {
    type: 'free_events',
    title,
    seo_title: truncate(`${title} | Yukgo.live`, CONFIG.seoTitleMax),
    meta_description: truncate(`Daftar ${eventCount} event gratis di Jakarta bulan ${currentMonth} 2026. Temukan event seru tanpa biaya hanya di Yukgo.live!`, CONFIG.metaDescMax),
    intro,
    events: eventList,
    tips,
    conclusion,
    generated_with: usedAI ? 'openai' : 'template',
    generated_at: new Date().toISOString(),
  };
}

// ──────────────────────────────────────────
// SOCIAL POST GENERATOR
// ──────────────────────────────────────────

function generateSocialPosts(enrichedEvents) {
  const posts = {
    generated_at: new Date().toISOString(),
    platform_posts: {},
  };

  // Instagram carousel posts
  posts.platform_posts.instagram = enrichedEvents.slice(0, 5).map((e, i) => ({
    event_number: i + 1,
    event_slug: e.slug,
    caption: e.content.instagram_caption,
    hashtags: e.content.hashtags,
    image_url: e.image_url,
    post_type: 'carousel',
  }));

  // Twitter/TikTok posts
  posts.platform_posts.twitter = enrichedEvents.slice(0, 10).map((e, i) => ({
    event_number: i + 1,
    event_slug: e.slug,
    caption: e.content.social_caption,
    image_url: e.image_url,
    post_type: 'text',
  }));

  // Thread format (Twitter thread for top 5)
  posts.platform_posts.twitter_thread = {
    thread_opener: `🧵 THREAD: ${enrichedEvents.length} Event Menarik di Jakarta yang Wajib Kamu Kunjungi! 

Jangan sampai ketinggalan event-event seru ini 👇

1/${enrichedEvents.length}`,
    tweets: enrichedEvents.slice(0, 10).map((e, i) => ({
      number: i + 1,
      text: `${i + 1}/${enrichedEvents.length} ✨ ${e.title}

📅 ${formatDate(e.date)}
📍 ${e.venue_name || 'TBD'}
💰 ${e.price_min > 0 ? `Rp ${e.price_min.toLocaleString('id-ID')}` : 'GRATIS!'}

${e.content.social_caption}

🔗 yukgo.live/events/${e.slug}`,
    })),
  };

  return posts;
}

// ──────────────────────────────────────────
// MAIN PIPELINE
// ──────────────────────────────────────────

async function main() {
  const args = parseArgs();
  const testMode = args.test || false;

  console.log('');
  console.log('╔══════════════════════════════════════════════════╗');
  console.log('║     YUKGO.LIVE — Agent 2: CONTENT FACTORY      ║');
  console.log('║     Rich Content Generation Pipeline            ║');
  console.log('╚══════════════════════════════════════════════════╝');
  console.log('');

  // ── Load Events ──────────────────────────
  const inputArg = args.input;
  let inputPath;

  if (inputArg) {
    inputPath = inputArg;
  } else {
    // Auto-detect: try to find the latest events file
    const eventsDir = CONFIG.eventsDir;
    if (existsSync(eventsDir)) {
      const files = (await readdir(eventsDir))
        .filter(f => f.startsWith('events-') && f.endsWith('.json'))
        .sort()
        .reverse();
      if (files.length > 0) {
        inputPath = join(eventsDir, files[0]);
        log('Input', `Auto-detected latest file: ${files[0]}`);
      }
    }
    if (!inputPath) {
      inputPath = join(eventsDir, CONFIG.defaultInput);
    }
  }

  log('Pipeline', `Starting ${testMode ? 'TEST' : 'FULL'} run`);
  log('Pipeline', `Time: ${new Date().toLocaleString('id-ID')}`);
  log('Pipeline', `Input: ${inputPath}`);

  let events;
  try {
    const rawData = await readFile(inputPath, 'utf-8');
    events = JSON.parse(rawData);
    log('Input', `Loaded ${events.length} events from file`, 'DATA');
  } catch (err) {
    log('Input', `Failed to load events: ${err.message}`, 'ERROR');
    log('Input', 'Make sure Agent 1 (Event Hunter) has run first!', 'WARN');
    process.exit(1);
  }

  if (testMode) {
    events = events.slice(0, 3);
    log('Pipeline', `TEST mode: processing ${events.length} events only`);
  }

  // ── Setup OpenAI (optional) ──────────────
  const apiKey = process.env.OPENAI_API_KEY;
  let openai = null;
  let useAI = false;

  if (apiKey) {
    try {
      const { default: OpenAI } = await import('openai');
      openai = new OpenAI({ apiKey });
      useAI = true;
      log('OpenAI', `API key loaded. Using model: ${CONFIG.model}`, 'AI');
    } catch (err) {
      log('OpenAI', `Failed to init OpenAI client: ${err.message}`, 'WARN');
    }
  } else {
    log('OpenAI', 'No OPENAI_API_KEY found. Using template-based fallback.', 'WARN');
    log('OpenAI', 'Set OPENAI_API_KEY env var to enable AI content generation.', 'WARN');
  }

  // ── Cost Estimation ──────────────────────
  console.log('');
  const cost = estimateCost(events.length);
  log('Cost', `Estimated API usage for ${events.length} events:`, 'MONEY');
  log('Cost', `  Input tokens:  ~${cost.inputTokens.toLocaleString()}`);
  log('Cost', `  Output tokens: ~${cost.outputTokens.toLocaleString()}`);
  log('Cost', `  Total tokens:  ~${cost.totalTokens.toLocaleString()}`);
  log('Cost', `  Estimated cost: $${cost.estimatedCostUSD.toFixed(4)} (~Rp ${Math.round(cost.estimatedCostIDR).toLocaleString('id-ID')})`);
  if (!useAI) {
    log('Cost', '(Using template fallback — no API cost)', 'INFO');
  }
  console.log('');

  // ── Generate Content for Each Event ──────
  const startTime = Date.now();
  const enrichedEvents = [];
  let totalTokensUsed = 0;

  for (let i = 0; i < events.length; i++) {
    const event = events[i];
    const progress = `[${i + 1}/${events.length}]`;
    log('Content', `${progress} Processing: ${truncate(event.title, 45)}`);

    let content;
    if (useAI && openai) {
      content = await generateAIContent(event, openai);
      if (content._tokens) {
        totalTokensUsed += content._tokens.total;
        delete content._tokens;
      }
    } else {
      content = generateTemplateContent(event);
    }

    enrichedEvents.push({
      ...event,
      content,
      enriched_at: new Date().toISOString(),
    });

    // Small delay between AI requests
    if (useAI && i < events.length - 1) {
      await new Promise(r => setTimeout(r, 500));
    }
  }

  log('Content', `Enriched ${enrichedEvents.length} events`, 'DATA');

  // ── Generate Articles ────────────────────
  console.log('');
  log('Articles', 'Generating curated articles...');

  const weeklyRoundup = generateWeeklyRoundup(enrichedEvents, useAI);
  log('Articles', `Weekly roundup: "${weeklyRoundup.title}"`);

  const freeEvents = generateFreeEventsArticle(enrichedEvents, useAI);
  log('Articles', `Free events: "${freeEvents.title}"`);

  // ── Generate Social Posts ────────────────
  log('Social', 'Generating social media posts...');
  const socialPosts = generateSocialPosts(enrichedEvents);
  const igCount = socialPosts.platform_posts.instagram.length;
  const twCount = socialPosts.platform_posts.twitter.length;
  log('Social', `Generated: ${igCount} Instagram posts, ${twCount} Twitter posts, 1 thread`);

  // ── Save Output ──────────────────────────
  console.log('');
  log('Storage', 'Saving enriched content...');

  const outputDir = CONFIG.outputDir;
  const articlesDir = CONFIG.articlesDir;
  const socialDir = CONFIG.socialDir;

  await mkdir(outputDir, { recursive: true });
  await mkdir(articlesDir, { recursive: true });
  await mkdir(socialDir, { recursive: true });

  // Enriched events
  const enrichedPath = join(outputDir, 'events-enriched.json');
  await writeFile(enrichedPath, JSON.stringify(enrichedEvents, null, 2));
  log('Storage', `Saved enriched events → ${enrichedPath}`, 'DATA');

  // Articles
  const weekSlug = `weekly-roundup-${new Date().toISOString().slice(0, 10)}`;
  const weekPath = join(articlesDir, `${weekSlug}.json`);
  await writeFile(weekPath, JSON.stringify(weeklyRoundup, null, 2));
  log('Storage', `Saved weekly roundup → ${weekPath}`, 'DATA');

  const freeSlug = `free-events-${new Date().toISOString().slice(0, 10)}`;
  const freePath = join(articlesDir, `${freeSlug}.json`);
  await writeFile(freePath, JSON.stringify(freeEvents, null, 2));
  log('Storage', `Saved free events → ${freePath}`, 'DATA');

  // Social posts
  const socialPath = join(socialDir, `social-posts-${new Date().toISOString().slice(0, 10)}.json`);
  await writeFile(socialPath, JSON.stringify(socialPosts, null, 2));
  log('Storage', `Saved social posts → ${socialPath}`, 'DATA');

  // Summary manifest
  const manifest = {
    run_at: new Date().toISOString(),
    mode: testMode ? 'test' : 'full',
    generation_method: useAI ? 'openai' : 'template',
    model: useAI ? CONFIG.model : null,
    events_processed: enrichedEvents.length,
    articles_generated: 2,
    social_posts_generated: igCount + twCount + (socialPosts.platform_posts.twitter_thread?.tweets?.length || 0),
    tokens_used: useAI ? totalTokensUsed : 0,
    estimated_cost_usd: useAI ? (totalTokensUsed / 1000000 * 0.35) : 0,
    files: {
      enriched_events: enrichedPath,
      articles: [weekPath, freePath],
      social_posts: socialPath,
    },
  };
  const manifestPath = join(outputDir, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(manifest, null, 2));
  log('Storage', `Saved manifest → ${manifestPath}`, 'DATA');

  // ── Print Summary ────────────────────────
  const duration = ((Date.now() - startTime) / 1000).toFixed(1);

  console.log('');
  console.log('┌──────────────────────────────────────────────┐');
  console.log('│           RUN SUMMARY                        │');
  console.log('├──────────────────────────────────────────────┤');
  console.log(`│  Duration:     ${duration}s`);
  console.log(`│  Events:       ${enrichedEvents.length} enriched`);
  console.log(`│  Articles:     2 generated`);
  console.log(`│  Social Posts: ${igCount + twCount} generated`);
  console.log(`│  Mode:         ${testMode ? 'TEST' : 'FULL'}`);
  console.log(`│  AI Engine:    ${useAI ? CONFIG.model : 'Template Fallback'}`);
  if (useAI) {
    const actualCost = (totalTokensUsed / 1000000 * 0.35);
    console.log(`│  Tokens Used:  ${totalTokensUsed.toLocaleString()}`);
    console.log(`│  API Cost:     ~$${actualCost.toFixed(4)}`);
  }
  console.log('└──────────────────────────────────────────────┘');

  // ── Print Sample Content ─────────────────
  if (enrichedEvents.length > 0) {
    console.log('');
    console.log('┌──────────────────────────────────────────────┐');
    console.log('│           SAMPLE ENRICHED EVENT              │');
    console.log('├──────────────────────────────────────────────┤');
    const sample = enrichedEvents[0];
    console.log(`│  Original: ${sample.title}`);
    console.log(`│  SEO Title: ${sample.content.seo_title}`);
    console.log(`│  Meta: ${truncate(sample.content.meta_description, 50)}`);
    console.log('│');
    console.log(`│  Description preview:`);
    const descLines = sample.content.description.split('\n').filter(l => l.trim()).slice(0, 3);
    descLines.forEach(line => {
      console.log(`│    ${truncate(line.trim(), 55)}`);
    });
    console.log('│');
    console.log(`│  Instagram preview:`);
    const igLines = sample.content.instagram_caption.split('\n').slice(0, 4);
    igLines.forEach(line => {
      console.log(`│    ${truncate(line.trim(), 55)}`);
    });
    console.log('│');
    console.log(`│  Social: ${truncate(sample.content.social_caption, 50)}`);
    console.log('└──────────────────────────────────────────────┘');
  }

  console.log('');
  log('Pipeline', 'Done! Content Factory complete.');
  console.log('');

  return enrichedEvents;
}

// ──────────────────────────────────────────
// RUN
// ──────────────────────────────────────────

main().catch(err => {
  log('Pipeline', `Fatal: ${err.message}`, 'ERROR');
  console.error(err);
  process.exit(1);
});
