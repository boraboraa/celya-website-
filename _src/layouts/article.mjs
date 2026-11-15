/* Gabarit « article » : questions, comparaisons, guides (~250 pages).
 * Colonne de lecture, encadré « En bref » (la phrase d'intro existante),
 * encadré « Comment ça se branche », appel à Janet. Contenu inchangé. */
import { one, all, esc } from '../lib/core.mjs';
import { shell, ctaPair } from '../components/shell.mjs';
import { badges, plugAside, faq, ctaFinal, related, splitH2 } from '../components/blocks.mjs';
import { ico } from '../components/icons.mjs';

/** Fil d'Ariane visible, lu dans le BreadcrumbList du @graph : jamais inventé. */
export function crumbs(c) {
  const ld = /<script type="application\/ld\+json">([\s\S]*?)<\/script>/.exec(one(c.page, 'head'));
  if (!ld) return '';
  let graph;
  try { graph = JSON.parse(ld[1])['@graph'] || []; } catch { return ''; }
  const bl = graph.find((n) => n['@type'] === 'BreadcrumbList');
  if (!bl) return '';
  const items = bl.itemListElement.slice().sort((a, b) => a.position - b.position);
  const rel = (url) => {
    const u = String(url || '').replace(/^https:\/\/celya\.be\//, '');
    return c.root + u || './';
  };
  return `<nav class="crumbs" aria-label="Fil d'Ariane"><ol>${items.map((it, i) => {
    const name = esc(it.name);
    return i === items.length - 1 ? `<li aria-current="page">${name}</li>` : `<li><a href="${rel(it.item)}">${name}</a></li>`;
  }).join('')}</ol></nav>`;
}

function readingTime(c) {
  const words = all(c.page, 'section').map((s) => s.html).join(' ').replace(/<[^>]+>/g, ' ').split(/\s+/).filter(Boolean).length;
  const min = Math.max(1, Math.round(words / 220));
  return { fr: `Lecture : ${min} min`, nl: `Leestijd: ${min} min`, en: `${min} min read` }[c.lang];
}

export default function article(c) {
  const { page, t } = c;
  const kick = one(page, 'kick');
  const lede = one(page, 'lede');
  const proof = one(page, 'proof');

  let body = '';
  const tail = [];
  for (const b of page.seq) {
    if (b.name === 'section') {
      const { h2, body: txt } = splitH2(b.html);
      body += `<section class="art-s">${b.attrs.kick ? `<p class="label">${b.attrs.kick}</p>` : ''}${h2}\n${txt}</section>\n`;
    } else if (b.name === 'pull') {
      body += `<blockquote class="pull"><p>${b.html}</p></blockquote>\n`;
    } else if (['faq', 'related', 'cta'].includes(b.name)) {
      tail.push(b);
    }
  }

  const tailHTML = tail.map((b) => b.name === 'faq' ? faq(c, b) : b.name === 'related' ? related(c, b) : ctaFinal(c, b)).join('\n');

  const main = `<section class="art-hero"><div class="w">
${crumbs(c)}
<div class="art-grid">
<div class="art-main">
${kick ? `<p class="label">${kick}</p>` : ''}
<h1>${one(page, 'h1')}</h1>
${lede ? `<div class="brief"><p class="label label-o">${t.read_brief}</p><p>${lede}</p></div>` : ''}
<p class="art-meta">${readingTime(c)}${proof ? ` · ${proof}` : ''}</p>
${ctaPair(c, { hero: true })}
${badges(c, 'badges-l')}
<div class="art-body">
${body}
</div>
</div>
<aside class="art-aside">
<div class="aside-in">
${plugAside(c)}
<div class="aside-test"><p class="h-s">${t.test_h}</p><p>${t.test_p}</p><a class="btn btn-orange btn-sm" href="tel:${c.offre.telephone.e164}" data-call>${ico.phone}<span>${c.offre.telephone.affiche}</span></a><a class="aside-demo" href="${c.L(t.demo_href)}" data-demo>${t.cta_demo} ${ico.arrow}</a></div>
</div>
</aside>
</div>
</div></section>
${tailHTML}`;

  return shell(c, { headHTML: one(page, 'head'), main, bodyClass: 'p-article' });
}
