"""
Generates src/pages/caulk-by-type/index.html: one spec sheet per formulation.

Run:  python src/tools/type_sheets.py && python src/build.py
"""
from html import escape
from pathlib import Path

OUT = Path(__file__).resolve().parent.parent / "pages" / "caulk-by-type" / "index.html"

# props drive the filter chips: paint, wet, out, move, water (water cleanup)
TYPES = [
    {
        "id": "acrylic-latex", "name": "Acrylic latex", "nick": "The reliable workhorse", "short": "Trim & drywall",
        "props": ["paint", "water"],
        "best": "Interior trim, baseboards, crown molding, drywall gaps, anything you'll paint.",
        "avoid": "Showers, tubs, sinks, and exterior joints that move a lot.",
        "specs": [("Paintable", "Yes, often within an hour or so"), ("Water resistance", "Moderate once cured"), ("Flexibility", "Low to medium; shrinks a little"), ("Cleanup", "Soap and water while wet"), ("Feels like", "Easy, forgiving, and cheap")],
        "picks": ["dap-alex-plus"],
    },
    {
        "id": "siliconized-acrylic", "name": "Siliconized acrylic latex", "nick": "The upgrade", "short": "Damp trim, windows",
        "props": ["paint", "water"],
        "best": "Kitchen and bath trim, interior window frames, and humid rooms where you still want to paint.",
        "avoid": "Joints that sit in water, like the tub-to-tile seam.",
        "specs": [("Paintable", "Yes"), ("Water resistance", "Good"), ("Flexibility", "Medium"), ("Cleanup", "Soap and water while wet"), ("Feels like", "Acrylic with a raincoat")],
        "picks": ["dap-alex-plus"],
    },
    {
        "id": "silicone", "name": "100% silicone", "nick": "The gold standard for wet work", "short": "Tubs, sinks, glass",
        "props": ["wet", "out", "move"],
        "best": "Tubs, showers, sinks, countertops, glass, metal, and other slick, non-porous surfaces.",
        "avoid": "Anything you'll paint, and joints with old silicone residue you can't fully remove.",
        "specs": [("Paintable", "No (a few specialty formulas claim it)"), ("Water resistance", "Excellent"), ("Flexibility", "Very high"), ("Cleanup", "Wipe off wet with a dry rag, then mineral spirits; cured silicone must be cut off"), ("Feels like", "Slippery to tool and totally waterproof")],
        "picks": ["ge-silicone-2", "gorilla-silicone"],
        "note": "Acetoxy-cure silicones smell like vinegar while curing and can mark some metals and stone; neutral-cure formulas are gentler.",
    },
    {
        "id": "polyurethane", "name": "Polyurethane", "nick": "The exterior specialist", "short": "Concrete, masonry",
        "props": ["paint", "wet", "out", "move"],
        "best": "Concrete joints, driveways, masonry, foundations, and exterior joints between different materials.",
        "avoid": "Quick indoor jobs where you want water cleanup, and poorly ventilated rooms.",
        "specs": [("Paintable", "Yes"), ("Water resistance", "Excellent"), ("Flexibility", "High"), ("Cleanup", "Solvent while wet; wear gloves"), ("Feels like", "Sticky, tough, and in it for the long haul")],
        "picks": ["sikaflex-1a", "sikaflex-self-leveling"],
        "note": "Some polyurethanes contain isocyanates. Ventilate, wear gloves, and read the safety sheet.",
    },
    {
        "id": "ms-polymer", "name": "MS polymer / hybrid", "nick": "The premium all-rounder", "short": "Sticks to everything",
        "props": ["paint", "wet", "out", "move"],
        "best": "Mixed materials (wood to metal to masonry to plastic), exterior trim, windows and doors, marine-ish jobs.",
        "avoid": "Tight budgets. It costs more.",
        "specs": [("Paintable", "Yes (test your paint)"), ("Water resistance", "Excellent"), ("Flexibility", "Very high"), ("Cleanup", "Wipe off wet; solvent or cleaning wipes"), ("Feels like", "Silicone's toughness with paint's manners")],
        "picks": ["soudal-fix-all"],
    },
    {
        "id": "elastomeric", "name": "Elastomeric latex", "nick": "The flexible exterior performer", "short": "Siding that moves",
        "props": ["paint", "out", "move", "water"],
        "best": "Exterior siding, trim, stucco hairlines, and the crown-molding crack that comes back every winter.",
        "avoid": "Anything that sits underwater.",
        "specs": [("Paintable", "Yes"), ("Water resistance", "Good"), ("Flexibility", "Very high"), ("Cleanup", "Soap and water while wet"), ("Feels like", "A rubber band that takes paint")],
        "picks": ["sashco-big-stretch", "dap-dynaflex-ultra"],
    },
    {
        "id": "butyl", "name": "Butyl rubber", "nick": "The roofing and flashing legend", "short": "Gutters, flashing",
        "props": ["wet", "out"],
        "best": "Gutter seams, metal flashing, roofing details, and other metal-to-metal joints outdoors.",
        "avoid": "Indoor finish work. It's stringy, slow to cure, and smelly.",
        "specs": [("Paintable", "Often, after it skins; check the tube"), ("Water resistance", "Excellent"), ("Flexibility", "Medium"), ("Cleanup", "Mineral spirits"), ("Feels like", "Chewing gum with a work ethic")],
        "picks": ["dap-butyl-flex"],
    },
    {
        "id": "acoustic", "name": "Acoustic sealant", "nick": "The quiet one", "short": "Quiet walls",
        "props": ["move"],
        "best": "Soundproofing: drywall perimeters, electrical boxes, and gaps in shared walls, floors, and home theaters.",
        "avoid": "Wet areas and exposed finish surfaces. Hide it behind trim or drywall.",
        "specs": [("Paintable", "Usually not a finish surface; check the label"), ("Water resistance", "Moderate"), ("Flexibility", "Permanently soft"), ("Cleanup", "Varies by product; many clean up with water while wet"), ("Feels like", "It never quite dries, on purpose")],
        "picks": ["osi-sc-175"],
    },
    {
        "id": "hydraulic", "name": "Hydraulic cement", "nick": "The emergency responder", "short": "Active leaks",
        "props": ["paint", "wet"],
        "best": "Plugging active leaks and holes in concrete and masonry. It sets in minutes, even against running water.",
        "avoid": "Joints that move. It's rigid and will crack.",
        "specs": [("Paintable", "Yes, once cured"), ("Water resistance", "Excellent"), ("Flexibility", "None"), ("Cleanup", "Water, before it sets (which is fast)"), ("Feels like", "Mixing a very small, very urgent batch of concrete")],
        "picks": ["quikrete-hydraulic"],
        "note": "Not technically a caulk. It earns its spot on the shelf anyway.",
    },
]

