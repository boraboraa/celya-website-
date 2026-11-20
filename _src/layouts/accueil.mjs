/* Gabarit « accueil » (maquette 00-accueil). Les H2 existants gardent leur
 * ordre : Comment ça marche, Vos mains sont prises, Combien vous coûtent,
 * fiche claire, pas un agenda, En plein service, derniers articles, FAQ,
 * Écoutez-la. Les composants du lot s'intercalent avec leurs propres H2. */
import { one, all } from '../lib/core.mjs';
import { shell, ctaPair } from '../components/shell.mjs';
import { heroVideo, orders, confirm, prices, faq, splitH2, picture, capture, exTag, scene, sceneText, steps as stepsBlock } from '../components/blocks.mjs';
import { ico, cVoice } from '../components/icons.mjs';

const sec = (page, role) => all(page, 'section').find((s) => s.attrs.role === role);
const kick = (b) => (b.attrs.kick ? `<p class="label">${b.attrs.kick}</p>` : '');
const sid = (b) => (b.attrs.sid ? ` id="${b.attrs.sid}"` : '');
const dot = (k) => `<span class="dot dot-${k}" aria-hidden="true"></span>`;

export default function accueil(c) {
  const { page, t, data, root, lang } = c;
  const h = t.home;
  const G = data.metiers.garages[lang];

  const steps = sec(page, 'steps'), roles = sec(page, 'roles'),
    fiche = sec(page, 'fiche'), agendaS = sec(page, 'agenda'), met = sec(page, 'metiers'), arts = sec(page, 'articles');
  const S = (b) => splitH2(b.html);

  /* grille « Ce que Janet fait pour vous » */
  /* sous 720 px, repliée en <details> (le texte reste dans le HTML) ; ouverte au-dessus */
  const grid = `<section class="sec" id="pour-vous"><div class="w-wide">
<details class="fold-m" open><summary class="fold-s"><h2>${t.cards_h2}</h2><span class="card-plus" aria-hidden="true"></span></summary>
<p class="lead fold-lead">${h.cards_p}</p>
<ul class="grid8" role="list">${h.grid.map(([k, tt, p]) => `<li><h3>${tt}</h3><p>${p}</p></li>`).join('')}</ul>
</details>
</div></section>`;

  /* le même appel, deux fins */
  const ends = `<section class="sec-panel"><div class="panel bg-ink ends"><div class="w-wide">
<div class="ends-h"><h2>${h.ends_h2}</h2><p>${h.ends_p}</p></div>
<div class="ends-g">
<div class="end-a"><p class="label">${h.ends_a_k}</p><p class="end-t">${h.ends_a_t}</p><p class="end-q">${h.ends_a_q}</p><p class="end-f">${h.ends_a_f}</p></div>
<div class="end-b">${picture(c, 'flou-atelier', '', { sizes: '(max-width: 860px) 100vw, 800px' })}<div class="end-b-in"><p class="label">${h.ends_b_k}</p><p class="end-t">${h.ends_b_t}</p><span class="live-pill">${cVoice('cv-xs')}<span><i></i>${h.ends_live}</span></span></div></div>
</div>
</div></div></section>`;

  /* Comment ça marche : le composant des étapes, partagé avec les pages d'atterrissage */
  const stepsHTML = stepsBlock(c, steps, { wide: true });

  /* Vos mains sont prises (NL/EN : une citation tient lieu de titre, sans H2) */
  const rolesLead = (/<p class="roles-lead">[\s\S]*?<\/p>/.exec(S(roles).body) || [''])[0];
  const rolesBody = S(roles).body.replace(rolesLead, '');
  const rolesHTML = `<section class="sec bg-cream"><div class="w-wide split-roles">
<div class="hands">${picture(c, 'flou-salon', '', { sizes: '(max-width: 860px) 100vw, 420px' })}
<div class="wa-card hands-wa"><img src="${root}assets/brand/whatsapp.svg" width="36" height="36" alt=""><div class="wa-txt"><span class="wa-top"><b>${t.wa_from}</b><span>11:20</span></span><b class="wa-t">${dot('rdv')}${t.case_rdv}</b><span class="wa-s">Mme Lambert · samedi 14h</span></div></div>
<span class="live-pill hands-live">${cVoice('cv-xs')}<span><i></i>${h.ends_live}</span></span></div>
<div class="roles-t">${kick(roles)}${S(roles).h2}${rolesLead}<details class="fold-m roles-fold" open><summary class="fold-s"><span>${[...rolesBody.matchAll(/<p class="label">([^<]*)<\/p>/g)].map((m) => m[1]).join(' · ')}</span><span class="card-plus" aria-hidden="true"></span></summary><div class="roles">${rolesBody}</div></details></div>
</div></section>`;


  /* branchée sur vos outils */
  const feed = h.wa_feed.map(([k, l, a, b, time], i) => `<span class="feed${i === 2 ? ' pop' : ''}"><b>${dot(k)}${l}</b><span>${a}</span>${b ? `<span>${b}</span>` : ''}<time>${time}</time></span>`).join('');
  const tools = `<section class="sec"><div class="w-wide">
<div class="center-h"><p class="label">${h.tools_label}</p><h2>${h.tools_h2}</h2><p class="lead">${h.tools_p}</p></div>
<div class="tools">
<div class="tool"><p class="label"><img src="${root}assets/brand/whatsapp.svg" width="30" height="30" alt="">WhatsApp</p><h3>${h.tools_wa_t}</h3><p>${h.tools_wa_p}</p>
<div class="phone phone-s" aria-hidden="true">${exTag(c)}<div class="ph-scr"><div class="ph-head"><span class="ph-av">${cVoice('cv-xs', false)}</span><span><b>Celya</b><small>${t.confirm_pro}</small></span></div><div class="ph-body"><span class="ph-day">${t.today}</span>${feed}</div></div></div>
<p class="tool-n">${ico.seal('#0866FF')}<span><b>${t.badge_meta_t}</b>${h.tools_wa_n}</span></p></div>
<div class="tool tool-g"><p class="label"><img src="${root}assets/brand/gcal-64.webp" width="30" height="30" alt="">Google Agenda</p><h3>${h.tools_g_t}</h3><p>${h.tools_g_p}</p>
<div class="tool-cal" aria-hidden="true">${exTag(c)}<span class="mini-cal"><span class="mc-h"><img src="${root}assets/brand/gcal-64.webp" width="18" height="18" alt="">${h.week.jours[3]}</span>${h.week.heures.slice(0, 3).map((hr, i) => `<span class="mc-r"><i>${hr}</i>${i === 1 ? `<span class="mc-new">${h.week.blocs[3][2]}<small> · ${h.week.blocs[3][3]}</small></span>` : i === 0 ? `<span class="mc-busy">${h.week.blocs[0][2]}</span>` : '<span class="mc-free">–</span>'}</span>`).join('')}</span></div>
<p class="tool-n">${ico.seal('#1A73E8')}<span><b>${t.badge_google_t}</b>${h.tools_g_n}</span></p></div>
</div>
</div></section>`;

  /* la fiche d'appel */
  const ficheHTML = `<section class="sec bg-cream"${sid(fiche)}><div class="w-wide split-fiche">
<div class="fiche-t">${kick(fiche)}${S(fiche).h2}${S(fiche).body}</div>
<div class="fiche-m" aria-hidden="true"><p class="fm-bar"><span>app.celya.be</span><span class="fm-ex">${h.fiche_ex}</span></p>
<div class="fm-in"><div class="fm-list"><p class="label">${h.fiche_title}</p>${h.fiche_rows.map(([n, m, u], i) => `<span class="fm-row${i === 0 ? ' on' : ''}"><b>${n}</b><span>${m}</span><em class="${u === 'Urgente' || u === 'Dringend' || u === 'Urgent' ? 'u' : ''}">${u}</em></span>`).join('')}</div>
<dl class="fm-det">${h.fiche_detail.map(([k, v]) => `<div><dt>${k}</dt><dd>${v}</dd></div>`).join('')}</dl></div></div>
</div></section>`;

  /* pas un agenda : la semaine Google Agenda */
  const W = h.week;
  const cells = W.heures.map((hr, r) => `<span class="wk-h">${hr}</span>` + W.jours.map((_, d) => {
    const b = W.blocs.find(([dd, rr]) => dd === d && rr === r);
    return `<span class="wk-c">${b ? `<span class="wk-b${b[3] ? ' wk-j' : ''}">${b[2]}${b[3] ? `<small>${b[3]}</small>` : ''}</span>` : ''}</span>`;
  }).join('')).join('');
  const agendaHTML = `<section class="sec"${sid(agendaS)}><div class="w">
<div class="two">${S(agendaS).h2}<div class="lead">${S(agendaS).body}</div></div>
${capture(c, 'agenda') || `<div class="week" aria-hidden="true">${exTag(c)}<p class="wk-top"><b>${W.titre}</b><span>${W.sous}</span></p><div class="wk-g"><span></span>${W.jours.map((j, i) => `<span class="wk-d${i === 3 ? ' on' : ''}">${j}</span>`).join('')}${cells}</div></div>`}
</div></section>`;

  /* les métiers */
  const metHTML = `<section class="sec"${sid(met)}><div class="w-wide split-met">
<div class="met-h">${kick(met)}${S(met).h2}${t.metiers_all ? `<a class="btn btn-line btn-sm" href="${c.L(t.metiers_all[0])}">${h.metiers_all}</a>` : ''}</div>
<nav class="met-l" aria-label="${t.nav[1].label}">${S(met).body.replace(/<a href="([^"]*)"><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/a>/g, (m, hr, b, sp) => `<a href="${hr}"><b>${b}</b><span>${sp}</span>${ico.arrow}</a>`)}</nav>
</div></section>`;

  /* articles */
  const artHTML = `<section class="sec bg-cream"${sid(arts)}><div class="w-wide">${kick(arts)}${S(arts).h2}<div class="posts">${S(arts).body.replace(/<p class="backrow">[\s\S]*$/, '')}</div>${(/<p class="backrow">[\s\S]*$/.exec(S(arts).body) || [''])[0]}</div></section>`;

  /* CTA final avec le grand numéro */
  const ctaB = all(page, 'cta')[0];
  const cS = S(ctaB);
  const cta = `<section class="sec-panel"><div class="panel bg-ink cta-final">
${cVoice('cv-bg')}
<div class="cta-in"><span class="live-pill live-pill-d">${cVoice('cv-xs')}<span><i></i>${h.ends_live}</span></span>${cS.h2.replace('<h2', '<h2 class="h-xl"')}
<p class="cta-p">${h.big_label}</p>
<a class="big-tel" href="tel:${c.offre.telephone.e164}" data-call>${c.offre.telephone.affiche}</a>
<div class="cta-p">${cS.body}</div>
<div class="cta-pair"><div class="cta-btns"><a class="btn btn-orange" href="tel:${c.offre.telephone.e164}" data-call>${ico.phone}<span>${t.cta_call}</span></a><a class="btn btn-line-d" href="${c.L(t.demo_href)}" data-demo>${t.cta_demo}</a></div><p class="cta-sub">${t.cta_call_sub}</p></div>
</div></div></section>`;

  const main = `${heroVideo(c, `<h1>${one(page, 'h1')}</h1>
<p class="lead">${one(page, 'lede')}</p>
${ctaPair(c, { hero: true, sub: false })}`, h.hero_tag)}
${scene(c, sceneText(c, null))}
${grid}
${ends}
${stepsHTML}
${rolesHTML}
${tools}
${ficheHTML}
${agendaHTML}
${confirm(c, G.confirmation)}
${orders(c)}
${all(page, 'pull').map((p) => `<section class="sec sec-tight"><div class="w"><blockquote class="pull pull-c"><p>${p.html}</p></blockquote></div></section>`).join('')}
${metHTML}
${prices(c)}
${artHTML}
${faq(c, all(page, 'faq')[0])}
${cta}`;

  return shell(c, { headHTML: one(page, 'head'), main, bodyClass: 'p-home' });
}
