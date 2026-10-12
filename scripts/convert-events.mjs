// Script to convert crawled events → website TypeScript data
import { readFileSync, writeFileSync, readdirSync } from 'fs';

// Auto-detect latest events file
const eventsDir = './data/events';
const eventFiles = readdirSync(eventsDir)
  .filter(f => f.startsWith('events-') && f.endsWith('.json'))
  .sort()
  .reverse();
const latestFile = eventFiles[0];
if (!latestFile) { console.error('No events file found!'); process.exit(1); }

const events = JSON.parse(readFileSync(`${eventsDir}/${latestFile}`, 'utf8'));
console.log(`Source: ${latestFile}`);
console.log(`Total events: ${events.length}`);

// Filter non-Indonesian
const skipPatterns = [
  "prestakuntza", "capacitación", "programas de", "masterclass:",
  "encuentro exclusivo", "sessió informativa", "fuga de talento",
  "u-start avanza", "cómo ", "para mi pyme", "educadores comunitarios",
  "comerç internacional", "cfgs en", "afiliados para", "mi pyme"
];

const filtered = events.filter(e => {
  const title = (e.title || "").toLowerCase();
  return !skipPatterns.some(p => title.includes(p));
});

console.log(`Indonesian events: ${filtered.length}`);
console.log(`Removed: ${events.length - filtered.length}`);

// Generate TS
const lines = [
  "import { Event } from '@/lib/types';",
  "",
  "export const sampleEvents: Event[] = [",
];

filtered.forEach((ev, i) => {
  const isFree = (ev.price_min || 0) === 0 && (ev.price_max || 0) === 0;
  const esc = (s) => s === null ? 'null' : JSON.stringify(String(s)).slice(1, -1);

  lines.push("  {");
  lines.push(`    "id": "${i + 1}",`);
  lines.push(`    "title": ${JSON.stringify(ev.title || "")},`);
  lines.push(`    "slug": ${JSON.stringify(ev.slug || "")},`);
  lines.push(`    "date": ${JSON.stringify(ev.date || "")},`);
  lines.push(`    "time": ${JSON.stringify(ev.time || "")},`);
  lines.push(`    "end_date": ${JSON.stringify(ev.end_date || "")},`);
  lines.push(`    "venue_name": ${JSON.stringify(ev.venue_name)},`);
  lines.push(`    "address": ${JSON.stringify(ev.address)},`);
  lines.push(`    "city": ${JSON.stringify(ev.city || "Jakarta")},`);
  lines.push(`    "category": ${JSON.stringify(ev.category || "other")},`);
  lines.push(`    "price_min": ${ev.price_min || 0},`);
  lines.push(`    "price_max": ${ev.price_max || 0},`);
  lines.push(`    "currency": "IDR",`);
  lines.push(`    "description": ${JSON.stringify(ev.description || "")},`);
  lines.push(`    "image_url": ${JSON.stringify(ev.image_url || "")},`);
  lines.push(`    "ticket_url": ${JSON.stringify(ev.ticket_url || "")},`);
  lines.push(`    "organizer": ${JSON.stringify(ev.organizer)},`);
  lines.push(`    "source": ${JSON.stringify(ev.source || "")},`);
  lines.push(`    "source_id": ${JSON.stringify(ev.source_id || "")},`);
  lines.push(`    "discovered_at": ${JSON.stringify(ev.discovered_at || "")},`);
  lines.push(`    "status": "published",`);
  lines.push(`    "featured": ${i < 4},`);
  lines.push(`    "view_count": ${100 + i * 50},`);
  lines.push(`    "is_free": ${isFree}`);
  lines.push(i < filtered.length - 1 ? "  }," : "  }");
});

lines.push("];");
lines.push("");

// Helper functions (always included)
lines.push(`export function getFeaturedEvents() {`);
lines.push(`  return sampleEvents.filter(e => e.featured);`);
lines.push(`}`);
lines.push(``);
lines.push(`export function getEventBySlug(slug: string) {`);
lines.push(`  return sampleEvents.find(e => e.slug === slug);`);
lines.push(`}`);
lines.push(``);
lines.push(`export function searchEvents(query: string) {`);
lines.push(`  const q = query.toLowerCase();`);
lines.push(`  return sampleEvents.filter(e =>`);
lines.push(`    e.title.toLowerCase().includes(q) ||`);
lines.push(`    e.description.toLowerCase().includes(q) ||`);
lines.push(`    (e.venue_name || '').toLowerCase().includes(q) ||`);
lines.push(`    e.city.toLowerCase().includes(q)`);
lines.push(`  );`);
lines.push(`}`);
lines.push(``);

writeFileSync('./website/src/data/events.ts', lines.join('\n'));
console.log(`Written ${filtered.length} events to website/src/data/events.ts`);
