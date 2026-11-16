#!/usr/bin/env node
/* Consentement et GTM inchangés (CLAUDE.md) : le bloc de bento.js publié sur
 * origin/main et celui de celya.js sont identiques à l'octet près, et le
 * Consent Mode v2 par défaut du <head> est celui d'avant. */
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
if (!a || !b) fails.push('bloc consentement introuvable');
else if (a !== b) fails.push('le bloc consentement + GTM de celya.js diffère de celui de bento.js');
const head = (s) => (/<script>\s*\/\* Consent Mode v2[\s\S]*?<\/script>/.exec(s) || [null])[0];
const oldHead = head(execFileSync('git', ['show', `${REF}:garages.html`], { cwd: ROOT, encoding: 'utf8' }));
const pages = fs.readdirSync(path.join(ROOT, '_src/pages'), { recursive: true }).filter((f) => f.endsWith('.html'));
for (const rel of pages) if (head(fs.readFileSync(path.join(ROOT, rel), 'utf8')) !== oldHead) fails.push(`${rel} : Consent Mode par défaut différent`);
if (/googletagmanager|fbq\(|facebook\.net|gtag\/js/.test(pages.map((r) => fs.readFileSync(path.join(ROOT, r), 'utf8').replace(/<script>[\s\S]*?<\/script>/g, '')).join(''))) fails.push('pixel ou balise en dur dans une page');
console.log(fails.length ? fails.join('\n') : `Consentement : bloc identique à ${REF}:bento.js (${a.length} octets), Consent Mode par défaut identique sur ${pages.length} pages, aucun pixel en dur.`);
process.exit(fails.length ? 1 : 0);
