'use strict';
/* sweep-core.js — noyau commun de sweep.js (FR) et sweep_nl.js (NL).
 *
 * Ouvre chaque page du silo dans Chromium à 390 px puis à 1280 px et relève :
 *   1. le débordement horizontal du document, avec le ou les éléments fautifs ;
 *   2. les erreurs JavaScript et les requêtes en 4xx/5xx ;
 *   3. le texte tronqué et les blocs de texte qui se chevauchent ;
 *   4. le budget de rendu du 5 septembre 2026 (backdrop-filter, filter sur
 *      élément animé, animations qui tournent hors écran, will-change) ;
 *   5. la hauteur de page, pour comparer un avant/après (--baseline).
 *
 * Aucune dépendance dans le dépôt : Playwright est résolu globalement et les
 * fichiers sont servis par un petit serveur statique interne sur un port libre.
 */

const fs = require('fs');
const path = require('path');
const http = require('http');

const ROOT = __dirname;

/* ------------------------------------------------------------------ *
 * 1. Playwright : résolution robuste (le dépôt n'a pas de node_modules)
 * ------------------------------------------------------------------ */

function loadPlaywright() {
  const tries = [
    'playwright',
    '/opt/node22/lib/node_modules/playwright',
    '/usr/lib/node_modules/playwright',
    '/usr/local/lib/node_modules/playwright',
    'playwright-core',
    '/opt/node22/lib/node_modules/playwright-core',
  ];
  const errs = [];
  for (const id of tries) {
    try { return require(id); } catch (e) { errs.push(id + ' : ' + (e.code || e.message)); }
  }
  console.error('\nPlaywright est introuvable. Cherché dans :');
  errs.forEach((e) => console.error('  - ' + e));
  console.error('\nInstallation attendue : npm i -g playwright && npx playwright install chromium');
  console.error('(le navigateur est lu depuis PLAYWRIGHT_BROWSERS_PATH, ici ' +
    (process.env.PLAYWRIGHT_BROWSERS_PATH || '<non défini>') + ')\n');
  process.exit(2);
}

/* ------------------------------------------------------------------ *
 * 2. Serveur statique interne
 * ------------------------------------------------------------------ */

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
  '.ttf': 'font/ttf',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.webmanifest': 'application/manifest+json',
};

function startServer(root) {
  const server = http.createServer((req, res) => {
    let rel;
    try { rel = decodeURIComponent(req.url.split('?')[0].split('#')[0]); }
    catch (_) { rel = req.url.split('?')[0]; }
    if (rel.endsWith('/')) rel += 'index.html';
    const file = path.join(root, path.normalize(rel).replace(/^(\.\.[/\\])+/, ''));
    if (!file.startsWith(root)) { res.writeHead(403).end('403'); return; }
    fs.stat(file, (err, st) => {
      if (err || !st.isFile()) {
        res.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
        res.end('404 ' + rel);
        return;
      }
      res.writeHead(200, {
        'content-type': MIME[path.extname(file).toLowerCase()] || 'application/octet-stream',
        'content-length': st.size,
        'cache-control': 'no-store',
      });
      fs.createReadStream(file).pipe(res);
    });
  });
  return new Promise((resolve, reject) => {
    server.on('error', reject);
    server.listen(0, '127.0.0.1', () => {
      resolve({ server, port: server.address().port });
    });
  });
}

/* ------------------------------------------------------------------ *
 * 3. Liste des pages du silo
 * ------------------------------------------------------------------ */

