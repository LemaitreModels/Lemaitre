/* Interactive binary black hole: an ink-on-paper wireframe of the Brill–Lindquist conformal
   factor on the orbital plane, with schematic quadrupole ripples outside the binary.
   Mounts into every element with class "lm-binary". No dependencies. Colours come from the
   Lemaitre style tokens (--lm-ink, --lm-rule) when present. */
(function () {
  "use strict";

  function token(el, name, fallback) {
    const v = getComputedStyle(el).getPropertyValue(name).trim();
    return v || fallback;
  }

  function mount(root) {
    root.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Two black holes orbiting on a curved grid of space");
    const controls = document.createElement("div");
    controls.className = "lm-binary-controls";
    root.append(canvas, controls);

    const P = { q: 2.0, d: 5.0 };
    const sliders = [
      ["q", "mass ratio", 1, 4, 0.05, (v) => "q = " + v.toFixed(2)],
      ["d", "separation", 3, 10, 0.1, (v) => "d = " + v.toFixed(1) + " M"],
    ];
    for (const [key, label, lo, hi, step, fmt] of sliders) {
      const lab = document.createElement("label");
      const name = document.createElement("span");
      name.textContent = label;
      const input = document.createElement("input");
      Object.assign(input, { type: "range", min: lo, max: hi, step: step, value: P[key] });
      const out = document.createElement("output");
      out.textContent = fmt(P[key]);
      input.addEventListener("input", () => { P[key] = +input.value; out.textContent = fmt(P[key]); });
      lab.append(name, input, out);
      controls.append(lab);
    }

    // Visitors who ask for reduced motion get a still frame that still follows the sliders.
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = root.clientWidth;
      H = Math.round(Math.min(W * 0.42, 420));
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
    }
    new ResizeObserver(resize).observe(root);
    resize();

    const L = 12;                  // radius of the sheet in units of M
    const DX = 0.33;                // grid spacing in units of M
    const TILT = 0.25;             // elevation of the viewer above the orbital plane, radians
    const ZMIN = -5.4;             // depth at which the funnels are cut off
    let phase = 0, last = performance.now();

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      const M = 1, m1 = P.q / (1 + P.q), m2 = 1 / (1 + P.q);
      const omega = Math.sqrt(M / (P.d * P.d * P.d));       // Kepler, geometric units
      if (!still) phase += dt * omega * 14;                  // 14 M of coordinate time per second
      const r1 = P.d * m2, r2 = P.d * m1;                    // distances from the centre of mass
      const c = Math.cos(phase), sn = Math.sin(phase);
      const x1 = r1 * c, y1 = r1 * sn, x2 = -r2 * c, y2 = -r2 * sn;
      const kr = 2 * Math.PI / (2.2 * P.d);                  // schematic: radial wavelength shortened

      // Height: -(psi - 1) of the Brill–Lindquist conformal factor, which diverges at each
      // puncture (cut off at ZMIN), plus a schematic l = m = 2 ripple outside the binary.
      function z(x, y) {
        const a = Math.hypot(x - x1, y - y1, 0.05), b = Math.hypot(x - x2, y - y2, 0.05);
        const psi = 1 + m1 / (2 * a) + m2 / (2 * b);
        const r = Math.hypot(x, y);
        const env = Math.min(1, Math.max(0, (r - 0.6 * P.d) / (0.6 * P.d)));
        const ripple = env * 0.4 * (6 / P.d) * Math.cos(2 * (Math.atan2(y, x) - phase) + kr * r) * Math.sqrt(6 / (r + 3));
        return Math.max(ZMIN, -4.5 * (psi - 1)) + ripple;
      }

      const ink = token(root, "--lm-ink", "#1f1e1c");
      const rule = token(root, "--lm-rule", "#dcd8cc");

      const ct = Math.cos(TILT), st = Math.sin(TILT);
      const scale = W / (2 * L) * 0.97;
      const cam = 60;                                         // perspective distance, units of M
      function proj(x, y, zz) {
        const up = y * st + zz * ct, depth = -y * ct + zz * st;   // depth > 0 is nearer the viewer
        const f = cam / (cam - depth);
        return [W / 2 + x * scale * f, H * 0.4 - up * scale * f, depth];
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);                             // the page shows through
      ctx.lineJoin = "round";
      ctx.strokeStyle = ink;
      ctx.lineWidth = 0.6;

      // A see-through sheet cut to a disc: grid lines only, finely sampled so the funnels stay
      // sharp. Each line is the chord of the disc at its offset, fading towards the rim. The grid
      // is turned 45 degrees about the vertical.
      const r45 = Math.SQRT1_2;
      // Each segment goes into one of NB alpha bands by its distance from the centre, so the sheet
      // fades out towards its rim (and the funnels, near the centre, stay fully drawn).
      const step = 0.08, NB = 48, bands = [];
      for (let k = 0; k < NB; k++) bands.push(new Path2D());
      const alphaOf = (k) => {                                // flat to 55 % of the radius, then a smoothstep to 0
        const t = Math.min(1, Math.max(0, ((k + 0.5) / NB - 0.55) / 0.45));
        return 0.6 * (1 - t * t * (3 - 2 * t));
      };
      for (let pass = 0; pass < 2; pass++) {
        for (let u = -L; u <= L + 1e-9; u += DX) {
          const half = Math.sqrt(Math.max(0, L * L - u * u));
          if (half < step) continue;
          let prev = null;
          for (let v = -half; v <= half + 1e-9; v += step) {
            const vv = Math.min(v, half), a = pass ? u : vv, b = pass ? vv : u, x = (a - b) * r45, y = (a + b) * r45;
            const q = proj(x, y, z(x, y));
            const r = Math.hypot(a, b);
            if (prev) {
              const k = Math.min(NB - 1, Math.floor(((r + prev[2]) / 2 / L) * NB));
              bands[k].moveTo(prev[0], prev[1]); bands[k].lineTo(q[0], q[1]);
            }
            prev = [q[0], q[1], r];
          }
        }
      }
      for (let k = 0; k < NB; k++) { ctx.globalAlpha = alphaOf(k); ctx.stroke(bands[k]); }
      ctx.globalAlpha = 1;

      // Horizons: black balls of the isolated isotropic radius m_i/2, sitting in their funnels,
      // drawn far one first. The rim keeps them visible in dark mode.
      const holes = [[x1, y1, m1 / 2], [x2, y2, m2 / 2]].sort((u, v) => v[1] - u[1]);
      for (const [hx, hy, hm] of holes) {
        const zc = z(hx + hm * 2.1, hy);
        const p = proj(hx, hy, zc);
        const R = hm * scale * 1.7;
        ctx.beginPath();
        ctx.arc(p[0], p[1], R, 0, 2 * Math.PI);
        ctx.fillStyle = "#000000"; ctx.fill();
        ctx.strokeStyle = rule; ctx.lineWidth = 0.8; ctx.stroke();
      }

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function init() { document.querySelectorAll(".lm-binary").forEach(mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
