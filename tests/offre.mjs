#!/usr/bin/env node
/* Test 3 — l'offre vit dans un seul fichier (data/offre.json).
 *  - aucun prix ni nombre de minutes d'une formule écrit en dur dans les
 *    sources (_src/, celya.css, celya.js, data/i18n.json, data/metiers.json) ;
 *  - l'ancienne grille (75 / 150 / 300 €, 250 / 750 / 1 750 minutes) n'apparaît
 *    plus dans aucune page générée ;
 *  - aucun jeton {{…}} non résolu dans une page générée. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const offre = JSON.parse(fs.readFileSync(path.join(ROOT, 'data/offre.json'), 'utf8'));
const S = '[\\s\\u00a0\\u202f]*';
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap((e) => (e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]));
const fails = [];

/* 1. sources */
const prix = offre.formules.map((f) => f.prix_ht), mins = offre.formules.map((f) => f.minutes);
const enDur = new RegExp(`(?<![\\d.,])(?:${prix.join('|')})${S}(?:€|&euro;|euros?)|€${S}(?:${prix.join('|')})(?![\\d])|(?<![\\d.,])(?:${mins.join('|')})${S}(?:minutes|minuten)`, 'i');
const sources = [...walk(path.join(ROOT, '_src')), 'celya.css', 'celya.js', 'data/i18n.json', 'data/metiers.json'].map((f) => path.resolve(ROOT, f));
for (const f of sources) {
  if (!/\.(mjs|js|css|json|html|py)$/.test(f)) continue;
  fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    const m = enDur.exec(l);
    if (m) fails.push(`${path.relative(ROOT, f)}:${i + 1} — montant ou quota en dur « ${m[0]} » : passer par {{offre.…}}`);
  });
}

/* 2. pages générées */
const OLD = new RegExp(`(?<![\\d.,])(?:75|150|300)${S}(?:€|&euro;)|€${S}(?:75|150|300)(?![\\d])|(?<![\\d.,])(?:250|1${S}750|1,750|1750)${S}(?:minutes|minuten)|75, 150 (?:et|en|and) 300`, 'i');
const pages = fs.readdirSync(path.join(ROOT, '_src/pages'), { recursive: true }).filter((f) => f.endsWith('.html'));
for (const rel of pages) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const m = OLD.exec(html.replace(/<script>[\s\S]*?<\/script>/g, ''));
  if (m) fails.push(`${rel} — ancienne grille : « ${m[0]} »`);
  const t = /\{\{[^}]*\}\}|\{offre\.[a-z_.]+\}/.exec(html);
  if (t) fails.push(`${rel} — jeton non résolu « ${t[0]} »`);
}
console.log(fails.length ? fails.join('\n') + `\n\n${fails.length} écart(s).` : `Offre : ${sources.length} sources sans montant en dur, ${pages.length} pages générées sans ancienne grille.`);
process.exit(fails.length ? 1 : 0);
