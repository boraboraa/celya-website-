#!/usr/bin/env node
/* Test 5 — budget de rendu (CLAUDE.md, lot performance du 5 septembre 2026),
 * appliqué au thème du lot « refonte premium ». Statique ; la vérification à
 * l'exécution (document.getAnimations() hors écran) est faite par sweep*.js. */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const css = fs.readFileSync(path.join(ROOT, 'celya.css'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const js = fs.readFileSync(path.join(ROOT, 'celya.js'), 'utf8').replace(/\/\*[\s\S]*?\*\//g, '');
const fails = [];
const count = (s, re) => (s.match(re) || []).length;
const bd = count(css, /backdrop-filter\s*:/g), wc = count(css, /will-change\s*:/g);
if (bd > 2) fails.push(`backdrop-filter : ${bd} (max 2)`);
if (wc > 1) fails.push(`will-change : ${wc} (max 1)`);
/* aucune règle qui porte à la fois une animation et un filter */
for (const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g)) {
  if (/(^|;)\s*filter\s*:/.test(m[2]) && /animation(-name)?\s*:/.test(m[2])) fails.push(`filter: sur un élément animé : ${m[1].trim()}`);
}
/* les @keyframes n'animent que transform et opacity */
for (const m of css.matchAll(/@keyframes\s+([\w-]+)\s*\{([\s\S]*?\})\s*\}/g)) {
  const props = [...m[2].matchAll(/([a-z-]+)\s*:/g)].map((x) => x[1]).filter((p) => !['transform', 'opacity'].includes(p));
  if (props.length) fails.push(`@keyframes ${m[1]} anime ${[...new Set(props)].join(', ')} (seuls transform et opacity)`);
}
const raf = count(js, /requestAnimationFrame\(/g), scroll = count(js, /addEventListener\(\s*'scroll'/g), resize = count(js, /addEventListener\(\s*'resize'/g);
if (raf > 1) fails.push(`requestAnimationFrame : ${raf} appels (un seul, pour regrouper le resize)`);
if (scroll > 0) fails.push(`écouteur scroll : ${scroll} (aucun : IntersectionObserver suffit)`);
if (resize > 1) fails.push(`écouteur resize : ${resize} (un seul)`);
if (!/prefers-reduced-motion:\s*reduce/.test(css)) fails.push('aucune règle prefers-reduced-motion');
if (!/\.anim-off/.test(css) || !/anim-off/.test(js)) fails.push('pause hors écran (.anim-off) absente');
console.log(fails.length ? fails.join('\n') : `Budget de rendu : backdrop-filter ${bd}/2 · will-change ${wc}/1 · aucun filter animé · keyframes en transform/opacity · rAF ${raf} · scroll ${scroll} · resize ${resize}.`);
process.exit(fails.length ? 1 : 0);
