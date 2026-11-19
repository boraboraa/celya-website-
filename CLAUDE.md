# celya.be — notes de travail

Site statique trilingue (FR racine, `/nl/`, `/en/`) déployé sur Vercel.
Secrétariat téléphonique belge avec agent vocal — **appels entrants uniquement**.

## Règle bloquante : le vocabulaire belge

**Toute page FR ou NL écrite ou modifiée se relit contre
[`docs/vocabulaire-be.md`](docs/vocabulaire-be.md) avant commit.** Ce fichier
décide si une page se positionne en Belgique : « expert-comptable » ou
« fysiotherapeut » ratent la requête quelle que soit la qualité du texte.

Le hook `.claude/hooks/verif-seo.js` en attrape une partie automatiquement,
mais il ne couvre pas tout le tableau — la relecture reste obligatoire.

## Ce que le site ne dit jamais

- **les seuls montants publics sont les trois formules — grille du 14 novembre
  2026, décision de Bora** : **49, 99 et 199 € hors TVA par mois, pour 100,
  300 et 750 minutes**, décomptées à la seconde. Elle remplace 75 / 150 / 300 €
  et 250 / 750 / 1 750 minutes partout, sans exception. Les montants, quotas,
  minutes et règles de l'offre (mise en service = une mensualité, dépassement =
  passage à la formule du dessus, au-delà de 750 minutes sur devis, messages
  WhatsApp facturés par Meta sur le compte du client — environ 2 € par mois)
  **ne vivent que dans le fichier de données
  central de l'offre** (`data/offre.json`, lot « refonte premium ») : aucun
  gabarit, aucune page source ne les écrit en dur. Aucun autre montant, aucune
  fourchette, rien d'inventé ailleurs. Vérifiable :
  `grep -rE "75 €|250 minutes|1 750"` sur les pages ne renvoie rien.
- **plus aucun essai gratuit — décision de Bora du 16 novembre 2026.** Ni
  « essai gratuit », ni « 30 jours d'essai », ni « sans engagement » attaché à
  un essai, en FR, NL ou EN ; sous les grilles de prix, le bouton est
  « Demander une démo » (NL « Vraag een demo », EN « Request a demo »), vers
  la page démo de la langue. `data/offre.json` n'a plus de règle d'essai et le
  jeton `{{offre.essai}}` n'existe plus. Vérifiable :
  `grep -riE "essai gratuit|jours d.essai|30 jours gratuits|proefperiode|30 dagen gratis|free trial"`
  sur les pages servies, `_src/` et `data/` ne renvoie rien (« 30 days » de
  `en/privacy.html` parle d'autre chose et ne se touche pas).
- aucun concurrent nommé
- Celya ne remplace jamais une secrétaire
- l'agent n'évalue jamais un symptôme médical
- **jamais** d'emailing, d'appels sortants, ni de message publicitaire
- **en service depuis le 14 novembre 2026 (décision de Bora), et donc
  annonçable** : le résumé de chaque appel sur WhatsApp au patron ; les
  confirmations et rappels clients sur WhatsApp, avec boutons (Confirmer ·
  Déplacer · Annuler) ; les consignes du patron à Janet par WhatsApp ; Google
  Agenda relié ; l'agenda Celya intégré ; le SMS **de secours seulement** (le
  client sans WhatsApp). Les seuls messages envoyés aux clients du patron sont
  liés à leur appel : confirmation, rappel, modification. **Outlook n'est pas
  relié** et ne s'annonce pas. Les maquettes de téléphone restent aux couleurs
  Celya : on ne reproduit pas l'interface de WhatsApp ni celle de Google.
- aucune revendication multilingue au-delà de FR + NL **en promesse de service**
- **aucun chiffre sans sa source et sa date**
- **aucun tiret long « — » (U+2014), nulle part sur le site : décision de Bora
  du 19 novembre 2026** (il donne au texte un air écrit par une IA). Les titres
  finissent par « | Celya » (`<title>`, `og:title`, `twitter:title`, `name` du
  JSON-LD) ; dans le texte, une virgule, un deux-points, un point ou des
  parenthèses, selon ce qui se lit le mieux ; dans un libellé d'interface, « · »,
  un deux-points ou deux éléments. Le tiret demi-cadratin « – » des plages
  (10–15, 9h–18h) reste, et marque aussi une case vide (tableau des prix,
  calculateurs). Le nom de l'agenda créé chez le client s'écrit « Celya –
  Réservations ». `node tests/tiret-long.mjs` échoue sur tout tiret long
  (caractère, `&mdash;`, `&#8212;`, `\u2014` dans un script) dans les fichiers
  servis et dans `_src/` et `data/` ; seuls les outils d'extraction de
  `_src/tools/` gardent la forme échappée `\u2014` dans leurs chaînes.
  Seconde exception datée au bloc consentement : le commentaire du Consent Mode
  par défaut du `<head>` devient « Consent Mode v2 : tout est refusé… » (un
  caractère d'un commentaire ; le code reste identique à l'octet,
  `tests/consentement.mjs` le vérifie).

## L'entité : Celya Technologies SRL, et la TVA qui n'est pas encore là

Depuis le **04/09/2026**, l'éditeur du site est **Celya Technologies SRL**,
BCE **1042.115.837**, Avenue de Broqueville 136/1, 1200 Woluwe-Saint-Lambert,
administrateur Osman Bora Doğrul. L'ancienne société et son numéro ont quitté
le dépôt le 06/09/2026, et ne doivent jamais y revenir : un `grep -ri` sur
l'ancienne dénomination comme sur son numéro doit renvoyer **zéro**. Le siège,
lui, n'a pas bougé.

**La TVA n'est pas activée.** Le numéro se publie donc en une seule forme,
`BE 1042.115.837 (en cours d'activation)` (NL : `(activering loopt)`, EN :
`(activation in progress)`), et **jamais seul** (entre parenthèses depuis le
19/11/2026 : plus de tiret long sur le site). Le pied de page, lui, porte le
numéro d'entreprise sous son libellé de numéro d'entreprise : `BCE/KBO
1042.115.837`.

Dans le JSON-LD, `Organization` et `LocalBusiness` portent `legalName` et un
`identifier` `PropertyValue` / `BCE` / `1042.115.837` — **et aucun `vatID`** :
`grep -ro vatID` doit renvoyer zéro. Le `founder` de l'`Organization` est Bora
Doğrul.

