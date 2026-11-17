#!/usr/bin/env node
/* Test E — formulaire démo, attribution, suivi, barre mobile.
 *
 * Sert le dépôt en local et ouvre les pages dans Chromium. L'appel à web-lead
 * est intercepté (aucune requête ne part vers Supabase) : on vérifie ce que la
 * page ENVOIE, pas ce que la fonction en fait.
 *
 *   1. erreurs : envoi à vide → message, aucun appel réseau ;
 *   2. honeypot « website » présent, hors écran, vide à l'envoi ;
 *   3. champs cachés remplis depuis une URL avec UTM, gclid, fbclid, gardés en
 *      sessionStorage d'une page à l'autre ; page d'origine transmise ;
 *   4. envoi : source « demo form », métier, moment, accord, puis redirection
 *      vers merci.html ;
 *   5. dataLayer : generate_lead et click_call présents avec accord cookies,
 *      absents sans accord ; aucune requête vers Google ou Meta sans accord ;
 *   6. barre d'appel mobile : cachée au premier écran, visible après défilement,
 *      ne recouvre jamais le bandeau cookies ni les boutons du héros (360, 390, 393) ;
 *      absente de demo.html, où elle recouvrirait le formulaire qu'elle annonce ;
 *      présente sur les pages d'atterrissage (lot conversion du 16/11/2026).
 *   7. merci.html : noindex et absent du sitemap.
 *
 *   node tests/formulaire.mjs [pages…]   (défaut : demo.html) */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.mp4': 'video/mp4', '.vtt': 'text/vtt', '.xml': 'application/xml' };
