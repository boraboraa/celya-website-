/* L'enveloppe commune de toutes les pages : <head>, en-tête flottant, menu
 * mobile, pied de page, barre d'appel mobile. Chaque morceau existe une fois. */
import { logo, ico } from './icons.mjs';
import { esc } from '../lib/core.mjs';
import { badges } from './blocks.mjs';

/* Le Consent Mode v2 par défaut, recopié de l'ancien <head> à l'octet près :
 * tout est refusé tant que le visiteur n'a pas accepté. Ne pas toucher. */
export const CONSENT_DEFAULT = `<script>
/* Consent Mode v2 : tout est refusé tant que le visiteur n'a pas accepté */
window.dataLayer=window.dataLayer||[];
function gtag(){dataLayer.push(arguments)}
gtag('consent','default',{ad_storage:'denied',analytics_storage:'denied',ad_user_data:'denied',ad_personalization:'denied',wait_for_update:500});
</script>`;

/* L'application des clients (décision de Bora du 19/11/2026) : ses deux
 * adresses ne s'écrivent qu'ici. « Se connecter » et « Essai gratuit » y mènent
 * depuis l'en-tête, le menu mobile, le pied de page (connexion seule) et les
 * grilles de prix des pages avec menu ; jamais depuis les pages
 * d'atterrissage, qui restent à la seule démo. */
export const APP_LOGIN = 'https://app.celya.be/login';
export const APP_SIGNUP = 'https://app.celya.be/inscription';
/** L'application parle français et anglais : les pages NL et EN y ajoutent
 *  ?lang=nl / ?lang=en (sans effet si l'application l'ignore). */
export const appHref = (url, lang) => (lang === 'fr' ? url : `${url}?lang=${lang}`);
/** data-app / data-place : lus par celya.js (événements login_click et sign_up_start) */
export function loginLink(c, cls, place) {
  return `<a class="${cls}" href="${appHref(APP_LOGIN, c.lang)}" data-app="login" data-place="${place}">${c.t.login}</a>`;
}
export function trialBtn(c, cls, place, label = c.t.trial) {
  return `<a class="btn ${cls}" href="${appHref(APP_SIGNUP, c.lang)}" data-app="signup" data-place="${place}">${label}</a>`;
}

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
<link rel="icon" type="image/svg+xml" href="${root}celya-favicon.svg">
<link rel="icon" type="image/png" sizes="48x48" href="${root}favicon-48.png">
<link rel="icon" href="${root}favicon.ico" sizes="any">
<link rel="apple-touch-icon" href="${root}apple-touch-icon.png">
<link rel="manifest" href="${root}site.webmanifest">
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

/** Langue de l'en-tête (19/11/2026, décision de Bora) : un petit sélecteur
 *  « FR ▾ » au lieu de trois liens côte à côte ; il ouvre les autres langues
 *  au survol et au clavier, comme le menu des métiers. */
function langDrop(c) {
  const langs = c.page.meta.langs || {};
  const autres = ['fr', 'nl', 'en'].filter((l) => langs[l] && l !== c.lang);
  if (!autres.length) return '';
  return `<div class="drop hdr-lang"><span class="drop-t" tabindex="0" aria-label="${esc(c.t.lang_label)} : ${c.lang.toUpperCase()}">${c.lang.toUpperCase()}${ico.chev}</span><div class="drop-p lang-p">${autres.map((l) =>
    `<a href="${langs[l]}" hreflang="${l}" lang="${l}">${l.toUpperCase()}</a>`).join('')}</div></div>`;
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
    (t.metiers_all ? `<a href="${L(t.metiers_all[0])}">${t.metiers_all[1]}</a>` : '') +
    `<div class="mnav-app">${trialBtn(c, 'btn-orange', 'menu', t.trial_menu)}${demoBtn(c, 'btn-line')}${loginLink(c, 'mnav-login', 'menu')}</div>`;
  /* en-tête (19/11/2026, décision de Bora) : « Se connecter » en lien texte et un
   * seul bouton, « Demander une démo » en orange (la conversion principale).
   * « Essai gratuit » vit sous les grilles de prix et dans le menu mobile ;
   * « Appeler Janet » reste dans les héros, la barre mobile et les CTA. */
  return `<header class="hdr"><div class="hdr-in">
<a class="hdr-logo" href="${c.home}" aria-label="${esc(t.home_label)}">${logo()}</a>
<nav class="hdr-nav" aria-label="Navigation">${nav}</nav>
${langDrop(c)}
<div class="hdr-cta">${loginLink(c, 'hdr-login', 'header')}${demoBtn(c, 'btn-orange btn-sm hdr-demo')}</div>
<button class="burger" type="button" aria-expanded="false" aria-controls="mnav"><span class="burger-l">${t.menu}</span><i></i><i></i></button>
</div>
<nav class="mnav" id="mnav" aria-label="Menu">${mnav}${langSwitch(c, 'mnav-lang')}</nav>
</header>`;
}

/* ---------- pied de page ---------- */

function footer(c, { bare = false } = {}) {
  const { t, L } = c;
  /* « Se connecter » : à la position col.login de sa colonne (data/i18n.json) */
  const links = (col) => {
    const a = col.l.map(([h, l]) => `<a href="${L(h)}">${l}</a>`);
    if (col.login != null) a.splice(col.login, 0, loginLink(c, 'ft-login', 'footer'));
    return a.join('');
  };
  const cols = bare ? '' : `<div class="ft-cols">${t.foot_cols.map((col) =>
    `<div><b>${col.h}</b>${links(col)}</div>`).join('')}</div>`;
  const langs = t.foot_other_langs.map(([h, l]) => `<a href="${h.startsWith('../') ? c.home + h : L(h)}">${l}</a>`).join('');
  return `<footer class="ft"><div class="w-wide">
<div class="ft-top"><a class="ft-logo" href="${c.home}" aria-label="${esc(t.home_label)}">${logo()}</a>${badges(c, 'badges-ft')}</div>
${cols}
<div class="ft-bar"><span>© <span class="yr">2026</span> ${t.foot_legal}</span><a href="mailto:sales@celya.be">sales@celya.be</a>${bare ? '' : `<span class="ft-lang">${langs}</span>`}</div>
</div></footer>`;
}

/* ---------- barre d'appel mobile (sous 720 px) ---------- */

/** second : [href, libellé] ; pages d'atterrissage : « Être rappelé », vers le formulaire de la page */
function mbar(c, second) {
  const b2 = second ? `<a class="btn btn-line" href="${second[0]}">${second[1]}</a>` : demoBtn(c, 'btn-line');
  return `<div class="mbar" aria-label="${esc(c.t.mbar_label)}" role="region">${callBtn(c, 'btn-orange')}${b2}</div>`;
}

/* ---------- page complète ---------- */

export function shell(c, { headHTML, main, bare = false, bodyClass = '', mbarSecond = null }) {
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
${/\bp-demo\b/.test(bodyClass) ? '' : mbar(c, mbarSecond)}
<script src="${c.root}celya.js" defer></script>
${own ? own + '\n' : ''}</body>
</html>
`;
}
