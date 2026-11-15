#!/usr/bin/env node
/* Test 1 — SEO avant/après (lot « refonte premium »).
 *
 * Pour chaque URL du sitemap publié sur origin/main, compare l'ancienne page
 * (git show origin/main:<fichier>) et la nouvelle (fichier du dépôt) :
 *   title · meta description · H1 · H2 (ordre) · FAQ visible · FAQPage ·
 *   canonical · hreflang · JSON-LD @graph.
 *
 * Règles :
 *  - title, description, H1, canonical, hreflang : identiques au caractère près
 *    (après normalisation des espaces et des entités) ;
 *  - H2 : les anciens H2 restent tous, dans le même ordre ; un H2 ajouté doit
 *    appartenir à la liste fixe des titres de composants (tests/h2-composants.json) ;
 *  - FAQ visible : mêmes questions, même ordre ; une réponse ne change que si
 *    tests/corrections-autorisees.json la liste pour cette page ;
 *  - FAQPage == FAQ visible (questions et réponses) ;
 *  - @graph : nœud par nœud, identique, sauf les nœuds listés pour la page.
 *
 *   node tests/seo-avant-apres.mjs [--ref origin/main] [pages…]
 * Sortie 1 au premier écart non autorisé. */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { loadData, offreTokens, fill } from '../_src/lib/core.mjs';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const refIdx = args.indexOf('--ref');
const REF = refIdx >= 0 ? args[refIdx + 1] : 'origin/main';
const only = args.filter((a, i) => !a.startsWith('--') && (refIdx < 0 || i !== refIdx + 1));

const CORR = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/corrections-autorisees.json'), 'utf8'));

const ENT = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', rarr: '→', larr: '←', euro: '€', middot: '·', rsquo: '’', hellip: '…', mdash: '—', ndash: '–' };
export function norm(s) {
  return String(s)
    .replace(/<[^>]+>/g, ' ')
    .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n))
    .replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => (n in ENT ? ENT[n] : m))
    .replace(/[    ]/g, ' ')
    .replace(/\s+/g, ' ')
    .replace(/ ([:;?!»])/g, '$1').replace(/(«) /g, '$1')
    .trim();
}

