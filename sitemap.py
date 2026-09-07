#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""sitemap.py — régénère sitemap.xml à partir des fichiers .html réellement présents.

Le format reproduit celui du sitemap publié, à la balise près :

    <?xml version="1.0" encoding="UTF-8"?>
    <urlset xmlns="…/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">
      <url>
        <loc>https://celya.be/prix.html</loc>
        <xhtml:link rel="alternate" hreflang="fr-BE" href="…"/>
        …
      </url>
    </urlset>

Pas de lastmod, pas de changefreq, pas de priority : le sitemap publié n'en a
jamais eu. Les <xhtml:link> ne sont pas déduits : ils recopient, dans l'ordre,
les <link rel="alternate" hreflang="…"> de la page elle-même — c'est ce que fait
le sitemap actuel sur ses 281 URL, vérifié une par une.

Ordre : les trois accueils (/, /en/, /nl/) d'abord, puis tout le reste par ordre
alphabétique de chemin.

Usage :
    python3 sitemap.py             affiche le diff, puis écrit si tout va bien
    python3 sitemap.py --dry-run   affiche le diff, n'écrit rien

Sortie 0 = propre, 1 = anomalie (rien n'est écrit). Bibliothèque standard uniquement.
"""

from __future__ import annotations

import json
import os
import re
import sys
from html.parser import HTMLParser

RACINE = os.path.dirname(os.path.abspath(__file__))
SITE = "https://celya.be/"
SITEMAP = os.path.join(RACINE, "sitemap.xml")

DOSSIERS = ("", "nl", "en", "blog", "nl/blog", "en/blog")

# Pages de travail : noindex, hors sitemap, liées de nulle part.
FICHIERS_EXCLUS = {"apercu.html", "apercu-visuel.html"}

# Fixtures des balayages visuels (sweep.js), préfixées par « _ ».
PREFIXE_FIXTURE = "_"

# Les pages légales sont indexables mais n'ont jamais figuré au sitemap publié :
# elles n'ont pas de requête à capter et elles diluent la soumission Search Console.
# Elles sont listées ici en clair plutôt que devinées, pour que la décision reste
# visible et réversible. Retirer une entrée suffit à la remettre au sitemap.
HORS_SITEMAP = {
    "legal.html", "privacy.html", "cookies.html",
    "nl/legal.html", "nl/privacy.html", "nl/cookies.html",
    "en/legal.html", "en/privacy.html", "en/cookies.html",
}

# Les trois accueils ouvrent le fichier, dans cet ordre.
ACCUEILS = ("index.html", "en/index.html", "nl/index.html")


# ---------------------------------------------------------------------------

class TeteDePage(HTMLParser):
    """Ne lit que ce dont le sitemap a besoin : les alternates et le meta robots."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.alternates = []      # [(hreflang, href)]
        self.robots = ""
        self.canonique = None
        self.fini = False

    def handle_starttag(self, tag, attrs):
        if self.fini:
            return
        a = dict(attrs)
        if tag == "body":
            self.fini = True
        elif tag == "meta" and (a.get("name") or "").lower() == "robots":
            self.robots = (a.get("content") or "").lower()
        elif tag == "link":
            rels = (a.get("rel") or "").lower().split()
            if "alternate" in rels and a.get("hreflang") and a.get("href"):
                self.alternates.append((a["hreflang"], a["href"]))
            elif "canonical" in rels and a.get("href"):
                self.canonique = a["href"]

    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs)


def lit(rel: str) -> TeteDePage:
    with open(os.path.join(RACINE, rel), encoding="utf-8") as f:
        source = f.read()
    p = TeteDePage()
    p.feed(source.split("</head>", 1)[0])
    p.close()
    return p


def url_de(rel: str) -> str:
    if rel == "index.html":
        return SITE
    if rel.endswith("/index.html"):
        return SITE + rel[: -len("index.html")]
    return SITE + rel


def fichier_de(url: str):
    """Chemin du dépôt correspondant à une URL du sitemap, ou None."""
    if not url.startswith(SITE):
        return None
    reste = url[len(SITE):]
    if reste == "" or reste.endswith("/"):
        reste += "index.html"
    return reste


def echappe(v: str) -> str:
    return v.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;").replace('"', "&quot;")


# ---------------------------------------------------------------------------

def urls_410():
    """Les sources renvoyées en 410 par vercel.json : jamais au sitemap."""
    try:
        with open(os.path.join(RACINE, "vercel.json"), encoding="utf-8") as f:
            conf = json.load(f)
    except (OSError, ValueError) as e:
        print("  vercel.json illisible (%s)." % e, file=sys.stderr)
        return set()
    return {r.get("source", "") for r in conf.get("rewrites", []) + conf.get("redirects", [])
            if r.get("destination") == "/api/gone"}


def recense(sources_410):
    """(pages retenues, [(page, motif d'exclusion)])."""
    retenues, ecartees = [], []
    for dossier in DOSSIERS:
        chemin = os.path.join(RACINE, dossier) if dossier else RACINE
        if not os.path.isdir(chemin):
            continue
        for nom in sorted(os.listdir(chemin)):
            if not nom.endswith(".html"):
                continue
            rel = ("%s/%s" % (dossier, nom)) if dossier else nom
            if nom in FICHIERS_EXCLUS:
                ecartees.append((rel, "page d'aperçu (noindex, hors site)"))
                continue
            if nom.startswith(PREFIXE_FIXTURE):
                ecartees.append((rel, "fixture de travail (préfixe « %s »)" % PREFIXE_FIXTURE))
                continue
            if "/" + rel in sources_410:
                ecartees.append((rel, "URL renvoyée en 410 par vercel.json"))
                continue
            if rel in HORS_SITEMAP:
                ecartees.append((rel, "page légale, hors sitemap publié (voir HORS_SITEMAP)"))
                continue
            tete = lit(rel)
            if "noindex" in tete.robots:
                ecartees.append((rel, "meta robots %s" % tete.robots))
                continue
            retenues.append((rel, tete))
    return retenues, ecartees


