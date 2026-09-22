/* Caulk by type: dim the spec sheets that don't match the chosen properties. */
(function () {
  "use strict";
  var buttons = Array.prototype.slice.call(document.querySelectorAll(".type-filter [data-prop]"));
  var sheets = Array.prototype.slice.call(document.querySelectorAll(".type-sheet"));
  var count = document.getElementById("type-filter-count");
  if (!buttons.length) return;
  function update() {
    var want = buttons.filter(function (b) { return b.getAttribute("aria-pressed") === "true"; })
      .map(function (b) { return b.getAttribute("data-prop"); });
    var n = 0;
    sheets.forEach(function (s) {
      var props = (s.getAttribute("data-props") || "").split(" ");
      var ok = want.every(function (w) { return props.indexOf(w) !== -1; });
      s.classList.toggle("is-dim", !ok);
      if (ok) n++;
    });
    count.textContent = want.length ? n + " of " + sheets.length + " formulations match." : "";
  }
  buttons.forEach(function (b) {
    b.addEventListener("click", function () {
      b.setAttribute("aria-pressed", b.getAttribute("aria-pressed") === "true" ? "false" : "true");
      update();
    });
  });
})();