function mainOf(html) {
  const i = html.indexOf('<main'), j = html.indexOf('</main>');
  return i >= 0 ? html.slice(i, j) : html;
}
export function seo(html) {
  const g = (re) => { const m = re.exec(html); return m ? m[1] : null; };
  const main = mainOf(html);
  const graph = [];
  for (const m of html.matchAll(/<script type="application\/ld\+json">\s*([\s\S]*?)\s*<\/script>/g)) {
    try { graph.push(...(JSON.parse(m[1])['@graph'] || [])); } catch { graph.push({ '@type': 'JSON-INVALIDE' }); }
  }
  const faq = [...main.matchAll(/<details(?![^>]*class=\"card)[^>]*>\s*<summary>((?:(?!<\/summary>)[\s\S])*)<\/summary>\s*<div class="a">((?:(?!<\/details>)[\s\S])*?)<\/div>\s*<\/details>/g)]
    .map((m) => [norm(m[1]), norm(m[2])]);
  const fp = graph.find((n) => n['@type'] === 'FAQPage');
  return {
    title: norm(g(/<title>([\s\S]*?)<\/title>/) || ''),
    desc: norm(g(/<meta name="description" content="([^"]*)"/) || ''),
    h1: [...main.matchAll(/<h1[^>]*>([\s\S]*?)<\/h1>/g)].map((m) => norm(m[1])),
    h2: [...main.matchAll(/<h2[^>]*>([\s\S]*?)<\/h2>/g)].map((m) => norm(m[1])),
    canonical: g(/<link rel="canonical" href="([^"]*)"/),
    hreflang: [...html.matchAll(/<link rel="alternate" hreflang="([^"]*)" href="([^"]*)"/g)].map((m) => m[1] + ' ' + m[2]).sort(),
    faq,
    faqpage: fp ? fp.mainEntity.map((q) => [norm(q.name), norm(q.acceptedAnswer.text)]) : null,
    graph,
  };
}

/* La liste fixe des H2 de composants, calculée depuis les données (aucun
 * montant écrit ici) : un H2 ajouté qui n'en fait pas partie est un écart. */
const DATA = loadData();
const H2_OK = [];
for (const lang of ['fr', 'nl', 'en']) {
  const t = DATA.i18n[lang], tok = offreTokens(DATA.offre, lang);
  for (const k of ['cards_h2', 'cases_h2', 'agenda_h2', 'orders_h2', 'confirm_h2', 'price_h2']) H2_OK.push(norm(fill(t[k], tok, 'i18n')));
  if (t.home) for (const k of ['ends_h2', 'tools_h2']) H2_OK.push(norm(t.home[k]));
}
H2_OK.push(...(CORR.h2_composants || []).map(norm));

const key = (n) => `${n['@type']}${n['@id'] ? ' ' + n['@id'] : ''}`;
const sortObj = (o) => (Array.isArray(o) ? o.map(sortObj) : o && typeof o === 'object' ? Object.fromEntries(Object.keys(o).sort().map((k) => [k, sortObj(o[k])])) : o);
const same = (a, b) => JSON.stringify(sortObj(a)) === JSON.stringify(sortObj(b));

export function compare(rel, before, after) {
  const err = [];
  const corr = CORR.pages[rel] || {};
  const corrFaq = Object.fromEntries(Object.entries(corr.faq || {}).map(([q, v]) => [norm(q), v]));
  for (const f of ['title', 'desc', 'canonical']) {
    if (before[f] !== after[f] && !(corr[f])) err.push(`${f} : « ${before[f]} » → « ${after[f]} »`);
  }
  if (JSON.stringify(before.h1) !== JSON.stringify(after.h1)) err.push(`H1 : ${JSON.stringify(before.h1)} → ${JSON.stringify(after.h1)}`);
  if (JSON.stringify(before.hreflang) !== JSON.stringify(after.hreflang) && !corr.hreflang) err.push(`hreflang : ${before.hreflang.join(' | ')} → ${after.hreflang.join(' | ')}`);
  /* H2 : sous-suite ordonnée + ajouts de la liste fixe */
  let k = 0;
  for (const h of after.h2) {
    if (k < before.h2.length && h === before.h2[k]) { k++; continue; }
    if (!H2_OK.includes(h) && !(corr.h2_ajouts || []).includes(h)) err.push(`H2 ajouté hors liste : « ${h} »`);
  }
  if (k < before.h2.length) err.push(`H2 perdu ou déplacé : « ${before.h2[k]} » (ordre attendu : ${before.h2.join(' / ')})`);
  /* FAQ visible */
  const qb = before.faq.map((x) => x[0]), qa = after.faq.map((x) => x[0]);
  if (JSON.stringify(qb) !== JSON.stringify(qa)) err.push(`FAQ : questions différentes\n      avant : ${qb.join(' | ')}\n      après : ${qa.join(' | ')}`);
  else before.faq.forEach(([q, a], i) => {
    if (a !== after.faq[i][1] && !corrFaq[q]) err.push(`FAQ « ${q} » : réponse modifiée sans correction listée\n      avant : ${a}\n      après : ${after.faq[i][1]}`);
  });
  /* FAQPage == FAQ visible : chaque question déclarée existe à l'écran, même réponse, même ordre */
  if (after.faqpage) {
    const vis = after.faq.filter(([q]) => after.faqpage.some(([fq]) => fq === q));
    const i = after.faqpage.findIndex((x, n) => JSON.stringify(x) !== JSON.stringify(vis[n]));
    if (i >= 0) err.push(`FAQPage ≠ FAQ visible (question ${i + 1}) :\n      JSON-LD : ${JSON.stringify(after.faqpage[i])}\n      visible : ${JSON.stringify(vis[i] || null)}`);
  }
  if (!!before.faqpage !== !!after.faqpage) err.push('FAQPage apparu ou disparu');
  /* @graph */
  const B = new Map(before.graph.map((n) => [key(n), n])), A = new Map(after.graph.map((n) => [key(n), n]));
  const allowed = corr.graph || [];
  for (const [kk, n] of B) {
    if (!A.has(kk)) err.push(`@graph : nœud disparu ${kk}`);
    else if (!same(n, A.get(kk)) && !allowed.includes(n['@type']) && !(n['@type'] === 'FAQPage' && corr.faq)) err.push(`@graph : nœud modifié ${kk}`);
  }
  for (const kk of A.keys()) if (!B.has(kk)) err.push(`@graph : nœud ajouté ${kk}`);
  return err;
}

function main() {
  const smap = execFileSync('git', ['show', `${REF}:sitemap.xml`], { cwd: ROOT, encoding: 'utf8' });
  let urls = [...smap.matchAll(/<loc>https:\/\/celya\.be\/([^<]*)<\/loc>/g)].map((m) => m[1]);
  let files = urls.map((u) => (u === '' || u.endsWith('/') ? u + 'index.html' : u));
  if (only.length) files = files.filter((f) => only.includes(f));
  let bad = 0, ok = 0;
  for (const rel of files) {
    let old;
    try { old = execFileSync('git', ['show', `${REF}:${rel}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { continue; }
    const cur = path.join(ROOT, rel);
    if (!fs.existsSync(cur)) { console.log(`✗ ${rel} : la page a disparu`); bad++; continue; }
    const err = compare(rel, seo(old), seo(fs.readFileSync(cur, 'utf8')));
    if (err.length) { bad++; console.log(`✗ ${rel}\n    ${err.join('\n    ')}`); } else ok++;
  }
  console.log(`\nSEO avant/après (${REF}) : ${ok} page(s) conforme(s), ${bad} en écart.`);
  process.exit(bad ? 1 : 0);
}
if (import.meta.url === `file://${process.argv[1]}`) main();
