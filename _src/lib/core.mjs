/* Celya : noyau du générateur (Node 22, aucune dépendance).
 *
 * Une page source (_src/pages/<chemin>.html) est un fichier HTML découpé en
 * blocs par des commentaires-balises :
 *
 *   <!--@page {"layout":"article","lang":"fr", …}-->   métadonnées (JSON)
 *   <!--@head-->      lignes SEO du <head>, recopiées telles quelles
 *   <!--@h1-->        contenu du H1
 *   <!--@section {"kind":"text"}-->   un bloc ; le JSON est optionnel
 *   …
 *
 * Un bloc court jusqu'au marqueur suivant. Les blocs de même nom s'empilent
 * dans l'ordre (page.blocks.section = [..]). Rien n'est interprété dans le
 * contenu d'un bloc, sauf les jetons {{offre.…}} / {{t.…}} résolus à la fin,
 * sur la page entière (<head> et JSON-LD compris), pour que la FAQ visible et
 * le FAQPage portent toujours le même montant.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');
export const SRC = path.join(ROOT, '_src');

const readJSON = (p) => JSON.parse(fs.readFileSync(path.join(ROOT, p), 'utf8'));

export function loadData() {
  return {
    offre: readJSON('data/offre.json'),
    i18n: readJSON('data/i18n.json'),
    metiers: readJSON('data/metiers.json'),
  };
}

/* ---------- pages sources ---------- */

const MARK = /<!--@([a-z0-9_-]+)(?:\s+(\{[\s\S]*?\}))?\s*-->/gi;

export function parsePage(src, file) {
  const marks = [...src.matchAll(MARK)];
  if (!marks.length || marks[0][1] !== 'page') throw new Error(`${file} : premier bloc attendu <!--@page {…}-->`);
  const page = { file, meta: null, blocks: {}, seq: [] };
  marks.forEach((m, i) => {
    const name = m[1];
    let attrs = {};
    if (m[2]) {
      try { attrs = JSON.parse(m[2]); } catch (e) { throw new Error(`${file} : JSON invalide dans <!--@${name}--> : ${e.message}`); }
    }
    const start = m.index + m[0].length;
    const end = i + 1 < marks.length ? marks[i + 1].index : src.length;
    const body = src.slice(start, end).replace(/^\n/, '').replace(/\n$/, '');
    if (name === 'page') { page.meta = attrs; return; }
    const b = { name, attrs, html: body };
    page.seq.push(b);
    (page.blocks[name] ||= []).push(b);
  });
  return page;
}

/** Le premier bloc d'un nom, ou '' */
export const one = (page, name) => (page.blocks[name] && page.blocks[name][0] ? page.blocks[name][0].html : '');
export const all = (page, name) => page.blocks[name] || [];

/* ---------- jetons de données ---------- */

const NBSP = ' ';

/** Nombre au format de la langue : 1 750 / 1,750 */
export function num(n, lang) {
  return lang === 'en' ? n.toLocaleString('en-GB') : n.toLocaleString('fr-BE').replace(/ /g, NBSP);
}
/** Montant : « N € » (fr, nl) ou « €N » (en) */
export function eur(n, lang) {
  return lang === 'en' ? `€${num(n, lang)}` : `${num(n, lang)}${NBSP}€`;
}

/** Table des jetons {{offre.…}} pour une langue. Toute valeur de l'offre
 *  vient d'ici : c'est la seule porte entre data/offre.json et les pages. */
export function offreTokens(offre, lang) {
  const t = {};
  const F = offre.formules;
  for (const f of F) {
    t[`offre.${f.id}.prix`] = num(f.prix_ht, lang);
    t[`offre.${f.id}.eur`] = eur(f.prix_ht, lang);
    t[`offre.${f.id}.minutes`] = num(f.minutes, lang);
    t[`offre.${f.id}.nom`] = f.nom[lang];
    t[`offre.${f.id}.agendas`] = f.agendas_txt[lang];
    t[`offre.${f.id}.sms`] = num(f.sms_secours, lang);
    t[`offre.${f.id}.prix_n`] = String(f.prix_ht); /* nombres bruts, pour les scripts */
    t[`offre.${f.id}.minutes_n`] = String(f.minutes);
  }
  const prix = F.map((f) => f.prix_ht), mins = F.map((f) => f.minutes);
  t['offre.min_prix'] = num(Math.min(...prix), lang);
  t['offre.min_eur'] = eur(Math.min(...prix), lang);
  t['offre.max_minutes'] = num(Math.max(...mins), lang);
  t['offre.meta'] = num(offre.regles.meta_mensuel_approx, lang);
  t['offre.essai'] = num(offre.regles.essai_jours, lang); /* jours d'essai gratuit (19/11/2026) */
  t['offre.tel'] = offre.telephone.affiche.replace(/ /g, NBSP);
  t['offre.tel_e164'] = offre.telephone.e164;
  /* listes : « 49, 99 et 199 » / « 49, 99 en 199 » / « 49, 99 and 199 » */
  const et = { fr: 'et', nl: 'en', en: 'and' }[lang];
  const list = (a) => `${a.slice(0, -1).join(', ')} ${et} ${a[a.length - 1]}`;
  t['offre.liste_prix'] = list(F.map((f) => num(f.prix_ht, lang)));
  t['offre.liste_minutes'] = list(F.map((f) => num(f.minutes, lang)));
  return t;
}

/** Résout {{clé}} ; une clé inconnue arrête la construction. */
export function fill(html, tokens, file) {
  return html.replace(/\{\{\s*([a-z0-9_.]+)\s*\}\}/gi, (m, k) => {
    if (!(k in tokens)) throw new Error(`${file} : jeton inconnu {{${k}}}`);
    return tokens[k];
  });
}

/* ---------- chemins ---------- */

/** « nl/blog/x.html » → « ../../ » */
export const prefixOf = (rel) => '../'.repeat(rel.split('/').length - 1);

export function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

/** Retire les balises (pour un attribut, un aria-label) */
export const strip = (h) => h.replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
