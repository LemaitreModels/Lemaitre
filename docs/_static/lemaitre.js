/* Title marks for the Lemaitre docs sites: in the sidebar brand, the mobile header and the
   page's first heading, a model name's leading "LM" is set in vermilion
   (LMID-conformally-flat-puncture), and in "LemaîtreModels" the L, the M and the circumflex
   are vermilion (the circumflex over a dotless i). Only the first text node of each title is
   touched, so the heading's anchor link is left alone. */
(function () {
  "use strict";
  const red = (t, cls) => { const s = document.createElement("span"); s.className = cls || "lm-red"; s.textContent = t; return s; };
  function mark(el) {
    const node = Array.from(el.childNodes).find((n) => n.nodeType === 3 && n.textContent.trim());
    if (!node) return;
    const text = node.textContent, lead = text.match(/^\s*/)[0], body = text.slice(lead.length);
    const frag = document.createDocumentFragment();
    const m = body.match(/^Lema[i\u00EE]treModels/);
    if (m) {
      frag.append(lead, red("L"), "ema", red("\u0131", "lm-ihat"), "tre", red("M"), "odels" + body.slice(m[0].length));
    } else if (/^LM[A-Z-]/.test(body)) {
      frag.append(lead, red("LM"), body.slice(2));
    } else return;
    node.replaceWith(frag);
  }
  function init() {
    document.querySelectorAll(".sidebar-brand-text, .header-center a, .header-center .brand, article h1").forEach(mark);
  }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
