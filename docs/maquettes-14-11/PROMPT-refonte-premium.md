# Refonte premium de celya.be — nouvelle offre, nouveau design (lot du 14/11/2026)

Tu travailles dans le dépôt du site (`boraboraa/celya-website-`), sur la branche **`refonte-premium`** qui contient déjà ce prompt et les maquettes. Une seule branche, **une seule PR pour tout le lot**, ouverte vers `main`. Rappel de `CLAUDE.md` : le dépôt est relié à Vercel, **fusionner vers `main` met en production**. Tu ne pousses jamais sur `main` et tu ne fusionnes jamais : Bora regarde la prévisualisation Vercel de la PR, puis fusionne lui-même.

## 0. Ce que tu as sous la main

Dossier `docs/maquettes-14-11/` (déjà sur la branche, exclu du déploiement par `.vercelignore` ; exclus-le aussi de `check.py`, `sitemap.py` et des balayages) :

- `00-accueil.html`, `metier-<métier>.html` (11), `page-prix.html`, `page-fonctionnalites.html`, `page-article.html` : les maquettes validées, à ouvrir dans un navigateur. Elles font 1440 px de large et elles sont **la référence visuelle**.
- `apercus/*.jpg` : la capture pleine page de chaque maquette.
- `assets/` : les logos officiels (`wa.svg` = WhatsApp, `gcal.png` = Google Agenda), les photos floues de l'accueil, et `metiers-img/<métier>.jpg` (une photo par métier, déjà floutée).
- Les maquettes sont du HTML généré avec styles en ligne. **Ne les copie pas telles quelles** : tu reconstruis les composants proprement (voir section 3).

## 1. D'abord, mettre à jour `CLAUDE.md` du dépôt (décisions de Bora du 14/11)

Plusieurs règles de `CLAUDE.md` ne sont plus vraies. Mets-les à jour avant tout le reste, en suivant le style du fichier (règle datée, ce qui se vérifie), et cite le changement dans la PR :

| Section de `CLAUDE.md` | Ce qui change |
|---|---|
| « Ce que le site ne dit jamais », montants | Nouvelle grille : **49 / 99 / 199 € HT par mois pour 100 / 300 / 750 minutes**, décomptées à la seconde. Elle remplace 75 / 150 / 300 € et 250 / 750 / 1 750 minutes partout. Les montants ne vivent que dans le fichier de données central (section 4). |
| « pas de WhatsApp », « pas de synchronisation Google Agenda… pas de SMS de confirmation » | En service : résumés WhatsApp au patron, confirmations et rappels clients WhatsApp avec boutons, consignes par WhatsApp, Google Agenda relié, agenda Celya intégré, SMS **de secours** seulement. Toujours interdits : emailing, appels sortants, messages publicitaires. La « formulation autorisée pour l'agenda » est remplacée par : Google Agenda relié, ou agenda Celya ; Outlook pas relié. |
| « Design » | **Nouvelle exception datée : lot « refonte premium » du 14 novembre 2026, validé par Bora.** Thème clair, nouveaux tokens et composants (section 3). Les règles du **budget de rendu** restent en vigueur et s'appliquent aux nouveaux composants. Après ce lot, la règle « aucun composant nouveau » reprend. |
| « Les langues » | Inchangé : Janet répond en français et en néerlandais, rien de plus en promesse de service, aucun total. Les maquettes disent « dans la langue de votre client » : garde la formulation autorisée de `CLAUDE.md`. |

