/* Interactive inspiral, merger and ringdown: the see-through sheet of figure 08 with the binary
   shrinking under radiation reaction, merging and ringing down, and the strain h+ plotted below
   as it is emitted. One slider (mass ratio); the run restarts by itself. Mounts into every element with
   class "lm-imr". No dependencies; colours from the Lemaitre tokens (--lm-ink, --lm-rule).

   Everything is schematic but physically shaped, in geometric units with total mass M = 1:
   - inspiral: leading-order (quadrupole) radiation reaction, Peters 1964,
       d(t)^4 = d0^4 - (256/5) eta t,   orbital phase phi = (d0^(5/2) - d^(5/2)) / (32 eta),
     Kepler frequency omega = d^(-3/2), strain amplitude 4 eta / d, GW phase 2 phi;
   - merger at d = D_MERGE, where the punctures close in over T_PLUNGE;
   - ringdown: one damped l = m = 2 mode, M omega ~ 0.53, tau ~ 11.7 M (Berti, Cardoso & Will 2006,
     Schwarzschild values), with the remnant mass M_f ~ 1 - 0.19 eta (rough, for the frequency only).
   The ripples on the sheet are the emitted strain at the retarded time t - r / V_WAVE, with a
   visual wave speed far below c so that the wavelength fits on the sheet. */
