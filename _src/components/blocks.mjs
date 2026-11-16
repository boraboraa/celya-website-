/* Les composants du lot « refonte premium » : chacun écrit une fois, appelé
 * par les gabarits. Les téléphones restent aux couleurs Celya : on ne
 * reproduit l'interface ni de WhatsApp, ni de Google. */
import { ico, cVoice } from './icons.mjs';
import fs from 'node:fs';
import path from 'node:path';
import { esc, strip, eur, num, ROOT } from '../lib/core.mjs';

const H = (lvl, html, attrs = '') => `<h${lvl}${attrs}>${html}</h${lvl}>`;

/* ---------- 3. badges de certification ---------- */

export function badges(c, cls = '') {
  const { t, root } = c;
  return `<ul class="badges ${cls}" role="list">
<li class="badge"><img src="${root}assets/brand/whatsapp.svg" width="44" height="44" alt="WhatsApp"><span class="badge-t"><b>${t.badge_meta_t}${ico.seal('#0866FF')}<span class="sr"> (${t.badge_verified})</span></b><span>${t.badge_meta_s}</span></span></li>
<li class="badge"><img src="${root}assets/brand/gcal-128.webp" width="44" height="44" alt="Google Agenda"><span class="badge-t"><b>${t.badge_google_t}${ico.seal('#1A73E8')}<span class="sr"> (${t.badge_verified})</span></b><span>${t.badge_google_s}</span></span></li>
</ul>`;
}

/* ---------- puces et petites cartes réutilisées ---------- */

const dot = (k) => `<span class="dot dot-${k}" aria-hidden="true"></span>`;
const chipCase = (k, label) => `<span class="chip">${dot(k)}${label}</span>`;

function waCard(c, wa, cls = '') {
  const k = /^(Urgent|Dringend|Panne|Fuite|Incident)/i.test(wa.titre) ? 'urgent' : /rappeler|Terugbellen|Call back/i.test(wa.titre) ? 'rappel' : 'rdv';
  return `<div class="wa-card ${cls}"><img src="${c.root}assets/brand/whatsapp.svg" width="36" height="36" alt=""><div class="wa-txt"><span class="wa-top"><b>${c.t.wa_from}</b><span>${wa.heure}</span></span><b class="wa-t">${dot(k)}${wa.titre}</b><span class="wa-s">${wa.sous}</span></div></div>`;
}

/* ---------- 2. héros ruban ---------- */

export function ribbon(c, r) {
  const { t, root } = c;
  const caller = r.appelant.join(' · ');
  const janet = r.janet[0]; /* le couloir de droite est court : une réplique, entière */
  const chip = r.chip.cal
    ? `<span class="rib-chip"><img src="${root}assets/brand/gcal-64.webp" width="22" height="22" alt=""><span><b>${r.chip.b}</b> · ${r.chip.s}</span></span>`
    : `<span class="rib-chip">${ico.phone}<span><b>${r.chip.b}</b> · ${r.chip.s}</span></span>`;
  const sum = `${t.incoming} · ${r.heure} — « ${r.appelant[0]} » — ${t.janet_answers} : « ${r.janet[0]} » — ${strip(r.chip.b)} · ${strip(r.chip.s)}. ${r.wa.titre} (${r.wa.sous}).`;
  return `<figure class="rib">
<figcaption class="sr">${esc(sum)}</figcaption>
<div class="rib-stage" aria-hidden="true">
<svg class="rib-svg" viewBox="0 0 1440 470" preserveAspectRatio="xMidYMid meet" focusable="false">
<path id="rib-a" d="M150 252C280 252 330 175 460 175S610 250 720 250" class="rib-lane"/>
<path id="rib-b" d="M720 250C820 250 880 345 1010 345L1330 345" class="rib-lane rib-lane-b"/>
<text class="rib-txt"><textPath href="#rib-a" startOffset="4%">${esc(caller)}</textPath></text>
<text class="rib-txt rib-txt-b"><textPath href="#rib-b" startOffset="21%">${esc(janet)}</textPath></text>
</svg>
<div class="rib-call"><span class="rib-ring"><i></i><i></i>${ico.phone}</span><span class="rib-lab">${t.incoming} · ${r.heure}</span></div>
<p class="rib-say rib-say-in">« ${esc(r.appelant[0])} »</p>
<div class="rib-c">${cVoice()}<span class="rib-live"><i></i>${t.janet_answers} · 00:42</span></div>
<p class="rib-say rib-say-out">« ${esc(r.janet[0])} »</p>
<div class="rib-out">${chip}${waCard(c, r.wa, 'rib-wa')}</div>
</div>
</figure>`;
}

