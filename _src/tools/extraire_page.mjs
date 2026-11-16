#!/usr/bin/env node
/* Migration, une fois par page : lit une page publiée (ancien thème bento) et
 * écrit sa page source _src/pages/<chemin>.html pour le générateur.
 *
 *   node _src/tools/extraire_page.mjs <layout> <page.html> [...]
 *
 * Ce qui est recopié tel quel, à l'octet près : les lignes SEO du <head>
 * (title, description, canonical, hreflang, og, twitter, JSON-LD @graph), le
 * texte de chaque section, de chaque FAQ, des liens « À lire ensuite » et de
 * l'appel final. Ce qui est réécrit : seulement les enveloppes décoratives de
 * l'ancien thème (spans d'animation .lr/.l2, classes .it/.gradtxt → <em>).
 * Ce qui disparaît : les widgets de démonstration du thème sombre, la table
 * « Sur cette page » (elle répète les H2), et les boutons — le gabarit les
 * fournit. Les pages « métier », « accueil » et « prix » se relisent à la main
 * après extraction : leurs sections portent des widgets que le gabarit remplace
 * par les composants du lot. */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT } from '../lib/core.mjs';

/* ---------- outils HTML (sources générées, donc bien formées) ---------- */

const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);

/** Élément complet qui commence à `start` (un « < » ouvrant). */
export function outer(html, start) {
  const tag = /^<([a-z0-9]+)/i.exec(html.slice(start))[1].toLowerCase();
  if (VOID.has(tag)) return html.slice(start, html.indexOf('>', start) + 1);
  const re = new RegExp(`<(/?)${tag}\\b[^>]*>`, 'gi');
  re.lastIndex = start;
  let depth = 0, m;
  while ((m = re.exec(html))) {
    if (m[0].endsWith('/>')) continue;
    depth += m[1] ? -1 : 1;
    if (depth === 0) return html.slice(start, m.index + m[0].length);
  }
  throw new Error('élément non fermé à ' + start);
}
export const inner = (el) => el.slice(el.indexOf('>') + 1, el.lastIndexOf('</'));

/** Tous les éléments `tag` dont la classe contient `cls`, au premier niveau trouvé. */
function findAll(html, tag, cls) {
  const out = [];
  const re = new RegExp(`<${tag}\\b[^>]*class="([^"]*)"[^>]*>`, 'gi');
  let m;
  while ((m = re.exec(html))) {
    if (cls && !m[1].split(/\s+/).includes(cls)) continue;
    const el = outer(html, m.index);
    out.push({ el, cls: m[1], at: m.index });
    re.lastIndex = m.index + el.length;
  }
  return out;
}

/** Enveloppes d'animation de l'ancien thème → texte propre. */
export function cleanHeading(h) {
  /* deux lignes .lr collées sans blanc : le navigateur les séparait (bloc), le texte aussi */
  let s = h.replace(/<\/span><\/span>(?=<span class="lr">)/g, '</span></span> ');
  for (let i = 0; i < 4; i++) {
    s = s.replace(/<span class="(?:lr|l2)"><span>([\s\S]*?)<\/span><\/span>/g, '$1');
  }
  s = s.replace(/<span class="(?:gradtxt )?it(?: gradtxt)?">([\s\S]*?)<\/span>/g, '<em>$1</em>');
  s = s.replace(/<span class="gradtxt">([\s\S]*?)<\/span>/g, '$1');
  return s.replace(/\n\s*/g, ' ').replace(/\s{2,}/g, ' ').trim();
}

const dedent = (s) => s.split('\n').map((l) => l.replace(/^\s+/, '')).join('\n').trim();

/* ---------- <head> ---------- */

function headSEO(src) {
  const head = src.slice(src.indexOf('<head>') + 6, src.indexOf('</head>'));
  const keep = [];
  const re = /<title>[\s\S]*?<\/title>|<meta\s[^>]*>|<link\s[^>]*>|<script type="application\/ld\+json">[\s\S]*?<\/script>/gi;
  let m;
  while ((m = re.exec(head))) {
    const t = m[0];
    if (/^<meta (charset|name="viewport"|name="theme-color"|name="color-scheme")/i.test(t)) continue;
    if (/^<link rel="(icon|stylesheet|preload)"/i.test(t)) continue;
    keep.push(t);
  }
  return keep.join('\n');
}

