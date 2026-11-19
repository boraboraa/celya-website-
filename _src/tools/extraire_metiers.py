#!/usr/bin/env python3
"""Extraction unique : textes propres à chaque métier, lus dans les maquettes
docs/maquettes-14-11/metier-*.html -> data/metiers.json (partie FR).
Ruban, carte de résultat, cases, agenda Celya, confirmation, visuels des cartes.
Relancer écrase la partie « fr » ; les parties « nl » / « en » sont conservées."""
import re, html, glob, json, os, sys
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..'))
MAQ = os.path.join(ROOT, 'docs', 'maquettes-14-11')
OUT = os.path.join(ROOT, 'data', 'metiers.json')

# id interne -> (page FR, page NL, page EN ou None, photo)
PAGES = {
 'garages': ('garages.html','garages.html','garages.html'),
 'restaurants': ('restaurants.html','restaurants.html','restaurants.html'),
 'cabinets': ('cabinets.html','praktijken.html','medical-practices.html'),
 'veterinaires': ('veterinaires.html','dierenartsen.html',None),
 'independants': ('independants.html','zelfstandigen.html','self-employed.html'),
 'plombiers': ('plombiers.html','loodgieters.html',None),
 'chauffagistes': ('chauffagistes.html','verwarmingsinstallateurs.html',None),
 'electriciens': ('electriciens.html','elektriciens.html',None),
 'serruriers': ('serruriers.html','slotenmakers.html',None),
 'syndics': ('syndics.html','syndici.html',None),
 'fiduciaires': ('fiduciaires.html','boekhouders.html',None),
}

def txt(s):
    s = re.sub(r'<svg.*?</svg>', ' ', s, flags=re.S)
    return ' '.join(html.unescape(re.sub(r'<[^>]+>', ' ', s)).split())

def spans(s):
    s = re.sub(r'<svg.*?</svg>', '', s, flags=re.S)
    out = []
    for m in re.finditer(r'>([^<>]+)<', s):
        t = ' '.join(html.unescape(m.group(1)).split())
        if t: out.append(t)
    return out

def visual(block):
    """Type de visuel d'une carte + ses données, d'après la maquette."""
    v = re.search(r'<summary.*?(<div style="height:210px.*?)<div style="display:flex; justify-content:space-between; gap:14px', block, re.S)
    if not v:
        return {'v': 'photo'}
    vis = v.group(1)
    S = spans(vis)
    if 'background:url(' in vis or '<img src="assets/metiers-img' in vis:
        return {'v': 'photo'}
    if 'Fiche d' in ' '.join(S):
        d = dict(zip(S[1::2], S[2::2]))
        return {'v': 'fiche', 'appelant': d.get('Appelant',''), 'motif': d.get('Motif',''), 'adresse': d.get('Adresse','')}
    if S and S[0].startswith('Transféré'):
        return {'v': 'transfert', 'titre': S[-2], 'sous': S[-1]}
    if S[:3] == ['RDV pris','À rappeler','Urgent']:
        return {'v': 'tri'}
    if S and S[0].startswith('En appel'):
        return {'v': 'simultanes'}
    if "Aujourd'hui" in S and 'Libre' in S:
        i = S.index('10h')
        return {'v': 'agenda', 'rdv': S[i+1]}
    if len(S) == 2:
        return {'v': 'qr', 'q': S[0], 'r': S[1]}
    return {'v': 'photo', '_maquette': S[:6]}

def reponse(quand):
    """La maquette répond « À jeudi ! » partout : on suit le jour réel du rendez-vous."""
    jour = quand.split(' ')[0].lower()
    if jour in ('lundi','mardi','mercredi','jeudi','vendredi','samedi','dimanche'):
        return f"Merci, c'est confirmé. À {jour} !"
    return "Merci, c'est confirmé. À tout à l'heure !"

def extract(fid):
    s = open(os.path.join(MAQ, f'metier-{fid}.html'), encoding='utf-8').read()
    s = re.sub(r'<style.*?</style>', '', s, flags=re.S)
    tps = [html.unescape(m) for m in re.findall(r'<textPath[^>]*>([^<]*)<', s)]
    def first_cycle(t):
        parts = [p.strip() for p in t.split(' · ') if p.strip()]
        out = []
        for p in parts:
            if p in out: break
            out.append(p)
        return out
    caller, janet = first_cycle(tps[0]), first_cycle(tps[1])
    L = spans(s)
    i = next(k for k, x in enumerate(L) if x.startswith('Appel entrant · '))
    j = L.index('Janet en 15 secondes')
    res = L[i:j]
    heure = res[0].split(' · ')[1]
    has_cal = 'gcal' in re.search(r'Janet répond · 00:42(.*?)Janet en 15 secondes', s, re.S).group(1).split('assets/wa.svg')[0]
    k = res.index('Celya · WhatsApp')
    chip = {'cal': has_cal, 'b': res[2], 's': res[3].lstrip('· ').strip()}
    wa = {'heure': res[k+1], 'titre': res[k+2], 'sous': res[k+3]}
    # visuel par carte, dans l'ordre de la maquette
    grid = s[s.find('Touchez une carte pour le détail'):s.find('Chaque appel, rangé')]
    cards = []
    for blk in re.findall(r'<details.*?</details>', grid, re.S):
        h3 = txt(re.search(r'<h3[^>]*>(.*?)</h3>', blk, re.S).group(1))
        vis = visual(blk); vis['h'] = h3
        cards.append(vis)
    c = L.index('dans la bonne case.')
    cases = {'rdv_t': L[c+3], 'rdv_p': L[c+4], 'rappel_t': L[c+6], 'rappel_p': L[c+7], 'urgent_t': L[c+9], 'urgent_p': L[c+10]}
    ag = next(x for x in L if x.startswith('Un agenda complet'))
    p = L.index('Compte professionnel')
    conf = {'initiales': L[p-2], 'entreprise': L[p-1], 'message': L[p+2], 'quand': L[p+3], 'quoi': L[p+4], 'ou': L[p+5], 'reponse': reponse(L[p+3]), 'chip': L[p+14]}
    fr, nl, en = PAGES[fid]
    return {
        'pages': {'fr': fr, 'nl': nl, 'en': en},
        'photo': fid,
        'video': None,
        'fr': {
            'ruban': {'appelant': caller, 'janet': janet, 'heure': heure, 'chip': chip, 'wa': wa},
            'cartes': cards, 'cases': cases, 'agenda_celya': ag, 'confirmation': conf,
        },
    }

def main():
    old = json.load(open(OUT, encoding='utf-8')) if os.path.exists(OUT) else {}
    data = {'_doc': old.get('_doc', "Textes propres à chaque métier (ruban, cases, agenda, confirmation, visuels des cartes). Partie fr extraite des maquettes par _src/tools/extraire_metiers.py ; parties nl/en traduites à la main. « video » : null tant qu'aucune source n'existe : le composant montre alors la photo seule, sans bouton lecture.")}
    for fid in PAGES:
        e = extract(fid)
        prev = old.get(fid, {})
        for lang in ('nl', 'en'):
            if lang in prev: e[lang] = prev[lang]
        if prev.get('video'): e['video'] = prev['video']
        data[fid] = e
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=1)
        f.write('\n')
    for fid in PAGES:
        print(fid, [c['v'] for c in data[fid]['fr']['cartes']])

main()
