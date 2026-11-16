#!/usr/bin/env python3
"""Textes devenus faux (brief du 14/11, section 5), appliqués une fois aux
sources des pages migrées : visible ET JSON-LD (FAQPage), et inscrits dans
tests/corrections-autorisees.json (FAQ modifiées ; passages retirés pour
tests/texte-conserve.mjs). Les formulations suivent CLAUDE.md : agenda
(Google Agenda relié / agenda Celya, Outlook pas relié), messages aux clients
liés à l'appel seulement (WhatsApp, SMS de secours), montants et quotas en
jetons {{offre.…}}.

    python3 _src/tools/corrections_16_11.py [pages…]
"""
import html as H, json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
NB = '&nbsp;'

AGENDA = "Votre Google Agenda, relié&nbsp;: Janet lit vos disponibilités et y écrit les rendez-vous. Pas d'agenda&nbsp;? Prenez celui de Celya, intégré et pensé pour votre métier."
LIES = "les seuls messages qu'ils reçoivent sont liés à leur appel&nbsp;: confirmation, rappel, modification de rendez-vous"
QUOTAS = "{{offre.essentiel.agendas}} en {{offre.essentiel.nom}}, {{offre.pro.agendas}} en {{offre.pro.nom}}, {{offre.premier.agendas}} en {{offre.premier.nom}}"

