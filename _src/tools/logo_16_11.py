#!/usr/bin/env python3
"""Logo du 16/11/2026 : les sources des pages ne pointent plus vers l'ancienne
image (og-image.png, logo néon). Une fois, idempotent.
- og:image, twitter:image et les "image" du JSON-LD → l'image de partage de la
  langue de la page (assets/partage/partage-<fr|nl|en>.png, 1200 × 630) ;
- "logo" de Organization et de LocalBusiness → celya-logo-512.png (512 × 512) ;
- les articles qui ont leur propre image la gardent (rien d'autre ne bouge).

    python3 _src/tools/logo_16_11.py
"""
import json, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
OLD = 'https://celya.be/og-image.png'
LOGO = 'https://celya.be/celya-logo-512.png'
n = 0
for d, _, fs in os.walk(os.path.join(ROOT, '_src/pages')):
    for f in fs:
        if not f.endswith('.html'):
            continue
        p = os.path.join(d, f)
        s = open(p, encoding='utf-8').read()
        if OLD not in s:
            continue
        lang = json.loads(re.search(r'<!--@page (\{.*?\})-->', s).group(1))['lang']
        img = f'https://celya.be/assets/partage/partage-{lang}.png'
        s = s.replace(f'"logo": {{"@type": "ImageObject", "url": "{OLD}", "width": 1200, "height": 630}}',
                      f'"logo": {{"@type": "ImageObject", "url": "{LOGO}", "width": 512, "height": 512}}')
        s = s.replace(f'"logo": "{OLD}"', f'"logo": "{LOGO}"')
        s = s.replace(OLD, img)
        open(p, 'w', encoding='utf-8').write(s)
        n += 1
print(f'  {n} source(s) mises à jour')
