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

Relevé au 28 août 2026 : 140 appels reçus · 118 classés par motif · 71 messages
pris · 90 rendez-vous dont 66 posés par l'agent · 0 enregistrement audio ·
37 tables sur 37 en RLS · médiane 1 min 14, moyenne 1 min 25 · 10 paires qui se
chevauchent, jusqu'à 3 conversations simultanées.

## Design

Aucun fichier CSS modifié, aucune règle, aucune variable, aucune couleur.
Aucun composant visuel nouveau. `bento.js` n'est jamais touché. Compléter une
série existante en suivant exactement le motif en place n'est pas une
modification du système.

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
