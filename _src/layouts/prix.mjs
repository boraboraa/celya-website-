/* Gabarit « prix » (maquette page-prix). Toutes les valeurs de l'offre viennent
 * de data/offre.json : cartes, tableau comparatif, paliers du diagnostic. */
import { one, all, num, eur } from '../lib/core.mjs';
import { shell, ctaPair } from '../components/shell.mjs';
import { badges, priceCards, priceNote, faq, related, ctaFinal, splitH2, intro2 } from '../components/blocks.mjs';
import { ico } from '../components/icons.mjs';

const sec = (page, role) => all(page, 'section').find((s) => s.attrs.role === role);
const kick = (b) => (b.attrs.kick ? `<p class="label">${b.attrs.kick}</p>` : '');

const DIAG = {
  fr: { q1: "Combien d'appels recevez-vous par jour&nbsp;?", q2: 'Vous décrochez quand&nbsp;?', calls: ['environ 5', 'environ 15', '30 et plus'], miss: ['au bureau, aux heures ouvrables', 'quand je peux', 'jamais en intervention'], read: 'Votre relevé', per: 'minutes par mois', avg: '1 min 41', calls_w: 'appels par jour', days: 'jours ouvrés', notTaken: 'que vous ne prenez pas', callsU: 'appels', mean: 'en moyenne', verdict: 'Votre formule&nbsp;: <b>{n}</b>, {p} par mois hors TVA — c’est le premier palier qui couvre vos {m} minutes.', over: 'Au-delà de {max} minutes&nbsp;: <b>sur devis</b>. On en parle&nbsp;?', caveat: 'Soit {c} appels par mois qui, aujourd’hui, sonnent dans le vide.', fmtLocale: 'fr-BE' },
  nl: { q1: 'Hoeveel oproepen krijgt u per dag?', q2: 'Wanneer neemt u op?', calls: ['ongeveer 5', 'ongeveer 15', '30 en meer'], miss: ['op kantoor, tijdens de kantooruren', 'als ik kan', 'nooit tijdens een interventie'], read: 'Uw overzicht', per: 'minuten per maand', avg: '1 min 41', calls_w: 'oproepen per dag', days: 'werkdagen', notTaken: 'die u niet opneemt', callsU: 'oproepen', mean: 'gemiddeld', verdict: 'Uw formule: <b>{n}</b>, {p} per maand excl. btw — de eerste schijf die uw {m} minuten dekt.', over: 'Boven {max} minuten: <b>op offerte</b>. Zullen we erover praten?', caveat: 'Dat zijn {c} oproepen per maand die vandaag in het niets rinkelen.', fmtLocale: 'nl-BE' },
  en: { q1: 'How many calls do you get a day?', q2: 'When do you pick up?', calls: ['about 5', 'about 15', '30 or more'], miss: ['at the office, during office hours', 'when I can', 'never during a job'], read: 'Your figures', per: 'minutes a month', avg: '1 min 41', calls_w: 'calls a day', days: 'working days', notTaken: 'that you miss', callsU: 'calls', mean: 'on average', verdict: 'Your plan: <b>{n}</b>, {p} a month excl. VAT — the first tier that covers your {m} minutes.', over: 'Beyond {max} minutes: <b>on quote</b>. Shall we talk?', caveat: 'That is {c} calls a month ringing out today.', fmtLocale: 'en-GB' },
};

