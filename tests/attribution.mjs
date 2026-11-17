#!/usr/bin/env node
/* Attribution des publicités (lot « prêt pour les publicités », décision de
 * Bora du 17/11/2026). UTM, gclid et fbclid sont lus à l'arrivée.
 *
 *   Sans accord : sessionStorage seulement, comme avant ; rien dans localStorage.
 *   Après « Accepter » : recopiés dans localStorage (celya-attrib, avec la date
 *   d'arrivée) ; un visiteur qui revient les retrouve jusqu'à 90 jours ; une
 *   nouvelle arrivée avec des paramètres remplace l'ancienne ; au-delà de
 *   90 jours, effacés.
 *   Après « Refuser », ou un accord retiré : localStorage ne garde rien.
 *
 * Scénarios, dans Chromium, l'appel à web-lead intercepté (rien ne part) :
 *   1. arrivée avec ?gclid= sans accord → rien dans localStorage ;
 *   2. puis « Accepter » → l'attribution est gardée, datée de l'arrivée ;
 *   3. retour à J+1 (nouvel onglet, horloge avancée) → le formulaire envoie le gclid ;
 *   4. retour à J+91 → rien n'est envoyé, l'attribution est effacée ;
 *   5. nouvelle arrivée avec d'autres paramètres → elle remplace l'ancienne ;
 *   6. « Refuser » → localStorage vide, même s'il gardait une attribution ;
 *   7. accord retiré (données du site effacées, attribution restée) → effacée à l'ouverture ;
 *   8. aucun écouteur nouveau (tests/budget-rendu.mjs le vérifie aussi).
 *
 *   node tests/attribution.mjs */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

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
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); console.log(`  ${c ? '✓' : '✗'} ${m}`); };
const DAY = 864e5;
const T0 = Date.parse('2026-11-17T09:00:00Z');

/* un « onglet » : contexte neuf (sessionStorage vide), localStorage repris de l'état donné, horloge fixée */
async function tab({ state, at = T0 } = {}) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 }, storageState: state });
  await ctx.clock.setFixedTime(new Date(at));
  const leads = [];
  await ctx.route('**/*', (route) => {
    const u = route.request().url();
    if (u.includes('/functions/v1/web-lead')) {
      leads.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' });
    }
    if (!u.startsWith(base)) return route.abort();   /* rien ne sort : ni GTM, ni Google, ni Meta */
    return route.continue();
  });
  const p = await ctx.newPage();
  return { ctx, p, leads };
}
const kept = (p) => p.evaluate(() => { try { return JSON.parse(localStorage.getItem('celya-attrib')); } catch (e) { return 'illisible'; } });
async function send(p, leads) {
  await p.fill('form[data-lead] [name=name]', 'Test Attribution');
  await p.fill('form[data-lead] [name=phone]', '+32 470 00 00 00');
  await p.check('form[data-lead] [name=consent]');
  await p.evaluate(() => document.querySelector('form[data-lead]').setAttribute('data-next', ''));
  await p.click('form[data-lead] button[type=submit]');
  for (let i = 0; i < 40 && !leads.length; i++) await p.waitForTimeout(50);
  return leads[0] || null;
}

const LP = 'lp/garages.html';

console.log('\n1-2. arrivée avec ?gclid=, puis « Accepter »');
const a = await tab();
await a.p.goto(base + LP + '?gclid=G-ADS-1&utm_source=google&utm_campaign=garages-bxl', { waitUntil: 'load' });
ok(await kept(a.p) === null, 'sans accord : rien dans localStorage');
ok(await a.p.evaluate(() => JSON.parse(sessionStorage.getItem('celya-attrib')).gclid) === 'G-ADS-1', 'sans accord : le gclid est en session, comme avant');
await a.p.click('.cbanner .caccept');
const k1 = await kept(a.p);
ok(k1 && k1.attr && k1.attr.gclid === 'G-ADS-1' && k1.attr.utm_campaign === 'garages-bxl' && k1.attr.landing_page === '/' + LP, 'après « Accepter » : gclid, UTM et page d\'arrivée gardés dans localStorage (celya-attrib)');
ok(k1 && k1.saved_at === T0, `datée de l'arrivée (${k1 && new Date(k1.saved_at).toISOString()})`);
const state = await a.ctx.storageState();
await a.ctx.close();

console.log('\n3. retour à J+1, nouvel onglet, sans paramètres');
{
  const { ctx, p, leads } = await tab({ state, at: T0 + DAY });
  await p.goto(base + 'demo.html', { waitUntil: 'load' });
  const L = await send(p, leads);
  ok(L && L.gclid === 'G-ADS-1' && L.utm_campaign === 'garages-bxl' && L.landing_page === '/' + LP, `le formulaire envoie le gclid de la veille (${L && L.gclid}) et la page d'arrivée (${L && L.landing_page})`);
  ok((await kept(p)).saved_at === T0, 'la date d\'arrivée ne bouge pas : les 90 jours comptent depuis le clic sur l\'annonce');
  await ctx.close();
}

