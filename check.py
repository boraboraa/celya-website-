#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""check.py — contrôles avant commit du site celya.be.

Les huit contrôles que CLAUDE.md impose, dans cet ordre :

  1. h1 unique          exactement un <h1> par page
  2. title              présent, <= 60 caractères (texte décodé, &nbsp; = 1 car.)
  3. meta description   présente, entre 70 et 158 caractères inclus
  4. canonical          unique, en https://celya.be/, sur le chemin réel du fichier
  5. JSON-LD            JSON valide, objet avec "@graph", et zéro "vatID"
  6. FAQPage == visible chaque Question/acceptedAnswer du @graph retrouvée mot pour
                        mot dans les <details><summary>…</summary><div class="a">…
  7. liens morts        tout href interne pointe sur un fichier existant, et toute
                        ancre #frag sur un id qui existe sur la page cible
  8. 410                aucun lien vers les neuf sources renvoyées à /api/gone

Usage :
    python3 check.py                 tout le dépôt (racine, nl/, en/, blog/…)
    python3 check.py fichier.html …  seulement ces fichiers

Sortie 0 = propre, 1 = au moins une erreur. Bibliothèque standard uniquement.
"""

from __future__ import annotations

import json
import os
import re
import sys
from html.parser import HTMLParser
from urllib.parse import unquote, urldefrag

RACINE = os.path.dirname(os.path.abspath(__file__))
SITE = "https://celya.be/"

# apercu.html et apercu-visuel.html sont des pages de travail (noindex, hors
# sitemap, liées de nulle part) ; apercu-visuel.html pèse 4,6 Mo. Jamais contrôlées.
FICHIERS_EXCLUS = {"apercu.html", "apercu-visuel.html"}

# Les fixtures de travail des balayages visuels (sweep.js) sont préfixées par « _ ».
# Elles ne sont ni publiées, ni au sitemap, ni liées : elles n'ont pas de title,
# pas de canonical et pas de JSON-LD, et n'ont donc rien à faire ici.
PREFIXE_FIXTURE = "_"

# Répertoires balayés quand on lance check.py sans argument.
DOSSIERS = ("", "nl", "en", "blog", "nl/blog", "en/blog")

LONGUEUR_TITLE_MAX = 60
LONGUEUR_DESC_MIN = 70
LONGUEUR_DESC_MAX = 158

CONTROLES = (
    ("h1", "h1 unique"),
    ("title", "title présent et <= %d caractères" % LONGUEUR_TITLE_MAX),
    ("desc", "meta description entre %d et %d caractères" % (LONGUEUR_DESC_MIN, LONGUEUR_DESC_MAX)),
    ("canonical", "canonical unique et conforme au chemin du fichier"),
    ("jsonld", "JSON-LD valide, en @graph, sans vatID"),
    ("faq", "FAQPage identique au texte visible"),
    ("liens", "liens internes morts"),
    ("410", "liens vers une URL en 410"),
)

BALISES_VIDES = {
    "area", "base", "br", "col", "embed", "hr", "img", "input", "link",
    "meta", "param", "source", "track", "wbr",
}

# Espaces qui doivent compter comme une espace ordinaire dans les comparaisons :
# insécable, insécable étroite, fine, demi-cadratin, cadratin, mot insécable.
ESPACES = "       ⁠"

# ---------------------------------------------------------------------------
# Faux positif connu : le champ honeypot des pages contact
# ---------------------------------------------------------------------------
# contact.html porte <input class="hp" name="website" tabindex="-1"> et la règle
# .hp{position:absolute;left:-9999px;opacity:0} le sort de l'écran. C'est un piège
# à robots : le champ doit rester dans le DOM, sans label, hors du viewport, et
# rester vide à l'envoi. Toute machinerie qui distingue « présent dans le DOM » de
# « visible à l'écran » le trouve — ici le extracteur de texte visible du contrôle 6,
# et le balayage visuel sweep.js le voit déborder à droite. CLAUDE.md tranche :
# « le faux positif connu de contact.html est à ignorer définitivement ».
# La même page existe en trois langues : la signature couvre les trois.


def est_honeypot(fichier: str, noeud: dict) -> bool:
    """Vrai pour le champ honeypot documenté des pages contact."""
    return (
        os.path.basename(fichier) == "contact.html"
        and noeud["balise"] == "input"
        and "hp" in noeud["classes"]
        and noeud["attrs"].get("name") == "website"
        and noeud["attrs"].get("tabindex") == "-1"
    )


# ---------------------------------------------------------------------------
# Utilitaires de texte
# ---------------------------------------------------------------------------

def normalise(texte):
    """Texte comparable : entités déjà décodées, balises retirées, espaces unifiés.

    Les insécables comptent pour une espace ordinaire : « prix&nbsp;? » dans le HTML
    et « prix ? » dans le JSON-LD sont le même texte pour un lecteur.
    """
    if texte is None:
        return None
    texte = re.sub(r"<[^>]*>", " ", texte)
    for e in ESPACES:
        texte = texte.replace(e, " ")
    return re.sub(r"\s+", " ", texte).strip()


def longueur_visible(texte):
    """Longueur en caractères du texte rendu : &nbsp; vaut 1, les espaces se collapsent."""
    if texte is None:
        return 0
    for e in ESPACES:
        texte = texte.replace(e, " ")
    return len(re.sub(r"\s+", " ", texte).strip())


ENTITE_RESIDUELLE = re.compile(r"&(?:[a-zA-Z][a-zA-Z0-9]{1,31}|#\d{1,7}|#[xX][0-9a-fA-F]{1,6});")


def premiere_divergence(a, b):
    """Position et extrait de la première différence entre deux textes normalisés."""
    n = min(len(a), len(b))
    i = 0
    while i < n and a[i] == b[i]:
        i += 1
    debut = max(0, i - 45)
    return i, a[debut:i + 45], b[debut:i + 45]


# ---------------------------------------------------------------------------
# Lecture des feuilles de style : quelles classes sortent un élément de l'écran
# ---------------------------------------------------------------------------

HORS_ECRAN = re.compile(
    r"(?:left|right|top|margin-left|text-indent)\s*:\s*-\s*(?:[1-9]\d{3,})(?:px|em|rem)"
    r"|clip\s*:\s*rect\(\s*0"
    r"|clip-path\s*:\s*inset\(\s*(?:50%|100%)",
    re.I,
)

_cache_css = {}


def classes_hors_ecran(css: str) -> set:
    """Classes dont la déclaration sort l'élément du viewport (technique honeypot / sr-only)."""
    trouvees = set()
    css = re.sub(r"/\*.*?\*/", " ", css, flags=re.S)
    for selecteur, bloc in re.findall(r"([^{}]+)\{([^{}]*)\}", css):
        if not HORS_ECRAN.search(bloc):
            continue
        for classe in re.findall(r"\.([A-Za-z0-9_-]+)", selecteur):
            trouvees.add(classe)
    return trouvees


