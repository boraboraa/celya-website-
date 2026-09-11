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

- aucun prix, aucune fourchette, aucun montant
- aucun concurrent nommé
- Celya ne remplace jamais une secrétaire
- l'agent n'évalue jamais un symptôme médical
- pas d'emailing, pas d'appels sortants, pas de WhatsApp
- pas de synchronisation Google Agenda ou Outlook annoncée, pas de SMS de confirmation
- aucune revendication multilingue au-delà de FR + NL **en promesse de service**
- **aucun chiffre sans sa source et sa date**

## L'entité : Celya Technologies SRL, et la TVA qui n'est pas encore là

Depuis le **04/09/2026**, l'éditeur du site est **Celya Technologies SRL**,
BCE **1042.115.837**, Avenue de Broqueville 136/1, 1200 Woluwe-Saint-Lambert,
administrateur Osman Bora Doğrul. L'ancienne société et son numéro ont quitté
le dépôt le 06/09/2026, et ne doivent jamais y revenir : un `grep -ri` sur
l'ancienne dénomination comme sur son numéro doit renvoyer **zéro**. Le siège,
lui, n'a pas bougé.

**La TVA n'est pas activée.** Le numéro se publie donc en une seule forme,
`BE 1042.115.837 — en cours d'activation` (NL : `activering loopt`, EN :
`activation in progress`), et **jamais seul**. Le pied de page, lui, porte le
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

Formulation autorisée pour l'agenda, FR : « Vous utilisez déjà un logiciel de
gestion ? Vous le gardez. Une connexion directe à votre outil peut être
étudiée — parlons-en. » NL : « Gebruikt u al software voor uw praktijk? Die
houdt u. Een rechtstreekse koppeling met uw tool kan bekeken worden — laten we
erover praten. »

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
node sweep.js        # Chromium 390 et 1280 px, pages FR
node sweep_nl.js     # idem, pages NL
node .claude/hooks/verif-seo.js <fichiers>
```

Le faux positif connu de `contact.html` (le champ honeypot hors écran) est à
ignorer définitivement.

## Déploiement

**Claude ne déploie jamais.** Bora merge et lance `vercel --prod` lui-même,
puis resoumet le sitemap dans la Search Console.
