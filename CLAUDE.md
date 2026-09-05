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

## Les langues : on les nomme, on ne les compte pas

« Plus de N langues / talen / languages » reste **interdit partout** : un total
ne se vérifie pas. Le hook le bloque et continuera de le bloquer.

Ce qui est autorisé, c'est de **nommer** les langues, à une condition : chacune
doit figurer dans la documentation publique du moteur vocal. Source relevée le
31 août 2026 sur <https://elevenlabs.io/docs/overview/models> — Eleven Flash
v2.5, le modèle basse latence des agents, y liste nommément 32 langues, dont
les quatorze affichées sur les trois accueils : Français, Nederlands, Deutsch,
English, Español, Italiano, Português, Polski, Türkçe, العربية, Română,
Ελληνικά, Русский, 中文.

La légende du nuage sépare **deux choses**, et doit continuer à le faire :

1. **ce que le moteur gère** — les langues nommées dans le nuage ;
2. **ce qui tourne aujourd'hui** — « Chez nos clients belges, Janet répond en
   français et en néerlandais, et bascule d'une langue à l'autre en cours
   d'appel. Une autre langue ? Parlons-en. »

**L'allemand** peut figurer dans le nuage : c'est une capacité du moteur. Il ne
doit apparaître dans **aucune page** comme une promesse de service. Le hook
applique exactement ça : le motif `Deutsch | Duits*` est levé pour le seul bloc
`<div class="langcloud">` des trois pages d'accueil, et reste bloquant partout
ailleurs — y compris ailleurs sur ces trois pages, et y compris si le nuage est
recopié sur une autre page. Les cinq cas de contrôle sont dans l'historique du
lot 5.

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

## Budget de rendu (lot performance du 5 septembre 2026)

Le site n'est pas lourd, il était occupé : la décoration saturait le GPU et le
thread principal (page qui figeait Chrome, INP dégradé). Les règles qui en
sortent tiennent en cinq lignes et se vérifient d'un `grep` :

- `backdrop-filter` : **3 occurrences maximum** dans `bento.css` — la nav
  (`header.top`), le menu déroulant (`.drop-panel`) et le panneau du héro
  (`.hero-demo`). Partout ailleurs, le verre dépoli est un fond
  `var(--glass)` (`rgba(14,20,38,.86)`) plus la bordure `--line`.
- **aucun `filter:` sur un élément qui bouge.** Le flou de l'aurore est calculé
  dans le canvas par `bento.js`, pas par le compositeur.
- **rien ne s'anime hors écran** : `bento.js` pose `.anim-off` sur chaque bloc
  sorti du viewport et sur chaque élément qui porte une animation ; le CSS met
  ses animations en pause. Vérifiable via `document.getAnimations()`.
- une seule boucle `requestAnimationFrame` (`RAF()`), un seul écouteur scroll
  et un seul resize (`onScroll` / `onResize`) ; **aucune mesure de mise en page
  dans une boucle** — passer par `vrect()` / `drect()`, qui sont en cache.
- `will-change` : deux éléments (`.hero-demo`, le grain `body::after`). Pas
  plus sans mesure.

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
