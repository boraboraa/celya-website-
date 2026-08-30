#!/usr/bin/env node
/* Garde-fou SEO/produit : refuse les revendications que le produit ne tient pas.
 *
 * Deux usages :
 *   node .claude/hooks/verif-seo.js fichier.html [...]   -> controle explicite
 *   (hook PostToolUse)                                   -> lit le JSON sur stdin
 *
 * Sortie 0 = propre. Sortie 2 = bloque, avec le motif sur stderr.
 */
'use strict';
const fs = require('fs');

/* Note sur la premiere regle : \b est ASCII en JavaScript, donc /\bDuits\b/i
 * matche l'interieur de « deduits » et « reduits » — le e accentue compte comme
 * une non-lettre et cree une frontiere. Verifie sur
 * combien-coute-une-secretaire-en-belgique.html : « conges legaux deduits ».
 * On garde donc la frontiere par lookaround sur \p{L}, ce qui attrape en prime
 * Duitstalig, Duitse et Duitsland. */
const interdits = [
  [/(?<!\p{L})(?:Deutsch|Duits\p{L}*)/iu, "langue allemande : hors produit"],
  [/(plus de\s*)?\b(1[0-9]|[2-9][0-9])\s*(langues|talen|languages)\b/i,
   "revendication multilingue non adossee : le produit annonce FR + NL"],
];

/* Les fichiers de travail hors site ne sont pas controles. */
const CONTROLE = /\.(html|md)$/i;

function verifie(chemin) {
  if (!CONTROLE.test(chemin) || !fs.existsSync(chemin)) return [];
  const src = fs.readFileSync(chemin, 'utf8');
  const lignes = src.split('\n');
  const trouves = [];
  for (const [re, motif] of interdits) {
    lignes.forEach((l, i) => {
      const m = l.match(re);
      if (m) trouves.push(`${chemin}:${i + 1}  « ${m[0]} » — ${motif}`);
    });
  }
  return trouves;
}

function rapporte(trouves) {
  if (!trouves.length) return 0;
  console.error('Revendication interdite :\n  ' + trouves.join('\n  '));
  return 2;
}

if (process.argv.length > 2) {
  const t = process.argv.slice(2).flatMap(verifie);
  if (!t.length) console.log(`  ${process.argv.length - 2} fichier(s) : aucune revendication interdite`);
  process.exit(rapporte(t));
}

let brut = '';
process.stdin.on('data', (d) => (brut += d));
process.stdin.on('end', () => {
  let chemin = '';
  try {
    const e = JSON.parse(brut || '{}');
    chemin = (e.tool_input && (e.tool_input.file_path || e.tool_input.notebook_path)) || '';
  } catch (_) { /* pas de JSON exploitable : on ne bloque rien */ }
  process.exit(chemin ? rapporte(verifie(chemin)) : 0);
});
