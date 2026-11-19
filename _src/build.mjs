#!/usr/bin/env node
/* Celya : générateur du site (Node 22, aucune dépendance).
 *
 *   node _src/build.mjs              construit toutes les pages de _src/pages
 *   node _src/build.mjs a.html …     seulement celles-là (chemins de sortie)
 *   node _src/build.mjs --check      n'écrit rien ; échoue si une page publiée
 *                                    diffère de ce que le générateur produit
 *
 * Chaque page source _src/pages/<chemin>.html ressort à <chemin>.html, à la
 * racine du dépôt : exactement la même URL qu'avant. Les pages générées sont
 * versionnées et servies telles quelles par Vercel (aucune étape de build côté
 * Vercel : le déploiement ne change pas). */
import fs from 'node:fs';
import path from 'node:path';
import { ROOT, SRC, loadData, parsePage, offreTokens, fill } from './lib/core.mjs';
import { context } from './components/shell.mjs';

const LAYOUTS = {};
async function layout(name) {
  if (!LAYOUTS[name]) LAYOUTS[name] = (await import(`./layouts/${name}.mjs`)).default;
  return LAYOUTS[name];
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name);
    return e.isDirectory() ? walk(p) : e.name.endsWith('.html') ? [p] : [];
  });
}

export async function render(rel, data = loadData()) {
  const file = path.join(SRC, 'pages', rel);
  const src = fs.readFileSync(file, 'utf8');
  const page = parsePage(src, rel);
  page.src = src;
  const c = context(page, data, rel);
  const fn = await layout(page.meta.layout);
  const html = fn(c);
  return fill(html, offreTokens(data.offre, page.meta.lang), rel);
}

async function main() {
  const args = process.argv.slice(2);
  const check = args.includes('--check');
  const only = args.filter((a) => !a.startsWith('--'));
  const pagesDir = path.join(SRC, 'pages');
  const all = walk(pagesDir).map((p) => path.relative(pagesDir, p).split(path.sep).join('/')).sort();
  const todo = only.length ? all.filter((r) => only.includes(r)) : all;
  if (only.length && todo.length !== only.length) {
    console.error('page source introuvable : ' + only.filter((r) => !all.includes(r)).join(', '));
    process.exit(1);
  }
  const data = loadData();
  let diff = 0;
  for (const rel of todo) {
    const html = await render(rel, data);
    const out = path.join(ROOT, rel);
    if (check) {
      const cur = fs.existsSync(out) ? fs.readFileSync(out, 'utf8') : null;
      if (cur !== html) { diff++; console.log('  diffère : ' + rel); }
    } else {
      fs.mkdirSync(path.dirname(out), { recursive: true });
      fs.writeFileSync(out, html);
    }
  }
  if (check) {
    console.log(diff ? `\n${diff} page(s) publiée(s) ne correspondent pas au générateur : lancer node _src/build.mjs` : `  ${todo.length} page(s) : conformes au générateur`);
    process.exit(diff ? 1 : 0);
  }
  console.log(`  ${todo.length} page(s) écrite(s)`);
}

if (import.meta.url === `file://${process.argv[1]}`) main().catch((e) => { console.error(e.message); process.exit(1); });
