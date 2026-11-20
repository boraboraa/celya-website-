#!/usr/bin/env python3
"""Pages d'atterrissage (lot du 16/11/2026) : écrit les quatre sources
_src/pages/lp/*.html et _src/pages/nl/lp/*.html. Textes neufs, relus contre
CLAUDE.md (FR + NL seulement, aucun montant en dur, WhatsApp et Google Agenda en
service, 48 heures) et docs/vocabulaire-be.md. noindex, hors sitemap.

    python3 _src/tools/lp_source.py
"""
import json, os
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def faq_html(h2, qs):
    return f'<h2>{h2}</h2>\n' + '\n'.join(f'<details><summary>{q}</summary><div class="a">{a}</div></details>' for q, a in qs)

def ben(items):
    return '\n'.join(f'<li><h3>{h}</h3><p>{p}</p></li>' for h, p in items)

PAGES = {
 'lp/ne-plus-rater-d-appels.html': dict(lang='fr', other='nl/lp/geen-oproepen-meer-missen.html',
   title="Ne plus rater d'appels \u2014 Celya",
   desc="Janet, la réceptionniste IA de Celya, décroche 24 h/24 en français et en néerlandais, prend vos rendez-vous et vous envoie chaque appel sur WhatsApp.",
   h1="Vous ratez des appels&nbsp;? <em>Janet décroche à votre place.</em>",
   lede="Une réceptionniste IA qui répond 24 h/24 en français et en néerlandais, prend vos rendez-vous et vous envoie le résumé de chaque appel sur WhatsApp.",
   form="Recevoir une démo",
   ben=[("Chaque appel décroché", "Même quand vous êtes occupé, en rendez-vous ou fermé&nbsp;: elle répond en quelques secondes, et prend plusieurs appels en même temps."),
        ("Les rendez-vous pris pendant l'appel", "Dans votre Google Agenda ou dans l'agenda Celya, sur vos créneaux réellement libres."),
        ("Le résumé sur WhatsApp", "Qui a appelé, pour quoi, ce qui est urgent&nbsp;: tout arrive sur votre WhatsApp, et l'urgent vous est transféré.")],
   faq_h2="Trois questions, <em>trois réponses</em>",
   faq=[("Faut-il changer de numéro&nbsp;?", "Non. Vous gardez le vôtre et activez une déviation d'appel chez votre opérateur. Pas de numéro professionnel&nbsp;? On vous en fournit un, belge, inclus."),
        ("Combien de temps pour être en ligne&nbsp;?", "48 heures. Rien à installer chez vous, et vous coupez la déviation quand vous voulez."),
        ("Combien ça coûte&nbsp;?", "Trois formules&nbsp;: {{offre.liste_prix}}&nbsp;€ hors TVA par mois, pour {{offre.liste_minutes}} minutes de conversation. Mise en service&nbsp;: une mensualité.")],
   cta_h2="Le plus simple&nbsp;? <em>Appelez-la.</em>",
   cta_p="Elle décroche en quelques secondes. C'est une IA, et elle le dit."),
 'lp/garages.html': dict(lang='fr', other='nl/lp/garages.html',
   title="Garages : ne plus rater d'appels \u2014 Celya",
   desc="Pannes, entretiens, pneus : Janet décroche pendant que vous êtes sous la voiture, pose le rendez-vous d'atelier et vous transfère l'urgence.",
   h1="Votre garage rate des appels&nbsp;? <em>Janet décroche pendant que vous êtes sous la voiture.</em>",
   lede="Pannes, entretiens, pneus&nbsp;: elle répond 24 h/24 en français et en néerlandais, pose le rendez-vous d'atelier et vous transfère l'urgence.",
   form="Recevoir une démo",
   ben=[("Les urgences sonnent sur votre portable", "Une voiture qui ne démarre pas, un client au bord de la route&nbsp;: elle repère l'urgence et vous la transfère."),
        ("Les rendez-vous d'atelier pris pendant l'appel", "Entretien, pneus, freins&nbsp;: sur vos créneaux réels, dans votre Google Agenda ou l'agenda Celya."),
        ("Une fiche claire sur WhatsApp", "Client, véhicule, motif&nbsp;: le résumé de chaque appel arrive sur votre WhatsApp.")],
   faq_h2="Trois questions, <em>trois réponses</em>",
   faq=[("Et si je décroche moi-même&nbsp;?", "Réglez la déviation sur «&nbsp;occupé&nbsp;» ou «&nbsp;pas de réponse&nbsp;»&nbsp;: vous décrochez quand vous pouvez, Janet prend le reste."),
        ("Combien de temps pour être en ligne&nbsp;?", "48 heures. Rien à installer au garage, et vous coupez la déviation quand vous voulez."),
        ("Combien ça coûte&nbsp;?", "Trois formules&nbsp;: {{offre.liste_prix}}&nbsp;€ hors TVA par mois, pour {{offre.liste_minutes}} minutes de conversation. Mise en service&nbsp;: une mensualité.")],
   cta_h2="La prochaine panne <em>va à celui qui décroche.</em>",
   cta_p="Appelez Janet&nbsp;: elle décroche en quelques secondes. C'est une IA, et elle le dit."),
 'nl/lp/geen-oproepen-meer-missen.html': dict(lang='nl', other='lp/ne-plus-rater-d-appels.html',
   title="Geen oproepen meer missen \u2014 Celya",
   desc="Janet, de AI-receptioniste van Celya, neemt 24/7 op in het Nederlands en het Frans, legt uw afspraken vast en stuurt elke oproep naar uw WhatsApp.",
   h1="Mist u oproepen? <em>Janet neemt op in uw plaats.</em>",
   lede="Een AI-receptioniste die 24/7 opneemt in het Nederlands en het Frans, uw afspraken vastlegt en u de samenvatting van elke oproep op WhatsApp stuurt.",
   form="Een demo aanvragen",
   ben=[("Elke oproep opgenomen", "Ook als u bezet bent, in een afspraak of gesloten: ze neemt op binnen enkele seconden, en meerdere oproepen tegelijk."),
        ("Afspraken vastgelegd tijdens de oproep", "In uw Google Agenda of in de agenda van Celya, op uw echt vrije momenten."),
        ("De samenvatting op WhatsApp", "Wie belde, waarvoor, wat dringend is: alles komt op uw WhatsApp, en het dringende wordt naar u doorgeschakeld.")],
   faq_h2="Drie vragen, <em>drie antwoorden</em>",
   faq=[("Moet ik van nummer veranderen?", "Nee. U houdt het uwe en activeert een doorschakeling bij uw operator. Geen professioneel nummer? Wij bezorgen u er een, Belgisch, inbegrepen."),
        ("Hoelang tot de lijn antwoordt?", "48 uur. Niets te installeren bij u, en u schakelt de doorschakeling uit wanneer u wilt."),
        ("Wat kost het?", "Drie formules: {{offre.liste_prix}}&nbsp;€ per maand exclusief btw, voor {{offre.liste_minutes}} minuten gesprekken. Opstart: één maandbedrag.")],
   cta_h2="Het eenvoudigst? <em>Bel haar.</em>",
   cta_p="Ze neemt op binnen enkele seconden. Het is een AI, en ze zegt het."),
 'nl/lp/garages.html': dict(lang='nl', other='lp/garages.html',
   title="Garages: geen oproepen meer missen \u2014 Celya",
   desc="Pech, onderhoud, banden: Janet neemt op terwijl u onder de wagen ligt, legt de afspraak in de werkplaats vast en schakelt het dringende door.",
   h1="Mist uw garage oproepen? <em>Janet neemt op terwijl u onder de wagen ligt.</em>",
   lede="Pech, onderhoud, banden: ze antwoordt 24/7 in het Nederlands en het Frans, legt de afspraak in de werkplaats vast en schakelt het dringende naar u door.",
   form="Een demo aanvragen",
   ben=[("Dringende oproepen rinkelen op uw gsm", "Een wagen die niet start, een klant langs de weg: ze herkent de urgentie en schakelt door naar u."),
        ("Werkplaatsafspraken tijdens de oproep", "Onderhoud, banden, remmen: op uw echte vrije momenten, in uw Google Agenda of de agenda van Celya."),
        ("Een duidelijke fiche op WhatsApp", "Klant, wagen, reden: de samenvatting van elke oproep komt op uw WhatsApp.")],
   faq_h2="Drie vragen, <em>drie antwoorden</em>",
   faq=[("En als ik zelf opneem?", "Stel de doorschakeling in op «&nbsp;bezet&nbsp;» of «&nbsp;geen antwoord&nbsp;»: u neemt op wanneer u kunt, Janet neemt de rest."),
        ("Hoelang tot de lijn antwoordt?", "48 uur. Niets te installeren in de garage, en u schakelt de doorschakeling uit wanneer u wilt."),
        ("Wat kost het?", "Drie formules: {{offre.liste_prix}}&nbsp;€ per maand exclusief btw, voor {{offre.liste_minutes}} minuten gesprekken. Opstart: één maandbedrag.")],
   cta_h2="De volgende pech <em>gaat naar wie opneemt.</em>",
   cta_p="Bel Janet: ze neemt op binnen enkele seconden. Het is een AI, en ze zegt het."),
}

