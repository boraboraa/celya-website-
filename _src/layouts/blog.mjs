/* Gabarit « blog » : l'index des articles (FR, NL, EN). Les cartes gardent
 * leur titre en H2, comme avant ; image, rubrique, date, chapeau, lien. */
import { one } from '../lib/core.mjs';
import { shell, ctaPair } from '../components/shell.mjs';
import { related } from '../components/blocks.mjs';
import { crumbs } from './article.mjs';

export default function blog(c) {
  const { page } = c;
  const posts = one(page, 'posts');
  const back = (/<p class="backrow">[\s\S]*$/.exec(posts) || [''])[0];
  const main = `<section class="hero"><div class="w">
${crumbs(c)}
<h1>${one(page, 'h1')}</h1>
<p class="lead">${one(page, 'lede')}</p>
${ctaPair(c, { hero: true, sub: false })}
</div></section>
<section class="sec bg-cream"><div class="w-wide"><div class="posts posts-blog">${posts.replace(/<p class="backrow">[\s\S]*$/, '')}</div>${back}</div></section>
${(page.blocks.related || []).map((b) => related(c, b)).join('\n')}`;
  return shell(c, { headHTML: one(page, 'head'), main, bodyClass: 'p-blog' });
}
