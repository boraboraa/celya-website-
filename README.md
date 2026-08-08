# celya.be — site statique

HTML/CSS/JS statique, sans build. Déploiement manuel depuis ce dossier : `vercel --prod`.

- Produit : Janet, l'assistante téléphonique IA de Celya — **appels entrants uniquement**
  (rendez-vous, messages urgents, questions courantes). Jamais d'appels sortants, jamais d'e-mails.
- Structure : FR à la racine (`index.html` + 4 pages métiers `garages/restaurants/cabinets/independants.html`),
  NL dans `nl/`, EN dans `en/` (accueil + contact). Pages légales par langue.
- `bento.css` / `bento.js` — thème bento + fond aurore partagé. GTM (GTM-KF9QCKB2) ne se charge
  **qu'après le consentement cookies** (localStorage `celya-consent`, Consent Mode v2) — à conserver.
  GA4 est configuré dans GTM, pas dans le code. Jamais d'iframe noscript GTM.
- `assets/janet-*.webp` — images optimisées (les .png d'origine restent disponibles).
- `vercel.json` — redirections 301 des anciennes pages (services*, about, pricing, fr/, clinics → cabinets).
- Widget « Parler à Janet » + barre d'appel mobile injectés par `bento.js` sur les pages bento.