**Temps 2, le jour où VIES répond `valide` pour BE1042115837** — vérifier
d'abord sur <https://ec.europa.eu/taxation_customs/vies>, puis, seulement
ensuite : remplacer la mention « en cours d'activation » par `BE 1042.115.837`
dans les trois langues, et remettre `"vatID": "BE1042115837"` dans les deux
nœuds JSON-LD des 281 pages.

## Les langues : on les nomme, on ne les compte pas

« Plus de N langues / talen / languages » reste **interdit partout** : un total
ne se vérifie pas. Le hook le bloque et continuera de le bloquer.

Ce qui est autorisé, c'est de **nommer** les langues, à une condition : chacune
doit figurer dans la documentation publique du moteur vocal. Source relevée le
31 août 2026 sur <https://elevenlabs.io/docs/overview/models> — Eleven Flash
v2.5, le modèle basse latence des agents, y liste nommément 32 langues.

**Depuis le 11 septembre 2026, le site ne nomme plus que ce qui tourne.** La
section « Bonjour » des trois accueils (grand mot tournant, légende, nuage des
quatorze langues du moteur) a été réduite, à la demande de Bora, à une question
de FAQ dans les trois langues, dont la réponse est la seule formulation
autorisée : « Chez nos clients belges, Janet répond en français et en
néerlandais, et bascule d'une langue à l'autre en cours d'appel. Une autre
langue ? Parlons-en. » (NL : « Bij onze Belgische klanten antwoordt Janet in
het Frans en het Nederlands, en schakelt ze tijdens het gesprek van de ene taal
naar de andere. Een andere taal? Laten we erover praten. » — EN : « French and
Dutch. She switches from one to the other during the call. Another language?
Let's talk. »). Elle figure aussi dans le `FAQPage` du JSON-LD des trois
accueils. Si le nuage revient un jour, il revient avec sa légende en deux
parties (ce que le moteur gère / ce qui tourne aujourd'hui).

**L'allemand** ne doit apparaître dans **aucune page** comme une promesse de
service. Le hook bloque le motif `Deutsch | Duits*` partout ; l'exception qu'il
lève pour un bloc `<div class="langcloud">` des trois accueils ne s'applique
plus à rien depuis que le nuage a disparu (`grep -rl Deutsch` doit renvoyer
zéro), mais reste en place pour le jour où il reviendrait.

**Inchangé par le lot du 14 novembre 2026.** Les maquettes de ce lot disent
« dans la langue de votre client » (ligne de formule, FAQ) et « Français,
néerlandais et anglais » (grille de l'accueil) : ni l'une ni l'autre ne se
publie. Partout où la maquette les porte, c'est la formulation autorisée
ci-dessus, ou sa forme courte « en français et en néerlandais » (NL « in het
Frans en het Nederlands », EN « in French and Dutch »), qui s'écrit.

**Formulation autorisée pour l'agenda — remplacée le 14 novembre 2026
(décision de Bora).** L'ancienne (« Vous gardez votre logiciel… une connexion
directe peut être étudiée ») ne s'écrit plus. FR : « Votre Google Agenda,
relié : Janet lit vos disponibilités et y écrit les rendez-vous. Pas d'agenda ?
Prenez celui de Celya, intégré et pensé pour votre métier. » NL : « Uw Google
Agenda, gekoppeld: Janet leest uw beschikbaarheid en zet de afspraken erin.
Geen agenda? Neem dat van Celya, ingebouwd en afgestemd op uw vak. » EN :
« Your Google Calendar, connected: Janet reads your availability and writes
the bookings into it. No calendar? Use Celya's, built in and designed for your
trade. » Nombre d'agendas : Essentiel 1, Pro jusqu'à 3, Premier répondant
illimités — ces quotas vivent dans `data/offre.json`. **Outlook : pas relié** ;
s'il faut répondre à la question, c'est « pas aujourd'hui ».

## Les chiffres publiés

Ils viennent du journal d'appels de Celya, **appels entrants seuls** : les
tables de production contiennent la prospection sortante, qui a déjà contaminé
deux publications. Tout chiffre se recompte en base avant d'être écrit.

Relevé au 28 août 2026 : 140 appels reçus · 118 classés par motif · **67 messages
pris** · 90 rendez-vous dont 66 posés par l'agent · 0 enregistrement audio ·
37 tables sur 37 en RLS · médiane 1 min 14, moyenne 1 min 25 · 10 paires qui se
chevauchent, jusqu'à 3 conversations simultanées.

### « Messages pris » : la définition, et la requête qui la produit

C'était la troisième valeur publiée pour cette mesure — 138, puis 71 — et
aucune définition écrite ne la fixait. Elle est fixée ici. **Un « message
pris » est un appel entrant, abouti, pour lequel l'agent a produit une fiche
d'appel, et qui n'a pas débouché sur un rendez-vous.** Un rendez-vous n'est pas
un message : il est compté ailleurs, dans les 90 réservations.

```sql
-- Projet Supabase celya-sales-agent (piufpzeicmvgtieybgra)
select count(*) as messages_pris
from public.calls
where direction   = 'inbound'                              -- appels ENTRANTS seuls
  and status      = 'completed'                            -- l'appel a abouti
  and structured_notes ? 'card'                            -- une fiche d'appel existe
  and coalesce(disposition,'') <> 'rdv_planifie'           -- le RDV n'est pas un message
  and created_at  < timestamptz '2026-08-29 00:00:00+00';  -- arrêté à la fin du 28 août 2026
-- => 67
```

**Ce qu'on exclut, et pourquoi.** Les 107 lignes `direction = 'outbound'` :
c'est la prospection sortante, elle a déjà contaminé deux publications. Les
appels sans fiche (`structured_notes` sans clé `card`) : sans fiche, aucun
message n'a été transmis. Les `disposition = 'rdv_planifie'` : ce sont des
rendez-vous. Aucun statut d'échec ni brouillon ne subsiste — sur cette table,
`status` vaut `completed` sur la totalité des entrants.

**La borne est vérifiée, pas supposée.** Arrêtée à la fin du 28 août 2026, la
même table rend 140 appels reçus et 118 classés par motif : exactement les deux
autres chiffres du relevé. La date du relevé est donc la bonne, et c'était la
valeur qui était fausse. Au même instant la requête donne 67, pas 71 — 71 est
ce qu'elle rend deux jours plus tard, le 30 août : le chiffre avait été compté
un autre jour que le reste du relevé.

**Pour rejouer.** Changer la borne, et changer les trois chiffres ensemble :
ils sont publiés dans la même phrase sur 81 pages et ne se déplacent pas
séparément.

## Design

Aucun fichier CSS modifié, aucune règle, aucune variable, aucune couleur.
Aucun composant visuel nouveau. `bento.js` n'est jamais touché. Compléter une
série existante en suivant exactement le motif en place n'est pas une
modification du système.

**Exception datée — lot « refonte premium » du 14 novembre 2026, validé par
Bora.** Référence visuelle : les maquettes de `docs/maquettes-14-11/` (1440 px,
captures dans `apercus/`), et le brief `PROMPT-refonte-premium.md` du même
dossier. Ce lot remplace le thème sombre par un **thème clair** : nouveaux
tokens dans **un seul fichier CSS** (orange `#FF6A3D`, orange brûlé `#E5522A`,
encre `#151515`, blanc cassé `#FFF7F0`, fond `#FAF1E4`, beige de bloc
`#F4E4CE`, gris `#6B635B` / `#4A4540`, filet `#E8D9C3` ; Newsreader pour les
titres, Figtree pour le texte, JetBrains Mono pour les étiquettes, polices
auto-hébergées ; `theme-color` et `color-scheme` en clair), et **nouveaux
composants**, chacun écrit une fois et appelé partout : en-tête flottant, héros
ruban, badges de certification, emplacement vidéo 16:9, cartes « Ce que Janet
fait pour vous » (texte complet replié dans un `<details>`, jamais supprimé),
cases RDV pris / À rappeler / Urgent, branchement en trois colonnes, « Votre
agenda, ou le nôtre », consignes par WhatsApp, confirmations clients, cartes de
prix, FAQ, CTA final, pied de page. Aucun emoji, aucune icône gadget.

Ce qui ne se négocie pas pendant ce lot :

- **les règles du budget de rendu (section suivante) restent en vigueur** et
  s'appliquent aux nouveaux composants : animations du ruban et du C en CSS
  seul, `transform` / `opacity`, en pause sous `prefers-reduced-motion` et hors
  écran, aucun JS qui tourne en boucle ;
- **le consentement et le chargement de GTM ne bougent pas d'une ligne** ;
- **rien ne dépasse de son cadre**, sur téléphone comme sur ordinateur
  (balayage à 360, 390, 768 et 1440 px, trois langues) ;
- URL, `title`, description, H1, liste et ordre des H2, FAQ visibles,
  `canonical`, `hreflang` et `@graph` ne bougent pas, sauf les corrections de texte devenu faux listées
  par le brief.

**Après ce lot, la règle « aucun composant visuel nouveau » reprend**, avec le
nouveau système comme référence.

**Retour de Bora du 15 novembre 2026 sur la prévisualisation de la PR #32
(même lot, même PR).** Brief : `docs/maquettes-14-11/PROMPT-retour-15-11.md`.

- **Nouveau héros des trois accueils : une vidéo plein écran en fond**, derrière
  la nav et le texte. Fichiers dans `assets/hero/` (boucles de 9 s, sans son) :
  `hero-ordinateur-720.mp4` (1280 × 720) et `hero-ordinateur-poster.webp`,
  `hero-mobile-720.mp4` (720 × 1280) et `hero-mobile-poster.webp`. La source est
  choisie une fois au chargement, par `celya.js` : la version mobile sous 720 px
  de large, la version ordinateur au-dessus. Le poster suit la même règle.
  Sous `prefers-reduced-motion`, seul le poster s'affiche, sans lecture. Hors
  écran, la vidéo est en pause (`.anim-off`), et elle reprend au retour.
  **Pour passer en 1080p, il suffit de déposer `hero-ordinateur-1080.mp4`**
  (ou `hero-mobile-1080.mp4`) dans `assets/hero/` et de relancer
  `node _src/build.mjs` : le générateur prend la version `-1080` si elle
  existe, la `-720` sinon. Aucun code à toucher.
  Ce héros remplace l'ancien héros, le ruban d'appel de l'accueil et le bloc
  vidéo « Voir Celya en 37 secondes ». Les fichiers de `assets/video/` restent
  dans le dépôt.
- **Exception d'opacité au défilement, décidée par Bora le 15 novembre 2026.**
  Elle déroge à la règle « aucune opacité animée au-dessus de la ligne de
  flottaison » du lot du 11 septembre, et elle ne couvre que ceci : sur les
  60 premiers pour cent de la hauteur du héros des accueils, la vidéo grossit
  (scale 1 → 1,06) et se dissout dans le crème (opacity 1 → 0), le texte
  remonte de quelques pixels et s'efface, et le C animé de l'étiquette grandit
  jusqu'à environ 72 px pour se poser en tête de la section suivante. Au retour
  vers le haut, tout se rejoue à l'envers. Contraintes : transform et opacity
  seulement, piloté par l'écouteur `onScroll` unique de `celya.js` à partir de
  mesures en cache (`drect()` / `vrect()`, aucune mesure de mise en page dans
  la boucle), aucun `filter`, `backdrop-filter` ni `will-change` ajouté, et
  aucun effet sous `prefers-reduced-motion`. **Rien d'autre sur le site ne
  bénéficie de cette exception.**
- **Plus de petites écritures dans les héros**, que Bora trouve « trop IA ».
  Aucune accroche au-dessus du H1, aucune sous-ligne sous les boutons, aucune
  pastille de preuve, aucune « offre fondateurs » dans un héros. Un héros
  contient le H1, une phrase et les deux boutons, rien de plus. Les badges Meta
  Tech Provider et Vérifiée par Google passent juste sous le héros, en tête de
  la section suivante. Les accroches de section (au-dessus des H2) restent
  pour l'instant : la liste est dans la PR #32, et c'est Bora qui tranche.
- **Tailles minimales** : 12 px pour un libellé en capitales, 14 px pour toute
  phrase, partout, illustrations comprises. Vérifié par `tests/tailles.mjs`.
- **WhatsApp et Google Agenda** : aucune imitation de leurs interfaces. Les
  téléphones sont des cadres sobres aux couleurs Celya, qui attendent de vraies
  captures (`assets/captures/whatsapp-confirmation.webp`,
  `whatsapp-consignes.webp`, `google-agenda.webp`). Tant qu'un fichier manque,
  l'illustration reste, avec la mention « Exemple ». Dès qu'il est déposé,
  relancer `node _src/build.mjs` suffit.
- **Une image ne paraît jamais deux fois sur une même page.** Si un métier
  manque d'images, rien n'est inventé : la carte reste sans visuel, et la liste
  de ce qu'il faut générer est dans la PR.
- Le bloc « Combien vous coûtent les appels manqués ? » a quitté l'accueil.
  `calculateur-appels-manques.html` reste en ligne, telle quelle.

**Lot du 16 novembre 2026 (même PR #32) : tout le site est sur le nouveau
gabarit.** Les 301 pages servies sortent de `node _src/build.mjs` (gabarits
article, billet, blog, contact, légal, métier, prix, accueil, démo, merci,
atterrissage). Aucune page ne charge plus `bento.css`, `bento.js` ni
`fonts.css` : ces fichiers restent dans le dépôt mais sortent du déploiement
(`.vercelignore`), comme `apercu.html` et `apercu-visuel.html`.
`tests/migration.mjs` échoue dès qu'une page servie n'a pas `header.hdr` et
`celya.css`, ou cite encore l'ancien thème.

- **La marque.** Favicon : `celya-favicon.svg` — depuis le 16/11/2026 (après
  fusion de la PR #32), c'est le favicon validé avec le logo le 14/11/2026 :
  le C en traits de voix allégé (12 traits épais), blanc cassé sur carré
  orange `#FF6A3D`. Source : `Bureau/Celya/marque/logo/favicon/` sur le Mac de
  Bora ; ne pas le redessiner. `favicon-48.png`, `favicon-96.png`,
  `favicon-192.png`, `favicon-512.png`, `apple-touch-icon.png` (180),
  `favicon.ico` (16/32/48), `site.webmanifest`. Logo du `@graph`
  (`Organization` et `LocalBusiness`) : `celya-logo-512.png`. Images de
  partage (`og:image`, `twitter:image`, `"image"` du JSON-LD) :
  `assets/partage/partage-fr.png`, `-nl.png`, `-en.png` (1200 × 630, fond
  crème, logo, H1 de l'accueil) ; les articles du blog gardent leur image.
  `og-image.png` et `favicon.svg` n'existent plus : 301 dans `vercel.json`.
  Aucune couleur de l'ancien logo (`22D3EE`, `4F7BFF`, `A855F7`) dans ce qui
  est servi.
- **La vidéo `celya-intro` est retirée du site le 16 novembre 2026** (décision
  de Bora : elle finit sur l'ancien C néon ; une nouvelle vidéo est prévue).
  Plus de `VideoObject` dans le `@graph` des accueils, plus aucun lien ni
  vignette ; les fichiers restent dans `assets/video/`, exclu du déploiement
  (`.vercelignore`). `grep -ri celya-intro` sur le HTML servi rend zéro. La
  nouvelle vidéo reviendra avec son `VideoObject`.
- **Retour de Bora du 16 novembre 2026** : le délai de mise en ligne s'écrit
  « 48 heures » (NL « 48 uur », EN « 48 hours ») partout, jamais « quelques
  jours » ; plus d'« audit gratuit » (contact : « Demander une démo ») ; les
  badges Meta Tech Provider / Vérifiée par Google ne s'affichent en tête que
  sur les accueils, les prix, la démo, le contact et les pages métiers — pas
  sur les articles ni sur le blog ; la politique de confidentialité décrit les
  champs du formulaire (métier, moment de rappel, accord de recontact,
  provenance) ; les exemples de rendez-vous tombent le jeudi 19 novembre.
- **Les textes.** Une migration ne réécrit pas : `tests/texte-conserve.mjs`
  vérifie que chaque paragraphe de l'ancienne page se retrouve dans la
  nouvelle. Les seuls écarts sont les textes devenus faux, appliqués par
  `_src/tools/corrections_16_11.py` (visible et FAQPage ensemble) et listés
  page par page dans `tests/corrections-autorisees.json`.
  `conditions.html` et `nl/voorwaarden.html` gardent leur texte : leur
  formulation sur les messages aux clients attend l'accord de Bora.
- **Les outils des pages** (modèles à copier, check-lists, grilles,
  calculateurs) gardent leur script d'origine au caractère près
  (`_src/tools/scripts_page.py`) ; `tests/outils.mjs` vérifie qu'ils répondent.
- **Contact** : même envoi qu'avant (web-lead, source « website form »,
  honeypot, nom + téléphone ou e-mail), plus le métier et l'attribution.
- **Pages d'atterrissage** : `lp/ne-plus-rater-d-appels.html`,
  `lp/garages.html`, `nl/lp/geen-oproepen-meer-missen.html`,
  `nl/lp/garages.html` — noindex, hors sitemap, sans menu.

**Lot « conversion Google Ads » du 16 novembre 2026 (décisions de Bora).**
Brief : `docs/maquettes-16-11/PROMPT-conversion-16-11.md`, aperçu validé
`docs/maquettes-16-11/apercu-lp-garages.html` (hors déploiement).

- **Exception datée à la règle « un héros contient le H1, une phrase et les
  deux boutons, rien de plus » : sur les quatre pages d'atterrissage
  seulement** (`lp/garages.html`, `lp/ne-plus-rater-d-appels.html`,
  `nl/lp/garages.html`, `nl/lp/geen-oproepen-meer-missen.html`), le
  formulaire de démo est dans le héros, posé en transparence sur la vidéo de
  l'accueil (même `heroMedia()`, même choix de source par `celya.js`, même
  pause hors écran, poster seul sous `prefers-reduced-motion`). Le texte passe
  sur la vidéo lui aussi, sous un voile crème léger. **Aucune autre page n'en
  bénéficie.** Pas de `backdrop-filter`, pas de `filter`, pas d'ombre : la
  transparence est un voile, jamais un flou. Les pages d'atterrissage n'ont
  **pas** l'effet au défilement des accueils (`data-hv="lp"`) : l'exception
  d'opacité du 15/11 reste aux seuls accueils. Contraste mesuré par
  `tests/heros.mjs` (H1, phrase, libellés du formulaire ≥ 4,5 sur le pixel le
  plus clair de la vidéo, à 360, 390, 768 et 1440 px) ; pour tenir 4,5 sur
  la partie orange du H1 à 360 × 640, le voile mobile de l'aperçu est renforcé
  sur ses 260 premiers pixels seulement (.74 → .62 au lieu de .55 → .40).
  Sur ordinateur, le bandeau cookies de ces pages prend sa forme de barre basse
  (celle qu'il a déjà sous 720 px) : en carte au coin bas droit, il recouvrait
  le bouton du formulaire — position seule, le consentement ne bouge pas. La barre mobile
  (« Appeler Janet » / « Être rappelé », vers `#lp`) est sur ces pages ; le
  bouton des prix **et celui de l'appel final** renvoient au formulaire de la
  page (`#lp`), plus à `demo.html` (décision de Bora du 16/11/2026, retour sur
  la PR #34). **Une action, un seul nom** (décision du 17/11/2026) : sur ces
  pages, tout bouton qui mène au formulaire dit « Être rappelé pour une démo »
  (NL « Bel mij terug voor een demo »), le libellé du bouton du formulaire ;
  plus aucun « Demander une démo » ; la barre mobile garde sa forme courte,
  « Être rappelé » / « Bel mij terug ». Le reste du site ne change pas. **Le bandeau en barre basse sur ordinateur reste propre aux
  pages d'atterrissage** : il ne s'étend pas au reste du site (même décision).
  Le `mailto:sales@celya.be` du pied de page reste : « aucune adresse e-mail
  dans le HTML ou le JS » vise le formulaire, qui n'en porte aucune.
- **La scène « Un appel, de bout en bout »** (`scene()` dans
  `_src/components/blocks.mjs`, écrite une fois) : un téléphone aux couleurs
  Celya, mention « Exemple », cinq étapes sur une boucle de 15 s (l'appel, le
  rendez-vous, le résumé au patron, la confirmation du client, la consigne du
  patron). CSS seul, quatre `@keyframes` en `transform` / `opacity`, aucun JS
  qui tourne ; elle se met en pause **d'un bloc** (`[data-anim-root]`,
  `celya.js`) pour que ses étapes restent en phase, et ne tourne que lorsque
  son téléphone est entier à l'écran — aucune étape ne s'anime alors hors
  écran ; le surlignage de la liste d'étapes ne suit le téléphone qu'au-dessus
  de 860 px, quand la liste est à côté de lui ;
  sous `prefers-reduced-motion`, l'état final, fixe, les cinq étapes lisibles.
  Aucun H2 dedans (une étiquette et un H3). Textes dans les données :
  `data/metiers.json` (`<métier>.<langue>.scene`) pour les pages métiers et la
  page d'atterrissage garages, `data/i18n.json` (`scene.generique`) ailleurs ;
  exemple daté du jeudi 19 novembre. Placée sous les badges des accueils, des
  pages métiers et des pages d'atterrissage ; en version compacte (téléphone
  seul) après la première section des articles. Vérifiée par `tests/scene.mjs`.
- **Pages d'atterrissage, dans cet ordre** : héros, badges, scène, Comment ça
  marche (quatre étapes, `ol.steps`), les cases RDV pris / À rappeler /
  Urgent, « Appelez-la, comme un client » (`tryCall()`), prix, FAQ en cinq
  questions (« Vos questions, nos réponses »), appel final. Les trois
  bénéfices ont disparu (`tests/corrections-autorisees.json`). Sur la page
  générique, qui avait déjà « Faut-il changer de numéro ? », la cinquième
  question est « Et si je décroche moi-même ? » (décision de Bora du 16/11).
- **Un jour écrit à côté d'une date est le bon** (`tests/dates.mjs`, FR, NL,
  EN, en toutes lettres comme en abrégé, année 2026 quand elle n'est pas
  écrite). Les exemples de `data/metiers.json` portaient des jours de 2025 ;
  le 16/11/2026, chacun a gardé son jour de la semaine (il est cité dans les
  dialogues : « À samedi ! ») et pris la date 2026 de ce jour dans la semaine
  de l'exemple : samedi 21, mardi 17, vendredi 20, lundi 23 novembre. Les
  indépendants passent au jeudi 19 : c'est le même rendez-vous que leur scène.
  Même règle pour « maandag 3 augustus » (au lieu de 5) dans deux articles NL.
- **« Comment ça marche » des accueils NL et EN** : la liste des quatre étapes
  était vide depuis l'extraction du 14/11 ; elle porte de nouveau le texte de
  l'ancienne page, mot pour mot (`1c2ce15^:nl/index.html`, `en/index.html`).

**Lot « prêt pour les publicités » du 17 novembre 2026 (décisions de Bora,
même PR #34).** Le site reçoit du trafic payant (Google Ads, Meta Ads). La
mesure passe toujours par GTM (GTM-KF9QCKB2), chargé après « Accepter » : ce
lot ne touche pas à ce mécanisme ; il corrige ce que le site dit et ce qu'il
garde.

- **Exception datée à « le consentement et le chargement de GTM ne bougent pas
  d'une ligne » : seul le texte du message du bandeau change**, dans les trois
  langues — FR « Mesure et publicité (Google Analytics, Google Ads, Meta) :
  à vous de choisir. », NL « Cookies voor metingen en advertenties (Google
  Analytics, Google Ads, Meta): u beslist. », EN « Cookies for analytics and
  ads (Google Analytics, Google Ads, Meta): you choose. » ; le lien « En savoir
  plus » reste. Le moment où GTM se
  charge, les appels `gtag('consent', …)`, les boutons, la clé
  `celya-consent`, la position et la hauteur du bandeau ne changent pas d'un
  octet : `tests/consentement.mjs` masque les trois messages et exige que tout
  le reste du bloc soit identique à l'octet à celui de `main`, et que les
  messages soient exactement ceux-là. **Les trois tiennent en 2 lignes à
  360 px** (bandeau de 121 px, comme avant le lot). La première formulation FR
  et EN (« Cookies de mesure et de publicité… », « Cookies for analytics and
  advertising… ») en prenait 3 (142 px) : Bora a retenu le 17/11 les variantes
  mesurées. Deux lignes à 360 px = 656 px de texte au plus, lien « En savoir
  plus » compris, et la coupure se fait au mot : mesurer avant de changer.
- **Plus aucune ressource de Google Fonts** (décision du 17/11/2026) : les
  polices sont auto-hébergées depuis le 14/11 ; le dernier reste, un
  `preconnect` vers `fonts.gstatic.com` dans le `<head>` de 124 pages NL, a
  disparu des sources et des pages, et la notice cookies (FR, NL, EN) ne dit
  plus que le site charge des polices depuis Google. Vérifiable :
  `grep -rE "fonts\.(googleapis|gstatic)\.com"` sur les pages servies rend
  zéro.
- **Les notices nomment les outils publicitaires** : `cookies.html`,
  `privacy.html` et leurs versions NL et EN listent Google Ads (conversions,
  gclid) et le Meta Pixel (Meta Platforms Ireland ; conversions, fbclid),
  chargés seulement après « Accepter », l'identifiant de clic gardé 90 jours
  au plus sur l'appareil, le lien vers la politique de chaque éditeur ; la
  politique de confidentialité dit que l'identifiant de clic part avec le
  formulaire de démo, et la base légale (consentement). Écarts listés dans
  `tests/corrections-autorisees.json`. « Aucun traceur publicitaire » ne
  s'écrit plus ; « aucun traceur publicitaire **sans votre accord** » si.
- **L'attribution tient 90 jours, et seulement avec l'accord** (`celya.js`,
  clé `celya-attrib`). Sans accord : `sessionStorage` seulement, comme avant.
  Après « Accepter » : recopiée dans `localStorage` avec la date d'arrivée
  (les 90 jours comptent depuis le clic sur l'annonce, pas depuis la dernière
  visite) ; un visiteur qui revient la retrouve ; une nouvelle arrivée avec
  des paramètres la remplace ; au-delà de 90 jours, effacée. Après
  « Refuser », ou sans accord à l'ouverture d'une page (accord retiré en
  effaçant les données du site), `localStorage` ne garde rien. Le lien avec
  les boutons du bandeau passe par l'écouteur `click` existant (il suit celui
  du bouton, qui a déjà écrit le choix) : aucun écouteur nouveau, et le bloc
  consentement n'est pas touché. Vérifié par `tests/attribution.mjs` (J+1,
  J+89, J+91, refus, accord retiré, nouvelle arrivée).
- **Les événements** `click_call` et `generate_lead` gardent leur nom (Google
  Ads est réglé dessus) et portent `form` (le `data-lead` : `demo`, `contact`,
  `lp-garages`, `lp-ne-plus-rater-d-appels`, `lp-geen-oproepen-meer-missen`),
  `page`, `lang` ; `generate_lead` porte aussi `metier` et `event_id`, le
  même identifiant que celui envoyé à web-lead (`event_id` dans le corps),
  pour dédoublonner plus tard le pixel Meta et les envois serveur. **Aucun nom
  de régie ni identifiant de compte dans le code du site** : tout se règle
  dans GTM.

**Exception datée — lot « design & proportions » du 11 septembre 2026, validé
par Bora le même jour.** Ce lot est un brief CSS : `bento.css` y est modifié
(logo et bouton de nav, pied de page à colonnes titrées, `aside.t-answer` des
sous-pages, tokens `--fs-*` et `--space-in/--space-out`, reveal sans opacité,
hero de l'accueil). `bento.js` y est touché sur **un seul point** : le premier
cycle de la démo d'appel démarre sur l'écran rempli (la conversation affichée),
jamais sur l'écran vide. Rien d'autre dans `bento.js` ne bouge, et la règle
ci-dessus reprend après ce lot.

**Ce que le lot a fixé, et qui se vérifie d'un `grep` ou d'une mesure :**

- **Sept tailles de fonte, trois interlignes, rien en dur** : `--fs-display`
  (h1 de l'accueil, grands nombres), `--fs-h1` (h1 des sous-pages, titres de
  chapitre `.fs-head h2`), `--fs-h2`, `--fs-h3` (24), `--fs-body` (17),
  `--fs-small` (14), `--fs-label` (12, capitales espacées seulement) ;
  `--lh-tight`, `--lh-heading`, `--lh-body`. À 1440 l'accueil rend exactement
  12 · 14 · 17 · 24 · 40 · 56 · 72 ; `grep -cE 'font-size:[0-9.]+px' bento.css`
  rend 1 (l'exception mesurée de `.day-blk span` sous 760 px). Aucune phrase
  sous 14 px ; `.it` est à `1em`.
- **Deux espacements** : `--space-in` (96 px, entre blocs d'un même chapitre,
  classe `.sec-in`, bandes `.cine` et ce qui les suit) et `--space-out`
  (200 px, entre chapitres) ; 64 / 120 sous 720 px. `--secgap` n'existe plus.
- **Le bouton d'appel** : un seul balisage, `<span class="cta-l">` (libellé
  long) / `<span class="cta-s">` (court), bascule par container query sous
  640 px de conteneur ; le qualificatif `<span class="cta-q">` vit dans la
  ligne `.proof`, avant le numéro. Plus de sous-ligne.
- **Le héro des sous-pages** : 7 colonnes + `aside.t-answer` (« Sur cette
  page », trois liens d'ancre vers les H2, ids `s-…` posés sur les H2) sur les
  pages sans démo ; 8 + 4 avec démo étirée. Le générateur est dans l'historique
  du lot (phase 3).
- **Les apparitions** : état de repos visible, `translateY(12px) → 0` en
  400 ms (`--ease-reveal`), **aucune opacité animée** au-dessus de la ligne de
  flottaison ; les tracés qui se dessinent restent.
- **Pas de numéro d'eyebrow** (`.kick > b` numérique) ; seuls les 1-2-3-4 du
  parcours d'appel, les étapes d'installation et le diagnostic gardent leurs
  chiffres.
- **Tuiles métiers** : quatre par rangée, `aspect-ratio 3/4`, duotone par
  `filter` sur une image **qui ne bouge plus** (le zoom au survol a disparu :
  un filtre sur un élément animé est interdit), carrousel `scroll-snap` sous
  720 px.
- **`/en/pricing.html`** existe (traduction de `prix.html`), hreflang
  réciproques avec `prix.html` et `nl/prijzen.html`, « Pricing » dans la nav EN.

**Exception datée — lot « héro mobile » du 12 septembre 2026, demandé par Bora
le même jour.** Second brief CSS, limité au premier écran des trois accueils
sous 720 px. `bento.css` y est modifié (blocs `@media(max-width:720px)` et
`@media(max-width:480px)`, plus le fond du bandeau cookies en barre basse) ;
`index.html`, `nl/index.html` et `en/index.html` gagnent un
`<span class="kick-geo">` autour du pays dans l'accroche de marque. `bento.js`
y est touché sur **un seul point**, le second depuis le début : le bandeau
cookies publie sa hauteur dans `--cbanner-h` et la retire au clic. Le
consentement et le chargement de GTM ne bougent pas d'une ligne. La règle du
haut reprend après ce lot.

Ce que le lot a fixé, et qui se mesure (harnais Chromium à 393 × 730, 390 × 640
et 360 × 640, iPhone Safari, barre visible) :

- **La photo n'est plus une bande, c'est le fond du héro.** La bande de 289 px
  coupée net au menton disparaît : `.hero-jwrap` passe en `position:absolute`
  sur toute la largeur, au rapport de la source (`aspect-ratio:864/1100`) pour
  que le visage entre en entier, et le texte se pose dessus (`.hero-in` en
  `z-index:1`).
- **Aucune arête.** Le bas du portrait se dissout par masque (opaque jusqu'à
  56 %, transparent à 88 %) **et** le voile finit en `rgba(7,10,20,0)` à 100 %
  après être passé par `var(--bg)` à 88 % : le fond de page, aurore comprise,
  reprend la main sans marche. Mesuré : le plus grand saut de luminance d'une
  ligne à la suivante sous la nav tombe de **0,027 à 0,0015** (× 17).
- **L'accroche tient sur une ligne.** Le pays est dans un
  `<span class="kick-geo">` masqué sous 720 px ; il reste « Celya · secrétariat
  téléphonique IA » (NL « Celya · AI-telefoonsecretariaat », EN « Celya · AI
  phone answering »). `.kick` sous 720 px : `line-height:1.4`,
  `align-items:center` (le symbole se centre sur la ligne), `letter-spacing`
  ramené à `.08em`, `gap:8px`. La dérogation `.kick-brand span{white-space:
  normal}` n'a plus lieu d'être et a disparu.
- **Une seule accroche passe encore à la ligne, et sous 480 px seulement** :
  celle du chapitre métiers (`.pc-head .kick`, 45 signes en casse normale à
  14 px), qui débordait le document de 4 px à 360 px — `body{overflow-x:hidden}`
  la rognait au lieu de la montrer. `white-space:normal` + `line-height:1.4`
  sous 480 px, le `letter-spacing` ne bouge pas. Vérifié :
  `document.scrollWidth == innerWidth` sur les trois accueils à 360, 390 et
  393 px, 9 cas sur 9.
- **Le h1 de l'accueil passe à `clamp(32px,8.5vw,40px)` sous 720 px** — seule
  dérogation à `--fs-display`, qui rendait 48 px et cinq lignes sur 393. Trois
  lignes en FR, deux en NL et EN.
- **Les deux boutons sont dans le premier écran.** Empilés, pleine largeur,
  `gap:12px`. Bas de « Prendre rendez-vous » : **509 px à 393 × 730** (seuil
  660) et **505 px à 360 × 640** (seuil 600) ; il était à 781 et 747.
- **Contraste** relevé sur le pixel le plus clair de la photo sous chaque bloc,
  texte masqué : accroche ≥ 5,18, h1 ≥ 7,20, paragraphe ≥ 6,07. Le seuil est
  4,5.
- **Le bandeau cookies ne recouvre plus les boutons.** Il se posait à 399 px du
  haut sur un écran de 640 (`bottom:84px`, 157 px de haut) et couvrait les deux
  boutons du héro dans 7 des 9 cas mesurés. Sous 720 px il devient une barre
  basse : `bottom:0`, pleine largeur, `border-radius:0`, bord haut seul,
  padding 12/16, message à 14 px sur deux lignes, Refuser / Accepter sur la
  ligne du message tant que 210 px lui suffisent et dessous sinon. **Hauteur
  107 px** dans huit cas sur neuf. Son fond passe de `rgba(13,18,32,.97)` à
  **`#0D1220` opaque** : en barre pleine largeur, 3 % d'un texte clair sur un
  panneau presque noir vaut quatre fois la luminance du fond, et le texte du
  dessous se lisait à travers. Même couleur, alpha à 1 — c'est la seule couleur
  que le lot déplace.
- **`--cbanner-h`** : `bento.js` publie la hauteur du bandeau sur
  `document.documentElement` à l'affichage, la met à jour sur le `onResize`
  commun et sur `document.fonts.ready`, et la retire au clic sur l'un ou
  l'autre bouton. `onResize` n'a pas de retrait : la fonction de mesure porte
  donc un drapeau et ne fait plus rien une fois le bandeau fermé — sans quoi
  elle réécrivait `--cbanner-h: 0px` sur un nœud détaché à chaque
  redimensionnement. Sous 720 px le héro rend `padding-bottom:calc(12px +
  var(--cbanner-h,0px))`. **Attention à ce que cette variable fait et ne fait
  pas** : le bandeau est `position:fixed`, le padding du héro ajoute de la
  place *sous* les boutons, il ne les remonte pas. Ce qui dégage les boutons,
  c'est la barre à `bottom:0` et sa hauteur plafonnée. Mesuré, bandeau
  affiché : **aucun élément de `.cta-row` recouvert, 9 cas sur 9**, dans les
  trois langues et aux trois tailles.
- **Reste ouvert** : en français à 360 px le message tient sur 3 lignes et le
  bandeau fait 126 px, au-dessus du plafond de 112. Le texte déroulé mesure
  796 px et il en faudrait 656 pour deux lignes — aucun réglage de gouttière ne
  comble 140 px, seule la formulation le peut. Le néerlandais passe à 1 px
  près (658 pour 656) : il tient, sans marge. Aucun bouton n'est recouvert dans
  ni l'un ni l'autre cas.
- Le budget de rendu tient : aucun `backdrop-filter` ni `will-change` ajouté,
  aucun `filter:` sur un élément qui bouge, aucun écouteur nouveau (le bandeau
  passe par le `onResize` commun).

## Budget de rendu (lot performance du 5 septembre 2026)

Le site n'est pas lourd, il était occupé : la décoration saturait le GPU et le
thread principal (page qui figeait Chrome, INP dégradé). Les règles qui en
sortent tiennent en cinq lignes et se vérifient d'un `grep` :

- `backdrop-filter` : **2 occurrences maximum** dans `bento.css` — la nav
  (`header.top`) et le menu déroulant (`.drop-panel`). Le troisième, le panneau
  du héro (`.hero-demo`), a disparu le 11 septembre 2026 : la vignette vidéo a
  pris sa place dans le héro de l'accueil, sans flou. Partout ailleurs, le verre
  dépoli est un fond `var(--glass)` (`rgba(14,20,38,.86)`) plus la bordure
  `--line`.
- **aucun `filter:` sur un élément qui bouge.** Le flou de l'aurore est calculé
  dans le canvas par `bento.js`, pas par le compositeur.
- **rien ne s'anime hors écran** : `bento.js` pose `.anim-off` sur chaque bloc
  sorti du viewport et sur chaque élément qui porte une animation ; le CSS met
  ses animations en pause. Vérifiable via `document.getAnimations()`.
- une seule boucle `requestAnimationFrame` (`RAF()`), un seul écouteur scroll
  et un seul resize (`onScroll` / `onResize`) ; **aucune mesure de mise en page
  dans une boucle** — passer par `vrect()` / `drect()`, qui sont en cache.
- `will-change` : **un seul élément**, le grain `body::after` (`.hero-demo`
  portait le second, il n'existe plus). Pas plus sans mesure.

Une animation qui change `height`, `box-shadow` ou `background-position`
repeint à chaque image : préférer `transform` / `opacity`, ou l'accepter en
connaissance de cause (le dégradé qui glisse sur les mots, `gpan`, l'est).

## Deux pièges du dépôt

- Le JSON-LD est en `@graph` : toujours le traiter comme tel.
- Neuf URL sont en 410 via `vercel.json` → `/api/gone`. **Ne jamais les lier.**

## Vérifications avant commit

```
python3 check.py     # h1 unique, title <= 60, desc 70-158, canonical,
                     # JSON-LD, FAQPage == texte visible, liens morts, 410
python3 sitemap.py
node sweep.js        # Chromium 360, 390, 768, 1280 et 1440 px, pages FR
node sweep_nl.js     # idem, pages NL
node sweep_en.js     # idem, pages EN (ajouté le 14/11/2026)
node .claude/hooks/verif-seo.js <fichiers>
node _src/build.mjs --check          # les pages publiées == ce que produit le générateur
node tests/seo-avant-apres.mjs       # title, description, H1, H2, FAQ, hreflang, @graph vs origin/main
node tests/offre.mjs                 # aucun montant hors data/offre.json, plus d'ancienne grille
node tests/tailles.mjs               # 12 px (libellés) / 14 px (phrases) minimum
node tests/heros.mjs                 # premier écran, contraste sur la vidéo, pause, poids (accueils + LP)
node tests/formulaire.mjs            # formulaire démo, UTM, dataLayer, barre mobile
node tests/budget-rendu.mjs          # backdrop-filter, will-change, keyframes, rAF, écouteurs
node tests/consentement.mjs          # bloc consentement + GTM identique à l'octet (hors texte du message, 17/11/2026)
node tests/migration.mjs             # toute page servie sur le nouveau gabarit (16/11/2026)
node tests/texte-conserve.mjs        # aucun paragraphe perdu par la migration
node tests/outils.mjs                # modèles, check-lists, grilles, calculateurs répondent
node tests/scene.mjs                 # la scène : placement, textes par métier, pause, mouvement réduit
node tests/lp.mjs                    # pages d'atterrissage : ordre des blocs, formulaire, liens, barre mobile
node tests/dates.mjs                 # chaque jour de la semaine correspond à sa date (2026 par défaut)
node tests/attribution.mjs           # UTM / gclid / fbclid : session sans accord, 90 jours après « Accepter », rien après « Refuser »
node tests/tiret-long.mjs            # aucun tiret long dans les fichiers servis, _src/ et data/ (19/11/2026)
```

**Le générateur (lot du 14/11/2026).** Les pages migrées ne s'éditent plus à
la main : leur source est `_src/pages/<chemin>.html`, les composants dans
`_src/components/`, les gabarits dans `_src/layouts/`, les données dans
`data/`. `node _src/build.mjs` réécrit les pages aux mêmes URL. Ne jamais
relancer un outil d'extraction de `_src/tools/` sur une page déjà générée : il
lit la page publiée, et l'ancienne n'existe plus que dans git.

Le faux positif connu de `contact.html` (le champ honeypot hors écran) est à
ignorer définitivement.

## Déploiement

**Le dépôt est relié à Vercel par l'intégration Git** (app Vercel for GitHub,
projet `celya-website`, équipe `bora`). Vérifié le 12 septembre 2026 sur
l'historique du projet : le seul déploiement Production est « Merge pull
request #26 », branche `main`, source Git. **`vercel --prod` n'est jamais
lancé.**

**Donc : fusionner vers `main` met en production, tout seul, dans la minute.**
Il n'y a pas de seconde étape, pas de garde-fou, pas de fenêtre pour se
raviser. Trois conséquences, dans cet ordre :

1. **Rien ne se fusionne sans que la prévisualisation ait été validée.** Chaque
   PR reçoit son déploiement de prévisualisation (le commentaire de
   `vercel[bot]` en porte l'URL) : c'est là que le travail se regarde, sur le
   vrai rendu et sur un vrai téléphone. La fusion vient après, jamais avant.
2. **Claude ne fusionne jamais.** Ouvrir la PR, oui ; la fusionner
   reviendrait à déployer. C'est Bora qui fusionne.
3. Le sitemap se resoumet dans la Search Console après coup, quand les URL
   ont bougé.

**Claude ne déploie jamais** — ce qui, ici, veut dire : ne pousse jamais sur
`main` et ne fusionne jamais une PR.
