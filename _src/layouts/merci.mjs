/* merci.html : noindex, hors sitemap — après l'envoi du formulaire démo. */
import { one } from '../lib/core.mjs';
import { shell, ctaPair } from '../components/shell.mjs';
import { cVoice } from '../components/icons.mjs';

export default function merci(c) {
  const { page } = c;
  const main = `<section class="sec"><div class="w merci">
<div class="merci-c">${cVoice()}</div>
<h1>${one(page, 'h1')}</h1>
<p class="lead">${one(page, 'lede')}</p>
${ctaPair(c, { hero: true })}
</div></section>`;
  return shell(c, { headHTML: one(page, 'head'), main, bodyClass: 'p-merci' });
}
