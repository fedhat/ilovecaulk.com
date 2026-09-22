/* I Love Caulk — quiz engine for "Which caulk are you?" (personality) and "Caulk IQ" (trivia).
   Questions and results live in the page's HTML; this script only runs the flow. */
(function () {
  "use strict";

  var root = document.querySelector("[data-quiz]");
  if (!root) return;

  var mode = root.getAttribute("data-quiz");
  var qs = Array.prototype.slice.call(root.querySelectorAll(".quiz-q"));
  var meter = root.querySelector(".quiz-meter");
  var bead = root.querySelector(".quiz-progress-bead");
  var countEl = root.querySelector(".quiz-count");
  var scoreEl = root.querySelector(".quiz-score");
  var nav = root.querySelector(".quiz-nav");
  var backBtn = root.querySelector("[data-quiz-back]");
  var total = qs.length;
  var at = 0;
  var answers = [];
  var busy = false;

  function $all(sel, el) { return Array.prototype.slice.call((el || root).querySelectorAll(sel)); }
  function heading(q) { return q.querySelector(".quiz-q-text"); }
  function focus(el) { if (!el) return; try { el.focus({ preventScroll: true }); } catch (e) { el.focus(); } }
  function scrollToQuiz() {
    var top = root.getBoundingClientRect().top + window.pageYOffset - 96;
    if (Math.abs(window.pageYOffset - top) > 40 && root.getBoundingClientRect().top < 0) window.scrollTo(0, top);
  }

  function progress(done) {
    if (bead) bead.style.width = Math.round((done / total) * 100) + "%";
    if (countEl) countEl.textContent = done >= total ? "All done" : "Question " + (at + 1) + " of " + total;
  }

  function show(i, moveFocus) {
    at = i;
    qs.forEach(function (q, j) { q.hidden = j !== i; });
    progress(mode === "trivia" ? answers.length : i);
    if (backBtn) backBtn.hidden = mode !== "personality" || i === 0;
    if (moveFocus) { scrollToQuiz(); focus(heading(qs[i])); }
  }

  // ---------- personality ----------
  function tally() {
    var totals = {};
    answers.forEach(function (a) {
      Object.keys(a.w).forEach(function (t) { totals[t] = (totals[t] || 0) + a.w[t]; });
    });
    var best = Math.max.apply(null, Object.keys(totals).map(function (t) { return totals[t]; }));
    var tied = Object.keys(totals).filter(function (t) { return totals[t] === best; });
    if (tied.length > 1) {
      // Break ties with the most recent answer that leaned toward one of them.
      for (var i = answers.length - 1; i >= 0; i--) {
        var w = answers[i].w, pick = null, top = 0;
        tied.forEach(function (t) { if ((w[t] || 0) > top) { top = w[t]; pick = t; } });
        if (pick) return pick;
      }
    }
    return tied[0];
  }

  function showResult() {
    var type = tally();
    qs.forEach(function (q) { q.hidden = true; });
    if (meter) meter.hidden = true;
    if (nav) nav.hidden = true;
    var card = null;
    $all(".quiz-result").forEach(function (r) {
      var match = r.getAttribute("data-type") === type;
      r.hidden = !match;
      if (match) card = r;
    });
    if (card) {
      var status = card.querySelector(".quiz-copy-status");
      if (status) status.textContent = "";
      var fb = card.querySelector(".quiz-copy-fallback");
      if (fb) fb.remove();
      scrollToQuiz();
      focus(card);
    }
    try { localStorage.setItem("ilc-which-caulk", type); } catch (e) { /* not essential */ }
  }

  function copyResult(card, btn) {
    var name = card.querySelector("h2").textContent.trim();
    var tag = (card.querySelector(".quiz-result-tagline") || {}).textContent || "";
    var url = location.href.split("#")[0];
    var text = "I'm " + name + " (" + tag.trim().replace(/\.$/, "") + ") on the I Love Caulk \"Which caulk are you?\" quiz. Find yours: " + url;
    var status = card.querySelector(".quiz-copy-status");
    function ok() { status.textContent = "Copied. Paste it anywhere you like to brag."; }
    function fallback() {
      var ta = card.querySelector(".quiz-copy-fallback");
      if (!ta) {
        ta = document.createElement("textarea");
        ta.className = "input quiz-copy-fallback";
        ta.readOnly = true;
        ta.rows = 3;
        ta.setAttribute("aria-label", "Your result, ready to copy");
        btn.closest(".btn-row").insertAdjacentElement("afterend", ta);
      }
      ta.value = text;
      ta.focus();
      ta.select();
      var copied = false;
      try { copied = document.execCommand("copy"); } catch (e) { copied = false; }
      status.textContent = copied ? "Copied. Paste it anywhere you like to brag." : "Your result is selected below. Copy it with Ctrl+C (or long-press on a phone).";
    }
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(ok, fallback);
    } else {
      fallback();
    }
  }

  // ---------- trivia ----------
  var praise = ["Correct!", "Nailed it.", "Smooth as a tooled bead.", "Right on.", "Correct. Rosie approves."];

  function answerTrivia(q, btn) {
    var opts = $all(".quiz-option", q);
    var picked = opts.indexOf(btn);
    var right = +q.getAttribute("data-answer");
    var isRight = picked === right;
    opts.forEach(function (o, i) {
      o.disabled = true;
      if (i === right) {
        o.classList.add("is-right");
        o.insertAdjacentHTML("beforeend", '<span class="quiz-mark">' + (isRight ? "Your answer" : "Correct answer") + "</span>");
      } else if (i === picked) {
        o.classList.add("is-wrong");
        o.insertAdjacentHTML("beforeend", '<span class="quiz-mark">Your answer</span>');
      }
    });
    answers.push({ q: q, picked: picked, right: right, ok: isRight });
    var fb = q.querySelector(".quiz-feedback");
    var verdict = fb.querySelector(".quiz-verdict");
    verdict.textContent = isRight
      ? praise[answers.length % praise.length]
      : "Not quite. The answer is: " + opts[right].firstChild.textContent.trim();
    fb.classList.toggle("is-wrong", !isRight);
    fb.hidden = false;
    var next = fb.querySelector("[data-next]");
    if (next && answers.length >= total) next.textContent = "See my score";
    if (scoreEl) scoreEl.textContent = "Score: " + answers.filter(function (a) { return a.ok; }).length;
    progress(answers.length);
    focus(verdict);
  }

  function showFinal() {
    var final = root.querySelector(".quiz-final");
    var score = answers.filter(function (a) { return a.ok; }).length;
    qs.forEach(function (q) { q.hidden = true; });
    if (meter) meter.hidden = true;
    final.querySelector("[data-score]").textContent = score;
    final.querySelector("[data-total]").textContent = total;
    var band = null;
    $all(".quiz-bands li").forEach(function (li) {
      if (score >= +li.getAttribute("data-min")) band = li;
    });
    if (band) {
      final.querySelector(".quiz-title").textContent = band.getAttribute("data-title");
      final.querySelector(".quiz-title-blurb").textContent = band.textContent.trim();
    }
    var list = final.querySelector(".quiz-review");
    list.innerHTML = "";
    answers.forEach(function (a) {
      var opts = $all(".quiz-option", a.q);
      var li = document.createElement("li");
      li.className = a.ok ? "is-right" : "is-wrong";
      var mark = document.createElement("span");
      mark.className = "mark";
      mark.setAttribute("aria-hidden", "true");
      mark.textContent = a.ok ? "✓" : "✕";
      var body = document.createElement("span");
      var qt = document.createElement("strong");
      qt.textContent = heading(a.q).lastElementChild.textContent;
      var ans = document.createElement("span");
      ans.className = "ans";
      ans.textContent = a.ok
        ? "You said: " + opts[a.right].firstChild.textContent.trim()
        : "You said: " + opts[a.picked].firstChild.textContent.trim() + ". The answer: " + opts[a.right].firstChild.textContent.trim();
      var sr = document.createElement("span");
      sr.className = "visually-hidden";
      sr.textContent = a.ok ? "Correct. " : "Incorrect. ";
      body.appendChild(sr);
      body.appendChild(qt);
      body.appendChild(ans);
      li.appendChild(mark);
      li.appendChild(body);
      list.appendChild(li);
    });
    final.hidden = false;
    scrollToQuiz();
    focus(final);
    try {
      var best = +(localStorage.getItem("ilc-caulk-iq-best") || 0);
      if (score > best) localStorage.setItem("ilc-caulk-iq-best", String(score));
      var bestEl = final.querySelector("[data-best]");
      if (bestEl) bestEl.textContent = score > best ? "That's your best score yet." : "Your best so far: " + Math.max(best, score) + " out of " + total + ".";
    } catch (e) { /* not essential */ }
  }

  // ---------- restart ----------
  function restart() {
    answers = [];
    busy = false;
    $all(".quiz-result, .quiz-final").forEach(function (r) { r.hidden = true; });
    if (meter) meter.hidden = false;
    if (nav) nav.hidden = false;
    $all(".quiz-option").forEach(function (o) {
      o.disabled = false;
      o.classList.remove("is-picked", "is-right", "is-wrong");
      var m = o.querySelector(".quiz-mark");
      if (m) m.remove();
    });
    $all(".quiz-feedback").forEach(function (f) { f.hidden = true; f.classList.remove("is-wrong"); });
    $all("[data-next]").forEach(function (b) { b.textContent = b.getAttribute("data-label") || "Next question"; });
    if (scoreEl) scoreEl.textContent = "Score: 0";
    show(0, true);
  }

  // ---------- events ----------
  root.addEventListener("click", function (e) {
    var opt = e.target.closest(".quiz-option");
    if (opt && !opt.disabled) {
      var q = opt.closest(".quiz-q");
      if (mode === "trivia") { answerTrivia(q, opt); return; }
      if (busy) return;
      busy = true;
      $all(".quiz-option", q).forEach(function (o) { o.classList.toggle("is-picked", o === opt); });
      var w = {};
      try { w = JSON.parse(opt.getAttribute("data-w") || "{}"); } catch (err) { w = {}; }
      answers[at] = { w: w };
      answers.length = at + 1;
      setTimeout(function () {
        busy = false;
        if (at + 1 < total) show(at + 1, true);
        else { progress(total); showResult(); }
      }, 260);
      return;
    }
    var next = e.target.closest("[data-next]");
    if (next) {
      if (answers.length >= total) showFinal();
      else show(at + 1, true);
      return;
    }
    if (e.target.closest("[data-quiz-back]")) {
      if (at > 0) {
        answers.length = at - 1;
        show(at - 1, true);
      }
      return;
    }
    if (e.target.closest("[data-restart]")) { restart(); return; }
    var copy = e.target.closest("[data-copy]");
    if (copy) copyResult(copy.closest(".quiz-result"), copy);
  });

  $all("[data-next]").forEach(function (b) { b.setAttribute("data-label", b.textContent); });
  root.classList.add("is-ready");
  if (scoreEl) scoreEl.textContent = "Score: 0";
  show(0, false);
})();