/* ---------- corps ---------- */

function langs(src) {
  const m = /<div class="lang">([\s\S]*?)<\/div>/.exec(src);
  const out = {};
  if (m) for (const a of m[1].matchAll(/<a[^>]*href="([^"]*)"[^>]*>([A-Z]{2})<\/a>/g)) out[a[2].toLowerCase()] = a[1];
  return out;
}

function hero(main) {
  const t = findAll(main, 'section', 't-hero')[0];
  if (!t) return {};
  const el = t.el;
  const kick = (/<div class="kick">([\s\S]*?)<\/div>/.exec(el) || [])[1] || '';
  const h1 = cleanHeading(/<h1>([\s\S]*?)<\/h1>/.exec(el)[1]);
  const sub = (/<p class="sub">([\s\S]*?)<\/p>/.exec(el) || [])[1] || '';
  let proof = (/<p class="proof">([\s\S]*?)<\/p>/.exec(el) || [])[1] || '';
  /* la ligne de preuve porte le numéro de Janet : le gabarit le remet */
  proof = proof.replace(/\s*<span class="cta-q">[\s\S]*?<\/span>\s*<b>\+32[\s\S]*?<\/b>\s*\.?/g, '').trim();
  return { kick: kick.trim(), h1, sub: sub.trim(), proof };
}

/** Une section → bloc source. */
function section(el, cls) {
  const h2m = /<h2([^>]*)>([\s\S]*?)<\/h2>/.exec(el);
  const kick = (/<div class="kick"><span>([\s\S]*?)<\/span><\/div>/.exec(el) || [])[1] || '';
  const id = h2m ? (/id="([^"]*)"/.exec(h2m[1]) || [])[1] : undefined;
  const secId = (/^<section[^>]*\sid="([^"]*)"/.exec(el) || [])[1];
  const h2 = h2m ? cleanHeading(h2m[2]) : '';
  const c = cls.split(/\s+/);
  if (c.includes('cine')) {
    const line = /<p class="cine-line">([\s\S]*?)<\/p>/.exec(el);
    return line ? { name: 'pull', attrs: {}, html: cleanHeading(line[1]) } : null;
  }
  if (c.includes('faq-free')) {
    const items = [...el.matchAll(/<details([^>]*)>\s*<summary>([\s\S]*?)<\/summary>\s*<div class="a">([\s\S]*?)<\/div>\s*<\/details>/g)]
      .map((d) => `<details${/\bopen\b/.test(d[1]) ? ' open' : ''}><summary>${d[2]}</summary><div class="a">${d[3]}</div></details>`);
    return { name: 'faq', attrs: { kick, ...(secId ? { id: secId } : {}) }, html: `<h2>${h2}</h2>\n${items.join('\n')}` };
  }
  if (c.includes('cta-free')) {
    let proof = (/<p class="proof">([\s\S]*?)<\/p>/.exec(el) || [])[1] || '';
    proof = proof.replace(/<span class="cta-q">[\s\S]*?<\/span>\s*<b>\+32[^<]*<\/b>\s*\.?\s*/g, '').trim();
    return { name: 'cta', attrs: {}, html: `<h2>${h2}</h2>${proof ? '\n<p>' + proof + '</p>' : ''}` };
  }
  const mlist = /<div class="mlist">([\s\S]*?)<\/div>\s*(<p class="backrow">[\s\S]*?<\/p>)?/.exec(el);
  if (mlist) {
    const rows = [...mlist[1].matchAll(/<a class="mrow" href="([^"]*)">[\s\S]*?<b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span>[\s\S]*?<\/a>/g)]
      .map((r) => `<a href="${r[1]}"><b>${r[2]}</b><span>${r[3]}</span></a>`);
    /* une section qui porte à la fois du texte et une liste de liens : le texte
     * d'abord (section), puis les liens sans titre (related) — rien ne se perd */
    const ai = el.indexOf('<div class="access-txt">');
    const prose = ai >= 0 && ai < el.indexOf('<div class="mlist">') ? dedent(inner(outer(el, ai))) : '';
    const rel = { name: 'related', attrs: { kick: prose ? '' : kick }, html: `${prose ? '' : `<h2>${h2}</h2>\n`}${rows.join('\n')}${mlist[2] ? '\n' + mlist[2] : ''}` };
    if (prose) return [{ name: 'section', attrs: { kick, ...(id ? { id } : {}) }, html: `<h2${id ? ` id="${id}"` : ''}>${h2}</h2>\n${prose}` }, rel];
    return rel;
  }
  const body = /<div class="access-txt">([\s\S]*?)<\/div>\s*<\/div>\s*<\/section>$/.exec(el);
  const h2tag = `<h2${id ? ` id="${id}"` : ''}>${h2}</h2>`;
  if (body) return { name: 'section', attrs: { kick, ...(id ? { id } : {}) }, html: `${h2tag}\n${dedent(body[1])}` };
  /* section à widgets (métier, accueil, prix) : on récolte la prose, on jette le décor */
  return { name: 'section', attrs: { kick, ...(id ? { id } : {}), brut: cls }, html: `${h2tag}\n${harvest(el)}` };
}

