/* Gabarit « billet » : les articles du blog (FR, NL, EN).
 * Même colonne de lecture que le gabarit « article » ; en plus, la date et la
 * durée de lecture (la date reste : un chiffre se publie avec sa date), l'image
 * d'ouverture et le sommaire, posé dans la colonne de droite. Texte inchangé. */
import { one, esc } from '../lib/core.mjs';
import { shell, ctaPair } from '../components/shell.mjs';
import { plugAside, ctaFinal, related } from '../components/blocks.mjs';
import { ico } from '../components/icons.mjs';
import { crumbs } from './article.mjs';

export default function billet(c) {
  const { page, t } = c;
  const toc = one(page, 'toc');
  const fig = one(page, 'figure');
  const rel = (page.blocks.related || [])[0];
  const cta = (page.blocks.cta || [])[0];
  const main = `<section class="art-hero"><div class="w">
${crumbs(c)}
<div class="art-grid">
<div class="art-main">
<h1>${one(page, 'h1')}</h1>
<p class="art-meta">${one(page, 'meta')}</p>
<div class="brief"><p class="label label-o">${t.read_brief}</p><p>${one(page, 'lede')}</p></div>
${ctaPair(c, { hero: true, sub: false })}
${fig ? `<figure class="art-fig">${fig}</figure>` : ''}
<div class="art-body art-post">
${one(page, 'body')}
<p class="backrow">${one(page, 'foot')}</p>
</div>
</div>
<aside class="art-aside">
<div class="aside-in">
${toc ? `<nav class="art-toc" aria-label="${esc(t.toc)}"><p class="label">${t.toc}</p>${toc}</nav>` : ''}
${plugAside(c)}
<div class="aside-test"><p class="h-s">${t.test_h}</p><p>${t.test_p}</p><a class="btn btn-orange btn-sm" href="tel:${c.offre.telephone.e164}" data-call>${ico.phone}<span>${c.offre.telephone.affiche}</span></a><a class="aside-demo" href="${c.L(t.demo_href)}" data-demo>${t.cta_demo} ${ico.arrow}</a></div>
</div>
</aside>
</div>
</div></section>
${rel ? related(c, rel) : ''}
${cta ? ctaFinal(c, cta) : ''}`;
  return shell(c, { headHTML: one(page, 'head'), main, bodyClass: 'p-article p-billet' });
}
