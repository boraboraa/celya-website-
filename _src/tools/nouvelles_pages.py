#!/usr/bin/env python3
"""Pages sources des pages créées par le lot (demo, merci, pages d'atterrissage).

Les nœuds Organization, WebSite et LocalBusiness du JSON-LD sont repris tels
quels de contact.html (FR) / nl/contact.html / en/contact.html : une seule
vérité pour l'entité (Celya Technologies SRL, BCE, pas de vatID).

    python3 _src/tools/nouvelles_pages.py [fr] [nl] [en]
"""
import json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
SITE = 'https://celya.be/'

def graph_of(rel):
    s = open(os.path.join(ROOT, rel), encoding='utf-8').read()
    ld = re.search(r'<script type="application/ld\+json">\s*(.*?)\s*</script>', s, re.S).group(1)
    return json.loads(ld)['@graph']

def entity_nodes(lang):
    src = {'fr': 'contact.html', 'nl': 'nl/contact.html', 'en': 'en/contact.html'}[lang]
    return [n for n in graph_of(src) if n['@type'] in ('Organization', 'WebSite', 'LocalBusiness')]

LOCALE = {'fr': ('fr_BE', 'fr-BE'), 'nl': ('nl_BE', 'nl-BE'), 'en': ('en_GB', 'en')}
HOME = {'fr': ('Accueil', SITE), 'nl': ('Home', SITE + 'nl/'), 'en': ('Home', SITE + 'en/')}

def head(lang, rel, title, desc, alternates, crumb, noindex=False):
    url = SITE + rel
    lines = [f'<title>{title}</title>', f'<meta name="description" content="{desc}">']
    if noindex:
        lines.append('<meta name="robots" content="noindex,nofollow">')
    lines.append(f'<link rel="canonical" href="{url}">')
    if not noindex:
        for hl, href in alternates:
            lines.append(f'<link rel="alternate" hreflang="{hl}" href="{SITE + href}">')
    og, _ = LOCALE[lang]
    lines += [
        '<meta property="og:type" content="website">', f'<meta property="og:url" content="{url}">',
        f'<meta property="og:title" content="{title}">', f'<meta property="og:description" content="{desc}">',
        f'<meta property="og:image" content="{SITE}og-image.png">', f'<meta property="og:locale" content="{og}">',
        '<meta name="twitter:card" content="summary_large_image">', f'<meta name="twitter:title" content="{title}">',
        f'<meta name="twitter:description" content="{desc}">', f'<meta name="twitter:image" content="{SITE}og-image.png">',
    ]
    if not noindex:
        g = entity_nodes(lang) + [
            {'@type': 'WebPage', '@id': url + '#webpage', 'url': url, 'name': title, 'description': desc,
             'inLanguage': LOCALE[lang][1], 'isPartOf': {'@id': SITE + '#website'}, 'about': {'@id': SITE + '#organization'}},
            {'@type': 'BreadcrumbList', '@id': url + '#breadcrumb', 'itemListElement': [
                {'@type': 'ListItem', 'position': 1, 'name': HOME[lang][0], 'item': HOME[lang][1]},
                {'@type': 'ListItem', 'position': 2, 'name': crumb, 'item': url}]},
        ]
        lines.append('<script type="application/ld+json">\n' + json.dumps({'@context': 'https://schema.org', '@graph': g}, ensure_ascii=False) + '\n</script>')
    return '\n'.join(lines)

def page(meta, blocks):
    out = ['<!--@page ' + json.dumps(meta, ensure_ascii=False) + '-->']
    for name, html in blocks:
        out.append(f'<!--@{name}-->\n{html}')
    return '\n'.join(out) + '\n'

def write(rel, txt):
    p = os.path.join(ROOT, '_src', 'pages', rel)
    os.makedirs(os.path.dirname(p), exist_ok=True)
    open(p, 'w', encoding='utf-8').write(txt)
    print('  _src/pages/' + rel)