C = {
 'prise-de-rendez-vous.html': [
  ('txt', "<b>l'agent écrit dans l'agenda de Celya, pas dans Google Agenda ni dans Outlook.</b>",
          "<b>" + AGENDA.replace('Votre Google', 'votre Google') + "</b>"),
  ('txt', "<p>Il n'y a aucune synchronisation avec un agenda externe. Vous consultez le vôtre depuis un navigateur, et c'est là que les rendez-vous apparaissent. Pour beaucoup d'indépendants et de petites structures, c'est sans conséquence&nbsp;: le seul agenda qui compte devient celui-là. Si vous tenez absolument à voir vos rendez-vous dans un outil externe, dites-le avant de signer — ce n'est pas ce que nous faisons aujourd'hui.</p>",
          "<p>Outlook, en revanche, n'est pas relié aujourd'hui. Si c'est l'outil qui tient votre journée, dites-le avant de signer&nbsp;: les rendez-vous s'écriront dans l'agenda de Celya, que vous consultez depuis un navigateur. Pour beaucoup d'indépendants et de petites structures, c'est sans conséquence&nbsp;: le seul agenda qui compte devient celui-là.</p>"),
  ('faq', "Est-ce que ça se synchronise avec Google Agenda ou Outlook&nbsp;?",
          "Avec Google Agenda, oui. " + AGENDA + " Outlook, lui, n'est pas relié aujourd'hui."),
  ('faq', "Le client reçoit-il une confirmation&nbsp;?",
          "Oui, avec les formules {{offre.pro.nom}} et {{offre.premier.nom}}&nbsp;: un message de confirmation sur WhatsApp avec trois boutons — Confirmer, Déplacer, Annuler —, puis un rappel avant le rendez-vous. Le client qui n'a pas WhatsApp la reçoit par SMS. Ce sont les seuls messages envoyés à vos clients, et ils sont tous liés à leur appel."),
 ],
 'prise-de-message.html': [
  ('txt', "<p>Elle ne le transmet ni par SMS ni par e-mail à votre client, et ne le rappelle pas à votre place&nbsp;: l'agent ne passe aucun appel sortant.</p>",
          "<p>Le résumé de l'appel vous arrive sur WhatsApp. Votre client, lui, ne reçoit qu'un message lié à son appel — une confirmation, un rappel, une modification de rendez-vous —, et Janet ne le rappelle pas à votre place&nbsp;: l'agent ne passe aucun appel sortant.</p>"),
  ('faq', "L'agent peut-il envoyer le message par SMS ou par e-mail&nbsp;?",
          "Le message vous est transmis à vous, sur WhatsApp, avec le résumé de l'appel. À vos clients, Celya n'envoie que des messages liés à leur appel — confirmation, rappel, modification —, sur WhatsApp, et par SMS seulement s'ils n'ont pas WhatsApp. Aucun e-mail, aucun appel sortant."),
 ],
 'plan-de-charge.html': [
  ('faq', "Est-ce que ça se synchronise avec mon logiciel de réservation&nbsp;?",
          "Avec Google Agenda, oui&nbsp;: Janet lit vos disponibilités et y écrit les rendez-vous. Un autre logiciel de réservation n'est pas relié aujourd'hui&nbsp;: la capacité et les rendez-vous se gèrent alors dans l'agenda de Celya, intégré et pensé pour votre métier."),
 ],
 'est-ce-legal-en-belgique.html': [
  ('txt', "Aucun appel sortant, aucune campagne, aucun SMS, aucun e-mail vers vos clients — ni techniquement, ni contractuellement.",
          "Aucun appel sortant, aucune campagne, aucun message publicitaire vers vos clients — ni techniquement, ni contractuellement&nbsp;: " + LIES + "."),
 ],
 'securite.html': [
  ('txt', "<li><b>Aucun appel sortant, aucun SMS, aucun e-mail</b></li>",
          "<li><b>Aucun appel sortant, aucun message publicitaire</b></li>"),
 ],
 'traitement-des-donnees.html': [
  ('txt', "L'agent ne passe aucun appel sortant et n'envoie ni SMS ni e-mail.",
          "L'agent ne passe aucun appel sortant, et les seuls messages qu'il envoie sont liés à un appel&nbsp;: confirmation, rappel ou modification d'un rendez-vous, sur WhatsApp, ou par SMS quand la personne n'a pas WhatsApp."),
 ],
 'fiduciaires.html': [
  ('faq', "Est-ce qu'elle peut réclamer des documents manquants&nbsp;?",
          "Sur appel entrant, oui&nbsp;: si un client appelle et qu'il figure sur votre liste d'attente de pièces, elle peut lui rappeler ce qui manque. En revanche elle ne relance personne d'elle-même — aucun appel sortant, aucun message de relance. La relance active reste chez vous."),
 ],
 'syndics.html': [
  ('faq', "Est-ce qu'elle envoie des e-mails ou des SMS aux copropriétaires&nbsp;?",
          "Pas de communication de masse. Elle traite les appels entrants&nbsp;: aucun appel sortant, aucun envoi groupé, aucun e-mail. Les seuls messages qu'un copropriétaire peut recevoir sont liés à son propre appel — confirmation, rappel ou modification d'un rendez-vous —, sur WhatsApp, ou par SMS s'il n'a pas WhatsApp. La communication écrite vers l'ACP reste entièrement de votre côté."),
 ],
 'numero-belge.html': [
  ('txt', "<p>C'est possible, et cela se discute au moment de la proposition.",
          "<p>C'est possible&nbsp;: on vous en fournit un, et cela se règle au moment de la mise en service."),
  ('faq', "Puis-je avoir un numéro fourni par vous&nbsp;?",
          "Oui&nbsp;: si vous n'avez pas de numéro, ou si vous en voulez un distinct, on vous en fournit un. Ce n'est pas le montage par défaut&nbsp;: garder votre numéro est presque toujours la meilleure option."),
 ],
 'plusieurs-personnes-plusieurs-agendas.html': [
  ('txt', "<p>Vous utilisez déjà un logiciel de gestion pour vos plannings&nbsp;? <b>Vous le gardez.</b> Rien ne vous demande d'en changer, d'en sortir vos données, ou d'apprendre autre chose.</p>",
          "<p>Vos plannings sont dans Google Agenda&nbsp;? <b>Ils sont reliés&nbsp;:</b> Janet lit les disponibilités de chacun et y écrit les rendez-vous. Pas d'agenda&nbsp;? Prenez celui de Celya, intégré et pensé pour votre métier.</p>"),
  ('txt', "<p>Celya prend les appels que vous ne prenez pas, et vous transmet le rendez-vous, la personne concernée et le motif. Vos plannings restent là où ils sont, tenus comme vous les tenez.</p>",
          "<p>Le nombre d'agendas dépend de la formule&nbsp;: " + QUOTAS + ". Pour chaque rendez-vous, le résumé de l'appel vous arrive sur WhatsApp, avec la personne concernée et le motif.</p>"),
  ('txt', "<p>Une connexion directe à votre outil peut être étudiée — c'est une discussion à avoir au téléphone, parce que la réponse dépend entièrement de ce que vous utilisez et de la façon dont vous vous en servez. Nous préférons en parler que de l'écrire ici.</p>",
          "<p>Un autre logiciel de planning n'est pas relié aujourd'hui, Outlook non plus. Nous préférons l'écrire ici que vous le laisser découvrir.</p>"),
  ('faq', "Est-ce que je dois changer de logiciel&nbsp;?",
          "Pas si c'est Google Agenda&nbsp;: il est relié, Janet y lit vos disponibilités et y écrit les rendez-vous. Pas d'agenda&nbsp;? Prenez celui de Celya, intégré et pensé pour votre métier. Un autre logiciel n'est pas relié aujourd'hui."),
  ('faq', "Une connexion à mon outil est-elle possible&nbsp;?",
          "Avec Google Agenda, oui, c'est en service. Avec Outlook ou un autre outil, pas aujourd'hui."),
  ('faq', "Combien de personnes peut-on gérer&nbsp;?",
          "Selon la formule&nbsp;: " + QUOTAS + ". Le vrai sujet reste la règle de répartition, qui se décide à la mise en service."),
 ],
 'y-a-t-il-des-frais-d-installation.html': [
  ('txt', "<p>Nous n'affichons aucun montant sur ce site, et cette page ne fera pas exception. Les modalités — y compris l'existence ou non de frais de mise en service — figurent dans votre proposition, après avoir regardé votre activité réelle.</p>",
          "<p>Il y a des frais de mise en service, et ils sont écrits&nbsp;: une mensualité de votre formule, une seule fois. Les formules elles-mêmes sont détaillées sur la <a href=\"prix.html\">page des prix</a>.</p>"),
  ('txt', "S'il y a un poste de mise en service, il paie du temps de configuration, pas du matériel.</p>",
          "La mise en service paie du temps de configuration, pas du matériel.</p>"),
  ('faq', "Y a-t-il des frais de mise en service&nbsp;?",
          "Oui&nbsp;: une mensualité de votre formule, une seule fois. Elle paie du temps de configuration, pas du matériel."),
 ],
 'combien-coute-un-secretariat-telephonique.html': [
  ('txt', "<p>Ce n'est pas une coquetterie commerciale, et l'explication tient en un exemple.",
          "<p>Pendant longtemps, nous n'en avons affiché aucun. Ce n'était pas une coquetterie commerciale, et l'explication tenait en un exemple."),
  ('txt', "<p><b>Ce que nous garantissons en revanche&nbsp;: pas de frais cachés, pas de supplément d'amplitude horaire, et rien à installer chez vous.</b></p>",
          "<p>Depuis novembre 2026, nous publions trois formules, parce qu'elles disent ce que ces grilles taisent&nbsp;: {{offre.liste_prix}}&nbsp;€ hors TVA par mois, pour {{offre.liste_minutes}} minutes de conversation, décomptées à la seconde, et ce qui se passe au-delà. Tout est sur la <a href=\"prix.html\">page des prix</a>.</p>\n<p><b>Ce que nous garantissons en revanche&nbsp;: pas de frais cachés, pas de supplément d'amplitude horaire, et rien à installer chez vous.</b></p>"),
  ('faq', "Vous facturez à l'appel ou au forfait&nbsp;?",
          "Au forfait&nbsp;: trois formules mensuelles, chacune avec un volume de minutes décomptées à la seconde. Si vous dépassez, vous passez à la formule du dessus."),
  ('faq', "Y a-t-il des frais de mise en service&nbsp;?",
          "Oui&nbsp;: une mensualité de votre formule, une seule fois. Il y a un travail de configuration réel — vos horaires, vos règles, vos réponses types — et c'est ce qui sépare un agent qui répond juste d'un agent générique."),
  ('faq', "Que se passe-t-il si mon volume explose en saison&nbsp;?",
          "Vous passez à la formule du dessus. Au-delà de {{offre.max_minutes}} minutes, c'est sur devis. C'est prévu et écrit avant, pas découvert sur une facture."),
 ],
 'comment-se-passe-la-facturation.html': [
  ('txt', "<p>Nous n'affichons aucun montant sur ce site. Ce que nous pouvons dire, c'est ce qui fait varier une proposition d'un client à l'autre.</p>",
          "<p>Nos montants sont publics&nbsp;: trois formules mensuelles, sur la <a href=\"prix.html\">page des prix</a>. Ce qui fait passer un client d'une formule à l'autre&nbsp;:</p>"),
  ('txt', "<p><b>La complexité de la configuration</b>&nbsp;: un métier avec trois motifs standards et un métier avec des durées variables, plusieurs praticiens et des règles d'urgence ne demandent pas le même travail de mise en service.</p>",
          "<p><b>Le nombre d'agendas</b>&nbsp;: " + QUOTAS + ".</p>"),
  ('txt', "<p>C'est pour cela que la proposition vient après avoir regardé votre activité, et pas avant.</p>",
          "<p>C'est pour cela que nous regardons votre activité avec vous avant de choisir la formule, et pas après.</p>"),
  ('faq', "À quelle fréquence suis-je facturé&nbsp;?",
          "Chaque mois&nbsp;: les trois formules sont mensuelles. C'est ce qui détermine dans quel exercice l'écriture tombe."),
  ('faq', "Qu'est-ce qui fait varier le prix&nbsp;?",
          "La formule&nbsp;: le volume de minutes et sa répartition, l'amplitude horaire que vous voulez couvrir, et le nombre d'agendas. La nuit et le week-end ne coûtent rien de plus."),
  ('faq', "Pourquoi n'affichez-vous pas de grille&nbsp;?",
          "Nous l'affichons désormais&nbsp;: trois formules, {{offre.liste_prix}}&nbsp;€ hors TVA par mois, détaillées sur la page des prix."),
 ],
 'si-je-depasse-mon-volume.html': [
  ('txt', "<p>Chez nous, les modalités figurent dans votre proposition, et elles se discutent après avoir regardé votre année plutôt que votre semaine — précisément pour éviter un seuil calé sur un mois qui ne vous ressemble pas.</p>",
          "<p>Chez nous, c'est écrit&nbsp;: chaque formule comprend un volume de minutes, décomptées à la seconde, et si vous dépassez, vous passez à la formule du dessus. Au-delà de {{offre.max_minutes}} minutes, c'est sur devis.</p>"),
  ('faq', "Y a-t-il un volume inclus&nbsp;?",
          "Oui&nbsp;: {{offre.liste_minutes}} minutes par mois selon la formule, décomptées à la seconde. Toute offre à forfait comporte une limite quelque part&nbsp;; chez nous, elle est écrite."),
  ('faq', "Que se passe-t-il au-delà&nbsp;?",
          "Chez nous, vous passez à la formule du dessus&nbsp;; au-delà de {{offre.max_minutes}} minutes, c'est sur devis. Ailleurs, selon les offres&nbsp;: facturation à l'unité, changement de palier, ou dégradation du service. La troisième forme est celle à surveiller, et elle doit être écrite."),
 ],
 'est-ce-que-je-paie-si-personne-n-appelle.html': [
  ('txt', "<p>Nous n'affichons aucun montant sur ce site et les modalités de votre proposition se discutent après avoir regardé votre activité. Ce que nous pouvons faire ici, c'est expliquer ce que chaque structure produit.</p>",
          "<p>Chez Celya, c'est un forfait&nbsp;: trois formules mensuelles, détaillées sur la <a href=\"prix.html\">page des prix</a>. Ce que nous pouvons faire ici, c'est expliquer ce que chaque structure produit.</p>"),
  ('faq', "Je paie même sans appel&nbsp;?",
          "Cela dépend de la structure&nbsp;: à l'usage, un mois creux coûte peu&nbsp;; au forfait, vous payez la disponibilité. Chez Celya, c'est un forfait mensuel&nbsp;: la formule se paie aussi un mois sans appel."),
  ('faq', "Y a-t-il un volume inclus&nbsp;?",
          "C'est la question à poser à n'importe quelle offre, y compris la nôtre&nbsp;: y a-t-il un seuil, et que se passe-t-il au-delà. Chez nous, {{offre.liste_minutes}} minutes selon la formule&nbsp;; au-delà, vous passez à la formule du dessus."),
 ],
 'combien-de-temps-pour-etre-operationnel.html': [
  ('txt', '<meta property="og:description" content="Quelques jours pour que ça marche.', '<meta property="og:description" content="48 heures pour que ça marche.'),
  ('txt', '<meta name="twitter:description" content="Quelques jours pour que ça marche.', '<meta name="twitter:description" content="48 heures pour que ça marche.'),
  ('txt', "<p>Ce qui prend les quelques jours, c'est", "<p>Ce qui prend ces quarante-huit heures, c'est"),
  ('txt', "<p>Donc oui&nbsp;: quelques jours après l'accord, la ligne répond", "<p>Donc oui&nbsp;: dans les 48 heures après l'accord, la ligne répond"),
  ('faq', "Combien de temps avant que la ligne réponde&nbsp;?",
          "Dans les 48 heures après l'accord, le temps de décrire votre activité et vos règles. La déviation elle-même prend effet sur l'appel suivant."),
 ],
 'independants.html': [
  ('faq', "Est-ce qu'elle parle néerlandais ?",
          "Oui. Chez nos clients belges, Janet répond en français et en néerlandais, et bascule d'une langue à l'autre en cours d'appel."),
  ('txt', "En français, néerlandais et anglais.", "En français et en néerlandais."),
 ],
 'restaurants.html': [
  ('txt', "<li><b>Français, néerlandais ou anglais</b></li>", "<li><b>Français ou néerlandais</b></li>"),
  ('txt', "en français, néerlandais et anglais.", "en français et en néerlandais."),
 ],
 'blog/cabinets-serveur-vocal-appels.html': [
  ('txt', "elle décroche et elle parle, en français, en néerlandais ou en anglais, selon la langue du patient.",
          "elle décroche et elle parle, en français ou en néerlandais, selon la langue du patient."),
 ],
 'blog/independants-rappels-oublies.html': [
  ('txt', "Elle parle français, néerlandais et anglais, et bascule automatiquement dans la langue de l'appelant.",
          "Elle répond en français et en néerlandais, et bascule d'une langue à l'autre en cours d'appel."),
 ],
 'blog/restaurants-reservations-telephone.html': [
  ('txt', "<p>Français, néerlandais, anglais : elle bascule automatiquement dans la langue de l'appelant.",
          "<p>Français et néerlandais : elle bascule d'une langue à l'autre en cours d'appel."),
 ],
}

