"""
Generates the eight room guides (src/pages/room-*/index.html) and the rooms hub
(src/pages/caulk-by-room/index.html) from the data below.

Run:  python src/tools/rooms.py && python src/build.py
"""
from html import escape
from pathlib import Path

PAGES = Path(__file__).resolve().parent.parent / "pages"

TYPES = {
    "acrylic-latex": "Acrylic latex",
    "siliconized-acrylic": "Siliconized acrylic",
    "silicone": "100% silicone",
    "polyurethane": "Polyurethane",
    "butyl": "Butyl rubber",
    "elastomeric": "Elastomeric latex",
    "acoustic": "Acoustic sealant",
    "hydraulic": "Hydraulic cement",
    "ms-polymer": "MS polymer / hybrid",
    "specialty": "Specialty",
}

PRODUCTS = {
    "dap-alex-plus": "DAP Alex Plus",
    "dap-dynaflex-ultra": "DAP Dynaflex Ultra",
    "ge-silicone-2": "GE Silicone 2 Kitchen & Bath",
    "gorilla-silicone": "Gorilla 100% Silicone",
    "polyblend-sanded": "Polyblend Sanded Tile Caulk",
    "sashco-big-stretch": "Sashco Big Stretch",
    "sashco-lexel": "Sashco Lexel",
    "sashco-through-the-roof": "Sashco Through the Roof!",
    "osi-quad-max": "OSI Quad Max",
    "sikaflex-1a": "Sikaflex-1a",
    "sikaflex-self-leveling": "Sikaflex Self-Leveling",
    "geocel-2300": "Geocel 2300 Tripolymer",
    "dap-butyl-flex": "DAP Butyl-Flex",
    "soudal-fix-all": "Soudal Fix ALL",
    "osi-sc-175": "OSI SC-175 Acoustical",
    "quikrete-hydraulic": "Quikrete Hydraulic Water-Stop Cement",
    "3m-fire-barrier": "3M Fire Barrier CP 25WB+",
}

# Amazon affiliate links (tag forcefed-20) for reviewed products. Keep in sync with
# assets/js/finder.js and the buy buttons on src/pages/reviews/index.html.
AMAZON = {
    "dap-alex-plus": "https://amzn.to/4x50QPS",
    "dap-dynaflex-ultra": "https://amzn.to/4vpsWUq",
    "ge-silicone-2": "https://amzn.to/4o2bNgP",
    "gorilla-silicone": "https://amzn.to/4nYryFJ",
    "polyblend-sanded": "https://amzn.to/4dTzgfo",
    "osi-quad-max": "https://amzn.to/3RvK9Nj",
    "sikaflex-1a": "https://amzn.to/4vcRAr8",
    "geocel-2300": "https://amzn.to/432uVll",
    "quikrete-hydraulic": "https://amzn.to/4uJzpcT",
}