def css_du_fichier(chemin_css: str) -> set:
    if chemin_css not in _cache_css:
        try:
            with open(chemin_css, encoding="utf-8") as f:
                _cache_css[chemin_css] = classes_hors_ecran(f.read())
        except OSError:
            _cache_css[chemin_css] = set()
    return _cache_css[chemin_css]


# ---------------------------------------------------------------------------
# Analyse d'une page
# ---------------------------------------------------------------------------

class AnalysePage(HTMLParser):
    """Un seul passage sur la page ; tout ce dont les huit contrôles ont besoin."""

    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.pile = []                 # [(balise, attrs, ligne)]
        self.h1 = []                   # lignes des <h1>
        self.title = None
        self.title_ligne = 0
        self.description = None
        self.description_ligne = 0
        self.nb_description = 0
        self.robots = None
        self.canoniques = []           # [(href, ligne)]
        self.alternates = []           # [(hreflang, href)]
        self.jsonld = []               # [(texte, ligne)]
        self.liens = []                # [(href, ligne, balise)]
        self.ids = set()
        self.styles = []               # contenu des <style> de la page
        self.feuilles = []             # href des <link rel=stylesheet> locaux
        self.details = []              # dicts {ligne, question, reponse, conteneur}
        self.hors_ecran = []           # dicts {ligne, balise, classes, attrs, dans_faq}
        self._detail = None
        self._tampon = None
        self._mode = None
        self._profondeur = 0
        self._dans_title = False
        self._script_ld = None
        self._dans_style = False

    # -- pile -----------------------------------------------------------------
    def _conteneur(self):
        """Identifiant du bloc qui contient le <details> : #id le plus proche, sinon section."""
        for balise, attrs, ligne in reversed(self.pile):
            if attrs.get("id"):
                return "#" + attrs["id"]
            if balise in ("section", "main", "article"):
                return "%s@%d" % (balise, ligne)
        return "page"

    # -- balises ---------------------------------------------------------------
    def handle_startendtag(self, tag, attrs):
        self.handle_starttag(tag, attrs, auto_fermante=True)

    def handle_starttag(self, tag, attrs, auto_fermante=False):
        a = {}
        for cle, val in attrs:
            if cle not in a:
                a[cle] = val if val is not None else ""
        ligne = self.getpos()[0]
        classes = set((a.get("class") or "").split())

        if a.get("id"):
            self.ids.add(a["id"])
        if tag == "a" and a.get("name"):
            self.ids.add(a["name"])          # ancre à l'ancienne

        if tag == "h1":
            self.h1.append(ligne)
        elif tag == "title":
            self._dans_title = True
            self.title = ""
            self.title_ligne = ligne
        elif tag == "meta":
            nom = (a.get("name") or "").lower()
            if nom == "description":
                self.nb_description += 1
                if self.description is None:
                    self.description = a.get("content", "")
                    self.description_ligne = ligne
            elif nom == "robots":
                self.robots = a.get("content", "")
        elif tag == "link":
            rels = (a.get("rel") or "").lower().split()
            href = a.get("href")
            if "canonical" in rels and href is not None:
                self.canoniques.append((href, ligne))
            if "alternate" in rels and a.get("hreflang") and href is not None:
                self.alternates.append((a["hreflang"], href))
            if "stylesheet" in rels and href and not href.startswith(("http", "//", "data:")):
                self.feuilles.append(href)
            if href is not None:
                self.liens.append((href, ligne, "link"))
        elif tag == "a":
            if a.get("href") is not None:
                self.liens.append((a["href"], ligne, "a"))
        elif tag == "style":
            self._dans_style = True
            self.styles.append("")
        elif tag == "script":
            if (a.get("type") or "").strip().lower() == "application/ld+json":
                self._script_ld = ["", ligne]

        self._noeud_hors_ecran(tag, a, classes, ligne)

        if tag in BALISES_VIDES or auto_fermante:
            return
        self.pile.append((tag, a, ligne))

        if tag == "details":
            self._detail = {
                "ligne": ligne,
                "question": None,
                "reponse": None,
                "conteneur": self._conteneur(),
                "hors_ecran": [],
            }
        elif tag == "summary" and self._detail is not None and self._tampon is None:
            self._tampon, self._mode, self._profondeur = [], "question", 0
        elif (tag == "div" and self._detail is not None and self._tampon is None
              and "a" in classes):
            self._tampon, self._mode, self._profondeur = [], "reponse", 0
        elif self._tampon is not None and tag == ("summary" if self._mode == "question" else "div"):
            self._profondeur += 1

    def _noeud_hors_ecran(self, tag, attrs, classes, ligne):
        if not classes or not self._classes_cachees:
            return
        if classes & self._classes_cachees:
            self.hors_ecran.append({
                "ligne": ligne, "balise": tag, "classes": classes,
                "attrs": attrs, "dans_faq": self._detail is not None,
            })

    def handle_endtag(self, tag):
        if tag == "title":
            self._dans_title = False
        elif tag == "style":
            self._dans_style = False
        elif tag == "script" and self._script_ld is not None:
            self.jsonld.append((self._script_ld[0], self._script_ld[1]))
            self._script_ld = None

        if self._tampon is not None:
            attendue = "summary" if self._mode == "question" else "div"
            if tag == attendue:
                if self._profondeur:
                    self._profondeur -= 1
                else:
                    texte = "".join(self._tampon)
                    if self._mode == "question":
                        self._detail["question"] = texte
                    else:
                        self._detail["reponse"] = texte
                    self._tampon, self._mode = None, None

        if tag == "details" and self._detail is not None:
            self.details.append(self._detail)
            self._detail = None

        for i in range(len(self.pile) - 1, -1, -1):
            if self.pile[i][0] == tag:
                del self.pile[i:]
                break

    def handle_data(self, data):
        if self._dans_title:
            self.title += data
        if self._dans_style and self.styles:
            self.styles[-1] += data
        if self._script_ld is not None:
            self._script_ld[0] += data
        if self._tampon is not None:
            self._tampon.append(data)


