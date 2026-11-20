#!/usr/bin/env node
/* Plus aucun tiret long (U+2014) sur le site : décision de Bora du 19/11/2026
 * (il donne au texte un air écrit par une IA). Les titres finissent par
 * « | Celya ». Le tiret demi-cadratin « – » des plages (10–15, 9h–18h) reste.
 *
 * Échoue si l'un de ces fichiers contient le tiret long, sous quelque forme que
 * ce soit (caractère, &mdash;, &#8212;, &#x2014;, \u2014 dans un script) :
 *   - les fichiers servis : tout ce que git suit et que Vercel publie (HTML,
 *     CSS, JS, manifeste, XML, SVG…), hors .vercelignore, docs/ et les notes
 *     du dépôt (CLAUDE.md, README.md) ;
 *   - les sources du générateur : _src/ et data/. Seuls les outils
 *     d'extraction de _src/tools/, qui recopient des textes d'avant ce lot et
 *     ne se relancent jamais, gardent la forme échappée \u2014 dans leurs
 *     chaînes ; le caractère lui-même y est refusé comme ailleurs.
 *
 * Exporte aussi sansTiretLong(), la normalisation qui permet à
 * tests/seo-avant-apres.mjs et tests/texte-conserve.mjs d'accepter la
 * réécriture : un tiret long est devenu une virgule, un deux-points, un point,
 * des parenthèses, « | », « · » (ou « – » dans le nom de l’agenda
 * « Celya – Réservations »). Les mots, eux, doivent rester identiques.
 *
 *   node tests/tiret-long.mjs [--racine <dossier>] */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const TIRET = '\u2014';

/** Compare deux textes au mot près, en ignorant la ponctuation qui a pu
 *  remplacer un tiret long, et la majuscule qu'un point a pu imposer. */
export function sansTiretLong(s) {
  return String(s).replace(/[\u2014\u2013:;,.()|·]/g, ' ').replace(/\s+/g, ' ').trim().toLowerCase();
}
/** Vrai si a (avant) et b (après) ne diffèrent que par la réécriture du tiret long. */
export function memeSansTiret(a, b) {
  return a === b || (String(a).includes(TIRET) && sansTiretLong(a) === sansTiretLong(b));
}

const FORMES = /\u2014|&mdash;|&#8212;|&#x2014;/gi;
const ECHAPPE = /\\u2014/gi;
const SERVIS = /\.(html?|css|m?js|json|webmanifest|xml|txt|svg|vtt)$/i;

function fichiers(racine) {
  const git = (a) => execFileSync('git', a, { cwd: racine, encoding: 'utf8' }).split('\n').filter(Boolean);
  return [...new Set([...git(['ls-files']), ...git(['ls-files', '--others', '--exclude-standard'])])]
    .filter((f) => fs.existsSync(path.join(racine, f)));
}

function ignores(racine) {
  const p = path.join(racine, '.vercelignore');
  if (!fs.existsSync(p)) return [];
  return fs.readFileSync(p, 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#')).map((l) => l.replace(/\/$/, ''));
}

export function verifier(racine) {
  const ign = ignores(racine);
  const exclu = (f) => ign.some((g) => f === g || f.startsWith(g + '/'))
    || /^(docs|tests|\.claude|\.github)\//.test(f) || /^\./.test(f) || ['CLAUDE.md', 'README.md'].includes(f);
  const fautes = [];
  let servis = 0, sources = 0;
  for (const f of fichiers(racine)) {
    const source = /^(_src|data)\//.test(f);
    const servi = !source && !exclu(f) && SERVIS.test(f);
    if (!source && !servi) continue;
    source ? sources++ : servis++;
    const txt = fs.readFileSync(path.join(racine, f), 'utf8');
    const motif = source && f.startsWith('_src/tools/') ? FORMES : new RegExp(`${FORMES.source}|${ECHAPPE.source}`, 'gi');
    txt.split('\n').forEach((ligne, i) => {
      const m = ligne.match(motif);
      if (m) {
        const j = ligne.search(motif);
        fautes.push(`${f}:${i + 1}  « …${ligne.slice(Math.max(0, j - 50), j + 50).trim()}… »`);
      }
    });
  }
  return { fautes, servis, sources };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const a = process.argv.indexOf('--racine');
  const racine = a >= 0 ? path.resolve(process.argv[a + 1]) : path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const { fautes, servis, sources } = verifier(racine);
  for (const l of fautes.slice(0, 40)) console.log('✗ ' + l);
  if (fautes.length > 40) console.log(`  … et ${fautes.length - 40} autre(s)`);
  console.log(fautes.length
    ? `\nTiret long : ${fautes.length} occurrence(s) à réécrire (virgule, deux-points, point, parenthèses ; « | Celya » dans les titres).`
    : `Tiret long : aucun, dans ${servis} fichier(s) servi(s) et ${sources} source(s) (_src/, data/).`);
  process.exit(fautes.length ? 1 : 0);
}