# Each room's shopping list, carried over from the original site's Airtable room views.
# (product, type id, type label or None, best for, why, price tier, link, review id or None)
# amzn.to links are Amazon affiliate links; anything else is the maker's product page.
SHOP = {
    "room-kitchen": [
        ("DAP Alex Plus Acrylic Latex + Silicone", "siliconized-acrylic", None, "Counter edges and trim", "Paintable, flexible", "$", "https://amzn.to/4x50QPS", "dap-alex-plus"),
        ("DAP Kwik Seal Plus", "siliconized-acrylic", None, "Sink perimeter", "Mold-resistant, stays white", "$", "https://amzn.to/4dPEJnz", None),
        ("GE Supreme Silicone Kitchen & Bath", "silicone", None, "Sink-to-countertop seam", "Waterproof, 10-year guarantee", "$–$$", "https://amzn.to/4uKXjEK", None),
        ("GE Advanced Silicone 2 Kitchen & Bath", "silicone", None, "Backsplash edges", "Low odor, built-in mold inhibitor", "$–$$", "https://amzn.to/4o2bNgP", "ge-silicone-2"),
        ("Gorilla White Silicone Sealant", "silicone", None, "Glass tile backsplash", "Waterproof, won't yellow", "$–$$", "https://amzn.to/4nYryFJ", "gorilla-silicone"),
        ("Loctite Clear Silicone Waterproof Sealant", "silicone", None, "Glass and stainless transitions", "Crystal clear, fast cure", "$–$$", "https://amzn.to/4dCsCeQ", None),
        ("Red Devil Kitchen & Bath Siliconized Latex", "siliconized-acrylic", None, "Painted cabinetry gaps", "Sandable, paintable", "$", "https://amzn.to/3RAtx73", None),
    ],
    "room-bathroom": [
        ("DAP Kwik Seal Ultra Premium", "siliconized-acrylic", None, "Tub and shower tile seams", "Blends with grout lines, lifetime mold warranty", "$", "https://amzn.to/4edpia5", None),
        ("DAP Silicone Plus Tub & Tile", "silicone", None, "Tub surround, shower pan", "Waterproof, stays flexible", "$", "https://amzn.to/3RAtAQh", None),
        ("GE Silicone 1 Mold & Mildew Resistant", "silicone", None, "Wet-zone perimeters", "Microban antimicrobial protection", "$–$$", "https://amzn.to/4edptSN", None),
        ("GE Advanced Silicone 2 Bath", "silicone", None, "Showerhead surround", "Resists staining, no bleach needed", "$–$$", "https://amzn.to/3Qd52wf", "ge-silicone-2"),
        ("Polyblend Plus Sanded Caulk", "siliconized-acrylic", "Sanded acrylic", "Tile-to-tile joints", "Matched to grout colors, 50+ shades", "$$", "https://amzn.to/4dTzgfo", "polyblend-sanded"),
        ("TEC AccuColor Sanded Caulk", "siliconized-acrylic", "Sanded acrylic", "Floor-to-wall transitions", "Wide color range", "$$", "https://amzn.to/435hLUM", None),
        ("Mapei Keracaulk Sanded Caulk", "siliconized-acrylic", "Sanded acrylic", "Large-format tile seams", "Consistent color, low shrink", "$$", "https://amzn.to/4uIH3UQ", None),
        ("Permatex Clear RTV Silicone Sealant", "silicone", None, "Around hot-water pipes", "High-temp, multipurpose", "$$", "https://amzn.to/49yl0aL", None),
    ],
    "room-bedroom": [
        ("DAP Alex Plus Acrylic Latex", "siliconized-acrylic", None, "Baseboard and trim gaps", "Paintable in about 30 minutes, flexible", "$", "https://amzn.to/3RwdVS2", "dap-alex-plus"),
        ("DAP Dynaflex 230", "elastomeric", None, "Crown molding and corners", "Very flexible, resists cracking", "$–$$", "https://amzn.to/4o0bjYt", None),
        ("DAP Alex Flex Acrylic Latex", "acrylic-latex", None, "Drywall cracks and seams", "Bridges larger gaps", "$", "https://amzn.to/4o1LJCA", None),
        ("OSI SC-175 Acoustical Sound Sealant", "acoustic", None, "Sound-rated walls, outlet boxes, pipe penetrations", "Non-hardening, low VOC, GREENGUARD certified", "$$", "https://www.ositough.com/products/central-pdp.html/osi-sc175/SAP_0201XAO06WSD.html", "osi-sc-175"),
        ("Tremco Acoustical Sealant", "acoustic", None, "Sound-rated wall assemblies", "Pro grade, UL listed, stays flexible", "$$$", "https://www.tremcosealants.com/products/acoustical-curtainwall-sealant", None),
    ],
    "room-windows-doors": [
        ("DAP Dynaflex 230", "elastomeric", None, "Window and door trim", "Very flexible, resists cracking", "$–$$", "https://amzn.to/4o0bjYt", None),
        ("GE Supreme Silicone Window & Door", "silicone", None, "Exterior window frames", "UV-resistant, bonds to vinyl", "$–$$", "https://amzn.to/4ef7b3D", None),
        ("Loctite PL Window, Door & Siding Sealant", "polyurethane", None, "Exterior masonry gaps", "Paintable, bonds to brick and stucco", "$–$$", "https://amzn.to/4ajiLbw", None),
        ("DAPtex Plus Foam Sealant", "specialty", "Expanding foam", "Rough openings and headers", "Fills large gaps around frames", "$", "https://amzn.to/4e2UMPg", None),
        ("Great Stuff Window & Door Insulating Foam", "specialty", "Expanding foam", "Around window flanges", "Minimal expansion, won't bow frames", "$", "https://amzn.to/4x7IHkv", None),
        ("Tremco Spectrem 1 Silicone", "silicone", None, "Storefront glazing", "Commercial grade, long service life", "$$$", "https://www.tremcosealants.com/products/spectrem-1", None),
        ("GE Advanced Silicone 2 Window & Door", "silicone", None, "Metal flashing and trim", "UV-resistant, 40-year durability claim", "$–$$", "https://amzn.to/4fXJwG6", None),
        ("OSI Quad Max Window, Door & Siding", "specialty", "Exterior sealant", "Lap siding and J-channel", "Strong adhesion, paintable", "$$", "https://amzn.to/3RvK9Nj", "osi-quad-max"),
        ("DAP Extreme Stretch", "elastomeric", None, "Windows, doors, siding, trim", "Very high stretch, gaps up to 3\", ASTM C920 Class 25", "$", "https://amzn.to/4dWaUly", None),
    ],
    "room-basement-foundation": [
        ("Quikrete Hydraulic Water-Stop Cement", "hydraulic", None, "Actively leaking cracks", "Sets in minutes, even with water running", "$", "https://amzn.to/4uJzpcT", "quikrete-hydraulic"),
        ("Quikrete Polyurethane Concrete Crack Sealant", "polyurethane", None, "Cracks in concrete, masonry, stucco", "Self-leveling, flexible", "$", "https://amzn.to/4ua8Xbg", None),
        ("DAP Concrete & Mortar Waterproof Filler", "acrylic-latex", None, "Minor wall cracks and gaps", "Paintable, waterproof", "$", "https://amzn.to/4edFsQN", None),
        ("Sikaflex Crack Fix", "polyurethane", None, "Foundation crack repair", "Can be injected into the crack", "$$–$$$", "https://amzn.to/4fnMhR7", None),
        ("RadonSeal DIY Foundation Crack Repair Kit", "polyurethane", None, "Poured concrete walls", "Blocks water and radon", "$$", "https://amzn.to/4u8qErx", None),
        ("GE Advanced Silicone 2 Concrete", "silicone", None, "Concrete, mortar and stone", "30-minute rain-ready, permanently flexible", "$–$$", "https://amzn.to/4u96VrN", None),
        ("Drylok Masonry Crack Filler", "acrylic-latex", None, "Cracks in masonry walls and floors", "Fast-setting, paintable in about an hour", "$–$$", "https://amzn.to/49tay4n", None),
    ],
    "room-garage": [
        ("DAP AMP Self-Leveling Concrete Sealant", "ms-polymer", None, "Floor cracks and expansion joints", "Self-leveling, goes on damp surfaces, ASTM C920", "$", "https://amzn.to/4voHBiA", None),
        ("Sikaflex-1a", "polyurethane", None, "Floor and control joints", "Paintable, fuel-resistant", "$$–$$$", "https://amzn.to/4vcRAr8", "sikaflex-1a"),
        ("Tremco Dymonic 100", "polyurethane", None, "High-movement joints", "Pro grade, non-sag; sold through distributors", "$$$", "https://www.tremcosealants.com/blog/dymonic-100-all-purpose-sealant", None),
        ("DAP Alex Plus Clear", "siliconized-acrylic", None, "Drywall seams and trim", "Paintable, multi-surface", "$", "https://amzn.to/4u6r9SY", None),
    ],
    "room-exterior-outdoors": [
        ("DAP Dynaflex Ultra", "elastomeric", None, "Wood and fiber-cement siding", "Rated for 35% joint movement, paintable", "$", "https://amzn.to/4vpsWUq", "dap-dynaflex-ultra"),
        ("GE Advanced Silicone 2 Window & Door", "silicone", None, "Metal flashing and trim", "UV-resistant, 40-year durability claim", "$–$$", "https://amzn.to/4fXJwG6", None),
        ("NPC Solar Seal No. 900", "polyurethane", None, "Residential and commercial joints", "High movement, sticks to many surfaces", "$$", "https://amzn.to/3RAN5YZ", None),
        ("OSI Quad Max Window, Door & Siding", "specialty", "Exterior sealant", "Lap siding and J-channel", "Strong adhesion, paintable", "$$", "https://amzn.to/3RvK9Nj", "osi-quad-max"),
        ("Sikaflex-15LM", "polyurethane", None, "Expansion joints, curtain wall", "Low modulus for wide, moving joints", "$$–$$$", "https://amzn.to/4u4RKje", None),
        ("DAP Butyl-Flex", "butyl", None, "Gutters, flashing, shingle seams", "Works wet or cold, sticks to asphalt", "$", "https://www.dap.com/products-projects/products/butyl-flex-gutter-flashing-sealant/", "dap-butyl-flex"),
        ("Geocel 2300 Crystal Clear", "specialty", "Tripolymer", "Glass, trim, decorative work", "Crystal clear, paintable", "$$", "https://amzn.to/432uVll", "geocel-2300"),
        ("Sashco Log Builder", "acrylic-latex", None, "Log home chinking", "Flexible, weathertight", "$$–$$$", "https://amzn.to/4xiPp7p", None),
    ],
    "room-roof-gutters": [
        ("DAP Butyl-Flex", "butyl", None, "Gutters, flashing, shingle seams", "Works wet or cold, sticks to asphalt", "$", "https://www.dap.com/products-projects/products/butyl-flex-gutter-flashing-sealant/", "dap-butyl-flex"),
        ("GE Gutter Silicone 2", "silicone", None, "Metal and vinyl gutters", "30-minute rain-ready, wet or dry application", "$–$$", "https://gesealants.com/products/gutter-caulking/", None),
        ("Henry 289 White Roof Sealant", "elastomeric", None, "Flat and low-slope roofs, vents", "Trowel or gun, UV-stable", "$–$$", "https://www.henry.com/residential/products/residential-roof-coatings/roof-repair--sealants/289-white-roof-sealant/#product-details-section", None),
        ("Tremco Dymonic FC", "polyurethane", None, "Fascia and soffit joints", "Sag-resistant, high movement", "$$$", "https://amzn.to/433eHsf", None),
        ("GE Metal Silicone 2", "silicone", None, "Sheds, metal roofs, vents, RVs", "Won't discolor chrome, bronze or nickel", "$–$$", "https://amzn.to/4xg2qP0", None),
    ],
}

CREW = {
    "rosie": ("Rosie", "head caulker"),
    "flavio": ("Flavio", "wet-zone specialist"),
    "karen": ("Karen", "interiors & finish work"),
    "troy": ("Troy", "heights & heavy duty"),
    "zoe": ("Zoe", "windows, doors & drafts"),
}