def analyse(chemin: str, source: str, dossier: str) -> AnalysePage:
    """Deux passages : le premier pour connaître les classes hors écran, le second pour tout le reste."""
    classes = classes_hors_ecran(" ".join(re.findall(r"<style[^>]*>(.*?)</style>", source, re.S | re.I)))
    for feuille in re.findall(r'<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"', source, re.I):
        if feuille.startswith(("http", "//", "data:")):
            continue
        classes |= css_du_fichier(os.path.normpath(os.path.join(dossier, feuille)))

    p = AnalysePage()
    p._classes_cachees = classes
    p.feed(source)
    p.close()
    return p


# ---------------------------------------------------------------------------
# Rassemblement des fichiers
# ---------------------------------------------------------------------------

def pages_du_depot():
    pages = []
    for dossier in DOSSIERS:
        chemin = os.path.join(RACINE, dossier) if dossier else RACINE
        if not os.path.isdir(chemin):
            continue
        for nom in sorted(os.listdir(chemin)):
            if not nom.endswith(".html") or nom in FICHIERS_EXCLUS:
                continue
            if nom.startswith(PREFIXE_FIXTURE):
                continue
            pages.append(os.path.join(dossier, nom) if dossier else nom)
    return sorted(pages)


def url_de(rel: str) -> str:
    if rel == "index.html":
        return SITE
    if rel.endswith("/index.html"):
        return SITE + rel[: -len("index.html")]
    return SITE + rel