/* ---------- 4. emplacement vidéo 16:9 ---------- */

export function picture(c, name, alt, { sizes = '(max-width: 1100px) 100vw, 1000px', lazy = true, cls = '' } = {}) {
  const r = c.root + 'assets/metiers/' + name;
  return `<picture class="${cls}"><source type="image/avif" srcset="${r}-800.avif 800w, ${r}-1600.avif 1600w" sizes="${sizes}"><source type="image/webp" srcset="${r}-800.webp 800w, ${r}-1600.webp 1600w" sizes="${sizes}"><img src="${r}-800.webp" width="1600" height="900" alt="${esc(alt)}"${lazy ? ' loading="lazy" decoding="async"' : ''}></picture>`;
}

/** v = { mp4, webm?, poster?, tracks? } ou null. Sans source : la photo seule,
 *  sans bouton lecture et sans « à venir ». */
export function video(c, { photo, alt, v, title }) {
  if (!v || !v.mp4) {
    return `<div class="vid vid-photo">${picture(c, photo, alt)}</div>`;
  }
  const poster = v.poster || `${c.root}assets/metiers/${photo}-1600.webp`;
  const src = (u) => (/^(https?:)?\//.test(u) ? u : c.root + u);
  const tracks = (v.tracks || []).map((tr) => `<track kind="captions" srclang="${tr.lang}" label="${esc(tr.label)}" src="${src(tr.src)}"${tr.lang === c.lang ? ' default' : ''}>`).join('');
  return `<div class="vid">
<video preload="none" playsinline poster="${src(poster)}" width="1600" height="900">${v.webm ? `<source src="${src(v.webm)}" type="video/webm">` : ''}<source src="${src(v.mp4)}" type="video/mp4">${tracks}</video>
<button class="vid-play" type="button" aria-label="${esc(c.t.video_play)} — ${esc(strip(title || c.t.video_title))}">${ico.play}</button>
<p class="vid-cap" aria-hidden="true"><b>${title || c.t.video_title}</b>${v.duree ? `<span>${v.duree}</span>` : ''}</p>
</div>`;
}

/* ---------- 5. cartes « Ce que Janet fait pour vous » ---------- */

const PHOTO_POS = ['50% 40%', '20% 60%', '80% 50%', '35% 75%', '65% 25%'];

function visual(c, v, i, photo) {
  const { t, root } = c;
  switch (v.v) {
    case 'tri':
      return `<div class="vstack">${chipCase('rdv', t.case_rdv)}${chipCase('rappel', t.case_rappel)}${chipCase('urgent', t.case_urgent)}</div>`;
    case 'agenda':
      return `<div class="mini-cal"><span class="mc-h"><img src="${root}assets/brand/gcal-64.webp" width="18" height="18" alt="">${t.today}</span><span class="mc-r"><i>9h</i><span class="mc-busy">${c.lang === 'fr' ? 'Pris' : c.lang === 'nl' ? 'Bezet' : 'Busy'}</span></span><span class="mc-r"><i>10h</i><span class="mc-new">${v.rdv}<small> · ${c.lang === 'fr' ? 'par Janet' : c.lang === 'nl' ? 'door Janet' : 'by Janet'}</small></span></span><span class="mc-r"><i>11h</i><span class="mc-free">${c.lang === 'fr' ? 'Libre' : c.lang === 'nl' ? 'Vrij' : 'Free'}</span></span></div>`;
    case 'transfert':
      return `<div class="mini-tr"><span class="mt-h">${ico.phone}<span><b>${c.lang === 'fr' ? 'Transféré' : c.lang === 'nl' ? 'Doorgeschakeld' : 'Transferred'}</b> · ${c.lang === 'fr' ? 'votre mobile sonne' : c.lang === 'nl' ? 'uw gsm rinkelt' : 'your mobile rings'}</span></span>${waCard(c, { heure: '', titre: v.titre, sous: v.sous }, 'wa-flat')}</div>`;
    case 'qr':
      return `<div class="mini-qr"><span class="q">${v.q}</span><span class="r">${v.r}</span></div>`;
    case 'fiche':
      return `<dl class="mini-fiche"><dt class="mf-h">${c.lang === 'fr' ? "Fiche d'appel" : c.lang === 'nl' ? 'Gespreksfiche' : 'Call record'}</dt><div><dt>${c.lang === 'fr' ? 'Appelant' : c.lang === 'nl' ? 'Beller' : 'Caller'}</dt><dd>${v.appelant}</dd></div><div><dt>${c.lang === 'fr' ? 'Motif' : c.lang === 'nl' ? 'Reden' : 'Reason'}</dt><dd>${v.motif}</dd></div><div><dt>${c.lang === 'fr' ? 'Adresse' : c.lang === 'nl' ? 'Adres' : 'Address'}</dt><dd>${v.adresse}</dd></div></dl>`;
    case 'simultanes':
      return `<div class="vstack">${['00:12', '00:21', '00:30'].map((d) => `<span class="pill-call">${cVoice('cv-xs', false)}<span>${c.lang === 'fr' ? 'En appel' : c.lang === 'nl' ? 'In gesprek' : 'On a call'} · ${d}</span></span>`).join('')}</div>`;
    default:
      return `<div class="card-photo" style="--pos:${PHOTO_POS[i % PHOTO_POS.length]}">${picture(c, photo, '', { sizes: '(max-width: 720px) 100vw, 340px' })}</div>`;
  }
}

/** sections : blocs « section » de la page (H2 existants), visuals : data métier.
 *  heading : le titre du composant n'apparaît qu'au premier groupe de cartes.
 *  Une carte dont le visuel serait une photo reste sans image : la photo du
 *  métier sert déjà au bandeau, et une image ne paraît jamais deux fois. */
export function cards(c, sections, visuals, photo, { heading = true } = {}) {
  const items = sections.map((s, i) => {
    const html = s.html.trim();
    const m = /^<h2([^>]*)>([\s\S]*?)<\/h2>\s*/.exec(html);
    const body = html.slice(m[0].length);
    const v = visuals[i] || { v: 'none' };
    const vis = v.v === 'photo' || v.v === 'none' ? '' : `<span class="card-v" aria-hidden="true">${visual(c, v, i, photo)}</span>`;
    return `<details class="card${vis ? '' : ' card-novis'}"><summary>${vis}<span class="card-h">${H(2, m[2], m[1])}<span class="card-plus" aria-hidden="true"></span></span></summary><div class="card-b">${body}</div></details>`;
  }).join('\n');
  return `<section class="sec bg-cream"${heading ? ' id="pour-vous"' : ''}><div class="w">
${heading ? `<div class="head-row">${H(2, c.t.cards_h2)}<p class="hint">${c.t.cards_hint}</p></div>` : ''}
<div class="cards">${items}</div>
</div></section>`;
}

/* ---------- 6. chaque appel rangé dans la bonne case ---------- */

export function cases(c, k) {
  const { t } = c;
  const col = (key, label, title, p) => `<div class="case"><span class="case-l">${dot(key)}${label}</span><h3>${title}</h3><p>${p}</p></div>`;
  return `<section class="sec"><div class="w">
<div class="two">${H(2, t.cases_h2)}<p class="lead">${t.cases_p}</p></div>
<div class="cases">${col('rdv', t.case_rdv, k.rdv_t, k.rdv_p)}${col('rappel', t.case_rappel, k.rappel_t, k.rappel_p)}${col('urgent', t.case_urgent, k.urgent_t, k.urgent_p)}</div>
</div></section>`;
}

/* ---------- 7. branchement en trois colonnes ---------- */

function plugIcon(c, k) {
  if (k === 'wa') return `<img src="${c.root}assets/brand/whatsapp.svg" width="30" height="30" alt="">`;
  if (k === 'gcal') return `<img src="${c.root}assets/brand/gcal-64.webp" width="30" height="30" alt="">`;
  return `<span class="label label-o">${k}</span>`;
}

/** block : section existante (H2 + texte) qui porte le branchement, ou null */
export function plug(c, block) {
  const { t } = c;
  const cols = t.plug_cols.map((p) => `<div class="plug-col"><span class="plug-ic">${plugIcon(c, p.k)}</span><h3>${p.t}</h3><p>${p.p}</p></div>`).join('');
  const head = block ? splitH2(block.html) : null;
  return `<section class="sec-panel"><div class="panel bg-beige"><div class="w">
${head ? `<div class="two plug-head">${head.h2}<div class="prose">${head.body}</div></div>` : ''}
<div class="plug">${cols}</div>
<p class="plug-foot">${t.plug_foot.map((x) => `<span>${x}</span>`).join('<span aria-hidden="true">·</span>')}</p>
</div></div></section>`;
}

/** Encadré latéral « Comment ça se branche » (gabarit article) */
export function plugAside(c) {
  const { t } = c;
  return `<div class="aside-plug"><p class="label">${t.plug_aside_h}</p>${t.plug_aside.map((p) =>
    `<div class="ap-row"><span class="plug-ic">${plugIcon(c, p.k)}</span><div><b>${p.t}</b><p>${p.p}</p></div></div>`).join('')}</div>`;
}

/* ---------- 8. votre agenda, ou le nôtre ---------- */

export function agenda(c, celyaText) {
  const { t, root, offre, lang } = c;
  const quota = offre.formules.map((f) => `<span><b>${f.nom[lang]}</b> · ${f.agendas_txt[lang]}</span>`).join('<span aria-hidden="true">·</span>');
  return `<section class="sec bg-cream"><div class="w">
<div class="two">${H(2, t.agenda_h2)}<p class="lead">${t.agenda_p}</p></div>
<div class="agenda">
<div class="ag-card"><span class="label">${`<img src="${root}assets/brand/gcal-64.webp" width="30" height="30" alt="">`}${t.agenda_g_label}</span><h3>${t.agenda_g_t}</h3><p>${t.agenda_g_p}</p></div>
<div class="ag-card ag-celya"><span class="label">${cVoice('cv-xs', false)}${t.agenda_c_label}</span><h3>${t.agenda_c_t}</h3><p>${celyaText || t.agenda_c_default}</p></div>
</div>
<p class="quota">${quota}</p>
</div></section>`;
}

/* ---------- téléphone (cadre Celya) et vraies captures ----------
 * On ne dessine pas l'interface de WhatsApp ni celle de Google : le cadre de
 * téléphone est sobre, aux couleurs Celya, et attend une vraie capture. Tant
 * que assets/captures/<nom>.webp n'existe pas, l'illustration reste, marquée
 * « Exemple ». Déposer le fichier et relancer le générateur suffit. */
const SHOTS = { confirmation: 'whatsapp-confirmation', consignes: 'whatsapp-consignes', agenda: 'google-agenda' };
export function capture(c, key, cls = '') {
  const rel = `assets/captures/${SHOTS[key]}.webp`;
  if (!fs.existsSync(path.join(ROOT, rel))) return null;
  return `<figure class="phone phone-shot ${cls}"><img src="${c.root}${rel}" alt="${esc(c.t.captures[key])}" loading="lazy" decoding="async"></figure>`;
}
export const exTag = (c) => `<span class="ex-tag">${c.t.example}</span>`;

function phone(head, body, cls = '', tag = '') {
  return `<div class="phone ${cls}" aria-hidden="true">${tag}<div class="ph-scr"><div class="ph-head">${head}</div><div class="ph-body">${body}</div></div></div>`;
}
const bubble = (who, text, time, cls = '') => `<span class="bub bub-${who} ${cls}"><span>${text}</span><time>${time}</time></span>`;

/* ---------- 9. consignes par WhatsApp ---------- */

export function orders(c) {
  const { t } = c;
  const chat = t.orders_chat.map(([w, x, h], i) => bubble(w, x, h, i >= 4 ? 'pop' : '')).join('');
  const ph = capture(c, 'consignes') || phone(`<span class="ph-av">${cVoice('cv-xs', false)}</span><span><b>${t.orders_head}</b><small>${t.orders_sub}</small></span>`,
    `<span class="ph-day">${t.today}</span>${chat}`, '', exTag(c));
  return `<section class="sec"><div class="w split">
${ph}
<div class="split-t">
<p class="label label-ic"><img src="${c.root}assets/brand/whatsapp.svg" width="22" height="22" alt="">${t.orders_label}</p>
${H(2, t.orders_h2)}
<p class="lead">${t.orders_p}</p>
<ul class="orders" role="list">${t.orders_ex.map((x) => `<li><span>${x}</span></li>`).join('')}</ul>
<p class="sr">${t.orders_chat.map(([w, x]) => x).join(' ')}</p>
</div>
</div></section>`;
}

/* ---------- 10. vos clients confirment en un clic ---------- */

export function confirm(c, k) {
  const { t, root } = c;
  const rows = t.confirm_rows.map(([b, p]) => `<div class="cf-row"><span class="cf-b">${b}</span><p>${p}</p></div>`).join('');
  const body = `<span class="ph-day">${t.today}</span>${bubble('her', `${k.message}<br><b>${k.quand}</b><br>${k.quoi}<br>${k.ou}`, '14:06')}<span class="ph-btns">${t.confirm_btns.map((b) => `<span>${b}</span>`).join('')}</span>${bubble('me', t.confirm_btns[0], '14:07')}${bubble('her', k.reponse, '14:07', 'pop')}`;
  const shot = capture(c, 'confirmation');
  const ph = shot || phone(`<span class="ph-av ph-av-ink">${k.initiales}</span><span><b>${k.entreprise}</b><small>${t.confirm_pro}</small></span>`, body, '', exTag(c));
  return `<section class="sec bg-cream"><div class="w split split-r">
<div class="split-t">
<p class="label label-ic"><img src="${root}assets/brand/whatsapp.svg" width="22" height="22" alt="">${t.confirm_label}</p>
${H(2, t.confirm_h2)}
<p class="lead">${t.confirm_p}</p>
<div class="cf-rows">${rows}</div>
<p class="note">${t.confirm_note}</p>
</div>
<div class="cf-phone">${ph}${shot ? '' : `<span class="cf-chip" aria-hidden="true"><img src="${root}assets/brand/gcal-64.webp" width="24" height="24" alt=""><span><b>${k.chip}</b><small>${dot('ok')}${t.confirm_chip}</small></span></span>`}</div>
</div></section>`;
}

/* ---------- 11. prix ---------- */

export function priceNote(c) {
  const { offre, lang } = c;
  const r = offre.regles;
  return [r.ht, r.decompte, r.mise_en_service, r.au_dela, r.meta].map((x) => x[lang]).join(' · ') + '.';
}

export function priceCards(c) {
  const { t, offre, lang } = c;
  return `<div class="prices">${offre.formules.map((f) => `<article class="pc${f.recommandee ? ' pc-ink' : ''}">
<p class="pc-top"><span class="label">${f.nom[lang]}</span>${f.recommandee ? `<span class="pc-reco">${t.price_reco}</span>` : ''}</p>
<p class="pc-price"><b>${eur(f.prix_ht, lang)}</b><span>${t.price_per}</span></p>
<p class="pc-min">${num(f.minutes, lang)} ${t.price_minutes}</p>
<p class="pc-for">${f.pour[lang]}</p>
<ul role="list">${f.inclus[lang].map((x) => `<li>${ico.check}<span>${x}</span></li>`).join('')}</ul>
</article>`).join('')}</div>`;
}

/** h2 : true = titre du composant (« Dès … HT par mois », price_h2) ; ou HTML d'un H2 existant */
export function prices(c, { h2 = true, intro = '', id = '' } = {}) {
  const { t } = c;
  const title = h2 === true ? H(2, t.price_h2) : h2;
  return `<section class="sec bg-cream"${id ? ` id="${id}"` : ''}><div class="w">
<div class="price-head">${title}<div class="price-go"><a class="btn btn-ink" href="${c.L(c.t.demo_href)}" data-demo>${t.price_start}</a></div></div>
${intro ? `<div class="prose price-intro">${intro}</div>` : ''}
${priceCards(c)}
<p class="note">${priceNote(c)}</p>
</div></section>`;
}

/* ---------- 12. FAQ, CTA final, liens ---------- */

export function splitH2(html) {
  const m = /^\s*(<h2[^>]*>[\s\S]*?<\/h2>)\s*/.exec(html);
  return m ? { h2: m[1], body: html.slice(m[0].length) } : { h2: '', body: html };
}

export function faq(c, block, { id = 'faq' } = {}) {
  const { h2, body } = splitH2(block.html);
  const sid = block.attrs.id || id;
  return `<section class="sec bg-page" id="${sid}"><div class="w faq">
<div class="faq-h">${block.attrs.kick ? `<p class="label">${block.attrs.kick}</p>` : ''}${h2}</div>
<div class="faq-l">${body}</div>
</div></section>`;
}

export function ctaFinal(c, block) {
  const { h2, body } = splitH2(block.html);
  return `<section class="sec-panel"><div class="panel bg-ink cta-final">
${cVoice('cv-bg')}
<div class="cta-in">${h2.replace('<h2', '<h2 class="h-xl"')}
${body ? `<div class="cta-p">${body}</div>` : `<p class="cta-p">${c.t.cta_final_lead}</p>`}
${ctaPairDark(c)}
</div>
</div></section>`;
}

/* ctaPair vit dans shell.mjs ; recopie locale pour éviter un import circulaire */
function ctaPairDark(c) {
  const { t, offre } = c;
  return `<div class="cta-pair"><div class="cta-btns"><a class="btn btn-orange" href="tel:${offre.telephone.e164}" data-call>${ico.phone}<span>${t.cta_call} · <span class="nw">${offre.telephone.affiche}</span></span></a><a class="btn btn-line-d" href="${c.L(t.demo_href)}" data-demo>${t.cta_demo}</a></div><p class="cta-sub">${t.cta_call_sub}</p></div>`;
}

export function related(c, block) {
  const { h2, body } = splitH2(block.html);
  const links = body.replace(/<a href="([^"]*)"><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/a>/g,
    (m, h, b, s) => `<a class="rel" href="${h}"><b>${b}</b><span>${s}</span>${ico.arrow}</a>`);
  return `<section class="sec"><div class="w">
<div class="rel-h">${block.attrs.kick ? `<p class="label">${block.attrs.kick}</p>` : ''}${h2}</div>
<div class="rels">${links}</div>
</div></section>`;
}

