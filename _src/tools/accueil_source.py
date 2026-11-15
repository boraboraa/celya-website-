#!/usr/bin/env python3
"""Source des accueils NL et EN (une fois) : lit la page publiée et l'extraction
brute de _src/tools/extraire_page.mjs, et écrit _src/pages/<lang>/index.html
au même format que l'accueil FR (rôles steps, roles, fiche, agenda, metiers,
articles). Le texte est repris tel quel ; les montants de la FAQ prix passent
en jetons {{offre.…}}, dans la FAQ visible comme dans le FAQPage.

    node _src/tools/extraire_page.mjs accueil nl/index.html en/index.html
    python3 _src/tools/accueil_source.py nl en
"""
import html as H, json, os, re, sys

ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))

def clean(h):
    h = re.sub(r'</span></span>(?=<span class="lr">)', '</span></span> ', h)
    for _ in range(4):
        h = re.sub(r'<span class="(?:lr|l2)"><span>([\s\S]*?)</span></span>', r'\1', h)
    h = re.sub(r'<span class="(?:gradtxt )?it(?: gradtxt)?">([\s\S]*?)</span>', r'<em>\1</em>', h)
    return re.sub(r'\s+', ' ', h).strip()

def block(src, name, nth=0):
    ms = list(re.finditer(r'<!--@' + name + r'(?: \{.*?\})?-->\n', src))
    m = ms[nth]
    nxt = re.search(r'\n<!--@', src[m.end():])
    return src[m.end(): m.end() + nxt.start()] if nxt else src[m.end():].rstrip('\n')

PRICE = {
    'nl': [('75, 150 en 300', '{{offre.liste_prix}}'), ('250, 750 en 1 750', '{{offre.liste_minutes}}'), ('250, 750 en 1.750', '{{offre.liste_minutes}}')],
    'en': [('€75, €150 and €300', '€{{offre.essentiel.prix}}, €{{offre.pro.prix}} and €{{offre.premier.prix}}'), ('250, 750 and 1,750', '{{offre.liste_minutes}}')],
}

def tokens(text, lang):
    t = text.replace('&euro;', '€').replace('&nbsp;', ' ')
    t2 = t.replace(' ', ' ')
    for old, new in PRICE[lang]:
        t2 = t2.replace(old, new)
    return t2

