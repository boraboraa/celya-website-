#!/usr/bin/env node
'use strict';
/* sweep_en.js — balayage visuel du silo EN (en/ + en/blog/), Chromium 360, 390,
 * 768 et 1440 px. Ajouté par le lot « refonte premium » (14/11/2026) : le
 * silo EN n'était pas balayé.
 *
 *   node sweep_en.js                               tout le silo EN
 *   node sweep_en.js en/index.html                 seulement ces pages
 *
 * Mêmes contrôles et mêmes règles de sortie que sweep.js.
 * Rapports : sweep-en.txt et sweep-en.json.
 */

const { sweep } = require('./sweep-core.js');

sweep({
  silo: 'EN',
  dirs: ['en', 'en/blog'],
  exclude: [],
  reportBase: 'sweep-en',
}).catch((e) => {
  console.error('\nsweep_en.js a échoué : ' + (e && e.stack ? e.stack : e));
  process.exit(2);
});
