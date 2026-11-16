#!/usr/bin/env node
/* Migration : aucun texte ne se perd. Pour chaque page passée au nouveau
 * gabarit, chaque paragraphe, élément de liste, question, cellule et titre de
 * l'ancienne page (origin/main, ou --ref) doit se retrouver, mot pour mot, dans
 * le <main> de la nouvelle. Ce qui est volontairement retiré ou corrigé est
 * listé dans tests/corrections-autorisees.json (pages.<page>.texte).
 *
 *   node tests/texte-conserve.mjs [--ref origin/main] [pages…]   (défaut : toutes) */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const args = process.argv.slice(2);
let ref = 'origin/main';
const ri = args.indexOf('--ref');
if (ri >= 0) { ref = args[ri + 1]; args.splice(ri, 2); }
const allow = JSON.parse(fs.readFileSync(path.join(ROOT, 'tests/corrections-autorisees.json'), 'utf8'));

const ENT = { nbsp: ' ', amp: '&', lt: '<', gt: '>', quot: '"', rsquo: '’', lsquo: '‘', ldquo: '“', rdquo: '”', laquo: '«', raquo: '»', euro: '€', rarr: '→', mdash: '—', ndash: '–', hellip: '…', eacute: 'é', egrave: 'è', agrave: 'à', ccedil: 'ç', ecirc: 'ê', icirc: 'î', ocirc: 'ô', ucirc: 'û', middot: '·', times: '×', apos: "'" };
const norm = (s) => s.replace(/<[^>]+>/g, ' ')
  .replace(/&#(\d+);/g, (m, n) => String.fromCodePoint(+n)).replace(/&#x([0-9a-f]+);/gi, (m, n) => String.fromCodePoint(parseInt(n, 16)))
  .replace(/&([a-z]+);/gi, (m, n) => ENT[n] ?? m)
  .replace(/[   ]/g, ' ').replace(/[’‘]/g, "'").replace(/\s+/g, ' ').replace(/\s([:;?!»])/g, '$1').replace(/«\s/g, '«').trim();

function mainOf(html) {
  let m = html.slice(html.indexOf('<main'), html.lastIndexOf('</main>'));
  m = m.replace(/<footer[\s\S]*?<\/footer>/g, '').replace(/<svg[\s\S]*?<\/svg>/g, '').replace(/<script[\s\S]*?<\/script>/g, '').replace(/<style[\s\S]*?<\/style>/g, '');
  return m;
}
function chunks(html) {
  const m = mainOf(html)
    .replace(/<aside class="t-answer[\s\S]*?<\/aside>/g, '')        // « Sur cette page » : répète les H2
    .replace(/<p class="proof">[\s\S]*?<\/p>/g, '')                   // petite écriture du héros (retour du 15/11)
    .replace(/<div class="kick">[\s\S]*?<\/div>/g, '');               // accroches : vérifiées à part
  const out = new Set();
  for (const x of m.matchAll(/<(p|li|summary|td|th|h1|h2|h3|blockquote|dt|dd)\b[^>]*>([\s\S]*?)<\/\1>/g)) {
    const t = norm(x[2]);
    if (t.length >= 12 && !/^[\d\s.,:—–-]+$/.test(t)) out.add(t);
  }
  /* lignes de liste de liens : le titre et la phrase */
  for (const x of m.matchAll(/<a class="mrow"[^>]*>[\s\S]*?<b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span>/g)) out.add(norm(x[2]));
  return [...out];
}

/* les pages passées au nouveau gabarit avant le lot du 16/11 (accueils, prix,
 * métiers FR, démo) ont été réécrites sur maquette et validées par Bora : elles
 * ne relèvent pas de ce contrôle. */
const AVANT = '1c2ce15';
const deja = new Set(execFileSync('git', ['grep', '-l', 'celya.css', AVANT, '--', '*.html'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(Boolean).map((l) => l.slice(AVANT.length + 1)));
const pages = args.length ? args : execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT, encoding: 'utf8' }).split('\n')
  .filter((f) => f && !/^(_src|docs|tests|api|assets|node_modules)\//.test(f));
let bad = 0, n = 0;
for (const rel of pages) {
  let old;
  try { old = execFileSync('git', ['show', `${ref}:${rel}`], { cwd: ROOT, encoding: 'utf8', stdio: ['ignore', 'pipe', 'ignore'] }); } catch { continue; }
  if (deja.has(rel) || old.includes('celya.css') || !fs.existsSync(path.join(ROOT, rel))) continue;   // page déjà nouvelle à la référence, ou retirée
  const now = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  if (!now.includes('celya.css')) continue;                                          // pas encore migrée
  n++;
  const hay = norm(mainOf(now));
  const ok = new Set(((allow.pages || {})[rel] || {}).texte || []);
  const miss = chunks(old).filter((t) => !hay.includes(t) && ![...ok].some((a) => t.includes(norm(a)) || norm(a).includes(t)));
  if (miss.length) {
    bad++;
    console.log(`✗ ${rel}`);
    for (const t of miss.slice(0, 8)) console.log(`    perdu : « ${t.slice(0, 140)}${t.length > 140 ? '…' : ''} »`);
    if (miss.length > 8) console.log(`    … et ${miss.length - 8} autre(s)`);
  }
}
console.log(`\nTexte conservé (${ref}) : ${n - bad} page(s) migrée(s) sans perte, ${bad} avec écart.`);
process.exit(bad ? 1 : 0);
