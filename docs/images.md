# Provenance des images de `assets/`

Une ligne par fichier. Ce tableau existe pour qu'on sache, dans deux ans,
laquelle il faut remplacer et laquelle on peut garder.

**Sujet réel** décrit ce que la photo montre, pas ce que son nom laisse croire.
Le nom de fichier ment parfois : `cine-service` n'est pas une scène d'accueil,
c'est une assiette servie en salle.

Quand la provenance n'a pas pu être retrouvée, la case dit **« provenance non
retrouvée »**. Elle ne dit pas autre chose, et surtout pas une URL devinée.

Les images ajoutées le 31 août 2026 sont identifiées par leur nom de fichier
Unsplash. L'original se récupère à `https://images.unsplash.com/<fichier>`.
Les treize images antérieures ont été prises sur Unsplash — le message de
commit `8988659` le dit — mais aucune URL de photo n'a été consignée à
l'époque, et Unsplash ne permet pas la recherche inverse : elles restent donc
en « provenance non retrouvée ».

---

## Scènes cinématiques — 1600 × 1000 et 800 × 500

| Fichier | Sujet réel | Source | Licence | Date |
|---|---|---|---|---|
| `cine-accueil-1600.webp` · `-800` | Derrière les stores d'un bureau, une personne au téléphone tard le soir | Unsplash, fichier `photo-1777357916048-d89a46b71169` | Unsplash License (usage commercial, sans attribution obligatoire) | 2026-08-31 |
| `cine-poste-1600.webp` · `-800` | Un poste de travail éclairé d'une lampe : clavier, mains, téléphone de bureau, le soir | Unsplash, fichier `photo-1758520145138-fad6db286b9d` | Unsplash License | 2026-08-31 |
| `cine-ferme-1600.webp` · `-800` | Le rideau métallique d'un commerce, baissé sous une applique, la nuit | Unsplash, fichier `photo-1736334667060-f6e42dd444b1` | Unsplash License | 2026-08-31 |
| `cine-chauffage-1600.webp` · `-800` | Deux mains ajustant un raccord sur un appareil de chauffage | Unsplash, fichier `photo-1745571479558-9e4bdb6ac59f` | Unsplash License | 2026-08-31 |
| `cine-veterinaire-1600.webp` · `-800` | Une patte de chien posée dans deux mains ouvertes. **Ce n'est pas une salle d'examen** — voir la réserve en bas de page | Unsplash, fichier `photo-1584015437353-4dd19e892ae9` | Unsplash License | 2026-08-31 |
| `cine-immeuble-1600.webp` · `-800` | La cage d'escalier d'un immeuble ancien, éclairée par une fenêtre | Unsplash, fichier `photo-1759150509437-36d874ccd74d` | Unsplash License | 2026-08-31 |
| `cine-mobile-1600.webp` · `-800` | Un smartphone écran allumé posé sur un plan de travail sombre | Unsplash, fichier `photo-1698874306913-dd31782dc18a` | Unsplash License | 2026-08-31 |
| `cine-artisan-1600.webp` · `-800` | Un râtelier de pinces et de tenailles dans un atelier — **pas** un artisan | Unsplash — provenance non retrouvée (URL de la photo absente du dépôt et du journal git) | Unsplash License, d'après le message de commit `8988659` | 2026-08-10 |
| `cine-atelier-1600.webp` · `-800` | Une main serrant une clé sur un moteur, dans la pénombre | Unsplash — provenance non retrouvée | Unsplash License, d'après `8988659` | 2026-08-10 |
| `cine-cabinet-1600.webp` · `-800` | Un médecin **humain** en blouse blanche, téléphone en main, sur fond clair | Unsplash — provenance non retrouvée | Unsplash License, d'après `8988659` | 2026-08-10 |
| `cine-garage-1600.webp` · `-800` | Un mécanicien devant un capot ouvert, atelier éclairé | Unsplash — provenance non retrouvée | Unsplash License, d'après `8988659` | 2026-08-10 |
| `cine-phone-1600.webp` · `-800` | Un téléphone à cadran ancien sur un mur bleu nuit | Unsplash — provenance non retrouvée | Unsplash License, d'après `8988659` | 2026-08-10 |
| `cine-restaurant-1600.webp` · `-800` | Le comptoir et l'ardoise d'un bar, lumières chaudes | Unsplash — provenance non retrouvée | Unsplash License, d'après `8988659` | 2026-08-10 |
| `cine-service-1600.webp` · `-800` | Une assiette servie en salle, verres et convives — **pas** un accueil | Unsplash — provenance non retrouvée | Unsplash License, d'après `8988659` | 2026-08-10 |
| `cine-independant-1600.webp` · `-800` | Un homme au volant, le soir, téléphone en main | Unsplash — provenance non retrouvée | Unsplash License, présumée | 2026-08-12 |
| `blog-cabinet-1600.webp` · `-800` | Un bureau **vide** : portable fermé, téléphone fixe, personne | Unsplash — provenance non retrouvée | Unsplash License, présumée | 2026-08-12 |
| `blog-garage-1600.webp` · `-800` | Un mécanicien en gants, penché sur une pièce | Unsplash — provenance non retrouvée | Unsplash License, présumée | 2026-08-12 |
| `hero-independant-1600.webp` · `-800` | Un homme assis à l'arrière d'un véhicule, face à un plan d'eau | Unsplash — provenance non retrouvée | Unsplash License, présumée | 2026-08-12 |

