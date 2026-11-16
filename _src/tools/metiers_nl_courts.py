#!/usr/bin/env python3
"""Les quatre pages métier NL courtes (garages, restaurants, praktijken,
zelfstandigen), une fois, après extraire_page.mjs + curer_metiers.py : leurs
trois tuiles « rôle » (accroche, H3, phrase) deviennent une liste de rôles, et
la fiche d'exemple de la section « U ontvangt een duidelijke fiche » (Beller,
Reden, Urgentie…) passe dans le texte de la section, marquée « Voorbeeld ».
Texte repris de la page d'origine (git, origin/main), mot pour mot.

    python3 _src/tools/metiers_nl_courts.py nl/garages.html nl/restaurants.html …
"""
import os, re, subprocess, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def run(rel):
    old = subprocess.run(['git', 'show', 'origin/main:' + rel], cwd=ROOT, capture_output=True, text=True, check=True).stdout
    roles = re.findall(r'<section class="tile t-role[^"]*">[\s\S]*?<div class="kick">([\s\S]*?)</div>\s*<h3>([\s\S]*?)</h3>\s*<p>([\s\S]*?)</p>', old)
    fiche = re.search(r'<div class="fiche">([\s\S]*?)\n\s*</div>\s*</section>', old).group(1)
    badge = re.search(r'<span class="exbadge">([\s\S]*?)</span>', fiche).group(1)
    rows = re.findall(r'<div class="frow"><span class="k">([\s\S]*?)</span><span class="(?:v|pill[^"]*)">([\s\S]*?)</span></div>', fiche)
    p = os.path.join(ROOT, '_src/pages', rel)
    s = open(p, encoding='utf-8').read()
    # les trois sections « note » (H3 + phrase) → une seule liste de rôles
    notes = list(re.finditer(r'<!--@section \{"role": "note"\}-->\n[\s\S]*?(?=<!--@)', s))
    if len(notes) != len(roles):
        raise SystemExit(f'{rel} : {len(notes)} notes pour {len(roles)} rôles')
    block = '<!--@section {"role": "roles"}-->\n' + '\n'.join(f'<div class="role"><p class="label">{k.strip()}</p><h3>{h}</h3><p>{t}</p></div>' for k, h, t in roles) + '\n'
    s = s[:notes[0].start()] + block + s[notes[-1].end():]
    # la fiche d'exemple dans la section d'introduction
    dl = f'<p class="label">{badge}</p>\n<dl class="fiche-l">' + ''.join(f'<div><dt>{k}</dt><dd>{v}</dd></div>' for k, v in rows) + '</dl>'
    s = re.sub(r'(<!--@section \{[^}]*"role": "intro"\}-->\n<h2>[\s\S]*?</h2>\n)\n', lambda m: m.group(1) + dl + '\n', s, count=1)
    open(p, 'w', encoding='utf-8').write(s)
    print(f'  _src/pages/{rel} · {len(roles)} rôles · fiche {len(rows)} lignes')

for rel in sys.argv[1:]:
    run(rel)
