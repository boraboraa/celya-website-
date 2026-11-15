/* Gabarit « métier » (maquettes metier-*.html). Les sections existantes gardent
 * leur H2, leur ordre et leur texte : la première devient l'intro en deux
 * colonnes, celle du branchement (role:"plug") porte le composant 7, les autres
 * deviennent les cartes « Ce que Janet fait pour vous » (texte replié dans un
 * <details>, jamais supprimé). Les composants du lot s'insèrent entre elles
 * avec leurs propres H2, dans l'ordre de la maquette. */
import { one, all, strip } from '../lib/core.mjs';
import { shell, ctaPair } from '../components/shell.mjs';
import { badges, ribbon, video, cards, cases, plug, agenda, orders, confirm, prices, faq, ctaFinal, related, intro2 } from '../components/blocks.mjs';

const norm = (h) => strip(h).replace(/\s+/g, ' ').trim().toLowerCase();

export default function metier(c) {
  const { page, data, lang } = c;
  const id = page.meta.metier;
  const M = data.metiers[id];
  if (!M) throw new Error(`${page.file} : métier inconnu « ${id} » (data/metiers.json)`);
  const T = M[lang] || (lang === 'fr' ? null : null);
  if (!T) throw new Error(`${page.file} : data/metiers.json n'a pas de textes « ${lang} » pour ${id}`);

  const secs = all(page, 'section');
  const intro = secs.filter((s) => s.attrs.role === 'intro');
  const plugSec = secs.find((s) => s.attrs.role === 'plug') || null;
  const cardSecs = secs.filter((s) => !s.attrs.role);

  /* visuel de chaque carte : par titre, sinon par rang */
  const visuals = cardSecs.map((s, i) => {
    const h = norm(/<h2[^>]*>([\s\S]*?)<\/h2>/.exec(s.html)[1]);
    return T.cartes.find((v) => norm(v.h) === h) || T.cartes[i] || { v: 'photo' };
  });

  const pulls = all(page, 'pull').map((p) => `<section class="sec sec-tight"><div class="w"><blockquote class="pull pull-c"><p>${p.html}</p></blockquote></div></section>`).join('');
  const faqB = all(page, 'faq')[0];
  const relB = all(page, 'related')[0];
  const ctaB = all(page, 'cta')[0];
  const proof = one(page, 'proof');

  const main = `<section class="hero"><div class="w">
<p class="label">${one(page, 'kick')}</p>
<h1>${one(page, 'h1')}</h1>
<p class="lead">${one(page, 'lede')}</p>
${ctaPair(c, { hero: true })}
${badges(c)}
${proof ? `<p class="hero-proof">${proof}</p>` : ''}
</div></section>
${ribbon(c, T.ruban)}
<div class="w vid-wrap">${video(c, { photo: M.photo, alt: '', v: M.video, title: c.t.video_title })}</div>
${intro.map((s) => intro2(c, s)).join('\n')}
${cards(c, cardSecs, visuals, M.photo)}
${pulls}
${cases(c, T.cases)}
${plug(c, plugSec)}
${agenda(c, T.agenda_celya)}
${orders(c)}
${confirm(c, T.confirmation)}
${prices(c)}
${faqB ? faq(c, faqB) : ''}
${relB ? related(c, relB) : ''}
${ctaB ? ctaFinal(c, ctaB) : ''}`;

  return shell(c, { headHTML: one(page, 'head'), main, bodyClass: 'p-metier' });
}
