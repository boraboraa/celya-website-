#!/usr/bin/env node
/* Lot du 16/11/2026 : aucune page ne reste sur l'ancien thème.
 * Parcourt toutes les pages HTML servies (le dépôt, moins ce que .vercelignore
 * écarte du déploiement) et échoue si une seule ne porte pas l'en-tête du
 * nouveau gabarit (<header class="hdr">) et celya.css, ou si elle référence
 * encore l'ancien thème (bento.css, bento.js, dark.css).
 *
 *   node tests/migration.mjs            (liste les pages en écart)
 *   node tests/migration.mjs --compte   (seulement les totaux) */
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const quiet = process.argv.includes('--compte');
const ignore = fs.readFileSync(path.join(ROOT, '.vercelignore'), 'utf8').split('\n').map((l) => l.trim().replace(/\/$/, '')).filter((l) => l && !l.startsWith('#'));
const glob = (pat) => new RegExp('^' + pat.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '[^/]*') + '(/|$)');
const skip = ignore.map(glob);
const files = execFileSync('git', ['ls-files', '--cached', '--others', '--exclude-standard', '*.html'], { cwd: ROOT, encoding: 'utf8' })
  .split('\n').filter(Boolean).filter((f) => !skip.some((re) => re.test(f)) && fs.existsSync(path.join(ROOT, f)));

const OLD = /bento\.css|bento\.js|dark\.css/;
const bad = [];
for (const f of files.sort()) {
  const s = fs.readFileSync(path.join(ROOT, f), 'utf8');
  const why = [];
  if (!/<header class="hdr[" ]/.test(s)) why.push('pas de header.hdr');
  if (!/<link rel="stylesheet" href="[^"]*celya\.css">/.test(s)) why.push('pas de celya.css');
  const m = OLD.exec(s);
  if (m) why.push('référence ' + m[0]);
  if (why.length) bad.push([f, why]);
}
if (!quiet) for (const [f, why] of bad) console.log(`✗ ${f} — ${why.join(', ')}`);
console.log(`\nMigration : ${files.length - bad.length} page(s) servie(s) sur le nouveau gabarit, ${bad.length} encore sur l'ancien (sur ${files.length}).`);
process.exit(bad.length ? 1 : 0);