PRIX = 'Nos seuls montants publics sont ceux de nos trois formules, sur la <a href="prix.html">page des prix</a>'
def add(rel, items):
    C.setdefault(rel, []).extend(items)

add('agenda-en-ligne-ou-rendez-vous-par-telephone.html', [
  ('txt', "<p><b>Vous avez déjà un logiciel métier&nbsp;?</b> Vous le gardez. Nous prenons les appels que vous ne prenez pas, et nous vous transmettons le rendez-vous et le motif&nbsp;; une connexion directe peut être étudiée au cas par cas — c'est une conversation à avoir au téléphone.</p>",
          "<p><b>Vous avez déjà un agenda&nbsp;?</b> Si c'est Google Agenda, il est relié&nbsp;: Janet lit vos disponibilités et y écrit les rendez-vous. Pas d'agenda&nbsp;? Prenez celui de Celya, intégré et pensé pour votre métier. Un autre logiciel de réservation, ou Outlook, n'est pas relié aujourd'hui&nbsp;: vous recevez alors chaque rendez-vous et son motif dans le résumé de l'appel, sur WhatsApp.</p>"),
  ('faq', "J'ai déjà un logiciel de réservation, que devient-il&nbsp;?",
          "Vous le gardez. S'il s'agit de Google Agenda, il est relié&nbsp;: Janet y lit vos disponibilités et y écrit les rendez-vous. Un autre logiciel n'est pas relié aujourd'hui&nbsp;: vous recevez chaque rendez-vous et son motif dans le résumé de l'appel, sur WhatsApp."),
])
add('agent-vocal-ou-telesecretariat-humain.html', [
  ('txt', "<p>Nous n'affichons aucun montant sur ce site et nous ne relevons aucun tarif chez d'autres.", "<p>" + PRIX + ", et nous ne relevons aucun tarif chez d'autres."),
  ('faq', "Lequel coûte le moins cher&nbsp;?",
          "Cela dépend de votre amplitude et de votre volume. Nos trois formules sont sur la page des prix&nbsp;; ce que nous pouvons dire ici est structurel&nbsp;: le coût d'un télésecrétariat humain suit les heures couvertes, celui d'une ligne automatisée non."),
])
add('c-est-quoi-un-telesecretariat.html', [
  ('faq', "Combien ça coûte&nbsp;?",
          "Cela dépend du modèle et de votre volume. Chez Celya, trois formules mensuelles, à partir de {{offre.min_prix}}&nbsp;€ hors TVA par mois, détaillées sur la page des prix."),
])
add('cabinets.html', [
  ('txt', "<p><b>Vous utilisez déjà un logiciel de gestion de cabinet&nbsp;?</b> Vous le gardez. Celya prend les appels que vous ne prenez pas et vous transmet le rendez-vous et le motif, sous une forme que votre secrétariat reporte en quelques secondes. Une connexion directe à votre outil peut être étudiée&nbsp;— c'est une discussion à avoir au téléphone, parce que la réponse dépend de votre logiciel&nbsp;: il n'existe aujourd'hui aucun format d'agenda commun aux logiciels du secteur.</p>",
          "<p><b>Votre agenda est un Google Agenda&nbsp;?</b> Il est relié&nbsp;: Janet lit les disponibilités de chaque praticien et y écrit les rendez-vous. Pas d'agenda&nbsp;? Prenez celui de Celya, intégré et pensé pour votre métier. Un logiciel de gestion de cabinet n'est pas relié aujourd'hui&nbsp;: Celya vous transmet alors le rendez-vous et le motif, sous une forme que votre secrétariat reporte en quelques secondes.</p>"),
])
add('electriciens.html', [
  ('faq', "Est-ce qu'elle peut annoncer un tarif horaire&nbsp;?",
          "Oui, si vous lui en confiez un. Elle annonce ce que vous avez autorisé, sans jamais s'engager au-delà, et bascule sur une prise de rendez-vous dès qu'un chiffrage sérieux est nécessaire."),
])
add('serruriers.html', [
  ('faq', "Est-ce qu'elle peut annoncer mes tarifs de nuit&nbsp;?",
          "Oui, si vous lui confiez les vôtres. Elle annonce ce que vous avez autorisé, dans les termes que vous avez écrits, et ne s'engage jamais au-delà. Beaucoup de serruriers y tiennent&nbsp;: annoncer clairement évite la discussion sur le pas de la porte."),
])
add('engager-ou-externaliser-son-accueil.html', [
  ('txt', "<p>La première est une règle que nous tenons partout sur ce site&nbsp;: nous n'affichons aucun montant, et nous ne relevons pas de tarifs chez d'autres pour les comparer aux nôtres. Les modalités d'une proposition se discutent après avoir regardé une activité réelle.</p>",
          "<p>La première est une règle que nous tenons partout sur ce site&nbsp;: nos seuls montants publics sont ceux de nos trois formules, sur la <a href=\"prix.html\">page des prix</a>, et nous ne relevons pas de tarifs chez d'autres pour les comparer aux nôtres.</p>"),
  ('faq', "Pourquoi n'y a-t-il aucun prix sur cette page&nbsp;?",
          "Parce que nos montants vivent sur une seule page, celle des prix, et parce qu'une comparaison par les prix compare deux choses qui ne rendent pas le même service."),
])
add('forfait-ou-facturation-a-l-appel.html', [
  ('txt', "<p>Nous n'affichons aucun montant sur ce site, et nous ne relevons pas de tarifs chez d'autres pour les comparer aux nôtres.", "<p>" + PRIX + ", et nous ne relevons pas de tarifs chez d'autres pour les comparer aux nôtres."),
])
add('je-ne-peux-pas-embaucher-une-secretaire.html', [
  ('txt', "<p>Les modalités de la vôtre figurent dans votre proposition&nbsp;: nous n'affichons aucun montant sur ce site, et nous ne comparons pas des tarifs relevés chez d'autres.",
          "<p>Nos formules sont publiques&nbsp;: trois formules mensuelles, sur la <a href=\"prix.html\">page des prix</a>, et nous ne comparons pas des tarifs relevés chez d'autres."),
  ('faq', "Combien ça coûte&nbsp;?",
          "Trois formules mensuelles, à partir de {{offre.min_prix}}&nbsp;€ hors TVA par mois, détaillées sur la page des prix. La bonne se choisit après avoir regardé votre volume et vos horaires réels."),
])
add('prise-de-rendez-vous.html', [
  ('txt', "<p><b>Vous avez déjà un logiciel métier&nbsp;?</b> Vous le gardez. Nous prenons les appels que vous ne prenez pas, et nous vous transmettons le rendez-vous et le motif&nbsp;; ce que vous en faites ensuite dans votre outil vous appartient. Une connexion directe peut être étudiée au cas par cas&nbsp;— c'est une conversation à avoir au téléphone, pas une case à cocher sur une page.</p>",
          "<p><b>Vous avez déjà un logiciel métier&nbsp;?</b> Si c'est Google Agenda, il est relié. Sinon, vous le gardez&nbsp;: nous vous transmettons le rendez-vous et le motif dans le résumé de l'appel, sur WhatsApp, et ce que vous en faites ensuite dans votre outil vous appartient. Un autre logiciel n'est pas relié aujourd'hui.</p>"),
])
add('si-je-recois-peu-d-appels.html', [
  ('txt', "<b>Nous n'affichons aucun montant sur ce site et cette page ne fera pas exception</b> — les modalités figurent dans votre proposition. Ce que nous pouvons faire,",
          "<b>Nos seuls montants publics sont ceux de nos trois formules</b>, sur la <a href=\"prix.html\">page des prix</a>. Ce que nous pouvons faire ici,"),
])
add('transfert-vers-un-humain.html', [
  ('faq', "Le transfert coûte-t-il quelque chose&nbsp;?",
          "Non&nbsp;: le transfert des urgences vers votre portable est compris dans chaque formule. Les trois formules sont sur la page des prix."),
])
add('veterinaires.html', [
  ('txt', "<p><b>Vous travaillez déjà avec un logiciel de gestion de clinique&nbsp;?</b> Vous le gardez. Celya prend les appels que vous ne prenez pas et vous transmet le rendez-vous et le motif&nbsp;; le report chez vous reste une opération de quelques secondes. Une connexion directe à votre outil peut être étudiée&nbsp;— parlons-en, la réponse dépend de ce que vous utilisez.</p>",
          "<p><b>Votre agenda est un Google Agenda&nbsp;?</b> Il est relié&nbsp;: Janet lit vos disponibilités et y écrit les rendez-vous. Pas d'agenda&nbsp;? Prenez celui de Celya, intégré et pensé pour votre métier. Un logiciel de gestion de clinique n'est pas relié aujourd'hui&nbsp;: Celya vous transmet alors le rendez-vous et le motif, et le report chez vous reste une opération de quelques secondes.</p>"),
])

