/* Gabarit « légal » : mentions légales, confidentialité, cookies (FR, NL, EN).
 * Une colonne de lecture, le texte d'origine tel quel. Pas de bouton dans le
 * héros : ces pages ne vendent rien. */
import { one } from '../lib/core.mjs';
import { shell } from '../components/shell.mjs';
import { crumbs } from './article.mjs';

export default function legal(c) {
  const { page } = c;
  const main = `<section class="art-hero legal-page"><div class="w">
${crumbs(c)}
<div class="legal-in">
<h1>${one(page, 'h1')}</h1>
<div class="legal-body">
${one(page, 'body')}
</div>
</div>
</div></section>`;
  return shell(c, { headHTML: one(page, 'head'), main, bodyClass: 'p-legal' });
}
