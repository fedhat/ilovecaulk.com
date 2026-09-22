# I Love Caulk

The honest, plain-English guide to caulk: room-by-room guides, a Caulk Finder, a tube
calculator, formulation spec sheets, reviews, an FAQ and glossary, The Bead magazine, and a
few games (Bead Master, a crossword, and two quizzes).

**Live:** https://bigjosh.github.io/ilovecaulk.com/

## How it's built

Plain static HTML, CSS, and vanilla JavaScript. No frameworks, no bundler, no external assets
except Google AdSense. Every internal link is relative, so the site works from any folder,
from GitHub Pages, and from a custom domain.

- `src/pages/`: page sources (front matter + HTML)
- `src/partials/`: shared snippets (footer, bead divider, seal)
- `src/tools/`: generators for the room guides (`rooms.py`) and type sheets (`type_sheets.py`), plus the crossword generator
- `src/build.py`: wraps each page in the shared template, writes it to the repo root, builds `sitemap.xml`, and checks every local link and anchor
- `assets/`: CSS, JS, self-hosted fonts (Shrikhand and Libre Franklin, SIL OFL), and images

```sh
python src/tools/rooms.py        # only if you edited the room data
python src/tools/type_sheets.py  # only if you edited the type data
python src/build.py              # always
python -m http.server 8000       # preview at http://localhost:8000/
```

See [`src/README.md`](src/README.md) for page conventions, voice, the Crew, and shared anchors.

## Ads

Every page loads the AdSense script (`ca-pub-1304934482357714`) and places one responsive
unit (slot `9550528388`). `ads.txt` is at the site root. AdSense only fills ads on domains
approved in the AdSense account, so ads appear once the site is served from `ilovecaulk.com`
(or the github.io domain is added to the account).
