/* Icônes et marque. Aucune icône gadget, aucun emoji : téléphone, coche,
 * chevron, plus, sceau de certification, et le C de voix de Celya. */

/** [x, y1, y2, durée s, délai s] dans un carré de 100 ; tracés du logo officiel */
export const BARS = [[72.98, 24.7, 36.74, 0.67, -0.21], [67.91, 14.29, 37.58, 0.75, -0.31], [61.88, 10.52, 34.38, 0.58, -0.8], [55.21, 8.39, 32.53, 1.01, -1.6], [48.26, 12.97, 27.13, 0.93, -0.44], [41.4, 15.71, 26.81, 0.82, -0.55], [35.0, 16.17, 31.86, 0.64, -0.21], [29.41, 12.12, 44.24, 0.66, -1.85], [24.94, 23.91, 43.12, 0.96, -1.61], [21.81, 33.73, 45.75, 0.95, -0.39], [20.2, 38.43, 54.61, 0.7, -1.25], [20.2, 42.37, 64.6, 0.92, -1.71], [21.81, 44.21, 76.31, 0.99, -0.17], [24.94, 55.33, 77.64, 0.85, -1.34], [29.41, 64.7, 78.94, 0.8, -0.36], [35.0, 70.2, 81.76, 0.79, -0.18], [41.4, 66.45, 91.03, 1.02, -1.73], [48.26, 63.62, 96.28, 0.82, -0.6], [55.21, 68.05, 91.04, 1.0, -1.14], [61.88, 70.15, 84.94, 0.99, -1.7], [67.91, 66.86, 81.27, 0.8, -0.83], [72.98, 61.07, 77.49, 0.85, -0.86]];

/** Le C de voix, en barres HTML : chaque barre s'anime en transform (scaleY),
 *  sur le compositeur ; rien ne repeint. Statique si animate=false. */
export function cVoice(cls = '', animate = true) {
  const b = BARS.map(([x, y1, y2, d, dl]) =>
    `<i style="left:${(x - 1.9).toFixed(2)}%;top:${y1}%;height:${(y2 - y1).toFixed(2)}%${animate ? `;animation-duration:${d}s;animation-delay:${dl}s` : ''}"></i>`).join('');
  return `<span class="cv${animate ? ' cv-on' : ''}${cls ? ' ' + cls : ''}" aria-hidden="true">${b}</span>`;
}

/** Logo Celya : C de voix + « elya » (tracés de la maquette) */
export function logo(cls = 'logo') {
  const bars = BARS.map(([x, y1, y2]) => `<path d="M${x} ${y1}L${x} ${y2}"/>`).join('');
  return `<svg class="${cls}" viewBox="0 -134 2811 1194" role="img" aria-label="Celya"><g transform="translate(-161.6 -125) scale(11.2)" stroke="#FF6A3D" stroke-width="3.8" stroke-linecap="round" fill="none">${bars}</g><g transform="translate(759.6 810) scale(1 -1)" fill="currentColor"><path transform="translate(0 0)" d="M319 -10Q236 -10 172.5 25Q109 60 73.5 120.5Q38 181 38 259Q38 321 58 372Q78 423 113.5 460.5Q149 498 198.5 518.5Q248 539 307 539Q359 539 404 519Q449 499 482 464.5Q515 430 532.5 382.5Q550 335 549 279L548 236H121L98 320H445L429 303V325Q426 356 409 379.5Q392 403 365.5 416.5Q339 430 307 430Q258 430 224.5 411Q191 392 174 356.5Q157 321 157 268Q157 217 178.5 179Q200 141 239.5 120.5Q279 100 332 100Q369 100 400 112Q431 124 467 155L528 70Q501 45 466.5 27.5Q432 10 394 0Q356 -10 319 -10Z"/><path transform="translate(572 0)" d="M73 0V740H197V0Z"/><path transform="translate(828 0)" d="M152 -230 264 29 265 -53 5 527H147L292 183Q299 170 306 148.5Q313 127 318 106L293 98Q300 117 308 138.5Q316 160 323 183L447 527H590L370 0L280 -230Z"/><path transform="translate(1409 0)" d="M271 -10Q206 -10 153 26Q100 62 68 124Q36 186 36 265Q36 344 68 406Q100 468 155 503Q210 538 279 538Q319 538 352 526.5Q385 515 410 494Q435 473 451.5 446Q468 419 474 388L447 395V527H571V0H446V126L475 131Q468 104 449.5 78.5Q431 53 403.5 33.5Q376 14 342.5 2Q309 -10 271 -10ZM305 99Q348 99 381 120Q414 141 432.5 178.5Q451 216 451 265Q451 313 432.5 350Q414 387 381 408Q348 429 305 429Q262 429 229.5 408Q197 387 179 350Q161 313 161 265Q161 216 179 178.5Q197 141 229.5 120Q262 99 305 99Z"/></g></svg>`;
}

export const ico = {
  phone: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path fill="currentColor" d="M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z"/></svg>',
  check: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  chev: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  arrow: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M5 12h14M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
  play: '<svg class="i" viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l11-6.5z" fill="currentColor"/></svg>',
  seal: (color) => `<svg class="i seal" viewBox="0 0 24 24" aria-hidden="true"><path d="M12 1.5l2.6 1.9 3.2-.2 1 3.1 2.7 1.8-1.1 3 1.1 3-2.7 1.8-1 3.1-3.2-.2L12 22.5l-2.6-1.9-3.2.2-1-3.1-2.7-1.8 1.1-3-1.1-3 2.7-1.8 1-3.1 3.2.2z" fill="${color}"/><path d="M7.8 12.3l2.8 2.8 5.6-5.7" stroke="#fff" stroke-width="2.2" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>`,
};
