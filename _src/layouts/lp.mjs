/* Pages d'atterrissage (lp/, nl/lp/) : un seul objectif, la démo — ou
 * l'appel. noindex, hors sitemap, sans menu (en-tête « bare » : logo et
 * bouton d'appel).
 *
 * Lot conversion Google Ads du 16/11/2026 (décision de Bora, exception datée
 * de CLAUDE.md) : le héros porte la vidéo de fond de l'accueil, et le
 * formulaire de démo y est posé en transparence — sur ces quatre pages
 * seulement. Puis, dans cet ordre : badges, la scène « Un appel, de bout en
 * bout », Comment ça marche (quatre étapes), les cases RDV / À rappeler /
 * Urgent, « Appelez-la, comme un client », les prix (bouton vers le
 * formulaire de la page), la FAQ (cinq questions), l'appel final. */
import { one, all } from '../lib/core.mjs';
import { shell } from '../components/shell.mjs';
import { badges, prices, faq, ctaFinal, heroMedia, scene, sceneText, steps, cases, tryCall } from '../components/blocks.mjs';
import { demoForm } from '../components/form.mjs';

export default function lp(c) {
  const { page, t, offre } = c;
  const metier = page.meta.metier;
  const M = metier && c.data.metiers[metier] && c.data.metiers[metier][c.lang];
  const form = '#lp';
  /* le héros : le texte et le formulaire passent sur la vidéo, voile crème léger.
   * « Être rappelé » n'existe que sous 860 px, quand le formulaire est dessous. */
  const hero = `<section class="hv lpv" data-hv="lp">
${heroMedia(c)}
<div class="w lpv-grid">
<div class="lpv-t">
<h1>${one(page, 'h1')}</h1>
<p class="lead">${one(page, 'lede')}</p>
<div class="cta-btns" data-hero><a class="btn btn-orange" href="tel:${offre.telephone.e164}" data-call><span>${t.cta_call} · <span class="nw">${offre.telephone.affiche}</span></span></a><a class="btn btn-line lpv-m" href="${form}">${t.form.submit}</a></div>
</div>
${demoForm(c, { id: 'lp', kind: 'lp', title: one(page, 'formtitle') })}
</div></section>`;

  const main = `${hero}
<section class="hero-badges"><div class="w">${badges(c)}</div></section>
${scene(c, sceneText(c, metier))}
${steps(c, all(page, 'steps')[0])}
${cases(c, (M && M.cases) || t.cases_generique)}
${tryCall(c, one(page, 'test'), form)}
${prices(c, { demoHref: form })}
${faq(c, page.blocks.faq[0])}
${ctaFinal(c, page.blocks.cta[0])}`;
  return shell(c, { headHTML: one(page, 'head'), main, bare: true, bodyClass: 'p-lp', mbarSecond: [form, t.mbar_callback] });
}
