#!/usr/bin/env python3
"""Pages contact (FR, NL, EN), une fois : lit la page publiée (ancien gabarit)
et écrit sa source pour le gabarit « contact ». Textes, libellés et messages du
formulaire repris tels quels, y compris les deux messages d'erreur du script
d'origine. Refuse une page déjà générée.

    python3 _src/tools/contact_source.py contact.html nl/contact.html en/contact.html
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from blog_source import head_seo, langs  # noqa: E402  (mêmes règles pour le <head>)
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def g(rx, s, n=1):
    m = re.search(rx, s)
    if not m:
        raise SystemExit('introuvable : ' + rx)
    return m.group(n).strip()

def run(rel):
    src = open(os.path.join(ROOT, rel), encoding='utf-8').read()
    if 'celya.css' in src:
        raise SystemExit(f'{rel} est déjà une page générée')
    h1 = g(r'<h1[^>]*>([\s\S]*?)</h1>', src)
    h1 = re.sub(r'<span class="em">([\s\S]*?)</span>', r'<em>\1</em>', h1)
    lede = g(r'<p class="lead[^"]*">([\s\S]*?)</p>', src)
    ways = []
    for m in re.finditer(r'<a class="way[^"]*" href="([^"]*)">[\s\S]*?<b>([\s\S]*?)</b><span>([\s\S]*?)</span></span>', src):
        ways.append(f'<a href="{m.group(1)}"><b>{m.group(2)}</b><span>{m.group(3)}</span></a>')
    note = g(r'<p class="jnote[^"]*">([\s\S]*?)</p>', src)
    form = g(r'<form id="lf"[^>]*>([\s\S]*?)</form>', src)
    lab = lambda n: g(r'<label for="f-' + n + r'">([\s\S]*?)</label>', form)
    errs = re.findall(r"err\.textContent='([^']*)'", src)
    btns = re.findall(r"btn\.textContent='([^']*)'", src)
    F = {
        'h2': g(r'<h2>([\s\S]*?)</h2>', form), 'sub': g(r'<p class="sub">([\s\S]*?)</p>', form),
        'name': lab('name'), 'company': lab('company'), 'phone': lab('phone'), 'email': lab('email'), 'need': lab('need'),
        'phone_ph': g(r'id="f-phone"[^>]*placeholder="([^"]*)"', form), 'need_ph': g(r'id="f-need"[^>]*placeholder="([^"]*)"', form),
        'submit': g(r'<button[^>]*type="submit"[^>]*>([\s\S]*?)</button>', form), 'sending': btns[0],
        'err_required': errs[0], 'err_server': errs[-1],
        'ok_b': g(r'<div class="ok" id="fok">[\s\S]*?<b>([\s\S]*?)</b>', form), 'ok_p': g(r'<div class="ok" id="fok">[\s\S]*?<p>([\s\S]*?)</p>', form),
    }
    cine = re.search(r'<section class="cine[^"]*">[\s\S]*?<p>([\s\S]*?)</p>', src)
    pull = re.sub(r'<span class="em">([\s\S]*?)</span>', r'<em>\1</em>', cine.group(1)) if cine else ''
    page = {'layout': 'contact', 'lang': g(r'<html lang="([a-z]+)"', src), 'langs': langs(src)}
    out = [f'<!--@page {json.dumps(page, ensure_ascii=False)}-->', '<!--@head-->', head_seo(src), '<!--@h1-->', h1, '<!--@lede-->', lede,
           '<!--@ways-->', '\n'.join(ways), '<!--@note-->', note, f'<!--@form {json.dumps(F, ensure_ascii=False)}-->', '']
    if pull:
        out += ['<!--@pull-->', pull]
    dest = os.path.join(ROOT, '_src/pages', rel)
    open(dest, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('  _src/pages/' + rel, '·', len(ways), 'accès')

for rel in sys.argv[1:]:
    run(rel)
