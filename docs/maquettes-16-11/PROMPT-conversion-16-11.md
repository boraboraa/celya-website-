# Lot « conversion Google Ads » — 16 novembre 2026, décisions de Bora

Une seule PR pour tout le lot, depuis la branche `conversion-google-ads` (elle
contient déjà ce brief, l'aperçu et les captures). **Tu ne fusionnes pas** :
fusionner vers `main` met en production. Bora valide la prévisualisation
Vercel, puis fusionne lui-même.

Avant de toucher au code : lis `CLAUDE.md` en entier, puis liste dans la PR,
fonctionnalité par fonctionnalité, ce qui change, ce qui est affecté et ce qui
sera testé. Chaque fonctionnalité nouvelle ou modifiée a son test. Tout
composant est écrit une fois dans `_src/components/` et appelé partout ; les
pages sortent de `node _src/build.mjs`, aucune page servie ne s'édite à la
main.

## Références

- `docs/maquettes-16-11/apercu-lp-garages.html` : l'aperçu validé par Bora de
  `lp/garages.html`. Ouvre-le avec le serveur local à la racine du dépôt
  (`python3 -m http.server`, puis `/docs/maquettes-16-11/apercu-lp-garages.html`).
  Son bloc `<style>` donne les valeurs exactes du héros (classes `lpv-*`).
- `docs/maquettes-16-11/captures/` : ordinateur 1440, téléphone 360 et 390,
  page entière.
- Le dossier est exclu du déploiement (`.vercelignore`, déjà fait).

---

## 1. Le héros des quatre pages d'atterrissage : vidéo en fond, formulaire translucide

Pages : `lp/garages.html`, `lp/ne-plus-rater-d-appels.html`,
`nl/lp/garages.html`, `nl/lp/geen-oproepen-meer-missen.html` (gabarit
`_src/layouts/lp.mjs`).

**Décision de Bora du 16/11/2026, à écrire dans `CLAUDE.md`** comme exception
datée à la règle « un héros contient le H1, une phrase et les deux boutons,
rien de plus » : **sur les quatre pages d'atterrissage seulement**, le
formulaire de démo est dans le héros, posé en transparence sur la vidéo.
Aucune autre page n'en bénéficie.

### Ce que le héros contient

- La vidéo de fond de l'accueil : mêmes fichiers `assets/hero/`, même choix de
  source par `celya.js` (mobile sous 720 px, ordinateur au-dessus, version
  `-1080` si elle existe), même pause hors écran (`.anim-off`), poster seul
  sous `prefers-reduced-motion`. Réutilise le balisage de `heroVideo()` ; pas
  de seconde logique vidéo.
- **Le texte passe sur la vidéo, lui aussi.** Bora l'a demandé
  explicitement : la première partie doit être transparente, pas seulement le
  formulaire. Le voile crème est léger.
- À gauche : le H1, une phrase, puis les boutons :
  - « Appeler Janet · +32 460 25 44 13 » (orange, `tel:`, numéro lu dans
    `data/offre.json`) ;
  - « Être rappelé pour une démo » (contour, ancre vers le formulaire),
    **affiché seulement sous 860 px** : au-dessus, le formulaire est à côté.
- À droite (dessous sur téléphone) : le formulaire existant, **même envoi,
  mêmes champs, même attribution**. Le titre du formulaire reste.
- Aucune accroche, aucune sous-ligne, aucune pastille dans le héros.

### Les valeurs (celles de l'aperçu)

Ordinateur :

- voile, de gauche à droite :
  `rgba(250,241,228,.62) 0%`, `.42 38%`, `.10 54%`, `.25 66%`, `.55 100%` ;
- formulaire : `background: rgba(255,247,240,.62)`,
  `border: 1px solid rgba(255,255,255,.7)`, **aucune ombre** ;
- champs : `background: rgba(255,255,255,.78)`, bord `rgba(181,160,132,.55)` ;
- grille `1.1fr .9fr`, écart 64 px, H1 à `clamp(40px,4.6vw,64px)`.

Téléphone (sous 860 px) :

- la vidéo est un fond de `height: max(100svh, 800px)`, version mobile cadrée
  `center bottom` ;
- voile en pixels, pour que le texte soit toujours sur la partie voilée et la
  scène toujours dégagée sous les boutons :
  `.55 0`, `.40 470px`, `0 560px`, `0 calc(100% - 150px)`,
  `.75 calc(100% - 50px)`, `var(--page) 100%` ;
- le bloc texte fait `min-height: calc(max(100svh,800px) - 92px - 110px)` : le
  premier écran montre le titre, la phrase, les deux boutons empilés pleine
  largeur, **puis la scène de la vidéo bien visible** ; le formulaire commence
  en bas de l'écran, posé sur la fin de la vidéo ;
- formulaire : `rgba(255,247,240,.66)`, bord blanc à `.75`, padding 22/18 ;
- bouton contour : fond `rgba(250,241,228,.8)` (il peut passer sur la scène).

### Ce qui ne se négocie pas

- **aucun `backdrop-filter`** (l'effet transparent est un voile crème, pas un
  flou), aucun `will-change`, aucun `filter` sur la vidéo ;
- **contraste**, mesuré par `tests/heros.mjs` étendu aux quatre pages, sur le
  pixel le plus clair de la vidéo sous chaque bloc, texte masqué, à 360, 390,
  768 et 1440 px : H1 ≥ 4,5, phrase ≥ 4,5. La partie en `<em>` du H1 prend
  `var(--o-txt)` comme sur l'accueil (avec l'orange vif, l'aperçu mesure 3,4).
  Si un cas ne passe pas, on renforce le voile **sous ce bloc seulement**,
  jamais en revenant à un fond opaque ;
- les libellés du formulaire restent lisibles là où ils passent sur la scène ;
- rien ne dépasse de son cadre : `scrollWidth == innerWidth` à 360, 390, 768
  et 1440 px, sur les quatre pages ;
- la barre mobile du bas (`mbar`, « Appeler Janet » / « Être rappelé ») est
  ajoutée aux pages d'atterrissage, et apparaît une fois le héros dépassé,
  comme ailleurs ;
- le bandeau cookies ne recouvre aucun bouton du héros.

### Les textes du héros

- `lp/garages.html` :
  - H1 : « Votre garage rate des appels ? *Janet décroche à votre place.* » ;
  - phrase : « Pendant que vous êtes sous la voiture, elle répond en français
    et en néerlandais, pose le rendez-vous d'atelier et vous envoie chaque
    appel sur WhatsApp. »
- `lp/ne-plus-rater-d-appels.html` : H1 inchangé (« Vous ratez des appels ?
  *Janet décroche à votre place.* ») ; phrase sur le même modèle, sans métier.
- NL : mêmes structures. Pour `nl/lp/garages.html`, raccourcis l'`<em>` sur le
  modèle FR (« Janet neemt op in uw plaats. »). **Relis tout le NL contre
  `docs/vocabulaire-be.md`.**

---

## 2. Ce qui suit le héros, sur les quatre pages, dans cet ordre

1. **Badges** Meta Tech Provider / Vérifiée par Google (inchangés).
2. **La scène animée** (section 3).
3. **« Comment ça marche », en quatre étapes**, avec les mots du métier sur la
   page garages (voir l'aperçu : « Un client appelle le garage · Janet
   décroche · Elle agit (Rendez-vous, Message, Urgence) · Vous recevez tout »).
   Réutilise le composant des étapes de l'accueil (`ol.steps`).
4. **« Chaque appel, rangé dans la bonne case »** : le composant `cases()`,
   avec les textes du métier pour la page garages et les textes génériques
   pour l'autre.
5. **« Appelez-la, comme un client »** : un bloc beige avec, à gauche,
   l'étiquette « Le test le plus simple », un H2 et une phrase
   (garages : « Demandez un rendez-vous pour un entretien, ou dites que votre
   voiture ne démarre plus. Vous entendrez ce que vos clients entendront. »),
   et à droite les deux boutons (appeler, être rappelé). Composant unique.
6. **Les prix**, avec le bouton « Demander une démo » qui renvoie **au
   formulaire de la page** (`#lp`), pas à `demo.html`.
7. **La FAQ, cinq questions** : les trois actuelles, plus deux.
   - « Dois-je changer de numéro ? » — « Non. Vous gardez votre numéro et
     déviez simplement les appels vers Janet. »
   - « Mes clients sauront-ils que c'est une IA ? » — « Oui, elle le dit. Et
     elle vous passe l'appel quand le client veut vous parler. »

   Le H2 devient « Vos questions, *nos réponses* ». Si la page porte un
   `FAQPage`, il suit le texte visible.
8. **L'appel final** (inchangé).

Les trois bénéfices actuels (`ul.benefits`) sont remplacés par les blocs 4 et
5. Ajoute ce retrait dans `tests/corrections-autorisees.json`, page par page,
avec la raison.

---

## 3. La scène animée « Un appel, de bout en bout »

Un composant unique, écrit une fois. Il montre ce que Janet fait vraiment,
dans un **téléphone aux couleurs Celya** (cadre sobre de `capture()` /
`orders()`). **On ne reproduit ni l'interface de WhatsApp ni celle de
Google**, et la mention « Exemple » est visible.

**Le déroulé** (boucle d'environ 15 s, chaque étape apparaît puis laisse la
place à la suivante) :

1. **L'appel.** Bulles de conversation.
   - Client : « Bonjour, ma voiture fait un bruit au freinage. »
   - Janet : « Je peux vous proposer jeudi 19 novembre à 10 h. »
   - Client : « Parfait. »
2. **Le rendez-vous se pose.** Une carte « RDV pris · jeudi 19 nov. · 10:00 ·
   Freins » glisse dans un mini-agenda.
3. **Le patron est prévenu.** Le résumé de l'appel arrive : client, véhicule,
   motif, créneau.
4. **Le client confirme.** Il reçoit sa confirmation avec Confirmer, Déplacer
   et Annuler ; « Confirmé » s'allume. Une ligne : « Rappel envoyé la veille. »
5. **Le patron donne une consigne.**
   - Patron : « Bloque-moi la journée de demain. »
   - Janet : « C'est bloqué. Personne ne pourra réserver demain. »

**Les textes :**

- ils vivent dans les données, par langue (FR / NL / EN) et par métier :
  `data/metiers.json` pour les pages métiers, un jeu générique ailleurs ;
- sur une page de cabinet ou de restaurant, l'exemple parle de ce métier,
  jamais de freins ;
- le jeudi 19 novembre est la date des exemples fixée le 16/11 ;
- les phrases font 14 px minimum et les libellés en capitales 12 px minimum
  (`tests/tailles.mjs`).

**Le budget de rendu :**

- **CSS seul**, `transform` et `opacity` seulement, une seule `@keyframes` par
  mouvement ;
- **aucun JS qui tourne en boucle**, aucun `requestAnimationFrame` nouveau ;
- en pause hors écran via `.anim-off` ;
- sous `prefers-reduced-motion` : **l'état final, fixe**, avec les cinq
  étapes lisibles, sans aucune animation ;
- `tests/budget-rendu.mjs` reste vert.

**Où elle va :**

| Page | Emplacement |
|---|---|
| Accueil (FR, NL, EN) | juste après la vidéo du héros et les badges |
| 11 pages métiers × 3 langues | **remontée juste sous les badges du héros** ; les blocs consignes et confirmations existants restent plus bas |
| Articles (`p-article`) | une **version compacte** (téléphone seul, sans texte à côté) après la première section |
| Pages d'atterrissage | juste sous les badges, avant « Comment ça marche » |

**Pas de H2 dans le composant** : une étiquette et un `h3` au plus, pour que
la liste des H2 des pages indexées ne bouge pas (`tests/seo-avant-apres.mjs`).

---

## 4. Hors périmètre de ce lot

- **L'envoi du formulaire** : c'est le lot `web-lead` du dépôt
  `celya-sales-agent`, l'e-mail vers `sales@celya.be`. Ici, le formulaire garde
  exactement le même envoi. Aucune adresse e-mail n'apparaît dans le HTML ou le
  JS du site.
- La politique de consentement et le chargement de GTM : ils ne bougent pas
  d'une ligne.
- `conditions.html` et `nl/voorwaarden.html` : on n'y touche pas.

## 5. Avant d'ouvrir la PR

- Toutes les vérifications de `CLAUDE.md`, toutes vertes :
  - `check.py`, `sitemap.py`, `sweep*.js` ;
  - `verif-seo.js` sur les fichiers touchés ;
  - `build.mjs --check` ;
  - tous les `tests/*.mjs`, plus les nouveaux.
- Des captures dans la PR, à 360, 390, 768 et 1440 px :
  - les quatre pages d'atterrissage (premier écran et page entière) ;
  - l'accueil FR, une page métier et un article, avec la scène.
- La scène en vidéo courte (enregistrement Playwright) dans la PR, pour que
  Bora juge le rythme.
- Un compte rendu en français simple : ce qui a changé, page par page, et ce
  qui reste à décider par Bora.

**Effort : high.**

## Hors brief : pas de bande de chiffres

L'aperçu (`apercu-lp-garages.html`) montre une bande de trois chiffres sous les
badges : **elle n'est pas à faire.** Aucun chiffre, aucune bande de preuves dans
ce lot.