def chemin_site(rel: str) -> str:
    """/chemin/tel-que-servi pour un fichier du dépôt."""
    return "/" + rel


# ---------------------------------------------------------------------------
# vercel.json : les neuf URL en 410
# ---------------------------------------------------------------------------

def urls_410():
    chemin = os.path.join(RACINE, "vercel.json")
    try:
        with open(chemin, encoding="utf-8") as f:
            conf = json.load(f)
    except (OSError, ValueError) as e:
        print("vercel.json illisible (%s) : contrôle 410 sauté." % e, file=sys.stderr)
        return set()
    sources = set()
    for regle in conf.get("rewrites", []) + conf.get("redirects", []):
        if regle.get("destination") == "/api/gone":
            sources.add(regle.get("source", ""))
    return sources


# ---------------------------------------------------------------------------
# Résolution d'un href interne
# ---------------------------------------------------------------------------

def resout(href: str, fichier: str):
    """(chemin_relatif_depot, fragment) ou (None, motif) si le lien n'est pas à contrôler."""
    href = href.strip()
    if href == "" or href.startswith(("mailto:", "tel:", "javascript:", "data:", "sms:")):
        return None, "externe"
    if href.startswith("//"):
        return None, "externe"
    if href.startswith(("http://", "https://")):
        if not href.startswith(SITE) and not href.startswith("http://celya.be/"):
            return None, "externe"
        href = "/" + href.split("://", 1)[1].split("/", 1)[1] if "/" in href.split("://", 1)[1] else "/"

    cible, fragment = urldefrag(href)
    cible = cible.split("?", 1)[0]
    cible = unquote(cible)

    if cible == "":
        return fichier, fragment                      # ancre sur la page courante

    if cible.startswith("/"):
        rel = cible.lstrip("/")
    else:
        rel = os.path.normpath(os.path.join(os.path.dirname(fichier), cible)).replace(os.sep, "/")
        if rel == ".":
            rel = ""

    termine_par_slash = cible.endswith("/") or cible in (".", "./")
    if termine_par_slash or os.path.isdir(os.path.join(RACINE, rel)):
        rel = (rel + "/index.html").lstrip("/") if rel else "index.html"
    return rel, fragment


