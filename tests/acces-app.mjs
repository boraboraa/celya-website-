#!/usr/bin/env node
/* Test — l'accès à l'application (décision de Bora du 19/11/2026).
 *
 * « Se connecter » mène à APP_LOGIN, « Essai gratuit » à APP_SIGNUP (les deux
 * adresses vivent dans _src/components/shell.mjs, et nulle part ailleurs) ;
 * les pages NL et EN y ajoutent ?lang=nl / ?lang=en.
 *
 *   url      chaque adresse est écrite une seule fois dans _src/ et data/ ;
 *   header   pages avec menu : dans .hdr-cta, dans cet ordre, « Se connecter »
 *            (lien texte), « Demander une démo », « Essai gratuit » (bouton
 *            orange) ; plus de bouton « Appeler Janet » dans l'en-tête ;
 *   menu     menu mobile : « Essai gratuit · N jours », « Demander une démo »,
 *            « Se connecter », juste avant le choix de langue ;
 *   footer   pied de page : « Se connecter » dans la colonne Entreprise, après
 *            Contact ;
 *   pricing  sous chaque grille de prix (hors pages d'atterrissage) :
 *            « Commencer l'essai gratuit », puis « Demander une démo », puis la
 *            règle de l'essai de data/offre.json ;
 *   lp       pages d'atterrissage : aucun lien vers l'application, la grille
 *            garde sa seule démo vers le formulaire de la page ;
 *   layout   l'en-tête tient dans son cadre (360 à 1440 px, FR/NL/EN) ; sous
 *            720 px seul « Essai gratuit » reste à côté du menu ; le menu
 *            ouvert garde le bloc dans son cadre ;
 *   events   avec accord cookies : sign_up_start / login_click {place, page,
 *            lang} au clic (en-tête, menu, prix, pied de page) ; rien sans
 *            accord.
 *
 *   node tests/acces-app.mjs             le dépôt
 *   node tests/acces-app.mjs --mutants   casse une copie du dépôt, une fois par
 *                                        vérification, et exige qu'elle crie */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }

const LOGIN = 'https://app.celya.be/login';
const SIGNUP = 'https://app.celya.be/inscription';
const href = (u, lang) => (lang === 'fr' ? u : `${u}?lang=${lang}`);
const reEsc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const SKIP = /^(_src|docs|tests|api|assets|node_modules|\.git|\.claude)(\/|$)/;
const walk = (root, d = '') => fs.readdirSync(path.join(root, d), { withFileTypes: true }).flatMap((e) => {
  const rel = d ? `${d}/${e.name}` : e.name;
  if (SKIP.test(rel)) return [];
  return e.isDirectory() ? walk(root, rel) : rel.endsWith('.html') ? [rel] : [];
});
const walkAll = (dir) => fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walkAll(path.join(dir, e.name)) : [path.join(dir, e.name)]));

/* ---------- vérifications statiques ---------- */