/** « Le téléphone sonne aussi ailleurs » : les autres métiers */
export function others(c, block, selfHref) {
  const { t, L } = c;
  const { h2 } = splitH2(block.html);
  const list = t.metiers_nav.filter(([h]) => h !== selfHref).map(([h, l]) => `<a href="${L(h)}">${l}${ico.arrow}</a>`).join('') +
    (t.metiers_all ? `<a class="muted" href="${L(t.metiers_all[0])}">${t.metiers_all[1]}${ico.arrow}</a>` : '');
  return `<section class="sec sec-tight"><div class="w others">${h2}<nav class="others-l" aria-label="${esc(strip(h2))}">${list}</nav></div></section>`;
}

/** Une section en deux colonnes : H2 à gauche, texte à droite */
export function intro2(c, block, cls = '') {
  const { h2, body } = splitH2(block.html);
  return `<section class="sec ${cls}"${block.attrs.sid ? ` id="${block.attrs.sid}"` : ''}><div class="w two two-top">${h2}<div class="prose">${body}</div></div></section>`;
}

/* ---------- héros vidéo des accueils (retour du 15/11/2026) ---------- */

/** Le fichier le plus fin disponible : -1080 s'il existe, sinon -720.
 *  Déposer hero-ordinateur-1080.mp4 dans assets/hero/ et relancer le
 *  générateur suffit : aucun code à toucher. */