# ---------------------------------------------------------------------------
# Les huit contrôles
# ---------------------------------------------------------------------------

class Rapport:
    def __init__(self):
        self.erreurs = {cle: [] for cle, _ in CONTROLES}
        self.notes = {cle: [] for cle, _ in CONTROLES}
        self.ignores = []      # le seul faux positif documenté : le honeypot de contact.html
        self.hors_faq = []     # tout autre élément hors écran : constat, pas faux positif

    def ajoute(self, controle, fichier, ligne, message, detail=None):
        self.erreurs[controle].append((fichier, ligne, message, detail))

    def note(self, controle, fichier, message):
        """Constat non bloquant : signalé, jamais compté comme erreur."""
        self.notes[controle].append((fichier, message))

    @property
    def total(self):
        return sum(len(v) for v in self.erreurs.values())


def controle_page(rel, page, rapport, ids_par_page, pages_connues, sources_410):
    # --- 1. h1 unique ------------------------------------------------------
    if len(page.h1) != 1:
        if not page.h1:
            rapport.ajoute("h1", rel, None, "aucun <h1>")
        else:
            rapport.ajoute("h1", rel, page.h1[0],
                           "%d <h1> (lignes %s)" % (len(page.h1), ", ".join(map(str, page.h1))))

    # --- 2. title ----------------------------------------------------------
    if page.title is None:
        rapport.ajoute("title", rel, None, "pas de <title>")
    else:
        n = longueur_visible(page.title)
        if n == 0:
            rapport.ajoute("title", rel, page.title_ligne, "<title> vide")
        elif n > LONGUEUR_TITLE_MAX:
            rapport.ajoute("title", rel, page.title_ligne,
                           "title de %d caractères (max %d)" % (n, LONGUEUR_TITLE_MAX),
                           normalise(page.title))

    # --- 3. meta description ----------------------------------------------
    if page.description is None:
        rapport.ajoute("desc", rel, None, "pas de meta description")
    else:
        n = longueur_visible(page.description)
        if page.nb_description > 1:
            rapport.ajoute("desc", rel, page.description_ligne,
                           "%d meta description" % page.nb_description)
        if not (LONGUEUR_DESC_MIN <= n <= LONGUEUR_DESC_MAX):
            rapport.ajoute("desc", rel, page.description_ligne,
                           "description de %d caractères (attendu %d-%d)"
                           % (n, LONGUEUR_DESC_MIN, LONGUEUR_DESC_MAX),
                           normalise(page.description))

    # --- 4. canonical ------------------------------------------------------
    attendue = url_de(rel)
    if not page.canoniques:
        rapport.ajoute("canonical", rel, None, "pas de <link rel=\"canonical\">")
    elif len(page.canoniques) > 1:
        rapport.ajoute("canonical", rel, page.canoniques[0][1],
                       "%d canonical (lignes %s)"
                       % (len(page.canoniques), ", ".join(str(l) for _, l in page.canoniques)))
    else:
        href, ligne = page.canoniques[0]
        if not href.startswith(SITE):
            rapport.ajoute("canonical", rel, ligne, "canonical hors %s : %s" % (SITE, href))
        elif href != attendue:
            rapport.ajoute("canonical", rel, ligne,
                           "canonical %s au lieu de %s" % (href, attendue))

    # --- 5. JSON-LD --------------------------------------------------------
    graphes = []
    for texte, ligne in page.jsonld:
        if "vatID" in texte:
            rapport.ajoute("jsonld", rel, ligne,
                           "vatID présent dans le JSON-LD (la TVA n'est pas activée)")
        try:
            objet = json.loads(texte)
        except ValueError as e:
            rapport.ajoute("jsonld", rel, ligne, "JSON-LD invalide : %s" % e)
            continue
        if not isinstance(objet, dict):
            rapport.ajoute("jsonld", rel, ligne,
                           "JSON-LD racine de type %s, attendu un objet avec @graph"
                           % type(objet).__name__)
            continue
        if "@graph" not in objet:
            rapport.ajoute("jsonld", rel, ligne,
                           "JSON-LD sans @graph (le dépôt est en @graph) — clés : %s"
                           % ", ".join(sorted(objet)[:6]))
            continue
        if not isinstance(objet["@graph"], list):
            rapport.ajoute("jsonld", rel, ligne, "@graph n'est pas une liste")
            continue
        graphes.append((objet["@graph"], ligne))
    if not page.jsonld:
        # Le contrôle porte sur la validité des blocs présents, pas sur leur
        # présence : une page sans JSON-LD n'est pas une faute, mais se signale.
        rapport.note("jsonld", rel, "aucun bloc application/ld+json")

    # --- 6. FAQPage == texte visible --------------------------------------
    controle_faq(rel, page, graphes, rapport)

    # --- 7 & 8. liens ------------------------------------------------------
    vus = set()
    for href, ligne, balise in page.liens:
        cible, fragment = resout(href, rel)
        if cible is None:
            continue
        cle = (href, cible, fragment)
        if cle in vus:
            continue
        vus.add(cle)

        if chemin_site(cible) in sources_410:
            rapport.ajoute("410", rel, ligne,
                           "lien vers %s — URL renvoyée en 410 par vercel.json" % chemin_site(cible))
            continue

        if not os.path.isfile(os.path.join(RACINE, cible)):
            rapport.ajoute("liens", rel, ligne,
                           "href=\"%s\" → %s : fichier absent" % (href, cible))
            continue

        if fragment and cible in pages_connues:
            if fragment not in ids_par_page[cible]:
                rapport.ajoute("liens", rel, ligne,
                               "href=\"%s\" : la page %s existe mais n'a pas d'id « %s »"
                               % (href, cible, fragment))

    # --- faux positifs connus ---------------------------------------------
    for noeud in page.hors_ecran:
        if est_honeypot(rel, noeud):
            rapport.ignores.append((
                rel, noeud["ligne"],
                "<input class=\"hp\" name=\"website\"> — champ honeypot anti-robots, "
                "sorti de l'écran par .hp{position:absolute;left:-9999px}. Présent dans le "
                "DOM, invisible à l'écran : c'est ce qui le fait remonter. Faux positif "
                "connu, ignoré définitivement (CLAUDE.md).",
            ))
        elif noeud["dans_faq"]:
            rapport.ajoute("faq", rel, noeud["ligne"],
                           "<%s class=\"%s\"> hors écran dans un <details> : le texte visible "
                           "de la FAQ n'est pas ce que lit un visiteur"
                           % (noeud["balise"], " ".join(sorted(noeud["classes"]))))
        else:
            # Ce n'est PAS un faux positif connu : c'est un élément hors écran que
            # personne n'a documenté. Non bloquant parce qu'il est hors FAQ, mais
            # il se lit — le ranger avec le honeypot rendrait la ligne « faux
            # positif connu » fausse dès qu'un second cas apparaît.
            rapport.hors_faq.append((
                rel, noeud["ligne"],
                "<%s class=\"%s\"> hors écran, hors FAQ — non bloquant, à regarder si c'est nouveau"
                % (noeud["balise"], " ".join(sorted(noeud["classes"]))),
            ))


