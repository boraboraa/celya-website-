#!/usr/bin/env python3
"""Annote les pages sources métier après extraction (une fois) :
- identifiant du métier (data/metiers.json) dans les métadonnées ;
- 1re section titrée → role:"intro" ; section sans H2 avant elle → role:"note" ;
- section « Dévier ses appels… » ou « Rien à changer chez vous » → role:"plug" ;
- sections titrées entre le branchement et la FAQ → role:"post" ;
- sections titrées après la FAQ → role:"after".
    python3 _src/tools/curer_metiers.py garages restaurants …"""
import json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
M = json.load(open(os.path.join(ROOT, 'data/metiers.json'), encoding='utf-8'))
PLUG = re.compile(r'^<h2[^>]*>(Dévier ses appels|Rien à changer|Niets te veranderen|Uw oproepen doorschakelen|Doorschakelen|Nothing to change|Forward)', re.I)

def cure(fid, lang='fr'):
    rel = M[fid]['pages'][lang]
    if lang != 'fr':
        rel = f'{lang}/{rel}'
    p = os.path.join(ROOT, '_src/pages', rel)
    s = open(p, encoding='utf-8').read()
    meta = json.loads(re.search(r'<!--@page (\{.*?\})-->', s).group(1))
    meta = {'layout': 'metier', 'metier': fid, **{k: v for k, v in meta.items() if k != 'layout'}}
    s = re.sub(r'<!--@page \{.*?\}-->', '<!--@page ' + json.dumps(meta, ensure_ascii=False) + '-->', s, count=1)
    parts = re.split(r'(<!--@[a-z]+(?: \{.*?\})?-->\n)', s)
    seen_intro = seen_plug = seen_faq = False
    out = []
    for i, part in enumerate(parts):
        m = re.match(r'<!--@section(?: (\{.*?\}))?-->\n', part)
        if m:
            attrs = json.loads(m.group(1)) if m.group(1) else {}
            body = parts[i + 1] if i + 1 < len(parts) else ''
            titled = bool(re.match(r'\s*<h2[^>]*>\s*(?!<\/h2>)\S', body))
            attrs.pop('brut', None)
            if not titled and not seen_intro:
                attrs['role'] = 'note'
            elif titled and not seen_intro:
                attrs['role'] = 'intro'; seen_intro = True
            elif titled and PLUG.match(body.lstrip()) and not seen_plug:
                attrs['role'] = 'plug'; seen_plug = True
            elif titled and seen_faq:
                attrs['role'] = 'after'
            elif titled and seen_plug:
                attrs['role'] = 'post'
            attrs = {k: v for k, v in attrs.items() if v not in ('', None)}
            part = '<!--@section' + (' ' + json.dumps(attrs, ensure_ascii=False) if attrs else '') + '-->\n'
        elif i > 0 and re.match(r'<!--@section', parts[i - 1] or '') and re.match(r'\s*<h2[^>]*>\s*</h2>\s*', part):
            part = re.sub(r'^\s*<h2[^>]*>\s*</h2>\s*', '', part)
        elif part.startswith('<!--@faq'):
            seen_faq = True
        out.append(part)
    open(p, 'w', encoding='utf-8').write(''.join(out))
    roles = re.findall(r'<!--@section \{[^}]*"role": "(\w+)"', ''.join(out))
    print(f'  {rel:22} rôles : {", ".join(roles)}')

# python3 _src/tools/curer_metiers.py [--lang nl] garages …
args = sys.argv[1:]
lang = 'fr'
if args[:1] == ['--lang']:
    lang, args = args[1], args[2:]
for fid in args:
    cure(fid, lang)
