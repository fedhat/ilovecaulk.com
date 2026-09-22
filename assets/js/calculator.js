/* Tube calculator: joint geometry in, number of tubes out. */
(function () {
  "use strict";
  var f = document.getElementById("calc");
  if (!f) return;
  var out = document.getElementById("calc-out");
  var MM_PER_IN = 25.4;
  var CONTAINERS = { "c10": 298.7, "c28": 828, "s20": 591, "t28": 82.8 }; // millilitres

  function num(id) { var v = parseFloat(f.elements[id].value); return isFinite(v) && v > 0 ? v : 0; }
  function sel(id) { return f.elements[id].value; }
  function fmt(n, d) { return n.toLocaleString(undefined, { maximumFractionDigits: d, minimumFractionDigits: 0 }); }

  function widthMm() {
    var w = parseFloat(sel("width"));
    return sel("units") === "metric" ? w : w * MM_PER_IN;
  }
  function depthFor(profile, wMm) {
    if (profile === "fillet") return wMm / 2; // triangle: area = w*w/2
    if (profile === "square") return wMm;
    // Backer-rod joint: depth equals width up to 1/2", then half the width, never under 1/4".
    if (wMm < 12.7) return wMm;
    return Math.max(wMm / 2, 6.35);
  }

  function syncUnits() {
    var metric = sel("units") === "metric";
    document.getElementById("len-unit").textContent = metric ? "metres" : "feet";
    var w = f.elements.width;
    var cur = w.selectedIndex;
    w.innerHTML = (metric
      ? [["3", "3 mm"], ["5", "5 mm"], ["6", "6 mm"], ["10", "10 mm"], ["12", "12 mm"], ["20", "20 mm"], ["25", "25 mm"]]
      : [["0.125", "1/8 inch"], ["0.1875", "3/16 inch"], ["0.25", "1/4 inch"], ["0.375", "3/8 inch"], ["0.5", "1/2 inch"], ["0.75", "3/4 inch"], ["1", "1 inch"]]
    ).map(function (o) { return '<option value="' + o[0] + '">' + o[1] + "</option>"; }).join("");
    w.selectedIndex = cur >= 0 ? cur : 2;
  }

  function calc() {
    var metric = sel("units") === "metric";
    var len = num("run");
    var lenMm = metric ? len * 1000 : len * 12 * MM_PER_IN;
    var wMm = widthMm();
    var profile = sel("profile");
    var dMm = depthFor(profile, wMm);
    var areaMm2 = profile === "fillet" ? wMm * wMm / 2 : wMm * dMm;
    var waste = num("waste") / 100 || 0;
    var ml = areaMm2 * lenMm / 1000 * (1 + waste);
    var cap = CONTAINERS[sel("container")];
    var tubes = ml > 0 ? Math.max(1, Math.ceil(ml / cap)) : 0;
    var perTubeMm = cap / (areaMm2 / 1000) / (1 + waste);
    var perTube = metric ? fmt(perTubeMm / 1000, 1) + " m" : fmt(perTubeMm / MM_PER_IN / 12, 0) + " ft";
    var vol = metric ? fmt(ml, 0) + " mL" : fmt(ml / 29.5735, 1) + " fl oz";
    var depthNote = profile === "backer"
      ? "Sealant depth: " + (metric ? fmt(dMm, 0) + " mm" : fmt(dMm / MM_PER_IN, 2) + " in") + " over backer rod."
      : "";
    document.getElementById("waste-val").textContent = fmt(waste * 100, 0) + "%";
    if (!len) {
      out.innerHTML = '<p class="calc-big">Enter a length</p><p>Measure every run of joint you plan to fill, add them up, and type the total.</p>';
      return;
    }
    out.innerHTML =
      '<p class="calc-kicker">You need</p>' +
      '<p class="calc-big"><span>' + tubes + "</span> " + (tubes === 1 ? "tube" : "tubes") + "</p>" +
      "<p>That's about " + vol + " of sealant, including " + fmt(waste * 100, 0) + "% for waste. Each container lays roughly " + perTube + " of this bead.</p>" +
      (depthNote ? '<p class="small">' + depthNote + "</p>" : "") +
      '<p class="small">Buy one more than you need. Capped and stored somewhere mild, an opened tube keeps for a while, and running out halfway through a bead is how seams happen.</p>';
  }

  // Presets fill the length field
  document.querySelectorAll("[data-preset-ft]").forEach(function (b) {
    b.addEventListener("click", function () {
      var ft = parseFloat(b.getAttribute("data-preset-ft"));
      f.elements.run.value = sel("units") === "metric" ? fmt(ft * 0.3048, 1) : ft;
      if (b.hasAttribute("data-preset-profile")) f.elements.profile.value = b.getAttribute("data-preset-profile");
      calc();
      f.elements.run.focus();
    });
  });

  // Prefill from the Caulk Finder (?gap=hair|mid|wide|huge)
  var gap = (location.search.match(/[?&]gap=([a-z]+)/) || [])[1];
  var gapIdx = { hair: 0, mid: 1, wide: 3, huge: 4 }[gap];
  syncUnits();
  if (gapIdx !== undefined) {
    f.elements.width.selectedIndex = gapIdx;
    if (gap === "wide" || gap === "huge") f.elements.profile.value = "backer";
  }
  f.addEventListener("input", calc);
  f.addEventListener("change", function (e) {
    if (e.target.name === "units") syncUnits();
    calc();
  });
  calc();
})();
