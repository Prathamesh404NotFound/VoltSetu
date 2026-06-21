// TODO: Update BASE_URL to the new VoltSetu domain once the Netlify site is renamed (domain migration deferred).
const fs = require('fs');
const https = require('https');
const path = require('path');

const BASE_URL = 'https://charge-nest.netlify.app';
const FIREBASE_DB_URL = 'https://charge-nest-default-rtdb.asia-southeast1.firebasedatabase.app/chargingSpots.json';

const staticPages = [
  { url: '/', priority: '1.0', changefreq: 'daily' },
  { url: '/spots', priority: '0.9', changefreq: 'always' },
  { url: '/host', priority: '0.8', changefreq: 'monthly' },
  { url: '/how-it-works', priority: '0.7', changefreq: 'monthly' },
  { url: '/pricing', priority: '0.6', changefreq: 'monthly' },
  { url: '/about', priority: '0.5', changefreq: 'monthly' },
  { url: '/contact', priority: '0.5', changefreq: 'monthly' },
];

async function fetchDynamicSpots() {
  return new Promise((resolve) => {
    https.get(FIREBASE_DB_URL, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        try {
          const spots = JSON.parse(data);
          if (!spots) return resolve([]);
          
          return resolve(Object.keys(spots).map(key => ({
            id: key,
            ...spots[key]
          })).filter(spot => spot.status === 'active' || spot.status === 'approved'));
        } catch (e) {
          console.error('Failed to parse Firebase data:', e.message);
          resolve([]);
        }
      });
    }).on('error', (err) => {
      console.error('Failed to fetch from Firebase:', err.message);
      resolve([]);
    });
  });
}

function formatDate(timestamp) {
  if (!timestamp) return new Date().toISOString().split('T')[0];
  const date = new Date(timestamp);
  return date.toISOString().split('T')[0];
}

async function generate() {
  console.log('Generating sitemap...');
  
  const dynamicSpots = await fetchDynamicSpots();
  console.log(`Fetched ${dynamicSpots.length} dynamic spots.`);

  let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
`;

  // Add static pages
  staticPages.forEach(page => {
    sitemap += `  <url>
    <loc>${BASE_URL}${page.url}</loc>
    <lastmod>${formatDate()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>\n`;
  });

  // Add dynamic spot pages (if routes exist)
  // For now, prompt mentioned "if/when a dedicated per-spot route exists"
  // Since we don't have them yet, we skip adding /spots/:id URLs 
  // to avoid broken links in the sitemap. 
  // However, I will leave the code commented out or structured for easy activation.
  
  /*
  dynamicSpots.forEach(spot => {
    sitemap += `  <url>
    <loc>${BASE_URL}/spots/${spot.id}</loc>
    <lastmod>${formatDate(spot.updatedAt || spot.createdAt)}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>\n`;
  });
  */

  sitemap += '</urlset>';

  const outputPath = path.join(__dirname, '../public/sitemap.xml');
  fs.writeFileSync(outputPath, sitemap);
  console.log(`Sitemap generated at ${outputPath}`);
}

generate();
