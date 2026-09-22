"""
I Love Caulk static site builder.

Source pages live in src/pages/<output path>. Each starts with a front-matter
block between '---' lines (key: value, values may be JSON), followed by the
page's <main> content. Output is written to the repo root at the same path.

Tokens available in page content and partials:
  {{root}}          relative prefix back to the site root ("", "../", ...)
  {{ad}}            the site's single AdSense unit (required once per page unless ad: false)
  {{> name}}        contents of src/partials/name.html
  {{joint}}         the caulk-bead section divider

Run:  python src/build.py
"""
import html as htmllib
import json
import os
import re
import sys
from html.parser import HTMLParser
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SRC = ROOT / "src"
PAGES = SRC / "pages"
PARTIALS = SRC / "partials"

SITE_NAME = "I Love Caulk"
SITE_URL = "https://bigjosh.github.io/ilovecaulk.com/"
AD_CLIENT = "ca-pub-1304934482357714"
AD_SLOT = "9550528388"

NAV = [
    ("finder", "Find a Caulk", "caulk-finder/index.html"),
    ("rooms", "Rooms", "caulk-by-room/index.html"),
    ("types", "Types", "caulk-by-type/index.html"),
    ("reviews", "Reviews", "reviews/index.html"),
    ("bead", "The Bead", "the-bead/index.html"),
    ("play", "Play", "play/index.html"),
    ("faq", "FAQ", "faq/index.html"),
]

AD_BLOCK = f"""<aside class="ad-well" aria-label="Advertisement">
  <p class="ad-label">Advertisement</p>
  <ins class="adsbygoogle" style="display:block" data-ad-client="{AD_CLIENT}" data-ad-slot="{AD_SLOT}" data-ad-format="auto"></ins>
  <script>(adsbygoogle = window.adsbygoogle || []).push({{}});</script>
</aside>"""

JOINT = """<div class="joint" aria-hidden="true"><svg viewBox="0 0 1200 28" preserveAspectRatio="none"><path class="joint-shadow" d="M0 16 C 200 13, 400 18, 600 15 S 1000 13, 1200 16" /><path class="joint-bead" d="M0 13 C 200 10, 400 15, 600 12 S 1000 10, 1200 13" /><path class="joint-shine" d="M0 10 C 200 7.5, 400 11.5, 600 9 S 1000 7.5, 1200 10" /></svg></div>"""

# One shared gradient so every bead in the page can reference url(#bead-g).
SVG_DEFS = """<svg class="svg-defs" width="0" height="0" aria-hidden="true" focusable="false"><defs><linearGradient id="bead-g" gradientUnits="userSpaceOnUse" x1="0" y1="4" x2="0" y2="22"><stop offset="0" stop-color="#ffffff"/><stop offset=".5" stop-color="#f4f3ec"/><stop offset="1" stop-color="#c9c6ba"/></linearGradient></defs></svg>"""


def parse_page(text, path):
    if not text.startswith("---"):
        raise SystemExit(f"{path}: missing front matter")
    _, fm, body = text.split("---", 2)
    meta = {}
    for line in fm.strip().splitlines():
        if not line.strip() or line.strip().startswith("#"):
            continue
        key, _, val = line.partition(":")
        val = val.strip()
        try:
            meta[key.strip()] = json.loads(val)
        except json.JSONDecodeError:
            meta[key.strip()] = val
    return meta, body.strip("\n")


def load_partial(name, seen=()):
    p = PARTIALS / f"{name}.html"
    if not p.exists():
        raise SystemExit(f"missing partial: {name}")
    return p.read_text(encoding="utf-8")


def expand(body, meta, rel_out):
    for _ in range(5):
        body = re.sub(r"\{\{>\s*([\w-]+)\s*\}\}", lambda m: load_partial(m.group(1)), body)
    return body.replace("{{joint}}", JOINT)


def nav_html(section, root):
    items = []
    for key, label, href in NAV:
        cur = ' aria-current="page"' if key == section else ""
        items.append(f'<li><a href="{root}{href}"{cur}>{label}</a></li>')
    return "\n        ".join(items)


