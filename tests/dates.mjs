#!/usr/bin/env node
/* Jours de la semaine (décision de Bora du 16/11/2026) : un jour écrit à côté
 * d'une date doit être le bon. Les exemples de rendez-vous de data/metiers.json
 * portaient des jours de 2025 (« Mercredi 19 novembre », « Samedi 22 novembre »),
 * faux en 2026.
 *
 * Cherche, en FR, NL et EN, en toutes lettres comme en abrégé, chaque
 * « jour + numéro + mois » (« jeudi 19 novembre », « Do 19 nov. »,
 * « Thursday 19 November », « Thu 19 Nov ») dans data/, _src/pages/ et les
 * pages servies, et calcule le jour de cette date : l'année qui suit si elle
 * est écrite, 2026 sinon (l'année des exemples). Échoue au premier écart.
 *
 *   node tests/dates.mjs */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const YEAR = 2026;

/* jours : 0 = dimanche … 6 = samedi */
const DAYS = {
  dimanche: 0, lundi: 1, mardi: 2, mercredi: 3, jeudi: 4, vendredi: 5, samedi: 6,
  dim: 0, lun: 1, mar: 2, mer: 3, jeu: 4, ven: 5, sam: 6,
  zondag: 0, maandag: 1, dinsdag: 2, woensdag: 3, donderdag: 4, vrijdag: 5, zaterdag: 6,
  zo: 0, ma: 1, di: 2, wo: 3, do: 4, vr: 5, za: 6,
  sunday: 0, monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6,
  sun: 0, mon: 1, tue: 2, wed: 3, thu: 4, fri: 5, sat: 6,
};
/* mois : 0 = janvier */
const MONTHS = {
  janvier: 0, février: 1, mars: 2, avril: 3, mai: 4, juin: 5, juillet: 6, août: 7, septembre: 8, octobre: 9, novembre: 10, décembre: 11,
  janv: 0, févr: 1, avr: 3, juil: 6, sept: 8, oct: 9, nov: 10, déc: 11,
  januari: 0, februari: 1, maart: 2, april: 3, mei: 4, juni: 5, juli: 6, augustus: 7, oktober: 9, november: 10, december: 11,
  jan: 0, feb: 1, mrt: 2, apr: 3, jun: 5, jul: 6, aug: 7, sep: 8, okt: 9, dec: 11,
  january: 0, february: 1, march: 2, june: 5, july: 6, august: 7, september: 8, october: 9,
  mar_: 2,
};
const NAMES = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
const alt = (o) => Object.keys(o).filter((k) => !k.endsWith('_')).sort((a, b) => b.length - a.length).join('|');
const RE = new RegExp(`(?<![\\p{L}])(${alt(DAYS)})\\.?(?:\\s|&nbsp;|\\u00a0)+(\\d{1,2})(?:er|e)?(?:\\s|&nbsp;|\\u00a0)+(${alt(MONTHS)}|mar)\\.?(?![\\p{L}])(?:(?:\\s|&nbsp;|\\u00a0)+(\\d{4}))?`, 'giu');

const files = [
  ...fs.readdirSync(path.join(ROOT, 'data')).filter((f) => f.endsWith('.json')).map((f) => 'data/' + f),
  ...fs.readdirSync(path.join(ROOT, '_src/pages'), { recursive: true }).filter((f) => f.endsWith('.html')).map((f) => '_src/pages/' + f.split(path.sep).join('/')),
  ...execFileSync('git', ['ls-files', '*.html'], { cwd: ROOT, encoding: 'utf8' }).split('\n').filter((f) => f && !/^(_src|docs|tests|node_modules)\//.test(f)),
];
let n = 0;
const bad = [];
for (const f of files) {
  const lines = fs.readFileSync(path.join(ROOT, f), 'utf8').split('\n');
  lines.forEach((line, i) => {
    for (const m of line.matchAll(RE)) {
      const day = DAYS[m[1].toLowerCase()], d = +m[2], mon = MONTHS[m[3].toLowerCase()] ?? MONTHS.mar_, y = m[4] ? +m[4] : YEAR;
      const real = new Date(Date.UTC(y, mon, d));
      if (real.getUTCMonth() !== mon) { bad.push(`${f}:${i + 1} « ${m[0]} » : cette date n'existe pas`); continue; }
      n++;
      if (real.getUTCDay() !== day) bad.push(`${f}:${i + 1} « ${m[0]} » : le ${d}/${mon + 1}/${y} est un ${NAMES[real.getUTCDay()]}`);
    }
  });
}
/* le contrôle se contrôle : la date des exemples, et un jour faux, sont bien lus */
const probe = (s) => [...s.matchAll(RE)].length;
if (!(probe('jeudi 19 novembre') && probe('Do 19 nov.') && probe('Thu 19 Nov') && probe('Mercredi 19 novembre'))) bad.push('le motif ne reconnaît plus les dates des exemples');
if (new Date(Date.UTC(2026, 10, 19)).getUTCDay() !== 4) bad.push('le 19 novembre 2026 devrait être un jeudi');

console.log(bad.length ? bad.join('\n') : `Dates : ${n} jour(s) + date relus dans ${files.length} fichiers, tous justes (année ${YEAR} quand elle n'est pas écrite).`);
process.exit(bad.length ? 1 : 0);
