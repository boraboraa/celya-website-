/* Formulaire « demande de démo » : demo.html et pages d'atterrissage.
 * Même point d'arrivée que contact.html (web-lead), même honeypot (« website »).
 * Champs cachés d'attribution remplis par celya.js depuis la session. */
import { esc } from '../lib/core.mjs';

export const HIDDEN = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term', 'gclid', 'fbclid', 'landing_page', 'page'];

export function demoForm(c, { id = 'demo', kind = 'demo', title = '' } = {}) {
  const f = c.t.form;
  const p = `${id}-`;
  const opts = f.metiers.map(([v, l]) => `<option value="${v}">${l}</option>`).join('') + `<option value="autre">${f.metier_other}</option>`;
  const moments = f.moments.map(([v, l], i) => `<label><input type="radio" name="moment" value="${v}"${i === 0 ? '' : ''}>${l}</label>`).join('');
  return `<form class="form" id="${id}" data-lead="${kind}" data-source="demo form" data-next="${c.L(c.t.merci_href)}" data-sending="${esc(f.sending)}" data-err-required="${esc(f.err_required)}" data-err-server="${esc(f.err_server)}" novalidate>
${title ? `<p class="h-s form-t">${title}</p>` : ''}
<div class="f-row">
<div class="f-field"><label for="${p}name">${f.name}</label><input id="${p}name" name="name" required autocomplete="name"></div>
<div class="f-field"><label for="${p}phone">${f.phone}</label><input id="${p}phone" name="phone" type="tel" required autocomplete="tel" inputmode="tel" placeholder="${esc(f.phone_ph)}"></div>
</div>
<div class="f-row">
<div class="f-field"><label for="${p}metier">${f.metier}</label><select id="${p}metier" name="metier"><option value="">${f.metier_ph}</option>${opts}</select></div>
<div class="f-field"><label for="${p}email">${f.email} <small>(${f.optional})</small></label><input id="${p}email" name="email" type="email" autocomplete="email"></div>
</div>
<fieldset class="f-moment"><legend class="f-legend">${f.moment} <small>(${f.optional})</small></legend><div class="f-opts">${moments}</div></fieldset>
<label class="f-consent"><input type="checkbox" name="consent" value="1" required><span>${f.consent}</span></label>
${HIDDEN.map((h) => `<input type="hidden" name="${h}">`).join('')}
<input class="hp" name="website" tabindex="-1" autocomplete="off" aria-hidden="true">
<p class="f-err" role="alert"></p>
<button class="btn btn-ink" type="submit">${f.submit}</button>
<p class="f-small">${f.privacy} <a href="${c.L(f.privacy_link)}">${f.privacy_label}</a></p>
</form>`;
}