## Vignettes de menu — 112 × 84

Le menu déroulant et le menu mobile affichent la vignette en **56 × 42 CSS**.
Servir le fichier 1000 × 700 pour ça coûtait **389 Ko sur chacune des 290
pages**. Chaque `metier-*.webp` a donc un jumeau `metier-*-112.webp`, même
cadrage, redimensionné à 112 × 84 (le double de la taille d'affichage, pour
les écrans à densité 2×), de 1,2 à 5,7 Ko pièce — 36 Ko pour les onze.

**Règle :** dans `.drop-panel` et `.mnav-grid`, toujours le `-112`. Le fichier
1000 × 700 reste réservé aux grandes tuiles `.pcard` des trois pages d'accueil.
Même provenance et même licence que son grand frère, ligne par ligne
ci-dessous : c'est le même fichier source.

Les sept masters 1000 × 700 des métiers ajoutés le 31 août ne sont, à ce jour,
utilisés par aucune tuile `.pcard` — seuls les quatre vitrines en ont une. Ils
sont conservés parce qu'une tuile pour ces métiers en aurait besoin, et parce
qu'ils sont la source des vignettes de menu.

## Vignettes métier — 1000 × 700

| Fichier | Sujet réel | Source | Licence | Date |
|---|---|---|---|---|
| `metier-chauffagiste.webp` | Le corps d'une chaudière en gros plan, tuyauteries et vanne | Unsplash, fichier `photo-1737292273837-854222bd200c` | Unsplash License | 2026-08-31 |
| `metier-electricien.webp` | Une main gantée testant un tableau électrique | Unsplash, fichier `photo-1758101755915-462eddc23f57` | Unsplash License | 2026-08-31 |
| `metier-plombier.webp` | Pince multiprise, pomme de douche et bec de robinet sur une ardoise | Unsplash, fichier `photo-1580401410158-1f0b0a406762` | Unsplash License | 2026-08-31 |
| `metier-serrurier.webp` | Une clé posée sur un fond sombre, faible profondeur de champ | Unsplash, fichier `photo-1634979149798-e9a118734e93` | Unsplash License | 2026-08-31 |
| `metier-syndic.webp` | Une rangée de boîtes aux lettres d'immeuble sur un mur ocre | Unsplash, fichier `photo-1771532631713-19f3f7b020c2` | Unsplash License | 2026-08-31 |
| `metier-fiduciaire.webp` | Un bureau vu de dessus : carnet ouvert, stylo, tasse, portable | Unsplash, fichier `photo-1668713239048-0746aac1fec1` | Unsplash License | 2026-08-31 |
| `metier-veterinaire.webp` | Les pattes avant d'un chien posées sur une planche de bois | Unsplash, fichier `photo-1585481128031-d52d5ac047c3` | Unsplash License | 2026-08-31 |
| `metier-artisan.webp` | Un soudeur au travail, masque baissé, gerbe d'étincelles | Unsplash — provenance non retrouvée | Unsplash License, présumée | 2026-08-09 |
| `metier-cabinet.webp` | Un stéthoscope posé sur un drap blanc | Unsplash — provenance non retrouvée | Unsplash License, présumée | 2026-08-09 |
| `metier-garage.webp` | Deux mains sous un capot ouvert, notice à la main | Unsplash — provenance non retrouvée | Unsplash License, présumée | 2026-08-09 |
| `metier-restaurant.webp` | Une assiette servie en salle, verres à vin — même scène que `cine-service` | Unsplash — provenance non retrouvée | Unsplash License, présumée | 2026-08-09 |

## Images de marque et images sociales