Tout le reste de `CLAUDE.md` tient : vocabulaire belge (`docs/vocabulaire-be.md`, **déviation d'appel**), entité Celya Technologies SRL et mention TVA, chiffres publiés et leur requête, pièges `@graph` et 410, pas de concurrent nommé, Celya ne remplace pas une secrétaire, aucun symptôme évalué, aucun chiffre sans source.

## 2. Avant de coder : ton plan, puis tu t'arrêtes

Rends d'abord, sans rien modifier :

1. **L'état du dépôt** : comment les ~280 pages sont produites aujourd'hui (fichiers écrits à la main, script de génération, gabarits ?), où vivent `bento.css`, `bento.js`, `fonts.css`, le consentement, GTM.
2. **La stratégie pour appliquer un même gabarit à 135 pages par langue sans tout recopier.** Si les pages sont écrites à la main, propose un petit générateur Node sans dépendance lourde : gabarits + données par page, qui ressort **exactement les mêmes URL**. Les utilitaires (composants, tokens, données d'offre) vivent **en un seul endroit** et sont réutilisés partout.
3. **La liste des changements par fonctionnalité** : ce qui change, les fichiers touchés, ce qui sera testé et comment.

Puis tu attends le feu vert de Bora.

## 3. Le système visuel (à reproduire depuis les maquettes)

**Tokens, dans un seul fichier CSS** (remplace le thème sombre actuel) :
- Couleurs : orange `#FF6A3D`, orange brûlé `#E5522A`, encre `#151515`, blanc cassé `#FFF7F0`, fond de page `#FAF1E4`, beige de bloc `#F4E4CE`, gris `#6B635B` / `#4A4540`, filet `#E8D9C3`. `theme-color` et `color-scheme` passent en clair.
- Typo : titres **Newsreader** 400 avec une partie en *italique*, texte **Figtree**, étiquettes **JetBrains Mono** en capitales espacées. Polices auto-hébergées comme aujourd'hui.
- Échelle : H1 72–76 px, H2 48 px, titres de carte 23 px, texte 16–18 px. Colonne de contenu ~1000 px. Beaucoup d'espace vertical (100–130 px entre sections).
- Rayons 20–28 px pour les blocs, 48 px pour les grands panneaux beiges. Filets 1 px plutôt que des cartes ombrées.
- **Aucun emoji, aucune icône gadget.**

**Composants réutilisables** (chacun une fois, appelé partout) :
1. **En-tête** flottant (logo C de voix + nav + « Appeler Janet »).
2. **Héros ruban** : appel entrant → C de Janet animé → résultat (puce + carte WhatsApp), textes du ruban **propres à chaque métier** (dans les maquettes).
3. **Badges de certification**, en grand avec coche bleue : « Meta Tech Provider · Fournisseur officiel WhatsApp Business » (logo WhatsApp officiel, coche `#0866FF`) et « Vérifiée par Google · Application vérifiée Google Agenda » (logo Google Agenda officiel, coche `#1A73E8`). Sous le héros de **toutes** les pages, et dans le pied de page.
4. **Emplacement vidéo 16:9** « Janet en 15 secondes », photo du métier en fond, bouton lecture. La vidéo n'existe pas encore : prévois un `<video>` avec `poster`, `preload="none"` et une source vide facile à remplir.
5. **Cartes « Ce que Janet fait pour vous »** : grille de cartes visuelles (agenda, appel transféré, fiche d'appel, question-réponse, appels simultanés, tri, ou recadrage de la photo du métier). Sous l'image, **le H2 existant**. Le texte complet de la section reste dans le HTML, dans un `<details>` qui s'ouvre au clic. **On ne supprime aucun texte indexé, on le replie.**
6. **Chaque appel rangé dans la bonne case** (RDV pris / À rappeler / Urgent).
7. **Branchement en trois colonnes** : votre numéro (le vôtre par déviation d'appel, ou un numéro belge fourni) · votre WhatsApp (connecté en deux minutes, à votre nom) · votre agenda (Google Agenda, ou l'agenda Celya).
8. **« Votre agenda, ou le nôtre »** : Google Agenda relié, ou agenda Celya intégré pensé pour le métier (texte par métier dans les maquettes). Rappel : Essentiel 1 agenda, Pro jusqu'à 3, Premier répondant illimités.
9. **« En congé ? Dites-le-lui sur WhatsApp »** : téléphone avec la conversation patron ↔ Janet (congés, créneau bloqué, horaires du samedi), plus quatre exemples de consignes.
10. **« Vos clients confirment en un clic »** : téléphone côté client avec la confirmation et les boutons Confirmer · Déplacer · Annuler, puce Google Agenda « Confirmé par le client ». Exemple propre à chaque métier.
11. **Prix** : trois cartes (Pro au centre, fond encre, étiquette « Recommandé »), note de bas de carte.
12. **FAQ** en accordéon, **CTA final** fond encre avec grand C animé, **pied de page**.

Les maquettes des téléphones ne sont **pas** des copies de l'interface WhatsApp : elles restent aux couleurs Celya. Tu ne reproduis pas l'interface de WhatsApp ou de Google.

## 4. L'offre, dans un seul fichier de données

Crée un fichier unique (par exemple `data/offre.json`), lu par tous les gabarits. Aucun montant ni quota écrit en dur ailleurs :

```json
{
  "formules": [
    {"id": "essentiel", "nom": "Essentiel", "prix_ht": 49, "minutes": 100, "agendas": "1", "sms_secours": 0,
     "inclus": ["Numéro belge inclus", "Dans la langue de votre client", "1 agenda : Google ou Celya", "Résumé de chaque appel sur WhatsApp", "Vos consignes par WhatsApp", "Transfert des urgences vers votre portable"]},
    {"id": "pro", "nom": "Pro", "prix_ht": 99, "minutes": 300, "agendas": "jusqu'à 3", "sms_secours": 50, "recommandee": true,
     "inclus": ["Tout l'Essentiel", "Jusqu'à 3 agendas", "Confirmations et rappels sur WhatsApp", "Vos clients confirment, déplacent ou annulent en un clic", "50 SMS de secours par mois"]},
    {"id": "premier", "nom": "Premier répondant", "prix_ht": 199, "minutes": 750, "agendas": "illimités", "sms_secours": 100,
     "inclus": ["Tout le Pro", "Agendas illimités, plusieurs sites", "Revue mensuelle de vos appels", "Support prioritaire", "100 SMS de secours par mois"]}
  ],
  "regles": {
    "decompte": "à la seconde", "mise_en_service": "une mensualité", "depassement": "passage à la formule du dessus",
    "au_dela": "au-delà de 750 minutes : sur devis", "meta": "Messages WhatsApp à vos clients facturés par Meta sur votre compte, environ 2 € par mois",
    "essai": "30 jours gratuits, sans engagement"
  }
}
```

Traductions NL et EN dans le même fichier ou à côté. Le NL utilise le vocabulaire belge de `CLAUDE.md`.

## 5. Le périmètre, page par page

**Ce qui ne bouge pas (vérifié par test, section 7)** : URL, `title`, `meta description`, H1, liste et ordre des H2, texte des FAQ, `canonical`, `hreflang`, JSON-LD `@graph`. Les seules exceptions sont les corrections ci-dessous.

1. **Accueil FR, NL, EN** : maquette `00-accueil`.
2. **Les 11 pages métier** dans les trois langues : maquettes `metier-*`. Photo et exemples par métier. Les noms des maquettes (Garage Martin, Brasserie du Parc…) sont fictifs : garde-les fictifs.
3. **`prix.html`** et équivalents : maquette `page-prix`.
4. **`fonctionnalites.html`** : maquette `page-fonctionnalites`. Le catalogue gagne : WhatsApp, confirmations clients, SMS de secours, agenda (Google ou Celya), consignes par WhatsApp. « Ce qu'elle ne fait pas » est réécrit sans les affirmations devenues fausses.
5. **Les ~100 pages questions, comparaisons et blog** : gabarit `page-article`, avec colonne de lecture, encadré « En bref » (la phrase d'intro existante), encadré « Comment ça se branche » et appel à Janet. **Contenu inchangé**, sauf les corrections ci-dessous.

**Textes devenus faux à corriger** (relevé en ligne du 14/11 ; refais une recherche dans tout le dépôt, FR, NL et EN, pour ne rien rater) :

| Page | À corriger |
|---|---|
| `index.html` | « 75, 150 et 300 € … 250, 750 et 1 750 minutes » → données de `offre.json` |
| `prix.html` (+ NL, `en/pricing.html`) | Ancienne grille, « une langue », « un appel à la fois », FAQ dépassement |
| `fonctionnalites.html` | « Aucune synchronisation avec un agenda externe », « aucun SMS, aucun e-mail vers vos clients », FAQ Google Agenda/Outlook |
| `prise-de-rendez-vous.html` | « l'agent écrit dans l'agenda de Celya, pas dans Google Agenda ni Outlook » → Google Agenda relié, ou agenda Celya. Outlook : pas relié. |
| `plan-de-charge.html` | « sans synchronisation avec un outil externe » |
| `numero-belge.html` | Ajouter : « ou on vous en fournit un » |
| `plusieurs-personnes-plusieurs-agendas.html` | Jusqu'à 3 agendas en Pro, illimités en Premier répondant |
| `conditions.html` | « Aucun SMS, aucun e-mail vers vos clients ». **Texte contractuel** : propose une formulation à Bora dans la PR (« aucun message publicitaire ; seuls des messages liés à l'appel : confirmation, rappel, modification »), **ne la publie pas sans son accord**. |
| `est-ce-legal-en-belgique.html`, `securite.html`, `fiduciaires.html`, `syndics.html` | Même phrase « aucun SMS, aucun e-mail » |
| `prise-de-message.html` | « ne le transmet ni par SMS ni par e-mail à votre client » → à nuancer |
| `y-a-t-il-des-frais-d-installation.html`, `combien-coute-un-secretariat-telephonique.html`, `comment-se-passe-la-facturation.html` | Mise en service = une mensualité |
| `si-je-depasse-mon-volume.html` | Passage à la formule du dessus |
| `est-ce-que-je-paie-si-personne-n-appelle.html` | « Nous n'affichons aucun montant » |

Le héros de l'accueil disait « confirmation par SMS » : c'est WhatsApp.

## 6. Performance et accessibilité

- Images en AVIF/WebP avec `width`/`height`, `loading="lazy"` sauf au-dessus de la ligne de flottaison. LCP < 2,5 s sur mobile.
- Animations du ruban et du C : CSS seulement, `transform`/`opacity`, pausées sous `prefers-reduced-motion` et hors écran. Aucun JS qui tourne en boucle. INP mesuré avant et après sur l'accueil.
- Contrastes AA. Les boutons et `<summary>` sont accessibles au clavier.
- Bandeau de consentement et GTM : inchangés.

## 7. Tests (fichiers de test dans le dépôt, un par fonctionnalité)

Les vérifications existantes de `CLAUDE.md` passent toutes : `python3 check.py`, `python3 sitemap.py`, `node sweep.js`, `node sweep_nl.js`, `node .claude/hooks/verif-seo.js <fichiers>`. En plus :

1. **SEO avant/après** : pour chaque URL du sitemap, compare l'ancienne et la nouvelle version : `title`, description, H1, H2 (ordre), FAQ visible = `FAQPage`, `canonical`, `hreflang`, `@graph`. Seules les corrections de la section 5 sont autorisées.
2. **Débordement** (règle n° 1 de Bora : rien ne dépasse de son cadre, sur ordinateur comme sur téléphone) : étends le harnais de `sweep-core.js` à 360, 390, 768 et 1440 px, sur toutes les pages des trois langues. Échec si `document.scrollWidth > innerWidth`, si un élément dépasse son conteneur ou si un texte est coupé. Joins à la PR les captures de l'accueil, de Garages, de Prix et d'une page question, à 390 et 1440 px.
3. **Données de l'offre** : aucun montant, quota ou nombre de minutes en dur hors du fichier central (grep). `grep -r "75 €\|250 minutes\|1 750"` ne renvoie plus rien.
4. **Vocabulaire** : relecture contre `docs/vocabulaire-be.md` ; « renvoi d'appel » → zéro.
5. **Budget de rendu** : les comptes de `CLAUDE.md` (`backdrop-filter`, `will-change`, `filter:` sur élément animé, boucle RAF unique) tiennent toujours.

## 8. À la fin

Une PR vers `main` (jamais fusionnée par toi), avec : l'URL de prévisualisation Vercel, le résumé par fonctionnalité, les fichiers touchés, le résultat de chaque test, les captures, et la liste de ce que Bora doit confirmer avant de déployer :
- formulation de `conditions.html` ;
- fonctions à confirmer en service : consignes par WhatsApp, agenda Celya multi-agendas, rappel la veille avec boutons, « plusieurs sites » ;
- source de la vidéo de 15 s (emplacement prêt).