ROOMS = [
    {
        "slug": "room-kitchen", "name": "Kitchen", "img": "kitchen", "crew": "rosie",
        "blurb": "Sinks, counters, backsplash",
        "tagline": "Where the magic happens (in the sink)",
        "intro": "The kitchen takes a beating: heat, grease, moisture, and the occasional catastrophic pasta boil-over. The caulk around your sink, countertops, and backsplash needs to be waterproof, grease-resistant, and ideally not something you have to redo every year. Here's what to reach for.",
        "alt": "Rosie caulking the seam between a kitchen countertop and backsplash",
        "caption": "Rosie at the backsplash, where the counter meets the tile.",
        "spots": [
            ("Sink rim", ["silicone"], "Constant water, soap, and temperature swings. You need a bead that stays flexible and bonds to stainless, porcelain, and stone.", ["ge-silicone-2"], "On undermount sinks the clips and epoxy hold the sink up. The silicone only seals the reveal."),
            ("Countertop to backsplash", ["silicone"], "Counters flex and water pools in that corner. Silicone in a matching color, or clear, keeps it out of the cabinet below.", ["ge-silicone-2", "gorilla-silicone"], None),
            ("Tile backsplash corners", ["specialty", "silicone"], "Grout cracks where two planes meet. Tile guidelines call for a flexible sealant at inside corners and where tile meets the counter. Sanded caulk matches sanded grout.", ["polyblend-sanded"], None),
            ("Cabinets, crown and trim to wall", ["siliconized-acrylic", "acrylic-latex"], "Dry, painted, and mostly still. A paintable caulk closes the shadow lines so the paint looks built in.", ["dap-alex-plus"], None),
            ("Window over the sink", ["siliconized-acrylic", "silicone"], "It gets splashed. Siliconized acrylic if you'll paint the trim; silicone if you won't.", ["dap-alex-plus", "ge-silicone-2"], None),
            ("Faucet base and sprayer", ["silicone"], "Most faucets come with a gasket. Follow the faucet's instructions: many call for plumber's putty or silicone, and some putties stain natural stone.", ["ge-silicone-2"], None),
            ("Range and cooktop gaps", [], "Leave the gap beside a slide-in range open so it can slide out. Drop-in cooktops seal with the manufacturer's own gasket.", [], "Don't run ordinary caulk against a hot appliance."),
        ],
        "howto_title": "Re-caulk a kitchen sink",
        "howto": [
            ("Cut out the old bead", "Slice along both edges with a utility knife or plastic razor, then peel. Take your time on stone and stainless."),
            ("Remove every bit of residue", "Silicone remover softens what's left. Finish with isopropyl alcohol on a clean rag until the rag comes away clean."),
            ("Let it dry", "If water got under the old bead, give it overnight. Caulk over damp gaps traps moisture and mildew."),
            ("Tape the lines (optional)", "Painter's tape on both sides of the joint gives you razor-straight edges and a very forgiving cleanup."),
            ("Lay one continuous bead", "Cut the nozzle small at about 45°. Keep the gun moving at a steady pace and don't stop mid-run if you can help it."),
            ("Tool it, pull the tape, wait", "Smooth with a tooling tool or a fingertip dipped in soapy water, pull the tape at once, then let it cure as long as the tube says before you run the tap."),
        ],
        "tips": [("rosie", "Kitchen grease is invisible and silicone hates it. Wipe the joint with isopropyl alcohol right before you caulk, even if it looks clean.")],
        "mistakes": [
            "Using painter's acrylic at the sink. It softens, stains, and mildews in constant water.",
            "Caulking over old caulk. New caulk sticks to the old bead, and the old bead is already letting go.",
            "Cutting the nozzle too big. A fat bead is not a stronger bead, just a messier one.",
            "Grouting the counter-to-backsplash corner. Grout is rigid, the corner moves, and the crack comes back.",
        ],
        "lasts": [("Check it", "Every spring, and whenever you deep-clean the sink."), ("Redo when", "It peels, cracks, gaps, or shows dark spots under the surface."), ("Typical life", "Several years for good silicone that went on clean and dry.")],
        "faq": [
            ("Can I use clear caulk in the kitchen?", "Yes. Clear silicone is great on stone and busy backsplashes. It shows dirt and residue underneath, so clean the joint thoroughly first."),
            ("Does kitchen caulk need to be food safe?", "Caulk around a sink or backsplash isn't a food-contact surface. If you're sealing something food touches directly, look for a sealant certified for food contact (NSF/ANSI 51)."),
            ("How soon can I use the sink?", "Many kitchen and bath silicones are water-ready in 30 minutes to a few hours and fully cured in about a day. The tube is the boss; follow it."),
        ],
        "reads": [("the-bead/how-to-caulk/index.html", "How to lay a perfect bead"), ("the-bead/remove-old-caulk/index.html", "How to remove old caulk")],
    },
    {
        "slug": "room-bathroom", "name": "Bathroom", "img": "bathroom", "crew": "flavio",
        "blurb": "Tubs, showers, toilets, vanities",
        "tagline": "The room that sees the most action",
        "intro": "No room in the house demands more from its caulk than the bathroom. Constant moisture, temperature swings, soap scum, and the biological creativity of mold spores make this the toughest gig in DIY. Go 100% silicone wherever water is present. For tile-to-tile seams where flexibility isn't critical, a sanded grout caulk in a matching color is your best friend.",
        "alt": "Flavio kneeling by a bathtub running a bead of caulk",
        "caption": "Flavio, fully committed to the tub-to-tile joint.",
        "spots": [
            ("Tub to tile or surround", ["silicone"], "The hardest-working joint in the house. A mildew-resistant 100% silicone stays flexible as the tub moves under your weight.", ["ge-silicone-2"], None),
            ("Shower pan or base to wall", ["silicone"], "Same job as the tub joint: water, movement, and cleaning chemicals. Silicone, every time.", ["ge-silicone-2"], None),
            ("Tile inside corners and changes of plane", ["silicone", "specialty"], "Where walls meet or tile meets the tub, grout cracks. Use silicone or a color-matched sanded caulk instead.", ["polyblend-sanded", "ge-silicone-2"], None),
            ("Shower door frame", ["silicone"], "Seal where the frame meets the tile, following the door's instructions.", ["ge-silicone-2"], "Never caulk the weep holes at the bottom of the frame. They let water back out."),
            ("Valve trim and tub spout", ["silicone"], "Water behind the trim plate means water in the wall. Seal the top and sides; many pros leave a small gap at the bottom so anything that sneaks in can drain out.", ["ge-silicone-2"], None),
            ("Vanity top to wall", ["silicone"], "Splash zone. Clear or color-matched silicone keeps water off the drywall behind the vanity.", ["ge-silicone-2", "gorilla-silicone"], None),
            ("Toilet base", ["silicone"], "Seals out mop water and steadies the bowl. Many plumbers caulk the front and sides and leave a gap at the back so a leak shows itself. Check your local code.", ["ge-silicone-2"], None),
            ("Trim, baseboard and fan housing", ["siliconized-acrylic"], "Humid but not wet. Paintable siliconized acrylic handles the steam, and sealing the fan housing to the ceiling stops warm air leaking into the attic.", ["dap-alex-plus"], None),
        ],
        "howto_title": "Re-caulk a bathtub",
        "howto": [
            ("Remove the old caulk completely", "Cut, peel, and scrape. Soften stubborn silicone with a remover and use a plastic scraper on acrylic tubs."),
            ("Kill the mildew", "Scrub the joint with a mildew cleaner or diluted bleach, rinse well, and never mix bleach with other cleaners."),
            ("Dry it for real", "Give it at least a day, with the fan running. Moisture trapped under a new bead is how black caulk starts."),
            ("Fill the tub with water", "The weight pulls the tub down to its widest gap, so the bead isn't stretched the first time someone gets in."),
            ("Tape, bead, tool", "Tape both sides, lay a steady bead, tool it with a soapy fingertip, and pull the tape right away."),
            ("Wait before the first shower", "Leave the water in until the caulk sets, and hold off showering for as long as the tube says. A full day is a safe bet."),
        ],
        "tips": [("flavio", "Fill the tub before you caulk. An empty tub sits high; a full one sinks to its widest gap. Caulk it there and the bead never gets stretched."), ("flavio", "Run the fan for 20 minutes after every shower. Mildew needs moisture, and the fan is the cheapest way to take it away.")],
        "mistakes": [
            "Caulking over mildew. It keeps growing underneath and shows through in weeks.",
            "Using painter's caulk in the shower. It isn't built for standing water and fails fast.",
            "Sealing shower-door weep holes. Water gets in anyway; now it can't get out.",
            "Showering too soon. An uncured bead washes out, wrinkles, or never grips.",
        ],
        "lasts": [("Check it", "Every few months. Press the bead; it should be firm and stuck on both sides."), ("Redo when", "It pulls away, splits, or has black spots under the surface."), ("Typical life", "A few years in a busy shower; longer with good ventilation.")],
        "faq": [
            ("Grout or caulk in shower corners?", "Caulk, specifically silicone or a sanded caulk. Corners move; grout doesn't, so it cracks."),
            ("Why did my new caulk turn black?", "Usually mold growing under or into the bead because the joint was damp or dirty when it was sealed. Bleach can't reach it. Cut it out, dry thoroughly, and re-caulk."),
            ("White, clear, or almond?", "Match the tub or the grout. Clear silicone looks cloudy at first and clears as it cures, but it shows any gunk left underneath."),
        ],
        "reads": [("the-bead/black-shower-caulk/index.html", "Why shower caulk turns black"), ("the-bead/remove-old-caulk/index.html", "How to remove old caulk")],
    },
    {
        "slug": "room-bedroom", "name": "Bedroom", "img": "bedroom", "crew": "karen",
        "blurb": "Trim, windows, quiet walls",
        "tagline": "Even the bedroom needs a good caulking",
        "intro": "Bedrooms aren't exactly a moisture battleground, but gaps around windows, baseboards, and crown molding can let in drafts, noise, and pests. A paintable acrylic latex caulk is the workhorse here: easy to apply, dries fast, and disappears under paint. For noise-sensitive households, acoustic caulk is the unsung hero.",
        "alt": "Karen and Troy astonished by a caulk tube erupting a bead in a bedroom",
        "caption": "Karen and Troy, witnessing a truly excellent tube.",
        "spots": [
            ("Baseboard to wall", ["acrylic-latex"], "Closes the dark gap above the baseboard so paint lines look crisp. Easy, fast, and water cleanup.", ["dap-alex-plus"], "Don't caulk baseboard to a hardwood floor. The floor needs room to move."),
            ("Crown molding", ["acrylic-latex", "elastomeric"], "Standard acrylic for most gaps. If a gap opens every winter as the ceiling rises and falls, switch to a high-stretch elastomeric.", ["dap-alex-plus", "sashco-big-stretch"], None),
            ("Window and door casing", ["acrylic-latex"], "Seals the casing to the wall and stops small drafts sneaking around the trim.", ["dap-alex-plus"], None),
            ("Outlets and switches on outside walls", ["acrylic-latex"], "Seal the gap between the box and the drywall and add foam gaskets under the cover plates. Cold drafts through outlets are real.", ["dap-alex-plus"], "Keep caulk out of the electrical box itself. Turn the breaker off first."),
            ("Shared walls and noisy gaps", ["acoustic"], "Sound travels through air gaps. Acoustic sealant stays soft and seals the perimeter of drywall and the backs of electrical boxes.", ["osi-sc-175"], None),
            ("Nail holes and dings", [], "Use wood filler or spackle, not caulk. Caulk shrinks into the hole and shows through the paint.", [], None),
        ],
        "howto_title": "Caulk baseboards like a painter",
        "howto": [
            ("Vacuum and wipe", "Dust is the enemy of adhesion. Vacuum the top of the baseboard and wipe it with a barely damp cloth."),
            ("Cut a tiny nozzle", "About 1/8 inch. Trim gaps are small, and a small opening gives you control."),
            ("Pull the gun steadily", "Work in arm-length runs at an even pace, with the nozzle riding the joint."),
            ("Wipe with a damp finger or sponge", "One smooth pass. Keep a bucket of water and a rag nearby; latex cleans up with water while wet."),
            ("Paint when the tube says", "Many acrylics are paintable within an hour or so. Check the label, then paint right over it."),
        ],
        "tips": [("karen", "Prime, caulk, then paint. Caulk sticks better to primed wood, and the topcoat hides the line where caulk meets trim.")],
        "mistakes": [
            "Using silicone on trim. It won't take paint, and removing it is miserable.",
            "Filling a big gap in one pass. Latex shrinks; fill deep gaps in two passes or use backer rod.",
            "Caulking nail holes. That's a filler's job.",
            "Chasing the winter crown-molding crack with plain acrylic every year.",
        ],
        "lasts": [("Check it", "When you repaint, or when a line of shadow appears."), ("Redo when", "It cracks, separates, or yellows through the paint."), ("Typical life", "Many years indoors, since trim doesn't see water.")],
        "faq": [
            ("Why does the crack at my crown molding come back every winter?", "In many houses the ceiling rises and falls with the seasons (often called truss uplift). Plain caulk can't stretch that far. Use a high-stretch elastomeric caulk, or ask a carpenter about fastening the crown only to the ceiling so it moves with it."),
            ("Caulk before or after painting?", "After priming, before the final coat. The paint hides the caulk line."),
            ("Can caulk soundproof a room?", "It helps by sealing the air gaps that sound slips through. It won't replace mass, insulation, or solid-core doors, but it's the cheapest improvement you can make."),
        ],
        "reads": [("the-bead/how-to-caulk/index.html", "How to lay a perfect bead"), ("the-bead/caulk-vs-sealant/index.html", "Caulk vs. sealant vs. spackle")],
    },
    {
        "slug": "room-windows-doors", "name": "Windows & doors", "img": "windows-doors", "crew": "zoe",
        "blurb": "Drafts, trim, thresholds",
        "tagline": "Let it all hang out… then seal it up",
        "intro": "A drafty window is basically just a polite hole in your wall. Window and door caulk needs to bond to multiple substrates (wood, aluminum, vinyl, brick), flex with temperature swings, and hold up for years without cracking. Polyurethane and elastomeric formulations are the go-tos for exterior applications; paintable acrylic for interior finishing.",
        "alt": "Zoe caulking the inside of a wooden window frame",
        "caption": "Zoe, closing a polite hole in the wall.",
        "spots": [
            ("Exterior trim to siding", ["ms-polymer", "elastomeric", "polyurethane"], "Sun, rain, and constant movement. Use an exterior-rated, paintable sealant with a real movement rating.", ["osi-quad-max", "dap-dynaflex-ultra", "soudal-fix-all"], None),
            ("Frame to brick, stone or stucco", ["polyurethane", "ms-polymer"], "Masonry is rough and porous and the joint is often wide. Polyurethane or hybrid grips it; use backer rod when the gap is over 1/4 inch.", ["sikaflex-1a", "soudal-fix-all"], None),
            ("Interior casing to wall", ["acrylic-latex"], "Stops the draft you feel around the trim and cleans up the paint line.", ["dap-alex-plus"], None),
            ("Door threshold and sill", ["silicone", "polyurethane"], "Seal where the sill meets the jambs and the floor, keeping water from wicking under the door.", ["ge-silicone-2", "sikaflex-1a"], None),
            ("Glass to frame", ["specialty", "silicone"], "Old wood sash takes glazing putty, not caulk. Clear silicone is fine on metal and vinyl stops.", ["sashco-lexel", "gorilla-silicone"], None),
            ("Weep holes and drainage gaps", [], "The little slots at the bottom of vinyl and aluminum frames let water out. They are supposed to be open.", [], "Never caulk weep holes."),
        ],
        "howto_title": "Seal a drafty exterior window",
        "howto": [
            ("Find the leaks", "On a windy day, move a strip of tissue or a stick of incense slowly around the trim. Where it flutters, air is moving."),
            ("Cut out failed caulk", "Anything cracked, hard, or pulling away comes out. New caulk on old caulk fails with it."),
            ("Clean and dry", "Brush out dirt and cobwebs; wipe vinyl and metal with alcohol. Bare wood should be primed."),
            ("Backer rod for big gaps", "Over about 1/4 inch wide or deep, press in foam backer rod first so the bead is the right depth."),
            ("Bead and tool", "Work on a mild, dry day within the temperature range on the tube. Tool the bead into the joint."),
            ("Paint after the cure time", "Most exterior sealants take paint once they've skinned or cured; the tube gives the window."),
        ],
        "tips": [("zoe", "Caulk keeps water out; it should never trap water in. Leave weep holes, drip edges, and the bottom edges of lap siding open."), ("zoe", "Do the outside for water and the inside for air. A window sealed on both sides is quieter, drier, and cheaper to heat.")],
        "mistakes": [
            "Caulking weep holes shut.",
            "Painting a sash shut with caulk. The window has to open.",
            "Using interior caulk outside. UV and movement will crack it in a season.",
            "Filling deep gaps without backer rod, which leads to three-sided adhesion and torn beads.",
            "Caulking in freezing weather or right before rain.",
        ],
        "lasts": [("Check it", "Each fall, before heating season."), ("Redo when", "You see cracks, gaps, or feel a draft."), ("Typical life", "Years with a good exterior sealant; the sunny side wears out first.")],
        "faq": [
            ("Inside or outside?", "Both, for different reasons. Outside keeps water out of the wall; inside stops air leaks you can feel."),
            ("What's rope caulk?", "A removable putty cord you press into gaps for the winter and peel out in spring. Great for renters and windows that open."),
            ("Can I caulk vinyl windows?", "Yes, with a sealant that lists vinyl as a substrate. Hybrids and many advanced latex sealants do; wipe the vinyl with alcohol first."),
        ],
        "reads": [("the-bead/backer-rod/index.html", "Backer rod and joint design"), ("the-bead/weather-and-cure/index.html", "Caulking in the cold and heat")],
    },
    {
        "slug": "room-basement-foundation", "name": "Basement & foundation", "img": "basement", "crew": "flavio",
        "blurb": "Cracks, leaks, penetrations",
        "tagline": "Going deep… below your house",
        "intro": "The basement is where caulk faces its most Herculean challenge: hydrostatic pressure, efflorescence, freeze-thaw cycles, and the general ambitions of water to be somewhere it shouldn't. For active leaks, hydraulic cement goes in first. For cracks after the water's stopped, polyurethane crack fillers do the heavy lifting. For joints and penetrations, use a waterproofing-grade sealant.",
        "alt": "Flavio sealing a crack in a concrete block basement wall",
        "caption": "Flavio versus a basement crack. Flavio is winning.",
        "spots": [
            ("Actively leaking crack or hole", ["hydraulic"], "Water coming through right now? Hydraulic cement sets in minutes, even against running water.", ["quikrete-hydraulic"], "It's rigid, so it can crack again if the wall moves."),
            ("Dry, non-structural wall cracks", ["polyurethane"], "Polyurethane sealant stays flexible and bonds to concrete. Leaky poured-wall cracks are often sealed with injection kits.", ["sikaflex-1a"], None),
            ("Pipe and wire penetrations", ["polyurethane", "ms-polymer"], "Where a pipe passes through the foundation, seal it on the outside where you can and on the inside as backup.", ["sikaflex-1a", "soudal-fix-all"], None),
            ("Rim joist and sill plate", ["acrylic-latex"], "A big source of drafts. Seal gaps between the sill, the foundation, and the rim joist; foam works for the bigger ones.", ["dap-alex-plus"], None),
            ("Penetrations between floors", ["specialty"], "Many codes require fire-rated sealant or fireblocking where pipes and wires pass between floors.", ["3m-fire-barrier"], None),
            ("Basement windows and wells", ["polyurethane", "silicone"], "Seal the frame to the foundation, and keep the well clear so water drains away.", ["sikaflex-1a"], None),
        ],
        "howto_title": "Seal a dry foundation crack",
        "howto": [
            ("Rule out a structural problem", "Hairline vertical shrinkage cracks are common. Horizontal cracks, stair-steps with displacement, or anything wider than about 1/4 inch or growing: call a structural engineer first."),
            ("Clean it out", "Wire brush, vacuum, and scrub off efflorescence (the white chalky stuff)."),
            ("Make sure it's dry", "Polyurethane won't stick to a wet crack. If it's leaking, plug it with hydraulic cement first."),
            ("Backer rod if it's deep", "Push rod into wider cracks so the sealant is the right depth."),
            ("Fill and tool", "Press polyurethane into the crack, tool it flat, and let it cure fully, which can take days in a cool basement."),
        ],
        "tips": [("flavio", "Water on the wall? Fix the outside first. Clean gutters, downspout extensions, and soil that slopes away from the house do more than any tube.")],
        "mistakes": [
            "Expecting caulk to hold back water under pressure.",
            "Sealing the floor-to-wall joint over an interior drainage system. That gap may be how the water is supposed to reach the drain.",
            "Ignoring structural cracks. Sealant hides the symptom.",
            "Using acrylic on below-grade concrete.",
        ],
        "lasts": [("Check it", "After heavy rain and each spring thaw."), ("Redo when", "Dampness, new cracks, or efflorescence returns."), ("Typical life", "Depends on the wall. Moving cracks will keep moving.")],
        "faq": [
            ("Is a crack in my foundation serious?", "Thin vertical cracks from concrete shrinkage are common and usually cosmetic. Horizontal cracks, bowing walls, cracks wider than about 1/4 inch, or cracks that grow are a job for a structural engineer."),
            ("Will sealing cracks fix radon?", "Sealing helps, but the EPA says sealing alone hasn't been shown to lower radon significantly or consistently. Test, and use a proper mitigation system if levels are high."),
            ("Hydraulic cement or caulk?", "Hydraulic cement for active leaks and holes; flexible sealant for dry cracks and joints that move."),
        ],
        "reads": [("the-bead/caulk-vs-sealant/index.html", "Caulk vs. sealant vs. grout"), ("the-bead/weather-and-cure/index.html", "Temperature, humidity and cure")],
    },
    {
        "slug": "room-garage", "name": "Garage", "img": "garage", "crew": "troy",
        "blurb": "Slabs, joints, thresholds",
        "tagline": "Hard-working caulk… for hard-working spaces",
        "intro": "Garages need caulk that can handle oil, chemicals, temperature extremes, and the kind of abuse that only a guy with a floor jack and poor planning can inflict. Concrete joints and floor cracks need self-leveling polyurethane. Walls and sill plates get a flexible sealant. The garage door threshold gets its own dedicated product.",
        "alt": "The whole I Love Caulk crew standing together in a garage",
        "caption": "The whole Crew, reporting for caulk duty.",
        "spots": [
            ("Floor control joints and cracks", ["polyurethane", "specialty"], "Horizontal concrete joints want a self-leveling polyurethane that flows flat and stays flexible under tires.", ["sikaflex-self-leveling"], None),
            ("Garage slab to driveway", ["polyurethane", "specialty"], "An isolation joint that moves with the seasons. Seal it with self-leveling sealant over backer rod to keep water out of the base.", ["sikaflex-self-leveling"], None),
            ("Door jambs and trim to siding", ["ms-polymer", "polyurethane"], "Exterior, sunny, and bumped by bikes. A tough exterior sealant that takes paint.", ["osi-quad-max", "sikaflex-1a"], None),
            ("Door threshold", ["specialty"], "A rubber threshold seal glued to the floor stops water and leaves. Use the adhesive the kit specifies.", [], None),
            ("Wall between garage and house", ["specialty"], "This wall is a fire separation. Seal penetrations with fire-rated sealant and keep the fire-rated door and its seals intact.", ["3m-fire-barrier"], None),
            ("Sill plate to slab", ["polyurethane"], "Stops drafts and bugs where the wall framing meets the concrete.", ["sikaflex-1a"], None),
        ],
        "howto_title": "Seal a garage floor joint",
        "howto": [
            ("Clean it out", "Pull out old filler, wire-brush, and vacuum. Degrease oily spots or nothing will stick."),
            ("Set the depth with backer rod", "Push closed-cell rod in so the sealant will be about half as deep as the joint is wide (check the tube for minimum depth)."),
            ("Tape the edges", "Tape either side on the surface if you want clean lines on a finished floor."),
            ("Pour, don't tool", "Self-leveling sealant flows flat on its own. Fill slightly low; it settles."),
            ("Keep off it", "Foot traffic and cars wait for the times on the tube. Cool weather means longer."),
        ],
        "tips": [("troy", "Self-leveling sealant finds the lowest point. On a sloped joint, work in short sections or use a non-sag sealant.")],
        "mistakes": [
            "Using latex on a floor joint. Tires tear it out.",
            "Filling a deep joint with sealant alone. It wastes tubes and fails; use backer rod.",
            "Sealing oily concrete without degreasing first.",
            "Patching an isolation joint with rigid mortar. It needs to move.",
        ],
        "lasts": [("Check it", "Each spring, after freeze-thaw season."), ("Redo when", "Edges lift, cracks open, or weeds grow through."), ("Typical life", "Years for polyurethane that went into clean, dry concrete.")],
        "faq": [
            ("Self-leveling or non-sag?", "Self-leveling for flat, horizontal joints; it flows smooth. Non-sag for walls, vertical joints, and slopes."),
            ("How soon can I drive on it?", "It varies with the product and weather, often a few days for vehicles. Follow the tube."),
            ("Does the garage-to-house wall need special caulk?", "Penetrations in that fire separation should be sealed with fire-rated sealant. Check your local code."),
        ],
        "reads": [("the-bead/backer-rod/index.html", "Backer rod and joint design"), ("the-bead/caulk-gun-guide/index.html", "Choosing a caulk gun")],
    },
    {
        "slug": "room-exterior-outdoors", "name": "Exterior & outdoors", "img": "exterior", "crew": "rosie",
        "blurb": "Siding, trim, masonry",
        "tagline": "Taking it outside",
        "intro": "Exterior caulk has to survive what the interior never will: direct UV, rain, wind, and temperature swings of 100°F or more between summer and winter. For siding and trim, go elastomeric or tripolymer (paintable). For masonry and stucco, choose a polyurethane or silicone. For joints that will move significantly, only a high-movement-rated sealant will last.",
        "alt": "Rosie caulking where a window frame meets brick",
        "caption": "Rosie, sealing brick to trim on a perfectly mild day.",
        "spots": [
            ("Siding butt joints and corner boards", ["elastomeric", "ms-polymer"], "Wood and fiber cement move with the weather. Use a paintable, exterior sealant with a high movement rating. Fiber-cement makers publish approved sealants; follow them.", ["dap-dynaflex-ultra", "sashco-big-stretch"], None),
            ("Trim to siding", ["elastomeric", "ms-polymer"], "The classic repaint job. Stretchy and paintable.", ["sashco-big-stretch", "osi-quad-max"], None),
            ("Masonry, stucco and brick", ["polyurethane", "ms-polymer"], "Rough, porous, and often wide joints. Polyurethane or hybrid with backer rod.", ["sikaflex-1a", "soudal-fix-all"], None),
            ("Hose bibs, vents and wire entries", ["ms-polymer", "silicone"], "Every hole in the wall is an invitation. Hybrid sticks to almost everything; silicone is fine if you won't paint.", ["soudal-fix-all", "gorilla-silicone"], None),
            ("Steps, walks and patio joints", ["polyurethane", "specialty"], "Horizontal concrete joints get self-leveling polyurethane over backer rod.", ["sikaflex-self-leveling"], None),
            ("Pest entry points", ["acrylic-latex", "polyurethane"], "Small gaps get caulk. Bigger holes get stuffed with copper mesh and then sealed.", ["sikaflex-1a"], None),
        ],
        "howto_title": "Re-caulk exterior trim before painting",
        "howto": [
            ("Wash and let it dry", "Dirt and chalky paint ruin adhesion. Give washed siding a dry day or two."),
            ("Scrape and remove failed caulk", "Anything cracked or loose comes out. Scrape loose paint too."),
            ("Prime bare wood", "Primer gives the caulk and the paint something solid to grab."),
            ("Backer rod, then caulk", "Rod for joints over 1/4 inch; then a paintable exterior sealant, tooled into the joint."),
            ("Paint on schedule", "Paint when the tube allows. Painted sealant lasts longer in the sun."),
        ],
        "tips": [("rosie", "Never caulk the bottom edge of lap siding or trim drip edges. Water that gets behind needs a way out.")],
        "mistakes": [
            "Using caulk as flashing. Caulk is backup; metal and membranes do the real work.",
            "Caulking the laps of lap siding, which traps water and rots the wall.",
            "Caulking in hot direct sun or right before rain.",
            "Skipping primer on bare wood.",
        ],
        "lasts": [("Check it", "Walk around the house every spring and fall."), ("Redo when", "Cracks, gaps, or peeling, especially on the sunny sides."), ("Typical life", "Years for high-performance sealants; less for budget latex in full sun.")],
        "faq": [
            ("Can I caulk before rain?", "Only with a product rated for it. Many sealants advertise a rain-ready time; check the tube and the forecast."),
            ("What caulk goes on brick?", "Polyurethane or a hybrid rated for masonry, with backer rod in wide joints."),
            ("Can I paint silicone outside?", "Standard silicone won't hold paint. If it needs paint, use a hybrid, polyurethane, or paintable elastomeric instead."),
        ],
        "reads": [("the-bead/weather-and-cure/index.html", "Caulking in the cold and heat"), ("the-bead/reading-the-label/index.html", "The caulk aisle, decoded")],
    },
    {
        "slug": "room-roof-gutters", "name": "Roof & gutters", "img": "roof", "crew": "troy",
        "blurb": "Flashing, vents, seams",
        "tagline": "Elevate your caulk",
        "intro": "Roofing caulk and gutter sealant are not the place to economize. They need to flex, stick to metal and asphalt, and hold up through years of freeze-thaw abuse, all while you're on a ladder hoping the neighbors aren't watching. Butyl rubber and polyurethane formulations dominate up here.",
        "alt": "Troy in a safety harness sealing a roof vent flashing",
        "caption": "Troy, harnessed in and sealing a vent flashing.",
        "spots": [
            ("Gutter seams and end caps", ["butyl", "specialty"], "Metal that expands and contracts in the sun. Gutter sealant goes on the water side of the seam.", ["dap-butyl-flex", "geocel-2300"], None),
            ("Flashing edges and reglets", ["specialty", "polyurethane"], "Where counter-flashing tucks into masonry, a roof-rated sealant keeps water from following it in.", ["geocel-2300", "sashco-through-the-roof"], None),
            ("Exposed nail heads", ["specialty"], "A dab of roof sealant over exposed fasteners on flashing or ridge caps.", ["sashco-through-the-roof"], None),
            ("Plumbing vent boots", ["specialty"], "Sealant can buy time on a cracked boot. Replacing the boot is the real fix.", ["sashco-through-the-roof"], None),
            ("Chimney crown and cap", ["polyurethane", "specialty"], "Small crown cracks take a masonry or crown sealant; flashing takes polyurethane.", ["sikaflex-1a"], None),
            ("Dish and fixture mounts", ["specialty"], "Every lag bolt through the roof gets sealant under and over it.", ["geocel-2300"], None),
        ],
        "howto_title": "Seal a leaking gutter seam",
        "howto": [
            ("Set the ladder safely", "One foot out for every four feet up, on firm level ground, with someone nearby. Never lean on the gutter."),
            ("Clean the seam", "Scoop debris, scrub off old sealant and rust with a wire brush, and let it dry completely."),
            ("Seal the inside", "Apply gutter sealant along the seam on the inside, where the water runs, and feather it smooth."),
            ("Cover rivets and screws", "Dab each fastener head. That's where drips start."),
            ("Let it cure, then hose-test", "Give it the cure time on the tube, then run a garden hose down the gutter and watch."),
        ],
        "tips": [("troy", "Ladder foot out one foot for every four feet of height, and extend three feet above the edge if you're stepping onto the roof. Three points of contact. Every time.")],
        "mistakes": [
            "Using sealant instead of flashing. Sealant is a backup, not the system.",
            "Caulking a wet or dirty gutter.",
            "Using standard silicone on asphalt shingles; many silicones don't bond well to asphalt.",
            "Working on a wet, icy, or scorching roof.",
        ],
        "lasts": [("Check it", "After fall leaf drop and after big storms."), ("Redo when", "Drips at seams, stains on fascia, or cracked sealant."), ("Typical life", "Years, if the metal was clean and dry when it went on.")],
        "faq": [
            ("Is roof caulk a permanent fix?", "Sealant is maintenance. Failed flashing, cracked boots, and worn shingles need repair or replacement."),
            ("Can I apply roof sealant when it's wet?", "Some roof sealants are rated for damp or wet surfaces; most sealants aren't. Only trust the tube."),
            ("When should I call a roofer?", "Anytime the roof is steep, high, or wet, or the leak is under the shingles. No caulk is worth a fall."),
        ],
        "reads": [("the-bead/reading-the-label/index.html", "The caulk aisle, decoded"), ("the-bead/weather-and-cure/index.html", "Caulking in the cold and heat")],
    },
]


