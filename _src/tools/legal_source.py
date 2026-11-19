#!/usr/bin/env python3
"""Pages légales (mentions légales, confidentialité, cookies ; FR, NL, EN), une
fois : le <head> SEO et le contenu de <main class="legal"> sont recopiés tels
quels : texte inchangé, à l'octet près. Refuse une page déjà générée.

    python3 _src/tools/legal_source.py legal.html privacy.html cookies.html nl/legal.html …
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from blog_source import head_seo, langs  # noqa: E402
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

for rel in sys.argv[1:]:
    src = open(os.path.join(ROOT, rel), encoding='utf-8').read()
    if 'celya.css' in src:
        raise SystemExit(f'{rel} est déjà une page générée')
    main = re.search(r'<main class="legal">\n?([\s\S]*?)</main>', src).group(1)
    h1 = re.search(r'<h1>([\s\S]*?)</h1>', main)
    body = (main[:h1.start()] + main[h1.end():]).strip('\n')
    page = {'layout': 'legal', 'lang': re.search(r'<html lang="([a-z]+)"', src).group(1), 'langs': langs(src)}
    out = [f'<!--@page {json.dumps(page, ensure_ascii=False)}-->', '<!--@head-->', head_seo(src), '<!--@h1-->', h1.group(1), '<!--@body-->', body]
    dest = os.path.join(ROOT, '_src/pages', rel)
    open(dest, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('  _src/pages/' + rel)
