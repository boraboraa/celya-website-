Retour de Bora sur la prévisualisation de la PR #32 (15/11/2026). Ce message remplace les retours précédents. Tout se fait dans la même PR #32, une seule PR.

AVANT DE COMMENCER
- Récupère les fichiers du nouveau héros, poussés sur la branche refonte-premium :
  git fetch origin refonte-premium && git checkout origin/refonte-premium -- assets/hero docs/maquettes-14-11/PROMPT-retour-15-11.md
- Contenu de assets/hero/ (boucles de 9 s, sans son, déjà compressées) :
  - hero-ordinateur-720.mp4 (1280×720, 620 Ko) et hero-ordinateur-poster.webp ;
  - hero-mobile-720.mp4 (720×1280, 730 Ko) et hero-mobile-poster.webp.
- Scène : un atelier-bureau crème et lumineux. Des collègues passent en discutant, un homme accroupi au fond se relève, un téléphone sonne sur un comptoir en chêne, et personne ne le regarde.

A. NOUVEAU HÉROS DE L'ACCUEIL (FR, NL, EN)
Il remplace l'ancien héros, la piste d'animation canvas « les appels qui arrivent » et le ruban d'appel.

1. Vidéo plein écran en fond, derrière la nav et le texte.
   - Balisage : <video muted loop playsinline autoplay preload="metadata" aria-hidden="true" poster="…">, sans contrôles, sans son.
   - Source : choisie une seule fois au chargement en JS. hero-mobile-720.mp4 sous 720 px de large, hero-ordinateur-720.mp4 au-dessus. Même logique pour le poster.
   - prefers-reduced-motion : poster seul, pas de lecture.
   - Hors écran : mise en pause par le système .anim-off existant ; reprise au retour.
   - Rendu : object-fit:cover ; object-position center sur ordinateur, center bottom sur téléphone.
   - Hauteur du héros : 100vh sur ordinateur, 100svh sur téléphone. La nav reste posée par-dessus.
2. Le texte, posé sur la vidéo, garde les couleurs du site (titre noir, italique corail, boutons actuels).
   - Ordinateur :
     - texte aligné à gauche dans la moitié gauche, max. 640 px, centré verticalement ;
     - voile crème de gauche à droite : var(--page) à 60 % à 0 %, 30 % à 40 %, transparent à 55 %.
   - Téléphone :
     - texte en haut, centré ;
     - voile crème de haut en bas : 88 % à 0 %, 70 % à 50 %, transparent à 66 %.
   - Contraste : mesure titre, phrase et boutons sur le pixel le plus clair de la vidéo, à 1440×900, 1280×800, 390×844 et 360×640. Seuil 4,5.
3. Retire du héros toutes les petites écritures, que Bora trouve « trop IA » :
   - l'accroche « Celya · secrétariat téléphonique IA · Belgique » au-dessus du H1 ;
   - la ligne « Elle vous répond et vous réserve une démo. » sous les boutons ;
   - les trois pastilles (24h/24, RGPD, IA) ;
   - « Ne nous croyez pas sur parole… » ;
   - la pastille « Offre fondateurs ».
   Le héros ne garde que le H1, une phrase et les deux boutons. Les badges Meta Tech Provider et Vérifiée par Google passent juste sous le héros, en tête de la section suivante. Même règle pour les héros de toutes les pages : pas d'accroche au-dessus du H1, pas de sous-ligne sous les boutons. Ne touche pas aux autres accroches de section, mais liste-les dans la PR pour que Bora tranche.
4. Étiquette en bas du héros, sur la vidéo :
   - placement : en bas à droite sur ordinateur, en bas au centre sur téléphone ;
   - forme : une pastille crème avec, à gauche, le symbole C animé de Celya en petit (environ 28 px, le .cv du ruban actuel, barres qui bougent) ;
   - libellés : FR « Appel entrant · Janet répond », NL « Inkomende oproep · Janet antwoordt », EN « Incoming call · Janet answers ».
5. Bas du héros fondu : les 20 % du bas de la vidéo se fondent dans le crème de la page (var(--page)), sans arête, pour que la section suivante arrive sans marche.
6. Effet au défilement, sur ordinateur et téléphone, sur les 60 % premiers de la hauteur du héros :
   - la vidéo grossit très légèrement (scale 1 → 1,06) et se dissout dans le crème (opacity 1 → 0) ;
   - le texte remonte de quelques pixels et s'efface ;
   - le symbole C animé de l'étiquette grandit et vient se poser au centre, en tête de la section suivante (environ 72 px), comme le sceau qui ouvre la suite de la page ; puis le contenu arrive ;
   - au retour vers le haut, tout se rejoue à l'envers.
   Contraintes :
   - transform et opacity seulement, pilotés par l'écouteur onScroll unique, à partir des mesures en cache (drect()/vrect()) ; aucune mesure de mise en page dans la boucle ;
   - aucun filter, backdrop-filter ni will-change ajouté ;
   - prefers-reduced-motion : aucun effet.
   C'est une exception explicite, décidée par Bora le 15/11/2026, à la règle « aucune opacité animée au-dessus de la ligne de flottaison ». Note-la dans CLAUDE.md avec ce qu'elle couvre.