/** Récolte le texte d'une section à widgets, dans l'ordre : paragraphes, listes,
 *  et le contenu des widgets de démonstration converti en listes. Le décor
 *  (svg, images, tableaux d'agenda animés, badges « Exemple ») disparaît. */
function study(el) {
  const href = /href="([^"]*)"/.exec(el)[1];
  const kick = (/<span class="kick">([\s\S]*?)<\/span>/.exec(el) || [])[1] || '';
  const h2 = cleanHeading(/<h2[^>]*>([\s\S]*?)<\/h2>/.exec(el)[1]);
  const p = /<h2[^>]*>[\s\S]*?<\/h2>\s*<p>([\s\S]*?)<\/p>/.exec(el)[1];
  const link = (/<span class="st-link">([\s\S]*?)<i/.exec(el) || [])[1] || '';
  return { name: 'section', attrs: { kick, etude: true }, html: `<h2>${h2}</h2>\n<p>${p}</p>${link ? `\n<p><a href="${href}">${link.trim()}</a></p>` : ''}` };
}

export function harvest(el) {
  let s = el.replace(/^<[^>]+>|<\/[a-z]+>$/g, '');
  s = s.replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<img[^>]*>/g, '');
  s = s.replace(/<div class="fs-head">[\s\S]*?<\/h2>/, '').replace(/<div class="kick">[\s\S]*?<\/div>/, '').replace(/<h2[^>]*>[\s\S]*?<\/h2>/, '');
  for (const cls of ['agf-boards', 'agf-tabs', 'fun-fork', 'fun-stem', 'agf-ov']) {
    let i;
    while ((i = s.search(new RegExp(`<div class="${cls}\\b`))) >= 0) s = s.slice(0, i) + s.slice(i + outer(s, i).length);
  }
  s = s.replace(/<span class="(?:exbadge|wave[^"]*)"[^>]*>[\s\S]*?<\/span>/g, '');
  /* entonnoir : une carte = une ligne */
  s = s.replace(/<div class="fcard[^"]*">\s*<b class="fc-tag">([\s\S]*?)<\/b>\s*<p class="fc-q">([\s\S]*?)<\/p>\s*<div class="fc-out">\s*<span class="fo-ic"><\/span>\s*<div><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/div>\s*<\/div>\s*<\/div>/g,
    '<li><b>$1</b> — $2 → <b>$3</b> : $4</li>');
  s = s.replace(/<div class="fun-cards">([\s\S]*?)<\/div>(?=\s*<p class="fun-note">|\s*<\/div>)/, '<ul>$1</ul>');
  s = s.replace(/<div class="fun-top">\s*<b>\s*([\s\S]*?)<\/b>\s*<span>([\s\S]*?)<\/span>\s*<\/div>/, '<p><b>$1</b> — $2</p>');
  s = s.replace(/<div class="fun-janet"><b>([\s\S]*?)<\/b>\s*<\/div>/, '<p>$1</p>');
  /* listes de détail : numérotées ou non */
  let k;
  while ((k = s.indexOf('<div class="det-list">')) >= 0) {
    const el2 = outer(s, k), inner2 = inner(el2);
    const items = [...inner2.matchAll(/<div class="det-li">(?:<span class="n">\d+<\/span>)?([\s\S]*?)<\/div>/g)]
      .map((x) => `<li>${x[1].replace(/<span class="dur">([\s\S]*?)<\/span>/, ' — $1').trim()}</li>`);
    const note = /<p class="det-note">([\s\S]*?)<\/p>/.exec(inner2);
    const tag = /<span class="n">/.test(inner2) ? 'ol' : 'ul';
    s = s.slice(0, k) + (items.length ? `<${tag}>${items.join('')}</${tag}>` : '') + (note ? `<p>${note[1]}</p>` : '') + s.slice(k + el2.length);
  }
  /* lien d'étude (tuile t-study) */
  s = s.replace(/<span class="st-link">([\s\S]*?)<i[^>]*>[\s\S]*?<\/i>\s*<\/span>/, '<p class="st-link">$1</p>');
  const out = [];
  const re = /<(p|ul|ol|h3|table|blockquote)\b[^>]*>[\s\S]*?<\/\1>/g;
  let m;
  while ((m = re.exec(s))) {
    const t = m[0].replace(/^<(p|ul|ol|h3|table|blockquote)\b(?! class="st-link")[^>]*>/, '<$1>').trim();
    if (t.replace(/<[^>]+>/g, '').trim()) out.push(t);
  }
  return out.join('\n');
}

