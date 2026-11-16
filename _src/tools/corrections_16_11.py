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
          "Oui, sur WhatsApp&nbsp;: un message de confirmation avec trois boutons — Confirmer, Déplacer, Annuler —, puis un rappel avant le rendez-vous. Le client qui n'a pas WhatsApp la reçoit par SMS. Ce sont les seuls messages envoyés à vos clients, et ils sont tous liés à leur appel."),
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
            hit = False
            if old in body:
                body = body.replace(old, new); hit = True
            if old.startswith('<meta') and old in head:
                head = head.replace(old, new); hit = True
            elif not old.startswith('<meta') and re.search(flex(json.dumps(ld(old), ensure_ascii=False)[1:-1]), head):
                head = re.sub(flex(json.dumps(ld(old), ensure_ascii=False)[1:-1]), lambda m: json.dumps(ld(new), ensure_ascii=False)[1:-1], head); hit = True
            if not hit:
                raise SystemExit(f'{rel} : texte introuvable : {old[:70]}')
            if not old.startswith('<meta'):
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
