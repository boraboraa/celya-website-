#!/usr/bin/env python3
"""Sources de nl/prijzen.html et en/pricing.html (une fois), à partir de
l'extraction brute : grille du 14/11 en jetons {{offre.…}}, corrections des
textes devenus faux (visible ET JSON-LD), mêmes rôles que prix.html.

    node _src/tools/extraire_page.mjs prix nl/prijzen.html en/pricing.html
    python3 _src/tools/prix_source.py nl en
"""
import json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
NB = ' '

def blocks(src):
    out = []
    for m in re.finditer(r'<!--@([a-z0-9]+)(?: (\{.*?\}))?-->\n([\s\S]*?)(?=<!--@[a-z0-9]+|\Z)', src):
        out.append([m.group(1), json.loads(m.group(2)) if m.group(2) else {}, m.group(3).rstrip('\n')])
    return out

T = {
 'nl': dict(
   rel='nl/prijzen.html',
   head=[('75, 150 en 300 €', '{{offre.liste_prix}} €'), ('250, 750 en 1 750 minuten', '{{offre.liste_minutes}} minuten'), ('75, 150 of 300 €', '{{offre.essentiel.prix}}, {{offre.pro.prix}} of {{offre.premier.prix}} €'), ('250, 750 of 1 750 minuten', '{{offre.essentiel.minutes}}, {{offre.pro.minutes}} of {{offre.premier.minutes}} minuten')],
   offers=[('Instap', '75', 'essentiel'), ('Tussenformule', '150', 'pro'), ('Eerste hulplijn', '300', 'premier')],
   formules='''<h2 id="s-drie-formules-en-wat-erin-zit">Drie formules, <em>en wat erin zit</em></h2>
<p>Alle drie doen ze hetzelfde werk&nbsp;: Janet neemt 24&nbsp;u&nbsp;op&nbsp;24 op, in het Nederlands en het Frans, legt afspraken vast tijdens het gesprek, noteert berichten met een gedateerde fiche, geeft uw informatie door en schakelt door wanneer het moet. De samenvatting van elke oproep komt op uw WhatsApp, en uw instructies gaan langs dezelfde weg. Wat verschilt van formule tot formule&nbsp;: het volume, het aantal agenda's en de berichten aan uw klanten.</p>
<p>Geen verborgen kosten, geen toeslag voor ruimere uren, niets te installeren bij u. En stopt u, dan zet u de doorschakeling af&nbsp;: uw oproepen komen terug bij u, er valt niets af te breken.</p>''',
   tableau='<h2>Formule per formule, <em>regel per regel.</em></h2>',
   diag='''<p>Vertrek van wat u ziet&nbsp;: hoeveel oproepen per dag, hoeveel u er mist. De berekening geeft een formule. Gaat u de maand erna erboven, dan schuift u gewoon door naar de formule erboven.</p>
<p class="diag-call">Geloof ons niet op ons woord. <a href="tel:{{offre.tel_e164}}" data-call>{{offre.tel}}</a> \u2014 Janet neemt op. Het is een AI&nbsp;: u hoort het, of niet.</p>''',
   diag_kick='De diagnose',
   table=[('<b>75, 150 of 300&nbsp;€</b> exclusief btw, volgens de formule. Nooit per minuut.', '<b>{{offre.essentiel.prix}}, {{offre.pro.prix}} of {{offre.premier.prix}}&nbsp;€</b> exclusief btw, volgens de formule. Nooit per minuut.'),
          ('Eén, twee of vier gelijktijdige oproepen volgens de formule, zonder dubbele wachttijd. Het seizoenspiek vraagt geen aanwerving.', 'Meerdere oproepen tegelijk, zonder dubbele wachttijd. Het seizoenspiek vraagt geen aanwerving.')],
   faq=[("Niet systematisch. Er is wel echt instelwerk \u2014 uw uren, uw diensten, uw doorschakelregels, uw standaardantwoorden \u2014 en dat is net wat een agent die juist antwoordt onderscheidt van een algemene. Wordt dat werk aangerekend, dan is het afgetopt op één maandbedrag van uw formule, nooit meer.",
         "Ja: één maandbedrag van uw formule, één keer. Er is echt instelwerk \u2014 uw uren, uw diensten, uw doorschakelregels, uw standaardantwoorden \u2014 en dat is net wat een agent die juist antwoordt onderscheidt van een algemene. Er komt niets bij.")],
 ),
 'en': dict(
   rel='en/pricing.html',
   head=[('€75, €150 and €300', '€{{offre.essentiel.prix}}, €{{offre.pro.prix}} and €{{offre.premier.prix}}'), ('€75, €150 or €300', '€{{offre.essentiel.prix}}, €{{offre.pro.prix}} or €{{offre.premier.prix}}'), ('250, 750 and 1,750 minutes', '{{offre.liste_minutes}} minutes')],
   offers=[('Starter', '75', 'essentiel'), ('Standard', '150', 'pro'), ('First responder', '300', 'premier')],
   formules='''<h2>Three plans, <em>and what is in them</em></h2>
<p>All three do the same job: Janet picks up 24/7, in French and Dutch, books appointments during the call, takes messages on a dated record, answers from your own information and transfers when she has to. The summary of every call reaches your WhatsApp, and your instructions travel the same way. What changes from one plan to the next is the volume, the number of calendars and the messages sent to your customers.</p>
<p>No hidden fees, no surcharge for wider hours, nothing to install at your place. And if you stop, you switch off call forwarding: your calls come back to you, there is nothing to take down.</p>''',
   tableau='<h2>Plan by plan, <em>line by line.</em></h2>',
   diag='''<p>Start from what you can see: how many calls a day, how many you miss. The arithmetic gives a plan. If you go over the next month, you simply move up to the plan above.</p>
<p class="diag-call">Don't take our word for it. <a href="tel:{{offre.tel_e164}}" data-call>{{offre.tel}}</a> \u2014 Janet picks up. She is an AI: you will hear it, or not.</p>''',
   diag_kick='The diagnostic',
   table=[('<b>&euro;75, &euro;150 or &euro;300</b> excl. VAT, depending on the plan. Never by the minute.', '<b>€{{offre.essentiel.prix}}, €{{offre.pro.prix}} or €{{offre.premier.prix}}</b> excl. VAT, depending on the plan. Never by the minute.'),
          ('One, two or four simultaneous calls depending on the plan, with no doubled wait. A seasonal peak calls for no hiring.', 'Several calls at the same time, with no doubled wait. A seasonal peak calls for no hiring.')],
   faq=[("Not as a rule. There is real configuration work \u2014 your hours, your services, your transfer rules, your standard answers \u2014 and that is what separates an agent that answers properly from a generic one. When that work is charged, it is capped at one month of your plan, never more.",
         "Yes: one month of your plan, once. There is real configuration work \u2014 your hours, your services, your transfer rules, your standard answers \u2014 and that is what separates an agent that answers properly from a generic one. Nothing else is added."),
        ]  # 16/11/2026 : l'offre d'essai est retirée ; la réponse d'origine sur l'engagement reste,
 ),
}

