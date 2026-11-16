#!/usr/bin/env node
/* La scène « Un appel, de bout en bout » (lot conversion du 16/11/2026).
 *
 * Statique, sur les 301 pages générées :
 *  1. placement : accueils juste après la vidéo et les badges ; pages métiers
 *     juste sous les badges du héros ; pages d'atterrissage sous les badges,
 *     avant « Comment ça marche » ; articles : version compacte (téléphone
 *     seul) juste après la première section ; nulle part ailleurs ; une fois ;
 *  2. aucun H2 dans la scène (la liste des H2 des pages ne bouge pas) ;
 *     mention « Exemple » ; cinq étapes ; le jeudi 19 novembre ;
 *  3. textes : ceux du métier de la page (data/metiers.json), le jeu générique
 *     ailleurs ; jamais de freins hors des pages garages ; chaque métier a sa
 *     scène dans chaque langue où sa page existe.
 * Dans Chromium :
 *  4. CSS seul : uniquement les @keyframes de la scène, boucle de 15 s, toutes
 *     les animations en phase (même currentTime) ;
 *  5. hors écran : toutes en pause, d'un bloc ; au retour, toujours en phase ;
 *  6. chaque étape tient dans l'écran du téléphone, à 360 et 1440 px ; rien
 *     ne dépasse de la page (scrollWidth == innerWidth) ;
 *  7. prefers-reduced-motion : aucune animation, l'état final fixe, les cinq
 *     étapes visibles, empilées sans se chevaucher.
 *
 *   node tests/scene.mjs */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadData, parsePage } from '../_src/lib/core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); if (!c || process.env.VERBOSE) console.log(`  ${c ? '✓' : '✗'} ${m}`); };
