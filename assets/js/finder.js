/* Caulk Finder: answers in, formulation + tube + technique out. */
(function () {
  "use strict";
  var form = document.getElementById("finder-form");
  var out = document.getElementById("finder-result");
  if (!form || !out) return;
  var root = form.getAttribute("data-root") || "";

  var TYPES = {
    "acrylic-latex": "Acrylic latex",
    "siliconized-acrylic": "Siliconized acrylic latex",
    "silicone": "100% silicone",
    "polyurethane": "Polyurethane",
    "butyl": "Butyl rubber",
    "elastomeric": "Elastomeric latex",
    "acoustic": "Acoustic sealant",
    "hydraulic": "Hydraulic cement",
    "ms-polymer": "MS polymer / hybrid",
    "specialty": "Specialty sealant"
  };
  var PRODUCTS = {
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
    "3m-fire-barrier": "3M Fire Barrier CP 25WB+"
  };
  // Amazon affiliate links; keep in sync with AMAZON in src/tools/rooms.py.
  var AMAZON = {
    "dap-alex-plus": "https://amzn.to/4x50QPS",
    "dap-dynaflex-ultra": "https://amzn.to/4vpsWUq",
    "ge-silicone-2": "https://amzn.to/4o2bNgP",
    "gorilla-silicone": "https://amzn.to/4nYryFJ",
    "polyblend-sanded": "https://amzn.to/4dTzgfo",
    "osi-quad-max": "https://amzn.to/3RvK9Nj",
    "sikaflex-1a": "https://amzn.to/4vcRAr8",
    "geocel-2300": "https://amzn.to/432uVll",
    "quikrete-hydraulic": "https://amzn.to/4uJzpcT"
  };
  var ROOM_FOR = {
    tub: ["room-bathroom", "Bathroom guide"], counter: ["room-kitchen", "Kitchen guide"],
    trim: ["room-bedroom", "Bedroom & trim guide"], window: ["room-windows-doors", "Windows & doors guide"],
    siding: ["room-exterior-outdoors", "Exterior guide"], concrete: ["room-garage", "Garage guide"],
    masonry: ["room-basement-foundation", "Basement & foundation guide"], roof: ["room-roof-gutters", "Roof & gutters guide"],
    gutter: ["room-roof-gutters", "Roof & gutters guide"], hole: ["room-exterior-outdoors", "Exterior guide"],
    glass: ["room-windows-doors", "Windows & doors guide"], sound: ["room-bedroom", "Bedroom guide"]
  };
  var FIELDS = ["joint", "where", "wet", "paint", "gap", "move"];

  function val(name) {
    var el = form.querySelector('input[name="' + name + '"]:checked');
    return el ? el.value : "";
  }
  function checked(name) {
    var el = form.querySelector('input[name="' + name + '"]');
    return !!(el && el.checked);
  }
  function esc(s) {
    return String(s).replace(/[&<>"]/g, function (c) { return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]; });
  }
  function pick(id) {
    var html = '<a href="' + root + "reviews/index.html#" + id + '">' + esc(PRODUCTS[id]) + "</a>";
    if (AMAZON[id]) html += ' <span class="verdict-amazon">(<a class="buy-link" href="' + AMAZON[id] + '" rel="sponsored nofollow noopener" target="_blank">Amazon</a>)</span>';
    return html;
  }

  function decide(a) {
    var r = { type: "", why: "", picks: [], alt: [], tips: [], warn: [] };
    var outdoors = a.where === "out" || a.where === "below";

    var masonryLeak = a.joint === "masonry" || ((a.joint === "concrete" || a.joint === "hole") && a.where === "below");
    if (a.wet === "leak" && masonryLeak) {
      r.type = "hydraulic";
      r.why = "Water is coming through masonry right now. Caulk can't stick to a running leak, but hydraulic cement sets in minutes even against flowing water.";
      r.picks = ["quikrete-hydraulic"];
      r.tips.push("Undercut the crack so it's wider inside than at the surface, then press the cement in and hold it for a few minutes while it sets.");
      r.tips.push("Once the wall has dried out, seal any remaining cracks with polyurethane. Hydraulic cement is rigid.");
      r.warn.push("Find out why the water's there. Gutters, downspouts, and grading are usually the real fix.");
    } else if (a.wet === "leak") {
      var up = a.joint === "roof" || a.joint === "gutter";
      r.type = up ? "specialty" : "silicone";
      r.why = up
        ? "A roof or gutter leaking now needs a sealant rated for damp surfaces as a stopgap, then a proper repair once it's dry."
        : "Water actively coming in means the joint must be dried out before any caulk will grip. Stop the source, dry it, then seal.";
      r.picks = up ? ["sashco-through-the-roof"] : ["ge-silicone-2"];
      r.warn.push("Most caulks won't bond to wet surfaces. Only products rated for wet application (some roof sealants are) can go on damp.");
    } else if (a.joint === "sound") {
      r.type = "acoustic";
      r.why = "Sound slips through air gaps. Acoustic sealant stays soft forever, so the seal stays airtight as the wall flexes.";
      r.picks = ["osi-sc-175"];
      r.tips.push("Seal drywall edges at floor, ceiling and corners, plus around electrical boxes, before the trim goes on.");
      r.tips.push("It stays sticky and isn't meant to be paint's final surface. Hide it behind trim or drywall.");
    } else if (a.joint === "gutter") {
      r.type = "butyl";
      r.why = "Gutter seams are metal that expands in the sun and sits in water. Butyl and tripolymer gutter sealants stay tacky, flexible and stuck to metal.";
      r.picks = ["dap-butyl-flex"]; r.alt = ["geocel-2300"];
      r.tips.push("Seal the inside of the seam, on the water side, after scrubbing off old sealant and rust.");
      r.warn.push("Ladder safety: one foot out for every four feet up, and never lean on the gutter.");
    } else if (a.joint === "roof") {
      r.type = "specialty";
      r.why = "Roof sealants are built for asphalt, metal flashing and UV, and some can go on damp surfaces.";
      r.picks = ["sashco-through-the-roof"]; r.alt = ["geocel-2300"];
      r.tips.push("Sealant backs up flashing; it doesn't replace it. Cracked vent boots and failed flashing need replacing.");
      r.warn.push("Many standard silicones don't bond well to asphalt shingles.");
    } else if (a.joint === "concrete") {
      r.type = "polyurethane";
      r.why = "Flat concrete joints need a sealant that flows level, stays flexible under tires and feet, and bonds to rough, porous concrete: self-leveling polyurethane.";
      r.picks = ["sikaflex-self-leveling"]; r.alt = ["sikaflex-1a"];
      r.tips.push("Clean and degrease the joint, then set closed-cell backer rod so the sealant is about half as deep as it is wide.");
      r.tips.push("Pour it slightly low and don't tool it. It levels itself. On slopes use a non-sag polyurethane instead.");
    } else if (a.joint === "masonry") {
      r.type = "polyurethane";
      r.why = "Brick, block and stucco are rough and porous. Polyurethane grips them hard and flexes as the masonry moves.";
      r.picks = ["sikaflex-1a"]; r.alt = ["soudal-fix-all"];
      r.tips.push("Wire-brush and vacuum the crack. It must be dry.");
      r.warn.push("Horizontal cracks, bowing, or cracks wider than about 1/4 inch that keep growing need a structural engineer before a sealant.");
    } else if (a.joint === "tub" || a.joint === "counter" || a.wet === "daily") {
      r.type = "silicone";
      r.why = "Water every day calls for 100% silicone: fully waterproof, permanently flexible, and mildew-resistant in kitchen and bath formulas.";
      r.picks = [checked("clear") ? "gorilla-silicone" : "ge-silicone-2"];
      r.alt = a.joint === "tub" ? ["polyblend-sanded"] : ["gorilla-silicone"];
      if (a.joint === "tub") r.tips.push("Fill the tub with water before you caulk so the joint is at its widest, and leave it until the caulk sets.");
      r.tips.push("Remove every trace of old caulk and soap scum, wipe with isopropyl alcohol, and let the joint dry completely.");
      r.tips.push("Wait the full cure time on the tube before the first shower. 24 hours is the safe bet.");
      if (a.paint === "yes") r.warn.push("Standard silicone can't be painted. In a wet zone, choose the caulk color instead of painting it.");
    } else if (a.joint === "glass") {
      r.type = "silicone";
      r.why = "Glass and glazed tile are slick and non-porous. Silicone bonds to them better than anything else.";
      r.picks = [checked("clear") ? "sashco-lexel" : "gorilla-silicone"]; r.alt = ["sashco-lexel"];
      if (r.picks[0] === "sashco-lexel") r.alt = ["gorilla-silicone"];
      r.tips.push("Old wood window sash takes glazing putty, not caulk.");
      if (a.paint === "yes") { r.type = "ms-polymer"; r.why = "You want it painted, which rules out standard silicone. A hybrid sticks to glass and metal and takes paint."; r.picks = ["soudal-fix-all"]; r.alt = []; }
    } else if (a.joint === "hole") {
      if (checked("fire")) {
        r.type = "specialty";
        r.why = "Penetrations through floors or fire-rated walls (like the garage-to-house wall) need fire-rated sealant.";
        r.picks = ["3m-fire-barrier"];
        r.warn.push("Fire-stopping rules vary by code and material. Check local code for what's required.");
      } else if (outdoors) {
        r.type = "ms-polymer";
        r.why = "Pipes, vents and wires outside mean mixed materials: plastic, metal, siding, masonry. A hybrid sticks to nearly all of them and takes paint.";
        r.picks = ["soudal-fix-all"]; r.alt = ["sikaflex-1a"];
        r.tips.push("Holes bigger than about 1/2 inch: stuff with backer rod (or copper mesh against pests) before sealing.");
      } else {
        r.type = "acrylic-latex";
        r.why = "An indoor hole around a pipe or wire is an air leak. Acrylic latex seals it and paints over cleanly.";
        r.picks = ["dap-alex-plus"];
        r.tips.push("For gaps bigger than about 1/4 inch, use low-expansion foam and caulk the edge.");
      }
    } else if (outdoors || a.joint === "siding") {
      if (a.paint === "no" && a.move !== "lots") {
        r.type = "ms-polymer";
        r.why = "Outdoors without paint: a hybrid handles UV, rain, and nearly any surface. Silicone works too if you'll never paint it.";
        r.picks = ["soudal-fix-all"]; r.alt = ["gorilla-silicone"];
      } else if (a.move === "lots" || a.joint === "siding") {
        r.type = "elastomeric";
        r.why = "Siding and exterior trim move with every season. A high-stretch, paintable exterior sealant keeps up where ordinary caulk cracks.";
        r.picks = ["sashco-big-stretch"]; r.alt = ["dap-dynaflex-ultra", "osi-quad-max"];
      } else {
        r.type = "ms-polymer";
        r.why = "Exterior window and door frames join wood, vinyl, metal and masonry. A hybrid grips them all, shrugs off weather, and takes paint.";
        r.picks = ["soudal-fix-all"]; r.alt = ["osi-quad-max", "dap-dynaflex-ultra"];
      }
      r.tips.push("Caulk on a mild, dry day, within the temperature range on the tube, and check the forecast for its rain-ready time.");
      r.warn.push("Never caulk weep holes, drip edges, or the bottom edges of lap siding. Water needs a way out.");
    } else {
      // Indoors, trim & frames
      if (a.wet === "some" && a.paint !== "yes") {
        r.type = "silicone";
        r.why = "Splashed, and you won't paint it: silicone gives you the best water resistance.";
        r.picks = ["ge-silicone-2"]; r.alt = ["dap-alex-plus"];
      } else if (a.move === "lots" || a.move === "season") {
        r.type = "elastomeric";
        r.why = "That gap opens and closes with the seasons. A high-stretch elastomeric caulk flexes where plain acrylic cracks, and it still takes paint.";
        r.picks = ["sashco-big-stretch"]; r.alt = ["dap-alex-plus"];
      } else if (a.wet === "some") {
        r.type = "siliconized-acrylic";
        r.why = "Humid or splashed now and then, and painted: siliconized acrylic adds water resistance to paint-friendly latex.";
        r.picks = ["dap-alex-plus"];
      } else {
        r.type = "acrylic-latex";
        r.why = "Dry, indoors, and painted: plain acrylic latex is easy to tool, cleans up with water and disappears under paint.";
        r.picks = ["dap-alex-plus"];
      }
      if (a.paint === "yes") r.tips.push("Prime, caulk, then paint. Most acrylics are paintable within an hour or so; check the tube.");
    }

    // Gap size
    if (a.gap === "hair") r.tips.push("For a hairline gap, cut the nozzle tiny and press the bead in with a fingertip. Surface beads on hairlines peel.");
    if (a.gap === "mid") r.tips.push("Cut the nozzle at about 45° to just under the gap width.");
    if (a.gap === "wide") r.tips.push("Over 1/4 inch: press in foam backer rod first so the bead is about half as deep as it is wide.");
    if (a.gap === "huge") {
      r.tips.push("Over 1/2 inch: backer rod is mandatory, and check that your sealant is rated for that joint width.");
      r.warn.push("If the gap is over an inch, it's a job for trim, filler or foam first; caulk finishes the edge.");
    }
    if (a.move === "lots" && ["acrylic-latex", "siliconized-acrylic"].indexOf(r.type) !== -1) {
      r.warn.push("A lot of movement needs a high-movement sealant. Look for ASTM C920 and a movement class of ±25% or more.");
    }
    if (a.move === "lots") r.tips.push("Joints that move need two-sided adhesion. Backer rod or bond-breaker tape keeps the bead from sticking to the bottom of the joint.");
    if (a.paint === "unsure" && r.type === "silicone") r.tips.push("If there's any chance you'll paint it later, ask for a paintable formula now. Standard silicone never takes paint.");
    return r;
  }

  function render() {
    var a = {};
    FIELDS.forEach(function (f) { a[f] = val(f); });
    var answered = FIELDS.filter(function (f) { return a[f]; }).length;
    var progress = document.getElementById("finder-progress");
    if (progress) progress.textContent = answered + " of " + FIELDS.length + " answered";
    // Update URL hash so the result is shareable
    var parts = FIELDS.filter(function (f) { return a[f]; }).map(function (f) { return f + "=" + a[f]; });
    if (checked("clear")) parts.push("clear=1");
    if (checked("fire")) parts.push("fire=1");
    try { history.replaceState(null, "", parts.length ? "#" + parts.join("&") : location.pathname); } catch (e) {}

    if (!a.joint) {
      out.innerHTML = '<div class="verdict-empty"><p class="verdict-kicker">Rosie is waiting</p><h2>Start with what you\'re sealing.</h2><p>Pick the joint on the left. The answer sharpens with every question, and you can stop whenever it looks right.</p></div>';
      return;
    }
    var r = decide(a);
    var room = ROOM_FOR[a.joint];
    var html = '<p class="verdict-kicker">Rosie\'s verdict</p>';
    html += '<h2 class="verdict-type"><span class="type-tag t-' + r.type + '">' + esc(TYPES[r.type]) + "</span></h2>";
    html += '<p class="verdict-why">' + esc(r.why) + "</p>";
    html += '<div class="verdict-buy"><h3>Buy this</h3><p>' + r.picks.map(pick).join(" or ") + "</p>";
    if (r.alt.length) html += '<p class="small">Also good: ' + r.alt.map(pick).join(", ") + "</p>";
    if (r.picks.concat(r.alt).some(function (id) { return AMAZON[id]; })) html += '<p class="affiliate-note">Amazon links are affiliate links. They never decide the verdict.</p>';
    html += "</div>";
    if (r.warn.length) html += '<div class="warn"><strong>Heads up</strong>' + r.warn.map(function (w) { return "<p>" + esc(w) + "</p>"; }).join("") + "</div>";
    if (r.tips.length) html += '<h3>Prep &amp; technique</h3><ul class="verdict-tips">' + r.tips.map(function (t) { return "<li>" + esc(t) + "</li>"; }).join("") + "</ul>";
    html += '<p class="verdict-links">';
    html += '<a href="' + root + "caulk-by-type/index.html#" + r.type + '">About ' + esc(TYPES[r.type].toLowerCase()) + "</a>";
    if (room) html += '<a href="' + root + room[0] + '/index.html">' + esc(room[1]) + "</a>";
    html += '<a href="' + root + "calculator/index.html" + (a.gap ? "?gap=" + a.gap : "") + '">How many tubes?</a>';
    html += '<a href="' + root + 'the-bead/how-to-caulk/index.html">How to lay the bead</a>';
    html += "</p>";
    if (answered < FIELDS.length) html += '<p class="small verdict-more">Answer ' + (FIELDS.length - answered) + " more for a sharper answer.</p>";
    out.innerHTML = html;
  }

  function restore() {
    var h = location.hash.replace(/^#/, "");
    if (!h) return;
    h.split("&").forEach(function (kv) {
      var p = kv.split("="), k = p[0], v = p[1];
      if (k === "clear" || k === "fire") {
        var c = form.querySelector('input[name="' + k + '"]');
        if (c) c.checked = true;
        return;
      }
      var el = form.querySelector('input[name="' + k + '"][value="' + (v || "").replace(/[^a-z-]/g, "") + '"]');
      if (el) el.checked = true;
    });
  }

  form.addEventListener("change", render);
  form.addEventListener("reset", function () { setTimeout(render, 0); });
  restore();
  render();
})();