def build(lang):
    rel = f'{lang}/index.html'
    pub = open(os.path.join(ROOT, rel), encoding='utf-8').read()
    ext = open(os.path.join(ROOT, '_src/pages', rel), encoding='utf-8').read()
    main = pub[pub.find('<main'):pub.find('</main>')]
    main = re.sub(r'<svg.*?</svg>', '', main, flags=re.S)
    meta = re.search(r'<!--@page (\{.*?\})-->', ext).group(1)
    head = block(ext, 'head')
    h1 = clean(re.search(r'<h1>([\s\S]*?)</h1>', main).group(1))
    sub = re.search(r'<p class="sub">([\s\S]*?)</p>', main).group(1)
    lede = re.split(r'(?<=[.!?])\s', sub.strip())[0]
    # steps
    st = re.search(r'id="marche">[\s\S]*?<div class="kick"><span>([\s\S]*?)</span></div>\s*<h2>([\s\S]*?)</h2>[\s\S]*?<div class="steps">([\s\S]*?)</section>', main)
    steps = ''.join(f'<li><b>{b}</b>{"".join(f"<p>{p}</p>" for p in ps)}{acts}</li>'
                    for b, ps, acts in [(re.search(r'<div class="ic"></div>\s*<b>([\s\S]*?)</b>', x).group(1),
                                         re.findall(r'<p>([\s\S]*?)</p>', x),
                                         (lambda a: f'<p class="acts">{a.group(1)}</p>' if a else '')(re.search(r'<div class="acts">([\s\S]*?)</div>', x)))
                                        for x in re.findall(r'<div class="step">([\s\S]*?)\n</div>', st.group(3))])
    # roles : la citation qui les précède, puis les trois tuiles
    pull1 = clean(re.search(r'<p class="cine-line">([\s\S]*?)</p>', main).group(1))
    roles = ''.join(f'<div class="role"><p class="label">{k}</p><h3>{h3}</h3><p>{p}</p></div>'
                    for k, h3, p in re.findall(r'<section class="tile t-role reveal">[\s\S]*?<div class="kick">([\s\S]*?)</div>\s*<h3>([\s\S]*?)</h3>\s*<p>([\s\S]*?)</p>', main))
    fi = re.search(r'id="fiche">[\s\S]*?<div class="kick"><span>([\s\S]*?)</span></div>\s*<h2>([\s\S]*?)</h2>', main)
    ag = re.search(r'id="agenda">[\s\S]*?<h2>([\s\S]*?)</h2>\s*<p class="agf-sub">([\s\S]*?)</p>', main)
    mt = re.search(r'id="metier">\s*<div class="kick"><span>([\s\S]*?)</span></div>\s*<h2>([\s\S]*?)</h2>', main)
    cards = re.findall(r'<a class="tile pcard reveal" href="([^"]*)">[\s\S]*?<b>([\s\S]*?)</b><em>([\s\S]*?)</em>', main)
    pull2 = [clean(x) for x in re.findall(r'<p class="cine-line">([\s\S]*?)</p>', main)][1:]
    ar = re.search(r'id="articles">\s*<div class="kick"><span>([\s\S]*?)</span></div>\s*<h2>([\s\S]*?)</h2>', main)
    posts = re.findall(r'<a class="tile bcard reveal" href="([^"]*)">\s*<span class="bimg"><img src="([^"]*)"[^>]*?alt="([^"]*)"[^>]*></span>\s*<span class="bbody">\s*<span class="bmeta"><b>([\s\S]*?)</b><time datetime="([^"]*)">([\s\S]*?)</time></span>\s*<h3>([\s\S]*?)</h3>\s*<span class="chapo">([\s\S]*?)</span>\s*<span class="bmore">([\s\S]*?)<i', main)
    more = re.search(r'<p class="bsoon">([\s\S]*?)</p>', main)
    faq = block(ext, 'faq')
    faq_attrs = re.search(r'<!--@faq (\{.*?\})-->', ext).group(1)
    cta = block(ext, 'cta')
    # montants : jetons dans la FAQ visible et dans le JSON-LD
    def tok_vis(s):
        return re.sub(r'(<div class="a">)([\s\S]*?)(</div>)', lambda m: m.group(1) + tokens(m.group(2), lang) + m.group(3), s)
    faq = tok_vis(faq)
    head = re.sub(r'("text": ")([^"]*)(")', lambda m: m.group(1) + tokens(m.group(2), lang) + m.group(3), head)
    out = [f'<!--@page {meta}-->', '<!--@head-->', head, '<!--@h1-->', h1, '<!--@lede-->', lede,
           f'<!--@section {json.dumps({"role": "steps", "kick": st.group(1), "sid": "marche"}, ensure_ascii=False)}-->',
           f'<h2>{clean(st.group(2))}</h2>', f'<ol class="steps" role="list">\n{steps}\n</ol>',
           f'<!--@section {json.dumps({"role": "roles"}, ensure_ascii=False)}-->',
           f'<p class="roles-lead">{pull1}</p>', roles,
           f'<!--@section {json.dumps({"role": "fiche", "kick": fi.group(1), "sid": "fiche"}, ensure_ascii=False)}-->',
           f'<h2>{clean(fi.group(2))}</h2>',
           f'<!--@section {json.dumps({"role": "agenda", "sid": "agenda"}, ensure_ascii=False)}-->',
           f'<h2>{clean(ag.group(1))}</h2>', f'<p>{ag.group(2)}</p>']
    for p in pull2:
        out += ['<!--@pull-->', p]
    out += [f'<!--@section {json.dumps({"role": "metiers", "kick": mt.group(1), "sid": "metier"}, ensure_ascii=False)}-->',
            f'<h2>{clean(mt.group(2))}</h2>']
    out += [f'<a href="{h}"><b>{b}</b><span>{e}</span></a>' for h, b, e in cards]
    out += [f'<!--@section {json.dumps({"role": "articles", "kick": ar.group(1), "sid": "articles"}, ensure_ascii=False)}-->',
            f'<h2>{clean(ar.group(2))}</h2>']
    for h, img, alt, cat, dt, d, h3, chapo, more_t in posts:
        out.append(f'<a class="post" href="{h}"><img src="{img.replace("-800.webp", "-800.webp")}" width="800" height="500" alt="{alt}" loading="lazy" decoding="async"><span class="post-m"><b>{cat}</b><time datetime="{dt}">{d}</time></span><h3>{h3}</h3><span class="post-c">{chapo}</span><span class="post-more">{more_t.strip()}</span></a>')
    if more:
        out.append(f'<p class="backrow">{more.group(1)}</p>')
    out += [f'<!--@faq {faq_attrs}-->', faq, '<!--@cta-->', cta]
    dest = os.path.join(ROOT, '_src/pages', rel)
    open(dest, 'w', encoding='utf-8').write('\n'.join(out) + '\n')
    print('  _src/pages/' + rel, '·', len(cards), 'métiers ·', len(posts), 'articles ·', len(pull2), 'citation(s)')