const data = loadData();
const dec = (s) => s.replace(/&nbsp;/g, ' ').replace(/&#39;|&rsquo;/g, "'").replace(/ /g, ' ');

/* ---------- 1-3. statique ---------- */
const SRC = path.join(ROOT, '_src/pages');
const rels = fs.readdirSync(SRC, { recursive: true }).filter((f) => f.endsWith('.html')).map((f) => f.split(path.sep).join('/')).sort();
const count = {};
const runtime = [];
for (const rel of rels) {
  const meta = parsePage(fs.readFileSync(path.join(SRC, rel), 'utf8'), rel).meta;
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  const n = (main.match(/data-anim-root/g) || []).length;
  const L = meta.layout;
  const want = ['accueil', 'metier', 'lp', 'article'].includes(L) ? 1 : 0;
  count[L] = (count[L] || 0) + n;
  ok(n === want, `${rel} (${L}) : ${want} scène attendue, ${n} trouvée(s)`);
  if (!n) continue;
  const place = {
    accueil: /<section class="hv-next">[\s\S]*?<\/section>\s*<section class="sec scn-sec">/,
    metier: /<section class="hero-badges">[\s\S]*?<\/section>\s*<section class="sec scn-sec">/,
    lp: /<section class="hero-badges">[\s\S]*?<\/section>\s*<section class="sec scn-sec">[\s\S]*?<\/section>\s*<section class="sec" id="marche">/,
  }[L];
  if (L === 'article') {
    /* juste après la première section de la page source (un outil ou une FAQ
     * placés plus haut ne comptent pas) : la section qui précède la scène
     * porte le texte de ce premier bloc « section » */
    const page = parsePage(fs.readFileSync(path.join(SRC, rel), 'utf8'), rel);
    const first = page.seq.find((b) => b.name === 'section');
    const snip = dec(first.html.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').trim().slice(0, 60);
    const before = main.slice(0, main.indexOf('<figure class="scn scn-compact"'));
    const lastSec = before.slice(before.lastIndexOf('<section class="art-s"'));
    ok(/<\/section>\s*$/.test(lastSec) && dec(lastSec.replace(/<[^>]+>/g, ' ')).replace(/\s+/g, ' ').includes(snip), `${rel} : scène compacte juste après la première section`);
  } else ok(place.test(main), `${rel} : scène à sa place (${L})`);
  const sc = L === 'article' ? /<figure class="scn scn-compact"[\s\S]*?<\/figure>/.exec(main)[0] : /<section class="sec scn-sec">[\s\S]*?<\/section>/.exec(main)[0];
  const t = data.i18n[meta.lang];
  const metier = L === 'metier' || L === 'lp' ? meta.metier : null;
  const ex = (metier && data.metiers[metier][meta.lang].scene) || t.scene.generique;
  const txt = dec(sc);
  ok(!/<h2/i.test(sc), `${rel} : aucun H2 dans la scène`);
  ok(txt.includes(`<span class="ex-tag">${t.example}</span>`), `${rel} : mention « ${t.example} » visible`);
  ok((sc.match(/class="scn-st"/g) || []).length === 5, `${rel} : cinq étapes`);
  ok(txt.includes(t.scene.jour) && txt.includes(t.scene.jour_court), `${rel} : exemple du jeudi 19 novembre`);
  ok([ex.appel[0], ex.appel[1], ex.confirmation, ex.motif, ...t.scene.consigne].every((x) => txt.includes(dec(x))), `${rel} : textes ${metier || 'génériques'} (${meta.lang})`);
  if (metier !== 'garages') ok(!/frein|remmen|brake|voiture|wagen|\bcar\b/i.test(txt), `${rel} : aucun exemple de garage hors des pages garages`);
  if (L === 'article') ok(!/scn-steps|<h3/.test(sc), `${rel} : version compacte, téléphone seul`);
  if (L !== 'article' || !runtime.some((r) => r.L === 'article')) runtime.push({ rel, L });
}
for (const [k, M] of Object.entries(data.metiers)) {
  if (k === '_doc') continue;
  for (const [lang, page] of Object.entries(M.pages)) if (page) ok(M[lang] && M[lang].scene && M[lang].scene.appel.length === 3, `data/metiers.json : ${k}.${lang}.scene`);
}
console.log(`Statique : scènes — accueils ${count.accueil}, métiers ${count.metier}, atterrissage ${count.lp}, articles ${count.article} ; aucune ailleurs.`);

/* ---------- 4-7. Chromium ---------- */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const srv = await new Promise((res) => {
  const s = http.createServer((req, rsp) => {
    const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
    rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
  }).listen(0, '127.0.0.1', () => res(s));
});
const base = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch();
const KF = new Set(['scn', 'scn-in', 'scn-slide', 'scn-hi']);
/* les contrôles d'animation : un accueil FR et EN, une page métier, deux pages d'atterrissage, un article */
const ANIM = new Set(['index.html', 'en/index.html', 'garages.html', 'lp/garages.html', 'nl/lp/garages.html', runtime.find((r) => r.L === 'article').rel]);
const anims = () => {
  const r = document.querySelector('[data-anim-root]');
  return r.getAnimations({ subtree: true }).map((a) => ({ name: a.animationName, state: a.playState, t: a.currentTime, d: a.effect.getTiming().duration }));
};
for (const [w, h] of [[1440, 900], [360, 640]]) {
  const ctx = await browser.newContext({ viewport: { width: w, height: h } });
  await ctx.addInitScript(() => { try { localStorage.setItem('celya-consent', 'denied'); } catch (e) {} });
  for (const { rel } of runtime) {
    const p = await ctx.newPage();
    await p.goto(base + rel, { waitUntil: 'load' });
    await p.evaluate(() => document.fonts.ready);
    /* 6. chaque étape tient dans l'écran du téléphone */
    const fit = await p.evaluate(() => {
      const body = document.querySelector('.scn-body');
      return [...body.querySelectorAll('.scn-st')].map((s) => s.offsetTop + s.offsetHeight).filter((b) => b > body.clientHeight).length;
    });
    ok(fit === 0, `${rel} @${w} : chaque étape tient dans l'écran du téléphone`);
    ok(await p.evaluate(() => document.documentElement.scrollWidth === innerWidth), `${rel} @${w} : rien ne dépasse`);
    if (w === 1440 && ANIM.has(rel)) {
      await p.evaluate(() => document.querySelector('[data-anim-root]').scrollIntoView({ block: 'center' }));
      await p.waitForTimeout(700);
      let a = await p.evaluate(anims);
      const spread = (xs) => Math.max(...xs.map((x) => x.t)) - Math.min(...xs.map((x) => x.t));
      ok(a.length > 10 && a.every((x) => KF.has(x.name) && x.d === 15000), `${rel} : ${a.length} animations CSS, @keyframes de la scène seulement, boucle de 15 s`);
      ok(a.every((x) => x.state === 'running') && spread(a) < 50, `${rel} : à l'écran, toutes en marche et en phase (écart ${spread(a).toFixed(0)} ms)`);
      await p.evaluate(() => scrollTo({ top: document.documentElement.scrollHeight, behavior: 'instant' }));
      await p.waitForTimeout(600);
      a = await p.evaluate(anims);
      ok(a.every((x) => x.state === 'paused'), `${rel} : hors écran, toutes en pause (${a.filter((x) => x.state !== 'paused').length} en marche)`);
      await p.evaluate(() => document.querySelector('[data-anim-root]').scrollIntoView({ block: 'center' }));
      await p.waitForTimeout(600);
      a = await p.evaluate(anims);
      ok(a.every((x) => x.state === 'running') && spread(a) < 50, `${rel} : au retour, reprises et toujours en phase (écart ${spread(a).toFixed(0)} ms)`);
    }
    await p.close();
  }
  await ctx.close();
}
/* 7. mouvement réduit */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, reducedMotion: 'reduce' });
  await ctx.addInitScript(() => { try { localStorage.setItem('celya-consent', 'denied'); } catch (e) {} });
  for (const { rel } of runtime.filter((r) => /^(index|nl\/garages|lp\/garages|en\/index)\.html$/.test(r.rel) || r.L === 'article')) {
    const p = await ctx.newPage();
    await p.goto(base + rel, { waitUntil: 'load' });
    const r = await p.evaluate(() => {
      const root = document.querySelector('[data-anim-root]');
      const st = [...root.querySelectorAll('.scn-st')];
      const box = st.map((s) => s.getBoundingClientRect());
      const vis = [...root.querySelectorAll('.scn-st, .scn-st *')].every((e) => getComputedStyle(e).opacity === '1' && getComputedStyle(e).visibility !== 'hidden');
      return { n: root.getAnimations({ subtree: true }).length, vis, stacked: box.every((b, i) => i === 0 || b.top >= box[i - 1].bottom - 0.5), tag: getComputedStyle(root.querySelector('.ex-tag')).display !== 'none' };
    });
    ok(r.n === 0, `${rel} (mouvement réduit) : aucune animation (${r.n})`);
    ok(r.vis && r.stacked && r.tag, `${rel} (mouvement réduit) : état final fixe, cinq étapes visibles et empilées, « Exemple » affiché`);
    await p.close();
  }
  await ctx.close();
}
await browser.close();
srv.close();
console.log(fails.length ? `\n${fails.length} échec(s).` : `Scène : tout passe (${runtime.length} pages ouvertes dans Chromium).`);
process.exit(fails.length ? 1 : 0);
