#!/usr/bin/env node
/* Tailles minimales (retour de Bora du 15/11/2026) : 12 px pour un libellé
 * (texte en capitales, ou de moins de trois mots), 14 px pour toute phrase
 * (trois mots ou plus, hors capitales). Illustrations comprises. Mesuré dans Chromium sur la
 * taille de police calculée de chaque nœud de texte visible, à 390 et 1280 px.
 * Ignorés : le texte réservé aux lecteurs d'écran (.sr) et le texte des SVG.
 *
 *   node tests/tailles.mjs [pages…]   (défaut : toutes les pages générées) */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.vtt': 'text/vtt' };
const serve = () => new Promise((res) => {
  const srv = http.createServer((req, rsp) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { rsp.writeHead(404); return rsp.end(); }
    rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
  }).listen(0, '127.0.0.1', () => res(srv));
});

const pages = process.argv.slice(2).length ? process.argv.slice(2)
  : fs.readdirSync(path.join(ROOT, '_src/pages'), { recursive: true }).filter((f) => f.endsWith('.html')).sort();

const srv = await serve();
const base = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch();
let bad = 0;
for (const w of [390, 1280]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
  await ctx.addInitScript(() => { try { localStorage.setItem('celya-consent', 'denied'); } catch (e) {} });
  for (const rel of pages) {
    const p = await ctx.newPage();
    await p.goto(base + rel, { waitUntil: 'load' });
    await p.evaluate(() => { document.querySelectorAll('details').forEach((d) => { d.open = true; }); });
    const found = await p.evaluate(() => {
      const out = [];
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      let n;
      while ((n = walker.nextNode())) {
        const t = n.nodeValue.replace(/\s+/g, ' ').trim();
        if (!t || !/[\p{L}\p{N}]/u.test(t)) continue;
        const el = n.parentElement;
        if (!el || el.closest('.sr, svg, script, style, noscript, .skip')) continue;
        const cs = getComputedStyle(el);
        if (cs.display === 'none' || cs.visibility === 'hidden') continue;
        const r = el.getBoundingClientRect();
        if (r.width === 0 || r.height === 0) continue;
        const fs = parseFloat(cs.fontSize);
        const words = t.split(' ').filter((x) => /[\p{L}\p{N}]/u.test(x)).length;
        const caps = cs.textTransform === 'uppercase';
        const min = words >= 3 && !caps ? 14 : 12;
        if (fs + 0.01 < min) {
          const sel = el.tagName.toLowerCase() + (el.className && typeof el.className === 'string' ? '.' + el.className.trim().split(/\s+/).join('.') : '');
          out.push(`${fs}px < ${min} · ${sel} « ${t.slice(0, 50)} »`);
        }
      }
      return [...new Set(out)];
    });
    if (found.length) { bad += found.length; console.log(`✗ ${rel} @${w}\n    ${found.join('\n    ')}`); }
    await p.close();
  }
  await ctx.close();
}
await browser.close();
srv.close();
console.log(bad ? `\n${bad} texte(s) sous la taille minimale.` : `Tailles : ${pages.length} pages, aucun texte sous 12 px (libellés) ni sous 14 px (phrases).`);
process.exit(bad ? 1 : 0);