def controle_faq(rel, page, graphes, rapport):
    questions = []
    for graphe, ligne in graphes:
        for noeud in graphe:
            if not isinstance(noeud, dict):
                continue
            types = noeud.get("@type")
            types = types if isinstance(types, list) else [types]
            if "FAQPage" not in types:
                continue
            entites = noeud.get("mainEntity") or []
            if isinstance(entites, dict):
                entites = [entites]
            for q in entites:
                if not isinstance(q, dict):
                    continue
                reponse = q.get("acceptedAnswer") or {}
                questions.append({
                    "nom_brut": q.get("name"),
                    "nom": normalise(q.get("name")),
                    "reponse_brute": reponse.get("text") if isinstance(reponse, dict) else None,
                    "reponse": normalise(reponse.get("text")) if isinstance(reponse, dict) else None,
                    "ligne": ligne,
                })
    if not questions:
        return

    # Les <details> de la page qui portent bien une réponse <div class="a">.
    # Les <details> de sommaire (blog) n'en ont pas : ils ne sont pas de la FAQ.
    blocs = [d for d in page.details if d["reponse"] is not None]
    par_question = {}
    for d in blocs:
        par_question.setdefault(normalise(d["question"]), []).append(d)

    apparies = set()
    for q in questions:
        candidats = par_question.get(q["nom"])
        if not candidats:
            rapport.ajoute("faq", rel, q["ligne"],
                           "question du JSON-LD absente du HTML : « %s »" % (q["nom"] or "(sans nom)"))
            continue
        d = candidats[0]
        apparies.add(id(d))
        visible = normalise(d["reponse"])
        if visible != q["reponse"]:
            i, extrait_json, extrait_html = premiere_divergence(q["reponse"] or "", visible or "")
            note = ""
            if q["reponse"] and ENTITE_RESIDUELLE.search(q["reponse"]):
                note = ("  → le JSON-LD contient une entité HTML non décodée (%s) : "
                        "elle s'affichera telle quelle dans le résultat enrichi"
                        % ENTITE_RESIDUELLE.search(q["reponse"]).group(0))
            rapport.ajoute(
                "faq", rel, d["ligne"],
                "réponse différente du JSON-LD pour « %s » (1re divergence au caractère %d)"
                % (q["nom"], i),
                "JSON-LD : …%s…\n      HTML    : …%s…%s"
                % (extrait_json, extrait_html, ("\n    " + note) if note else ""),
            )

    # Sens inverse : un <details> de FAQ absent du JSON-LD. On ne regarde que les
    # blocs situés dans les mêmes conteneurs que les questions retrouvées — sinon
    # les 25 modèles de message de message-repondeur-professionnel.html, qui sont
    # aussi des <details><div class="a">, passeraient pour de la FAQ manquante.
    conteneurs = {d["conteneur"] for d in blocs if id(d) in apparies}
    for d in blocs:
        if id(d) not in apparies and d["conteneur"] in conteneurs:
            rapport.ajoute("faq", rel, d["ligne"],
                           "<details> de la FAQ absent du JSON-LD : « %s »"
                           % (normalise(d["question"]) or "(sans intitulé)"))