(function () {
  "use strict";

  function token(el, name, fallback) {
    const v = getComputedStyle(el).getPropertyValue(name).trim();
    return v || fallback;
  }

  const D0 = 10, D_MERGE = 2.2, T_PLUNGE = 5, V_WAVE = 0.09, L_SHEET = 12, Z_HOLE = -2.2;

  // The whole history for one mass ratio, as functions of the time t since the start.
  function model(q) {
    const eta = q / ((1 + q) * (1 + q));
    const tM = (5 / (256 * eta)) * (D0 ** 4 - D_MERGE ** 4);          // time of merger
    const phiM = (D0 ** 2.5 - D_MERGE ** 2.5) / (32 * eta);
    const Mf = 1 - 0.19 * eta, wQ = 0.53 / Mf, tau = 11.7 * Mf;
    const wM = D_MERGE ** -1.5, aM = (4 * eta) / D_MERGE;
    // end once the last ringdown wave has crossed the sheet, so the final frame is at rest
    const tEnd = tM + T_PLUNGE + 7 * tau + L_SHEET / V_WAVE;
    function sep(t) {                                                  // coordinate separation
      if (t <= tM) return (D0 ** 4 - (256 / 5) * eta * t) ** 0.25;   // t < 0: the inspiral before the start
      return D_MERGE * Math.max(0, 1 - (t - tM) / T_PLUNGE);
    }
    function phase(t) {                                                // orbital phase
      if (t <= tM) return (D0 ** 2.5 - sep(t) ** 2.5) / (32 * eta);
      if (t <= tM + T_PLUNGE) return phiM + wM * (t - tM) + 0.5 * (wQ / 2 - wM) * (t - tM) ** 2 / T_PLUNGE;
      return phiM + (wM + wQ / 2) * T_PLUNGE / 2 + (wQ / 2) * (t - tM - T_PLUNGE);
    }
    function amp(t) {                                                  // strain amplitude
      if (t <= tM) return (4 * eta) / sep(t);
      const s = t - tM;
      if (s <= T_PLUNGE) return aM * (1 + 0.35 * Math.sin((Math.PI * s) / T_PLUNGE));
      return aM * Math.exp(-(s - T_PLUNGE) / tau);
    }
    const strain = (t, off) => amp(t) * Math.cos(2 * (phase(t) + off));
    function timeAtSep(d) { return (5 / (256 * eta)) * (D0 ** 4 - d ** 4); }
    return { q, eta, tM, tEnd, sep, phase, amp, strain, timeAtSep };
  }

  function mount(root) {
    root.innerHTML = "";
    const canvas = document.createElement("canvas");
    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", "Two black holes spiral together and merge; their gravitational-wave strain is plotted below");
    const controls = document.createElement("div");
    controls.className = "lm-imr-controls";
    root.append(canvas, controls);

    let m = model(1.7), t = 0, off = 0;
    const still = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let running = !still;

    const lab = document.createElement("label");
    const name = document.createElement("span"); name.textContent = "mass ratio";
    const input = document.createElement("input");
    Object.assign(input, { type: "range", min: 1, max: 4, step: 0.05, value: m.q });
    const out = document.createElement("output"); out.textContent = "q = " + m.q.toFixed(2);
    // Moving the slider keeps the state: the same separation in the inspiral (the same time
    // after merger later), and the same orbital angle, so the picture stays continuous.
    input.addEventListener("input", () => {
      const angle = m.phase(t) + off, n = model(+input.value);
      if (t <= m.tM) t = n.timeAtSep(m.sep(t));
      else t = n.tM + (t - m.tM);
      off = angle - n.phase(t);
      m = n;
      out.textContent = "q = " + m.q.toFixed(2);
    });
    lab.append(name, input, out);
    controls.append(lab);
    root.lmImrSeek = (frac) => { t = frac * m.tEnd; running = false; };

    const ctx = canvas.getContext("2d");
    let W = 0, H = 0, H1 = 0, dpr = 1;
    function resize() {
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      W = root.clientWidth;
      H1 = Math.round(Math.min(W * 0.42, 420));                       // the sheet
      H = H1 + Math.round(Math.min(W * 0.2, 170));                    // plus the strain panel
      canvas.width = W * dpr; canvas.height = H * dpr;
      canvas.style.width = W + "px"; canvas.style.height = H + "px";
    }
    new ResizeObserver(resize).observe(root);
    resize();

    const L = L_SHEET, DX = 0.33, TILT = 0.4, ZMIN = -5.4;
    const PLAY_SECONDS = 18;                                           // one full run, start to end
    let last = performance.now(), holdUntil = 0;

    function frame(now) {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      if (holdUntil && now >= holdUntil) { holdUntil = 0; t = 0; off = 0; }
      if (running && !holdUntil) {
        // Faster through the slow early inspiral, slower around the merger.
        const near = Math.exp(-Math.abs(t - m.tM) / 40);
        t += dt * (m.tEnd / PLAY_SECONDS) * (1 - 0.8 * near);
        if (t >= m.tEnd) { t = m.tEnd; holdUntil = now + 2000; }      // hold the last frame, then restart
      }
      const m1 = m.q / (1 + m.q), m2 = 1 / (1 + m.q);
      const d = m.sep(t), ph = m.phase(t) + off;
      const r1 = d * m2, r2 = d * m1, c = Math.cos(ph), sn = Math.sin(ph);
      const x1 = r1 * c, y1 = r1 * sn, x2 = -r2 * c, y2 = -r2 * sn;
      const merged = t > m.tM + T_PLUNGE;

      // Height: -(psi - 1) of the Brill–Lindquist conformal factor, cut off at ZMIN, plus the
      // emitted strain at the retarded time, rotating as the l = m = 2 pattern does.
      const inner = Math.max(d, 3.5);
      function z(x, y) {
        const a = Math.hypot(x - x1, y - y1, 0.05), b = Math.hypot(x - x2, y - y2, 0.05);
        const psi = 1 + m1 / (2 * a) + m2 / (2 * b);
        const r = Math.hypot(x, y), tr = t - r / V_WAVE;
        const env = Math.min(1, Math.max(0, (r - 0.6 * inner) / (0.6 * inner)));
        const ripple = env * 1.5 * m.amp(tr) * Math.cos(2 * Math.atan2(y, x) - 2 * (m.phase(tr) + off)) * Math.sqrt(6 / (r + 3));
        return Math.max(ZMIN, -4.5 * (psi - 1)) + ripple;
      }

      const ink = token(root, "--lm-ink", "#1f1e1c");
      const rule = token(root, "--lm-rule", "#dcd8cc");
      const ct = Math.cos(TILT), st = Math.sin(TILT);
      const scale = W / (2 * L) * 0.97, cam = 60;
      function proj(x, y, zz) {
        const up = y * st + zz * ct, depth = -y * ct + zz * st;
        const f = cam / (cam - depth);
        return [W / 2 + x * scale * f, H1 * 0.42 - up * scale * f, depth];
      }

      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      ctx.lineJoin = "round";
      ctx.strokeStyle = ink;
      ctx.lineWidth = 0.6;

      // The see-through sheet, as in figure 08: a disc, grid turned 45 degrees, fading to the rim.
      const r45 = Math.SQRT1_2, step = 0.08, NB = 48, bands = [];
      // ...and into one of NZ bands by depth, so the lines also fade down each throat.
      const NZ = 16;
      for (let k = 0; k < NB * NZ; k++) bands.push(new Path2D());
      const zBand = (zz) => Math.min(NZ - 1, Math.max(0, Math.floor((-zz / -ZMIN) * NZ)));
      const zAlpha = (j) => { const s = Math.min(1, Math.max(0, ((j + 0.5) / NZ - 0.4) / 0.6)); return 1 - s * s * (3 - 2 * s); };
      const alphaOf = (k) => {
        const s = Math.min(1, Math.max(0, ((k + 0.5) / NB - 0.55) / 0.45));
        return 0.6 * (1 - s * s * (3 - 2 * s));
      };
      for (let pass = 0; pass < 2; pass++) {
        for (let u = -L; u <= L + 1e-9; u += DX) {
          const half = Math.sqrt(Math.max(0, L * L - u * u));
          if (half < step) continue;
          let prev = null;
          for (let v = -half; v <= half + 1e-9; v += step) {
            const vv = Math.min(v, half), a = pass ? u : vv, b = pass ? vv : u, x = (a - b) * r45, y = (a + b) * r45;
            const zz = z(x, y), p = proj(x, y, zz), r = Math.hypot(a, b);
            if (prev) {
              const k = Math.min(NB - 1, Math.floor(((r + prev[2]) / 2 / L) * NB));
              const kb = k * NZ + zBand((zz + prev[3]) / 2);
              bands[kb].moveTo(prev[0], prev[1]); bands[kb].lineTo(p[0], p[1]);
            }
            prev = [p[0], p[1], r, zz];
          }
        }
      }
      for (let k = 0; k < NB; k++) for (let j = 0; j < NZ; j++) {
        ctx.globalAlpha = alphaOf(k) * zAlpha(j); ctx.stroke(bands[k * NZ + j]);
      }
      ctx.globalAlpha = 1;

      // Label, top right above the sheet's rim, as in figure 10.
      ctx.font = "italic 15px " + token(root, "--lm-font-text", "system-ui, sans-serif");   // as the axis labels
      ctx.fillStyle = ink; ctx.textAlign = "right"; ctx.textBaseline = "alphabetic";
      ctx.fillText("AI\u2019s impression", W * 0.93, H1 * 0.42 - 0.12 * W);

      // Horizons: two black discs, then one for the remnant (it grows in during the plunge), all at
      // one fixed height so nothing drops as the funnels deepen at merger.
      function hole(hx, hy, hm) {
        const p = proj(hx, hy, Z_HOLE);
        const R = hm * scale * 1.15;
        ctx.beginPath(); ctx.arc(p[0], p[1], R, 0, 2 * Math.PI);
        ctx.fillStyle = "#000000"; ctx.fill();
        ctx.strokeStyle = rule; ctx.lineWidth = 0.8; ctx.stroke();
      }
      if (!merged) {
        [[x1, y1, m1 / 2], [x2, y2, m2 / 2]].sort((u, v) => v[1] - u[1]).forEach((h) => hole(...h));
      }
      if (t > m.tM) {
        const s = Math.min(1, (t - m.tM) / T_PLUNGE);
        hole(0, 0, (0.5 - 0.06 * m.eta) * s * s);
      }

      // Strain panel: h+ against time, drawn up to now, on an axis fixed for this mass ratio.
      const top = H1 + 4, ph2 = H - top - 14, mid = top + ph2 / 2;
      const left = W * 0.08, right = W * 0.94;
      const aMax = (4 * m.eta) / D_MERGE * 1.4;
      const X = (tt) => left + ((right - left) * tt) / m.tEnd;
      const Y = (h) => mid - (h / aMax) * (ph2 / 2);
      // Axes: strain up the left and time along zero strain, each with a small arrowhead.
      const font = token(root, "--lm-font-text", "system-ui, sans-serif");
      ctx.fillStyle = ink; ctx.strokeStyle = ink; ctx.lineWidth = 0.8;
      ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left, top + ph2); ctx.moveTo(left, mid); ctx.lineTo(right, mid); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(left, top); ctx.lineTo(left - 3.5, top + 7); ctx.lineTo(left + 3.5, top + 7); ctx.closePath(); ctx.fill();
      ctx.beginPath(); ctx.moveTo(right, mid); ctx.lineTo(right - 7, mid - 3.5); ctx.lineTo(right - 7, mid + 3.5); ctx.closePath(); ctx.fill();
      ctx.font = "15px " + font;
      ctx.save(); ctx.translate(left - 12, mid); ctx.rotate(-Math.PI / 2);
      ctx.textAlign = "center"; ctx.textBaseline = "bottom"; ctx.fillText("GW strain", 0, 0); ctx.restore();
      ctx.textAlign = "right"; ctx.textBaseline = "top"; ctx.fillText("time", right, mid + 6);
      ctx.textAlign = "left"; ctx.textBaseline = "alphabetic";
      const n = Math.max(2, Math.ceil((X(t) - left) / 1.2));
      ctx.beginPath();
      for (let i = 0; i <= n; i++) {
        const tt = (t * i) / n, px = X(tt), py = Y(m.strain(tt, off));
        i ? ctx.lineTo(px, py) : ctx.moveTo(px, py);
      }
      ctx.lineWidth = 1.1; ctx.strokeStyle = ink; ctx.stroke();

      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  function init() { document.querySelectorAll(".lm-imr").forEach(mount); }
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