# ---------- néerlandais ----------
AG_NL = "Uw Google Agenda, gekoppeld: Janet leest uw beschikbaarheid en zet de afspraken erin. Geen agenda? Neem dat van Celya, ingebouwd en afgestemd op uw vak."
QUOTAS_NL = "{{offre.essentiel.agendas}} in {{offre.essentiel.nom}}, {{offre.pro.agendas}} in {{offre.pro.nom}}, {{offre.premier.agendas}} in {{offre.premier.nom}}"
PRIJS_NL = 'Onze enige publieke bedragen zijn die van onze drie formules, op de <a href="prijzenpagina">prijzenpagina</a>'.replace('href="prijzenpagina"', 'href="prijzen.html"')
add('nl/aanwerven-of-uitbesteden.html', [
  ('txt', "Aan de kant van uitbesteden staat er geen bedrag op deze site — de voorwaarden staan in\nuw voorstel.", "Aan de kant van uitbesteden staan onze drie formules op de <a href=\"prijzen.html\">prijzenpagina</a>."),
  ('faq', "Staat er een prijs tegenover&nbsp;?", "Ja: onze drie formules staan op de prijzenpagina, vanaf {{offre.min_prix}}&nbsp;€ per maand exclusief btw."),
])
add('nl/afspraken-vastleggen.html', [
  ('txt', "<p>Er is geen enkele synchronisatie met een externe agenda. U raadpleegt de uwe vanuit een browser, en daar verschijnen de afspraken. Voor veel zelfstandigen en kleine structuren is dat zonder gevolg: de enige agenda die telt, wordt die.</p>",
          "<p>" + AG_NL + " Die van Celya raadpleegt u vanuit een browser, en daar verschijnen de afspraken. Outlook is vandaag niet gekoppeld.</p>"),
  ('txt', "<p>Gebruikt u al software voor uw praktijk? Die houdt u. Een rechtstreekse koppeling met uw tool kan bekeken worden — laten we erover praten.</p>",
          "<p>Gebruikt u andere software voor uw praktijk? Die houdt u. Ze is vandaag niet gekoppeld: u krijgt elke afspraak met de reden in de samenvatting van de oproep, op WhatsApp.</p>"),
  ('faq', "Synchroniseert dit met een externe agenda?", "Met Google Agenda, ja: Janet leest uw beschikbaarheid en zet de afspraken erin. Geen agenda? Neem dat van Celya, ingebouwd en afgestemd op uw vak. Outlook en andere software zijn vandaag niet gekoppeld."),
  ('faq', "Krijgt de klant een bevestiging?", "Ja, met de formules {{offre.pro.nom}} en {{offre.premier.nom}}: een bevestiging op WhatsApp met drie knoppen — Bevestigen, Verplaatsen, Annuleren —, daarna een herinnering vóór de afspraak. Een klant zonder WhatsApp krijgt ze per sms. Dat zijn de enige berichten aan uw klanten, en ze hangen allemaal samen met hun oproep."),
])
add('nl/belgisch-nummer-houden.html', [
  ('txt', "<p>Dat kan, en het wordt besproken bij het voorstel.", "<p>Dat kan: wij bezorgen u er een, en dat regelen we bij de opstart."),
])
add('nl/berichten-noteren.html', [
  ('txt', "<p>Ze stuurt het niet per sms of e-mail naar uw klant, en ze belt hem niet terug in uw plaats: de agent voert geen enkele uitgaande oproep.</p>",
          "<p>De samenvatting van de oproep komt bij u op WhatsApp. Uw klant krijgt alleen een bericht dat met zijn oproep te maken heeft — een bevestiging, een herinnering, een gewijzigde afspraak —, en Janet belt hem niet terug in uw plaats: de agent voert geen enkele uitgaande oproep.</p>"),
  ('faq', "Kan de agent het bericht per sms of e-mail versturen?", "Het bericht gaat naar u, op WhatsApp, met de samenvatting van de oproep. Aan uw klanten stuurt Celya alleen berichten die met hun oproep te maken hebben — bevestiging, herinnering, wijziging —, op WhatsApp, en per sms alleen als ze geen WhatsApp hebben. Geen e-mail, geen uitgaande oproep."),
])
add('nl/betaal-ik-als-niemand-belt.html', [
  ('txt', "<p>Wij publiceren geen bedragen op deze site en de modaliteiten van uw voorstel worden besproken na een blik op uw activiteit.", "<p>Bij Celya is het een forfait: drie maandformules, op de <a href=\"prijzen.html\">prijzenpagina</a>."),
  ('faq', "Betaal ik ook zonder oproepen?", "Dat hangt van de structuur af: per gebruik kost een kalme maand weinig; per forfait betaalt u de beschikbaarheid. Bij Celya is het een maandforfait: de formule loopt ook in een maand zonder oproepen."),
])
add('nl/boven-het-volume.html', [
  ('faq', "Is er een inbegrepen volume?", "Ja: {{offre.liste_minutes}} minuten per maand volgens de formule, per seconde aangerekend. Elk forfaitair aanbod draagt ergens een grens; bij ons staat ze op papier."),
  ('faq', "Wat gebeurt er voorbij de grens?", "Bij ons schakelt u over naar de formule erboven; boven {{offre.max_minutes}} minuten: op offerte. Elders, naargelang het aanbod: per stuk betalen, een hoger forfait, of een dienst die inbindt. De derde vorm is die om te bewaken, en ze moet geschreven staan."),
])
add('nl/capaciteitsplan.html', [
  ('faq', "Synchroniseert dit met mijn reservatiesoftware?", "Met Google Agenda, ja: Janet leest uw beschikbaarheid en zet de afspraken erin. Andere reservatiesoftware is vandaag niet gekoppeld: de capaciteit en de afspraken worden dan beheerd in de agenda van Celya, ingebouwd en afgestemd op uw vak."),
])
add('nl/forfait-of-per-oproep.html', [
  ('txt', "Er staat hier geen bedrag: de voorwaarden staan in uw voorstel.", "Er staat hier geen bedrag: onze drie formules staan op de prijzenpagina."),
  ('txt', "Onze voorwaarden staan in uw voorstel, na een blik op uw echte activiteit — en er is", "Onze drie formules staan op de <a href=\"prijzen.html\">prijzenpagina</a> — en er is"),
])
add('nl/geen-secretaresse-aanwerven.html', [
  ('txt', "<p>Er staat op deze site geen bedrag, en deze pagina maakt daar geen uitzondering op: de voorwaarden staan in uw voorstel.", "<p>Op deze pagina staat geen bedrag: onze drie formules staan op de <a href=\"prijzen.html\">prijzenpagina</a>."),
  ('faq', "Staat er een prijs op deze pagina&nbsp;?", "Nee: onze drie formules staan op de prijzenpagina, vanaf {{offre.min_prix}}&nbsp;€ per maand exclusief btw."),
])
add('nl/hoe-verloopt-de-facturatie.html', [
  ('txt', "<p>Wij publiceren geen bedragen op deze site. Wat we wél kunnen zeggen: wat een voorstel van klant tot klant doet verschillen.</p>",
          "<p>Onze bedragen zijn publiek: drie maandformules, op de <a href=\"prijzen.html\">prijzenpagina</a>. Wat een klant van de ene formule naar de andere doet gaan:</p>"),
  ('faq', "Hoe vaak word ik gefactureerd?", "Elke maand: de drie formules zijn maandformules. Dat bepaalt in welk boekjaar de boeking valt."),
  ('faq', "Wat doet de prijs variëren?", "De formule: het volume minuten en zijn spreiding, de uren die u wilt dekken, en het aantal agenda's. 's Nachts en in het weekend kost het niets meer."),
  ('faq', "Waarom publiceert u geen prijstabel?", "Dat doen we nu wel: drie formules, {{offre.liste_prix}}&nbsp;€ per maand exclusief btw, op de prijzenpagina."),
])
add('nl/hoelang-tot-de-start.html', [
  ('txt', '<meta property="og:description" content="Enkele dagen om te antwoorden.', '<meta property="og:description" content="48 uur om te antwoorden.'),
  ('txt', '<meta name="twitter:description" content="Enkele dagen om te antwoorden.', '<meta name="twitter:description" content="48 uur om te antwoorden.'),
  ('txt', "<p>Wat de enkele dagen vraagt, is wat eraan voorafgaat:", "<p>Wat die 48 uur vraagt, is wat eraan voorafgaat:"),
  ('txt', "<p>Dus ja: enkele dagen na het akkoord antwoordt de lijn", "<p>Dus ja: binnen 48 uur na het akkoord antwoordt de lijn"),
  ('faq', "Hoelang voor de lijn antwoordt?", "Binnen 48 uur na het akkoord, de tijd om uw activiteit en uw regels te beschrijven. De doorschakeling zelf werkt vanaf de volgende oproep."),
])
add('nl/hoeveel-kost-een-telefoonsecretariaat.html', [
  ('txt', "<p>Geen commerciële koketterie; één voorbeeld volstaat.", "<p>Lange tijd stond hier geen enkel bedrag. Geen commerciële koketterie; één voorbeeld volstond."),
  ('txt', "<p>Wat wij wél garanderen: geen verborgen kosten, geen toeslag voor avonden of weekends, en niets te installeren bij u.</p>",
          "<p>Sinds november 2026 publiceren we drie formules, omdat ze zeggen wat die tabellen verzwijgen: {{offre.liste_prix}}&nbsp;€ per maand exclusief btw, voor {{offre.liste_minutes}} minuten gesprekken, per seconde aangerekend, en wat er daarboven gebeurt. Alles staat op de <a href=\"prijzen.html\">prijzenpagina</a>.</p>\n<p>Wat wij wél garanderen: geen verborgen kosten, geen toeslag voor avonden of weekends, en niets te installeren bij u.</p>"),
  ('faq', "Factureert u per oproep of per forfait?", "Per forfait: drie maandformules, elk met een volume minuten, per seconde aangerekend. Gaat u erover, dan schakelt u over naar de formule erboven."),
  ('faq', "Zijn er opstartkosten?", "Ja: één maandbedrag van uw formule, één keer. Er is echte configuratietijd — uw uren, uw regels, uw typische antwoorden. Dat onderscheidt een lijn die juist antwoordt van een generieke."),
  ('faq', "Wat als mijn volume in het seizoen ontploft?", "Dan schakelt u over naar de formule erboven. Boven {{offre.max_minutes}} minuten: op offerte. Dat staat vooraf op papier, het wordt niet ontdekt op een factuur."),
])
add('nl/installatiekosten.html', [
  ('txt', "<p>Wij publiceren geen bedragen op deze site, en deze pagina is geen uitzondering. De modaliteiten — ook het al dan niet bestaan van opstartkosten — staan in uw voorstel, na een blik op uw echte activiteit.</p>",
          "<p>Er zijn opstartkosten, en ze staan op papier: één maandbedrag van uw formule, één keer. De formules zelf staan op de <a href=\"prijzen.html\">prijzenpagina</a>.</p>"),
  ('txt', "Als er een opstartpost is, betaalt die configuratietijd, geen materiaal.</p>", "De opstart betaalt configuratietijd, geen materiaal.</p>"),
  ('faq', "Zijn er opstartkosten?", "Ja: één maandbedrag van uw formule, één keer. Ze betaalt configuratietijd, geen materiaal."),
])
add('nl/is-het-legaal-in-belgie.html', [
  ('txt', "Geen uitgaande oproep, geen campagne, geen sms, geen e-mail naar uw klanten — technisch niet, contractueel niet.",
          "Geen uitgaande oproep, geen campagne, geen reclamebericht naar uw klanten — technisch niet, contractueel niet: de enige berichten die ze krijgen, hangen samen met hun oproep: bevestiging, herinnering, gewijzigde afspraak."),
])
add('nl/meerdere-agendas.html', [
  ('txt', "<p>Gebruikt u al software voor uw praktijk? Die houdt u. Niets vraagt u ervan te veranderen, er uw gegevens uit te halen of iets nieuws te leren.</p>",
          "<p>Staan uw planningen in Google Agenda? <b>Die zijn gekoppeld:</b> Janet leest ieders beschikbaarheid en zet de afspraken erin. Geen agenda? Neem dat van Celya, ingebouwd en afgestemd op uw vak.</p>"),
  ('txt', "<p>Celya neemt de oproepen op die u niet opneemt, en bezorgt u de afspraak, de betrokken persoon en het motief. Uw planningen blijven waar ze zijn, bijgehouden zoals u ze bijhoudt.</p>",
          "<p>Het aantal agenda's hangt af van de formule: " + QUOTAS_NL + ". Voor elke afspraak komt de samenvatting van de oproep op uw WhatsApp, met de betrokken persoon en het motief.</p>"),
  ('txt', "<p>Een rechtstreekse koppeling met uw tool kan bekeken worden — laten we erover praten: het antwoord hangt volledig af van wat u gebruikt en hoe.</p>",
          "<p>Andere planningssoftware is vandaag niet gekoppeld, Outlook ook niet. Dat schrijven we liever hier dan dat u het later ontdekt.</p>"),
  ('faq', "Moet ik van software veranderen?", "Niet als het Google Agenda is: die is gekoppeld, Janet leest er uw beschikbaarheid en zet de afspraken erin. Geen agenda? Neem dat van Celya, ingebouwd en afgestemd op uw vak. Andere software is vandaag niet gekoppeld."),
  ('faq', "Is een koppeling met mijn tool mogelijk?", "Met Google Agenda, ja, dat draait. Met Outlook of andere software, vandaag niet."),
  ('faq', "Hoeveel personen kunnen erop?", "Volgens de formule: " + QUOTAS_NL + ". De echte vraag blijft de verdeelregel, en die wordt bij de start beslist."),
])
add('nl/online-agenda-of-telefoon.html', [
  ('txt', "Uw planning blijft waar ze is. Een rechtstreekse koppeling met uw tool kan bekeken worden — laten we erover praten.</p>",
          "Uw planning blijft waar ze is. Staat ze in Google Agenda, dan is ze gekoppeld: Janet leest uw beschikbaarheid en zet de afspraken erin. Andere software is vandaag niet gekoppeld.</p>"),
  ('faq', "Hoe vermijd ik dubbele boekingen&nbsp;?", "De vrije momenten die de lijn mag aanbieden, worden vooraf afgesproken. Met Google Agenda, gekoppeld, leest Janet uw beschikbaarheid rechtstreeks; andere software is vandaag niet gekoppeld."),
])
add('nl/sectoren.html', [
  ('txt', "<p>Een rechtstreekse koppeling met uw tool kan worden onderzocht — daar praten we het best even over, want het antwoord hangt volledig af van wat u gebruikt.</p>",
          "<p>" + AG_NL + " Andere beheerprogramma's en Outlook zijn vandaag niet gekoppeld.</p>"),
  ('faq', "Moet ik van software veranderen&nbsp;?", "Nee. U houdt wat u gebruikt: Celya geeft u de afspraak, de persoon en de reden door. Google Agenda is gekoppeld; andere software is vandaag niet gekoppeld."),
])
add('nl/wat-is-een-telefoonsecretariaat.html', [
  ('faq', "Wat kost het?", "Dat hangt af van model en volume. Bij Celya: drie maandformules, vanaf {{offre.min_prix}}&nbsp;€ per maand exclusief btw, op de prijzenpagina."),
])
add('nl/weinig-oproepen.html', [
  ('txt', "Wij publiceren geen bedragen op deze site, en deze pagina is geen uitzondering.", PRIJS_NL + "."),
])
add('nl/blog/praktijken-keuzemenu-oproepen.html', [
  ('txt', "ze neemt op en ze praat, in het Nederlands, in het Frans of in het Engels, volgens de taal van de patiënt.", "ze neemt op en ze praat, in het Nederlands of in het Frans, volgens de taal van de patiënt."),
])
add('nl/blog/restaurants-telefonische-reserveringen.html', [
  ('txt', "<p>Nederlands, Frans, Engels: ze schakelt automatisch naar de taal van de beller", "<p>Nederlands en Frans: ze schakelt tijdens het gesprek naar de taal van de beller"),
])
add('nl/blog/zelfstandigen-gemiste-terugbelverzoeken.html', [
  ('txt', "Ze spreekt Nederlands, Frans en Engels, en schakelt automatisch naar de taal van de beller", "Ze antwoordt in het Nederlands en het Frans, en schakelt tijdens het gesprek naar de taal van de beller"),
])

