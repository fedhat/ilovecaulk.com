/* Bead Master: a caulking game for I Love Caulk.
   Classic script, no dependencies. Works from file:// too. */
(function () {
  "use strict";

  var app = document.getElementById("bead-master");
  var canvas = document.getElementById("bm-canvas");
  if (!app || !canvas || !canvas.getContext) return;
  var ctx = canvas.getContext("2d");

  var $ = function (id) { return document.getElementById(id); };
  var stageEl = $("bm-stage");
  var overlay = $("bm-overlay");
  var banner = $("bm-banner");
  var live = $("bm-live");
  var ui = {
    job: $("bm-job"), time: $("bm-time"), pressure: $("bm-pressure"), needle: $("bm-bead-needle"),
    beadText: $("bm-bead-text"), tube: $("bm-tube"), sealed: $("bm-sealed"),
    speedWrap: $("bm-speed-wrap"), speed: $("bm-speed"),
    done: $("bm-done"), release: $("bm-release"), pause: $("bm-pause"), restart: $("bm-restart"),
    jobs: $("bm-jobs"), steady: $("bm-steady")
  };
  var ROOT = app.getAttribute("data-root") || "";
  var reduceMotion = !!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches);

  var COL = {
    caulk: "#fffefa", tile: "#bfe3d5", tileSoft: "#e3f2eb", tileDeep: "#3b8a73", grout: "#e2ddd1",
    rosie: "#d7263d", denim: "#1f3c88", ink: "#14203a", sun: "#f5b82e", sunSoft: "#fde9b8"
  };

  /* ---------- Physics constants (world units: 1 unit ~ 1 css px on desktop) ---------- */
  var IDEAL_W = 18;                                  // ideal bead width
  var A_IDEAL = Math.PI * IDEAL_W * IDEAL_W / 8;      // half-round cross-section area
  var IDEAL_SPEED = 170;                             // hand speed that lays an ideal bead at ~75% pressure
  var MAX_FLOW = A_IDEAL * 230;                      // volume per second at full pressure
  var START_DELAY = 0.1, RISE = 0.22, OOZE = 0.22, RELEASE_TAU = 0.04;
  var SPACING = 3;                                   // seam sample spacing
  var TOOL_R = 16;
  var STEADY_SPEEDS = [0, 70, 120, 170, 220, 280, 350];
  var STORE_KEY = "ilc-bead-master-v1";

  /* ---------- Jobs ---------- */
  var JOBS = [
    {
      id: "baseboard", name: "Baseboard", place: "Living room", crew: "karen", crewName: "Karen",
      blurb: "One straight run where the baseboard meets the wall. Paintable acrylic latex, the friendliest caulk there is.",
      tip: "Pick a pace and keep it. The bead should just bridge the gap with a slight crown, like a line of toothpaste laid on its side.",
      tube: 1.6,
      seam: function (W, H) { return { pts: [[0.08 * W, 0.6 * H], [0.92 * W, 0.6 * H]], closed: false }; },
      draw: drawBaseboard
    },
    {
      id: "tub", name: "Tub surround", place: "Bathroom", crew: "flavio", crewName: "Flavio",
      blurb: "Along the tub, then straight up the inside corner. It's a wet zone, so this is 100% silicone.",
      tip: "Slow down as you turn the corner. That's where beads thin out and where leaks start.",
      tube: 1.45,
      seam: function (W, H) { return { pts: [[0.07 * W, 0.7 * H], [0.66 * W, 0.7 * H], [0.66 * W, 0.12 * H]], closed: false }; },
      draw: drawTub
    },
    {
      id: "window", name: "Window frame", place: "Exterior wall", crew: "zoe", crewName: "Zoe",
      blurb: "All the way around the trim where it meets the siding. Four corners, one loop, no skipping.",
      tip: "Corners are the whole game. Ease off your hand speed, not the trigger, and keep the tip in the joint.",
      tube: 1.4,
      seam: function (W, H) {
        var x0 = 0.27 * W, x1 = 0.73 * W, y0 = 0.14 * H, y1 = 0.86 * H;
        return { pts: [[(x0 + x1) / 2, y1], [x1, y1], [x1, y0], [x0, y0], [x0, y1]], closed: true, rect: [x0, y0, x1, y1] };
      },
      draw: drawWindow
    },
    {
      id: "sink", name: "Kitchen sink", place: "Kitchen", crew: "rosie", crewName: "Rosie",
      blurb: "Around the rim of a drop-in sink. Rounded corners and one continuous loop, so you finish where you started.",
      tip: "Let off the trigger a moment before you close the loop, so you don't finish on a blob.",
      tube: 1.35,
      seam: function (W, H) {
        var x0 = 0.2 * W, x1 = 0.8 * W, y0 = 0.28 * H, y1 = 0.84 * H, r = 0.1 * Math.min(W, H);
        return { pts: roundedRect(x0, y0, x1, y1, r), closed: true, rect: [x0, y0, x1, y1, r] };
      },
      draw: drawSink
    },
    {
      id: "gutter", name: "Gutter seam", place: "Roofline, twenty feet up", crew: "troy", crewName: "Troy",
      blurb: "The curved seam where a bay-window gutter meets the drip edge. In a breeze. On a ladder.",
      tip: "Gusts push your hand around. Watch the nozzle tip, not the bead behind it, and correct early.",
      tube: 1.4, wind: true,
      seam: function (W, H) {
        var pts = [];
        for (var i = 0; i <= 60; i++) {
          var t = i / 60;
          pts.push([(0.06 + 0.88 * t) * W, H * (0.5 - 0.13 * Math.sin(Math.PI * t) + 0.03 * Math.sin(3 * Math.PI * t))]);
        }
        return { pts: pts, closed: false };
      },
      draw: drawGutter
    }
  ];

  var TITLES = [
    [90, "Bead Master"], [75, "Seam Supervisor"], [55, "Journeyman Joint Filler"], [35, "Caulk Apprentice"], [0, "Drip Tray Rookie"]
  ];

  /* ---------- State ---------- */
  var W = 1000, H = 580, res = 1;
  var S = null;             // seam samples
  var job = 0;
  var state = "board";      // board | intro | caulking | tooling | score | paused | final
  var pausedFrom = null;
  var G = null;             // per-job game data
  var layers = null, bg = null, layersDirty = false;
  var pointer = { x: 0, y: 0, inside: false, down: false, type: "mouse", fx: 0, fy: 0 };
  var keys = { space: false };
  var steady = false, steadyLevel = 0;
  var sessionScores = {};
  var lastT = 0, hudT = 0, clock = 0;
  var wind = { x: 0, y: 0 };
  var streaks = [];

  function freshGame() {
    var n = S.n;
    return {
      vol: new Float64Array(n), off: new Float64Array(n), tooled: new Uint8Array(n),
      stamps: [], totalVol: 0, strayVol: 0, tubeLeft: S.len * A_IDEAL * JOBS[job].tube, tubeCap: S.len * A_IDEAL * JOBS[job].tube,
      pressure: 0, trigger: false, triggerTime: 0, released: false,
      noz: null, prevNoz: null, pool: 0, lastStamp: null,
      started: false, elapsed: 0, wEMA: 0, pooling: false,
      oozeVol: 0, oozePool: 0, toolUsed: false, tool: null, toolS: 0, steadyS: 0,
      emptyWarned: false, readyNudged: false
    };
  }

  /* ---------- Geometry ---------- */
  function roundedRect(x0, y0, x1, y1, r) {
    var pts = [[(x0 + x1) / 2, y1], [x1 - r, y1]];
    arc(pts, x1 - r, y1 - r, r, Math.PI / 2, 0);
    pts.push([x1, y0 + r]);
    arc(pts, x1 - r, y0 + r, r, 0, -Math.PI / 2);
    pts.push([x0 + r, y0]);
    arc(pts, x0 + r, y0 + r, r, -Math.PI / 2, -Math.PI);
    pts.push([x0, y1 - r]);
    arc(pts, x0 + r, y1 - r, r, Math.PI, Math.PI / 2);
    return pts;
  }
  function arc(pts, cx, cy, r, a0, a1) {
    for (var i = 1; i <= 12; i++) {
      var a = a0 + (a1 - a0) * i / 12;
      pts.push([cx + r * Math.cos(a), cy + r * Math.sin(a)]);
    }
  }

  function resample(def) {
    var P = def.pts.slice();
    if (def.closed) P.push(P[0]);
    var segL = [], total = 0;
    for (var i = 0; i < P.length - 1; i++) {
      var l = Math.hypot(P[i + 1][0] - P[i][0], P[i + 1][1] - P[i][1]);
      segL.push(l); total += l;
    }
    var n = Math.max(2, Math.round(total / SPACING));
    var step = total / n;
    var count = def.closed ? n : n + 1;
    var sx = new Float32Array(count), sy = new Float32Array(count);
    var seg = 0, acc = 0;
    for (var k = 0; k < count; k++) {
      var s = Math.min(k * step, total);
      while (seg < segL.length - 1 && acc + segL[seg] < s) { acc += segL[seg]; seg++; }
      var t = segL[seg] ? (s - acc) / segL[seg] : 0;
      sx[k] = P[seg][0] + (P[seg + 1][0] - P[seg][0]) * t;
      sy[k] = P[seg][1] + (P[seg + 1][1] - P[seg][1]) * t;
    }
    var tx = new Float32Array(count), ty = new Float32Array(count), nx = new Float32Array(count), ny = new Float32Array(count);
    var ang = new Float32Array(count), corner = new Uint8Array(count);
    for (k = 0; k < count; k++) {
      var a = idx(k - 1, count, def.closed), b = idx(k + 1, count, def.closed);
      var dx = sx[b] - sx[a], dy = sy[b] - sy[a], L = Math.hypot(dx, dy) || 1;
      tx[k] = dx / L; ty[k] = dy / L; nx[k] = -ty[k]; ny[k] = tx[k];
      ang[k] = Math.atan2(ty[k], tx[k]);
    }
    var span = Math.max(3, Math.round(18 / step));
    for (k = 0; k < count; k++) {
      var p = idx(k - span, count, def.closed), q = idx(k + span, count, def.closed);
      var d = Math.abs(ang[q] - ang[p]);
      if (d > Math.PI) d = 2 * Math.PI - d;
      if (d > 0.6) corner[k] = 1;
    }
    return { n: count, sx: sx, sy: sy, tx: tx, ty: ty, nx: nx, ny: ny, corner: corner, step: step, len: total, closed: !!def.closed, def: def };
  }
  function idx(i, n, closed) {
    if (closed) return ((i % n) + n) % n;
    return i < 0 ? 0 : i >= n ? n - 1 : i;
  }
  function nearest(px, py) {
    var best = 0, bd = Infinity;
    for (var i = 0; i < S.n; i++) {
      var dx = px - S.sx[i], dy = py - S.sy[i], d = dx * dx + dy * dy;
      if (d < bd) { bd = d; best = i; }
    }
    var sd = (px - S.sx[best]) * S.nx[best] + (py - S.sy[best]) * S.ny[best];
    return { j: best, d2: bd, sd: sd };
  }
  function pointAt(s) {
    s = Math.max(0, Math.min(S.len, s));
    var f = s / S.step, i0 = Math.floor(f), t = f - i0;
    var a = idx(i0, S.n, S.closed), b = idx(i0 + 1, S.n, S.closed);
    if (!S.closed && i0 >= S.n - 1) { a = b = S.n - 1; t = 0; }
    return { x: S.sx[a] + (S.sx[b] - S.sx[a]) * t, y: S.sy[a] + (S.sy[b] - S.sy[a]) * t };
  }
  function widthAt(i) { return Math.sqrt(8 * (G.vol[i] / S.step) / Math.PI); }
  function offsetAt(i) { return G.vol[i] > 0 ? G.off[i] / G.vol[i] : 0; }
  function volForW(w) { return (Math.PI * w * w / 8) * S.step; }
  function isSealed(i) {
    var w = widthAt(i);
    return w >= 8 && Math.abs(offsetAt(i)) + 3 <= w / 2;
  }
  function clamp01(v) { return v < 0 ? 0 : v > 1 ? 1 : v; }

  /* ---------- Canvas sizing ---------- */
  function pickWorld() {
    var narrow = stageEl.clientWidth < 560;
    W = narrow ? 600 : 1000;
    H = narrow ? 640 : 580;
  }
  function makeCanvas(w, h) {
    var c = document.createElement("canvas");
    c.width = w; c.height = h;
    return { c: c, g: c.getContext("2d") };
  }
  function sizeCanvas() {
    var cssW = stageEl.clientWidth || 800;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    var pxW = Math.round(cssW * dpr);
    if (pxW > 2400) pxW = 2400;
    var pxH = Math.round(pxW * H / W);
    canvas.style.height = (cssW * H / W) + "px";
    if (canvas.width !== pxW || canvas.height !== pxH || !layers) {
      canvas.width = pxW; canvas.height = pxH;
      res = pxW / W;
      bg = makeCanvas(pxW, pxH);
      layers = { shadow: makeCanvas(pxW, pxH), rim: makeCanvas(pxW, pxH), body: makeCanvas(pxW, pxH), hi: makeCanvas(pxW, pxH) };
      paintBackground();
      renderCaulk();
    }
  }

  /* ---------- Procedural job sites ---------- */
  function rng(seed) {
    return function () {
      seed |= 0; seed = seed + 0x6D2B79F5 | 0;
      var t = Math.imul(seed ^ seed >>> 15, 1 | seed);
      t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t;
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  }
  function rect(g, x, y, w, h, fill) { g.fillStyle = fill; g.fillRect(x, y, w, h); }
  function rrect(g, x, y, w, h, r) {
    g.beginPath();
    g.moveTo(x + r, y); g.lineTo(x + w - r, y); g.quadraticCurveTo(x + w, y, x + w, y + r);
    g.lineTo(x + w, y + h - r); g.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    g.lineTo(x + r, y + h); g.quadraticCurveTo(x, y + h, x, y + h - r);
    g.lineTo(x, y + r); g.quadraticCurveTo(x, y, x + r, y); g.closePath();
  }
  function tiles(g, x0, y0, x1, y1, size, fill, groutCol) {
    rect(g, x0, y0, x1 - x0, y1 - y0, fill);
    g.strokeStyle = groutCol; g.lineWidth = 2.5;
    g.beginPath();
    for (var x = x0 + size; x < x1; x += size) { g.moveTo(x, y0); g.lineTo(x, y1); }
    for (var y = y1 - size; y > y0; y -= size) { g.moveTo(x0, y); g.lineTo(x1, y); }
    g.stroke();
  }
  function starburst(g, cx, cy, r) {
    g.save(); g.translate(cx, cy);
    g.strokeStyle = COL.ink; g.lineWidth = 3; g.lineCap = "round";
    for (var i = 0; i < 12; i++) {
      var a = i * Math.PI / 6, l = i % 2 ? r * 0.7 : r;
      g.beginPath(); g.moveTo(Math.cos(a) * r * 0.32, Math.sin(a) * r * 0.32); g.lineTo(Math.cos(a) * l, Math.sin(a) * l); g.stroke();
    }
    g.fillStyle = COL.sun; g.beginPath(); g.arc(0, 0, r * 0.3, 0, Math.PI * 2); g.fill();
    g.strokeStyle = COL.ink; g.lineWidth = 2; g.stroke();
    g.restore();
  }

  function drawBaseboard(g) {
    var seamY = S.sy[0];
    rect(g, 0, 0, W, seamY, "#fbe7c1");
    var r = rng(7);
    g.globalAlpha = 0.05; g.fillStyle = "#b07a2a";
    for (var i = 0; i < 90; i++) g.fillRect(r() * W, 0, 2 + r() * 3, seamY);
    g.globalAlpha = 1;
    starburst(g, W * 0.24, seamY * 0.42, Math.min(W, H) * 0.09);
    // outlet
    rrect(g, W * 0.72, seamY * 0.58, 38, 58, 5); g.fillStyle = "#fffdf7"; g.fill(); g.strokeStyle = "#d8cfbd"; g.lineWidth = 2; g.stroke();
    g.fillStyle = "#8b8474"; g.fillRect(W * 0.72 + 13, seamY * 0.58 + 16, 4, 9); g.fillRect(W * 0.72 + 22, seamY * 0.58 + 16, 4, 9);
    g.fillRect(W * 0.72 + 13, seamY * 0.58 + 36, 4, 9); g.fillRect(W * 0.72 + 22, seamY * 0.58 + 36, 4, 9);
    // baseboard
    var bh = H * 0.17;
    var grad = g.createLinearGradient(0, seamY, 0, seamY + bh);
    grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.18, "#f1eee6"); grad.addColorStop(0.24, "#fdfcf8"); grad.addColorStop(1, "#ebe7dc");
    rect(g, 0, seamY, W, bh, grad);
    rect(g, 0, seamY + bh * 0.2, W, 2, "rgba(20,32,58,.10)");
    // floor boards
    var fy = seamY + bh;
    rect(g, 0, fy, W, H - fy, "#c58b57");
    g.strokeStyle = "rgba(90,50,20,.35)"; g.lineWidth = 2;
    for (var y = fy + 26; y < H; y += 26) { g.beginPath(); g.moveTo(0, y); g.lineTo(W, y); g.stroke(); }
    for (var k = 0; k < 12; k++) {
      var yy = fy + 26 * Math.floor(r() * 5), xx = r() * W;
      g.beginPath(); g.moveTo(xx, yy); g.lineTo(xx, yy + 26); g.stroke();
    }
    rect(g, 0, fy, W, 5, "rgba(20,32,58,.18)");
  }

  function drawTub(g) {
    var cornerX = S.def.pts[1][0], tubTop = S.def.pts[1][1];
    tiles(g, 0, 0, cornerX, tubTop, 46, COL.tile, "#f5fbf8");
    tiles(g, cornerX, 0, W, tubTop, 46, "#a7d2c1", "#e7f3ee");
    // accent stripe
    rect(g, 0, tubTop * 0.34, cornerX, 14, COL.denim);
    rect(g, cornerX, tubTop * 0.34 + 4, W - cornerX, 14, "#18306f");
    rect(g, cornerX - 1, 0, 3, tubTop, "rgba(20,32,58,.10)");
    // tub
    var grad = g.createLinearGradient(0, tubTop, 0, H);
    grad.addColorStop(0, "#ffffff"); grad.addColorStop(0.08, "#f3f2ee"); grad.addColorStop(0.5, "#fbfbf8"); grad.addColorStop(1, "#dfddd6");
    rect(g, 0, tubTop, W, H - tubTop, grad);
    rect(g, 0, tubTop + (H - tubTop) * 0.3, W, 2, "rgba(20,32,58,.08)");
    // faucet
    var fx = cornerX * 0.45, fy = tubTop * 0.55;
    var cg = g.createLinearGradient(fx, fy, fx, fy + 30);
    cg.addColorStop(0, "#f5f7fa"); cg.addColorStop(0.5, "#a9b1bd"); cg.addColorStop(1, "#dde2e8");
    rrect(g, fx - 12, fy, 24, 40, 6); g.fillStyle = cg; g.fill();
    rrect(g, fx - 8, fy + 30, 70, 14, 7); g.fill();
    rrect(g, fx + 50, fy + 36, 14, 20, 4); g.fill();
    g.strokeStyle = "rgba(20,32,58,.25)"; g.lineWidth = 1.5; g.stroke();
  }

  function drawWindow(g) {
    var rc = S.def.rect, x0 = rc[0], y0 = rc[1], x1 = rc[2], y1 = rc[3];
    rect(g, 0, 0, W, H, "#cfe5da");
    for (var y = 0; y < H; y += 32) {
      rect(g, 0, y + 26, W, 6, "rgba(20,32,58,.10)");
      rect(g, 0, y + 25, W, 1.5, "rgba(255,255,255,.7)");
    }
    // shrub hint
    g.fillStyle = COL.tileDeep;
    for (var i = 0; i < 9; i++) { g.beginPath(); g.arc(W * (0.02 + i * 0.12), H + 10, 44 + (i % 3) * 10, 0, Math.PI * 2); g.fill(); }
    // trim
    var t = 30;
    rect(g, x0, y0, x1 - x0, y1 - y0, "#fdfcf7");
    g.strokeStyle = "rgba(20,32,58,.18)"; g.lineWidth = 1.5;
    g.beginPath(); g.moveTo(x0, y0); g.lineTo(x0 + t, y0 + t); g.moveTo(x1, y0); g.lineTo(x1 - t, y0 + t);
    g.moveTo(x0, y1); g.lineTo(x0 + t, y1 - t); g.moveTo(x1, y1); g.lineTo(x1 - t, y1 - t); g.stroke();
    // glass
    var gx = x0 + t, gy = y0 + t, gw = x1 - x0 - 2 * t, gh = y1 - y0 - 2 * t;
    var grad = g.createLinearGradient(gx, gy, gx + gw, gy + gh);
    grad.addColorStop(0, "#d9edf8"); grad.addColorStop(0.55, "#b9d9ec"); grad.addColorStop(1, "#e8f4fa");
    rect(g, gx, gy, gw, gh, grad);
    g.save(); g.beginPath(); g.rect(gx, gy, gw, gh); g.clip();
    g.fillStyle = "rgba(255,255,255,.45)";
    g.beginPath(); g.moveTo(gx + gw * 0.1, gy + gh); g.lineTo(gx + gw * 0.35, gy); g.lineTo(gx + gw * 0.47, gy); g.lineTo(gx + gw * 0.22, gy + gh); g.fill();
    g.restore();
    rect(g, gx + gw / 2 - 5, gy, 10, gh, "#fdfcf7");
    rect(g, gx, gy + gh / 2 - 5, gw, 10, "#fdfcf7");
    g.strokeStyle = "rgba(20,32,58,.2)"; g.lineWidth = 2; g.strokeRect(gx, gy, gw, gh);
  }

  function drawSink(g) {
    var rc = S.def.rect, x0 = rc[0], y0 = rc[1], x1 = rc[2], y1 = rc[3], r = rc[4];
    // countertop with mid-century speckle
    rect(g, 0, 0, W, H, "#f7e5b5");
    var rn = rng(42), cols = ["rgba(215,38,61,.35)", "rgba(31,60,136,.3)", "rgba(20,32,58,.25)", "rgba(245,184,46,.7)"];
    for (var i = 0; i < 900; i++) {
      g.fillStyle = cols[i % 4];
      g.fillRect(rn() * W, rn() * H, 1.5 + rn() * 2.5, 1.5 + rn() * 2.5);
    }
    // backsplash tiles
    var bh = H * 0.13;
    tiles(g, 0, 0, W, bh, 40, COL.tile, "#f5fbf8");
    rect(g, 0, bh, W, 6, "#e9d39a");
    rect(g, 0, bh + 6, W, 3, "rgba(20,32,58,.15)");
    // faucet
    var fx = (x0 + x1) / 2;
    var cg = g.createLinearGradient(fx - 30, 0, fx + 30, 0);
    cg.addColorStop(0, "#9ea7b3"); cg.addColorStop(0.5, "#f5f7fa"); cg.addColorStop(1, "#aab2bd");
    g.fillStyle = cg;
    rrect(g, fx - 34, y0 - 36, 68, 22, 10); g.fill();
    rrect(g, fx - 8, y0 - 70, 16, 44, 6); g.fill();
    // sink rim (stainless)
    var sg = g.createLinearGradient(0, y0, 0, y1);
    sg.addColorStop(0, "#eef1f4"); sg.addColorStop(1, "#b9c0c9");
    rrect(g, x0, y0, x1 - x0, y1 - y0, r); g.fillStyle = sg; g.fill();
    var inset = 20;
    var bg2 = g.createLinearGradient(0, y0 + inset, 0, y1 - inset);
    bg2.addColorStop(0, "#9aa3ae"); bg2.addColorStop(0.35, "#c9cfd6"); bg2.addColorStop(1, "#e6e9ed");
    rrect(g, x0 + inset, y0 + inset, x1 - x0 - 2 * inset, y1 - y0 - 2 * inset, Math.max(4, r - inset * 0.6)); g.fillStyle = bg2; g.fill();
    g.strokeStyle = "rgba(20,32,58,.25)"; g.lineWidth = 1.5; g.stroke();
    // drain
    var cx = (x0 + x1) / 2, cy = (y0 + y1) / 2 + 10;
    g.beginPath(); g.arc(cx, cy, 20, 0, Math.PI * 2); g.fillStyle = "#8b939e"; g.fill();
    g.beginPath(); g.arc(cx, cy, 13, 0, Math.PI * 2); g.fillStyle = "#5f6772"; g.fill();
    g.strokeStyle = "#aab2bd"; g.lineWidth = 2;
    for (var k = -1; k <= 1; k++) { g.beginPath(); g.moveTo(cx - 10, cy + k * 5); g.lineTo(cx + 10, cy + k * 5); g.stroke(); }
  }

  function drawGutter(g) {
    // sky
    var sky = g.createLinearGradient(0, 0, 0, H);
    sky.addColorStop(0, "#bfe0f0"); sky.addColorStop(1, "#eef7fb");
    rect(g, 0, 0, W, H, sky);
    // roof above the seam curve
    g.save();
    g.beginPath(); g.moveTo(0, H * 0.1);
    g.lineTo(W, H * 0.1); g.lineTo(W, S.sy[S.n - 1] - 10);
    for (var i = S.n - 1; i >= 0; i--) g.lineTo(S.sx[i], S.sy[i] - 10);
    g.lineTo(0, S.sy[0] - 10); g.closePath(); g.clip();
    rect(g, 0, 0, W, H, "#7b3b34");
    var rn = rng(3);
    for (var y = H * 0.1; y < H; y += 24) {
      var off = (Math.round(y / 24) % 2) * 20;
      for (var x = -off; x < W; x += 40) {
        g.fillStyle = ["#7b3b34", "#6d322c", "#86443b", "#733730"][Math.floor(rn() * 4)];
        g.fillRect(x + 1, y + 1, 38, 22);
      }
      rect(g, 0, y + 20, W, 4, "rgba(0,0,0,.18)");
    }
    g.restore();
    // drip edge just above seam
    g.strokeStyle = "#e9e6de"; g.lineWidth = 12; g.lineJoin = "round";
    polyline(g, 0, -6); g.stroke();
    // gutter body below seam
    var depth = Math.min(90, H * 0.16);
    g.beginPath();
    for (i = 0; i < S.n; i++) g[i ? "lineTo" : "moveTo"](S.sx[i], S.sy[i]);
    for (i = S.n - 1; i >= 0; i--) g.lineTo(S.sx[i], S.sy[i] + depth);
    g.closePath();
    var gg = g.createLinearGradient(0, H * 0.3, 0, H * 0.75);
    gg.addColorStop(0, "#fbfaf5"); gg.addColorStop(1, "#dcd8cc");
    g.fillStyle = gg; g.fill();
    g.strokeStyle = "rgba(20,32,58,.12)"; g.lineWidth = 2;
    polyline(g, depth * 0.35, 0); g.stroke();
    polyline(g, depth * 0.72, 0); g.stroke();
    // siding below
    g.save();
    g.beginPath();
    g.moveTo(0, S.sy[0] + depth);
    for (i = 0; i < S.n; i++) g.lineTo(S.sx[i], S.sy[i] + depth);
    g.lineTo(W, S.sy[S.n - 1] + depth); g.lineTo(W, H); g.lineTo(0, H); g.closePath(); g.clip();
    rect(g, 0, 0, W, H, "#f1e7cf");
    for (y = 0; y < H; y += 30) rect(g, 0, y, W, 3, "rgba(20,32,58,.08)");
    g.restore();
    // downspout at the left end
    rect(g, S.sx[0] - 2, S.sy[0] + depth - 4, 34, H, "#ece8de");
    rect(g, S.sx[0] - 2, S.sy[0] + depth - 4, 5, H, "rgba(20,32,58,.1)");
  }
  function polyline(g, dy, dx) {
    g.beginPath();
    for (var i = 0; i < S.n; i++) g[i ? "lineTo" : "moveTo"](S.sx[i] + (dx || 0), S.sy[i] + dy);
  }

  function paintBackground() {
    if (!bg || !S) return;
    var g = bg.g;
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.clearRect(0, 0, bg.c.width, bg.c.height);
    g.setTransform(res, 0, 0, res, 0, 0);
    JOBS[job].draw(g);
    // the joint: a dark gap with a bright lip
    g.lineJoin = "round"; g.lineCap = "round";
    g.strokeStyle = "rgba(20,32,58,.62)"; g.lineWidth = 6;
    polyline(g, 0); if (S.closed) g.closePath(); g.stroke();
    g.strokeStyle = "rgba(255,255,255,.55)"; g.lineWidth = 1.5;
    g.beginPath();
    for (var i = 0; i < S.n; i++) g[i ? "lineTo" : "moveTo"](S.sx[i] + S.nx[i] * 4, S.sy[i] + S.ny[i] * 4);
    if (S.closed) g.closePath();
    g.stroke();
  }

  /* ---------- Caulk rendering ---------- */
  function clearLayers() {
    for (var k in layers) {
      var L = layers[k];
      L.g.setTransform(1, 0, 0, 1, 0, 0);
      L.g.clearRect(0, 0, L.c.width, L.c.height);
      L.g.setTransform(res, 0, 0, res, 0, 0);
    }
  }
  function dot(g, x, y, r, fill) { g.fillStyle = fill; g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill(); }
  function paintStamp(s) {
    dot(layers.shadow.g, s.x, s.y, s.r, COL.ink);
    dot(layers.rim.g, s.x, s.y, s.r, "#d6d2c5");
    dot(layers.body.g, s.x - s.r * 0.07, s.y - s.r * 0.09, s.r * 0.8, "#f8f6f0");
    dot(layers.hi.g, s.x - s.r * 0.26, s.y - s.r * 0.32, s.r * 0.3, "#ffffff");
  }
  function paintRibbon() {
    if (!G) return;
    var n = S.n, last = S.closed ? n : n - 1;
    var sets = [["shadow", 1, COL.ink], ["rim", 1, "#d6d2c5"], ["body", 0.8, "#f8f6f0"]];
    for (var p = 0; p < sets.length; p++) {
      var g = layers[sets[p][0]].g;
      g.strokeStyle = sets[p][2]; g.lineCap = "round";
      for (var i = 0; i < last; i++) {
        var j = (i + 1) % n;
        if (!G.tooled[i] || !G.tooled[j]) continue;
        var wi = widthAt(i), wj = widthAt(j);
        if (wi < 1.5 && wj < 1.5) continue;
        var oi = offsetAt(i), oj = offsetAt(j);
        g.lineWidth = Math.max(1, (wi + wj) / 2 * sets[p][1]);
        g.beginPath();
        g.moveTo(S.sx[i] + S.nx[i] * oi, S.sy[i] + S.ny[i] * oi);
        g.lineTo(S.sx[j] + S.nx[j] * oj, S.sy[j] + S.ny[j] * oj);
        g.stroke();
      }
    }
    // a single smooth highlight streak toward the light (up and left)
    var hg = layers.hi.g;
    hg.strokeStyle = "#ffffff"; hg.lineCap = "round";
    for (i = 0; i < last; i++) {
      j = (i + 1) % n;
      if (!G.tooled[i] || !G.tooled[j]) continue;
      var w = widthAt(i);
      if (w < 3) continue;
      var sgn = (S.nx[i] * -0.5 + S.ny[i] * -0.85) > 0 ? 1 : -1;
      var o1 = offsetAt(i) + sgn * w * 0.2, o2 = offsetAt(j) + sgn * widthAt(j) * 0.2;
      hg.lineWidth = Math.max(1, w * 0.15);
      hg.beginPath();
      hg.moveTo(S.sx[i] + S.nx[i] * o1, S.sy[i] + S.ny[i] * o1);
      hg.lineTo(S.sx[j] + S.nx[j] * o2, S.sy[j] + S.ny[j] * o2);
      hg.stroke();
    }
  }
  function renderCaulk() {
    if (!layers) return;
    clearLayers();
    if (!G) return;
    for (var i = 0; i < G.stamps.length; i++) {
      var s = G.stamps[i];
      if (s.dead) continue;
      if (!s.stray && G.tooled[s.j]) continue;
      paintStamp(s);
    }
    paintRibbon();
    layersDirty = false;
  }

  /* ---------- Deposition ---------- */
  function distribute(j, r, v, sd) {
    var k = Math.min(14, Math.round(r / S.step));
    var per = v / (2 * k + 1);
    for (var m = -k; m <= k; m++) {
      var i = j + m;
      if (S.closed) i = ((i % S.n) + S.n) % S.n;
      else if (i < 0 || i >= S.n) continue;
      G.vol[i] += per;
      G.off[i] += per * sd;
    }
  }
  function addStamp(x, y, r, v, isPool) {
    var near = nearest(x, y);
    var dist = Math.sqrt(near.d2);
    var onSeam = dist <= r * 0.9 + 4;
    var s = G.lastStamp;
    if (isPool && s && s.pool && Math.abs(s.x - x) < 1.2 && Math.abs(s.y - y) < 1.2) {
      s.r = Math.max(s.r, r); s.v += v;
    } else {
      s = { x: x, y: y, r: r, v: v, j: near.j, stray: !onSeam, pool: !!isPool, dead: false };
      G.stamps.push(s);
      G.lastStamp = s;
    }
    if (onSeam) { distribute(near.j, r, v, near.sd); s.stray = false; s.j = near.j; }
    else { G.strayVol += v; }
    G.totalVol += v;
    paintStamp(s);
  }

  function updateCaulking(dt) {
    // pressure
    if (G.trigger && G.tubeLeft > 0) {
      G.triggerTime += dt;
      if (G.triggerTime > START_DELAY) G.pressure += (1 - G.pressure) * (1 - Math.exp(-dt / RISE));
    } else {
      G.pressure *= Math.exp(-dt / (G.released ? RELEASE_TAU : OOZE));
      if (G.pressure < 0.01) { G.pressure = 0; G.released = false; }
    }
    // nozzle position
    var target;
    if (steady) {
      G.steadyS = Math.min(S.len, G.steadyS + STEADY_SPEEDS[steadyLevel] * dt);
      target = pointAt(G.steadyS);
    } else if (pointer.inside || pointer.down) {
      target = { x: pointer.x, y: pointer.y };
    } else {
      target = G.noz || pointAt(0);
    }
    if (JOBS[job].wind) {
      var k = steady ? 0.5 : 1;
      target = { x: target.x + wind.x * k, y: target.y + wind.y * k };
    }
    G.prevNoz = G.noz || target;
    G.noz = target;

    var flow = MAX_FLOW * Math.pow(G.pressure, 1.3);
    var dV = Math.min(flow * dt, G.tubeLeft);
    if (dV <= 0.01) { G.pooling = false; return; }
    if (!G.started) { G.started = true; setBanner(""); announce("Caulk's flowing. Keep moving."); }
    G.tubeLeft -= dV;
    if (!G.trigger) G.oozeVol += dV;

    var ax = G.prevNoz.x, ay = G.prevNoz.y, bx = G.noz.x, by = G.noz.y;
    var ds = Math.hypot(bx - ax, by - ay);
    if (ds > 80) { ax = bx; ay = by; ds = 0; }   // pointer jumped (left and re-entered the canvas): no streak
    if (ds < 0.8) {
      G.pool += dV;
      G.pooling = true;
      if (!G.trigger) G.oozePool += dV;
      var R = Math.cbrt(3 * G.pool / (2 * Math.PI));
      addStamp(bx, by, Math.max(2, R), dV, true);
      G.wEMA += (R * 2 - G.wEMA) * 0.2;
    } else {
      G.pool = 0; G.pooling = false;
      var A = dV / ds;
      var w = Math.max(1.5, Math.min(70, Math.sqrt(8 * A / Math.PI)));
      var r = w / 2;
      var n = Math.max(1, Math.ceil(ds / Math.max(1.2, r * 0.5)));
      for (var i = 1; i <= n; i++) {
        var t = i / n;
        addStamp(ax + (bx - ax) * t, ay + (by - ay) * t, r, dV / n, false);
      }
      G.wEMA += (w - G.wEMA) * 0.15;
    }
    if (G.tubeLeft <= 0 && !G.emptyWarned) {
      G.emptyWarned = true;
      announce("The tube's empty. Press Done caulking to tool what you've got.", true);
    }
  }

  /* ---------- Tooling ---------- */
  function applyTool(px, py) {
    var changed = false;
    var near = nearest(px, py);
    var k = Math.ceil((TOOL_R + 4) / S.step);
    var maxV = volForW(IDEAL_W * 1.25);
    for (var m = -k; m <= k; m++) {
      var i = near.j + m;
      if (S.closed) i = ((i % S.n) + S.n) % S.n;
      else if (i < 0 || i >= S.n) continue;
      var dx = S.sx[i] - px, dy = S.sy[i] - py;
      if (dx * dx + dy * dy > TOOL_R * TOOL_R || G.vol[i] <= 0) continue;
      var o = offsetAt(i);
      var sum = 0, cnt = 0;
      for (var q = -3; q <= 3; q++) {
        var a = i + q;
        if (S.closed) a = ((a % S.n) + S.n) % S.n; else if (a < 0 || a >= S.n) continue;
        sum += G.vol[a]; cnt++;
      }
      var v = G.vol[i] + (sum / cnt - G.vol[i]) * 0.35;
      if (v > maxV) v -= (v - maxV) * 0.4;
      G.vol[i] = v;
      G.off[i] = o * 0.6 * v;
      G.tooled[i] = 1;
      changed = true;
    }
    for (var s = 0; s < G.stamps.length; s++) {
      var st = G.stamps[s];
      if (st.dead || !st.stray) continue;
      var ex = st.x - px, ey = st.y - py, rr = TOOL_R + st.r;
      if (ex * ex + ey * ey <= rr * rr) {
        st.dead = true;
        G.strayVol = Math.max(0, G.strayVol - st.v * 0.5);
        changed = true;
      }
    }
    if (changed) { layersDirty = true; G.toolUsed = true; }
  }
  function updateTooling(dt) {
    var p = null;
    if (keys.space) {
      G.toolS = Math.min(S.len, G.toolS + 260 * dt);
      p = pointAt(G.toolS);
    } else if (pointer.down) {
      p = { x: pointer.x, y: pointer.y };
    } else if (pointer.inside && !steady) {
      G.tool = { x: pointer.x, y: pointer.y, active: false };
      return;
    }
    if (!p) { if (G.tool) G.tool.active = false; return; }
    var prev = G.tool && G.tool.active ? G.tool : p;
    var d = Math.hypot(p.x - prev.x, p.y - prev.y);
    var n = Math.max(1, Math.ceil(d / 5));
    for (var i = 1; i <= n; i++) applyTool(prev.x + (p.x - prev.x) * i / n, prev.y + (p.y - prev.y) * i / n);
    G.tool = { x: p.x, y: p.y, active: true };
  }

  /* ---------- Scoring ---------- */
  function scoreJob() {
    var n = S.n, sealedN = 0, ws = [], cornerN = 0, cornerBad = 0, fat = 0, tooledSealed = 0;
    var offSum = 0, volSum = 0, allW = 0, allN = 0;
    for (var i = 0; i < n; i++) {
      var w = widthAt(i), sealed = isSealed(i);
      if (G.vol[i] > 0) { allW += w; allN++; }
      if (sealed) { sealedN++; ws.push(w); if (G.tooled[i]) tooledSealed++; }
      if (S.corner[i]) { cornerN++; if (!sealed || w < 11) cornerBad++; }
      if (w > IDEAL_W * 1.9) fat++;
      offSum += Math.abs(offsetAt(i)) * G.vol[i]; volSum += G.vol[i];
    }
    var coverage = sealedN / n;
    var mean = 0, sd = 0, dev = 0;
    if (ws.length) {
      for (i = 0; i < ws.length; i++) mean += ws[i];
      mean /= ws.length;
      for (i = 0; i < ws.length; i++) { sd += (ws[i] - mean) * (ws[i] - mean); dev += Math.abs(ws[i] - IDEAL_W) / IDEAL_W; }
      sd = Math.sqrt(sd / ws.length); dev /= ws.length;
    }
    var consistency = ws.length ? clamp01(1 - ((sd / mean) * 1.3 + dev * 0.9)) : 0;
    var strayFrac = G.totalVol ? G.strayVol / G.totalVol : 0;
    var blobFrac = fat / n;
    var offMean = volSum ? offSum / volSum / (IDEAL_W / 2) : 0;
    var neat = G.totalVol ? clamp01(1 - (strayFrac * 2.2 + blobFrac * 1.6 + offMean * 0.35)) : 0;
    var par = S.len / IDEAL_SPEED + 2.5;
    var t = G.elapsed;
    var time = coverage < 0.05 ? 0 : (t <= par ? 1 : clamp01(1 - (t - par) / (2 * par)));
    var toolFrac = sealedN ? tooledSealed / sealedN : 0;
    var toolBonus = Math.round(toolFrac * 10);
    var total = Math.round(Math.min(100, coverage * 35 + consistency * 25 + neat * 20 + time * 10 + toolBonus));

    // start / end blobs
    var edge = Math.max(3, Math.round(n * 0.06)), startBlob = false, endBlob = false;
    for (i = 0; i < edge; i++) {
      if (widthAt(i) > IDEAL_W * 1.9) startBlob = true;
      if (!S.closed && widthAt(n - 1 - i) > IDEAL_W * 1.9) endBlob = true;
      if (S.closed && widthAt(n - 1 - i) > IDEAL_W * 1.9) endBlob = true;
    }
    if (G.oozePool > A_IDEAL * 22) endBlob = true;
    var meanAll = allN ? allW / allN : 0;

    var lesson;
    if (!G.totalVol) lesson = ["Nothing to see here.", "Squeeze the trigger and move along the seam. The bead won't lay itself."];
    else if (strayFrac > 0.35) lesson = ["Most of the caulk missed the joint.", "Ride the tip right in the seam at about 45 degrees. Caulk beside the gap doesn't seal anything."];
    else if (G.tubeLeft <= 0 && coverage < 0.95) lesson = ["You ran out of caulk.", "A fat bead empties the tube fast. Move a little quicker so the bead just fills the joint."];
    else if (cornerN && cornerBad / cornerN > 0.4 && coverage < 0.9) lesson = ["Your bead thinned out at the corners.", "Slow down through corners and keep squeezing. That's where most real leaks start."];
    else if (coverage < 0.8 && meanAll < IDEAL_W * 0.8) lesson = ["Your bead ran thin and skipped.", "Slow your hand down. At steady pressure, speed sets the bead size."];
    else if (coverage < 0.8) lesson = ["You left gaps in the joint.", "A bead only seals where it's continuous. Keep the tip in the seam and keep squeezing through the whole run."];
    else if (endBlob) lesson = ["The gun kept oozing after you let go.", "Release the trigger a beat before the end of the joint, or pop the thumb release. A dripless gun helps too."];
    else if (startBlob) lesson = ["You started on a blob.", "The gun takes a moment to build pressure. Start moving as soon as caulk appears at the tip."];
    else if (blobFrac > 0.02) lesson = ["You parked the nozzle and left a blob.", "Keep your hand moving whenever caulk is flowing. If you need to stop, let off the trigger first."];
    else if (strayFrac > 0.08) lesson = ["Some caulk missed the joint.", "Ride the tip in the seam at about 45 degrees. Caulk beside the joint is just cleanup."];
    else if (meanAll > IDEAL_W * 1.45) lesson = ["That's a lot of caulk.", "Aim for a bead just wider than the gap. Extra caulk makes tooling messier and cures slower."];
    else if (meanAll < IDEAL_W * 0.75) lesson = ["Your bead ran thin.", "It sealed, but only just. Slow your hand a little so the bead fills the joint with a slight crown."];
    else if (!G.toolUsed) lesson = ["Good bead, but you skipped tooling.", "Tooling presses caulk into both sides of the joint for a better bond. Wet finger or tooling spatula, one smooth pass."];
    else if (consistency < 0.6) lesson = ["The bead wandered between thick and thin.", "Lock your wrist and move from the shoulder at one steady pace."];
    else lesson = ["Clean, even, sealed.", "That joint's done for years. Now go do it for real, and read the tube for cure time before you shower or paint."];

    var title = TITLES[TITLES.length - 1][1];
    for (i = 0; i < TITLES.length; i++) if (total >= TITLES[i][0]) { title = TITLES[i][1]; break; }
    return {
      coverage: Math.round(coverage * 100), consistency: Math.round(consistency * 100), neatness: Math.round(neat * 100),
      time: Math.round(time * 100), seconds: t, par: par, toolBonus: toolBonus, total: total, title: title, lesson: lesson
    };
  }

  /* ---------- Storage ---------- */
  function loadBest() {
    try { return JSON.parse(window.localStorage.getItem(STORE_KEY) || "{}") || {}; } catch (e) { return {}; }
  }
  function saveBest(id, total) {
    var best = loadBest();
    var isNew = !best[id] || total > best[id];
    if (isNew) {
      best[id] = total;
      try { window.localStorage.setItem(STORE_KEY, JSON.stringify(best)); } catch (e) { /* storage blocked: keep playing */ }
    }
    return isNew;
  }

  /* ---------- Flow ---------- */
  function announce(msg, showBanner) {
    live.textContent = "";
    setTimeout(function () { live.textContent = msg; }, 30);
    if (showBanner) setBanner(msg);
  }
  function setBanner(msg) {
    if (msg) { banner.textContent = msg; banner.hidden = false; }
    else { banner.hidden = true; banner.textContent = ""; }
  }
  function loadJob(i) {
    job = i;
    if (state !== "caulking" && state !== "tooling") pickWorld();
    S = resample(JOBS[job].seam(W, H));
    G = freshGame();
    G.noz = pointAt(0);
    if (steady) G.steadyS = 0;
    streaks = [];
    layers = null;
    sizeCanvas();
    ui.job.textContent = "Job " + (job + 1) + " of " + JOBS.length + ": " + JOBS[job].name;
    stageEl.classList.remove("is-tooling");
    setBanner("");
    updateHUD(true);
  }
  function crewTip(j) {
    return '<aside class="crew-tip"><img src="' + ROOT + 'assets/img/crew-' + j.crew + '.webp" width="64" height="64" alt="">' +
      '<div><span class="who">' + j.crewName + "'s tip</span><p>" + j.tip + "</p></div></aside>";
  }
  function showOverlay(html, noFocus) {
    overlay.innerHTML = html;
    overlay.hidden = false;
    if (noFocus) return;
    var f = overlay.querySelector("[data-primary]") || overlay.querySelector("button");
    if (f) f.focus({ preventScroll: true });
  }
  function hideOverlay() { overlay.hidden = true; overlay.innerHTML = ""; }

  function showBoard(noFocus) {
    state = "board";
    setControls();
    var best = loadBest(), items = "";
    for (var i = 0; i < JOBS.length; i++) {
      var b = best[JOBS[i].id];
      items += '<li><button type="button" data-action="pick" data-job="' + i + '"' + (i === job ? " data-primary" : "") + '>' +
        '<span class="bm-num">' + (i + 1) + '</span><span class="bm-jname">' + JOBS[i].name + "<small>" + JOBS[i].place + "</small></span>" +
        '<span class="bm-best">' + (b ? "Best " + b : "Not tried") + "</span></button></li>";
    }
    showOverlay('<div class="bm-card" role="dialog" aria-modal="false" aria-labelledby="bm-card-title"><h3 id="bm-card-title">Pick a job</h3>' +
      "<p>Five jobs, easiest first. Each one gets a single tube of caulk.</p><ul class=\"bm-board\">" + items + "</ul></div>", noFocus);
  }
  function showIntro() {
    state = "intro";
    setControls();
    var j = JOBS[job];
    showOverlay('<div class="bm-card" role="dialog" aria-modal="false" aria-labelledby="bm-card-title">' +
      '<h3 id="bm-card-title">Job ' + (job + 1) + ": " + j.name + '</h3><p class="bm-place">' + j.place + "</p><p>" + j.blurb + "</p>" + crewTip(j) +
      '<div class="btn-row"><button type="button" class="btn" data-action="start" data-primary>Start the job</button>' +
      '<button type="button" class="btn-plain" data-action="board">Job board</button></div></div>');
  }
  function startJob() {
    hideOverlay();
    state = "caulking";
    setControls();
    setBanner(steady ? "Hold Space to squeeze. Arrow keys set your hand speed." : "Start at the red dot. Hold to squeeze, then steer along the seam.");
    canvas.focus({ preventScroll: true });
    announce("Job started: " + JOBS[job].name + ".");
  }
  function finishCaulking() {
    if (!G.totalVol) { announce("Squeeze some caulk into the joint first.", true); return; }
    G.trigger = false; G.pressure = 0; keys.space = false;
    state = "tooling";
    G.tool = null; G.toolS = 0;
    stageEl.classList.add("is-tooling");
    setControls();
    setBanner("Optional: tool the bead. Drag along it (or hold Space) to smooth it, then press Done tooling.");
    announce("Caulking done. Tool the bead, or press Done tooling to see your score.");
    canvas.focus({ preventScroll: true });
  }
  function finishJob() {
    if (layersDirty) renderCaulk();
    var sc = scoreJob();
    sessionScores[JOBS[job].id] = sc.total;
    var isNew = saveBest(JOBS[job].id, sc.total);
    state = "score";
    stageEl.classList.remove("is-tooling");
    setBanner("");
    setControls();
    var rows = [["Coverage", sc.coverage, sc.coverage + "%"], ["Consistency", sc.consistency, sc.consistency + "%"],
      ["Neatness", sc.neatness, sc.neatness + "%"], ["Time", sc.time, sc.seconds.toFixed(1) + " s"]];
    var rowHtml = "";
    for (var i = 0; i < rows.length; i++) {
      rowHtml += '<div class="bm-row"><dt>' + rows[i][0] + '</dt><dd class="bm-row-bar"><span style="width:' + rows[i][1] + '%"></span></dd><dd class="bm-row-val">' + rows[i][2] + "</dd></div>";
    }
    rowHtml += '<div class="bm-row"><dt>Tooling</dt><dd class="bm-row-bar"><span style="width:' + sc.toolBonus * 10 + '%"></span></dd><dd class="bm-row-val">+' + sc.toolBonus + "</dd></div>";
    var last = job === JOBS.length - 1;
    showOverlay('<div class="bm-card" role="dialog" aria-modal="false" aria-labelledby="bm-card-title">' +
      '<h3 id="bm-card-title">' + sc.title + '</h3><p class="bm-place">Job ' + (job + 1) + ": " + JOBS[job].name + " (par " + sc.par.toFixed(0) + " s)</p>" +
      '<div class="bm-score-total"><span class="bm-score-num" id="bm-total">' + (reduceMotion ? sc.total : 0) + "<small> / 100</small></span>" +
      '<span class="dollops" style="--score:' + (sc.total / 20).toFixed(2) + '" aria-hidden="true"></span>' +
      (isNew ? ' <span class="bm-newbest">New best</span>' : "") + "</div>" +
      '<dl class="bm-score-rows">' + rowHtml + "</dl>" +
      '<p class="bm-lesson"><strong>' + sc.lesson[0] + "</strong>" + sc.lesson[1] + "</p>" +
      '<div class="btn-row">' +
      (last ? '<button type="button" class="btn" data-action="final" data-primary>See your crew rank</button>'
        : '<button type="button" class="btn" data-action="next" data-primary>Next job</button>') +
      '<button type="button" class="btn-plain" data-action="retry">Try again</button>' +
      '<button type="button" class="btn-plain" data-action="board">Job board</button></div></div>');
    announce(sc.title + ". " + sc.total + " out of 100. " + sc.lesson[0] + " " + sc.lesson[1]);
    if (!reduceMotion) countUp($("bm-total"), sc.total);
  }
  function countUp(el, to) {
    if (!el) return;
    var t0 = performance.now();
    (function tick(now) {
      var k = Math.min(1, (now - t0) / 700);
      el.firstChild.nodeValue = String(Math.round(to * (1 - Math.pow(1 - k, 3))));
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  function showFinal() {
    state = "final";
    setControls();
    var list = "", sum = 0, cnt = 0;
    for (var i = 0; i < JOBS.length; i++) {
      var v = sessionScores[JOBS[i].id];
      list += "<li><span>" + (i + 1) + ". " + JOBS[i].name + "</span><span>" + (v === undefined ? "Skipped" : v) + "</span></li>";
      if (v !== undefined) { sum += v; cnt++; }
    }
    var avg = cnt ? Math.round(sum / JOBS.length) : 0;
    var title = TITLES[TITLES.length - 1][1];
    for (i = 0; i < TITLES.length; i++) if (avg >= TITLES[i][0]) { title = TITLES[i][1]; break; }
    showOverlay('<div class="bm-card" role="dialog" aria-modal="false" aria-labelledby="bm-card-title">' +
      '<h3 id="bm-card-title">Crew rank: ' + title + '</h3><p class="bm-place">Average across all five jobs: ' + avg + " / 100</p>" +
      '<ul class="bm-summary">' + list + "</ul>" +
      "<p>" + (avg >= 90 ? "The crew is officially nervous about their jobs." : avg >= 55 ? "Solid work. Any joint in the house is in safe hands." : "Every Bead Master started out wiping caulk off their elbow. Go again.") + "</p>" +
      '<div class="btn-row"><button type="button" class="btn" data-action="restart-all" data-primary>Play again from job 1</button>' +
      '<button type="button" class="btn-plain" data-action="board">Job board</button></div></div>');
    announce("Crew rank: " + title + ". Average " + avg + " out of 100.");
  }
  function pause() {
    if (state !== "caulking" && state !== "tooling") return;
    pausedFrom = state; state = "paused";
    G.trigger = false; keys.space = false; pointer.down = false;
    setControls();
    showOverlay('<div class="bm-card" role="dialog" aria-modal="false" aria-labelledby="bm-card-title"><h3 id="bm-card-title">Paused</h3>' +
      "<p>Put the gun down. The caulk will wait (this caulk, anyway).</p>" +
      '<div class="btn-row"><button type="button" class="btn" data-action="resume" data-primary>Resume</button>' +
      '<button type="button" class="btn-plain" data-action="retry">Restart job</button>' +
      '<button type="button" class="btn-plain" data-action="board">Job board</button></div></div>');
    announce("Paused.");
  }
  function resume() {
    if (state !== "paused") return;
    state = pausedFrom; pausedFrom = null;
    hideOverlay(); setControls();
    lastT = performance.now();
    canvas.focus({ preventScroll: true });
    announce("Resumed.");
  }

  function setControls() {
    var playing = state === "caulking" || state === "tooling";
    ui.done.disabled = !playing;
    ui.done.textContent = state === "tooling" ? "Done tooling" : "Done caulking";
    ui.done.classList.remove("is-ready");
    ui.release.disabled = state !== "caulking";
    ui.pause.disabled = !(playing || state === "paused");
    ui.pause.textContent = state === "paused" ? "Resume" : "Pause";
    ui.restart.disabled = !(playing || state === "paused" || state === "score");
  }
  function setSteady(on, announceIt) {
    steady = on;
    ui.steady.checked = on;
    ui.speedWrap.hidden = !on;
    if (on && G && S) {
      var j = G.noz ? nearest(G.noz.x, G.noz.y).j : 0;
      G.steadyS = G.started ? j * S.step : 0;
    }
    updateHUD(true);
    if (announceIt) announce(on ? "Steady-hand mode on. The nozzle follows the seam. Arrow keys set hand speed, hold Space to squeeze." : "Steady-hand mode off. Steer with the mouse or your finger.", state === "caulking");
  }

  /* ---------- HUD ---------- */
  function updateHUD(force) {
    if (!G) return;
    ui.time.textContent = G.elapsed.toFixed(1) + " s";
    ui.pressure.style.width = Math.round(G.pressure * 100) + "%";
    var tubeFrac = G.tubeCap ? G.tubeLeft / G.tubeCap : 1;
    ui.tube.style.width = Math.round(tubeFrac * 100) + "%";
    ui.tube.parentNode.classList.toggle("is-low", tubeFrac < 0.2);
    var flowing = G.pressure > 0.05 && state === "caulking";
    var w = G.wEMA;
    ui.needle.style.left = (flowing ? clamp01(w / (IDEAL_W * 2)) * 100 : 0) + "%";
    ui.beadText.textContent = !flowing ? (G.started ? "Idle" : "Waiting") : G.pooling ? "Blob!" : w < 11 ? "Thin" : w <= 26 ? "Just right" : "Fat";
    ui.speed.textContent = steadyLevel + " of 6";
    if (force || state === "caulking" || state === "tooling") {
      var sealed = 0;
      for (var i = 0; i < S.n; i++) if (isSealed(i)) sealed++;
      var pct = Math.round(sealed / S.n * 100);
      ui.sealed.textContent = pct + "%";
      if (state === "caulking" && !G.readyNudged && (pct >= 97 || G.tubeLeft <= 0) && G.pressure === 0) {
        G.readyNudged = true;
        ui.done.classList.add("is-ready");
        if (pct >= 97) announce("Joint sealed. Press Done caulking when you're ready.", true);
      }
    }
  }

  /* ---------- Main loop ---------- */
  function updateWind(t, dt) {
    if (!JOBS[job].wind) { wind.x = wind.y = 0; return; }
    var gust = Math.pow(0.5 + 0.5 * Math.sin(t * 0.55), 2);
    wind.x = 13 * gust * (Math.sin(t * 2.1) + 0.5 * Math.sin(t * 5.3 + 1.3));
    wind.y = 6 * gust * Math.sin(t * 3.4 + 0.4);
    if (reduceMotion) return;
    if (Math.random() < dt * (2 + gust * 6)) streaks.push({ x: -80, y: Math.random() * H, v: 500 + Math.random() * 400, l: 40 + Math.random() * 70 });
    for (var i = streaks.length - 1; i >= 0; i--) {
      streaks[i].x += streaks[i].v * dt;
      if (streaks[i].x > W + 100) streaks.splice(i, 1);
    }
  }

  function drawGun(g, x, y, p) {
    g.save();
    g.translate(x, y);
    g.rotate(-Math.PI / 4);
    g.lineJoin = "round";
    // plunger rod and frame
    g.strokeStyle = "#8a93a6"; g.lineWidth = 5;
    g.beginPath(); g.moveTo(228, 0); g.lineTo(300, 0); g.stroke();
    g.strokeStyle = COL.ink; g.lineWidth = 3;
    g.beginPath(); g.moveTo(70, -21); g.lineTo(232, -21); g.moveTo(70, 21); g.lineTo(232, 21); g.stroke();
    // tube
    g.fillStyle = COL.rosie; g.fillRect(64, -18, 164, 36);
    g.fillStyle = COL.caulk; g.fillRect(108, -18, 66, 36);
    g.fillStyle = COL.ink; g.font = "800 13px 'Libre Franklin', Arial, sans-serif"; g.textBaseline = "middle";
    g.fillText("CAULK", 116, 1);
    g.fillStyle = "rgba(255,255,255,.28)"; g.fillRect(64, -18, 164, 7);
    // nozzle cone, cut at 45 degrees
    g.beginPath(); g.moveTo(1, -2.5); g.lineTo(64, -9); g.lineTo(64, 9); g.lineTo(-1, 2.5); g.closePath();
    g.fillStyle = "rgba(246,244,237,.96)"; g.fill();
    g.strokeStyle = "rgba(20,32,58,.6)"; g.lineWidth = 1.5; g.stroke();
    g.restore();
    if (p > 0.05) {
      dot(g, x, y, 1.5 + p * 3.5, "#d6d2c5");
      dot(g, x - 0.4, y - 0.6, 1 + p * 2.6, "#fbfaf6");
    }
  }

  function draw() {
    if (!layers) return;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(bg.c, 0, 0);
    ctx.globalAlpha = 0.22; ctx.drawImage(layers.shadow.c, 1.6 * res, 2.6 * res);
    ctx.globalAlpha = 1; ctx.drawImage(layers.rim.c, 0, 0); ctx.drawImage(layers.body.c, 0, 0);
    ctx.globalAlpha = 0.9; ctx.drawImage(layers.hi.c, 0, 0);
    ctx.globalAlpha = 1;
    ctx.setTransform(res, 0, 0, res, 0, 0);

    // wind streaks
    if (streaks.length) {
      ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.lineWidth = 2; ctx.lineCap = "round";
      for (var i = 0; i < streaks.length; i++) {
        ctx.beginPath(); ctx.moveTo(streaks[i].x, streaks[i].y); ctx.lineTo(streaks[i].x + streaks[i].l, streaks[i].y); ctx.stroke();
      }
    }
    if (!G) return;
    // start marker and direction
    if (!G.started && (state === "caulking" || state === "intro" || state === "board")) {
      var sx = S.sx[0], sy = S.sy[0], a = Math.atan2(S.ty[0], S.tx[0]);
      dot(ctx, sx, sy, 11, "#fff"); dot(ctx, sx, sy, 8, COL.rosie);
      ctx.save(); ctx.translate(sx, sy); ctx.rotate(a);
      ctx.strokeStyle = COL.rosie; ctx.lineWidth = 4; ctx.lineCap = "round"; ctx.lineJoin = "round";
      ctx.beginPath(); ctx.moveTo(26, -8); ctx.lineTo(36, 0); ctx.lineTo(26, 8); ctx.stroke();
      ctx.restore();
      ctx.fillStyle = COL.ink; ctx.font = "800 15px 'Libre Franklin', Arial, sans-serif"; ctx.textBaseline = "alphabetic";
      ctx.fillText("Start", sx - 18, sy - 20);
    }
    if (!S.closed && state === "caulking") {
      var ex = S.sx[S.n - 1], ey = S.sy[S.n - 1];
      ctx.strokeStyle = COL.rosie; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(ex, ey, 9, 0, Math.PI * 2); ctx.stroke();
    }
    if (state === "caulking" || state === "paused" && pausedFrom === "caulking") {
      if (G.noz) drawGun(ctx, G.noz.x, G.noz.y, G.pressure);
      if (pointer.down && pointer.type === "touch" && !steady) {
        ctx.strokeStyle = "rgba(20,32,58,.35)"; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.arc(pointer.fx, pointer.fy, 18, 0, Math.PI * 2); ctx.stroke();
      }
    } else if ((state === "tooling" || state === "paused" && pausedFrom === "tooling") && G.tool) {
      ctx.fillStyle = G.tool.active ? "rgba(31,60,136,.28)" : "rgba(31,60,136,.14)";
      ctx.strokeStyle = COL.denim; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(G.tool.x, G.tool.y, TOOL_R, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      dot(ctx, G.tool.x - 5, G.tool.y - 6, 4, "rgba(255,255,255,.7)");
    }
  }

  function frame(now) {
    var dt = Math.min(0.033, Math.max(0, (now - lastT) / 1000));
    lastT = now;
    tick(dt, now);
    requestAnimationFrame(frame);
  }
  function tick(dt, now) {
    clock += dt;
    if (state !== "paused") updateWind(clock, dt);
    if (state === "caulking") {
      updateCaulking(dt);
      if (G.started) G.elapsed += dt;
    } else if (state === "tooling") {
      updateTooling(dt);
    }
    if (layersDirty) renderCaulk();
    draw();
    if (now - hudT > 90) { hudT = now; updateHUD(false); }
  }

  /* ---------- Input ---------- */
  function toWorld(e) {
    var r = canvas.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width * W;
    var y = (e.clientY - r.top) / r.height * H;
    pointer.fx = x; pointer.fy = y;
    if (pointer.type === "touch") y -= 56 * W / r.width;   // keep the nozzle visible above the finger
    pointer.x = x; pointer.y = y;
  }
  canvas.addEventListener("pointerdown", function (e) {
    if (e.button !== 0 && e.pointerType === "mouse") return;
    pointer.type = e.pointerType || "mouse";
    toWorld(e);
    pointer.down = true; pointer.inside = true;
    try { canvas.setPointerCapture(e.pointerId); } catch (err) { /* ignore */ }
    if (document.activeElement !== canvas) canvas.focus({ preventScroll: true });
    if (state === "caulking") {
      if (!steady && G.noz) G.noz = { x: pointer.x, y: pointer.y };
      G.trigger = true; G.triggerTime = 0;
    }
    if (state === "tooling") G.tool = null;
    e.preventDefault();
  });
  canvas.addEventListener("pointermove", function (e) {
    pointer.type = e.pointerType || pointer.type;
    if (pointer.type === "touch" && !pointer.down) return;
    toWorld(e);
    pointer.inside = true;
  });
  function pointerUp() {
    if (!pointer.down) return;
    pointer.down = false;
    if (state === "caulking" && !keys.space) {
      G.trigger = false;
      // A finger can't keep steering after it lifts, so touch play gets a dripless gun.
      if (pointer.type === "touch") G.released = true;
    }
    if (state === "tooling" && G.tool) G.tool.active = false;
  }
  canvas.addEventListener("pointerup", pointerUp);
  canvas.addEventListener("pointercancel", pointerUp);
  canvas.addEventListener("pointerleave", function () { if (!pointer.down) pointer.inside = false; });
  canvas.addEventListener("contextmenu", function (e) { e.preventDefault(); });

  function popRelease() {
    if (state !== "caulking") return;
    G.trigger = false; keys.space = false; G.released = true;
    announce("Pressure released.");
  }

  canvas.addEventListener("keydown", function (e) {
    var k = e.key;
    if (k === " " || k === "Spacebar") {
      e.preventDefault();
      if (e.repeat) return;
      keys.space = true;
      if (state === "caulking") { G.trigger = true; G.triggerTime = 0; }
      if (state === "tooling") { if (!G.tool || !G.tool.active) G.tool = null; }
    } else if (k === "ArrowRight" || k === "ArrowUp" || k === "ArrowLeft" || k === "ArrowDown") {
      if (state !== "caulking") return;
      e.preventDefault();
      if (!steady) setSteady(true, true);
      var up = k === "ArrowRight" || k === "ArrowUp";
      steadyLevel = Math.max(0, Math.min(6, steadyLevel + (up ? 1 : -1)));
      updateHUD(true);
    } else if (k === "r" || k === "R") {
      popRelease();
    } else if (k === "Enter") {
      e.preventDefault();
      if (state === "caulking") finishCaulking();
      else if (state === "tooling") finishJob();
    }
  });
  canvas.addEventListener("keyup", function (e) {
    if (e.key === " " || e.key === "Spacebar") {
      keys.space = false;
      if (state === "caulking" && !pointer.down) G.trigger = false;
      if (state === "tooling" && G.tool) G.tool.active = false;
    }
  });
  canvas.addEventListener("blur", function () {
    keys.space = false;
    if (state === "caulking" && G && !pointer.down) G.trigger = false;
  });
  app.addEventListener("keydown", function (e) {
    if (e.key === "Escape") {
      if (state === "caulking" || state === "tooling") { e.preventDefault(); pause(); }
      else if (state === "paused") { e.preventDefault(); resume(); }
    }
  });

  overlay.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("[data-action]") : null;
    if (!b) return;
    var a = b.getAttribute("data-action");
    if (a === "pick") { loadJob(+b.getAttribute("data-job")); showIntro(); }
    else if (a === "start") startJob();
    else if (a === "board") { loadJob(job); showBoard(); }
    else if (a === "next") { loadJob(Math.min(JOBS.length - 1, job + 1)); showIntro(); }
    else if (a === "retry") { loadJob(job); startJob(); }
    else if (a === "resume") resume();
    else if (a === "final") showFinal();
    else if (a === "restart-all") { sessionScores = {}; loadJob(0); showIntro(); }
  });

  ui.done.addEventListener("click", function () {
    if (state === "caulking") finishCaulking();
    else if (state === "tooling") finishJob();
  });
  ui.release.addEventListener("click", popRelease);
  ui.pause.addEventListener("click", function () { if (state === "paused") resume(); else pause(); });
  ui.restart.addEventListener("click", function () { loadJob(job); startJob(); });
  ui.jobs.addEventListener("click", function () { loadJob(job); showBoard(); });
  ui.steady.addEventListener("change", function () {
    setSteady(ui.steady.checked, true);
    if (state === "caulking" || state === "tooling") canvas.focus({ preventScroll: true });
  });

  document.addEventListener("visibilitychange", function () {
    if (document.hidden && (state === "caulking" || state === "tooling")) pause();
  });

  var resizeTimer = null;
  window.addEventListener("resize", function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function () {
      if (state === "board" || state === "intro" || state === "score" || state === "final") {
        var oldW = W;
        pickWorld();
        if (W !== oldW && (state === "board" || state === "intro")) {
          S = resample(JOBS[job].seam(W, H)); G = freshGame(); G.noz = pointAt(0); layers = null;
        } else { W = oldW; H = oldW === 1000 ? 580 : 640; }
      }
      sizeCanvas();
    }, 120);
  });

  // Test hook: lets automated checks drive the game without real pointer hardware.
  window.BeadMaster = {
    state: function () { return state; },
    job: function () { return job; },
    world: function () { return { W: W, H: H }; },
    seamPoint: function (s) { return pointAt(s); },
    seamLength: function () { return S.len; },
    score: function () { return scoreJob(); },
    step: function (dt, n) { for (var i = 0; i < (n || 1); i++) tick(dt, performance.now() + 1000); }
  };

  /* ---------- Boot ---------- */
  loadJob(0);
  showBoard(true);
  // Fonts load after first paint; repaint the canvas text once they're ready.
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(function () { paintBackground(); });
  lastT = performance.now();
  requestAnimationFrame(frame);
})();