def e(s):
    return escape(s, quote=True)


def type_tag(t, label=None):
    return f'<a class="type-tag t-{t}" href="{{{{root}}}}caulk-by-type/index.html#{t}">{e(label or TYPES[t])}</a>'


def amazon_link(url, text="Amazon"):
    return f'<a class="buy-link" href="{e(url)}" rel="sponsored nofollow noopener" target="_blank">{text}</a>'


def pick_link(p):
    link = f'<a href="{{{{root}}}}reviews/index.html#{p}">{e(PRODUCTS[p])}</a>'
    return link + (f' ({amazon_link(AMAZON[p])})' if p in AMAZON else "")


def shop_rows(slug):
    rows = []
    for product, t, label, best, why, price, url, review in SHOP[slug]:
        name = f'<a href="{{{{root}}}}reviews/index.html#{review}">{e(product)}</a>' if review else e(product)
        if "amzn.to" in url:
            buy = amazon_link(url, "Check price on Amazon")
        else:
            buy = f'<a class="buy-link" href="{e(url)}" rel="noopener" target="_blank">Maker\'s page</a>'
        rows.append(f'          <tr><th scope="row">{name}</th><td>{type_tag(t, label)}</td><td>{e(best)}</td>'
                    f'<td>{e(why)}</td><td class="shop-price">{e(price)}</td><td>{buy}</td></tr>')
    return "\n".join(rows)