SPECIALTY = [
    ("Self-leveling polyurethane", "Pours into flat concrete joints and levels itself: driveways, garage floors, patios.", ["sikaflex-self-leveling"]),
    ("Sanded tile caulk", "Has sand in it so it matches sanded grout at tile corners and changes of plane.", ["polyblend-sanded"]),
    ("Roof sealant", "Built for asphalt, flashing, and UV; some can go on damp surfaces.", ["sashco-through-the-roof"]),
    ("Tripolymer", "A solvent-based sealant that grips dirty, damp, or oily metal, vinyl, and masonry. Gutters love it.", ["geocel-2300"]),
    ("Clear elastomer", "Solvent-based, crystal clear, and very stretchy. Clearer than clear silicone.", ["sashco-lexel"]),
    ("High-performance exterior sealant", "Premium window, door, and siding sealants built for extreme weather and every substrate.", ["osi-quad-max"]),
    ("Fire-rated sealant", "Seals penetrations through fire-rated walls and floors; some expand in a fire (intumescent). Code rules apply.", ["3m-fire-barrier"]),
]

PRODUCTS = {
    "dap-alex-plus": "DAP Alex Plus", "dap-dynaflex-ultra": "DAP Dynaflex Ultra", "ge-silicone-2": "GE Silicone 2 Kitchen & Bath",
    "gorilla-silicone": "Gorilla 100% Silicone", "polyblend-sanded": "Polyblend Sanded Tile Caulk", "sashco-big-stretch": "Sashco Big Stretch",
    "sashco-lexel": "Sashco Lexel", "sashco-through-the-roof": "Sashco Through the Roof!", "osi-quad-max": "OSI Quad Max",
    "sikaflex-1a": "Sikaflex-1a", "sikaflex-self-leveling": "Sikaflex Self-Leveling", "geocel-2300": "Geocel 2300 Tripolymer",
    "dap-butyl-flex": "DAP Butyl-Flex", "soudal-fix-all": "Soudal Fix ALL", "osi-sc-175": "OSI SC-175 Acoustical",
    "quikrete-hydraulic": "Quikrete Hydraulic Water-Stop Cement", "3m-fire-barrier": "3M Fire Barrier CP 25WB+",
}
PROPS = [("paint", "Paintable"), ("wet", "OK in wet areas"), ("out", "Outdoors"), ("move", "Handles movement"), ("water", "Water cleanup")]


def e(s):
    return escape(s, quote=True)


