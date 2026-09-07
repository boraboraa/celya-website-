#!/usr/bin/env node
'use strict';
/* sweep_nl.js — balayage visuel du silo NL (nl/ + nl/blog/), Chromium 390 et 1280 px.
 *
 *   node sweep_nl.js                               tout le silo NL
 *   node sweep_nl.js nl/index.html                 seulement ces pages
 *   node sweep_nl.js --baseline sweep-nl.json      delta de hauteur page par page
 *
 * Mêmes contrôles et mêmes règles de sortie que sweep.js.
 * Rapports : sweep-nl.txt et sweep-nl.json.
 */

const { sweep } = require('./sweep-core.js');

sweep({
  silo: 'NL',
  dirs: ['nl', 'nl/blog'],
  exclude: ['apercu.html', 'apercu-visuel.html'],
  reportBase: 'sweep-nl',
}).catch((e) => {
  console.error('\nsweep_nl.js a échoué : ' + (e && e.stack ? e.stack : e));
  process.exit(2);
});
