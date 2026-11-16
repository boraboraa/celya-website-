/* Gabarit « contact » (FR, NL, EN). Les trois accès (appeler Janet, l'audit,
 * l'e-mail) à gauche, le formulaire à droite. Le formulaire garde son
 * comportement : envoi à web-lead, source « website form », honeypot
 * « website », nom + téléphone ou e-mail ; il gagne le métier et les champs
 * cachés d'attribution (celya.js), et l'événement generate_lead (form
 * « contact ») part seulement avec l'accord cookies. */
import { one, esc } from '../lib/core.mjs';
import { shell } from '../components/shell.mjs';
import { badges } from '../components/blocks.mjs';
import { HIDDEN } from '../components/form.mjs';
import { ico } from '../components/icons.mjs';

export default function contact(c) {
  const { page, t } = c;
  const F = page.blocks.form[0].attrs;
  const f = t.form;
  const opts = f.metiers.map(([v, l]) => `<option value="${v}">${l}</option>`).join('') + `<option value="autre">${f.metier_other}</option>`;
  const ways = one(page, 'ways').replace(/<a href="([^"]*)"><b>([\s\S]*?)<\/b><span>([\s\S]*?)<\/span><\/a>/g,
    (m, h, b, s) => `<a class="rel" href="${h}"${h.startsWith('tel:') ? ' data-call' : ''}><b>${b}</b><span>${s}</span>${ico.arrow}</a>`);
  const pull = one(page, 'pull');
  const form = `<form class="form" id="lf" data-lead="contact" data-source="website form" data-need="phone-or-email" data-sending="${esc(F.sending)}" data-err-required="${esc(F.err_required)}" data-err-server="${esc(F.err_server)}" novalidate>
<h2 class="h-s form-t">${F.h2}</h2>
<p class="f-small">${F.sub}</p>
<div class="f-body">
<div class="f-row">
<div class="f-field"><label for="f-name">${F.name}</label><input id="f-name" name="name" required autocomplete="name"></div>
<div class="f-field"><label for="f-company">${F.company}</label><input id="f-company" name="company" autocomplete="organization"></div>
</div>
<div class="f-row">
<div class="f-field"><label for="f-phone">${F.phone}</label><input id="f-phone" name="phone" type="tel" autocomplete="tel" inputmode="tel" placeholder="${esc(F.phone_ph)}"></div>
<div class="f-field"><label for="f-email">${F.email}</label><input id="f-email" name="email" type="email" autocomplete="email"></div>
</div>
<div class="f-field"><label for="f-metier">${f.metier} <small>(${f.optional})</small></label><select id="f-metier" name="metier"><option value="">${f.metier_ph}</option>${opts}</select></div>
<div class="f-field"><label for="f-need">${F.need}</label><textarea id="f-need" name="need" rows="4" placeholder="${esc(F.need_ph)}"></textarea></div>
${HIDDEN.map((h) => `<input type="hidden" name="${h}">`).join('')}
<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
<p class="f-err" role="alert"></p>
<button class="btn btn-ink" type="submit">${F.submit}</button>
</div>
<div class="f-ok" hidden role="status"><span class="f-ok-ic">${ico.check}</span><b>${F.ok_b}</b><p>${F.ok_p}</p></div>
</form>`;
  const main = `<section class="hero hero-contact"><div class="w">
<h1>${one(page, 'h1')}</h1>
<p class="lead">${one(page, 'lede')}</p>
</div></section>
<section class="hero-badges"><div class="w">${badges(c)}</div></section>
<section class="sec sec-contact"><div class="w contact-grid">
<div class="contact-ways"><div class="rels">${ways}</div><p class="note-line">${one(page, 'note')}</p></div>
${form}
</div></section>
${pull ? `<section class="sec-pull"><div class="w"><blockquote class="pull pull-c"><p>${pull}</p></blockquote></div></section>` : ''}`;
  return shell(c, { headHTML: one(page, 'head'), main, bodyClass: 'p-contact' });
}