def render(meta, body, rel_out):
    depth = rel_out.count("/")
    root = "../" * depth
    if meta.get("is404"):
        root = ""
    title = htmllib.escape(meta.get("title", SITE_NAME))
    full_title = title if meta.get("bareTitle") else f"{title} | {SITE_NAME}"
    desc = htmllib.escape(meta.get("description", ""))
    section = meta.get("section", "")
    styles = "".join(
        f'\n  <link rel="stylesheet" href="{root}assets/css/{s}">' for s in meta.get("styles", [])
    )
    scripts = "".join(
        f'\n  <script src="{root}assets/js/{s}" defer></script>' for s in meta.get("scripts", [])
    )
    body_class = meta.get("bodyClass", "")
    canonical_path = "" if rel_out == "index.html" else rel_out.replace("index.html", "")
    og_image = meta.get("ogImage", "assets/img/og-crew.jpg")
    jsonld = ""
    if meta.get("jsonld"):
        jsonld = f'\n  <script type="application/ld+json">{json.dumps(meta["jsonld"])}</script>'
    base_fix = ""
    if meta.get("is404"):
        # 404.html is served at whatever URL was requested, so pin relative links to the site root.
        base_fix = """
  <script>(function(){var p=location.pathname,m=p.match(/^\\/ilovecaulk\\.com\\//i);document.write('<base href="'+(m?m[0]:'/')+'">');})();</script>"""

    # Error pages carry no ads (AdSense policy), so they don't load the ad script either.
    ad_loader = "" if meta.get("is404") else (
        "\n  <script async src=\"https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js"
        f"?client={AD_CLIENT}\" crossorigin=\"anonymous\"></script>")
    body = body.replace("{{ad}}", AD_BLOCK)
    body = body.replace("{{root}}", root)
    nav = nav_html(section, root)

    return f"""<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">{base_fix}
  <script>document.documentElement.classList.add('js')</script>
  <title>{full_title}</title>
  <meta name="description" content="{desc}">
  <meta name="theme-color" content="#1f3c88">
  <meta property="og:site_name" content="{SITE_NAME}">
  <meta property="og:title" content="{title}">
  <meta property="og:description" content="{desc}">
  <meta property="og:type" content="{meta.get('ogType', 'website')}">
  <meta property="og:url" content="{SITE_URL}{canonical_path}">
  <meta property="og:image" content="{SITE_URL}{og_image}">
  <meta name="twitter:card" content="summary_large_image">
  <link rel="icon" href="{root}favicon.ico" sizes="any">
  <link rel="icon" href="{root}assets/img/favicon-64.png" type="image/png">
  <link rel="apple-touch-icon" href="{root}apple-touch-icon.png">
  <link rel="preload" href="{root}assets/fonts/shrikhand-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="preload" href="{root}assets/fonts/librefranklin-latin.woff2" as="font" type="font/woff2" crossorigin>
  <link rel="stylesheet" href="{root}assets/css/site.css">{styles}{ad_loader}
  <script src="{root}assets/js/site.js" defer></script>{scripts}{jsonld}
</head>
<body class="{body_class}">
  {SVG_DEFS}
  <a class="skip-link" href="#main">Skip to content</a>
  <header class="masthead">
    <div class="wrap masthead-inner">
      <a class="brand" href="{root}index.html">
        <img src="{root}assets/img/logo-160.webp" width="56" height="56" alt="">
        <span class="brand-name">I Love Caulk</span>
      </a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
        <span class="nav-toggle-bars" aria-hidden="true"></span>Menu
      </button>
      <nav id="site-nav" class="site-nav" aria-label="Main">
        <ul>
        {nav}
        </ul>
      </nav>
    </div>
  </header>
  <main id="main">
{body}
  </main>
{expand(load_partial('footer'), meta, rel_out).replace('{{root}}', root)}
</body>
</html>
"""


class LinkParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.links = []
        self.ids = set()

    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if "id" in a:
            self.ids.add(a["id"])
        if tag == "a" and "name" in a:
            self.ids.add(a["name"])
        for key in ("href", "src", "srcset", "poster"):
            v = a.get(key)
            if not v:
                continue
            if key == "srcset":
                for part in v.split(","):
                    self.links.append(part.strip().split(" ")[0])
            else:
                self.links.append(v)