function statics(root) {
  const F = { url: [], header: [], menu: [], footer: [], pricing: [], lp: [] };
  const i18n = JSON.parse(fs.readFileSync(path.join(root, 'data/i18n.json'), 'utf8'));
  const offre = JSON.parse(fs.readFileSync(path.join(root, 'data/offre.json'), 'utf8'));

  /* url : une seule fois dans les sources */
  for (const u of [LOGIN, SIGNUP]) {
    const hits = [...walkAll(path.join(root, '_src')), path.join(root, 'data/i18n.json'), path.join(root, 'data/offre.json'), path.join(root, 'data/metiers.json')]
      .flatMap((f) => (fs.readFileSync(f, 'utf8').split(u).length - 1 ? [`${path.relative(root, f)}×${fs.readFileSync(f, 'utf8').split(u).length - 1}`] : []));
    if (!(hits.length === 1 && hits[0] === '_src/components/shell.mjs×1')) F.url.push(`${u} : ${hits.join(', ') || 'absente'}`);
  }

  let normal = 0, lps = 0, prices = 0;
  for (const rel of walk(root)) {
    const html = fs.readFileSync(path.join(root, rel), 'utf8');
    if (!/<header class="hdr[" ]/.test(html)) continue;
    const lang = (/<html lang="(\w+)"/.exec(html) || [])[1];
    const t = i18n[lang];
    const L = href(LOGIN, lang), S = href(SIGNUP, lang);
    const days = String(offre.regles.essai_jours);
    if (html.includes('<header class="hdr hdr-bare">')) {
      lps++;
      if (html.includes('app.celya.be')) F.lp.push(`${rel} : lien vers l'application sur une page d'atterrissage`);
      if (!/<div class="price-go"><a class="btn btn-ink" href="#lp" data-demo>[^<]+<\/a><\/div>/.test(html)) F.lp.push(`${rel} : la grille ne garde pas sa seule démo vers #lp`);
      continue;
    }
    normal++;
    /* en-tête */
    const cta = (/<div class="hdr-cta">([\s\S]*?)<\/div>\n<button class="burger"/.exec(html) || [])[1] || '';
    const want = new RegExp(`^<a class="hdr-login" href="${reEsc(L)}" data-app="login" data-place="header">${reEsc(t.login)}</a>` +
      `<a class="btn btn-line btn-sm hdr-demo" href="[^"]+" data-demo>${reEsc(t.cta_demo)}</a>` +
      `<a class="btn btn-orange btn-sm hdr-trial" href="${reEsc(S)}" data-app="signup" data-place="header">${reEsc(t.trial)}</a>$`);
    if (!want.test(cta)) F.header.push(`${rel} : en-tête « ${cta.slice(0, 160)}… »`);
    if (/<header class="hdr">[\s\S]*?data-call[\s\S]*?<\/header>/.test(html)) F.header.push(`${rel} : « ${t.cta_call} » encore dans l'en-tête`);
    /* menu mobile */
    const menu = new RegExp(`<div class="mnav-app"><a class="btn btn-orange" href="${reEsc(S)}" data-app="signup" data-place="menu">${reEsc(t.trial_menu.replace('{{offre.essai}}', days))}</a>` +
      `<a class="btn btn-line" href="[^"]+" data-demo>${reEsc(t.cta_demo)}</a>` +
      `<a class="mnav-login" href="${reEsc(L)}" data-app="login" data-place="menu">${reEsc(t.login)}</a></div><div class="mnav-lang">`);
    if (!/<nav class="mnav"[\s\S]*<\/nav>/.test(html) || !menu.test((/<nav class="mnav"[\s\S]*?<\/nav>/.exec(html) || [''])[0])) F.menu.push(`${rel} : bloc d'accès du menu absent ou dans le désordre`);
    /* pied de page : après Contact, dans la dernière colonne */
    const cols = (/<div class="ft-cols">([\s\S]*?)<\/div><\/div>\n/.exec(html) || [])[1] || '';
    const last = cols.split('<div><b>').pop();
    if (!new RegExp(`<a href="[^"]*contact\\.html">[^<]+</a><a class="ft-login" href="${reEsc(L)}" data-app="login" data-place="footer">${reEsc(t.login)}</a>`).test(last)) F.footer.push(`${rel} : « ${t.login} » absent de la colonne ${(/^[^<]+/.exec(last) || [''])[0]} (après Contact)`);
    /* compte : en-tête, menu, pied de page ; grille de prix */
    const nL = html.split(`"${L}"`).length - 1, nS = html.split(`"${S}"`).length - 1;
    const go = html.match(/<div class="price-go">[\s\S]*?<\/div>/g) || [];
    if (nL !== 3) F.footer.push(`${rel} : ${nL} lien(s) « ${t.login} » (3 attendus : en-tête, menu, pied de page)`);
    if (nS !== 2 + go.length) F.pricing.push(`${rel} : ${nS} lien(s) d'essai pour ${go.length} grille(s) (2 + grilles attendus)`);
    /* grille de prix */
    const rule = offre.regles.essai[lang].replace('{{offre.essai}}', days) + '.';
    for (const g of go) {
      prices++;
      const w = new RegExp(`^<div class="price-go"><a class="btn btn-orange" href="${reEsc(S)}" data-app="signup" data-place="pricing">${reEsc(t.price_trial)}</a>` +
        `<a class="btn btn-line" href="[^"]+" data-demo>${reEsc(t.price_start)}</a><small>${reEsc(rule)}</small></div>$`);
      if (!w.test(g)) F.pricing.push(`${rel} : grille « ${g.slice(0, 200)}… »`);
    }
  }
  if (normal < 250) F.header.push(`seulement ${normal} pages avec menu`);
  if (lps !== 4) F.lp.push(`${lps} pages d'atterrissage (4 attendues)`);
  if (prices < 20) F.pricing.push(`seulement ${prices} grilles de prix trouvées`);
  return { F, normal, lps, prices };
}

/* ---------- vérifications dans Chromium ---------- */