console.log('\n   retour à J+89 : encore là');
{
  const { ctx, p, leads } = await tab({ state, at: T0 + 89 * DAY });
  await p.goto(base + 'demo.html', { waitUntil: 'load' });
  const L = await send(p, leads);
  ok(L && L.gclid === 'G-ADS-1', `J+89 : le gclid est encore envoyé (${L && L.gclid})`);
  await ctx.close();
}

console.log('\n4. retour à J+91');
{
  const { ctx, p, leads } = await tab({ state, at: T0 + 91 * DAY });
  await p.goto(base + 'demo.html', { waitUntil: 'load' });
  const L = await send(p, leads);
  ok(L && L.gclid === '' && L.utm_campaign === '' && L.fbclid === '', `J+91 : rien n'est envoyé (gclid « ${L && L.gclid} »)`);
  const k = await kept(p);
  ok(k && !k.attr.gclid && k.attr.landing_page === '/demo.html', 'J+91 : l\'ancienne attribution est effacée, seule la nouvelle page d\'arrivée reste');
  await ctx.close();
}

console.log('\n5. nouvelle arrivée avec d\'autres paramètres');
{
  const { ctx, p } = await tab({ state, at: T0 + 10 * DAY });
  await p.goto(base + 'nl/lp/garages.html?fbclid=F-META-2', { waitUntil: 'load' });
  const k = await kept(p);
  ok(k && k.attr.fbclid === 'F-META-2' && !k.attr.gclid && k.attr.landing_page === '/nl/lp/garages.html' && k.saved_at === T0 + 10 * DAY, 'elle remplace l\'ancienne (fbclid nouveau, ancien gclid parti, nouvelle date)');
  await ctx.close();
}

console.log('\n6. « Refuser »');
{
  const { ctx, p } = await tab();
  await p.goto(base + LP + '?gclid=G-ADS-3', { waitUntil: 'load' });
  await p.click('.cbanner .cdecline');
  ok(await kept(p) === null, 'après « Refuser » : localStorage vide');
  await p.goto(base + 'index.html', { waitUntil: 'load' });
  ok(await kept(p) === null && await p.evaluate(() => JSON.parse(sessionStorage.getItem('celya-attrib')).gclid) === 'G-ADS-3', 'page suivante : toujours rien dans localStorage, le gclid reste en session (comme avant)');
  await ctx.close();
}
{
  /* un visiteur qui avait accepté et revient refuser (bandeau de nouveau affiché) */
  const st = { cookies: [], origins: [{ origin: base.replace(/\/$/, ''), localStorage: [{ name: 'celya-attrib', value: JSON.stringify({ attr: { gclid: 'G-OLD', landing_page: '/lp/garages.html', t: T0 }, saved_at: T0 }) }] }] };
  const { ctx, p } = await tab({ state: st, at: T0 + DAY });
  await p.goto(base + 'index.html', { waitUntil: 'load' });
  ok(await kept(p) === null, '7. accord retiré (celya-consent effacé, attribution restée) : effacée dès l\'ouverture d\'une page');
  await ctx.close();
}
{
  const st = { cookies: [], origins: [{ origin: base.replace(/\/$/, ''), localStorage: [{ name: 'celya-consent', value: 'denied' }, { name: 'celya-attrib', value: JSON.stringify({ attr: { gclid: 'G-OLD' }, saved_at: T0 }) }] }] };
  const { ctx, p, leads } = await tab({ state: st, at: T0 + DAY });
  await p.goto(base + 'demo.html', { waitUntil: 'load' });
  ok(await kept(p) === null, '   refus enregistré et attribution restée : effacée dès l\'ouverture d\'une page');
  const L = await send(p, leads);
  ok(L && L.gclid === '', '   et rien n\'est envoyé');
  await ctx.close();
}

console.log('\n8. code');
const strip = (s) => s.replace(/\/\*[\s\S]*?\*\//g, '');
const js = strip(fs.readFileSync(path.join(ROOT, 'celya.js'), 'utf8'));
const { execFileSync } = await import('node:child_process');
const before = strip(execFileSync('git', ['show', 'origin/main:celya.js'], { cwd: ROOT, encoding: 'utf8' }));
const n = (s) => (s.match(/addEventListener\(/g) || []).length;
ok(n(js) === n(before), `aucun écouteur nouveau : ${n(js)} addEventListener, comme sur origin/main (${n(before)})`);
ok(!/AW-\d|fbq\(|connect\.facebook|googleadservices|\b\d{15,16}\b/.test(js), 'aucun nom de régie ni identifiant de compte dans celya.js : tout se règle dans GTM');

await browser.close();
srv.close();
console.log(fails.length ? `\n${fails.length} échec(s).` : '\nAttribution : tout passe.');
process.exit(fails.length ? 1 : 0);
