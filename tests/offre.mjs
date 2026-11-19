#!/usr/bin/env node
/* Test 3 — l'offre vit dans un seul fichier (data/offre.json).
 *  - aucun prix ni nombre de minutes d'une formule écrit en dur dans les
 *    sources (_src/, celya.css, celya.js, data/i18n.json, data/metiers.json) ;
 *  - l'ancienne grille (75 / 150 / 300 €, 250 / 750 / 1 750 minutes) n'apparaît
 *    plus dans aucune page générée ;
 *  - aucun jeton {{…}} non résolu dans une page générée ;
 *  - essai gratuit (décision de Bora du 19/11/2026) : la durée vit dans
 *    data/offre.json (regles.essai_jours) et ne s'écrit nulle part en dur dans
 *    les sources ; plus aucune formule de l'ancien essai de 30 jours, ni dans
 *    les pages servies, ni dans _src/, ni dans data/. */
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
/* _src/tools : outils de migration, qui citent l'ancienne grille pour la remplacer */
const sources = [...walk(path.join(ROOT, '_src')).filter((f) => !f.includes(`${path.sep}tools${path.sep}`)), 'celya.css', 'celya.js', 'data/i18n.json', 'data/metiers.json'].map((f) => path.resolve(ROOT, f));
for (const f of sources) {
  if (!/\.(mjs|js|css|json|html|py)$/.test(f)) continue;
  fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    const m = enDur.exec(l);
    if (m) fails.push(`${path.relative(ROOT, f)}:${i + 1} — montant ou quota en dur « ${m[0]} » : passer par {{offre.…}}`);
  });
}

/* 2. pages générées */
const OLD = new RegExp(`(?<![\\d.,])(?:75|150|300)${S}(?:€|&euro;)|€${S}(?:75|150|300)(?![\\d])|(?<![\\d.,])(?:250|1${S}750|1,750|1750)${S}(?:minutes|minuten)|75, 150 (?:et|en|and) 300`, 'i');
/* Les seuls montants qui ne sont pas des prix de Celya : le prix d'une vidange
 * dans l'enquête sur les garages (blog, trois langues). On retire ce paragraphe
 * avant le test, rien d'autre. */
const HORS_OFFRE = /<p>(?:(?!<\/p>)[\s\S])*(?:vidange avec filtre|olie verversen met filter|oil change with filter)(?:(?!<\/p>)[\s\S])*<\/p>/gi;
const FOURCHETTE = /€[\s\u00a0]?300[\s\u00a0]*(?:–|-|tot|to)[\s\u00a0]*€[\s\u00a0]?3[.,]000/g;   /* même enquête : 300 à 3 000 € de travail d'atelier */
const pages = fs.readdirSync(path.join(ROOT, '_src/pages'), { recursive: true }).filter((f) => f.endsWith('.html'));
for (const rel of pages) {
  const html = fs.readFileSync(path.join(ROOT, rel), 'utf8');
  const m = OLD.exec(html.replace(/<script>[\s\S]*?<\/script>/g, '').replace(HORS_OFFRE, '').replace(FOURCHETTE, ''));
  if (m) fails.push(`${rel} — ancienne grille : « ${m[0]} »`);
  const t = /\{\{[^}]*\}\}|\{offre\.[a-z_.]+\}/.exec(html);
  if (t) fails.push(`${rel} — jeton non résolu « ${t[0]} »`);
}
/* 3. essai gratuit : 14 jours, une seule source */
const J = offre.regles && offre.regles.essai_jours;
if (!Number.isInteger(J) || !offre.regles.essai || !['fr', 'nl', 'en'].every((l) => (offre.regles.essai[l] || '').includes('{{offre.essai}}'))) fails.push('data/offre.json — regles.essai_jours et regles.essai (fr, nl, en, avec {{offre.essai}}) attendus');
const essaiEnDur = new RegExp(`(?<![\\d.,])${J}${S}(?:jours?|dagen|days?)\\b`, 'i');
/* dans les pages, seulement accolée à l'essai (« 14 jours de rétractation » n'est pas l'essai) */
const essaiEnDurPage = new RegExp(`(?<![\\d.,])${J}${S}(?:jours?|dagen|days?)${S}(?:d['’]essai|gratuits?|gratis|proef|(?:free${S})?trial|free)`, 'i');
for (const f of sources) {
  if (!/\.(mjs|js|css|json|html|py)$/.test(f)) continue;
  const re = f.includes(`${path.sep}_src${path.sep}pages${path.sep}`) ? essaiEnDurPage : essaiEnDur;
  fs.readFileSync(f, 'utf8').split('\n').forEach((l, i) => {
    const m = re.exec(l);
    if (m) fails.push(`${path.relative(ROOT, f)}:${i + 1} — durée de l'essai en dur « ${m[0]} » : passer par {{offre.essai}}`);
  });
}
const ANCIEN_ESSAI = /30[\s\u00a0-]*(?:jours?|dagen|days?)[\s\u00a0]*(?:d['’]essai|gratuits?|gratis|proef|(?:free[\s\u00a0]*)?trial|free)|essai[\s\u00a0]+(?:gratuit[\s\u00a0]+)?de[\s\u00a0]+30[\s\u00a0]+jours|proefperiode[\s\u00a0]+van[\s\u00a0]+30|30[\s\u00a0-]*day[\s\u00a0-]+(?:free[\s\u00a0]+)?trial/i;
const served = walk(ROOT).filter((f) => f.endsWith('.html') && !/[\\/](?:docs|node_modules|\.git|tests)[\\/]/.test(path.relative(ROOT, f).replace(/^/, '/')));
for (const f of [...served, ...walk(path.join(ROOT, '_src')), ...walk(path.join(ROOT, 'data'))]) {
  if (!/\.(mjs|js|json|html|py)$/.test(f)) continue;
  const m = ANCIEN_ESSAI.exec(fs.readFileSync(f, 'utf8'));
  if (m) fails.push(`${path.relative(ROOT, f)} — ancien essai de 30 jours : « ${m[0]} »`);
}

console.log(fails.length ? fails.join('\n') + `\n\n${fails.length} écart(s).` : `Offre : ${sources.length} sources sans montant ni durée d'essai en dur, ${pages.length} pages générées sans ancienne grille, aucun essai de 30 jours.`);
process.exit(fails.length ? 1 : 0);