LOC = {'fr': 'fr_BE', 'nl': 'nl_BE'}
for rel, P in PAGES.items():
    url = 'https://celya.be/' + rel
    img = f'https://celya.be/assets/partage/partage-{P["lang"]}.png'
    langs = {P['lang']: rel.split('/')[-1], ('nl' if P['lang'] == 'fr' else 'fr'): ('../../' if P['lang'] == 'nl' else '../') + P['other']}
    head = '\n'.join([
        f'<title>{P["title"]}</title>',
        f'<meta name="description" content="{P["desc"]}">',
        '<meta name="robots" content="noindex,nofollow">',
        f'<link rel="canonical" href="{url}">',
        '<meta property="og:type" content="website">',
        f'<meta property="og:url" content="{url}">',
        f'<meta property="og:title" content="{P["title"]}">',
        f'<meta property="og:description" content="{P["desc"]}">',
        f'<meta property="og:image" content="{img}">',
        f'<meta property="og:locale" content="{LOC[P["lang"]]}">',
        '<meta name="twitter:card" content="summary_large_image">',
        f'<meta name="twitter:title" content="{P["title"]}">',
        f'<meta name="twitter:description" content="{P["desc"]}">',
        f'<meta name="twitter:image" content="{img}">'])
    page = {'layout': 'lp', 'lang': P['lang'], 'langs': langs, 'noindex': True}
    out = [f'<!--@page {json.dumps(page, ensure_ascii=False)}-->', '<!--@head-->', head, '<!--@h1-->', P['h1'], '<!--@lede-->', P['lede'],
           '<!--@formtitle-->', P['form'], '<!--@benefits-->', ben(P['ben']), '<!--@faq {"id":"faq"}-->', faq_html(P['faq_h2'], P['faq']),
           '<!--@cta-->', f'<h2>{P["cta_h2"]}</h2>\n<p>{P["cta_p"]}</p>']
    dest = os.path.join(ROOT, '_src/pages', rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('  _src/pages/' + rel)