def room_tile(room, mini=False):
    size = "sq"
    return (f'<a class="room-tile" href="{{{{root}}}}{room["slug"]}/index.html">'
            f'<img src="{{{{root}}}}assets/img/{room["img"]}-{size}.webp" width="480" height="480" loading="lazy" alt="">'
            f'<span>{e(room["name"])}' + ("" if mini else f'<small>{e(room["blurb"])}</small>') + '</span></a>')


def crew_tip(crew, text):
    name = CREW[crew][0]
    return (f'<aside class="crew-tip"><img src="{{{{root}}}}assets/img/crew-{crew}.webp" width="64" height="64" alt="">'
            f'<div><span class="who">{name}\'s tip</span><p>{e(text)}</p></div></aside>')


def room_page(room):
    name, beat = CREW[room["crew"]]
    spots = []
    for title, types, why, picks, warn in room["spots"]:
        first = types[0] if types else ""
        cls = f' t-{first}' if first else ""
        use = "".join(type_tag(t) for t in types) if types else '<span class="tag">Not a caulk job</span>'
        pick = f'<p class="spot-pick">Our pick: {", ".join(pick_link(p) for p in picks)}</p>' if picks else ""
        w = f'<p class="spot-warn">{e(warn)}</p>' if warn else ""
        spots.append(f'''        <article class="spot{cls}">
          <h3>{e(title)}</h3>
          <div class="spot-use">{use}</div>
          <p>{e(why)}</p>
          {w}{pick}
        </article>''')
    steps = "\n".join(f'          <li><h3>{e(h)}</h3><p>{e(p)}</p></li>' for h, p in room["howto"])
    tips = "\n".join(crew_tip(c, t) for c, t in room["tips"])
    mistakes = "\n".join(f"          <li>{e(m)}</li>" for m in room["mistakes"])
    lasts = "\n".join(f"          <dt>{e(k)}</dt><dd>{e(v)}</dd>" for k, v in room["lasts"])
    faq = "\n".join(f'        <details><summary>{e(q)}</summary><div class="answer"><p>{e(a)}</p></div></details>' for q, a in room["faq"])
    reads = "".join(f'<li><a href="{{{{root}}}}{href}">{e(t)}</a></li>' for href, t in room["reads"])
    others = "".join(room_tile(r, mini=True) for r in ROOMS if r["slug"] != room["slug"])
    lname = room["name"].lower()
    img = room["img"]
    landscape = img in ("bedroom", "garage")
    h = 450 if landscape else 750
    return f'''---
title: {room["name"]} caulk guide
description: Where to caulk in the {lname}, which caulk goes in each joint, and how to do the main job right. {room["tagline"]}.
section: rooms
---
<header class="page-head tiled">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="{{{{root}}}}index.html">Home</a></li><li><a href="{{{{root}}}}caulk-by-room/index.html">Caulk by room</a></li><li>{e(room["name"])}</li></ol></nav>
    <div class="page-head-grid">
      <div>
        <p class="kicker">Caulk by room</p>
        <h1>{e(room["name"])}</h1>
        {{{{> bead-line}}}}
        <p class="room-tagline">{e(room["tagline"])}</p>
        <p class="lede">{e(room["intro"])}</p>
        <div class="guide-chip"><img src="{{{{root}}}}assets/img/crew-{room["crew"]}.webp" width="48" height="48" alt=""><span>Your guide<strong>{name}, {beat}</strong></span></div>
      </div>
      <figure class="snapshot">
        <img src="{{{{root}}}}assets/img/{img}-600.webp" srcset="{{{{root}}}}assets/img/{img}-600.webp 600w, {{{{root}}}}assets/img/{img}-1100.webp 1100w" sizes="(max-width: 820px) 90vw, 440px" width="600" height="{h}" alt="{e(room["alt"])}">
        <figcaption>{e(room["caption"])}</figcaption>
      </figure>
    </div>
  </div>
</header>
{{{{joint}}}}

<section class="section" aria-labelledby="spots">
  <div class="wrap">
    <div class="section-head">
      <h2 id="spots">Where to caulk in the {lname}</h2>
      <p>Every joint in the room, what goes in it, and why. The color bar matches the formulation.</p>
    </div>
    <div class="spot-list">
{chr(10).join(spots)}
    </div>
  </div>
</section>

<section class="section-tight" aria-labelledby="shop">
  <div class="wrap">
    <div class="section-head">
      <h2 id="shop">The {lname} shopping list</h2>
      <p>Tubes worth a place in your cart for this room, and the joint each one suits. Price runs from $ (budget) to $$$ (pro grade).</p>
    </div>
    <div class="table-scroll">
      <table class="spec-table shop-table">
        <caption class="visually-hidden">{e(room["name"])} caulk shopping list</caption>
        <thead>
          <tr><th scope="col">Product</th><th scope="col">Type</th><th scope="col">Best for</th><th scope="col">Why</th><th scope="col">Price</th><th scope="col">Buy</th></tr>
        </thead>
        <tbody>
{shop_rows(room["slug"])}
        </tbody>
      </table>
    </div>
    <p class="affiliate-note">Amazon links are affiliate links: if you buy through one, we may earn a small commission at no extra cost to you. It never decides what we recommend.</p>
  </div>
</section>

<section class="section tiled" aria-labelledby="howto">
  <div class="wrap split" style="align-items:start">
    <div class="howto-card">
      <h2 id="howto">{e(room["howto_title"])}</h2>
      <ol class="steps">
{steps}
      </ol>
    </div>
    <div>
      {tips}
      <div class="card">
        <h3>Keep reading</h3>
        <ul class="small" style="margin:0;padding-left:1.1em">{reads}<li><a href="{{{{root}}}}calculator/index.html">How many tubes do I need?</a></li></ul>
      </div>
    </div>
  </div>
</section>

{{{{ad}}}}

<section class="section-tight">
  <div class="wrap grid grid-2" style="align-items:start">
    <div>
      <h2>Mistakes we see</h2>
      <ul class="mistakes">
{mistakes}
      </ul>
    </div>
    <div class="lasts">
      <h2>How long it lasts</h2>
      <dl class="kv">
{lasts}
      </dl>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="room-faq">
  <div class="wrap wrap-narrow">
    <h2 id="room-faq">{e(room["name"])} questions</h2>
    <div class="faq-list">
{faq}
    </div>
    <p style="margin-top:18px">More answers in the <a href="{{{{root}}}}faq/index.html">full FAQ</a>, or let the <a href="{{{{root}}}}caulk-finder/index.html">Caulk Finder</a> pick for you.</p>
  </div>
</section>

<section class="section-tight" aria-labelledby="other-rooms" style="padding-bottom:72px">
  <div class="wrap">
    <h2 id="other-rooms" style="font-size:var(--step-2)">Other rooms</h2>
    <div class="mini-rooms">{others}</div>
  </div>
</section>
'''


