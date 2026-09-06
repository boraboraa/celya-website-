#!/usr/bin/env node
'use strict';
/* sweep.js — balayage visuel du silo FR (racine + blog/), Chromium 390 et 1280 px.
 *
 *   node sweep.js                                  tout le silo FR
 *   node sweep.js index.html prix.html             seulement ces pages
 *   node sweep.js --baseline sweep-fr.json         delta de hauteur page par page
 *
 * Sortie 1 si un défaut bloquant est trouvé (débordement horizontal, erreur JS,
 * réponse 4xx/5xx), 0 sinon. Rapports : sweep-fr.txt et sweep-fr.json.
 *
 * apercu.html et apercu-visuel.html sont des planches de contrôle, pas des pages
 * du site : elles ne sont pas balayées. Les neuf URL en 410 sont lues dans
 * vercel.json et écartées.
 */

const { sweep } = require('./sweep-core.js');

sweep({
  silo: 'FR',
  dirs: ['', 'blog'],
  exclude: ['apercu.html', 'apercu-visuel.html'],
  reportBase: 'sweep-fr',
}).catch((e) => {
  console.error('\nsweep.js a échoué : ' + (e && e.stack ? e.stack : e));
  process.exit(2);
});