# ---------- anglais ----------
add('en/blog/medical-practices-phone-menu.html', [
  ('txt', "she picks up and she talks, in French, Dutch or English, depending on the patient’s language.", "she picks up and she talks, in French or Dutch, depending on the patient’s language."),
])

# ---------- métiers NL / EN (lot du 16/11) ----------
add('nl/dierenartsen.html', [
  ('txt', "<p>Gebruikt u al een praktijkprogramma? U houdt het. Celya neemt de oproepen op die u niet opneemt en geeft de afspraak en de reden door. Een rechtstreekse koppeling kan worden onderzocht — daar praten we het best even over.</p>",
          "<p>Uw Google Agenda, gekoppeld: Janet leest uw beschikbaarheid en zet de afspraken erin. Geen agenda? Neem dat van Celya, ingebouwd en afgestemd op uw vak. Gebruikt u een praktijkprogramma? U houdt het: het is vandaag niet gekoppeld, en Celya geeft u de afspraak en de reden door.</p>"),
  ('faq', "Moet ik van praktijksoftware veranderen&nbsp;?",
          "Nee. Google Agenda is gekoppeld; een praktijkprogramma is vandaag niet gekoppeld: u houdt wat u gebruikt en krijgt de afspraak en de reden doorgegeven."),
])
add('en/restaurants.html', [
  ('txt', "<li><b>French, Dutch or English</b></li>", "<li><b>French or Dutch</b></li>"),
])