function extract(layout, rel) {
  const src = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  /* garde-fou : une page déjà générée n'a plus l'ancien contenu (CLAUDE.md) */
  if (src.includes('celya.css')) throw new Error(`${rel} est déjà une page générée : restaurer l'ancienne depuis git avant d'extraire`);
  const lang = /<html lang="([a-z]+)"/.exec(src)[1];
  const main = src.slice(src.indexOf('<main'), src.indexOf('</main>'));
  const h = hero(main);
  const robots = /<meta name="robots" content="noindex/.test(src);
  const meta = { layout, lang, langs: langs(src), ...(robots ? { noindex: true } : {}) };
  const blocks = [];
  blocks.push(['head', {}, headSEO(src)]);
  if (h.kick) blocks.push(['kick', {}, h.kick]);
  blocks.push(['h1', {}, h.h1]);
  if (h.sub) blocks.push(['lede', {}, h.sub]);
  if (h.proof) blocks.push(['proof', {}, h.proof]);
  const secs = findAll(main, 'section', null).filter((s) => !/\bt-hero\b/.test(s.cls))
    .concat(findAll(main, 'a', 't-study').map((s) => ({ ...s, study: true })))
    .sort((a, b) => a.at - b.at);
  for (const s of secs) {
    const b = s.study ? study(s.el) : section(s.el, s.cls);
    for (const x of [].concat(b || [])) blocks.push([x.name, x.attrs, x.html]);
  }
  const out = [`<!--@page ${JSON.stringify(meta)}-->`];
  for (const [n, a, html] of blocks) out.push(`<!--@${n}${Object.keys(a).length ? ' ' + JSON.stringify(a) : ''}-->\n${html}`);
  const dest = path.join(ROOT, '_src', 'pages', rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, out.join('\n') + '\n');
  return dest;
}

const [layout, ...files] = process.argv.slice(2);
if (!layout || !files.length) {
  console.error('usage : node _src/tools/extraire_page.mjs <layout> <page.html> […]');
  process.exit(1);
}
for (const f of files) console.log('  ' + path.relative(ROOT, extract(layout, f)));