# ---------------------------------------------------------------------------
# Sortie
# ---------------------------------------------------------------------------

def affiche(rapport, nb_pages, sources_410):
    print("check.py — %d page(s) contrôlée(s) · %d URL en 410 lues dans vercel.json"
          % (nb_pages, len(sources_410)))
    print()
    for cle, libelle in CONTROLES:
        items = rapport.erreurs[cle]
        notes = rapport.notes[cle]
        # 50 = le plus long libellé (« canonical unique et conforme au chemin du
        # fichier », 48 caractères) + 2. Avec 44, cette ligne-là débordait de sa
        # colonne et le verdict ne s'alignait plus sur les sept autres.
        entete = "%-50s" % libelle
        if not items:
            print("  %s %s" % (entete, "OK" if not notes else "OK (%d constat)" % len(notes)))
        else:
            print("  %s %d erreur(s)" % (entete, len(items)))
            par_fichier = {}
            for fichier, ligne, message, detail in items:
                par_fichier.setdefault(fichier, []).append((ligne, message, detail))
            for fichier in sorted(par_fichier):
                for ligne, message, detail in par_fichier[fichier]:
                    repere = ":%d" % ligne if ligne else ""
                    print("      %s%s" % (fichier, repere))
                    print("        %s" % message)
                    for l in str(detail).splitlines() if detail else []:
                        print("          %s" % l.strip())
        if notes:
            for fichier, message in notes:
                print("      · %s — %s (non bloquant)" % (fichier, message))
        if items or notes:
            print()

    for titre, lot in (("Ignoré — faux positif connu", rapport.ignores),
                       ("Constat — élément hors écran, hors FAQ", rapport.hors_faq)):
        if not lot:
            continue
        print("  %s (%d)" % (titre, len(lot)))
        for fichier, ligne, message in lot:
            print("      %s:%d" % (fichier, ligne))
            for l in _plie(message, 92):
                print("        %s" % l)
        print()

    print("  %d erreur(s) sur %d page(s) · %d constat(s) non bloquant(s) · "
          "%d faux positif(s) connu(s)."
          % (rapport.total, nb_pages,
             sum(len(v) for v in rapport.notes.values()) + len(rapport.hors_faq),
             len(rapport.ignores)))