function heroFile(kind) {
  for (const q of ['1080', '720']) {
    const rel = `assets/hero/hero-${kind}-${q}.mp4`;
    if (fs.existsSync(path.join(ROOT, rel))) return rel;
  }
  throw new Error(`assets/hero/hero-${kind}-720.mp4 introuvable`);
}

/** inner : H1 + phrase + boutons ; tag : libellé de l'étiquette */
export function heroVideo(c, inner, tag) {
  const { root } = c;
  return `<section class="hv" data-hv>
<div class="hv-media" aria-hidden="true">
<video muted loop playsinline autoplay preload="metadata" aria-hidden="true" tabindex="-1" disablepictureinpicture data-src-d="${root}${heroFile('ordinateur')}" data-src-m="${root}${heroFile('mobile')}" data-poster-d="${root}assets/hero/hero-ordinateur-poster.webp" data-poster-m="${root}assets/hero/hero-mobile-poster.webp"></video>
</div>
<div class="hv-in"><div class="hv-txt">${inner}</div></div>
<p class="hv-tag"><span class="hv-cbox">${cVoice('hv-c')}</span><span class="hv-lab">${tag}</span></p>
</section>
<section class="hv-next"><div class="w"><span class="hv-slot" aria-hidden="true"></span>${badges(c)}</div></section>`;
}
