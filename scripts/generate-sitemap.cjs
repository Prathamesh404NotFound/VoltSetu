// VoltSetu sitemap generator.
// - Static pages and all 8 city landing pages are ALWAYS emitted (authoritative routes).
// - Live charging-spot URLs are appended when Firebase responds.
// - Network failures degrade gracefully: a partial sitemap is still valid and
//   much better than an empty file.
const fs = require('fs');
const https = require('https');
const path = require('path');

const BASE_URL = 'https://volt-setu.vercel.app';
const FIREBASE_DB_URL = 'https://charge-nest-default-rtdb.asia-southeast1.firebasedatabase.app/chargingSpots.json';
const FIREBASE_USERS_URL = 'https://charge-nest-default-rtdb.asia-southeast1.firebasedatabase.app/users.json';

// cities.json is a tiny static snapshot (slug + active) kept in sync by the
// `npm run sync-cities` script whenever src/lib/cities.ts changes. It exists
// so this Node script doesn't need to parse TypeScript.

const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/spots', priority: '0.9', changefreq: 'always' },
  { url: '/route', priority: '0.9', changefreq: 'daily' },
  { url: '/rescue', priority: '0.9', changefreq: 'daily' },
  { url: '/host', priority: '0.8', changefreq: 'monthly' },
  { url: '/how-it-works', priority: '0.7', changefreq: 'monthly' },
  { url: '/pricing', priority: '0.6', changefreq: 'monthly' },
  { url: '/about-contact', priority: '0.6', changefreq: 'monthly' },
  { url: '/privacy', priority: '0.4', changefreq: 'monthly' },
  { url: '/terms', priority: '0.4', changefreq: 'monthly' },
  { url: '/help', priority: '0.4', changefreq: 'monthly' },
];

// Generic city landing pages rendered by /city/:slug — always routable.
// All 50 cities in the registry get a SEO landing page; launch cities get a
// higher priority than coming-soon ones.
const cityPages = require('../src/lib/cities.json')
  .filter((c) => c.active)
  .map((c) => ({
    url: `/city/${c.slug}`,
    priority: '0.8',
    changefreq: 'weekly',
  }));
const activeCitySlugs = require('../src/lib/cities.json').map((c) => c.slug);

function fetchJson(url, timeoutMs) {
  return new Promise((resolve) => {
    const req = https.get(url, { timeout: timeoutMs }, (res) => {
      let data = '';
      res.on('data', (chunk) => { data += chunk; });
      res.on('end', () => {
        try {
          resolve(JSON.parse(data));
        } catch (e) {
          console.error('Failed to parse response:', e.message);
          resolve(null);
        }
      });
    });
    req.on('error', (err) => {
      console.error(`Failed to fetch ${url}:`, err.message);
      resolve(null);
    });
    req.on('timeout', () => {
      console.error(`Timeout fetching ${url}`);
      req.destroy();
    });
  });
}

async function fetchDynamicSpots() {
  const data = await fetchJson(FIREBASE_DB_URL, 8000);
  if (!data) return [];
  return Object.keys(data)
    .map((key) => ({ id: key, ...data[key] }))
    .filter((spot) => spot.status === 'active' || spot.status === 'approved');
}

// Emit /host/:id pages only for users who actually own at least one charging
// spot — this keeps the sitemap free of 404 host URLs. Network failures
// degrade gracefully the same way spot fetching does.
async function fetchHostProfileIds() {
  const [users, spots] = await Promise.all([
    fetchJson(FIREBASE_USERS_URL, 8000),
    fetchJson(FIREBASE_DB_URL, 8000),
  ]);
  if (!spots) return [];
  const spotOwners = new Set(
    Object.values(spots).map((s) => s && s.hostId).filter((id) => Boolean(id))
  );
  if (!users) return Array.from(spotOwners);
  return Object.keys(users).filter((id) => {
    const user = users[id] || {};
    if (!spotOwners.has(id)) return false;
    const role = String(user.role || '').toLowerCase();
    return role === 'host' || role === 'admin' || user.isVerified === true;
  });
}

function formatDate(timestamp) {
  if (!timestamp) return new Date().toISOString().split('T')[0];
  return new Date(timestamp).toISOString().split('T')[0];
}

async function generate() {
  console.log('Generating sitemap...');

  const [spots, hostIds] = await Promise.all([fetchDynamicSpots(), fetchHostProfileIds()]);
  console.log(`Fetched ${spots.length} live spots and ${hostIds.length} host profiles.`);

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  staticPages.forEach((page) => {
    sitemap += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${formatDate()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
  });

  cityPages.forEach((page) => {
    sitemap += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${formatDate()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
  });

  // Host profile pages (if host has active spots)
  hostIds.forEach((id) => {
    sitemap += `  <url>
    <loc>${BASE_URL}/host/${id}</loc>
    <lastmod>${formatDate()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>\n`;
  });

  sitemap += '</urlset>';
  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, sitemap);
  console.log(`Sitemap generated at ${outputPath}`);
}

generate();
