#!/usr/bin/env node
// Generate the 3-layer icon system + derived platform assets from brand.config.json.
// Usage: node scripts/generate-icons.mjs --config brand.config.json --out out/icons
import { mkdirSync, writeFileSync, readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import { placed, svg, symbol } from './lib/symbol.mjs';

const PRIDE_STOPS = ['E40303', 'FF8C00', 'FFED00', '008026', '004DFF', '750787'];
const PRIDE_DEFS = `<defs><linearGradient id="pride" x1="0" y1="0" x2="0" y2="1">${PRIDE_STOPS.map((c, i) => `<stop offset="${(i / (PRIDE_STOPS.length - 1) * 100).toFixed(2)}%" stop-color="#${c}"/>`).join('')}</linearGradient></defs>`;

// WCAG relative luminance + contrast ratio between two hex colors.
function luminance(hex) {
  const h = hex.replace('#', '');
  const ch = [0, 2, 4].map((i) => {
    const c = parseInt(h.slice(i, i + 2), 16) / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Themed symbol overlay (framed symbol + theme extras), without any background.
function themeOverlay(size, theme) {
  if (theme.rainbow) return PRIDE_DEFS + placed(size, 'url(#pride)', SAFE);
  let body = placed(size, theme.fg || '#FFFFFF', SAFE);
  if (theme.accent) {
    body += `<circle cx="${(size * 0.74).toFixed(1)}" cy="${(size * 0.24).toFixed(1)}" r="${(size * 0.07).toFixed(1)}" fill="${theme.accent}"/>`;
  }
  return body;
}
// Full-bleed themed app-icon body: opaque background rect + overlay.
function themeInner(size, theme) {
  return `<rect width="${size}" height="${size}" fill="${theme.bg}"/>${themeOverlay(size, theme)}`;
}

const args = Object.fromEntries(
  process.argv.slice(2).reduce((a, v, i, arr) => (v.startsWith('--') ? [...a, [v.slice(2), arr[i + 1]]] : a), [])
);
const here = dirname(fileURLToPath(import.meta.url));
const cfg = JSON.parse(readFileSync(args.config || join(here, '..', 'brand.config.json'), 'utf8'));
const OUT = args.out || join(here, '..', 'out', 'icons');
const SAFE = cfg.safeZone ?? 0.56;
const RAD = cfg.radiusPct ?? 0.2235;

let sharp;
try { ({ default: sharp } = await import('sharp')); }
catch { console.error('Missing dependency "sharp". Run `npm install` in the brandkit repo first.'); process.exit(1); }

function w(rel, c) { const p = join(OUT, rel); mkdirSync(dirname(p), { recursive: true }); writeFileSync(p, c); }
async function rp(rel, s) { const p = join(OUT, rel); mkdirSync(dirname(p), { recursive: true }); await sharp(Buffer.from(s)).png().toFile(p); }

const DENS = { mdpi: 48, hdpi: 72, xhdpi: 96, xxhdpi: 144, xxxhdpi: 192 };
const tasks = [];

for (const p of cfg.products) {
  const k = p.key;
  // --- 3 reusable master layers (SVG, scalable) ---
  w(`${k}/layers/bg.svg`,      svg(1024, `<rect width="1024" height="1024" fill="${p.bg}"/>`));
  w(`${k}/layers/bg-dark.svg`, svg(1024, `<rect width="1024" height="1024" fill="${p.bgDark || p.bg}"/>`));
  w(`${k}/layers/fg.svg`,      svg(1024, placed(1024, p.fg, SAFE)));
  w(`${k}/layers/mono.svg`,    svg(1024, placed(1024, '#000000', SAFE)));

  // --- iOS: opaque AppStore icon (no alpha) light + dark ---
  const composite = (bg, size) => svg(size, `<rect width="${size}" height="${size}" fill="${bg}"/>${placed(size, p.fg, SAFE)}`);
  tasks.push(rp(`${k}/ios/AppStore-1024.png`, composite(p.bg, 1024)).then(() => flattenLast(`${k}/ios/AppStore-1024.png`, p.bg)));
  tasks.push(rp(`${k}/ios/AppStore-dark-1024.png`, composite(p.bgDark || p.bg, 1024)));

  // --- Android: adaptive layers + legacy mipmaps + play store ---
  tasks.push(rp(`${k}/android/ic_launcher_background.png`, svg(432, `<rect width="432" height="432" fill="${p.bg}"/>`)));
  tasks.push(rp(`${k}/android/ic_launcher_foreground.png`, svg(432, placed(432, p.fg, SAFE))));
  tasks.push(rp(`${k}/android/ic_launcher_monochrome.png`, svg(432, placed(432, '#000000', SAFE))));
  tasks.push(rp(`${k}/android/playstore-512.png`, composite(p.bg, 512)));
  for (const [d, s] of Object.entries(DENS)) {
    tasks.push(rp(`${k}/android/mipmap-${d}/ic_launcher.png`, svg(s, `<rect width="${s}" height="${s}" rx="${(s * 0.16).toFixed(1)}" fill="${p.bg}"/>${placed(s, p.fg, SAFE)}`)));
    tasks.push(rp(`${k}/android/mipmap-${d}/ic_launcher_round.png`, svg(s, `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="${p.bg}"/>${placed(s, p.fg, SAFE)}`)));
  }

  // --- Web ---
  w(`${k}/web/favicon.svg`, `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" role="img" aria-label="${p.name}"><style>@media (prefers-color-scheme:dark){.bg{fill:${p.bgDark || p.bg}}}</style><rect class="bg" width="64" height="64" rx="14" fill="${p.bg}"/>${placedAt(64, p.fg, 0.62)}</svg>`);
  w(`${k}/web/mask-icon.svg`, svg(16, placed(16, '#000000', 0.7)));
  tasks.push(rp(`${k}/web/apple-touch-180.png`, composite(p.bg, 180)));
  tasks.push(rp(`${k}/web/maskable-512.png`, svg(512, `<rect width="512" height="512" fill="${p.bg}"/>${placed(512, p.fg, 0.5)}`)));
  for (const s of [16, 32, 192, 512]) tasks.push(rp(`${k}/web/icon-${s}.png`, svg(s, `<rect width="${s}" height="${s}" rx="${(s * 0.16).toFixed(1)}" fill="${p.bg}"/>${placed(s, p.fg, 0.64)}`)));

  // --- Theme alternates (seasonal remote-switchable icons) ---
  for (const t of (cfg.themes || [])) {
    if (t.key === 'default') continue;
    const tk = t.key;
    const square = (size) => svg(size, themeInner(size, t));
    // Full-bleed opaque squares, flattened to drop any alpha.
    for (const s of [1024, 512]) tasks.push(rp(`${k}/themes/${tk}/icon-${s}.png`, square(s)).then(() => flattenLast(`${k}/themes/${tk}/icon-${s}.png`, t.bg)));
    // iOS loose alternate PNGs (cannot live in the asset catalog).
    for (const [suf, s] of [['@2x', 120], ['@3x', 180]]) tasks.push(rp(`${k}/ios/alternates/${tk}${suf}.png`, square(s)).then(() => flattenLast(`${k}/ios/alternates/${tk}${suf}.png`, t.bg)));
    // Android per-density mipmaps: square (rounded-rect) + round (circle).
    for (const [d, s] of Object.entries(DENS)) {
      tasks.push(rp(`${k}/android/mipmap-${d}/ic_launcher_${tk}.png`, svg(s, `<rect width="${s}" height="${s}" rx="${(s * 0.16).toFixed(1)}" fill="${t.bg}"/>${themeOverlay(s, t)}`)));
      tasks.push(rp(`${k}/android/mipmap-${d}/ic_launcher_${tk}_round.png`, svg(s, `<circle cx="${s / 2}" cy="${s / 2}" r="${s / 2}" fill="${t.bg}"/>${themeOverlay(s, t)}`)));
    }
  }
}

// --- WCAG contrast check (warn-only) for every product x theme combination. ---
let contrastWarned = false;
for (const p of cfg.products) {
  for (const t of (cfg.themes || [])) {
    const bg = t.key === 'default' ? p.bg : t.bg;
    const fg = t.rainbow ? null : (t.key === 'default' ? p.fg : (t.fg || '#FFFFFF'));
    if (!fg) continue; // rainbow gradient has no single fg to score
    const ratio = contrast(fg, bg);
    if (ratio < 3.0) {
      contrastWarned = true;
      console.warn(`⚠ contrast ${p.key}/${t.key} fg ${fg} on ${bg} = ${ratio.toFixed(1)} (<3.0)`);
    }
  }
}
if (!contrastWarned) console.log('contrast: all OK');

function placedAt(size, fill, frac) { return placed(size, fill, frac); }
async function flattenLast(rel, bg) { const p = join(OUT, rel); const buf = await sharp(p).flatten({ background: bg }).png().toBuffer(); await sharp(buf).toFile(p); }

await Promise.all(tasks);
console.log(`brandkit: generated icons for ${cfg.products.map((p) => p.key).join(', ')} -> ${OUT}`);
