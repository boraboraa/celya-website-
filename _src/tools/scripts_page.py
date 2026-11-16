#!/usr/bin/env python3
"""Scripts propres à une page (copier un modèle, cocher une check-list, remplir
une grille, calculer) : reprend, de la version d'origine (git, origin/main), les
<script> en ligne du <body> — ni le JSON-LD, ni le bloc de consentement du
<head>, ni bento.js — et les ajoute à la source comme blocs <!--@script-->.
Le code ne change pas d'un caractère. Un script déjà présent n'est pas doublé.

    python3 _src/tools/scripts_page.py <pages…>     (sans argument : toutes les pages migrées)
"""
import os, re, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def body_scripts(rel):
    try:
        old = subprocess.run(['git', 'show', 'origin/main:' + rel], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    except subprocess.CalledProcessError:
        return []
    if 'celya.css' in old:
        return []
    body = old[old.index('<body'):]
    return [m.group(1) for m in re.finditer(r'<script>\n?([\s\S]*?)</script>', body)]

# pages réécrites sur maquette avant le lot du 16/11 (accueils, prix) : leurs
# scripts ont été refaits dans le gabarit, on n'y reprend rien
AVANT = set(subprocess.run(['git', 'grep', '-l', 'celya.css', '1c2ce15', '--', '*.html'], cwd=ROOT, capture_output=True, text=True).stdout.replace('1c2ce15:', '').split())

def run(rel):
    p = os.path.join(ROOT, '_src/pages', rel)
    if not os.path.exists(p) or rel in AVANT:
        return 0
    src = open(p, encoding='utf-8').read()
    if '"layout": "contact"' in src:
        return 0                          # contact : l'envoi du formulaire passe par celya.js ([data-lead])
    add = [s for s in body_scripts(rel) if s.strip() and s.strip() not in src]
    if add:
        src = src.rstrip('\n') + '\n' + ''.join('<!--@script-->\n<script>\n' + s.strip('\n') + '\n</script>\n' for s in add)
        open(p, 'w', encoding='utf-8').write(src)
        print(f'  _src/pages/{rel} · {len(add)} script(s)')
    return len(add)

pages = sys.argv[1:] or [os.path.relpath(os.path.join(d, f), os.path.join(ROOT, '_src/pages'))
                         for d, _, fs in os.walk(os.path.join(ROOT, '_src/pages')) for f in fs if f.endswith('.html')]
print('total', sum(run(r) for r in sorted(pages)))