# ---------- fonctionnalités (brief, section 5.4 ; maquette page-fonctionnalites) ----------
COMP = '<!--@composants {"liste":["agenda","orders","confirm"],"exemple":"garages"}-->\n'
add('fonctionnalites.html', [
  ('txt', "quand une capacité n'existe pas — la synchronisation avec un agenda externe, par exemple — il y a une phrase qui le dit",
          "quand une capacité n'existe pas — la synchronisation avec Outlook, par exemple — il y a une phrase qui le dit"),
  ('txt', '<a href="numero-belge.html"><b>Numéro belge</b><span>Vous gardez le vôtre. Rien ne bouge pour vos clients.</span></a>',
          '<a href="numero-belge.html"><b>Numéro belge</b><span>Vous gardez le vôtre, ou on vous en fournit un. Rien ne bouge pour vos clients.</span></a>'),
  ('txt', "<a href=\"horaires-et-garde.html\"><b>Horaires et garde</b><span>Vos heures, vos exceptions, vos congés — appliqués à la lettre.</span></a>",
          "<a href=\"horaires-et-garde.html\"><b>Horaires et garde</b><span>Vos heures, vos exceptions, vos congés — appliqués à la lettre.</span></a>\n"
          "<a href=\"#consignes\"><b>WhatsApp</b><span>Le résumé de chaque appel, directement sur votre WhatsApp.</span></a>\n"
          "<a href=\"#confirmations\"><b>Confirmations clients</b><span>Confirmer, déplacer, annuler&nbsp;: vos clients répondent en un clic.</span></a>\n"
          "<a href=\"#confirmations\"><b>SMS de secours</b><span>Pas de WhatsApp chez votre client&nbsp;? La confirmation part en SMS.</span></a>\n"
          "<a href=\"#agenda\"><b>Agenda</b><span>Google Agenda relié, ou l'agenda Celya intégré. Plusieurs agendas dès la formule {{offre.pro.nom}}.</span></a>\n"
          "<a href=\"#consignes\"><b>Consignes par WhatsApp</b><span>Congés, horaires, créneaux bloqués&nbsp;: vous écrivez, elle applique.</span></a>"),
  ('txt', "<p><b>Aucune synchronisation avec un agenda externe.</b> L'agent écrit les rendez-vous dans l'agenda de Celya, que vous consultez depuis un navigateur. Il n'écrit pas dans Google Agenda ni dans Outlook, et nous n'avons pas de page «&nbsp;intégrations&nbsp;» — c'est une exclusion volontaire, pas un oubli.</p>\n"
          "<p><b>Aucun appel sortant, aucune campagne, aucun SMS, aucun e-mail vers vos clients.</b> Celya répond au téléphone&nbsp;; elle ne prospecte pas et ne relance personne à votre place.</p>\n"
          "<p><b>Aucune évaluation médicale.</b> L'agent n'apprécie aucun symptôme et ne prend aucune décision clinique&nbsp;: il applique les critères de transfert écrits par le cabinet.</p>\n"
          "<p><b>Aucun engagement contractuel pris à votre place.</b> Il annonce ce que vous l'avez autorisé à annoncer et bascule sur une prise de message dès qu'une demande dépasse ce périmètre.</p>",
          "<p>Ce qui n'est pas dans cette liste n'est pas en service. On préfère vous le dire ici que le découvrir en appel.</p>\n"
          "<p><b>Pas d'appels sortants.</b> Aucune prospection, aucune campagne. Celya répond au téléphone&nbsp;; elle ne démarche personne.</p>\n"
          "<p><b>Pas de messages publicitaires.</b> Les seuls messages envoyés à vos clients sont ceux liés à leur appel&nbsp;: confirmation, rappel, modification.</p>\n"
          "<p><b>Aucune évaluation médicale.</b> Elle n'apprécie aucun symptôme&nbsp;: elle applique les critères de transfert écrits par le praticien.</p>\n"
          "<p><b>Aucun engagement à votre place.</b> Elle annonce ce que vous l'avez autorisée à annoncer et prend un message pour le reste.</p>\n"
          "<p><b>Outlook n'est pas relié.</b> Google Agenda l'est&nbsp;; Outlook, pas aujourd'hui.</p>"),
  ('faq', "Y a-t-il des intégrations avec Google Agenda ou Outlook&nbsp;?",
          "Oui, Google Agenda&nbsp;: les rendez-vous s'écrivent dedans et Janet ne propose que les créneaux libres. Sans agenda, vous utilisez l'agenda Celya intégré. Outlook, pas aujourd'hui."),
  ('faq', "Est-ce que l'agent passe des appels sortants&nbsp;?",
          "Non. Celya traite les appels entrants, uniquement. Aucun appel sortant, aucune campagne, aucun message publicitaire&nbsp;: les seuls messages envoyés à vos clients sont liés à leur appel — confirmation, rappel, modification."),
  ('faq', "Combien de temps pour tout configurer&nbsp;?",
          "En ligne en 48 heures. Le plus long n'est pas technique&nbsp;: c'est de rassembler ce que l'agent doit savoir — vos horaires, vos prestations, ce que vous refusez, ce qui vous réveille la nuit."),
  ('txt', '<!--@faq {"kick":"Questions fréquentes","id":"faq-fonctions"}-->', COMP + '<!--@faq {"kick":"Questions fréquentes","id":"faq-fonctions"}-->'),
])
add('nl/werking.html', [
  ('txt', '<a href="belgisch-nummer-houden.html"><b>Uw Belgisch nummer</b><span>U houdt het uwe. Er beweegt niets.</span></a>',
          '<a href="belgisch-nummer-houden.html"><b>Uw Belgisch nummer</b><span>U houdt het uwe, of wij bezorgen u er een. Er beweegt niets.</span></a>\n'
          '<a href="#consignes"><b>WhatsApp</b><span>De samenvatting van elke oproep, rechtstreeks op uw WhatsApp.</span></a>\n'
          '<a href="#confirmations"><b>Bevestigingen voor klanten</b><span>Bevestigen, verplaatsen, annuleren: uw klanten antwoorden met één klik.</span></a>\n'
          '<a href="#confirmations"><b>Sms als vangnet</b><span>Geen WhatsApp bij uw klant? De bevestiging vertrekt per sms.</span></a>\n'
          "<a href=\"#agenda\"><b>Agenda</b><span>Google Agenda gekoppeld, of de ingebouwde agenda van Celya. Meerdere agenda's vanaf de formule {{offre.pro.nom}}.</span></a>\n"
          '<a href="#consignes"><b>Instructies via WhatsApp</b><span>Verlof, uren, geblokkeerde slots: u schrijft, zij past toe.</span></a>'),
  ('txt', "<p>Gebruikt u al een beheerprogramma? U houdt het. Celya neemt de oproepen op die u niet opneemt en geeft u de afspraak en de reden door. Een rechtstreekse koppeling met uw tool kan worden onderzocht — daar praten we het best even over.</p>",
          "<p>" + AG_NL + " Outlook en andere beheerprogramma's zijn vandaag niet gekoppeld. En <b>ze stuurt geen reclameberichten</b>: de enige berichten aan uw klanten hangen samen met hun oproep — bevestiging, herinnering, gewijzigde afspraak.</p>"),
  ('faq', "Moet ik van software veranderen&nbsp;?",
          "Nee. Google Agenda is gekoppeld: Janet leest uw beschikbaarheid en zet de afspraken erin. Andere software is vandaag niet gekoppeld: Celya geeft u dan de afspraak en de reden door."),
  ('txt', '<!--@faq {"kick":"Veelgestelde vragen","id":"faq-werking"}-->', COMP + '<!--@faq {"kick":"Veelgestelde vragen","id":"faq-werking"}-->'),
])