# ---------------------------------------------------------------- textes
DEMO = {
 'fr': dict(rel='demo.html', title='Demander une démo de Janet \u2014 Celya',
   desc="Laissez votre numéro : on vous rappelle dans la journée pour vous montrer Janet sur votre métier. Ou appelez-la tout de suite, elle vous réserve la démo.",
   crumb='Demander une démo', kick='',
   h1='Voyez-la répondre <em>pour votre métier.</em>',
   lede="Laissez votre numéro : on vous rappelle dans la journée, on règle Janet sur votre activité et vous l'entendez répondre à vos propres clients. Pressé ? Appelez-la : elle vous réserve la démo elle-même.",
   steps=["On vous rappelle dans la journée, au moment que vous choisissez.", "Quinze minutes ensemble : vos horaires, vos prestations, vos urgences."]),
 'nl': dict(rel='nl/demo.html', title='Vraag een demo van Janet \u2014 Celya',
   desc="Laat uw nummer achter: we bellen u vandaag nog terug om Janet te tonen voor uw sector. Of bel haar meteen, ze plant de demo zelf in.",
   crumb='Vraag een demo', kick='',
   h1='Hoor haar antwoorden <em>voor uw vak.</em>',
   lede="Laat uw nummer achter: we bellen u vandaag nog terug, stellen Janet af op uw zaak en u hoort haar antwoorden aan uw eigen klanten. Haast? Bel haar: ze plant de demo zelf in.",
   steps=["We bellen u vandaag nog terug, op het moment dat u kiest.", "Vijftien minuten samen: uw uren, uw prestaties, uw dringende gevallen."]),
 'en': dict(rel='en/demo.html', title='Request a demo of Janet \u2014 Celya',
   desc="Leave your number: we call you back today to show you Janet working for your trade. Or call her right now, she books the demo herself.",
   crumb='Request a demo', kick='',
   h1='Hear her answer <em>for your business.</em>',
   lede="Leave your number: we call you back today, set Janet up for your business and you hear her answer your own customers. In a hurry? Call her: she books the demo herself.",
   steps=["We call you back today, at the time you choose.", "Fifteen minutes together: your hours, your services, your urgent cases."]),
}
MERCI = {
 'fr': dict(rel='merci.html', title='Merci \u2014 Celya', desc="Votre demande de démo est bien reçue : on vous rappelle dans la journée. Ou appelez Janet maintenant.",
   h1='C\'est noté. <em>On vous rappelle dans la journée.</em>',
   lede='Ou appelez Janet maintenant : elle vous répond et vous réserve la démo pendant l\'appel.'),
 'nl': dict(rel='nl/merci.html', title='Bedankt \u2014 Celya', desc="Uw demo-aanvraag is goed ontvangen: we bellen u vandaag nog terug. Of bel Janet nu meteen.",
   h1='Genoteerd. <em>We bellen u vandaag nog terug.</em>',
   lede='Of bel Janet nu: ze antwoordt u en plant de demo in tijdens het gesprek.'),
 'en': dict(rel='en/merci.html', title='Thank you \u2014 Celya', desc="Your demo request has been received: we will call you back today. Or call Janet right now.",
   h1='Noted. <em>We will call you back today.</em>',
   lede='Or call Janet now: she answers and books the demo during the call.'),
}

def build(lang):
    d = DEMO[lang]
    alts = [('fr-BE', 'demo.html'), ('nl-BE', 'nl/demo.html'), ('fr', 'demo.html'), ('nl', 'nl/demo.html'), ('en', 'en/demo.html'), ('x-default', 'demo.html')]
    up = '' if lang == 'fr' else '../'
    langs = {'fr': up + 'demo.html', 'nl': ('' if lang == 'nl' else ('nl/' if lang == 'fr' else '../nl/')) + 'demo.html', 'en': ('' if lang == 'en' else ('en/' if lang == 'fr' else '../en/')) + 'demo.html'}
    write(d['rel'], page({'layout': 'demo', 'lang': lang, 'langs': langs}, [
        ('head', head(lang, d['rel'], d['title'], d['desc'], alts, d['crumb'])),
        ('kick', d['kick']), ('h1', d['h1']), ('lede', d['lede']),
        ('steps', '\n'.join(f'<li>{s}</li>' for s in d['steps'])),
    ]))
    m = MERCI[lang]
    mlangs = {k: v.replace('demo.html', 'merci.html') for k, v in langs.items()}
    write(m['rel'], page({'layout': 'merci', 'lang': lang, 'langs': mlangs, 'noindex': True}, [
        ('head', head(lang, m['rel'], m['title'], m['desc'], [], '', noindex=True)),
        ('h1', m['h1']), ('lede', m['lede']),
    ]))

for lang in (sys.argv[1:] or ['fr']):
    build(lang)
