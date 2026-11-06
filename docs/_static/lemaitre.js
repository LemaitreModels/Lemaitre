/* Title marks for the Lemaitre docs sites: in the sidebar brand, the mobile header and the
   page's first heading, a model name's leading "LM" is set in vermilion
   (LMID-conformally-flat-puncture), and "LemaitreModels" gets its circumflex back,
   LemaîtreModels, with the accent in vermilion. Only the first text node of each title is
   touched, so the heading's anchor link is left alone. */
(function () {
  "use strict";
  function mark(el) {
    const node = Array.from(el.childNodes).find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!node) return;
    const text = node.textContent, lead = text.match(/^\s*/)[0], body = text.slice(lead.length);
    const frag = document.createDocumentFragment();
    if (body.startsWith("LemaitreModels")) {
      const hat = document.createElement("span");
      hat.className = "lm-ihat"; hat.textContent = "ı";          // dotless i
      frag.append(lead + "Lema", hat, "treModels" + body.slice("LemaitreModels".length));
    } else if (/^LM[A-Z-]/.test(body)) {
      const red = document.createElement("span");
      red.className = "lm-red"; red.textContent = "LM";
      frag.append(lead, red, body.slice(2));
    } else return;
    node.replaceWith(frag);
  }
  function init() {
    document.querySelectorAll(".sidebar-brand-text, .header-center a, article h1").forEach(mark);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