def _plie(texte, largeur):
    lignes, courante = [], ""
    for mot in texte.split():
        if courante and len(courante) + 1 + len(mot) > largeur:
            lignes.append(courante)
            courante = mot
        else:
            courante = (courante + " " + mot) if courante else mot
    if courante:
        lignes.append(courante)
    return lignes


# ---------------------------------------------------------------------------

def main(argv):
    if argv and argv[0] in ("-h", "--help"):
        print(__doc__)
        return 0

    toutes = pages_du_depot()
    if argv:
        demandees = []
        for a in argv:
            rel = os.path.relpath(os.path.abspath(a), RACINE).replace(os.sep, "/")
            if os.path.basename(rel) in FICHIERS_EXCLUS:
                print("  %s : page d'aperçu, non contrôlée." % rel)
                continue
            if not os.path.isfile(os.path.join(RACINE, rel)):
                print("  %s : introuvable." % rel, file=sys.stderr)
                return 1
            if not rel.endswith(".html"):
                print("  %s : ce n'est pas une page HTML, ignoré." % rel)
                continue
            demandees.append(rel)
        cibles = demandees
    else:
        cibles = toutes

    if not cibles:
        print("Aucune page à contrôler.")
        return 0

    sources_410 = urls_410()

    # Les ids de TOUTES les pages du dépôt, même quand on ne contrôle qu'un fichier :
    # une ancre pointe souvent ailleurs.
    ids_par_page = {}
    analyses = {}
    for rel in toutes:
        chemin = os.path.join(RACINE, rel)
        with open(chemin, encoding="utf-8") as f:
            source = f.read()
        page = analyse(chemin, source, os.path.dirname(chemin))
        ids_par_page[rel] = page.ids
        if rel in cibles:
            analyses[rel] = page

    pages_connues = set(toutes)
    rapport = Rapport()
    for rel in cibles:
        page = analyses.get(rel)
        if page is None:
            chemin = os.path.join(RACINE, rel)
            with open(chemin, encoding="utf-8") as f:
                source = f.read()
            page = analyse(chemin, source, os.path.dirname(chemin))
        controle_page(rel, page, rapport, ids_par_page, pages_connues, sources_410)

    affiche(rapport, len(cibles), sources_410)
    return 1 if rapport.total else 0


if __name__ == "__main__":
    sys.exit(main(sys.argv[1:]))
