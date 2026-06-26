#!/usr/bin/env node
// Install generated web assets into a site's public dir and write a webmanifest.
// Usage: node scripts/install/web.mjs <web-public-dir> <out/icons> [productKey=buky]
import { cpSync, mkdirSync, writeFileSync, existsSync, readFileSync } from 'fs';
import { join, dirname, resolve } from 'path';
import { fileURLToPath } from 'url';

const [publicDir, iconsDir, product = 'buky'] = process.argv.slice(2);
if (!publicDir || !iconsDir) { console.error('usage: web.mjs <web-public-dir> <out/icons> [product]'); process.exit(1); }

const src = join(iconsDir, product, 'web');
if (!existsSync(src)) { console.error(`No generated web assets at ${src}. Run generate-icons.mjs first.`); process.exit(1); }
mkdirSync(publicDir, { recursive: true });

const FILES = [
  'favicon.svg',
  'icon-16.png',
  'icon-32.png',
  'icon-192.png',
  'icon-512.png',
  'apple-touch-180.png',
  'maskable-512.png',
  'mask-icon.svg',
];
for (const f of FILES) {
  const from = join(src, f);
  if (existsSync(from)) cpSync(from, join(publicDir, f));
  else console.warn(`! missing ${f} in ${src} (skipped)`);
}

// Look up product name + bg color from brand.config.json (best-effort).
const here = dirname(fileURLToPath(import.meta.url));
const configPath = resolve(here, '..', '..', 'brand.config.json');
let name = product;
let bg = '#0F2922';
try {
  const cfg = JSON.parse(readFileSync(configPath, 'utf8'));
  const p = (cfg.products || []).find((x) => x.key === product);
  if (p) { name = p.name || name; bg = p.bg || bg; }
} catch { /* fall back to defaults */ }

const manifest = {
  name,
  short_name: name,
  theme_color: bg,
  background_color: bg,
  display: 'standalone',
  icons: [
    { src: 'icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
};
writeFileSync(join(publicDir, 'manifest.webmanifest'), JSON.stringify(manifest, null, 2) + '\n');

console.log(`✓ Web assets installed into ${publicDir}`);
console.log('→ Paste these tags into your <head>:');
console.log('  <link rel="icon" href="/favicon.svg" type="image/svg+xml">');
console.log('  <link rel="icon" href="/icon-32.png" sizes="32x32" type="image/png">');
console.log('  <link rel="apple-touch-icon" href="/apple-touch-180.png" sizes="180x180">');
console.log(`  <link rel="mask-icon" href="/mask-icon.svg" color="${bg}">`);
console.log('  <link rel="manifest" href="/manifest.webmanifest">');
