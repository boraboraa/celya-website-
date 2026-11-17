#!/usr/bin/env node
/* Pages d'atterrissage (lot conversion Google Ads du 16/11/2026).
 *
 *  1. ordre des blocs : héros, badges, scène, Comment ça marche (quatre
 *     étapes), cases RDV / À rappeler / Urgent, « Appelez-la, comme un
 *     client », prix, FAQ, appel final ; plus de trois bénéfices ;
 *  2. héros : H1, une phrase, le bouton d'appel (numéro de data/offre.json),
 *     « Être rappelé » vers #lp (affiché sous 860 px seulement), le formulaire
 *     dans le héros ; aucune accroche, aucune sous-ligne, aucune pastille ;
 *  3. formulaire : même envoi (data-lead, source « demo form », page merci),
 *     mêmes champs que demo.html, dans le même ordre ;
 *  4. prix et appel final : le bouton renvoie au formulaire de la page (#lp),
 *     plus à demo.html (décision de Bora du 16/11/2026) ; une action, un nom :
 *     tout ce qui mène au formulaire dit « Être rappelé pour une démo » (NL
 *     « Bel mij terug voor een demo »), comme son bouton (17/11/2026) ;
 *  5. FAQ : cinq questions, « Vos questions, nos réponses », dont « changer de
 *     numéro » et « sauront-ils que c'est une IA » ;
 *  6. cases : textes du métier sur les pages garages, génériques ailleurs ;
 *  7. barre mobile : appeler Janet + être rappelé (#lp) ; cachée au premier
 *     écran, affichée une fois le héros dépassé ;
 *  8. CSS : aucun backdrop-filter, aucun filter, aucune ombre sur le héros ;
 *     aucune adresse e-mail dans celya.js.
 *
 *   node tests/lp.mjs */
import fs from 'node:fs';
import path from 'node:path';
import http from 'node:http';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { loadData } from '../_src/lib/core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const require = createRequire(import.meta.url);
let chromium;
try { ({ chromium } = require('playwright')); } catch { ({ chromium } = require('/opt/node22/lib/node_modules/playwright')); }
const fails = [];
const ok = (c, m) => { if (!c) fails.push(m); console.log(`  ${c ? '✓' : '✗'} ${m}`); };
const data = loadData();
const read = (f) => fs.readFileSync(path.join(ROOT, f), 'utf8');
const dec = (s) => s.replace(/&nbsp;/g, ' ').replace(/ /g, ' ');
const fields = (html) => {
  const f = /<form class="form" id="(?:lp|demo)"[\s\S]*?<\/form>/.exec(html)[0];
  return [...f.matchAll(/<(?:input|select)\b[^>]*\bname="([^"]+)"/g)].map((m) => m[1]).join(',');
};