function serve() {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(ROOT, p);
      if (!f.startsWith(ROOT) || !fs.existsSync(f)) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

const fails = [];
const ok = (cond, msg) => { if (!cond) fails.push(msg); console.log(`  ${cond ? '✓' : '✗'} ${msg}`); };

async function context(browser, { consent, width = 1280, height = 900 } = {}) {
  const ctx = await browser.newContext({ viewport: { width, height } });
  if (consent) await ctx.addInitScript((v) => { try { localStorage.setItem('celya-consent', v); } catch (e) {} }, consent);
  const external = [];
  const leads = [];
  await ctx.route('**/*', (route) => {
    const u = route.request().url();
    if (u.includes('/functions/v1/web-lead')) {
      leads.push(JSON.parse(route.request().postData() || '{}'));
      return route.fulfill({ status: 200, contentType: 'application/json', headers: { 'Access-Control-Allow-Origin': '*' }, body: '{"ok":true}' });
    }
    if (!u.startsWith('http://127.0.0.1')) { external.push(u); return route.abort(); }
    return route.continue();
  });
  return { ctx, external, leads };
}

async function main() {
  const pages = process.argv.slice(2).length ? process.argv.slice(2) : ['demo.html'];
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const browser = await chromium.launch();

  for (const rel of pages) {
    console.log(`\n${rel}`);
    /* --- sans accord cookies --- */
    {
      const { ctx, external, leads } = await context(browser, { consent: 'denied' });
      const p = await ctx.newPage();
      await p.goto(base + rel + '?utm_source=google&utm_medium=cpc&utm_campaign=garages-bxl&utm_content=ad1&utm_term=secretariat&gclid=G-123&fbclid=F-456', { waitUntil: 'load' });
      /* 1. erreurs */
      await p.click('form[data-lead] button[type=submit]');
      ok(await p.locator('form[data-lead] .f-err.on').count() === 1, 'envoi à vide : message d\'erreur affiché');
      ok(leads.length === 0, 'envoi à vide : aucun appel à web-lead');
      ok(await p.locator('form[data-lead] [name=name][aria-invalid=true]').count() === 1, 'envoi à vide : champ nom signalé (aria-invalid)');
      /* 2. honeypot */
      const hp = await p.locator('form[data-lead] input[name=website]').evaluate((el) => ({ x: el.getBoundingClientRect().right, tab: el.tabIndex }));
      ok(hp.x < 0 && hp.tab === -1, 'honeypot « website » hors écran et hors tabulation');
      /* 3. champs cachés */
      const hid = await p.evaluate(() => Object.fromEntries([...document.querySelectorAll('form[data-lead] input[type=hidden]')].map((i) => [i.name, i.value])));
      ok(hid.utm_source === 'google' && hid.utm_campaign === 'garages-bxl' && hid.utm_term === 'secretariat' && hid.gclid === 'G-123' && hid.fbclid === 'F-456', 'champs cachés remplis depuis l\'URL (utm_*, gclid, fbclid)');
      ok(hid.landing_page === '/' + rel, 'page d\'origine = page d\'arrivée');
      /* les UTM survivent à une navigation sans paramètres */
      await p.goto(base + rel, { waitUntil: 'load' });
      const kept = await p.evaluate(() => document.querySelector('form[data-lead] [name=utm_campaign]').value);
      ok(kept === 'garages-bxl', 'UTM gardés en sessionStorage d\'une page à l\'autre');
      /* 4. envoi */
      await p.fill('form[data-lead] [name=name]', 'Test Garage');
      await p.fill('form[data-lead] [name=phone]', '+32 470 00 00 00');
      await p.selectOption('form[data-lead] [name=metier]', 'garages');
      await p.check('form[data-lead] input[name=moment][value=matin]');
      await p.click('form[data-lead] button[type=submit]');
      ok(await p.locator('form[data-lead] .f-err.on').count() === 1 && leads.length === 0, 'sans case d\'accord cochée : refusé');
      await p.check('form[data-lead] [name=consent]');
      await Promise.all([p.waitForURL(/merci\.html$/, { timeout: 8000 }).catch(() => {}), p.click('form[data-lead] button[type=submit]')]);
      const L = leads[0] || {};
      ok(leads.length === 1, 'un seul appel à web-lead');
      ok(L.source === 'demo form' && L.metier === 'garages' && L.moment === 'matin' && L.consent_contact === true && L.website === '', 'corps : source « demo form », métier, moment, accord, honeypot vide');
      ok(L.utm_campaign === 'garages-bxl' && L.gclid === 'G-123' && L.fbclid === 'F-456' && L.landing_page === '/' + rel && L.page === '/' + rel, 'corps : attribution et pages transmises');
      ok(/merci\.html$/.test(p.url()), 'redirection vers merci.html');
      const dl = await p.evaluate(() => (window.dataLayer || []).filter((e) => e && e.event && e.event !== 'gtm.js').length);
      ok(dl === 0, 'sans accord : aucun événement dans dataLayer');
      ok(external.length === 0, 'sans accord : aucune requête vers Google ou Meta' + (external.length ? ' (' + external.join(', ') + ')' : ''));
      await ctx.close();
    }
    /* --- avec accord cookies --- */
    {
      const { ctx, leads } = await context(browser, { consent: 'granted' });
      const p = await ctx.newPage();
      await p.goto(base + rel + '?utm_campaign=essai', { waitUntil: 'load' });
      await p.evaluate(() => { document.querySelectorAll('a[href^="tel:"]').forEach((a) => a.addEventListener('click', (e) => e.preventDefault())); });
      await p.locator('a[href^="tel:"]').first().click();
      await p.fill('form[data-lead] [name=name]', 'Test');
      await p.fill('form[data-lead] [name=phone]', '+32470000000');
      await p.selectOption('form[data-lead] [name=metier]', 'restaurants');
      await p.check('form[data-lead] [name=consent]');
      /* on capte le dataLayer juste avant la redirection */
      await p.exposeFunction('__dl', () => {});
      const evs = [];
      p.on('framenavigated', () => {});
      await p.evaluate(() => { const push = window.dataLayer.push.bind(window.dataLayer); window.__evs = []; window.dataLayer.push = (e) => { window.__evs.push(JSON.parse(JSON.stringify(e, (k, v) => (typeof v === 'function' ? undefined : v)))); if (typeof e.eventCallback === 'function') setTimeout(e.eventCallback, 0); return push(e); }; });
      const before = await p.evaluate(() => window.__evs.slice());
      evs.push(...before);
      await p.evaluate(() => { const f = document.querySelector('form[data-lead]'); f.setAttribute('data-next', ''); });
      await p.click('form[data-lead] button[type=submit]');
      await p.waitForTimeout(600);
      evs.push(...(await p.evaluate(() => window.__evs)));
      const click = (await p.evaluate(() => window.dataLayer.filter((e) => e && e.event === 'click_call')));
      /* lot « prêt pour les publicités » (17/11/2026) : mêmes noms d'événements,
       * plus form (data-lead), page, lang ; event_id identique à celui du corps envoyé à web-lead */
      const kind = rel.includes('lp/') ? 'lp-' + path.basename(rel, '.html') : 'demo';
      const lang = /^(nl|en)\//.test(rel) ? rel.slice(0, 2) : 'fr';
      ok(click.length >= 1 && click[0].page === '/' + rel && click[0].form === kind && click[0].lang === lang, `avec accord : click_call {form: ${kind}, page, lang: ${lang}} dans dataLayer`);
      const gl = evs.find((e) => e.event === 'generate_lead');
      ok(gl && gl.form === kind && gl.page === '/' + rel && gl.lang === lang && gl.metier === 'restaurants' && gl.utm_campaign === 'essai', `avec accord : generate_lead {form: ${kind}, page, lang, metier, utm_campaign}`);
      ok(leads.length === 1, 'avec accord : envoi effectué');
      ok(gl && typeof gl.event_id === 'string' && gl.event_id.length >= 16 && leads[0] && leads[0].event_id === gl.event_id, `avec accord : event_id identique dans generate_lead et dans le corps envoyé à web-lead (${gl && gl.event_id})`);
      await ctx.close();
    }
  }

  /* 5. formulaire de contact (lot du 16/11) : même comportement qu'avant la
   *    migration — web-lead, source « website form », honeypot, nom + téléphone
   *    ou e-mail, confirmation sur place — plus le métier et l'attribution. */
  for (const rel of ['contact.html', 'nl/contact.html', 'en/contact.html']) {
    console.log(`\n${rel}`);
    for (const consent of ['denied', 'granted']) {
      const { ctx, external, leads } = await context(browser, { consent });
      const p = await ctx.newPage();
      await p.goto(base + rel + '?utm_source=google&utm_campaign=contact-test&gclid=G-9', { waitUntil: 'load' });
      if (consent === 'granted') await p.evaluate(() => { window.__evs = []; const push = window.dataLayer.push.bind(window.dataLayer); window.dataLayer.push = (e) => { window.__evs.push(JSON.parse(JSON.stringify(e, (k, v) => (typeof v === 'function' ? undefined : v)))); if (typeof e.eventCallback === 'function') setTimeout(e.eventCallback, 0); return push(e); }; });
      await p.fill('form[data-lead] [name=name]', 'Test Contact');
      await p.click('form[data-lead] button[type=submit]');
      ok(await p.locator('form[data-lead] .f-err.on').count() === 1 && leads.length === 0, `${consent} : nom seul, sans téléphone ni e-mail → refusé`);
      await p.fill('form[data-lead] [name=email]', 'test@example.com');
      await p.fill('form[data-lead] [name=need]', 'Essai automatique');
      await p.selectOption('form[data-lead] [name=metier]', 'garages');
      await p.click('form[data-lead] button[type=submit]');
      await p.waitForTimeout(500);
      const L = leads[0] || {};
      ok(leads.length === 1 && L.source === 'website form' && L.website === '' && L.email === 'test@example.com' && L.need === 'Essai automatique' && L.metier === 'garages', `${consent} : nom + e-mail suffit ; corps « website form », besoin, métier, honeypot vide`);
      ok(L.utm_campaign === 'contact-test' && L.gclid === 'G-9' && L.page === '/' + rel, `${consent} : attribution et page transmises`);
      ok(await p.locator('form[data-lead] .f-ok').isVisible() && /contact\.html(\?|$)/.test(p.url()) && await p.locator("form[data-lead] .f-body").isHidden(), `${consent} : confirmation affichée sur place, sans redirection`);
      if (consent === 'granted') {
        const gl = (await p.evaluate(() => window.__evs)).find((e) => e.event === 'generate_lead');
        ok(gl && gl.form === 'contact' && gl.metier === 'garages' && gl.page === '/' + rel && gl.lang === (rel.startsWith('nl/') ? 'nl' : rel.startsWith('en/') ? 'en' : 'fr') && gl.event_id && gl.event_id === L.event_id, 'avec accord : generate_lead {form: contact, page, lang, metier, event_id = celui du corps}');
      } else {
        const dl = await p.evaluate(() => (window.dataLayer || []).filter((e) => e && e.event && e.event !== 'gtm.js').length);
        ok(dl === 0 && external.length === 0, 'sans accord : aucun événement, aucune requête externe');
      }
      await ctx.close();
    }
  }

  /* 6. barre mobile */
  console.log('\nbarre d\'appel mobile');
  for (const [w, h] of [[360, 640], [390, 730], [393, 730]]) {
    for (const rel of ['index.html', 'garages.html', 'prix.html', 'lp/garages.html', 'nl/lp/geen-oproepen-meer-missen.html']) {   /* pages d'atterrissage : barre ajoutée le 16/11/2026 */
      for (const consent of ['denied', null]) {
        const { ctx } = await context(browser, { consent, width: w, height: h });
        const p = await ctx.newPage();
        await p.goto(base + rel, { waitUntil: 'load' });
        await p.waitForTimeout(250);
        const r = await p.evaluate(() => {
          const bar = document.querySelector('.mbar'), ban = document.querySelector('.cbanner');
          const vis = (el) => { if (!el) return null; const s = getComputedStyle(el), b = el.getBoundingClientRect(); return s.visibility !== 'hidden' && s.display !== 'none' && b.top < innerHeight - 1 ? b : null; };
          const hits = (a, b) => a && b && a.left < b.right && b.left < a.right && a.top < b.bottom && b.top < a.bottom;
          const B = vis(bar);
          const heroBtns = [...document.querySelectorAll('main .cta-pair .btn, main form .btn')].slice(0, 3).map((x) => x.getBoundingClientRect());
          return { bar: !!B, overBanner: hits(B, ban && ban.getBoundingClientRect()), overHero: heroBtns.some((h) => hits(B, h)) };
        });
        ok(!r.overBanner && !r.overHero, `${rel} ${w}×${h}${consent ? '' : ' (bandeau cookies)'} : la barre ne recouvre ni le bandeau ni les boutons du héros`);
        if (!consent) ok(!r.bar, `${rel} ${w}×${h} : barre masquée tant que le bandeau cookies est affiché`);
        if (consent) {
          await p.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight / 2));
          await p.waitForTimeout(450);
          const shown = await p.evaluate(() => { const b = document.querySelector('.mbar').getBoundingClientRect(); return b.top < innerHeight && getComputedStyle(document.querySelector('.mbar')).visibility !== 'hidden'; });
          ok(shown, `${rel} ${w}×${h} : barre visible après défilement`);
        }
        await ctx.close();
      }
    }
  }

  for (const rel of ['demo.html', 'nl/demo.html', 'en/demo.html']) {
    ok(!fs.readFileSync(path.join(ROOT, rel), 'utf8').includes('class="mbar"'), `${rel} : pas de barre d'appel par-dessus le formulaire`);
  }

  /* 7. noindex + sitemap */
  console.log('\npages hors index');
  const smap = fs.readFileSync(path.join(ROOT, 'sitemap.xml'), 'utf8');
  const noindex = ['merci.html', ...fs.readdirSync(ROOT).filter(() => false)];
  for (const dir of ['', 'nl', 'en', 'lp', 'nl/lp']) {
    const d = path.join(ROOT, dir);
    if (!fs.existsSync(d)) continue;
    for (const f of fs.readdirSync(d)) if ((dir.endsWith('lp') || f === 'merci.html') && f.endsWith('.html')) noindex.push(path.join(dir, f));
  }
  for (const rel of [...new Set(noindex)]) {
    if (!fs.existsSync(path.join(ROOT, rel))) continue;
    const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
    ok(/<meta name="robots" content="noindex/.test(html), `${rel} : noindex`);
    ok(!smap.includes('celya.be/' + rel + '<'), `${rel} : absent du sitemap`);
  }

  await browser.close();
  srv.close();
  console.log(fails.length ? `\n${fails.length} échec(s).` : '\nTout passe.');
  process.exit(fails.length ? 1 : 0);
}
main().catch((e) => { console.error(e); process.exit(2); });
