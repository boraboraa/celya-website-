/* Gabarit « métier » (maquettes metier-*.html).
 *
 * La page suit l'ordre de sa source, bloc par bloc, pour que les H2 existants
 * gardent leur ordre :
 *   role:"intro"  → section en deux colonnes (H2 + texte) ;
 *   role:"note"   → petite ligne de texte, sans titre ;
 *   role:"roles"  → liste de rôles (accroche, H3, phrase), sans titre ;
 *   sans rôle     → une carte « Ce que Janet fait pour vous » (les sections
 *                   consécutives forment une grille ; texte replié, jamais supprimé) ;
 *   role:"plug"   → les cases RDV / À rappeler / Urgent, puis le branchement ;
 *   role:"post"   → section en deux colonnes, après le branchement ;
 *   faq           → précédée des composants agenda, consignes, confirmations, prix ;
 *   role:"after"  → section en deux colonnes, après la FAQ ;
 *   related, cta  → liens et appel final.
 * Une image ne paraît jamais deux fois : la photo du métier sert au bandeau,
 * les cartes dont le visuel serait une photo restent sans image. */
import { one, all, strip } from '../lib/core.mjs';
import { shell, ctaPair } from '../components/shell.mjs';
import { badges, ribbon, video, cards, cases, plug, agenda, orders, confirm, prices, faq, ctaFinal, related, intro2 } from '../components/blocks.mjs';

const norm = (h) => strip(h).replace(/&nbsp;|\u00a0|&#160;/g, ' ').replace(/\s+/g, ' ').replace(/\s([:;?!])/g, '$1').replace(/[’]/g, "'").trim().toLowerCase();

export default function metier(c) {
  const { page, data, lang } = c;
  const id = page.meta.metier;
  const M = data.metiers[id];
  if (!M) throw new Error(`${page.file} : métier inconnu « ${id} » (data/metiers.json)`);
  const T = M[lang];
  if (!T || !T.ruban) throw new Error(`${page.file} : data/metiers.json n'a pas de textes « ${lang} » pour ${id}`);

  const visualOf = (s, i) => {
    const m = /<h2[^>]*>([\s\S]*?)<\/h2>/.exec(s.html);
    const h = m ? norm(m[1]) : '';
    return T.cartes.find((v) => norm(v.h) === h) || { v: 'none' };
  };

  let out = '';
  let group = [], pending = [];
  let firstGroup = true, casesDone = false, compsDone = false;
  const pullHTML = (b) => `<section class="sec-pull"><div class="w"><blockquote class="pull pull-c"><p>${b.html}</p></blockquote></div></section>`;
  /* une citation au milieu des cartes ne coupe pas la grille : elle suit le groupe */
  const flush = () => {
    if (group.length) {
      out += cards(c, group, group.map(visualOf), M.photo, { heading: firstGroup });
      firstGroup = false;
      group = [];
    }
    out += pending.map(pullHTML).join('');
    pending = [];
  };
  const components = () => {
    if (compsDone) return '';
    compsDone = true;
    return (casesDone ? '' : cases(c, T.cases) + plug(c, null)) + agenda(c, T.agenda_celya) + orders(c) + confirm(c, T.confirmation) + prices(c);
  };

  for (const b of page.seq) {
    if (b.name === 'section') {
      const r = b.attrs.role;
      if (!r) { group.push(b); continue; }
      flush();
      if (r === 'intro' || r === 'post' || r === 'after') out += intro2(c, b);
      else if (r === 'note') out += `<section class="sec-note"><div class="w"><p class="note-line">${b.html.replace(/<\/?p>/g, '')}</p></div></section>`;
      else if (r === 'plug') { out += cases(c, T.cases) + plug(c, b); casesDone = true; }
      /* pages métier NL courtes : trois rôles (accroche, H3, phrase), sans H2 */
      else if (r === 'roles') out += `<section class="sec"><div class="w"><div class="roles">${b.html}</div></div></section>`;
    } else if (b.name === 'pull') {
      if (group.length) pending.push(b); else out += pullHTML(b);
    } else if (b.name === 'faq') {
      flush();
      out += components() + faq(c, b);
    } else if (b.name === 'related') {
      flush();
      out += components() + related(c, b);
    } else if (b.name === 'cta') {
      flush();
      out += components() + ctaFinal(c, b);
    }
  }
  flush();

  const main = `<section class="hero"><div class="w">
<h1>${one(page, 'h1')}</h1>
<p class="lead">${one(page, 'lede')}</p>
${ctaPair(c, { hero: true, sub: false })}
</div></section>
<section class="hero-badges"><div class="w">${badges(c)}</div></section>
${ribbon(c, T.ruban)}
<div class="w vid-wrap">${video(c, { photo: M.photo, alt: '', v: M.video, title: c.t.video_title })}</div>
${out}`;

  return shell(c, { headHTML: one(page, 'head'), main, bodyClass: 'p-metier' });
}
