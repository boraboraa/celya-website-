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
- `vercel.json` — traitement des 29 anciennes URLs :
  - `redirects` (20) : 301 vers la page réellement équivalente (`fr/*`, `about`, `services`,
    `services-sales`, `clinics → cabinets`, `pricing → contact.html`).
  - `rewrites` (9) : les anciennes offres sans équivalent (`services-crm`, `services-web`,
    `services-admin`, et leurs variantes `fr/` et `nl/`) sont réécrites vers `api/gone.js`,
    qui répond **410 Gone**. Une redirection vers l'accueil serait traitée par Google comme un
    soft 404 et garderait ces URLs en file d'exploration : le 410 les en sort. Ne pas les
    reconvertir en 301, et ne jamais les ajouter au `sitemap.xml`.
- Données structurées : chaque page porte un `@graph` JSON-LD (`Organization` + `WebSite` sur les
  accueils, `LocalBusiness`, `Service`, `BreadcrumbList`, `FAQPage`). Le `FAQPage` reprend **mot pour
  mot** les `<details>` visibles de la page — si le texte visible change, le JSON-LD doit suivre,
  sinon c'est une violation des règles Google. Pas de `FAQPage` sur les pages NL métiers : elles
  n'ont pas de FAQ visible.
- `<title>` ≤ 60 caractères, `<meta name="description">` ≤ 158 : au-delà, Google tronque et réécrit.
- Widget « Parler à Janet » + barre d'appel mobile injectés par `bento.js` sur les pages bento.
