#!/usr/bin/env node
/* Héros vidéo des accueils (retour de Bora du 15/11/2026).
 *
 *  1. Premier écran : H1, phrase et deux boutons entièrement visibles à
 *     1440×900, 390×844 et 360×640, bandeau cookies affiché ou non ; aucun
 *     bouton recouvert (bandeau, nav, étiquette, barre mobile).
 *  2. Contraste : titre, phrase et bouton secondaire mesurés sur le pixel le
 *     plus clair de la vidéo SOUS chaque bloc (texte masqué, dix instants de la
 *     boucle), à 1440×900, 1280×800, 390×844 et 360×640. Seuil 4,5.
 *  3. Hors écran : video.paused et aucune animation CSS qui tourne hors écran.
 *  4. Poids du premier écran sur téléphone (390×844) : sous 1,2 Mo.
 *
 *  Pages d'atterrissage (lot conversion du 16/11/2026) : mêmes contrôles, plus
 *  les libellés du formulaire translucide dans la mesure de contraste, à 1440,
 *  768, 390 et 360 px ; un bouton visible au-dessus de 860 px (le formulaire
 *  est à côté), deux en dessous ; le bouton du formulaire compte parmi ceux
 *  que rien ne doit recouvrir ; rien ne dépasse (scrollWidth == innerWidth) ;
 *  aucun effet au défilement (l'exception du 15/11 reste aux accueils).
 *
 *   node tests/heros.mjs [pages…]   (défaut : les trois accueils et les quatre pages d'atterrissage) */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import zlib from 'node:zlib';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.vtt': 'text/vtt' };
/* serveur avec requêtes Range (la vidéo se lit par morceaux, comme sur Vercel) */
const serve = () => new Promise((res) => {
  const srv = http.createServer((req, rsp) => {
    let p = decodeURIComponent(req.url.split('?')[0]); if (p.endsWith('/')) p += 'index.html';
    const f = path.join(ROOT, p);
    if (!f.startsWith(ROOT) || !fs.existsSync(f)) { rsp.writeHead(404); return rsp.end(); }
    const size = fs.statSync(f).size, type = TYPES[path.extname(f)] || 'application/octet-stream';
    const m = /bytes=(\d*)-(\d*)/.exec(req.headers.range || '');
    if (m) {
      const a = m[1] ? +m[1] : 0, b = m[2] ? Math.min(+m[2], size - 1) : size - 1;
      rsp.writeHead(206, { 'Content-Type': type, 'Content-Range': `bytes ${a}-${b}/${size}`, 'Accept-Ranges': 'bytes', 'Content-Length': b - a + 1 });
      return fs.createReadStream(f, { start: a, end: b }).pipe(rsp);
    }
    rsp.writeHead(200, { 'Content-Type': type, 'Content-Length': size, 'Accept-Ranges': 'bytes' });
    fs.createReadStream(f).pipe(rsp);
  }).listen(0, '127.0.0.1', () => res(srv));
});

/* décodeur PNG minimal (8 bits, RGB/RGBA, non entrelacé : ce que rend Chromium) */
function png(buf) {
  let o = 8, w, h, ct, idat = [];
  while (o < buf.length) {
    const len = buf.readUInt32BE(o), type = buf.toString('ascii', o + 4, o + 8), data = buf.subarray(o + 8, o + 8 + len);
    if (type === 'IHDR') { w = data.readUInt32BE(0); h = data.readUInt32BE(4); ct = data[9]; }
    if (type === 'IDAT') idat.push(data);
    o += 12 + len;
  }
  const bpp = ct === 6 ? 4 : 3, raw = zlib.inflateSync(Buffer.concat(idat)), stride = w * bpp, out = Buffer.alloc(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], line = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1));
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[y * stride + x - bpp] : 0, b = y ? out[(y - 1) * stride + x] : 0, c = x >= bpp && y ? out[(y - 1) * stride + x - bpp] : 0;
      let v = line[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const p = a + b - c, pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[y * stride + x] = v & 255;
    }
  }
  return { w, h, bpp, px: out };
}
const lin = (c) => { c /= 255; return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
const lum = (r, g, b) => 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
const ratio = (a, b) => (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
const hex = (h) => { const n = parseInt(h.replace('#', ''), 16); return lum(n >> 16, (n >> 8) & 255, n & 255); };

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); console.log(`  ${c ? '✓' : '✗'} ${m}`); };

