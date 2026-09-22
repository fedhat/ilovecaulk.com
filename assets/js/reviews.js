/* Reviews page: filter cards by job. With JS off, the filter bar stays hidden and every review shows. */
(function () {
  "use strict";
  var bar = document.querySelector("[data-review-filter]");
  if (!bar) return;
  var cards = Array.prototype.slice.call(document.querySelectorAll(".review[data-tags]"));
  var groups = Array.prototype.slice.call(document.querySelectorAll("[data-review-group]"));
  var buttons = Array.prototype.slice.call(bar.querySelectorAll("button[data-tag]"));
  var count = document.getElementById("review-count");
  var none = document.getElementById("review-none");
  var total = cards.length;

  function apply(tag) {
    var shown = 0;
    cards.forEach(function (card) {
      var hit = tag === "all" || card.getAttribute("data-tags").split(" ").indexOf(tag) !== -1;
      card.hidden = !hit;
      if (hit) shown++;
    });
    groups.forEach(function (g) {
      g.hidden = !g.querySelector(".review:not([hidden])");
    });
    buttons.forEach(function (b) {
      b.setAttribute("aria-pressed", b.getAttribute("data-tag") === tag ? "true" : "false");
    });
    if (none) none.hidden = shown !== 0;
    if (count) {
      count.textContent = tag === "all"
        ? "Showing all " + total + " reviews"
        : "Showing " + shown + " of " + total + " reviews";
    }
  }

  bar.hidden = false;
  bar.addEventListener("click", function (e) {
    var b = e.target.closest ? e.target.closest("button[data-tag]") : null;
    if (b) apply(b.getAttribute("data-tag"));
  });

  // Arriving at #some-review while a filter hides it: show everything.
  window.addEventListener("hashchange", function () {
    var t = document.getElementById(location.hash.slice(1));
    if (t && t.classList.contains("review") && t.hidden) {
      apply("all");
      t.scrollIntoView();
    }
  });
})();
