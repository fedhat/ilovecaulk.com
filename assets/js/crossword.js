/* I Love Caulk — crossword player. Data comes from crossword-data.js. */
(function () {
  "use strict";

  var DATA = window.CAULK_CROSSWORDS;
  var root = document.querySelector("[data-crossword]");
  if (!DATA || !root) return;

  var SENTINEL = "_";
  var boardEl = root.querySelector(".cw-board");
  var gridEl = root.querySelector(".cw-grid");
  var input = root.querySelector(".cw-input");
  var clueBar = root.querySelector(".cw-cluebar-text");
  var clueBarNum = root.querySelector(".cw-cluebar-num");
  var lists = { across: root.querySelector("[data-list=across]"), down: root.querySelector("[data-list=down]") };
  var timerEl = root.querySelector(".cw-timer-value");
  var statusEl = root.querySelector(".cw-status");
  var donePanel = root.querySelector(".cw-done");
  var doneText = root.querySelector(".cw-done-text");
  var blurbEl = root.querySelector(".cw-blurb");
  var clearBtn = root.querySelector("[data-action=clear]");
  var switchBtns = Array.prototype.slice.call(root.querySelectorAll(".cw-switch [data-puzzle]"));
  var nextBtn = root.querySelector("[data-switch]");

  var S = null; // state for the current puzzle

  function key(r, c) { return r + "," + c; }
  function dirName(d) { return d === "across" ? "Across" : "Down"; }
  function has(cell, d) { return cell && cell.words[d] !== undefined; }
  function other(d) { return d === "across" ? "down" : "across"; }
  function fmt(sec) {
    var m = Math.floor(sec / 60), s = sec % 60;
    return m + ":" + (s < 10 ? "0" : "") + s;
  }

  // ---------- storage ----------
  function storeKey(k) { return "ilc-crossword-" + k; }
  function signature(p) {
    return p.rows + "x" + p.cols + ":" + p.entries.map(function (e) { return e.answer + e.row + e.col + e.dir[0]; }).join("|");
  }
  function save() {
    if (!S) return;
    var letters = {}, revealed = [];
    Object.keys(S.cells).forEach(function (k) {
      var c = S.cells[k];
      if (c.letter) letters[k] = c.letter;
      if (c.revealed) revealed.push(k);
    });
    try {
      localStorage.setItem(storeKey(S.key), JSON.stringify({
        sig: S.sig, letters: letters, revealed: revealed, seconds: S.seconds, done: S.done
      }));
    } catch (e) { /* storage unavailable: progress just won't persist */ }
  }
  function restore() {
    var saved = null;
    try { saved = JSON.parse(localStorage.getItem(storeKey(S.key)) || "null"); } catch (e) { saved = null; }
    if (!saved || saved.sig !== S.sig) return;
    Object.keys(saved.letters || {}).forEach(function (k) {
      if (S.cells[k]) S.cells[k].letter = String(saved.letters[k]).slice(0, 1).toUpperCase();
    });
    (saved.revealed || []).forEach(function (k) { if (S.cells[k]) S.cells[k].revealed = true; });
    S.seconds = saved.seconds | 0;
    S.done = !!saved.done;
  }

  // ---------- timer ----------
  function tick() {
    if (document.hidden || S.done) return;
    S.seconds++;
    timerEl.textContent = fmt(S.seconds);
    if (S.seconds % 5 === 0) save();
  }
  function startTimer() {
    if (S.timer || S.done) return;
    S.timer = setInterval(tick, 1000);
  }
  function stopTimer() {
    if (S && S.timer) { clearInterval(S.timer); S.timer = null; }
  }

  // ---------- build ----------
  function load(k) {
    if (S) { save(); stopTimer(); }
    if (!DATA[k]) k = "apprentice";
    var p = DATA[k];
    S = { key: k, p: p, sig: signature(p), cells: {}, entries: [], cur: null, dir: "across", seconds: 0, timer: null, done: false };
    lastEntryIdx = -1;

    p.entries.forEach(function (e, i) {
      var entry = { idx: i, num: e.num, dir: e.dir, answer: e.answer, clue: e.clue, cells: [] };
      for (var j = 0; j < e.answer.length; j++) {
        var r = e.row + (e.dir === "down" ? j : 0);
        var c = e.col + (e.dir === "across" ? j : 0);
        var kk = key(r, c);
        var cell = S.cells[kk] || (S.cells[kk] = { r: r, c: c, k: kk, answer: e.answer[j], letter: "", words: {}, pos: {}, num: 0 });
        cell.words[e.dir] = i;
        cell.pos[e.dir] = j + 1;
        if (j === 0) cell.num = e.num;
        entry.cells.push(cell);
      }
      S.entries.push(entry);
    });
    restore();

    // grid
    gridEl.innerHTML = "";
    gridEl.style.setProperty("--cols", p.cols);
    boardEl.style.setProperty("--cols", p.cols);
    gridEl.setAttribute("aria-rowcount", p.rows);
    gridEl.setAttribute("aria-colcount", p.cols);
    gridEl.classList.remove("is-complete");
    var frag = document.createDocumentFragment();
    for (var r = 0; r < p.rows; r++) {
      var row = document.createElement("div");
      row.className = "cw-row";
      row.setAttribute("role", "row");
      for (var c = 0; c < p.cols; c++) {
        var cell = S.cells[key(r, c)];
        if (!cell) {
          var blank = document.createElement("div");
          blank.className = "cw-blank";
          blank.setAttribute("role", "presentation");
          row.appendChild(blank);
          continue;
        }
        var b = document.createElement("button");
        b.type = "button";
        b.className = "cw-cell";
        b.tabIndex = -1;
        b.setAttribute("role", "gridcell");
        b.dataset.k = cell.k;
        if (cell.num) {
          var n = document.createElement("span");
          n.className = "cw-num";
          n.textContent = cell.num;
          n.setAttribute("aria-hidden", "true");
          b.appendChild(n);
        }
        var l = document.createElement("span");
        l.className = "cw-letter";
        l.setAttribute("aria-hidden", "true");
        b.appendChild(l);
        cell.el = b;
        cell.letterEl = l;
        row.appendChild(b);
        drawCell(cell);
      }
      frag.appendChild(row);
    }
    gridEl.appendChild(frag);

    // clues
    ["across", "down"].forEach(function (d) {
      var ol = lists[d];
      ol.innerHTML = "";
      S.entries.forEach(function (e) {
        if (e.dir !== d) return;
        var li = document.createElement("li");
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cw-clue";
        btn.dataset.idx = e.idx;
        btn.innerHTML = '<span class="cw-clue-num"></span><span class="cw-clue-text"></span><span class="visually-hidden"> (' + e.answer.length + " letters)</span>";
        btn.querySelector(".cw-clue-num").textContent = e.num;
        btn.querySelector(".cw-clue-text").textContent = e.clue + " (" + e.answer.length + ")";
        li.appendChild(btn);
        ol.appendChild(li);
        e.clueEl = btn;
      });
    });
    S.entries.forEach(markFilled);

    // chrome
    blurbEl.textContent = p.blurb;
    timerEl.textContent = fmt(S.seconds);
    statusEl.textContent = "";
    switchBtns.forEach(function (b) { b.setAttribute("aria-pressed", b.dataset.puzzle === k ? "true" : "false"); });
    resetClear();
    if (S.done) celebrate(false); else donePanel.hidden = true;

    var first = S.entries[0];
    select(firstEmpty(first) || first.cells[0], first.dir, false);
  }

  // ---------- rendering ----------
  function drawCell(cell) {
    cell.letterEl.textContent = cell.letter;
    cell.el.classList.toggle("is-wrong", !!cell.wrong);
    cell.el.classList.toggle("is-revealed", !!cell.revealed);
    var parts = [];
    ["across", "down"].forEach(function (d) {
      if (has(cell, d)) parts.push(S.entries[cell.words[d]].num + " " + dirName(d) + ", letter " + cell.pos[d]);
    });
    var label = parts.join("; ") + ". " + (cell.letter ? "Letter " + cell.letter : "Empty");
    if (cell.revealed) label += ", revealed";
    if (cell.wrong) label += ", incorrect";
    cell.el.setAttribute("aria-label", label);
  }

  function markFilled(e) {
    var full = e.cells.every(function (c) { return c.letter; });
    if (e.clueEl) e.clueEl.classList.toggle("is-filled", full);
  }

  var lastEntryIdx = -1;
  function paint() {
    var entry = currentEntry();
    Object.keys(S.cells).forEach(function (k) {
      var c = S.cells[k];
      c.el.classList.remove("is-word", "is-cur");
    });
    entry.cells.forEach(function (c) { c.el.classList.add("is-word"); });
    S.cur.el.classList.add("is-cur");

    S.entries.forEach(function (e) { e.clueEl.classList.remove("is-active", "is-cross"); });
    entry.clueEl.classList.add("is-active");
    var od = other(S.dir);
    if (has(S.cur, od)) S.entries[S.cur.words[od]].clueEl.classList.add("is-cross");

    if (entry.idx !== lastEntryIdx) {
      lastEntryIdx = entry.idx;
      clueBarNum.textContent = entry.num + " " + dirName(entry.dir);
      clueBar.textContent = entry.clue + " (" + entry.answer.length + ")";
      scrollClue(entry.clueEl);
    }
    if (has(S.cur, od)) scrollClue(S.entries[S.cur.words[od]].clueEl);
    placeInput();
    keepCellVisible();
  }

  function scrollClue(el) {
    var box = el.closest(".cw-clue-scroll");
    if (!box || box.scrollHeight <= box.clientHeight + 2) return;
    var top = el.offsetTop - box.offsetTop;
    if (top < box.scrollTop || top + el.offsetHeight > box.scrollTop + box.clientHeight) {
      box.scrollTop = Math.max(0, top - box.clientHeight / 3);
    }
  }

  function placeInput() {
    var el = S.cur.el;
    input.style.left = el.offsetLeft + "px";
    input.style.top = el.offsetTop + "px";
    input.style.width = el.offsetWidth + "px";
    input.style.height = el.offsetHeight + "px";
  }

  function keepCellVisible() {
    var el = S.cur.el;
    if (boardEl.scrollWidth <= boardEl.clientWidth) return;
    var left = el.offsetLeft, right = left + el.offsetWidth;
    if (left < boardEl.scrollLeft + 8) boardEl.scrollLeft = Math.max(0, left - 24);
    else if (right > boardEl.scrollLeft + boardEl.clientWidth - 8) boardEl.scrollLeft = right - boardEl.clientWidth + 24;
  }

  // ---------- selection & movement ----------
  function currentEntry() { return S.entries[S.cur.words[S.dir]]; }
  function firstEmpty(entry) {
    for (var i = 0; i < entry.cells.length; i++) if (!entry.cells[i].letter) return entry.cells[i];
    return null;
  }

  function select(cell, dir, focus) {
    if (!has(cell, dir)) dir = other(dir);
    S.cur = cell;
    S.dir = dir;
    paint();
    if (focus !== false) focusInput();
  }

  function focusInput() {
    resetSentinel();
    try { input.focus({ preventScroll: true }); } catch (e) { input.focus(); }
  }

  function resetSentinel() {
    input.value = SENTINEL;
    try { input.setSelectionRange(1, 1); } catch (e) { /* some input types don't support it */ }
  }

  function move(dr, dc) {
    var want = dc !== 0 ? "across" : "down";
    if (S.dir !== want && has(S.cur, want)) { S.dir = want; paint(); return; }
    var r = S.cur.r + dr, c = S.cur.c + dc;
    while (r >= 0 && c >= 0 && r < S.p.rows && c < S.p.cols) {
      var cell = S.cells[key(r, c)];
      if (cell) { select(cell, want); return; }
      r += dr; c += dc;
    }
  }

  function toggleDir() {
    if (has(S.cur, other(S.dir))) { S.dir = other(S.dir); paint(); }
  }

  function jumpEntry(step) {
    var i = currentEntry().idx + step;
    if (i < 0 || i >= S.entries.length) return false;
    var e = S.entries[i];
    select(firstEmpty(e) || e.cells[0], e.dir);
    return true;
  }

  // ---------- editing ----------
  function type(ch) {
    ch = ch.toUpperCase();
    var cell = S.cur;
    if (!cell.revealed) {
      cell.letter = ch;
      cell.wrong = false;
      drawCell(cell);
      if (!S.done) startTimer();
    }
    var entry = currentEntry();
    markFilledAround(cell);
    var at = entry.cells.indexOf(cell);
    if (at < entry.cells.length - 1) select(entry.cells[at + 1], S.dir);
    afterChange();
  }

  function backspace() {
    var cell = S.cur;
    if (cell.letter && !cell.revealed) {
      cell.letter = "";
      cell.wrong = false;
      drawCell(cell);
    } else {
      var entry = currentEntry();
      var at = entry.cells.indexOf(cell);
      if (at > 0) {
        var prev = entry.cells[at - 1];
        if (!prev.revealed) { prev.letter = ""; prev.wrong = false; drawCell(prev); }
        select(prev, S.dir);
      }
    }
    markFilledAround(cell);
    afterChange();
  }

  function clearCell() {
    if (!S.cur.revealed) { S.cur.letter = ""; S.cur.wrong = false; drawCell(S.cur); }
    markFilledAround(S.cur);
    afterChange();
  }

  function markFilledAround(cell) {
    ["across", "down"].forEach(function (d) { if (has(cell, d)) markFilled(S.entries[cell.words[d]]); });
  }

  function allCells() { return Object.keys(S.cells).map(function (k) { return S.cells[k]; }); }

  function afterChange() {
    save();
    if (S.done) return;
    var cells = allCells();
    var filled = cells.every(function (c) { return c.letter; });
    if (!filled) return;
    var right = cells.every(function (c) { return c.letter === c.answer; });
    if (right) {
      S.done = true;
      stopTimer();
      save();
      celebrate(true);
    } else {
      say("Every square is filled, but something isn't sealing yet. Try Check puzzle.");
    }
  }

  function celebrate(fresh) {
    var revealed = allCells().filter(function (c) { return c.revealed; }).length;
    var msg = "You finished the " + S.p.title + " puzzle in " + fmt(S.seconds) + ".";
    if (revealed) msg += " (" + revealed + " revealed " + (revealed === 1 ? "letter" : "letters") + ". We won't tell.)";
    else msg += " No reveals. That's a professional-grade bead.";
    doneText.textContent = msg;
    var otherKey = Object.keys(DATA).filter(function (k) { return k !== S.key; })[0];
    if (nextBtn && otherKey) {
      nextBtn.dataset.switch = otherKey;
      nextBtn.textContent = "Try the " + DATA[otherKey].title + " puzzle";
    }
    donePanel.hidden = false;
    gridEl.classList.add("is-complete");
    if (fresh) say("Puzzle complete! " + msg);
  }

  function say(msg) {
    statusEl.textContent = "";
    // re-set a moment later so screen readers announce repeated messages
    setTimeout(function () { statusEl.textContent = msg; }, 60);
  }

  // ---------- check / reveal / clear ----------
  function check(cells) {
    var wrong = 0, checked = 0;
    cells.forEach(function (c) {
      if (!c.letter) return;
      checked++;
      c.wrong = c.letter !== c.answer;
      if (c.wrong) wrong++;
      drawCell(c);
    });
    if (!checked) say("Nothing to check yet. Fill in a few letters first.");
    else if (wrong) say(wrong + (wrong === 1 ? " letter needs" : " letters need") + " another look. They're marked in red.");
    else say("Everything you've filled in there is correct.");
    save();
  }

  function reveal(cells) {
    var n = 0;
    cells.forEach(function (c) {
      if (c.letter !== c.answer) { c.letter = c.answer; c.revealed = true; n++; }
      c.wrong = false;
      drawCell(c);
    });
    S.entries.forEach(markFilled);
    say(n ? "Revealed " + n + (n === 1 ? " letter." : " letters.") : "Those were already right.");
    afterChange();
  }

  var clearTimer = null;
  function resetClear() {
    clearBtn.textContent = "Clear";
    clearBtn.classList.remove("is-armed");
    if (clearTimer) { clearTimeout(clearTimer); clearTimer = null; }
  }

  function clearAll() {
    if (!clearBtn.classList.contains("is-armed")) {
      clearBtn.textContent = "Clear everything?";
      clearBtn.classList.add("is-armed");
      clearTimer = setTimeout(resetClear, 4000);
      return;
    }
    resetClear();
    stopTimer();
    allCells().forEach(function (c) { c.letter = ""; c.revealed = false; c.wrong = false; drawCell(c); });
    S.entries.forEach(markFilled);
    S.seconds = 0;
    S.done = false;
    timerEl.textContent = fmt(0);
    donePanel.hidden = true;
    gridEl.classList.remove("is-complete");
    save();
    var first = S.entries[0];
    select(first.cells[0], first.dir);
    say("Grid cleared. Fresh tube, fresh start.");
  }

  // ---------- events ----------
  gridEl.addEventListener("mousedown", function (e) {
    if (e.target.closest(".cw-cell")) e.preventDefault(); // keep focus on the input
  });
  gridEl.addEventListener("click", function (e) {
    var b = e.target.closest(".cw-cell");
    if (!b) return;
    var cell = S.cells[b.dataset.k];
    if (cell === S.cur) { toggleDir(); focusInput(); }
    else select(cell, S.dir);
  });

  ["across", "down"].forEach(function (d) {
    lists[d].addEventListener("click", function (e) {
      var b = e.target.closest(".cw-clue");
      if (!b) return;
      var entry = S.entries[+b.dataset.idx];
      select(firstEmpty(entry) || entry.cells[0], entry.dir);
    });
  });

  input.addEventListener("keydown", function (e) {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    var k = e.key;
    if (k === "ArrowLeft") { e.preventDefault(); move(0, -1); }
    else if (k === "ArrowRight") { e.preventDefault(); move(0, 1); }
    else if (k === "ArrowUp") { e.preventDefault(); move(-1, 0); }
    else if (k === "ArrowDown") { e.preventDefault(); move(1, 0); }
    else if (k === " " || k === "Spacebar") { e.preventDefault(); toggleDir(); }
    else if (k === "Tab") { if (jumpEntry(e.shiftKey ? -1 : 1)) e.preventDefault(); }
    else if (k === "Enter") { e.preventDefault(); jumpEntry(1); }
    else if (k === "Backspace") { e.preventDefault(); backspace(); }
    else if (k === "Delete") { e.preventDefault(); clearCell(); }
    else if (k === "Escape") { e.preventDefault(); input.blur(); root.querySelector("[data-action=check-word]").focus(); }
    else if (/^[a-zA-Z]$/.test(k)) { e.preventDefault(); type(k); }
  });

  // Phone keyboards often skip keydown details; read what landed in the input instead.
  input.addEventListener("input", function () {
    var v = input.value;
    if (v.length < SENTINEL.length) backspace();
    else {
      var letters = v.replace(/[^a-z]/gi, "");
      if (letters) type(letters.slice(-1));
    }
    resetSentinel();
  });
  input.addEventListener("focus", function () { gridEl.classList.add("has-focus"); });
  input.addEventListener("blur", function () { gridEl.classList.remove("has-focus"); });

  root.addEventListener("click", function (e) {
    var b = e.target.closest("[data-action]");
    if (!b || !S) return;
    var a = b.dataset.action;
    if (a !== "clear") resetClear();
    if (a === "check-letter") check([S.cur]);
    else if (a === "check-word") check(currentEntry().cells);
    else if (a === "check-puzzle") check(allCells());
    else if (a === "reveal-word") reveal(currentEntry().cells);
    else if (a === "reveal-puzzle") reveal(allCells());
    else if (a === "clear") clearAll();
  });

  function goTo(k) {
    if (S && S.key === k) return;
    load(k);
    try { history.replaceState(null, "", "#" + k); } catch (e) { location.hash = k; }
  }
  switchBtns.forEach(function (b) {
    b.addEventListener("click", function () { goTo(b.dataset.puzzle); });
  });
  if (nextBtn) nextBtn.addEventListener("click", function () {
    goTo(nextBtn.dataset.switch);
    focusInput();
  });

  window.addEventListener("resize", function () { if (S) placeInput(); });
  document.addEventListener("visibilitychange", function () { if (document.hidden) save(); });
  window.addEventListener("pagehide", save);

  root.classList.add("is-ready");
  load((location.hash || "").replace("#", "") || "apprentice");
})();