const PAGES = [
  ['lp/garages.html', 'fr', 'garages'], ['lp/ne-plus-rater-d-appels.html', 'fr', null],
  ['nl/lp/garages.html', 'nl', 'garages'], ['nl/lp/geen-oproepen-meer-missen.html', 'nl', null],
];
const tel = data.offre.telephone;
for (const [rel, lang, metier] of PAGES) {
  console.log(`\n${rel}`);
  const html = read(rel), t = data.i18n[lang];
  const main = html.slice(html.indexOf('<main'), html.indexOf('</main>'));
  /* 1. ordre */
  const marks = ['<section class="hv lpv" data-hv="lp">', '<section class="hero-badges">', 'class="sec scn-sec"', 'id="marche"', 'class="cases"', 'class="try"', 'class="prices"', 'id="faq"', 'cta-final'];
  const at = marks.map((m) => main.indexOf(m));
  ok(at.every((x, i) => x >= 0 && (i === 0 || x > at[i - 1])), `ordre : ${marks.map((m) => m.replace(/.*class="|.*id="|".*/g, '')).join(' → ')}`);
  ok(!/class="benefits"/.test(main), 'les trois bénéfices ont disparu');
  ok((/<ol class="steps"[\s\S]*?<\/ol>/.exec(main)[0].match(/<li>/g) || []).length === 4, 'Comment ça marche : quatre étapes (ol.steps)');
  /* 2. héros */
  const hero = /<section class="hv lpv"[\s\S]*?<\/form>\s*<\/div><\/section>/.exec(main)[0];
  const txt = /<div class="lpv-t">[\s\S]*?<\/div>\s*<\/div>/.exec(hero)[0];
  ok((txt.match(/<h1>/g) || []).length === 1 && (txt.match(/<p class="lead">/g) || []).length === 1 && (txt.match(/<p\b/g) || []).length === 1, 'héros : le H1 et une phrase, rien d\'autre en texte');
  ok(!/class="(label|kick|cta-sub|proofs?|live-pill|hv-tag)/.test(hero), 'héros : aucune accroche, sous-ligne ni pastille');
  ok(hero.includes(`href="tel:${tel.e164}"`) && dec(hero).includes(dec(tel.affiche)), `héros : bouton d'appel ${tel.affiche} (data/offre.json)`);
  ok(/<a class="btn btn-line lpv-m" href="#lp">/.test(hero), 'héros : « Être rappelé » vers le formulaire (#lp)');
  ok(/<video [^>]*data-src-d="[^"]*assets\/hero\/hero-ordinateur-(720|1080)\.mp4"[^>]*data-src-m="[^"]*hero-mobile-(720|1080)\.mp4"/.test(hero), 'héros : la vidéo de l\'accueil (mêmes fichiers, même choix de source)');
  /* 3. formulaire */
  ok(/<form class="form" id="lp" data-lead="lp" data-source="demo form" data-next="[^"]*merci\.html"/.test(hero), 'formulaire dans le héros : même envoi (web-lead, « demo form », merci)');
  ok(fields(html) === fields(read(lang === 'fr' ? 'demo.html' : 'nl/demo.html')), 'formulaire : mêmes champs que la page démo, même ordre');
  /* 4. prix */
  ok(/<div class="price-go"><a class="btn btn-ink" href="#lp" data-demo>/.test(main), 'prix : « Demander une démo » renvoie au formulaire de la page');
  const cta = /<div class="panel bg-ink cta-final">[\s\S]*?<\/section>/.exec(main)[0];
  ok(/<a class="btn btn-line-d" href="#lp" data-demo>/.test(cta) && !/demo\.html/.test(cta), 'appel final : « Demander une démo » renvoie au formulaire de la page, plus à la page démo');
  ok(!/href="[^"]*demo\.html"/.test(main), 'aucun lien vers la page démo : tout renvoie au formulaire de la page');
  /* une action, un nom (décision de Bora du 17/11/2026) : tout ce qui mène au
   * formulaire porte le libellé de son bouton ; seule la barre mobile garde la forme courte */
  const toForm = [...main.matchAll(/<a [^>]*href="#lp"[^>]*>([\s\S]*?)<\/a>/g)].map((m) => dec(m[1].replace(/<[^>]+>/g, '')).trim());
  ok(toForm.length === 4 && toForm.every((x) => x === dec(t.form.submit)), `vers le formulaire : ${toForm.length} boutons, tous « ${t.form.submit} » (${[...new Set(toForm)].join(' / ')})`);
  ok(!html.includes(t.price_start) && !html.includes(t.cta_demo), `plus aucun « ${t.cta_demo} » sur la page`);
  /* 5. FAQ */
  const faq = /<section class="sec bg-page" id="faq">[\s\S]*?<\/section>/.exec(main)[0];
  const qs = [...faq.matchAll(/<summary>([\s\S]*?)<\/summary>/g)].map((m) => dec(m[1]));
  ok(qs.length === 5, `FAQ : cinq questions (${qs.length})`);
  ok(lang === 'fr' ? /Vos questions, <em>nos réponses<\/em>/.test(faq) : /Uw vragen, <em>onze antwoorden<\/em>/.test(faq), 'FAQ : « Vos questions, nos réponses »');
  ok(qs.some((q) => /changer de numéro|van nummer veranderen/.test(q)) && qs.some((q) => /que c'est une IA|dat het een AI is/.test(q)), 'FAQ : numéro et IA');
  ok(!/application\/ld\+json/.test(html) || !/FAQPage/.test(html), 'pas de FAQPage à tenir en phase (page noindex)');
  /* 6. cases */
  const k = metier ? data.metiers[metier][lang].cases : t.cases_generique;
  ok([k.rdv_p, k.rappel_p, k.urgent_p].every((x) => dec(main).includes(dec(x))), `cases : textes ${metier || 'génériques'}`);
  /* 7. barre mobile (statique) */
  const bar = /<div class="mbar"[\s\S]*?<\/div>/.exec(html);
  ok(bar && bar[0].includes(`href="tel:${tel.e164}"`) && bar[0].includes(`href="#lp">${t.mbar_callback}</a>`), `barre mobile : « ${t.cta_call} » et « ${t.mbar_callback} » (#lp)`);
}

/* 8. CSS et JS */
console.log('\nCSS / JS');
const css = read('celya.css').replace(/\/\*[\s\S]*?\*\//g, '');
const lpRules = [...css.matchAll(/([^{}]*\.lpv[^{}]*)\{([^{}]*)\}/g)];
ok(lpRules.length > 10 && lpRules.every((m) => !/backdrop-filter|(^|;)\s*filter\s*:|will-change/.test(m[2])), `héros des pages d'atterrissage : aucun backdrop-filter, filter ni will-change (${lpRules.length} règles)`);
ok(lpRules.filter((m) => /box-shadow/.test(m[2])).every((m) => /box-shadow:none/.test(m[2])), 'formulaire translucide : aucune ombre');
ok(!/[\w.+-]+@[\w-]+\.[a-z]{2,}/i.test(read('celya.js')), 'aucune adresse e-mail dans celya.js');

/* 7. barre mobile et bouton « Être rappelé » dans Chromium */
const TYPES = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.svg': 'image/svg+xml', '.webp': 'image/webp', '.png': 'image/png', '.woff2': 'font/woff2', '.mp4': 'video/mp4' };
const srv = await new Promise((res) => {
  const s = http.createServer((req, rsp) => {
    const f = path.join(ROOT, decodeURIComponent(req.url.split('?')[0]));
    if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) { rsp.writeHead(404); return rsp.end(); }
    rsp.writeHead(200, { 'Content-Type': TYPES[path.extname(f)] || 'application/octet-stream' }); fs.createReadStream(f).pipe(rsp);
  }).listen(0, '127.0.0.1', () => res(s));
});
const base = `http://127.0.0.1:${srv.address().port}/`;
const browser = await chromium.launch();
console.log('\nChromium');
for (const [rel] of PAGES) {
  for (const [w, h] of [[1440, 900], [390, 844], [360, 640]]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h } });
    await ctx.addInitScript(() => { try { localStorage.setItem('celya-consent', 'denied'); } catch (e) {} });
    const p = await ctx.newPage();
    await p.goto(base + rel, { waitUntil: 'load' });
    await p.waitForTimeout(250);
    const m = await p.evaluate(() => getComputedStyle(document.querySelector('.lpv-m')).display !== 'none');
    ok(m === w <= 860, `${rel} @${w} : « Être rappelé » ${w <= 860 ? 'affiché' : 'masqué (le formulaire est à côté)'}`);
    if (w < 720) {
      const bar = () => p.evaluate(() => getComputedStyle(document.querySelector('.mbar')).visibility !== 'hidden' && document.querySelector('.mbar').getBoundingClientRect().top < innerHeight);
      ok(!(await bar()), `${rel} @${w} : barre mobile cachée au premier écran`);
      await p.evaluate(() => { const b = document.querySelector('.lpv-t .cta-btns').getBoundingClientRect(); scrollTo(0, b.bottom + scrollY + 40); });
      await p.waitForTimeout(450);
      ok(await bar(), `${rel} @${w} : barre mobile affichée une fois les boutons du héros dépassés`);
    }
    await ctx.close();
  }
}
await browser.close();
srv.close();
console.log(fails.length ? `\n${fails.length} échec(s).` : '\nPages d\'atterrissage : tout passe.');
process.exit(fails.length ? 1 : 0);
