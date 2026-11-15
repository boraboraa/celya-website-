/* demo.html : un seul objectif, être rappelé pour une démo (ou appeler Janet). */
import { one } from '../lib/core.mjs';
import { shell, callBtn } from '../components/shell.mjs';
import { badges } from '../components/blocks.mjs';
import { demoForm } from '../components/form.mjs';
import { crumbs } from './article.mjs';

export default function demo(c) {
  const { page, t, offre } = c;
  const steps = one(page, 'steps');
  const main = `<section class="art-hero"><div class="w-wide">
${crumbs(c)}
<div class="demo-grid">
<div class="demo-side">
${one(page, 'kick') ? `<p class="label">${one(page, 'kick')}</p>` : ''}
<h1>${one(page, 'h1')}</h1>
<p class="lead">${one(page, 'lede')}</p>
<div class="demo-call" data-hero><span class="label">${t.cta_call}</span><a href="tel:${offre.telephone.e164}" data-call><b>${offre.telephone.affiche}</b></a><span class="cta-sub">${t.cta_call_sub}</span></div>
${steps ? `<ol class="demo-steps" role="list">${steps}</ol>` : ''}
${badges(c, 'badges-l')}
</div>
${demoForm(c)}
</div>
</div></section>`;
  return shell(c, { headHTML: one(page, 'head'), main, bodyClass: 'p-demo' });
}
