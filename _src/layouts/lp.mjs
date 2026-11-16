/* Pages d'atterrissage (lp/, nl/lp/) : un seul objectif, la démo — ou
 * l'appel. noindex, hors sitemap, sans menu (en-tête « bare » : logo et
 * bouton d'appel). Héros avec le numéro et le formulaire de démo, badges,
 * trois bénéfices, prix (data/offre.json), trois questions, appel final.
 * À 390 × 730, le bouton d'appel (en-tête) et le début du formulaire sont
 * dans le premier écran. */
import { one } from '../lib/core.mjs';
import { shell } from '../components/shell.mjs';
import { badges, prices, faq, ctaFinal } from '../components/blocks.mjs';
import { demoForm } from '../components/form.mjs';

export default function lp(c) {
  const { page, t, offre } = c;
  const main = `<section class="lp-hero"><div class="w lp-grid">
<div class="lp-t">
<h1>${one(page, 'h1')}</h1>
<p class="lead">${one(page, 'lede')}</p>
<p class="label">${t.cta_call}</p>
<a class="lp-tel" href="tel:${offre.telephone.e164}" data-call data-hero>${offre.telephone.affiche}</a>
</div>
${demoForm(c, { id: 'lp', kind: 'lp', title: one(page, 'formtitle') })}
</div></section>
<section class="hero-badges"><div class="w">${badges(c)}</div></section>
<section class="sec"><div class="w"><ul class="benefits" role="list">${one(page, 'benefits')}</ul></div></section>
${prices(c)}
${faq(c, page.blocks.faq[0])}
${ctaFinal(c, page.blocks.cta[0])}`;
  return shell(c, { headHTML: one(page, 'head'), main, bare: true, bodyClass: 'p-demo p-lp' });
}