def ld(s):
    """texte tel qu'il s'écrit dans le JSON-LD : sans balise, sans entité."""
    return H.unescape(re.sub(r'<[^>]+>', '', s)).replace(' ', ' ')

def flex(s):
    """motif qui accepte espace ou espace insécable là où le texte a un espace"""
    return re.escape(s).replace('\\ ', '[ \u00a0]')

def apply(rel, items, allow):
    p = os.path.join(ROOT, '_src/pages', rel)
    src = open(p, encoding='utf-8').read()
    i = src.index('<!--@', src.index('<!--@head-->') + 5)
    head, body = src[:i], src[i:]
    page = allow['pages'].setdefault(rel, {})
    for kind, old, new in items:
        if kind == 'txt':
            if old in new and (new in body or new in head):
                continue                      # ajout déjà fait (l'ancien texte est contenu dans le nouveau)
            hit = False
            if old in body:
                body = body.replace(old, new); hit = True
            if old.startswith('<meta') and old in head:
                head = head.replace(old, new); hit = True
            elif not old.startswith('<meta') and ld(old).strip() and re.search(flex(json.dumps(ld(old), ensure_ascii=False)[1:-1]), head):
                head = re.sub(flex(json.dumps(ld(old), ensure_ascii=False)[1:-1]), lambda m: json.dumps(ld(new), ensure_ascii=False)[1:-1], head); hit = True
            if not hit and (new in body or new in head):
                continue                      # déjà appliquée
            if not hit:
                raise SystemExit(f'{rel} : texte introuvable : {old[:70]}')
            if not old.startswith(('<meta', '<!--@')):
                txt = ld(old).strip()
                page.setdefault('texte', [])
                if txt not in page['texte']:
                    page['texte'].append(txt)
        else:
            m = re.search(r'(<summary>' + re.escape(old) + r'</summary><div class="a">)([\s\S]*?)(</div></details>)', body)
            if not m:
                raise SystemExit(f'{rel} : question introuvable : {old}')
            body = body[:m.start(2)] + new + body[m.end(2):]
            q = ld(old)
            m2 = re.search(r'("name": ' + flex(json.dumps(q, ensure_ascii=False)) + r', "acceptedAnswer": \{"@type": "Answer", "text": )("(?:[^"\\]|\\.)*")', head)
            if not m2:
                raise SystemExit(f'{rel} : question absente du FAQPage : {q}')
            head = head[:m2.start(2)] + json.dumps(ld(new), ensure_ascii=False) + head[m2.end(2):]
            page.setdefault('faq', {})[q] = 'texte devenu faux (brief du 14/11, section 5 ; CLAUDE.md, offre et agenda du 14/11)'
    open(p, 'w', encoding='utf-8').write(head + body)
    print(f'  _src/pages/{rel} · {len(items)} correction(s)')

def main(pages):
    ap = os.path.join(ROOT, 'tests/corrections-autorisees.json')
    allow = json.load(open(ap, encoding='utf-8'))
    for rel in pages or C:
        apply(rel, C[rel], allow)
    open(ap, 'w', encoding='utf-8').write(json.dumps(allow, ensure_ascii=False, indent=2) + '\n')

if __name__ == '__main__':
    main(sys.argv[1:])
