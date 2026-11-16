#!/usr/bin/env node
/* Les outils des pages migrées marchent encore : modèles à copier (boutons
 * [data-copy]), check-lists (.ck → #ckscore), grilles ([data-g], boutons
 * g-copy / g-print), calculateurs (#calc → #r3). Chromium, sans erreur JS.
 *
 *   node tests/outils.mjs   (sert le dépôt sur un port libre) */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
const require = createRequire('/opt/node-tools/node_modules/');
const { chromium } = require('playwright');
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.ico': 'image/x-icon' };
const srv = http.createServer((q, r) => {
  let f = path.join(ROOT, decodeURIComponent(q.url.split('?')[0]));
  if (f.endsWith('/')) f += 'index.html';
  if (!fs.existsSync(f)) { r.writeHead(404); return r.end(); }
  r.writeHead(200, { 'content-type': TYPES[path.extname(f)] || 'application/octet-stream' });
  fs.createReadStream(f).pipe(r);
}).listen(0);
const base = `http://127.0.0.1:${srv.address().port}/`;

/* les pages qui portent un outil, d'après leur HTML */
const pages = fs.readdirSync(path.join(ROOT, '_src/pages'), { recursive: true }).filter((f) => f.endsWith('.html'))
  .filter((f) => /data-copy|class="ck|data-g=|id="calc"/.test(fs.readFileSync(path.join(ROOT, f), 'utf8')));
const b = await chromium.launch();
const ctx = await b.newContext({ permissions: ['clipboard-read', 'clipboard-write'] });
let bad = 0;
for (const rel of pages) {
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(base + rel, { waitUntil: 'load' });
  const res = await p.evaluate(async () => {
    const out = [];
    const wait = (ms) => new Promise((r) => setTimeout(r, ms));
    const copy = document.querySelector('[data-copy]');
    if (copy) { const t = copy.textContent; copy.click(); await wait(200); out.push(['copier', copy.textContent !== t]); }
    const ck = document.querySelector('.ck input[type=checkbox]'), sc = document.getElementById('ckscore') || document.getElementById('cks') || document.getElementById('cmps');
    if (ck && sc) { const t = sc.textContent; ck.click(); ck.dispatchEvent(new Event('change')); await wait(50); out.push(['check-list', sc.textContent !== t && sc.textContent.length > 0]); }
    const g = document.querySelector('[data-g]'), gc = document.getElementById('g-copy') || document.getElementById('gcopy');
    if (g && gc) { g.value = 'Test'; g.dispatchEvent(new Event('input')); const t = gc.textContent; gc.click(); await wait(200); out.push(['grille', gc.textContent !== t]); }
    const c = document.querySelector('#calc input'), r3 = document.getElementById('r3');
    if (c && r3) { c.value = '100'; c.dispatchEvent(new Event('input')); await wait(50); out.push(['calcul', /\d/.test(r3.textContent)]); }
    return out;
  });
  const ko = res.filter(([, ok]) => !ok).map(([n]) => n);
  if (!res.length) ko.push('aucun outil trouvé');
  if (errs.length) ko.push('erreur JS : ' + errs[0]);
  if (ko.length) { bad++; console.log(`✗ ${rel} — ${ko.join(' · ')}`); }
  await p.close();
}
await b.close();
srv.close();
console.log(`\nOutils : ${pages.length - bad} page(s) sur ${pages.length} où les outils répondent.`);
process.exit(bad ? 1 : 0);
