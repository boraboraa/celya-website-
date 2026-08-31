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
/* Chaque regle lit soit le fichier entier, soit la variante ou le nuage de
 * langues des trois accueils est neutralise (voir NUAGE plus bas). */
const interdits = [
  [/(?<!\p{L})(?:Deutsch|Duits\p{L}*)/iu, "langue allemande : hors produit", 'horsNuage'],
  [/(plus de\s*)?\b(1[0-9]|[2-9][0-9])\s*(langues|talen|languages)\b/i,
   "revendication multilingue non adossee : on nomme les langues, on ne les compte pas"],

  /* Pieges NL-NL : ce sont ceux qu'on ne voit pas en se relisant.
   * Reference : docs/vocabulaire-be.md, section « Neerlandais de Belgique ». */
  [/(?<!\p{L})dakdekker\p{L}*/iu, "NL-NL : ecrire « dakwerker »"],
  [/(?<!\p{L})glaszetter\p{L}*/iu, "NL-NL : ecrire « glazenmaker »"],
  [/(?<!\p{L})stukadoor\p{L}*/iu, "NL-NL : ecrire « plafonneerder »"],
  [/(?<!\p{L})timmerman(?!\p{L})|(?<!\p{L})timmerlieden(?!\p{L})/iu,
   "NL-NL : ecrire « schrijnwerker »"],
  [/(?<!\p{L})huisartsenpost\p{L}*/iu, "NL-NL : ecrire « wachtpost »"],
  [/(?<!\p{L})administratiekantoor\p{L}*/iu, "NL-NL : ecrire « boekhoudkantoor »"],
  [/(?<!\p{L})reservering\p{L}*/iu, "NL-NL : ecrire « reservatie »"],
  [/(?<!\p{L})cv-monteur\p{L}*/iu, "NL-NL : ecrire « technicus centrale verwarming »"],
  /* « deurwaarder » seul est NL-NL ; precede de « gerechts » il est correct. */
  [/(?<!\p{L})(?<!gerechts)deurwaarder\p{L}*/iu, "NL-NL : ecrire « gerechtsdeurwaarder »"],

  /* Pieges FR de France. Reference : docs/vocabulaire-be.md, section
   * « Francais de Belgique ». */
  /* « expert-comptable certifie » est un titre legal belge protege (loi du
   * 17 mars 2019, ITAA), pas un francisme : le motif large frappait un usage
   * correct dans l'audienceType de fiduciaires.html. On ne vise donc que la
   * formulation de France que le referentiel ecarte vraiment. */
  [/cabinets?\s+d[e']\s*(expertise\s+comptable|experts?-comptables?)/iu,
   "FR-FR : ecrire « fiduciaire » ou « comptable-fiscaliste »"],
  [/(?<!\p{L})orthophonist\p{L}*/iu, "FR-FR : ecrire « logopede »"],
  [/(?<!\p{L})plaquiste\p{L}*/iu, "FR-FR : ecrire « plafonneur »"],
  [/(?<!\p{L})masseur-kin\p{L}*/iu, "FR-FR : ecrire « kinesitherapeute »"],
];

/* Les fichiers de travail hors site ne sont pas controles. */
const CONTROLE = /\.(html|md)$/i;

/* Le referentiel, les notes de travail et l'inventaire interne CITENT les mots
 * interdits : c'est leur fonction. Les controler bloquerait toute edition du
 * referentiel, et apercu.html affiche en clair le nom de chaque fichier du
 * depot — dont nl/blog/restaurants-telefonische-reserveringen.html, une URL
 * publiee qu'on ne renomme pas. Aucune des trois n'est une page publique :
 * apercu.html porte noindex,nofollow, ne figure pas au sitemap et n'est liee
 * depuis nulle part. */
const EXEMPTS = /(?:^|\/)(?:docs\/vocabulaire-be\.md|CLAUDE\.md|apercu\.html)$/;

/* Les URL deja publiees ne sont pas de la prose : renommer un fichier en
 * ligne est un probleme de redirection, pas de vocabulaire. On neutralise
 * donc le contenu des attributs href et src avant de chercher. */
const LIENS = /\b(?:href|src|content)\s*=\s*"[^"]*"/gi;

/* Le nuage de langues des trois accueils NOMME les langues que le moteur vocal
 * sait parler — chacune verifiee dans la documentation publique du fournisseur,
 * citee dans CLAUDE.md. « Deutsch » y a donc sa place, et nulle part ailleurs :
 * c'est une capacite du moteur, jamais une promesse de service. La regle reste
 * bloquante sur les 287 autres pages, et sur le reste de ces trois-la.
 * Le plafond « N langues / talen / languages », lui, ne bouge pas : un total
 * ne se verifie pas, on nomme les langues au lieu de les compter. */
const ACCUEILS = /(?:^|\/)(?:nl\/|en\/)?index\.html$/;
const NUAGE = /<div class="langcloud"[\s\S]*?<\/div>/gi;

function verifie(chemin) {
  if (!CONTROLE.test(chemin) || EXEMPTS.test(chemin) || !fs.existsSync(chemin)) return [];
  const src = fs.readFileSync(chemin, 'utf8')
    .replace(LIENS, (m) => (/^\s*content/i.test(m) ? m : m.replace(/[^\s="]/g, '.')));
  /* Meme decoupage en lignes des deux cotes : le remplacement conserve les
   * retours a la ligne, donc les numeros signales restent justes. */
  const horsNuage = ACCUEILS.test(chemin)
    ? src.replace(NUAGE, (m) => m.replace(/[^\n]/g, ' '))
    : src;
  const lignes = { src: src.split('\n'), horsNuage: horsNuage.split('\n') };
  const trouves = [];
  for (const [re, motif, source] of interdits) {
    lignes[source || 'src'].forEach((l, i) => {
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