7. Retire de l'accueil l'ancien bloc vidéo « Voir Celya en … » (vignette sombre aux visages néon) : le héros est désormais la vidéo. Garde les fichiers assets/video/ dans le dépôt.
8. Note dans CLAUDE.md, sous une section datée du 15/11/2026 :
   - le nouveau héros ;
   - les fichiers de assets/hero/ ;
   - l'exception d'opacité au défilement ;
   - le retrait des petites écritures.
   Une version 1080p de la vidéo ordinateur pourra remplacer la 720p plus tard, sous le même nom avec -1080 : prévois de pouvoir changer le fichier sans toucher au code.

B. PAGES MÉTIERS
9. Sous « Votre métier », les 10 autres métiers ouvrent encore les anciennes pages. Construis-les toutes sur le gabarit de garages.html, avec chacune sa photo de assets/metiers/ (déjà dans le dépôt pour les 11 métiers).
   - Jamais la même image deux fois sur une page.
   - Si un métier manque d'images pour ses cartes, n'invente rien. Liste dans la PR ce qu'il faut (métier, scène, format) : Bora les fera générer dans le même style crème.
10. Supprime le bloc « Combien vous coûtent les appels manqués ? » de l'accueil, et des pages métiers s'il y est. La page calculateur-appels-manques.html reste en ligne telle quelle (URL indexée), juste plus mise en avant.

C. WHATSAPP ET GOOGLE AGENDA
11. Ne dessine pas d'imitation de leurs interfaces. Prépare, dans un cadre de téléphone sobre aux couleurs Celya, les emplacements de vraies captures d'écran :
    - assets/captures/whatsapp-confirmation.webp ;
    - assets/captures/whatsapp-consignes.webp ;
    - assets/captures/google-agenda.webp.
    Tant que les fichiers n'existent pas, garde l'illustration actuelle avec la mention « Exemple ».

D. CORRECTIONS DE LA RELECTURE PRÉCÉDENTE
12. demo.html sur téléphone : le formulaire arrive après environ 1 000 px.
    - Ordre sous 720 px : H1 → une phrase → formulaire → encart « Appeler Janet » → étapes → badges.
    - Sur ordinateur, les badges passent côte à côte et le vide dessous disparaît.
13. Vides excessifs sous le bandeau « Sous une voiture… Elle, si. » et sous les badges de demo.html : ramène-les à --space-in.
14. Grille de prix : la carte « Premier répondant » n'a pas de bord orange au repos. Seule la carte Pro porte l'accent « Recommandé ».
15. Taille du texte : « 750 · Premier répondant » est en 11 px sur prix.html. Minimum 12 px pour les libellés en capitales, 14 px pour toute phrase. Contrôle toutes les pages.
16. Accueil sur téléphone : environ 21 700 px de haut.
    - Sous 720 px, replie « Ce que Janet fait pour vous » en <details> (le texte reste dans le HTML).
    - Retire ce qui répète « Comment ça marche ».
    - Donne la hauteur avant et après.

E. POINTS OUVERTS
- web-lead : le formulaire continue d'envoyer les nouveaux champs. La fonction sera adaptée dans un lot séparé, côté dépôt de l'agent.
  - Ici, vérifie seulement, en lisant le code, que les champs inconnus sont ignorés et non refusés.
  - Aucun envoi de test qui créerait un faux lead dans le CRM.
- Le secret écrit en dur dans web-lead : ne le recopie nulle part (ni PR, ni commit, ni commentaire).
- Tes autres points ouverts : applique l'option la plus prudente et la plus réversible, et liste-les dans la description de la PR avec l'alternative en une ligne.
- Pas besoin de surveiller la PR.

F. VÉRIFICATIONS
- Avant chaque commit : python3 check.py, python3 sitemap.py, node sweep.js, node sweep_nl.js, node sweep_en.js, node .claude/hooks/verif-seo.js sur les fichiers modifiés, et tous les tests de tests/.
- Débordement : document.scrollWidth == innerWidth sur toutes les pages à 360, 390 et 1280 px.
- Héros :
  - le premier écran montre H1, phrase et deux boutons à 1440×900, 390×844 et 360×640, bandeau cookies affiché ou non ;
  - aucun bouton recouvert ;
  - la vidéo est en pause hors écran (document.getAnimations() et video.paused) ;
  - poids total du premier écran sur téléphone sous 1,2 Mo.
- Relis FR et NL contre docs/vocabulaire-be.md.
- Tu ne fusionnes pas et tu ne pousses jamais sur main.
- Mets à jour la description de la PR : pages faites, mesures, URL de prévisualisation, et trois captures du héros (ordinateur, téléphone, pendant le défilement). Bora valide sur téléphone et fusionne lui-même.
