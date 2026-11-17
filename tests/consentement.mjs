#!/usr/bin/env node
/* Consentement et GTM inchangés (CLAUDE.md) : le bloc de bento.js publié sur
 * origin/main et celui de celya.js sont identiques à l'octet près, et le
 * Consent Mode v2 par défaut du <head> est celui d'avant.
 *
 * Exception datée du 17/11/2026 (décision de Bora, lot « prêt pour les
 * publicités ») : seul le TEXTE du message du bandeau change, dans les trois
 * langues (FR et EN raccourcis le même jour pour tenir en 2 lignes à 360 px).
 * Le test masque les trois chaînes msg:'…', exige que tout le reste
 * du bloc soit identique à l'octet, et que les trois messages soient
 * exactement ceux décidés. Les empreintes avant / après sont affichées. */
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const REF = process.argv[2] || 'origin/main';
const old = execFileSync('git', ['show', `${REF}:bento.js`], { cwd: ROOT, encoding: 'utf8' });
const cur = fs.readFileSync(path.join(ROOT, 'celya.js'), 'utf8');
const block = (s) => { const i = s.indexOf('/* ---- consentement cookies + Google Tag Manager'); const j = s.indexOf("if(document.body)build();else document.addEventListener('DOMContentLoaded',build);\n  })();", i); return i < 0 || j < 0 ? null : s.slice(i, j); };
const fails = [];
const a = block(old), b = block(cur);
const MSG = {
  fr: 'Mesure et publicité (Google Analytics, Google Ads, Meta)\u00a0: à vous de choisir.',
  nl: 'Cookies voor metingen en advertenties (Google Analytics, Google Ads, Meta): u beslist.',
  en: 'Cookies for analytics and ads (Google Analytics, Google Ads, Meta): you choose.',
};
const mask = (s) => s.replace(/msg:'[^']*'/g, "msg:''");
const sha = (s) => crypto.createHash('sha256').update(s).digest('hex').slice(0, 12);
if (!a || !b) fails.push('bloc consentement introuvable');
else {
  if ((a.match(/msg:'/g) || []).length !== 3 || (b.match(/msg:'/g) || []).length !== 3) fails.push('il faut exactement trois messages (fr, nl, en) dans chaque bloc');
  if (mask(a) !== mask(b)) fails.push('hors du texte des messages, le bloc consentement + GTM de celya.js diffère de celui de bento.js');
  for (const [l, m] of Object.entries(MSG)) if (!b.includes(`${l}:{msg:'${m}',`)) fails.push(`message ${l} : ce n'est pas le texte décidé le 17/11/2026 (« ${m} »)`);
}
const head = (s) => (/<script>\s*\/\* Consent Mode v2[\s\S]*?<\/script>/.exec(s) || [null])[0];
const oldHead = head(execFileSync('git', ['show', `${REF}:garages.html`], { cwd: ROOT, encoding: 'utf8' }));
const pages = fs.readdirSync(path.join(ROOT, '_src/pages'), { recursive: true }).filter((f) => f.endsWith('.html'));
for (const rel of pages) if (head(fs.readFileSync(path.join(ROOT, rel), 'utf8')) !== oldHead) fails.push(`${rel} : Consent Mode par défaut différent`);
if (/googletagmanager|fbq\(|facebook\.net|gtag\/js/.test(pages.map((r) => fs.readFileSync(path.join(ROOT, r), 'utf8').replace(/<script>[\s\S]*?<\/script>/g, '')).join(''))) fails.push('pixel ou balise en dur dans une page');
console.log(fails.length ? fails.join('\n') : `Consentement : hors des trois messages, bloc identique à l'octet à ${REF}:bento.js (${mask(a).length} octets, empreinte ${sha(mask(a))}) ; empreinte du bloc entier ${sha(a)} → ${sha(b)} (seul le texte change) ; messages du 17/11 en fr, nl, en ; Consent Mode par défaut identique sur ${pages.length} pages, aucun pixel en dur.`);
process.exit(fails.length ? 1 : 0);
