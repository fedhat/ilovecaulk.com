/* I Love Caulk — shared behaviour. Classic script (works from file:// too). */
(function () {
  "use strict";

  // Mobile nav
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    toggle.addEventListener("click", function () {
      var open = nav.classList.toggle("is-open");
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && nav.classList.contains("is-open")) {
        nav.classList.remove("is-open");
        toggle.setAttribute("aria-expanded", "false");
        toggle.focus();
      }
    });
  }

  // Filterable lists: <input data-filter="#list"> hides children of #list whose text doesn't match.
  document.querySelectorAll("[data-filter]").forEach(function (input) {
    var list = document.querySelector(input.getAttribute("data-filter"));
    if (!list) return;
    var items = Array.prototype.slice.call(list.querySelectorAll("[data-filter-item]"));
    var empty = document.querySelector(input.getAttribute("data-filter-empty") || "#none");
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase();
      var shown = 0;
      items.forEach(function (el) {
        var hit = !q || el.textContent.toLowerCase().indexOf(q) !== -1;
        el.hidden = !hit;
        if (hit) shown++;
      });
      if (empty) empty.hidden = shown !== 0;
      list.querySelectorAll("[data-filter-group]").forEach(function (g) {
        g.hidden = !g.querySelector("[data-filter-item]:not([hidden])");
      });
    });
  });

  // Current year in footer
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