# Corrections de textes devenus faux (visible ET JSON-LD) : (ancien, nouveau visible, nouveau JSON-LD)
FIX = {
    'nl': [("Minder dan een secretaresse, meer dan een antwoordapparaat. De prijs hangt af van uw belvolume: na een kort gesprek krijgt u een duidelijk voorstel, zonder verborgen kosten.",
            'Drie formules: {{offre.liste_prix}} € per maand excl. btw, voor {{offre.liste_minutes}} minuten gesprekken. Alles staat op de <a href="prijzen.html">prijzenpagina</a>: wat elke formule bevat, en wat er gebeurt als u boven uw minuten gaat.',
            "Drie formules: {{offre.liste_prix}} € per maand excl. btw, voor {{offre.liste_minutes}} minuten gesprekken. Alles staat op de prijzenpagina: wat elke formule bevat, en wat er gebeurt als u boven uw minuten gaat."),
           ("Enkele dagen. We bereiden Janet voor", "Binnen 48 uur. We bereiden Janet voor", None)],
    'en': [("A few days. We prepare Janet", "Within 48 hours. We prepare Janet", None)],
}
# NL : les sept autres secteurs dans la liste des métiers (les onze pages NL existent)
EXTRA = {'nl': [("dierenartsen.html", "Dierenartsen", "Afspraken en dringende oproepen gesorteerd tijdens de consultatie."),
                ("loodgieters.html", "Loodgieters", "Op de werf komen de dringende oproepen bij u terecht."),
                ("verwarmingsinstallateurs.html", "Verwarmingsinstallateurs", "Pannes van de ketel raken niet meer zoek."),
                ("elektriciens.html", "Elektriciens", "Offertes en pechgevallen genoteerd, ook tijdens een interventie."),
                ("slotenmakers.html", "Slotenmakers", "Ook 's nachts neemt ze op."),
                ("syndici.html", "Syndici", "De mede-eigenaars hebben altijd iemand aan de lijn."),
                ("boekhouders.html", "Boekhouders", "Klanten teruggebeld, deadlines gerespecteerd.")]}

def post(lang):
    p = os.path.join(ROOT, '_src/pages', lang, 'index.html')
    s = open(p, encoding='utf-8').read()
    for old, new, ld in FIX.get(lang, []):
        i = s.index('<!--@faq')
        head, rest = s[:i], s[i:]
        if old not in head or old not in rest:
            raise SystemExit(f'{lang} : texte à corriger introuvable : {old[:50]}')
        s = head.replace(old, ld or new) + rest.replace(old, new)
    if lang in EXTRA:
        i = s.index('<!--@section {"role": "articles"')
        s = s[:i] + ''.join(f'<a href="{h}"><b>{b}</b><span>{t}</span></a>\n' for h, b, t in EXTRA[lang]) + s[i:]
    open(p, 'w', encoding='utf-8').write(s)

for lang in sys.argv[1:] or ['nl', 'en']:
    build(lang)
    post(lang)
