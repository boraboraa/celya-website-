#!/usr/bin/env python3
"""Calculateurs (FR, NL), une fois, après extraire_page.mjs : reprend de la
version d'origine (git, origin/main) le formulaire, le bloc de résultat et les
deux scripts de la page, les passe aux classes du thème clair (.form, .f-row,
.f-field, .calc-out) et les insère dans la source comme bloc <!--@widget--> et
blocs <!--@script-->. Le texte, les libellés et le calcul ne changent pas.

    node _src/tools/extraire_page.mjs article calculateur-appels-manques.html
    python3 _src/tools/calculateur_source.py calculateur-appels-manques.html
"""
import os, re, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def build(rel):
    old = subprocess.run(['git', 'show', 'origin/main:' + rel], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    form = re.search(r'<form id="calc" novalidate>([\s\S]*?)</form>', old).group(1)
    out = re.search(r'<div class="calcout" id="cres" aria-live="polite">([\s\S]*?)</div>\s*</aside>', old).group(1)
    form = form.replace('<div class="two">', '<div class="f-row">').replace('<div class="field">', '<div class="f-field">').replace('<p class="hint">', '<p class="f-small">')
    out = out.replace('class="btn btn-ghost"', 'class="btn btn-line btn-sm"')
    dedent = lambda s: '\n'.join(l.strip() for l in s.strip().split('\n'))
    widget = f'<div class="calc" id="calculateur">\n<form class="form" id="calc" novalidate>\n{dedent(form)}\n</form>\n<div class="calc-out" id="cres" aria-live="polite">\n{dedent(out)}\n</div>\n</div>'
    scripts = re.findall(r'<script>\n(\(function\(\)\{[\s\S]*?)</script>|<script>\n(/\*[\s\S]*?)</script>', old.split('bento.js" defer></script>')[1])
    scripts = [a or b for a, b in scripts]
    p = os.path.join(ROOT, '_src/pages', rel)
    src = open(p, encoding='utf-8').read()
    src = re.sub(r'<!--@section \{[^}]*"brut": ?"tile t-calc-in"\}-->\n[\s\S]*?(?=<!--@)', '', src)
    i = src.index('<!--@section')
    src = src[:i] + '<!--@widget-->\n' + widget + '\n' + src[i:].rstrip('\n') + '\n' + ''.join('<!--@script-->\n<script>\n' + s.rstrip('\n') + '\n</script>\n' for s in scripts)
    open(p, 'w', encoding='utf-8').write(src)
    print(f'  _src/pages/{rel} · widget + {len(scripts)} script(s)')

for rel in sys.argv[1:]:
    build(rel)