async function page(browser, base, rel, { w, h, banner }) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  if (!banner) await ctx.addInitScript(() => { try { localStorage.setItem('celya-consent', 'denied'); } catch (e) {} });
  const p = await ctx.newPage();
  await p.goto(base + rel, { waitUntil: 'load' });
  await p.evaluate(() => document.fonts.ready);
  await p.waitForTimeout(400);
  return { ctx, p };
}

const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['index.html', 'nl/index.html', 'en/index.html', 'lp/garages.html', 'lp/ne-plus-rater-d-appels.html', 'nl/lp/garages.html', 'nl/lp/geen-oproepen-meer-missen.html'];
const srv = await serve();
const base = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch();

for (const rel of pages) {
  console.log(`\n${rel}`);
  const LP = /(^|\/)lp\//.test(rel);
  /* 1. premier écran */
  for (const [w, h] of LP ? [[1440, 900], [1280, 800], [768, 1024], [390, 844], [360, 640]] : [[1440, 900], [390, 844], [360, 640]]) {
    for (const banner of [false, true]) {
      const { ctx, p } = await page(browser, base, rel, { w, h, banner });
      const r = await p.evaluate((LP) => {
        const vh = innerHeight, vw = innerWidth;
        const q = (s) => document.querySelector(s);
        const box = (el) => el && el.getBoundingClientRect();
        const shown = (el) => getComputedStyle(el).display !== 'none';
        const inside = (b) => b && b.top >= 0 && b.bottom <= vh && b.left >= 0 && b.right <= vw && b.width > 0;
        const hits = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
        const btns = [...document.querySelectorAll('.hv .cta-btns .btn')].filter(shown).map(box);
        /* tous les boutons du héros dans l'écran (formulaire compris) : rien ne les recouvre */
        const all = [...document.querySelectorAll('.hv .btn')].filter(shown).map(box).filter((b) => b.top < vh && b.bottom > 0);
        const covers = [q('.cbanner'), q('.hdr-in'), q('.hv-tag'), q('.mbar')].filter((x) => x && getComputedStyle(x).visibility !== 'hidden').map(box);
        const want = LP && vw > 860 ? 1 : 2;
        return {
          h1: inside(box(q('.hv h1'))), lead: inside(box(q('.hv .lead'))), btns: btns.length === want && btns.every(inside), n: btns.length, want,
          covered: all.some((b) => covers.some((c) => hits(b, c))),
          sw: document.documentElement.scrollWidth, vw,
        };
      }, LP);
      ok(r.h1 && r.lead && r.btns, `${w}×${h}${banner ? ' bandeau cookies' : ''} : H1, phrase et ${r.want} bouton(s) dans le premier écran (${r.n})`);
      ok(!r.covered, `${w}×${h}${banner ? ' bandeau cookies' : ''} : aucun bouton du héros recouvert`);
      if (LP) ok(r.sw === r.vw, `${w}×${h}${banner ? ' bandeau cookies' : ''} : rien ne dépasse (scrollWidth ${r.sw} = ${r.vw})`);
      await ctx.close();
    }
  }
  /* 2. contraste sur le pixel le plus clair de la vidéo (pages d'atterrissage :
   *    sous le voile et sous le formulaire translucide, libellés compris) */
  for (const [w, h] of LP ? [[1440, 900], [768, 1024], [390, 844], [360, 640]] : [[1440, 900], [1280, 800], [390, 844], [360, 640]]) {
    const { ctx, p } = await page(browser, base, rel, { w, h, banner: false });
    const { targets, clipH } = await p.evaluate((LP) => {
      const box = (el, sel) => { const b = el.getBoundingClientRect(); return { sel, color: getComputedStyle(el).color, x: Math.max(0, b.left), y: Math.max(0, b.top + scrollY), w: b.width, h: b.height }; };
      const shown = (el) => el.getClientRects().length > 0 && getComputedStyle(el).display !== 'none';
      const sels = ['.hv h1', '.hv h1 em', '.hv .lead', '.hv .cta-btns .btn-line'];
      if (LP) sels.push('.lpv .form-t', '.lpv .f-field label', '.lpv .f-legend', '.lpv .f-consent span', '.lpv .f-small');
      const out = [];
      for (const sel of sels) for (const el of document.querySelectorAll(sel)) if (shown(el)) out.push(box(el, sel));
      const hv = document.querySelector('.hv').getBoundingClientRect();
      return { targets: out, clipH: Math.ceil(hv.bottom + scrollY) };
    }, LP);
    /* texte masqué, nav et étiquette aussi : on ne mesure que la vidéo voilée
     * (et, sur les pages d'atterrissage, le fond translucide du formulaire) */
    await p.addStyleTag({ content: '.hv-txt,.lpv-t,.hdr,.hv-tag{visibility:hidden!important}.hv .btn-line{visibility:hidden!important}.lpv .form *{visibility:hidden!important}' });
    const worst = Object.fromEntries(targets.map((t) => [t.sel, Infinity]));
    const dur = await p.evaluate(() => document.querySelector('.hv video').duration || 9);
    for (let i = 0; i < 10; i++) {
      await p.evaluate(async (t) => { const v = document.querySelector('.hv video'); v.pause(); v.currentTime = t; await new Promise((r) => { v.onseeked = r; setTimeout(r, 1500); }); }, (dur * i) / 10);
      const img = png(await p.screenshot({ fullPage: true, clip: { x: 0, y: 0, width: w, height: clipH } }));
      for (const t of targets) {
        const [r, g, b] = t.color.match(/\d+/g).map(Number);
        const fg = lum(r, g, b);
        let maxL = 0;
        for (let y = Math.round(t.y); y < Math.min(img.h, Math.round(t.y + t.h)); y += 2) {
          for (let x = Math.round(t.x); x < Math.min(img.w, Math.round(t.x + t.w)); x += 2) {
            const o = (y * img.w + x) * img.bpp;
            const L = lum(img.px[o], img.px[o + 1], img.px[o + 2]);
            if (L > maxL) maxL = L;
          }
        }
        worst[t.sel] = Math.min(worst[t.sel], ratio(fg, maxL));
      }
    }
    for (const [sel, v] of Object.entries(worst)) ok(v >= 4.5, `${w}×${h} : contraste ${sel} ≥ 4,5 sur le pixel le plus clair (${v.toFixed(2)})`);
    await ctx.close();
  }
  /* 3. hors écran : vidéo en pause, aucune animation qui tourne hors écran */
  {
    const { ctx, p } = await page(browser, base, rel, { w: 1440, h: 900, banner: false });
    await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight / 2, behavior: 'instant' }));
    await p.waitForTimeout(600);
    const r = await p.evaluate(() => {
      const v = document.querySelector('.hv video');
      const off = document.getAnimations().filter((a) => {
        if (a.playState !== 'running' || !(a.effect && a.effect.target)) return false;
        const b = a.effect.target.getBoundingClientRect();
        return (b.width || b.height) && (b.bottom < 0 || b.top > innerHeight);
      }).length;
      return { paused: v.paused, off };
    });
    ok(r.paused, 'hors écran : la vidéo est en pause (video.paused)');
    ok(r.off === 0, `hors écran : aucune animation CSS qui tourne (${r.off})`);
    await p.evaluate(() => scrollTo({ top: 0, behavior: 'instant' }));
    await p.waitForTimeout(600);
    ok(await p.evaluate(() => !document.querySelector('.hv video').paused), 'retour en haut : la vidéo reprend');
    if (LP) {
      await p.evaluate(() => scrollTo({ top: 300, behavior: 'instant' }));
      await p.waitForTimeout(300);
      const st = await p.evaluate(() => { const m = document.querySelector('.hv-media'); return m.style.transform + m.style.opacity; });
      ok(st === '', 'défilement : aucun effet sur la vidéo (exception du 15/11 réservée aux accueils)');
    }
    await ctx.close();
  }
  /* 4. poids du premier écran sur téléphone */
  {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
    await ctx.addInitScript(() => { try { localStorage.setItem('celya-consent', 'denied'); } catch (e) {} });
    const p = await ctx.newPage();
    let bytes = 0;
    p.on('response', async (r) => { try { const b = await r.body(); bytes += b.length; } catch (e) {} });
    await p.goto(base + rel, { waitUntil: 'load' });
    await p.waitForTimeout(3000);
    ok(bytes < 1.2 * 1024 * 1024, `poids du premier écran à 390×844 : ${(bytes / 1024).toFixed(0)} Ko (< 1 229 Ko)`);
    await ctx.close();
  }
}
await browser.close();
srv.close();
console.log(fails.length ? `\n${fails.length} échec(s).` : '\nHéros : tout passe.');
process.exit(fails.length ? 1 : 0);
