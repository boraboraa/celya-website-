#!/usr/bin/env python3
"""Blog (FR, NL, EN), une fois par page : lit l'article ou l'index publié
(ancien thème) et écrit sa source _src/pages/<chemin>.html pour les gabarits
« billet » et « blog ». Le texte est recopié tel quel ; seules disparaissent les
enveloppes d'animation (.lr/.l2, .it/.gradtxt → <em>), les icônes des listes de
liens et les boutons (le gabarit les fournit). Refuse une page déjà générée.

    python3 _src/tools/blog_source.py blog/index.html blog/garages-appels-manques.html …
"""
import json, os, re, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def clean(h):
    h = re.sub(r'</span></span>(?=<span class="lr">)', '</span></span> ', h)
    for _ in range(4):
        h = re.sub(r'<span class="(?:lr|l2)"><span>([\s\S]*?)</span></span>', r'\1', h)
    h = re.sub(r'<span class="(?:gradtxt )?it(?: gradtxt)?">([\s\S]*?)</span>', r'<em>\1</em>', h)
    h = re.sub(r'<span class="gradtxt">([\s\S]*?)</span>', r'\1', h)
    return re.sub(r'\s+', ' ', h).strip()

def head_seo(src):
    head = src[src.index('<head>') + 6: src.index('</head>')]
    keep = []
    for m in re.finditer(r'<title>[\s\S]*?</title>|<meta\s[^>]*>|<link\s[^>]*>|<script type="application/ld\+json">[\s\S]*?</script>', head, re.I):
        t = m.group(0)
        if re.match(r'<meta (charset|name="viewport"|name="theme-color"|name="color-scheme")', t, re.I): continue
        if re.match(r'<link rel="(icon|stylesheet|preload)"', t, re.I): continue
        keep.append(t)
    return '\n'.join(keep)

def langs(src):
    m = re.search(r'<div class="lang">([\s\S]*?)</div>', src)
    return {a[1].lower(): a[0] for a in re.findall(r'<a[^>]*href="([^"]*)"[^>]*>([A-Z]{2})</a>', m.group(1))} if m else {}

def rows(html):
    return '\n'.join(f'<a href="{h}"><b>{b}</b><span>{s}</span></a>' for h, b, s in
                     re.findall(r'<a class="mrow" href="([^"]*)">[\s\S]*?<b>([\s\S]*?)</b><span>([\s\S]*?)</span>[\s\S]*?</a>', html))

def body_clean(s):
    s = re.sub(r'<svg[\s\S]*?</svg>', '', s)
    s = re.sub(r'<h2([^>]*?) class="reveal"([^>]*)>([\s\S]*?)</h2>', lambda m: f'<h2{m.group(1)}{m.group(2)}>{clean(m.group(3))}</h2>', s)
    s = re.sub(r'<h2([^>]*)>([\s\S]*?)</h2>', lambda m: f'<h2{m.group(1)}>{clean(m.group(2))}</h2>', s)
    s = s.replace(' reveal"', '"').replace('class="figure"', 'class="stat"')
    return '\n'.join(l.strip() for l in s.strip().split('\n') if l.strip())

