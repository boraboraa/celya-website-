/* L'enveloppe commune de toutes les pages : <head>, en-tête flottant, menu
 * mobile, pied de page, barre d'appel mobile. Chaque morceau existe une fois. */
import { logo, ico } from './icons.mjs';
import { esc } from '../lib/core.mjs';
import { badges } from './blocks.mjs';

/* Le Consent Mode v2 par défaut, recopié de l'ancien <head> à l'octet près :
 * tout est refusé tant que le visiteur n'a pas accepté. Ne pas toucher. */
export const CONSENT_DEFAULT = `<script>
/* Consent Mode v2 — tout est refusé tant que le visiteur n'a pas accepté */
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
</script>`;

/** Contexte de rendu d'une page : langue, préfixes de chemin, textes. */
export function context(page, data, rel) {
  const lang = page.meta.lang;
  const depth = rel.split('/').length - 1;
  const root = '../'.repeat(depth); /* vers la racine du site (assets) */
  const t = data.i18n[lang];
  const langDepth = t.base ? 1 : 0; /* nl/ et en/ sont un niveau sous la racine */
  const home = '../'.repeat(depth - langDepth) || './'; /* vers l'accueil de la langue */
  const L = (href) => (/^(https?:|mailto:|tel:|#)/.test(href) ? href : href.startsWith('./') ? home + href.slice(2) : home === './' ? href : home + href);
  return { page, data, rel, lang, root, home, t, L, offre: data.offre };
}

/* ---------- <head> ---------- */

function head(c, extraHead) {
  const { root, page } = c;
  const robots = page.meta.noindex && !/name="robots"/.test(extraHead) ? '\n<meta name="robots" content="noindex,nofollow">' : '';
  return `<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
${extraHead}${robots}
<link rel="icon" type="image/svg+xml" href="${root}favicon.svg">
<meta name="theme-color" content="#FAF1E4">
<meta name="color-scheme" content="light">
${CONSENT_DEFAULT}
<link rel="preload" href="${root}assets/fonts/newsreader-latin-400-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="preload" href="${root}assets/fonts/figtree-latin-wght-normal.woff2" as="font" type="font/woff2" crossorigin>
<link rel="stylesheet" href="${root}celya.css">
</head>`;
}

/* ---------- boutons d'appel ---------- */

export function callBtn(c, cls = 'btn-ink', full = false) {
  const { t, offre } = c;
  return `<a class="btn ${cls}" href="tel:${offre.telephone.e164}" data-call>${ico.phone}<span>${t.cta_call}${full ? ` · <span class="nw">${offre.telephone.affiche}</span>` : ''}</span></a>`;
}
export function demoBtn(c, cls = 'btn-line') {
  return `<a class="btn ${cls}" href="${c.L(c.t.demo_href)}" data-demo>${c.t.cta_demo}</a>`;
}
/** Les deux appels à l'action, partout les mêmes : héros, CTA final, LP. */
export function ctaPair(c, { dark = false, full = true, hero = false, sub = true } = {}) {
  return `<div class="cta-pair"${hero ? ' data-hero' : ''}>
<div class="cta-btns">${callBtn(c, dark ? 'btn-orange' : 'btn-ink', full)}${demoBtn(c, dark ? 'btn-line-d' : 'btn-line')}</div>
${sub ? `<p class="cta-sub">${c.t.cta_call_sub}</p>` : ''}
</div>`;
}

/* ---------- en-tête ---------- */

function langSwitch(c, cls) {
  const langs = c.page.meta.langs || {};
  return `<div class="${cls}">${['fr', 'nl', 'en'].filter((l) => langs[l]).map((l) =>
    `<a${l === c.lang ? ' class="on" aria-current="true"' : ''} href="${langs[l]}" hreflang="${l}" lang="${l}">${l.toUpperCase()}</a>`).join('')}</div>`;
}

function header(c, { bare = false } = {}) {
  const { t, L } = c;
  if (bare) {
    /* pages d'atterrissage : logo et bouton d'appel, aucun menu */
    return `<header class="hdr hdr-bare"><div class="hdr-in">
<span class="hdr-logo">${logo()}</span>
${callBtn(c, 'btn-orange btn-sm hdr-call')}
</div></header>`;
  }
  const drop = t.metiers_nav.map(([h, l]) => `<a href="${L(h)}">${l}</a>`).join('') +
    (t.metiers_all ? `<a class="drop-all" href="${L(t.metiers_all[0])}">${t.metiers_all[1]} ${ico.arrow}</a>` : '');
  const nav = t.nav.map((n) => n.drop
    ? `<div class="drop"><a class="drop-t" href="${L(n.href)}">${n.label}${ico.chev}</a><div class="drop-p">${drop}</div></div>`
    : `<a href="${L(n.href)}">${n.label}</a>`).join('');
  const mnav = t.nav.filter((n) => !n.drop).map((n) => `<a href="${L(n.href)}">${n.label}</a>`).join('') +
    `<b class="mnav-h">${t.nav.find((n) => n.drop).label}</b><div class="mnav-grid">${t.metiers_nav.map(([h, l]) => `<a href="${L(h)}">${l}</a>`).join('')}</div>` +
    (t.metiers_all ? `<a href="${L(t.metiers_all[0])}">${t.metiers_all[1]}</a>` : '');
  return `<header class="hdr"><div class="hdr-in">
<a class="hdr-logo" href="${c.home}" aria-label="${esc(t.home_label)}">${logo()}</a>
<nav class="hdr-nav" aria-label="Navigation">${nav}</nav>
${langSwitch(c, 'hdr-lang')}
<div class="hdr-cta">${demoBtn(c, 'btn-line btn-sm hdr-demo')}${callBtn(c, 'btn-orange btn-sm hdr-call')}</div>
<button class="burger" type="button" aria-expanded="false" aria-controls="mnav"><span class="burger-l">${t.menu}</span><i></i><i></i></button>
</div>
<nav class="mnav" id="mnav" aria-label="Menu">${mnav}${langSwitch(c, 'mnav-lang')}</nav>
</header>`;
}

/* ---------- pied de page ---------- */

function footer(c, { bare = false } = {}) {
  const { t, L } = c;
  const cols = bare ? '' : `<div class="ft-cols">${t.foot_cols.map((col) =>
    `<div><b>${col.h}</b>${col.l.map(([h, l]) => `<a href="${L(h)}">${l}</a>`).join('')}</div>`).join('')}</div>`;
  const langs = t.foot_other_langs.map(([h, l]) => `<a href="${h.startsWith('../') ? c.home + h : L(h)}">${l}</a>`).join('');
  return `<footer class="ft"><div class="w-wide">
<div class="ft-top"><a class="ft-logo" href="${c.home}" aria-label="${esc(t.home_label)}">${logo()}</a>${badges(c, 'badges-ft')}</div>
${cols}
<div class="ft-bar"><span>© <span class="yr">2026</span> ${t.foot_legal}</span><a href="mailto:sales@celya.be">sales@celya.be</a>${bare ? '' : `<span class="ft-lang">${langs}</span>`}</div>
</div></footer>`;
}

/* ---------- barre d'appel mobile (sous 720 px) ---------- */

function mbar(c) {
  return `<div class="mbar" aria-label="${esc(c.t.mbar_label)}" role="region">${callBtn(c, 'btn-orange')}${demoBtn(c, 'btn-line')}</div>`;
}

/* ---------- page complète ---------- */

export function shell(c, { headHTML, main, bare = false, bodyClass = '' }) {
  /* scripts propres à la page (<!--@script-->), après celya.js */
  const own = (c.page.blocks.script || []).map((b) => b.html).join('\n');
  return `<!DOCTYPE html>
<html lang="${c.lang}">
${head(c, headHTML)}
<body${bodyClass ? ` class="${bodyClass}"` : ''}>
<a class="skip" href="#main">${c.t.skip}</a>
${header(c, { bare })}
<main id="main">
${main}
</main>
${footer(c, { bare })}
${bodyClass === 'p-demo' ? '' : mbar(c)}
<script src="${c.root}celya.js" defer></script>
${own ? own + '\n' : ''}</body>
</html>
`;
}