def check_links(outputs):
    problems = []
    id_cache = {}

    def ids_for(path):
        if path not in id_cache:
            p = LinkParser()
            p.feed(path.read_text(encoding="utf-8"))
            id_cache[path] = p.ids
        return id_cache[path]

    for out in outputs:
        if out.name == "404.html":
            continue
        p = LinkParser()
        p.feed(out.read_text(encoding="utf-8"))
        id_cache[out] = p.ids
        for link in p.links:
            if re.match(r"^(https?:|mailto:|tel:|data:|javascript:|//)", link):
                continue
            target, _, frag = link.partition("#")
            target = target.split("?")[0]
            dest = out if not target else (out.parent / target).resolve()
            if target.endswith("/") or (dest.exists() and dest.is_dir()):
                problems.append(f"{out.relative_to(ROOT)}: directory link {link!r} (link to index.html explicitly)")
                continue
            if not dest.exists():
                problems.append(f"{out.relative_to(ROOT)}: broken link {link!r}")
                continue
            if frag and dest.suffix == ".html" and frag not in ids_for(dest):
                problems.append(f"{out.relative_to(ROOT)}: missing anchor {link!r}")
    return problems


def write_sitemap(rel_outs):
    urls = []
    for r in sorted(rel_outs):
        if r == "404.html":
            continue
        loc = SITE_URL + ("" if r == "index.html" else r.replace("index.html", ""))
        urls.append(f"  <url><loc>{loc}</loc></url>")
    (ROOT / "sitemap.xml").write_text(
        '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'
        + "\n".join(urls) + "\n</urlset>\n", encoding="utf-8")


# Old Squarespace URLs -> new pages, so links into the old site keep working after a domain move.
REDIRECTS = {
    "home/index.html": "index.html",
    "home-old/index.html": "index.html",
    "blog/index.html": "the-bead/index.html",
    "blog/2026/6/14/caulk-formulations/index.html": "types-formulations/index.html",
    "caulk-talk/index.html": "the-bead/index.html",
    "caulk-talk/2015/3/21/good-caulk-is-hard-to-find/index.html": "the-bead/index.html",
    "caulk-search/index.html": "caulk-finder/index.html",
    "house-caulks/index.html": "caulk-by-room/index.html",
    "types-o-caulk/index.html": "caulk-by-type/index.html",
    "show-us/index.html": "about/index.html",
}


def write_redirects():
    outs = []
    for src, dest in REDIRECTS.items():
        rel = "../" * src.count("/") + dest
        out = ROOT / src
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(
            f'<!doctype html>\n<html lang="en">\n<head>\n  <meta charset="utf-8">\n  <title>Moved | {SITE_NAME}</title>\n'
            f'  <meta name="robots" content="noindex">\n  <meta http-equiv="refresh" content="0; url={rel}">\n'
            f'  <link rel="canonical" href="{SITE_URL}{dest.replace("index.html", "")}">\n</head>\n'
            f'<body>\n  <p>This page moved. <a href="{rel}">Continue to the new page</a>.</p>\n</body>\n</html>\n',
            encoding="utf-8", newline="\n")
        outs.append(out)
    return outs


def main():
    outputs, rel_outs, problems = [], [], []
    for src in sorted(PAGES.rglob("*.html")):
        rel_out = src.relative_to(PAGES).as_posix()
        meta, body = parse_page(src.read_text(encoding="utf-8"), src)
        body = expand(body, meta, rel_out)
        ad_count = body.count("{{ad}}")
        if meta.get("ad", True) and ad_count != 1:
            problems.append(f"{rel_out}: expected exactly one {{{{ad}}}}, found {ad_count}")
        if not meta.get("ad", True) and ad_count:
            problems.append(f"{rel_out}: ad: false but contains {{{{ad}}}}")
        html = render(meta, body, rel_out)
        leftover = re.findall(r"\{\{[^}]*\}\}", html)
        if leftover:
            problems.append(f"{rel_out}: unexpanded tokens {set(leftover)}")
        out = ROOT / rel_out
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(html, encoding="utf-8", newline="\n")
        outputs.append(out)
        rel_outs.append(rel_out)
    write_sitemap(rel_outs)
    outputs += write_redirects()
    problems += check_links(outputs)
    print(f"built {len(outputs)} pages")
    for p in problems:
        print("  !", p)
    return 1 if problems else 0


if __name__ == "__main__":
    sys.exit(main())