const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.avif': 'image/avif', '.png': 'image/png', '.jpg': 'image/jpeg', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
function serve(root) {
  return new Promise((res) => {
    const srv = http.createServer((req, rsp) => {
      let p = decodeURIComponent(req.url.split('?')[0]);
      if (p.endsWith('/')) p += 'index.html';
      const f = path.join(root, p);
      if (!f.startsWith(root) || !fs.existsSync(f)) { rsp.writeHead(404); return rsp.end(); }
      rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' });
      fs.createReadStream(f).pipe(rsp);
    }).listen(0, '127.0.0.1', () => res(srv));
  });
}

async function browserChecks(root, browser, { widths = [360, 390, 768, 1024, 1181, 1200, 1259, 1260, 1280, 1440], pages = ['index.html', 'nl/index.html', 'en/index.html', 'prise-de-message.html'] } = {}) {
  const F = { layout: [], events: [] };
  const srv = await serve(root);
  const base = `http://127.0.0.1:${srv.address().port}/`;
  const css = fs.readFileSync(path.join(root, 'celya.css'), 'utf8');
  const burgerMax = +((/@media \(max-width:(\d+)px\)\{[^\n]*\n\s*\.hdr-nav,\.hdr-lang\{display:none\}/.exec(css) || [])[1] || 0);
  const newCtx = async (w, consent) => {
    const ctx = await browser.newContext({ viewport: { width: w, height: 800 }, reducedMotion: 'reduce' });
    await ctx.addInitScript((v) => {
      try { localStorage.setItem('celya-consent', v); } catch (e) {}
      /* rester sur la page après le clic : la navigation vers l'application est empêchée APRÈS celya.js */
      addEventListener('click', (e) => { if (e.target.closest && e.target.closest('a[data-app]')) e.preventDefault(); });
    }, consent);
    await ctx.route('**/*', (r) => (r.request().url().startsWith('http://127.0.0.1') ? r.continue() : r.abort()));
    return ctx;
  };
  /* layout */
  for (const rel of pages) {
    for (const w of widths) {
      const ctx = await newCtx(w, 'denied');
      const p = await ctx.newPage();
      await p.goto(base + rel, { waitUntil: 'load' });
      await p.evaluate(() => document.fonts.ready);
      const r = await p.evaluate(() => {
        const hi = document.querySelector('.hdr-in'), H = hi.getBoundingClientRect();
        const vis = (e) => e && e.getClientRects().length > 0 && getComputedStyle(e).visibility !== 'hidden';
        const out = [...hi.querySelectorAll('*')].filter(vis).map((e) => [e, e.getBoundingClientRect()])
          .filter(([, b]) => b.width && (b.right > H.right + 0.5 || b.left < H.left - 0.5 || b.bottom > H.bottom + 0.5)).map(([e]) => e.className || e.tagName);
        const order = [...document.querySelectorAll('.hdr-cta > *')].filter(vis).map((e) => [e.className.split(' ').pop(), e.getBoundingClientRect()]);
        const sorted = order.every((x, i) => !i || order[i - 1][1].right <= x[1].left);
        const lines = [...document.querySelectorAll('.hdr-cta > *')].filter(vis).every((e) => e.getClientRects().length === 1 && e.getBoundingClientRect().height < 60);
        return { out, sw: document.documentElement.scrollWidth, vw: innerWidth, order: order.map((x) => x[0]), sorted, lines, burger: vis(document.querySelector('.burger')), nav: vis(document.querySelector('.hdr-nav')) };
      });
      const wantOrder = w <= 720 ? ['hdr-trial'] : ['hdr-login', 'hdr-demo', 'hdr-trial'];
      const okLayout = !r.out.length && r.sw === r.vw && r.sorted && r.lines && JSON.stringify(r.order) === JSON.stringify(wantOrder) && r.burger === (w <= burgerMax) && r.nav === (w > burgerMax);
      if (!okLayout) F.layout.push(`${rel} @${w} : ${JSON.stringify(r)}`);
      if (r.burger) {
        await p.click('.burger', { timeout: 3000 }).catch(() => {});
        const m = await p.evaluate(() => {
          const n = document.querySelector('.mnav'), a = document.querySelector('.mnav-app'), N = n.getBoundingClientRect();
          if (!a) return { missing: true };
          a.scrollIntoView({ block: 'nearest' });
          const kids = [...a.children].map((e) => [e.dataset.app || 'demo', e.getBoundingClientRect()]);
          const inside = kids.every(([, b]) => b.width > 0 && b.left >= N.left - 0.5 && b.right <= N.right + 0.5);
          const stacked = kids.every((x, i) => !i || kids[i - 1][1].bottom <= x[1].top + 0.5);
          return { order: kids.map((k) => k[0]), inside, stacked, sw: document.documentElement.scrollWidth, vw: innerWidth, beforeLang: !!(a.nextElementSibling && a.nextElementSibling.classList.contains('mnav-lang')) };
        });
        if (!(m.inside && m.stacked && m.beforeLang && m.sw === m.vw && m.order.join() === 'signup,demo,login')) F.layout.push(`${rel} @${w} menu ouvert : ${JSON.stringify(m)}`);
      }
      await ctx.close();
    }
  }
  /* events */
  const cases = [
    ['index.html', 1440, '.hdr-trial', 'sign_up_start', 'header', 'fr'],
    ['nl/index.html', 1440, '.hdr-login', 'login_click', 'header', 'nl'],
    ['en/index.html', 390, '.mnav-app [data-app=signup]', 'sign_up_start', 'menu', 'en'],
    ['index.html', 390, '.mnav-login', 'login_click', 'menu', 'fr'],
    ['prix.html', 1440, '.price-go [data-app=signup]', 'sign_up_start', 'pricing', 'fr'],
    ['nl/prijzen.html', 390, '.price-go [data-app=signup]', 'sign_up_start', 'pricing', 'nl'],
    ['en/index.html', 1440, '.ft-login', 'login_click', 'footer', 'en'],
  ];
  for (const [rel, w, sel, ev, place, lang] of cases) {
    for (const consent of ['granted', 'denied']) {
      const ctx = await newCtx(w, consent);
      const p = await ctx.newPage();
      await p.goto(base + rel, { waitUntil: 'load' });
      if (place === 'menu') await p.click('.burger', { timeout: 3000 }).catch(() => {});
      if (!(await p.locator(sel).count())) { F.events.push(`${rel} @${w} : ${sel} introuvable`); await ctx.close(); continue; }
      await p.locator(sel).first().scrollIntoViewIfNeeded({ timeout: 3000 }).catch(() => {});
      await p.locator(sel).first().click({ force: true, timeout: 3000 }).catch(() => {});
      const r = await p.evaluate(() => ({ url: location.pathname, dl: (window.dataLayer || []).filter((e) => e && /^(sign_up_start|login_click)$/.test(e.event)).map((e) => ({ event: e.event, place: e.place, page: e.page, lang: e.lang })) }));
      const want = consent === 'granted' ? [{ event: ev, place, page: '/' + rel, lang }] : [];
      if (JSON.stringify(r.dl) !== JSON.stringify(want)) F.events.push(`${rel} @${w} ${sel} (${consent}) : ${JSON.stringify(r.dl)} ≠ ${JSON.stringify(want)}`);
      await ctx.close();
    }
  }
  srv.close();
  return F;
}

/* ---------- rapport ---------- */

async function run(root, { quiet = false, browserOpts } = {}) {
  const s = statics(root);
  const browser = await chromium.launch();
  const b = await browserChecks(root, browser, browserOpts);
  await browser.close();
  const F = { ...s.F, ...b };
  if (!quiet) {
    const label = { url: 'adresses écrites une seule fois (shell.mjs)', header: `en-tête des ${s.normal} pages avec menu : Se connecter, démo, essai`, menu: 'menu mobile : essai, démo, connexion avant la langue', footer: 'pied de page : Se connecter après Contact', pricing: `${s.prices} grilles de prix : essai, démo, règle de l'essai`, lp: `${s.lps} pages d'atterrissage : aucun lien vers l'application`, layout: 'en-tête dans son cadre, ordre, menu (360 à 1440 px, FR/NL/EN)', events: 'sign_up_start / login_click avec accord, rien sans' };
    for (const [k, v] of Object.entries(F)) {
      console.log(`  ${v.length ? '✗' : '✓'} ${label[k]}`);
      v.slice(0, 8).forEach((x) => console.log(`      ${x}`));
      if (v.length > 8) console.log(`      … ${v.length - 8} de plus`);
    }
  }
  return F;
}

/* ---------- mutants : chaque vérification doit crier sur une copie cassée ---------- */

const MUTANTS = [
  ['url', 'adresse recopiée dans un composant', (r) => fs.appendFileSync(path.join(r, '_src/components/blocks.mjs'), `\n/* ${LOGIN} */\n`)],
  ['header', '« Se connecter » après la démo', (r) => edit(r, 'index.html', /(<a class="hdr-login"[^>]*>[^<]*<\/a>)(<a class="btn btn-line btn-sm hdr-demo"[^>]*>[^<]*<\/a>)/, '$2$1')],
  ['header', '« Appeler Janet » revient dans l\'en-tête', (r) => edit(r, 'garages.html', /(<div class="hdr-cta">)/, '$1<a class="btn btn-orange btn-sm hdr-call" href="tel:+32460254413" data-call>x</a>')],
  ['header', '?lang=nl oublié', (r) => edit(r, 'nl/garages.html', 'https://app.celya.be/inscription?lang=nl" data-app="signup" data-place="header"', 'https://app.celya.be/inscription" data-app="signup" data-place="header"')],
  ['menu', 'connexion retirée du menu', (r) => edit(r, 'nl/index.html', /<a class="mnav-login"[^>]*>[^<]*<\/a>/, '')],
  ['footer', 'connexion retirée du pied de page', (r) => edit(r, 'en/index.html', /<a class="ft-login"[^>]*>[^<]*<\/a>/, '')],
  ['pricing', 'essai retiré de la grille', (r) => edit(r, 'prix.html', /(<div class="price-go">)<a class="btn btn-orange"[^>]*>[^<]*<\/a>/, '$1')],
  ['pricing', 'règle de l\'essai modifiée', (r) => edit(r, 'nl/prijzen.html', /(<div class="price-go">[\s\S]*?<small>)[^<]*/, '$130 dagen gratis.')],
  ['lp', 'connexion sur une page d\'atterrissage', (r) => edit(r, 'lp/garages.html', /(<\/footer>)/, `<a href="${LOGIN}">x</a>$1`)],
  ['layout', 'seuil du menu ramené à 1180 px', (r) => edit(r, 'celya.css', '@media (max-width:1259px){', '@media (max-width:1180px){')],
  ['layout', 'connexion visible sous 720 px', (r) => edit(r, 'celya.css', '.hdr-demo,.hdr-login{display:none}', '.hdr-demo{display:none}')],
  ['layout', 'menu : bloc d\'accès qui déborde', (r) => edit(r, 'celya.css', '.mnav-app .btn{width:100%}', '.mnav-app .btn{width:130%}')],
  ['events', 'sign_up_start renommé', (r) => edit(r, 'celya.js', "'sign_up_start'", "'signup_start'")],
  ['events', 'place perdu', (r) => edit(r, 'celya.js', "place:app.getAttribute('data-place')||''", "place:''")],
  ['events', 'événement envoyé sans accord', (r) => edit(r, 'celya.js', "if(app)track({event:", "if(app)(window.dataLayer=window.dataLayer||[]).push({event:")],
];
function edit(root, rel, from, to) {
  const f = path.join(root, rel), s = fs.readFileSync(f, 'utf8');
  const n = typeof from === 'string' ? s.replace(from, to) : s.replace(from, to);
  if (n === s) throw new Error(`mutant sans effet sur ${rel}`);
  fs.writeFileSync(f, n);
}
async function mutants() {
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'acces-app-'));
  const copy = () => {
    fs.rmSync(path.join(tmp, 'r'), { recursive: true, force: true });
    fs.cpSync(REPO, path.join(tmp, 'r'), { recursive: true, filter: (s) => !/\/(\.git|node_modules|docs)(\/|$)/.test(s.slice(REPO.length)) });
    return path.join(tmp, 'r');
  };
  let killed = 0;
  for (const [id, what, apply] of MUTANTS) {
    const r = copy();
    apply(r);
    const browserOpts = ['layout', 'events'].includes(id) ? undefined : { widths: [1440], pages: ['index.html'] };
    const F = await run(r, { quiet: true, browserOpts });
    const hit = F[id].length > 0;
    killed += hit;
    console.log(`  ${hit ? '✓' : '✗'} ${id} crie : ${what}${hit ? '' : ' — NON DÉTECTÉ'}`);
  }
  fs.rmSync(tmp, { recursive: true, force: true });
  console.log(`\n${killed}/${MUTANTS.length} mutants détectés.`);
  process.exit(killed === MUTANTS.length ? 0 : 1);
}

if (process.argv.includes('--mutants')) await mutants();
else {
  console.log('Accès à l\'application (19/11/2026)');
  const F = await run(REPO);
  const n = Object.values(F).reduce((a, v) => a + v.length, 0);
  console.log(n ? `\n${n} écart(s).` : '\nTout passe.');
  process.exit(n ? 1 : 0);
}
