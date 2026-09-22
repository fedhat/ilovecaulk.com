# I Love Caulk: source & conventions

The site is plain static HTML. Pages are authored in `src/pages/` and built into the
repo root (which is the web root) by a small Python script. The script only runs on
your machine; GitHub Pages just serves the built files.

```
python src/build.py        # builds every page, writes sitemap.xml, checks every local link
```

The build fails loudly on: broken local links, links to missing `#anchors`, directory
links (always link to `.../index.html` so the site also works from `file://`), leftover
`{{tokens}}`, and pages with the wrong number of ad units.

## Page format

```html
---
title: Kitchen caulk guide
description: One sentence for search results and link previews.
section: rooms            # highlights a nav item: finder rooms types reviews bead play faq
styles: ["game.css"]      # optional, files in assets/css/
scripts: ["game.js"]      # optional, files in assets/js/ (classic scripts, no modules)
ad: true                  # default true; the page must contain {{ad}} exactly once
---
<header class="page-head tiled"> ... </header>
{{joint}}
<div class="section"> ... {{ad}} ... </div>
```

Tokens: `{{root}}` (relative path to the site root), `{{ad}}` (the AdSense unit),
`{{joint}}` (the caulk-bead section divider), `{{> partial-name}}` (files in `src/partials/`).

## Ads

Every content page carries the AdSense loader in `<head>` (so Auto Ads keep working if they're
enabled in the account) and exactly one responsive display unit, placed with `{{ad}}`:
publisher `ca-pub-1304934482357714`, slot `9550528388`. Put the unit where it doesn't sit
next to game controls or buttons. The 404 page has no unit. `ads.txt` lives at the root.

## Voice

- We are very serious about caulk. Deadpan-earnest enthusiasm with a knowing wink.
- Useful first, funny second. At most one joke per section; the advice must stand on its own.
- Plain English, second person, short paragraphs, sentence-case headings.
- Be concrete (temperatures, joint sizes, cure times) but give ranges and say "check the tube":
  formulas and product names change and the label wins.
- Never invent statistics, quotes, test results, or customer reviews. Product write-ups are
  editorial summaries of manufacturer claims and widely reported experience.
- Safety is part of the job: ventilation, gloves, ladders, and old caulk that may contain
  asbestos or PCBs.
- The brand invites innuendo. We rise above it. One sly wink per page, maximum.

## The Crew (house characters)

| id | Name | Beat | Face |
|---|---|---|---|
| rosie | Rosie | Head caulker. Kitchens, exteriors, the Caulk Finder. Cheerful, exacting. | `crew-rosie.webp`, `crew-rosie-detective.webp` |
| flavio | Flavio | Wet zones: bathrooms, basements. Calm, obsessive about prep, loves silicone. | `crew-flavio.webp` |
| karen | Karen | Interiors, trim, paint-ready finishes, acoustic sealing. Precise, dry wit. | `crew-karen.webp` |
| troy | Troy | Heights and heavy duty: roofs, gutters, garage concrete. Safety first, few words. | `crew-troy.webp` |
| zoe | Zoe | The building envelope: windows, doors, siding, drafts. Nerdy about movement ratings. | `crew-zoe.webp` |

Crew tip markup:

```html
<aside class="crew-tip">
  <img src="{{root}}assets/img/crew-zoe.webp" width="64" height="64" alt="">
  <div><span class="who">Zoe's tip</span><p>...</p></div>
</aside>
```

## Shared anchors (link targets other pages rely on)

Reviews, `reviews/index.html#<id>`:
`dap-alex-plus`, `dap-dynaflex-ultra`, `ge-silicone-2`, `gorilla-silicone`, `polyblend-sanded`,
`sashco-big-stretch`, `sashco-lexel`, `sashco-through-the-roof`, `osi-quad-max`, `sikaflex-1a`,
`sikaflex-self-leveling`, `geocel-2300`, `dap-butyl-flex`, `soudal-fix-all`, `osi-sc-175`,
`quikrete-hydraulic`, `3m-fire-barrier`

Types, `caulk-by-type/index.html#<id>` (and the same ids in `types-formulations/index.html`):
`acrylic-latex`, `siliconized-acrylic`, `silicone`, `polyurethane`, `butyl`, `elastomeric`,
`acoustic`, `hydraulic`, `ms-polymer` (plus `specialty` on caulk-by-type only)

Glossary, `glossary/index.html#<id>`:
`adhesion`, `astm-c920`, `backer-rod`, `bead`, `bond-breaker`, `cohesion`, `cure-time`,
`elastomer`, `isocyanate`, `joint-movement`, `mildewcide`, `open-time`, `primer`, `rtv`,
`shrinkage`, `skinning`, `substrate`, `three-sided-adhesion`, `thrust-ratio`, `tooling`, `voc`

## Components (see `assets/css/site.css`)

`page-head` + `tiled`, `snapshot` (taped photo), `bead-line` partial, `joint`, `btn` (nozzle-cut;
`btn-denim`, `btn-ink`, `btn-light`, `btn-small`), `btn-plain`, `prose`, `article-layout` +
`article-aside` + `toc`, `crew-tip`, `note`, `warn`, `tag`, `yes`/`no`/`meh`, `table-scroll` +
`spec-table`, `card` / `card-link`, `teaser`, `tile-board` + `room-tile`, `seal` partial,
`dollops` rating (`<span class="dollops" style="--score:4.5"></span>`), `faq-list` (details),
`steps` (real sequences only), `chip-group` + `chip`, `field` + `input`, `grid-2/3/4`, `split`, `kv`.