def picks(ids):
    return ", ".join(f'<a href="{{{{root}}}}reviews/index.html#{p}">{e(PRODUCTS[p])}</a>' for p in ids)


def sheet(t):
    specs = "".join(f"<dt>{e(k)}</dt><dd>{e(v)}</dd>" for k, v in t["specs"])
    badges = "".join(f'<li>{e(label)}</li>' for key, label in PROPS if key in t["props"])
    note = f'<p class="type-note">{e(t["note"])}</p>' if t.get("note") else ""
    return f'''    <article class="type-sheet t-{t["id"]}" id="{t["id"]}" data-props="{" ".join(t["props"])}">
      <div class="type-tube" aria-hidden="true"><span class="tube"><span class="tube-tip"></span><span class="tube-cap"></span><span class="tube-body"><span class="tube-label"><b>{e(t["name"])}</b><small>{e(t["short"])}</small></span></span></span></div>
      <div class="type-main">
        <p class="type-nick">{e(t["nick"])}</p>
        <h2>{e(t["name"])}</h2>
        <ul class="type-badges" aria-label="Good at">{badges}</ul>
        <div class="type-cols">
          <div>
            <h3>Use it for</h3><p>{e(t["best"])}</p>
            <h3>Skip it for</h3><p>{e(t["avoid"])}</p>
          </div>
          <dl class="kv">{specs}</dl>
        </div>
        {note}
        <p class="type-picks"><strong>Our picks:</strong> {picks(t["picks"])} <a class="type-more" href="{{{{root}}}}types-formulations/index.html#{t["id"]}">Read the deep dive</a></p>
      </div>
    </article>'''


def page():
    sheets = [sheet(t) for t in TYPES]
    first, rest = sheets[:4], sheets[4:]
    chips = "".join(f'<button type="button" class="btn-plain" aria-pressed="false" data-prop="{k}">{e(v)}</button>' for k, v in PROPS)
    toc = "".join(f'<li><a class="type-tag t-{t["id"]}" href="#{t["id"]}">{e(t["name"])}</a></li>' for t in TYPES) + '<li><a class="type-tag t-specialty" href="#specialty">Specialty</a></li>'
    spec_rows = "".join(f'<li><h3>{e(n)}</h3><p>{e(d)}</p><p class="small"><strong>Try:</strong> {picks(p)}</p></li>' for n, d, p in SPECIALTY)
    return f'''---
title: Caulk by type
description: Every caulk formulation on one page, from acrylic latex to MS polymer, with what each is good at, what to avoid, cleanup, and the tube we'd buy.
section: types
styles: []
scripts: ["types.js"]
---
<header class="page-head tiled">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="{{{{root}}}}index.html">Home</a></li><li>Caulk by type</li></ol></nav>
    <h1>Caulk by type</h1>
    {{{{> bead-line}}}}
    <p class="lede" style="color:var(--ink)">The chemistry on the label decides where a caulk will shine and where it'll fail. Here's every formulation worth knowing, one spec sheet each. For the long version, read Federico's <a href="{{{{root}}}}types-formulations/index.html">guide to caulk formulations</a>.</p>
    <ul class="type-jump" aria-label="Jump to a formulation">{toc}</ul>
  </div>
</header>
{{{{joint}}}}

<section class="section" aria-label="Formulations">
  <div class="wrap">
    <div class="type-filter" role="group" aria-labelledby="type-filter-label">
      <p id="type-filter-label"><strong>Show me caulk that's:</strong></p>
      <div class="btn-row">{chips}</div>
      <p class="small" id="type-filter-count" aria-live="polite"></p>
    </div>
    <div class="type-list">
{chr(10).join(first)}
    </div>
  </div>
</section>

{{{{ad}}}}

<section class="section-tight" aria-label="More formulations">
  <div class="wrap">
    <div class="type-list">
{chr(10).join(rest)}
    </div>
  </div>
</section>

<section class="section" id="specialty" aria-labelledby="specialty-title">
  <div class="wrap">
    <div class="section-head"><h2 id="specialty-title">Specialty tubes</h2><p>Variations built for one job, and they do it better than anything else on the shelf.</p></div>
    <ul class="specialty-list">{spec_rows}</ul>
    <p style="margin-top:28px" class="btn-row"><a class="btn" href="{{{{root}}}}caulk-finder/index.html">Let the Finder choose</a> <a class="btn-plain" href="{{{{root}}}}reviews/index.html">Read the reviews</a></p>
  </div>
</section>
'''


OUT.parent.mkdir(parents=True, exist_ok=True)
OUT.write_text(page(), encoding="utf-8", newline="\n")
print("wrote", OUT)