def ordonne(retenues):
    rang = {rel: i for i, rel in enumerate(ACCUEILS)}
    return sorted(retenues, key=lambda c: (rang.get(c[0], len(ACCUEILS)), url_de(c[0])))


def compose(retenues):
    lignes = ['<?xml version="1.0" encoding="UTF-8"?>',
              '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"'
              ' xmlns:xhtml="http://www.w3.org/1999/xhtml">']
    for rel, tete in retenues:
        lignes.append("  <url>")
        lignes.append("    <loc>%s</loc>" % echappe(url_de(rel)))
        for hreflang, href in tete.alternates:
            lignes.append('    <xhtml:link rel="alternate" hreflang="%s" href="%s"/>'
                          % (echappe(hreflang), echappe(href)))
        lignes.append("  </url>")
    lignes.append("</urlset>")
    return "\n".join(lignes) + "\n"


def anomalies(retenues, sources_410):
    """Ce qui empêche d'écrire : le sitemap ne doit jamais publier une URL fausse."""
    trouvees = []
    vues = {}
    connues = set()
    for dossier in DOSSIERS:
        chemin = os.path.join(RACINE, dossier) if dossier else RACINE
        if os.path.isdir(chemin):
            for nom in os.listdir(chemin):
                if nom.endswith(".html"):
                    connues.add(("%s/%s" % (dossier, nom)) if dossier else nom)

    for rel, tete in retenues:
        url = url_de(rel)
        if url in vues:
            trouvees.append("%s et %s produisent la même URL %s" % (vues[url], rel, url))
        vues[url] = rel
        if not tete.alternates:
            trouvees.append("%s : aucun <link rel=\"alternate\" hreflang> — "
                            "le sitemap publié en porte sur les 281 URL" % rel)
        if tete.canonique and tete.canonique != url:
            trouvees.append("%s : canonical %s ≠ URL du sitemap %s"
                            % (rel, tete.canonique, url))
        for hreflang, href in tete.alternates:
            if "/" + (fichier_de(href) or "") in sources_410:
                trouvees.append("%s : alternate %s pointe sur une URL en 410" % (rel, href))
                continue
            cible = fichier_de(href)
            if cible is None:
                trouvees.append("%s : alternate %s hors du domaine" % (rel, href))
            elif cible not in connues:
                trouvees.append("%s : alternate %s (hreflang=%s) ne correspond à aucun fichier"
                                % (rel, href, hreflang))
    return trouvees


# ---------------------------------------------------------------------------

def main(argv):
    if any(a in ("-h", "--help") for a in argv):
        print(__doc__)
        return 0
    a_blanc = any(a in ("-n", "--dry-run") for a in argv)
    inconnus = [a for a in argv if a not in ("-n", "--dry-run")]
    if inconnus:
        print("Argument inconnu : %s" % " ".join(inconnus), file=sys.stderr)
        return 1

    sources_410 = urls_410()
    retenues, ecartees = recense(sources_410)
    retenues = ordonne(retenues)
    neuf = compose(retenues)

    try:
        with open(SITEMAP, encoding="utf-8") as f:
            actuel = f.read()
    except OSError:
        actuel = ""

    urls_actuelles = re.findall(r"<loc>(.*?)</loc>", actuel)
    urls_neuves = [url_de(rel) for rel, _ in retenues]
    ajoutees = [u for u in urls_neuves if u not in set(urls_actuelles)]
    retirees = [u for u in urls_actuelles if u not in set(urls_neuves)]

    print("sitemap.py — %d URL retenues (%d fichiers .html écartés)"
          % (len(urls_neuves), len(ecartees)))
    print()

    print("  Pages écartées")
    motifs = {}
    for rel, motif in ecartees:
        motifs.setdefault(motif, []).append(rel)
    for motif in sorted(motifs):
        print("    %s (%d)" % (motif, len(motifs[motif])))
        for rel in sorted(motifs[motif]):
            print("      %s" % rel)
    if not ecartees:
        print("    aucune")
    print()

    print("  Diff avec le sitemap.xml actuel (%d URL)" % len(urls_actuelles))
    if not ajoutees and not retirees:
        print("    aucune URL ajoutée, aucune retirée")
    for u in ajoutees:
        print("    + %s" % u)
    for u in retirees:
        print("    - %s" % u)
    print()

    problemes = anomalies(retenues, sources_410)
    if problemes:
        print("  Anomalies — rien n'est écrit (%d)" % len(problemes))
        for p in problemes:
            print("    %s" % p)
        print()
        print("  %d URL. Sitemap NON écrit." % len(urls_neuves))
        return 1

    identique = (neuf == actuel)
    if identique:
        etat = "identique au fichier actuel, rien à écrire"
    elif a_blanc:
        etat = "--dry-run : rien n'est écrit"
    else:
        with open(SITEMAP, "w", encoding="utf-8") as f:
            f.write(neuf)
        etat = "sitemap.xml réécrit"

    balises = neuf.count("<xhtml:link")
    print("  %d URL, %d <xhtml:link> — %s." % (len(urls_neuves), balises, etat))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
