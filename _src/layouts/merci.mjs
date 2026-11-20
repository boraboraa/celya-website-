/* merci.html : noindex, hors sitemap, après l'envoi du formulaire démo.
 * Lot du 18/11/2026 : « C'est reçu. On vous rappelle sous 24 heures. En
 * attendant, appelez Janet : c'est la meilleure démo. », puis un seul bouton,
 * « Appeler Janet » avec le numéro (celui de data/offre.json, comme partout). */
import { one } from '../lib/core.mjs';
import { shell, callBtn } from '../components/shell.mjs';
import { cVoice } from '../components/icons.mjs';

export default function merci(c) {
  const { page } = c;
  const main = `<section class="sec"><div class="w merci">
<div class="merci-c">${cVoice()}</div>
<h1>${one(page, 'h1')}</h1>
<p class="lead">${one(page, 'lede')}</p>
<div class="cta-pair" data-hero><div class="cta-btns">${callBtn(c, 'btn-ink', true)}</div></div>
</div></section>`;
  return shell(c, { headHTML: one(page, 'head'), main, bodyClass: 'p-merci' });
}