def post(rel, src):
    art = re.search(r'<article class="article">([\s\S]*?)</article>', src).group(1)
    kick = re.search(r'<div class="kick">([\s\S]*?)</div>', art).group(1).strip()
    h1 = clean(re.search(r'<h1>([\s\S]*?)</h1>', art).group(1))
    meta = re.search(r'<div class="art-meta">([\s\S]*?)</div>', art).group(1)
    meta = ' · '.join(x.strip() for x in re.findall(r'<span>([\s\S]*?)</span>(?=<span>|$)', meta)).replace('<b>', '').replace('</b>', '')
    chapo = re.search(r'<p class="chapo-a">([\s\S]*?)</p>', art).group(1).strip()
    fig = re.search(r'<figure class="art-hero[^"]*">([\s\S]*?)</figure>', art)
    toc = re.findall(r'<a href="(#[^"]*)">([\s\S]*?)</a>', re.search(r'<nav class="toc">([\s\S]*?)</nav>', art).group(1))
    start = art.index('</details>', art.index('toc-m')) + len('</details>') if 'toc-m' in art else fig.end()
    cta_i = art.index('<div class="art-cta')
    body = art[start:cta_i]
    rel_blk = ''
    ml = re.search(r'<h2[^>]*>((?:(?!</h2>)[\s\S])*)</h2>\s*<div class="mlist[^"]*">([\s\S]*?)\n\s*</div>\s*$', body)
    if ml:
        rel_blk = f'<h2>{clean(ml.group(1))}</h2>\n{rows(ml.group(2))}'
        body = body[:ml.start()]
    cta = art[cta_i:]
    cta_h2 = clean(re.search(r'<h2>([\s\S]*?)</h2>', cta).group(1))
    cta_p = re.search(r'</h2>\s*<p>([\s\S]*?)</p>', cta).group(1)
    sec = re.search(r'<a class="btn btn-ghost" href="([^"]*)">([\s\S]*?)</a>', cta)
    foot = re.search(r'<p class="art-foot">([\s\S]*?)</p>', cta).group(1).strip()
    page = {'layout': 'billet', 'lang': re.search(r'<html lang="([a-z]+)"', src).group(1), 'langs': langs(src)}
    out = [f'<!--@page {json.dumps(page, ensure_ascii=False)}-->', '<!--@head-->', head_seo(src),
           '<!--@kick-->', kick, '<!--@h1-->', h1, '<!--@meta-->', meta, '<!--@lede-->', chapo,
           '<!--@figure-->', '\n'.join(l.strip() for l in fig.group(1).strip().split('\n')),
           '<!--@toc-->', '\n'.join(f'<a href="{h}">{t}</a>' for h, t in toc),
           '<!--@body-->', body_clean(body)]
    if rel_blk:
        out += ['<!--@related-->', rel_blk]
    out += ['<!--@cta' + (' ' + json.dumps({'href': sec.group(1), 'label': sec.group(2).strip()}, ensure_ascii=False) if sec else '') + '-->', f'<h2>{cta_h2}</h2>\n<p>{cta_p}</p>',
            '<!--@foot-->', foot]
    return out

def index(rel, src):
    main = src[src.index('<main'):src.index('</main>')]
    hero = re.search(r'<section class="blog-hero">([\s\S]*?)</section>', main).group(1)
    h1 = clean(re.search(r'<h1>([\s\S]*?)</h1>', hero).group(1))
    lede = re.search(r'<p class="sub">([\s\S]*?)</p>', hero).group(1).strip()
    cards = []
    for m in re.finditer(r'<a class="tile bcard[^"]*" href="([^"]*)">([\s\S]*?)\n\s*</a>', main):
        c = m.group(2)
        img = re.search(r'<img [^>]*>', c).group(0)
        img = re.sub(r' sizes="[^"]*"', ' sizes="(max-width:720px) 100vw, 400px"', img)
        if 'loading=' not in img:
            img = img.replace('<img ', '<img loading="lazy" decoding="async" ')
        bm = re.search(r'<span class="bmeta">([\s\S]*?)</span>\s*<h2>', c).group(1)
        h2 = clean(re.search(r'<h2>([\s\S]*?)</h2>', c).group(1))
        chapo = re.search(r'<span class="chapo">([\s\S]*?)</span>', c).group(1).strip()
        more = re.search(r'<span class="bmore">([\s\S]*?)<i', c).group(1).strip()
        cards.append(f'<a class="post" href="{m.group(1)}">{img}<span class="post-m">{bm}</span><h2>{h2}</h2><span class="post-c">{chapo}</span><span class="post-more">{more}</span></a>')
    soon = re.search(r'<p class="bsoon">([\s\S]*?)</p>', main)
    page = {'layout': 'blog', 'lang': re.search(r'<html lang="([a-z]+)"', src).group(1), 'langs': langs(src)}
    out = [f'<!--@page {json.dumps(page, ensure_ascii=False)}-->', '<!--@head-->', head_seo(src),
           '<!--@h1-->', h1, '<!--@lede-->', lede, '<!--@posts-->', '\n'.join(cards) + (f'\n<p class="backrow">{soon.group(1)}</p>' if soon else '')]
    for s in re.finditer(r'<section class="freesec[^"]*">([\s\S]*?)</section>', main):
        k = re.search(r'<div class="kick"><span>([\s\S]*?)</span></div>', s.group(1))
        h2 = clean(re.search(r'<h2>([\s\S]*?)</h2>', s.group(1)).group(1))
        out += ['<!--@related' + (' ' + json.dumps({'kick': k.group(1)}, ensure_ascii=False) if k else '') + '-->', f'<h2>{h2}</h2>\n{rows(s.group(1))}']
    return out

for rel in sys.argv[1:]:
    src = open(os.path.join(ROOT, rel), encoding='utf-8').read()
    if 'celya.css' in src:
        raise SystemExit(f'{rel} est déjà une page générée : restaurer l\'ancienne depuis git avant d\'extraire')
    out = index(rel, src) if 'blog-hero' in src else post(rel, src)
    dest = os.path.join(ROOT, '_src/pages', rel)
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    open(dest, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('  _src/pages/' + rel)