| Fichier | Sujet réel | Source | Licence | Date |
|---|---|---|---|---|
| `janet-avatar-64/128/256/512.png`, `janet-avatar-128/256.webp` | Portrait de Janet, l'agent vocal — image de synthèse | Production interne Celya — provenance non retrouvée (générateur non consigné) | Interne | 2026-07-14 (PNG) · 2026-08-08 (WebP) |
| `janet-hero.png` · `.webp`, `janet-square.png` | Même portrait, cadrages hero et carré | Production interne Celya — provenance non retrouvée | Interne | 2026-07-14 · 2026-08-08 |
| `og-blog-cabinet.jpg` | Image de partage de l'article « cabinets » | Recadrage de `blog-cabinet` — provenance amont non retrouvée | Unsplash License, présumée | 2026-08-12 |
| `og-blog-garage.jpg` | Image de partage de l'article « garages » | Recadrage de `blog-garage` — provenance amont non retrouvée | Unsplash License, présumée | 2026-08-12 |
| `og-blog-independant.jpg` | Image de partage de l'article « indépendants » | Recadrage de `cine-independant` — provenance amont non retrouvée | Unsplash License, présumée | 2026-08-12 |
| `og-blog-restaurant.jpg` | Image de partage de l'article « restaurants » | Recadrage de `cine-restaurant` — provenance amont non retrouvée | Unsplash License, présumée | 2026-08-12 |
| `favicon.svg`, `og-image.png` | Marque Celya | Production interne | Interne | — |
| `assets/fonts/*.woff2` | Geist et Instrument Serif, auto-hébergées | Google Fonts | SIL Open Font License 1.1 | 2026-08-11 |

---

## Ce qu'on vérifie avant d'ajouter une image

1. **Licence** — usage commercial explicite, sans attribution obligatoire.
   Si la licence n'est pas nommable, l'image n'entre pas. Une case vide vaut
   mieux qu'une image dont on ne sait rien.
2. **Droit à l'image** — ces licences ne couvrent pas l'autorisation de la
   personne photographiée. Donc pas de visage net et identifiable : mains,
   dos, profil, contre-jour, geste.
3. **Contenu** — aucun logo, aucune marque, aucun texte lisible, aucune plaque,
   rien qui date la photo.
4. **Style** — se relire contre le relevé ci-dessous, pas contre une intention.

## Relevé de style, mesuré sur les fichiers

- **Deux formats de scène coexistent** : 1600 × 1000 / 800 × 500 (rapport 1,6)
  et 1600 × 1067 / 800 × 533 (rapport 1,5). Les scènes ajoutées en août 2026
  sont toutes en 1,6. `hero-independant` est seul en 1600 × 1148.
- **Vignettes** : 1000 × 700 exactement, rapport 1,429.
- **Poids mesurés** : scènes 800 px de 17 à 100 Ko · scènes 1600 px de 44 à
  231 Ko · vignettes de 15 à 50 Ko.
- **Luminance** — médianes de 17 à 181 sur 255. Le gros du corpus vit entre
  17 et 120 : sombre à mi-sombre. Deux exceptions claires assumées,
  `cine-cabinet` et `metier-cabinet`, toutes deux médicales.
- **Deux familles de teinte** : bleu froid 192–213° (`cine-phone`,
  `cine-garage`, `cine-independant`, `blog-cabinet`, `blog-garage`,
  `hero-independant`, `metier-artisan`) et ambre chaud 25–37° (`cine-atelier`,
  `cine-cabinet`, `cine-restaurant`, `cine-service`, `metier-restaurant`).
- **Cadrage** : serré, faible profondeur de champ, sujet isolé. Des mains, un
  dos, un profil — jamais un visage net qui regarde l'objectif.
- **Contraste** : noirs profonds, dixième centile souvent entre 0 et 30.

## Réserves consignées

**`cine-mobile`** porte, sur l'écran du téléphone, une heure et la fin d'un
libellé de notification. Mesuré : à la largeur d'affichage réelle le fragment
fait moins de 30 px et n'est pas lisible. Ce n'est ni une marque ni une plaque.
La réserve est notée ici pour qu'on puisse trancher autrement un jour.

**`cine-veterinaire` n'est pas une salle d'examen.** Le sujet cherché était un
cabinet vétérinaire avec un animal. Sur Unsplash, toutes les photos de cabinet
vétérinaire trouvées — vétérinaire en blouse, stéthoscope, table d'examen —
sont sous **Unsplash+**, une licence payante : elles ne satisfont pas la règle
« usage commercial sans attribution obligatoire ». Une photo de cabinet libre a
bien été trouvée et traitée (`photo-1630438994394-3deff7a591bf`, un chien sur
la table d'examen), puis **écartée** : le harnais du chien porte un motif de
marque parfaitement lisible. La scène retenue est donc une patte de chien dans
deux mains — juste sur le sujet et sur le geste, muette sur le décor. À
remplacer le jour où une vraie scène de cabinet devient disponible sous licence
claire.

**Sujet non sourcé.** Aucun. Les treize sujets demandés ont tous trouvé une
image sous licence nommable ; seul le vétérinaire a dû se rabattre sur un
cadrage plus étroit que celui demandé, pour la raison ci-dessus.