def build(lang):
    C = T[lang]
    p = os.path.join(ROOT, '_src/pages', C['rel'])
    src = open(p, encoding='utf-8').read()
    pub = open(os.path.join(ROOT, C['rel']), encoding='utf-8').read()
    dh = re.search(r'<section class="diag"[^>]*>[\s\S]*?<h2[^>]*>([\s\S]*?)</h2>', pub)
    if not dh:
        raise SystemExit(f'{lang} : H2 du diagnostic introuvable dans la page publiée')
    diag_h2 = re.sub(r'<span class="(?:gradtxt )?it(?: gradtxt)?">([\s\S]*?)</span>', r'<em>\1</em>', re.sub(r'<span class="(?:lr|l2)"><span>([\s\S]*?)</span></span>', r'\1', dh.group(1))).strip()
    B = blocks(src)
    meta = re.search(r'<!--@page (\{.*?\})-->', src).group(1)
    get = lambda n: next(b for b in B if b[0] == n)
    head = get('head')[2]
    for old, new in C['head']:
        head = head.replace(old, new).replace(old.replace(' ', NB), new)
    for name, price, fid in C['offers']:
        head = head.replace(f'"name": "{name}", "price": "{price}.00"', f'"name": "{{{{offre.{fid}.nom}}}}", "price": "{{{{offre.{fid}.prix_n}}}}.00"')
        head = head.replace(f'"UnitPriceSpecification", "price": "{price}.00"', f'"UnitPriceSpecification", "price": "{{{{offre.{fid}.prix_n}}}}.00"', 1)
    lede = get('lede')[2].replace('&euro;75, &euro;150 and &euro;300', '€{{offre.essentiel.prix}}, €{{offre.pro.prix}} and €{{offre.premier.prix}}')
    secs = [b for b in B if b[0] == 'section']
    form, rest = secs[0], secs[1:]
    out = [f'<!--@page {meta}-->', '<!--@head-->', head, '<!--@h1-->', get('h1')[2], '<!--@lede-->', lede,
           f'<!--@section {json.dumps({"role": "formules", "kick": form[1].get("kick", "")}, ensure_ascii=False)}-->', C['formules'],
           '<!--@section {"role":"tableau"}-->', C['tableau'],
           f'<!--@section {json.dumps({"role": "diag", "kick": C["diag_kick"], "sid": "diagnostic"}, ensure_ascii=False)}-->', f'<h2>{diag_h2}</h2>\n' + C['diag']]
    seen = False
    for name, attrs, html in B:
        if name in ('page', 'head', 'kick', 'h1', 'lede', 'proof'):
            continue
        if name == 'section' and attrs is form[1] and html is form[2]:
            seen = True; continue
        if not seen:
            continue
        if name == 'section':
            a = {k: v for k, v in attrs.items() if k not in ('brut',)}
            if '<table' in html:
                a['role'] = 'modeles'; a['sid'] = 'modeles'
                for old, new in C['table']:
                    if old not in html:
                        raise SystemExit(f'{lang} : cellule introuvable : {old[:50]}')
                    html = html.replace(old, new)
            else:
                a['role'] = 'texte'
            out += ['<!--@section ' + json.dumps(a, ensure_ascii=False) + '-->', html]
        elif name == 'pull':
            out += ['<!--@pull-->', html]
        elif name == 'faq':
            for old, new in C['faq']:
                vis_old = old.replace(' ?', '&nbsp;?')
                if old not in html and vis_old not in html:
                    raise SystemExit(f'{lang} : FAQ introuvable : {old[:50]}')
                html = html.replace(old, new)
                if old not in out[2]:
                    raise SystemExit(f'{lang} : FAQPage introuvable : {old[:50]}')
                out[2] = out[2].replace(old, new.replace('<a href="prijzen.html">', '').replace('</a>', ''))
            out += ['<!--@faq ' + json.dumps(attrs, ensure_ascii=False) + '-->', html]
        elif name in ('related', 'cta'):
            out += [f'<!--@{name}' + (' ' + json.dumps(attrs, ensure_ascii=False) if attrs else '') + '-->', html]
    open(p, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    left = re.findall(r'(?:75|150|300)(?:&nbsp;| | )?(?:€|&euro;)|€(?:75|150|300)\b|&euro;(?:75|150|300)\b', '\n'.join(out))
    print(f'  _src/pages/{C["rel"]} · montants restants : {left or "aucun"}')

for lang in sys.argv[1:] or ['nl', 'en']:
    build(lang)