def hub_page():
    tiles = "\n      ".join(room_tile(r) for r in ROOMS)
    rows = []
    for r in ROOMS:
        main_types = []
        for _, types, *_ in r["spots"]:
            for t in types:
                if t not in main_types:
                    main_types.append(t)
        tags = "".join(type_tag(t) for t in main_types[:4])
        rows.append(f'<tr><th scope="row"><a href="{{{{root}}}}{r["slug"]}/index.html">{e(r["name"])}</a></th><td>{e(r["blurb"])}</td><td><div class="tags">{tags}</div></td><td>{e(CREW[r["crew"]][0])}</td></tr>')
    return f'''---
title: Caulk by room
description: Room-by-room caulk guides for the kitchen, bathroom, bedroom, windows and doors, basement, garage, exterior, and roof.
section: rooms
---
<header class="page-head tiled">
  <div class="wrap">
    <nav class="crumbs" aria-label="Breadcrumb"><ol><li><a href="{{{{root}}}}index.html">Home</a></li><li>Caulk by room</li></ol></nav>
    <h1>Caulk by room</h1>
    {{{{> bead-line}}}}
    <p class="lede" style="color:var(--ink)">Every room has its own enemies: water in the bathroom, grease in the kitchen, sun and ice outside. Pick a room and we'll walk you through every joint in it.</p>
  </div>
</header>
{{{{joint}}}}

<section class="section" aria-label="Rooms">
  <div class="wrap">
    <div class="tile-board">
      {tiles}
    </div>
  </div>
</section>

{{{{ad}}}}

<section class="section-tight" aria-labelledby="cheat">
  <div class="wrap">
    <div class="section-head"><h2 id="cheat">The whole house on one card</h2><p>What each room mostly calls for. The room guides go joint by joint.</p></div>
    <div class="table-scroll">
      <table class="spec-table">
        <thead><tr><th scope="col">Room</th><th scope="col">The usual suspects</th><th scope="col">Main formulations</th><th scope="col">Guide</th></tr></thead>
        <tbody>
          {"".join(rows)}
        </tbody>
      </table>
    </div>
  </div>
</section>

<section class="section" aria-labelledby="not-sure">
  <div class="wrap split">
    <div>
      <h2 id="not-sure">Not sure which room it counts as?</h2>
      <p class="lede">A shower window, a garage that's also a workshop, a porch that's sort of inside. The Caulk Finder asks about the joint itself (wet or dry, moving or still, painted or not) and names the caulk.</p>
      <p><a class="btn" href="{{{{root}}}}caulk-finder/index.html">Open the Caulk Finder</a></p>
    </div>
    <figure class="snapshot tilt-left">
      <img src="{{{{root}}}}assets/img/finder-600.webp" width="600" height="750" loading="lazy" alt="Rosie in a deerstalker hat, inspecting something through a magnifying glass">
      <figcaption>Rosie is on the case.</figcaption>
    </figure>
  </div>
</section>
'''


def main():
    for r in ROOMS:
        out = PAGES / r["slug"] / "index.html"
        out.parent.mkdir(parents=True, exist_ok=True)
        out.write_text(room_page(r), encoding="utf-8", newline="\n")
    hub = PAGES / "caulk-by-room" / "index.html"
    hub.parent.mkdir(parents=True, exist_ok=True)
    hub.write_text(hub_page(), encoding="utf-8", newline="\n")
    print(f"wrote {len(ROOMS)} room pages + hub")


if __name__ == "__main__":
    main()