function table(c) {
  const { offre, lang } = c;
  const F = offre.formules;
  const T = offre.tableau;
  const cell = (row, f, i) => {
    if (row.v === 'minutes') return num(f.minutes, lang);
    if (row.v === 'agendas') return f.agendas_txt[lang].replace(/ agendas?$| agenda's?$| calendars?$/, '') || f.agendas_txt[lang];
    if (row.v === 'sms') return f.sms_secours ? T.sms_mois[lang].replace('{n}', num(f.sms_secours, lang)) : '<span class="no" aria-label="non">—</span>';
    return row.v[i] ? `${ico.check}<span class="sr">oui</span>` : '<span class="no">—</span><span class="sr">non</span>';
  };
  const head = F.map((f) => `<th scope="col"${f.recommandee ? ' class="hl"' : ''}>${f.nom[lang]} · ${eur(f.prix_ht, lang)}</th>`).join('');
  const rows = T.lignes.map((row) => `<tr><th scope="row">${row[lang]}</th>${F.map((f, i) => `<td data-label="${f.nom[lang]}"${f.recommandee ? ' class="hl"' : ''}>${cell(row, f, i)}</td>`).join('')}</tr>`).join('');
  return `<div class="cmp-wrap"><table class="cmp"><thead><tr><td></td>${head}</tr></thead><tbody>${rows}</tbody></table></div>`;
}

function diag(c, b) {
  const { offre, lang } = c;
  const D = DIAG[lang];
  const { h2, body } = splitH2(b.html);
  const F = offre.formules;
  const max = Math.max(...F.map((f) => f.minutes));
  const pills = (group, vals, labels, on) => `<div class="pills" data-group="${group}" role="group">${vals.map((v, i) => `<button type="button" data-v="${v}" aria-pressed="${i === on}">${labels[i]}</button>`).join('')}</div>`;
  const marks = F.map((f) => `<span class="mark" style="left:${(f.minutes / max * 100).toFixed(1)}%">${num(f.minutes, lang)}<i>${f.nom[lang]}</i></span>`).join('');
  const conf = JSON.stringify({ paliers: F.map((f) => ({ m: f.minutes, n: f.nom[lang], p: eur(f.prix_ht, lang) })), max, D });
  return `<section class="sec-panel"${b.attrs.sid ? ` id="${b.attrs.sid}"` : ''}><div class="panel bg-beige"><div class="w-wide diag">
<div class="diag-t">${kick(b)}${h2}${body}</div>
<div class="diag-w">
<div class="q"><p class="q-t">${D.q1}</p>${pills('calls', [5, 15, 30], D.calls, 1)}</div>
<div class="q"><p class="q-t">${D.q2}</p>${pills('miss', ['0.35', '0.60', '0.85'], D.miss, 1)}</div>
<div class="read" aria-live="polite"><p class="label">${D.read}</p>
<p class="eq" id="eq"></p>
<p class="big"><b id="mins"></b><span>${D.per}</span></p>
<div class="axis" aria-hidden="true"><div class="track"><div class="fill" id="fill"></div></div><div class="marks">${marks}</div></div>
<p class="verdict" id="verdict"></p>
<p class="note" id="caveat"></p>
</div>
</div>
</div></div></section>
<script>
/* Le diagnostic — deux réponses, une formule, le calcul posé à l'écran.
   Aucune donnée envoyée, rien stocké. Paliers et prix : data/offre.json.
   DUREE : 1 min 41 (101 s) par appel, moyenne relevée dans la table calls du
   projet Supabase celya-sales-agent, appels entrants des deux clients réels,
   du 23/07 au 04/09/2026 — 101 appels sur sept semaines (voir l'historique de
   prix.html). Les parts d'appels non pris (35 / 60 / 85 %) traduisent ce que
   le visiteur déclare ; 22 jours ouvrés par mois est la convention usuelle. */
(function(){
  var C=${conf},s={calls:15,miss:0.60},JOURS=22,DUREE=101/60,D=C.D;
  var eq=document.getElementById('eq'),mins=document.getElementById('mins'),fill=document.getElementById('fill'),verdict=document.getElementById('verdict'),caveat=document.getElementById('caveat');
  if(!eq)return;
  function fmt(n){return n.toLocaleString(D.fmtLocale).replace(/[\\u202F\\u00A0]/g,' ');}
  function render(){
    var perdus=Math.round(s.calls*JOURS*s.miss),m=Math.round(perdus*DUREE),pct=Math.round(s.miss*100),idx=-1;
    for(var i=0;i<C.paliers.length;i++){if(m<=C.paliers[i].m){idx=i;break;}}
    eq.innerHTML='<b>'+s.calls+'</b> '+D.calls_w+' × <b>'+JOURS+'</b> '+D.days+'<br>× <b>'+pct+' %</b> '+D.notTaken+' = <b>'+fmt(perdus)+'</b> '+D.callsU+'<br>× <b>'+D.avg+'</b> '+D.mean;
    mins.textContent=fmt(m);
    fill.style.transform='scaleX('+Math.min(1,m/C.max)+')';
    verdict.innerHTML=idx<0?D.over.replace('{max}',fmt(C.max)):D.verdict.replace('{n}',C.paliers[idx].n).replace('{p}',C.paliers[idx].p).replace('{m}',fmt(m));
    caveat.textContent=D.caveat.replace('{c}',fmt(perdus));
  }
  [].forEach.call(document.querySelectorAll('.diag .pills'),function(grp){
    grp.addEventListener('click',function(e){
      var btn=e.target.closest('button');if(!btn)return;
      [].forEach.call(grp.querySelectorAll('button'),function(k){k.setAttribute('aria-pressed','false');});
      btn.setAttribute('aria-pressed','true');
      s[grp.getAttribute('data-group')]=parseFloat(btn.getAttribute('data-v'));render();
    });
  });
  render();
})();
</script>`;
}

export default function prix(c) {
  const { page } = c;
  /* le tableau des modèles : chaque cellule reçoit l'intitulé de sa colonne (lecture en cartes sous 860 px) */
  const modeles = (html) => {
    const cols = [...((html.match(/<thead>[\s\S]*?<\/thead>/) || [''])[0]).matchAll(/<th[^>]*>([\s\S]*?)<\/th>/g)].map((m) => m[1].replace(/<[^>]+>/g, ''));
    return html.replace(/<tr>([\s\S]*?)<\/tr>/g, (row, inner) => {
      let i = 0;
      return '<tr>' + inner.replace(/<(th|td)\b([^>]*)>/g, (m, tag, attrs) => { const lab = cols[i++] || ''; return tag === 'td' ? `<td${attrs} data-label="${lab.replace(/"/g, '&quot;')}">` : m; }) + '</tr>';
    }).replace(/<table>/, '<div class="mod-wrap"><table class="mod">').replace(/<\/table>/, '</table></div>');
  };
  const sid = (b) => (b.attrs.sid ? ` id="${b.attrs.sid}"` : '');
  let out = '';
  for (const b of page.seq) {
    const r = b.attrs.role;
    if (b.name === 'section' && r === 'formules') {
      const F = splitH2(b.html);
      out += `<section class="sec bg-cream"><div class="w">
<div class="two">${kick(b) ? `<div>${kick(b)}${F.h2}</div>` : F.h2}<div class="prose">${F.body}</div></div>
${priceCards(c)}
<div class="price-foot"><p class="note">${priceNote(c)}</p><div class="price-go"><a class="btn btn-ink" href="${c.L(c.t.demo_href)}" data-demo>${c.t.price_start}</a><small>${c.t.price_start_sub}</small></div></div>
</div></section>`;
    } else if (b.name === 'section' && r === 'tableau') {
      out += `<section class="sec"><div class="w">${splitH2(b.html).h2}${table(c)}<p class="note">${priceNote(c)}</p></div></section>`;
    } else if (b.name === 'section' && r === 'diag') {
      out += diag(c, b);
    } else if (b.name === 'section' && r === 'modeles') {
      const M = splitH2(b.html);
      out += `<section class="sec"${sid(b)}><div class="w">${kick(b)}${M.h2}<div class="prose mod-prose">${modeles(M.body)}</div></div></section>`;
    } else if (b.name === 'section') {
      out += intro2(c, b);
    } else if (b.name === 'pull') {
      out += `<section class="sec-pull"><div class="w"><blockquote class="pull pull-c"><p>${b.html}</p></blockquote></div></section>`;
    } else if (b.name === 'faq') out += faq(c, b);
    else if (b.name === 'related') out += related(c, b);
    else if (b.name === 'cta') out += ctaFinal(c, b);
  }
  const main = `<section class="hero"><div class="w">
<h1>${one(page, 'h1')}</h1>
<p class="lead">${one(page, 'lede')}</p>
${ctaPair(c, { hero: true, sub: false })}
</div></section>
<section class="hero-badges"><div class="w">${badges(c)}</div></section>
${out}`;
  return shell(c, { headHTML: one(page, 'head'), main, bodyClass: 'p-prix' });
}
