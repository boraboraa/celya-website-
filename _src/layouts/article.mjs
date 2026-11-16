/* Gabarit « article » : questions, comparaisons, guides (~250 pages). Sans badges
 * de certification en tête (retour de Bora du 16/11/2026 : ils restent sur les
 * accueils, prix, démo, contact et métiers).
 * Colonne de lecture, encadré « En bref » (la phrase d'intro existante),
 * encadré « Comment ça se branche », appel à Janet. Contenu inchangé. */
import { one, all, esc } from '../lib/core.mjs';
import { shell, ctaPair } from '../components/shell.mjs';
import { plugAside, faq, ctaFinal, related, splitH2, agenda, orders, confirm, scene, sceneText } from '../components/blocks.mjs';
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
  return `<nav class="crumbs" aria-label="${esc(c.t.crumbs)}"><ol>${items.map((it, i) => {
    const name = esc(it.name);
    return i === items.length - 1 ? `<li aria-current="page">${name}</li>` : `<li><a href="${rel(it.item)}">${name}</a></li>`;
  }).join('')}</ol></nav>`;
}

export default function article(c) {
  const { page, t } = c;
  const lede = one(page, 'lede');

  let body = '';
  const tail = [];
  /* la queue de page : la dernière suite de blocs FAQ / liens / appel final.
   * Une FAQ placée plus haut (modèles de messages, etc.) reste à sa place, dans la colonne. */
  const seq = page.seq.filter((b) => ['section', 'pull', 'faq', 'related', 'cta', 'widget'].includes(b.name));
  let cut = seq.length;
  while (cut > 0 && ['faq', 'related', 'cta'].includes(seq[cut - 1].name)) cut--;
  /* la scène « Un appel, de bout en bout », version compacte (téléphone seul),
   * après la première section (lot conversion du 16/11/2026) */
  let sceneDone = false;
  seq.forEach((b, i) => {
    if (i >= cut) { tail.push(b); return; }
    if (b.name === 'section') {
      let { h2, body: txt } = splitH2(b.html);
      if (!h2.replace(/<[^>]+>/g, '').trim()) h2 = '';   /* section sans titre (bandeau d'ouverture) */
      body += `<section class="art-s">${b.attrs.kick ? `<p class="label">${b.attrs.kick}</p>` : ''}${h2}\n${txt}</section>\n`;
      if (!sceneDone) { sceneDone = true; body += scene(c, sceneText(c, null), { compact: true }) + '\n'; }
    } else if (b.name === 'widget') {
      body += `<div class="art-widget">${b.html}</div>\n`;
    } else if (b.name === 'pull') {
      body += `<blockquote class="pull"><p>${b.html}</p></blockquote>\n`;
    } else if (b.name === 'faq') {
      const { h2, body: txt } = splitH2(b.html);
      body += `<section class="art-s"${b.attrs.id ? ` id="${b.attrs.id}"` : ''}>${b.attrs.kick ? `<p class="label">${b.attrs.kick}</p>` : ''}${h2}\n<div class="faq-l">${txt}</div></section>\n`;
    } else if (b.name === 'related') {
      const { h2, body: txt } = splitH2(b.html);
      const links = txt.replace(/<a href="([^"]*)"><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/a>/g,
        (m, h, bb, sp) => `<a class="rel" href="${h}"><b>${bb}</b><span>${sp}</span>${ico.arrow}</a>`);
      body += `<section class="art-s">${b.attrs.kick ? `<p class="label">${b.attrs.kick}</p>` : ''}${h2}\n<div class="rels rels-col">${links}</div></section>\n`;
    }
  });

  /* composants du système (fonctionnalités) : pleine largeur, avant la FAQ.
   * <!--@composants {"liste":["agenda","orders","confirm"],"exemple":"garages"}--> */
  const comp = (page.blocks.composants || [])[0];
  const ids = { agenda: 'agenda', orders: 'consignes', confirm: 'confirmations' };
  const compHTML = comp ? comp.attrs.liste.map((k) => {
    const html = k === 'agenda' ? agenda(c) : k === 'orders' ? orders(c) : confirm(c, c.data.metiers[comp.attrs.exemple][c.lang].confirmation);
    return html.replace(/^<section /, `<section id="${ids[k]}" `);
  }).join('\n') : '';
  const tailHTML = compHTML + tail.map((b) => b.name === 'faq' ? faq(c, b) : b.name === 'related' ? related(c, b) : ctaFinal(c, b)).join('\n');

  const main = `<section class="art-hero"><div class="w">
${crumbs(c)}
<div class="art-grid">
<div class="art-main">
<h1>${one(page, 'h1')}</h1>
${lede ? `<div class="brief"><p class="label label-o">${t.read_brief}</p><p>${lede}</p></div>` : ''}
${ctaPair(c, { hero: true, sub: false })}
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