/* Les neuf URL en 410 : rewrites de vercel.json vers /api/gone. Jamais balayées. */
function goneSet() {
  const out = new Set();
  try {
    const v = JSON.parse(fs.readFileSync(path.join(ROOT, 'vercel.json'), 'utf8'));
    (v.rewrites || []).forEach((r) => {
      if (r && r.destination === '/api/gone' && r.source) out.add(r.source.replace(/^\//, ''));
    });
  } catch (e) {
    console.error('vercel.json illisible (' + e.message + ') — les 410 ne sont pas exclues.');
  }
  return out;
}

/* dirs : chemins relatifs à la racine ('' = racine). Pas de récursion : les
 * silos du dépôt sont plats (racine + blog/, nl/ + nl/blog/). */
function listPages(dirs, excludeBasenames) {
  const gone = goneSet();
  const excl = new Set(excludeBasenames || []);
  const out = [];
  for (const d of dirs) {
    const abs = path.join(ROOT, d);
    let names;
    try { names = fs.readdirSync(abs); } catch (_) { continue; }
    names.filter((n) => n.endsWith('.html')).sort().forEach((n) => {
      const rel = d ? d + '/' + n : n;
      if (excl.has(n) || excl.has(rel)) return;
      if (gone.has(rel)) return;
      out.push(rel);
    });
  }
  return out;
}

/* ------------------------------------------------------------------ *
 * 4. L'audit, exécuté dans la page
 * ------------------------------------------------------------------ */

/* Sérialisé tel quel par page.evaluate. Ne rien lire du scope Node ici. */
function auditInPage(cfg) {
  const de = document.documentElement;
  const body = document.body;
  const vw = de.clientWidth;              /* viewport de mise en page, hors barre */
  const iw = window.innerWidth;           /* barre de défilement comprise */
  const vh = window.innerHeight;

  const res = {
    innerWidth: iw,
    clientWidth: vw,
    scrollY: Math.round(window.scrollY),   /* doit valoir 0 : sinon la mesure a glissé */
    scrollWidth: de.scrollWidth,
    scrollHeight: Math.max(de.scrollHeight, body ? body.scrollHeight : 0),
    overflowPx: 0,
    overflowers: [],
    truncated: [],
    hiddenText: [],
    hiddenBelowFold: 0,      /* rogné hors écran : mise en pause voulue, pas un défaut */
    overlaps: [],
    budget: { backdrop: [], willChange: [], filterAnimated: [], animations: 0, running: 0, offscreen: [] },
    elementCount: 0,
  };

  /* --- sélecteur lisible ------------------------------------------ */
  const NOISE = /^(in|done|anim-off|is-[\w-]+)$/;
  function sel(el) {
    if (!el || el.nodeType !== 1) return '?';
    if (el === de) return 'html';
    if (el === body) return 'body';
    let s = el.tagName.toLowerCase();
    if (el.id) return s + '#' + el.id;
    const cls = (el.getAttribute('class') || '').trim().split(/\s+/)
      .filter(function (c) { return c && !NOISE.test(c); }).slice(0, 3);
    if (cls.length) s += '.' + cls.join('.');
    return s;
  }
  function pathOf(el) {
    const parts = [];
    let n = el, d = 0;
    while (n && n.nodeType === 1 && n !== body && n !== de && d < 4) {
      parts.unshift(sel(n)); n = n.parentElement; d++;
    }
    return parts.join(' > ') || sel(el);
  }
  function snippet(el) {
    const t = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (!t) {
      const a = el.getAttribute && (el.getAttribute('alt') || el.getAttribute('aria-label') || el.getAttribute('src'));
      return a ? '[' + String(a).slice(0, 48) + ']' : '';
    }
    return t.length > 56 ? t.slice(0, 56) + '…' : t;
  }
  function isAncestor(a, b) { return a !== b && a.contains(b); }

  /* Sous-arbre non mis en page : un <details> fermé et content-visibility:hidden
   * gardent des enfants dont getBoundingClientRect() renvoie le rectangle du
   * conteneur escamoté — sans ce filtre, chaque sommaire replié du blog remonte
   * comme un chevauchement. */
  const laidOutMemo = new Map();
  function laidOut(el) {
    let v = laidOutMemo.get(el);
    if (v !== undefined) return v;
    v = true;
    let n = el;
    while (n && n !== body && n !== de) {
      if (n.tagName === 'DETAILS' && !n.open && el !== n &&
        !(el.tagName === 'SUMMARY' && el.parentElement === n)) { v = false; break; }
      const known = laidOutMemo.get(n);
      if (known === false) { v = false; break; }
      if (getComputedStyle(n).contentVisibility === 'hidden') { v = false; break; }
      n = n.parentElement;
    }
    laidOutMemo.set(el, v);
    return v;
  }

  /* --- passe unique : styles calculés mis en cache ------------------ */
  const all = body ? Array.prototype.slice.call(body.getElementsByTagName('*')) : [];
  res.elementCount = all.length;
  const nodes = [de, body].filter(Boolean).concat(all);
  const CS = new Map();
  function cs(el) {
    let v = CS.get(el);
    if (!v) { v = getComputedStyle(el); CS.set(el, v); }
    return v;
  }

  /* --- 1. débordement horizontal -----------------------------------
   * bento.css pose body{overflow-x:hidden} : le débordement reste dans
   * scrollWidth (vérifié) mais n'est plus scrollable — la page est cassée
   * sans être scrollable de travers. body et html ne comptent donc PAS
   * comme des conteneurs rogneurs : leur overflow se propage au viewport,
   * il masque le symptôme, pas la cause. */
  const raw = [];
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const s = cs(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    if (s.position === 'fixed') continue;      /* n'élargit pas le document */
    const r = el.getBoundingClientRect();
    if (r.width <= 0 && r.height <= 0) continue;
    const over = r.right - vw;
    if (over <= 1) continue;
    if (!laidOut(el)) continue;
    /* écarté si un vrai conteneur (sous body) rogne, ou si un ancêtre est fixe */
    let clipped = false, p = el.parentElement;
    while (p && p !== body && p !== de) {
      const ps = cs(p);
      if (ps.overflowX !== 'visible' || ps.position === 'fixed') { clipped = true; break; }
      p = p.parentElement;
    }
    if (clipped) continue;
    raw.push({ el: el, over: over, r: r });
  }
  const rawSet = new Set(raw.map(function (o) { return o.el; }));
  const tops = raw.filter(function (o) {
    let p = o.el.parentElement;
    while (p) { if (rawSet.has(p)) return false; p = p.parentElement; }
    return true;
  });
  tops.sort(function (a, b) { return b.over - a.over; });
  res.overflowers = tops.slice(0, 8).map(function (o) {
    /* le bloc le plus haut situe la zone, le descendant le plus large donne la
     * cause : c'est presque toujours lui qu'il faut corriger */
    let cause = null;
    for (let k = 0; k < raw.length; k++) {
      const c = raw[k];
      if (c.el === o.el || !o.el.contains(c.el)) continue;
      if (!cause || c.r.width > cause.r.width) cause = c;
    }
    return {
      sel: pathOf(o.el),
      over: Math.round(o.over),
      left: Math.round(o.r.left),
      right: Math.round(o.r.right),
      width: Math.round(o.r.width),
      text: snippet(o.el),
      cause: cause ? {
        sel: pathOf(cause.el), over: Math.round(cause.over),
        width: Math.round(cause.r.width), text: snippet(cause.el),
      } : null,
    };
  });
  res.overflowPx = Math.max(0, de.scrollWidth - vw);

  /* --- 2. texte tronqué -------------------------------------------- */
  const MEDIA = 'img,svg,canvas,video,iframe,picture';
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    const s = cs(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    const ox = s.overflowX;
    if (ox !== 'hidden' && ox !== 'clip') continue;
    const cw = el.clientWidth;
    if (cw <= 0) continue;
    const d = el.scrollWidth - cw;
    if (d <= 4) continue;
    if (el.querySelector(MEDIA)) continue;      /* recadrage d'image, pas du texte */
    const txt = (el.textContent || '').replace(/\s+/g, ' ').trim();
    if (txt.length < 2) continue;
    res.truncated.push({
      sel: pathOf(el), cut: Math.round(d), clientWidth: Math.round(cw),
      scrollWidth: Math.round(el.scrollWidth),
      ellipsis: s.textOverflow === 'ellipsis',
      text: txt.length > 56 ? txt.slice(0, 56) + '…' : txt,
    });
    if (res.truncated.length >= 8) break;
  }

  /* --- 2bis. texte rendu hors de son conteneur rogné ----------------
   * Le motif « lever de ligne » (.lr{overflow:hidden} + .lr>span{translateY(112%)}
   * animé par rise) laisse le texte SOUS la boîte tant que l'animation n'a pas
   * joué. Si elle reste en pause, la ligne ne remonte jamais : le texte existe,
   * il est mesurable, et personne ne le voit. Un h1 invisible ne se voit pas
   * dans un diff — seulement ici.
   *
   * DEUX SITUATIONS, à ne jamais mélanger. La mesure est prise à scrollY 0.
   *   - la boîte rogneuse est DANS l'écran : le visiteur regarde un titre vide.
   *     C'est un défaut, et c'est ce que la liste rapporte.
   *   - elle est SOUS l'écran : bento.js a posé .anim-off en sortie de viewport
   *     et le CSS a mis rise en pause — c'est le budget de rendu du 5 septembre
   *     qui fonctionne, pas un défaut. Compté (hiddenBelowFold) et jamais listé :
   *     sans ce partage, le seul h1 qui compte se noie dans quelques centaines
   *     de lignes normales, et l'outil ment par le volume. */
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    let own = '';
    for (let k = 0; k < el.childNodes.length; k++) {
      const n = el.childNodes[k];
      if (n.nodeType === 3) own += n.nodeValue;
    }
    if (own.replace(/\s+/g, ' ').trim().length < 3) continue;
    const s = cs(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    if (parseFloat(s.opacity) < 0.1) continue;
    if (!laidOut(el)) continue;
    /* premier ancêtre qui rogne */
    let clip = null, p = el.parentElement;
    while (p && p !== body && p !== de) {
      const ps = cs(p);
      if (ps.overflowX !== 'visible' || ps.overflowY !== 'visible') { clip = p; break; }
      p = p.parentElement;
    }
    if (!clip) continue;
    const r = el.getBoundingClientRect();
    const c = clip.getBoundingClientRect();
    if (r.width <= 0 || r.height <= 0) continue;
    const ix = Math.min(r.right, c.right) - Math.max(r.left, c.left);
    const iy = Math.min(r.bottom, c.bottom) - Math.max(r.top, c.top);
    const seen = Math.max(0, ix) * Math.max(0, iy);
    if (seen / (r.width * r.height) >= 0.1) continue;
    /* la boîte rogneuse est-elle sous les yeux du visiteur, ici et maintenant ? */
    if (!(c.bottom > 0 && c.top < vh && c.right > 0 && c.left < vw)) {
      res.hiddenBelowFold++;
      continue;
    }
    const a = document.getAnimations ? document.getAnimations()
      .find(function (x) { return x.effect && x.effect.target === el; }) : null;
    if (res.hiddenText.length >= 8) continue;
    res.hiddenText.push({
      sel: pathOf(el), clip: pathOf(clip),
      visible: Math.round((seen / (r.width * r.height)) * 100),
      top: Math.round(c.top),
      transform: s.transform === 'none' ? 'none' : s.transform,
      animation: a ? (a.animationName || '(sans nom)') + ' — ' + a.playState +
        ' à ' + Math.round(a.currentTime || 0) + ' ms' : (s.animationName || 'aucune'),
      animOff: !!el.closest('.anim-off'),
      text: own.replace(/\s+/g, ' ').trim().slice(0, 56),
    });
  }

  /* --- 3. chevauchement de blocs de texte --------------------------- */
  const TXT = /^(P|H1|H2|H3|H4|H5|H6|LI|DT|DD|TD|TH|LABEL|FIGCAPTION|BLOCKQUOTE|SUMMARY|BUTTON|A|SPAN|STRONG|EM|SMALL|B|I)$/;
  const leaves = [];
  for (let i = 0; i < all.length; i++) {
    const el = all[i];
    if (!TXT.test(el.tagName)) continue;
    /* texte propre (nœuds texte directs), pas celui des enfants */
    let own = '';
    for (let k = 0; k < el.childNodes.length; k++) {
      const n = el.childNodes[k];
      if (n.nodeType === 3) own += n.nodeValue;
    }
    own = own.replace(/\s+/g, ' ').trim();
    if (own.length < 3) continue;
    const s = cs(el);
    if (s.display === 'none' || s.visibility === 'hidden') continue;
    if (parseFloat(s.opacity) < 0.6) continue;
    if (s.position !== 'static' && s.position !== 'relative') continue;
    if (s.transform !== 'none') continue;
    /* un ancêtre positionné ou transformé = superposition voulue */
    let skip = false, p = el.parentElement, d = 0;
    while (p && p !== body && d < 8) {
      const ps = cs(p);
      if (ps.position === 'absolute' || ps.position === 'fixed' || ps.transform !== 'none') { skip = true; break; }
      p = p.parentElement; d++;
    }
    if (skip) continue;
    if (!laidOut(el)) continue;
    /* un lien ou un span qui passe à la ligne a un rectangle englobant qui couvre
     * les deux lignes d'un bord à l'autre : il « chevauche » ses voisins sans que
     * rien ne se superpose. On ne garde l'inline que sur une seule ligne. */
    if (s.display === 'inline' && el.getClientRects().length !== 1) continue;
    const r = el.getBoundingClientRect();
    if (r.width < 8 || r.height < 6) continue;
    leaves.push({ el: el, r: r });
  }
  leaves.sort(function (a, b) { return a.r.top - b.r.top; });
  for (let i = 0; i < leaves.length && res.overlaps.length < 6; i++) {
    for (let j = i + 1; j < leaves.length; j++) {
      const A = leaves[i], B = leaves[j];
      if (B.r.top >= A.r.bottom - 4) break;
      if (isAncestor(A.el, B.el) || isAncestor(B.el, A.el)) continue;
      const ox = Math.min(A.r.right, B.r.right) - Math.max(A.r.left, B.r.left);
      const oy = Math.min(A.r.bottom, B.r.bottom) - Math.max(A.r.top, B.r.top);
      if (ox <= 8 || oy <= 4) continue;
      const inter = ox * oy;
      const small = Math.min(A.r.width * A.r.height, B.r.width * B.r.height);
      if (small <= 0 || inter / small < 0.2) continue;
      res.overlaps.push({
        a: pathOf(A.el), b: pathOf(B.el),
        overlapX: Math.round(ox), overlapY: Math.round(oy),
        textA: snippet(A.el), textB: snippet(B.el),
      });
      break;
    }
  }

  /* --- 4. budget de rendu ------------------------------------------ */
  const animTargets = new Set();
  const anims = document.getAnimations ? document.getAnimations() : [];
  for (let i = 0; i < anims.length; i++) {
    const e = anims[i].effect;
    if (e && e.target) animTargets.add(e.target);
  }

  /* d'où vient la déclaration : bento.css, ou un <style> recopié dans la page ? */
  const origin = (function () {
    const rules = [];
    for (let i = 0; i < document.styleSheets.length; i++) {
      const sh = document.styleSheets[i];
      let list;
      try { list = sh.cssRules; } catch (_) { continue; }
      const src = sh.href ? sh.href.split('/').pop() : '<style> dans la page';
      /* Attention : depuis le CSS imbriqué, une CSSStyleRule porte elle aussi un
       * cssRules (vide). On ne peut donc pas s'en servir pour distinguer une
       * règle groupante — d'où l'ordre : la règle d'abord, ses filles ensuite. */
      const walk = (rs) => {
        for (let k = 0; k < rs.length; k++) {
          const rule = rs[k];
          if (rule.selectorText && rule.style) {
            rules.push({ sel: rule.selectorText, src: src, style: rule.style });
          }
          if (rule.cssRules && rule.cssRules.length) walk(rule.cssRules);
        }
      };
      walk(list);
    }
    return function (el, prop) {
      const hits = [];
      for (let i = 0; i < rules.length; i++) {
        const r = rules[i];
        if (!r.style.getPropertyValue(prop)) continue;
        try { if (el.matches(r.sel)) hits.push(r.src); } catch (_) { /* :hover, ::after… */ }
      }
      return hits.length ? hits[hits.length - 1] : '?';
    };
  })();

  const ALLOWED = 'header.top, nav.top, .drop-panel, .hero-demo';
  for (let i = 0; i < nodes.length; i++) {
    const el = nodes[i];
    const s = cs(el);
    const bd = s.backdropFilter || s.webkitBackdropFilter;
    if (bd && bd !== 'none') {
      let allowed = false;
      try { allowed = el.matches(ALLOWED); } catch (_) {}
      res.budget.backdrop.push({
        sel: pathOf(el), value: bd, allowed: allowed,
        from: origin(el, 'backdrop-filter'),
      });
    }
    if (s.willChange && s.willChange !== 'auto') {
      res.budget.willChange.push({ sel: pathOf(el), value: s.willChange, from: origin(el, 'will-change') });
    }
    if (s.filter && s.filter !== 'none') {
      /* « qui bouge » = @keyframes, ou une transition sur filter dont la durée
       * n'est pas nulle. Sans le test de durée, le filter="url(#celyaGlow)" du
       * logo SVG (statique, transition:all 0s) remonte sur toutes les pages. */
      const props = (s.transitionProperty || '').split(',').map((x) => x.trim());
      const durs = (s.transitionDuration || '').split(',').map((x) => parseFloat(x) || 0);
      let tdur = 0;
      props.forEach((p, k) => {
        if (p === 'filter' || p === 'all') tdur = Math.max(tdur, durs[k % durs.length] || 0);
      });
      const keyframed = s.animationName && s.animationName !== 'none';
      if (keyframed || tdur > 0) {
        res.budget.filterAnimated.push({
          sel: pathOf(el), value: s.filter,
          animation: keyframed ? '@keyframes ' + s.animationName : 'transition filter ' + tdur + 's',
          from: origin(el, 'filter'),
        });
      }
    }
    /* pseudo-éléments : le grain body::after y vit */
    for (const pe of ['::before', '::after']) {
      let ps;
      try { ps = getComputedStyle(el, pe); } catch (_) { continue; }
      if (!ps || ps.content === 'none' || ps.content === '') continue;
      const pbd = ps.backdropFilter || ps.webkitBackdropFilter;
      if (pbd && pbd !== 'none') res.budget.backdrop.push({ sel: pathOf(el) + pe, value: pbd, allowed: false, from: '?' });
      if (ps.willChange && ps.willChange !== 'auto') res.budget.willChange.push({ sel: pathOf(el) + pe, value: ps.willChange, from: '?' });
      if (ps.filter && ps.filter !== 'none' && ps.animationName && ps.animationName !== 'none') {
        res.budget.filterAnimated.push({
          sel: pathOf(el) + pe, value: ps.filter, animation: '@keyframes ' + ps.animationName, from: '?',
        });
      }
    }
  }

  /* animations au repos : rien ne doit tourner hors écran (.anim-off) */
  res.budget.animations = anims.length;
  const seenOff = new Set();
  for (let i = 0; i < anims.length; i++) {
    const a = anims[i];
    if (a.playState !== 'running') continue;
    const isCss = (typeof CSSAnimation !== 'undefined') ? (a instanceof CSSAnimation) : true;
    if (!isCss) continue;                       /* les transitions ne comptent pas */
    res.budget.running++;
    const t = a.effect && a.effect.target;
    if (!t || t.nodeType !== 1) continue;
    const r = t.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;
    const visible = r.bottom > 0 && r.top < vh && r.right > 0 && r.left < vw;
    if (visible) continue;
    const key = pathOf(t) + '|' + (a.animationName || '');
    if (seenOff.has(key)) continue;
    seenOff.add(key);
    if (res.budget.offscreen.length < 8) {
      res.budget.offscreen.push({
        sel: pathOf(t) + (a.effect.pseudoElement || ''),
        animation: a.animationName || '(sans nom)',
        top: Math.round(r.top), bottom: Math.round(r.bottom),
      });
    }
  }
  res.budget.offscreenTotal = seenOff.size;

  return res;
}

/* ------------------------------------------------------------------ *
 * 5. Le balayage
 * ------------------------------------------------------------------ */

const WIDTHS = [390, 1280];
const ALLOWED_BACKDROP = ['header.top', '.drop-panel', '.hero-demo'];

function tag(s, n) { return (s + ' '.repeat(n)).slice(0, n); }

async function visit(context, base, rel, width) {
  const page = await context.newPage();
  const jsErrors = [];
  const consoleErrors = [];
  const badRequests = [];
  const failedRequests = [];

  /* pageerror = exception non rattrapée : bloquant. console.error = signal, pas
   * forcément un défaut ; « Failed to load resource » double le listener response. */
  page.on('pageerror', (e) => jsErrors.push(String(e && e.message ? e.message : e).split('\n')[0]));
  page.on('console', (m) => {
    if (m.type() !== 'error') return;
    const t = m.text().split('\n')[0];
    if (/Failed to load resource/i.test(t)) return;
    consoleErrors.push(t);
  });
  page.on('response', (r) => {
    const st = r.status();
    if (st >= 400) badRequests.push({ status: st, url: r.url().replace(base, '') });
  });
  page.on('requestfailed', (r) => {
    failedRequests.push({ url: r.url().replace(base, ''), error: (r.failure() && r.failure().errorText) || 'échec' });
  });

  const out = {
    page: rel, width, ok: true, error: null,
    jsErrors, consoleErrors, badRequests, failedRequests,
  };

  try {
    const resp = await page.goto(base + '/' + rel, { waitUntil: 'load', timeout: 45000 });
    if (resp && resp.status() >= 400) out.error = 'HTTP ' + resp.status();
    await page.evaluate(() => (document.fonts ? document.fonts.ready : null)).catch(() => {});

    /* passe de défilement : réveille les IntersectionObserver (reveal, anim-off).
     * bento.css pose html{scroll-behavior:smooth} : un scrollTo() ordinaire GLISSE
     * pendant plusieurs centaines de ms. Mesurer pendant le glissement donne un
     * en-tête sticky par-dessus le titre et des .reveal à mi-transition — des
     * défauts qui n'existent pas. D'où behavior:'instant' et l'attente de scrollY. */
    await page.evaluate(async () => {
      const step = Math.max(200, Math.round(window.innerHeight * 0.8));
      const max = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
      const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
      const jump = (y) => window.scrollTo({ top: y, left: 0, behavior: 'instant' });
      for (let y = 0, n = 0; y < max && n < 40; y += step, n++) {
        jump(y);
        await sleep(45);
      }
      jump(0);
      for (let n = 0; n < 40 && window.scrollY > 0; n++) { jump(0); await sleep(25); }
      await sleep(400);
      /* Mesurer AU REPOS. .reveal transitionne transform avec --spring
       * (cubic-bezier(.34,1.56,.64,1)), une courbe qui dépasse : une section
       * pleine largeur franchit brièvement scale(1) et sort d'un pixel. Sans
       * cette attente le verdict dépend de l'instant de la mesure. */
      const settled = () => !document.getAnimations().some((a) =>
        a.playState === 'running' &&
        (typeof CSSTransition === 'undefined' || a instanceof CSSTransition));
      for (let n = 0; n < 24 && !settled(); n++) await sleep(70);
      await sleep(120);
      return window.scrollY;
    });

    const data = await page.evaluate(auditInPage, {});
    Object.assign(out, data);
  } catch (e) {
    out.error = String(e && e.message ? e.message : e).split('\n')[0];
  } finally {
    await page.close().catch(() => {});
  }

  /* verdicts. Le débordement compte de deux façons : le document qui s'élargit
   * (test documenté) et le contenu qui sort du viewport sans l'élargir, parce
   * que body{overflow-x:hidden} le coupe — même défaut de mise en page. */
  const overflow = out.scrollWidth != null && out.clientWidth != null &&
    (out.scrollWidth > out.clientWidth + 1);
  out.hasOverflow = !!overflow;
  out.hasMasked = !overflow && !!(out.overflowers && out.overflowers.length);
  out.blocking = !!(overflow || out.hasMasked || out.error || jsErrors.length ||
    badRequests.length || failedRequests.length);
  out.ok = !out.blocking;
  return out;
}

async function pool(items, n, worker) {
  const out = new Array(items.length);
  let i = 0;
  const runners = new Array(Math.min(n, items.length)).fill(0).map(async () => {
    for (;;) {
      const k = i++;
      if (k >= items.length) return;
      out[k] = await worker(items[k], k);
    }
  });
  await Promise.all(runners);
  return out;
}

/* ------------------------------------------------------------------ *
 * 6. Rapport
 * ------------------------------------------------------------------ */

function budgetVerdicts(r) {
  const notes = [];
  const b = r.budget;
  if (!b) return notes;
  const bd = b.backdrop || [];
  if (bd.length > 3) {
    notes.push('backdrop-filter : ' + bd.length + ' éléments (budget : 3 — ' + ALLOWED_BACKDROP.join(', ') + ')');
  }
  bd.filter((x) => !x.allowed).forEach((x) => {
    notes.push('backdrop-filter hors nav/menu/héro : ' + x.sel + ' → ' + x.value + '   [' + x.from + ']');
  });
  const wc = b.willChange || [];
  if (wc.length > 2) {
    notes.push('will-change : ' + wc.length + ' éléments (budget : 2) — ' +
      wc.map((w) => w.sel.split(' > ').pop() + ' [' + w.from + ']').join(', '));
  }
  (b.filterAnimated || []).forEach((f) => {
    notes.push('filter sur élément qui bouge : ' + f.sel + ' → ' + f.value +
      ' (' + f.animation + ')   [' + f.from + ']');
  });
  (b.offscreen || []).forEach((o) => {
    notes.push('animation hors écran (anim-off manquant) : ' + o.sel + ' → ' + o.animation +
      ' (top ' + o.top + 'px)');
  });
  return notes;
}

function buildReport(silo, results, baselinePath) {
  const L = [];
  const push = (s) => L.push(s == null ? '' : s);
  const byPage = new Map();
  results.forEach((r) => {
    if (!byPage.has(r.page)) byPage.set(r.page, []);
    byPage.get(r.page).push(r);
  });

  const counts = {
    pages: byPage.size, loads: results.length,
    overflow: 0, masked: 0, jsErrors: 0, http: 0, netFail: 0,
    truncated: 0, hiddenText: 0, hiddenBelowFold: 0, overlaps: 0, budget: 0, loadErrors: 0, consoleErrors: 0,
  };

  push('═'.repeat(78));
  push('  SWEEP ' + silo + ' — Chromium ' + WIDTHS.join(' et ') + ' px');
  push('  ' + byPage.size + ' pages · ' + results.length + ' chargements · ' + new Date().toISOString());
  push('═'.repeat(78));
  push('');

  const problemPages = [];
  for (const [rel, rows] of byPage) {
    const blocks = [];
    rows.sort((a, b) => a.width - b.width);
    for (const r of rows) {
      const w = r.width + 'px';
      if (r.error) { blocks.push('  [' + w + '] CHARGEMENT : ' + r.error); counts.loadErrors++; }
      const outs = r.overflowers || [];
      if (r.hasOverflow) {
        counts.overflow++;
        blocks.push('  [' + w + '] DÉBORDEMENT HORIZONTAL : scrollWidth ' + r.scrollWidth +
          ' > viewport ' + r.clientWidth + '  (+' + (r.scrollWidth - r.clientWidth) + ' px)');
      } else if (outs.length) {
        counts.masked++;
        blocks.push('  [' + w + '] DÉPASSEMENT DE VIEWPORT masqué par body{overflow-x:hidden} :' +
          ' le contenu sort de ' + Math.max.apply(null, outs.map((o) => o.over)) + ' px et se fait couper');
      }
      if (r.hasOverflow || outs.length) {
        outs.forEach((o) => {
          blocks.push('           ↳ +' + o.over + 'px  ' + o.sel +
            '  [l ' + o.width + ', right ' + o.right + ']' + (o.text ? '  « ' + o.text + ' »' : ''));
          if (o.cause) {
            blocks.push('             cause probable : ' + o.cause.sel + '  (l ' + o.cause.width +
              ', +' + o.cause.over + 'px)' + (o.cause.text ? '  « ' + o.cause.text + ' »' : ''));
          }
        });
        if (!outs.length) {
          blocks.push('           ↳ aucun élément isolé : débordement porté par le flux lui-même');
        }
      }
      (r.jsErrors || []).forEach((e) => { counts.jsErrors++; blocks.push('  [' + w + '] ERREUR JS : ' + e); });
      (r.consoleErrors || []).forEach((e) => { counts.consoleErrors++; blocks.push('  [' + w + '] console.error : ' + e); });
      (r.badRequests || []).forEach((b) => { counts.http++; blocks.push('  [' + w + '] HTTP ' + b.status + ' : ' + b.url); });
      (r.failedRequests || []).forEach((b) => { counts.netFail++; blocks.push('  [' + w + '] REQUÊTE ÉCHOUÉE : ' + b.url + ' (' + b.error + ')'); });
      (r.truncated || []).forEach((t) => {
        counts.truncated++;
        blocks.push('  [' + w + '] TEXTE COUPÉ' + (t.ellipsis ? ' (ellipsis)' : '') + ' : ' + t.sel +
          '  ' + t.scrollWidth + ' > ' + t.clientWidth + ' px (−' + t.cut + ')  « ' + t.text + ' »');
      });
      (r.hiddenText || []).forEach((h) => {
        counts.hiddenText++;
        blocks.push('  [' + w + '] TEXTE INVISIBLE DANS L\'ÉCRAN : ' + h.sel + ' rogné par ' + h.clip +
          ' (' + h.visible + ' % visible, boîte à y=' + h.top + ')  « ' + h.text + ' »');
        blocks.push('           transform ' + h.transform + ' · animation ' + h.animation +
          (h.animOff ? ' · sous .anim-off' : ''));
      });
      counts.hiddenBelowFold += (r.hiddenBelowFold || 0);
      (r.overlaps || []).forEach((o) => {
        counts.overlaps++;
        blocks.push('  [' + w + '] CHEVAUCHEMENT : ' + o.a + '  ×  ' + o.b +
          '  (' + o.overlapX + '×' + o.overlapY + ' px)');
        blocks.push('           « ' + o.textA +' »  /  « ' + o.textB + ' »');
      });
      budgetVerdicts(r).forEach((n) => { counts.budget++; blocks.push('  [' + w + '] BUDGET : ' + n); });
    }
    if (blocks.length) {
      problemPages.push(rel);
      push('── ' + rel + ' ' + '─'.repeat(Math.max(0, 74 - rel.length)));
      blocks.forEach(push);
      push('');
    }
  }

  if (!problemPages.length) push('Aucun problème relevé.\n');

  /* hauteurs */
  push('─'.repeat(78));
  push('  HAUTEURS DE PAGE (scrollHeight, px)');
  push('─'.repeat(78));
  let baseline = null;
  if (baselinePath) {
    try { baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf8')); }
    catch (e) { push('  baseline illisible : ' + e.message); }
  }
  const bmap = new Map();
  if (baseline && Array.isArray(baseline.results)) {
    baseline.results.forEach((r) => bmap.set(r.page + '@' + r.width, r.scrollHeight));
  }
  push('  ' + tag('page', 52) + WIDTHS.map((w) => tag(w + 'px', 12)).join(''));
  let dSum = 0, dCount = 0;
  for (const [rel, rows] of byPage) {
    const cells = WIDTHS.map((w) => {
      const r = rows.find((x) => x.width === w);
      const h = r && r.scrollHeight != null ? r.scrollHeight : '—';
      if (bmap.size) {
        const b = bmap.get(rel + '@' + w);
        if (b != null && typeof h === 'number') {
          const d = h - b;
          if (d) { dSum += d; dCount++; }
          return tag(h + (d === 0 ? ' (=)' : (d > 0 ? ' (+' + d + ')' : ' (' + d + ')')), 16);
        }
      }
      return tag(String(h), bmap.size ? 16 : 12);
    });
    push('  ' + tag(rel, 52) + cells.join(''));
  }
  if (bmap.size) {
    push('');
    push('  delta cumulé : ' + (dSum >= 0 ? '+' : '') + dSum + ' px sur ' + dCount + ' mesures modifiées');
  }
  push('');

  /* budget global */
  push('─'.repeat(78));
  push('  BUDGET DE RENDU — récapitulatif');
  push('─'.repeat(78));
  for (const w of WIDTHS) {
    const rows = results.filter((r) => r.width === w && r.budget);
    if (!rows.length) continue;
    const bdMax = Math.max(...rows.map((r) => r.budget.backdrop.length));
    const wcMax = Math.max(...rows.map((r) => r.budget.willChange.length));
    const anMax = Math.max(...rows.map((r) => r.budget.running || 0));
    const off = rows.filter((r) => (r.budget.offscreenTotal || 0) > 0).length;
    const flt = rows.filter((r) => r.budget.filterAnimated.length > 0).length;
    push('  ' + w + 'px  backdrop-filter max ' + bdMax + '/3 · will-change max ' + wcMax +
      '/2 · animations CSS actives max ' + anMax + ' · pages avec animation hors écran ' + off +
      ' · pages avec filter animé ' + flt);
    const sample = rows.find((r) => r.budget.backdrop.length);
    if (sample) push('        backdrop-filter : ' + sample.budget.backdrop.map((b) => b.sel.split(' > ').pop()).join(', '));
    const sw = rows.find((r) => r.budget.willChange.length);
    if (sw) push('        will-change     : ' + sw.budget.willChange.map((b) => b.sel.split(' > ').pop()).join(', '));
  }
  push('');

  /* total */
  push('═'.repeat(78));
  push('  BILAN ' + silo);
  push('═'.repeat(78));
  push('  pages balayées ............... ' + counts.pages + '  (' + counts.loads + ' chargements)');
  push('  pages avec au moins 1 défaut . ' + problemPages.length);
  push('  BLOQUANT');
  push('    débordement horizontal ..... ' + counts.overflow);
  push('    dépassement masqué ......... ' + counts.masked + '   (body{overflow-x:hidden})');
  push('    erreurs JavaScript ......... ' + counts.jsErrors);
  push('    réponses 4xx/5xx ........... ' + counts.http);
  push('    requêtes échouées .......... ' + counts.netFail);
  push('    pages non chargées ......... ' + counts.loadErrors);
  push('  AVERTISSEMENT');
  push('    console.error .............. ' + counts.consoleErrors);
  push('    texte coupé ................ ' + counts.truncated);
  push('    texte invisible dans l\'écran  ' + counts.hiddenText);
  push('    chevauchements ............. ' + counts.overlaps);
  push('    budget de rendu ............ ' + counts.budget);
  push('  PAR CONSTRUCTION — jamais listé, jamais un défaut');
  push('    texte rogné SOUS l\'écran ... ' + counts.hiddenBelowFold +
    '   (.anim-off : le budget de rendu qui fait son travail)');
  push('');

  return { text: L.join('\n'), counts, problemPages };
}

/* ------------------------------------------------------------------ *
 * 7. Point d'entrée
 * ------------------------------------------------------------------ */

async function sweep(opts) {
  const { silo, dirs, exclude, reportBase } = opts;

  /* arguments : fichiers explicites + --baseline */
  const argv = process.argv.slice(2);
  let baselinePath = null;
  const files = [];
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--baseline') { baselinePath = argv[++i]; continue; }
    if (argv[i] === '-h' || argv[i] === '--help') {
      console.log('Usage : node ' + path.basename(process.argv[1]) + ' [fichier.html ...] [--baseline rapport.json]');
      process.exit(0);
    }
    if (argv[i].startsWith('--')) { console.error('option inconnue : ' + argv[i]); process.exit(2); }
    files.push(argv[i]);
  }

  let pages;
  if (files.length) {
    pages = files.map((f) => path.relative(ROOT, path.resolve(ROOT, f)).split(path.sep).join('/'));
    const missing = pages.filter((p) => !fs.existsSync(path.join(ROOT, p)));
    if (missing.length) { console.error('introuvable : ' + missing.join(', ')); process.exit(2); }
  } else {
    pages = listPages(dirs, exclude);
  }
  if (!pages.length) { console.error('aucune page à balayer.'); process.exit(2); }

  if (!process.env.PLAYWRIGHT_BROWSERS_PATH && fs.existsSync('/opt/pw-browsers')) {
    process.env.PLAYWRIGHT_BROWSERS_PATH = '/opt/pw-browsers';
  }
  const { chromium } = loadPlaywright();

  const { server, port } = await startServer(ROOT);
  const base = 'http://127.0.0.1:' + port;

  let browser;
  try {
    browser = await chromium.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-dev-shm-usage', '--hide-scrollbars', '--font-render-hinting=none'],
    });
  } catch (e) {
    server.close();
    console.error('\nChromium n\'a pas démarré : ' + e.message);
    console.error('Installer le navigateur : npx playwright install chromium\n');
    process.exit(2);
  }

  const total = pages.length * WIDTHS.length;
  let done = 0;
  const tty = process.stderr.isTTY;
  const t0 = Date.now();
  function progress(rel, w, blocking) {
    done++;
    const pct = Math.round((done / total) * 100);
    if (tty) {
      process.stderr.write('\r\x1b[2K  [' + String(pct).padStart(3) + '%] ' + done + '/' + total +
        '  ' + w + 'px  ' + rel.slice(0, 46));
    } else if (done % 20 === 0 || done === total) {
      process.stderr.write('  [' + String(pct).padStart(3) + '%] ' + done + '/' + total + '\n');
    }
    if (blocking && tty) process.stderr.write('\r\x1b[2K');
  }

  const results = [];
  console.log('Balayage ' + silo + ' : ' + pages.length + ' pages × ' + WIDTHS.length + ' largeurs — serveur sur ' + base);
  for (const width of WIDTHS) {
    const context = await browser.newContext({
      viewport: { width, height: width < 700 ? 844 : 900 },
      deviceScaleFactor: 1,
      isMobile: false,
      locale: silo === 'NL' ? 'nl-BE' : 'fr-BE',
    });
    const rows = await pool(pages, 5, async (rel) => {
      const r = await visit(context, base, rel, width);
      progress(rel, width, r.blocking);
      if (r.blocking) {
        const why = r.error ? 'chargement: ' + r.error
          : r.hasOverflow ? 'débordement +' + (r.scrollWidth - r.clientWidth) + 'px'
            : r.hasMasked ? 'dépassement masqué +' + r.overflowers[0].over + 'px  ' + r.overflowers[0].sel
              : r.jsErrors.length ? 'erreur JS'
                : r.badRequests.length ? 'HTTP ' + r.badRequests[0].status
                  : 'requête échouée';
        console.log('  ✗ ' + width + 'px  ' + rel + '  — ' + why);
      }
      return r;
    });
    results.push(...rows);
    await context.close();
  }
  if (tty) process.stderr.write('\r\x1b[2K');
  await browser.close();
  server.close();

  const { text, counts, problemPages } = buildReport(silo, results, baselinePath);
  const txtFile = path.join(ROOT, reportBase + '.txt');
  const jsonFile = path.join(ROOT, reportBase + '.json');
  fs.writeFileSync(txtFile, text + '\n');
  fs.writeFileSync(jsonFile, JSON.stringify({
    silo, generated: new Date().toISOString(), widths: WIDTHS,
    pages: pages.length, counts, results,
  }, null, 1));

  console.log('\n' + text);
  console.log('Rapport texte : ' + txtFile);
  console.log('Rapport JSON  : ' + jsonFile);
  console.log('Durée : ' + Math.round((Date.now() - t0) / 1000) + ' s');

  const blocking = counts.overflow + counts.masked + counts.jsErrors +
    counts.http + counts.netFail + counts.loadErrors;
  process.exit(blocking > 0 ? 1 : 0);
}

module.exports = { sweep, listPages, WIDTHS };
