/*
 * Minimal SVG charts with keyed, animated updates. No dependencies.
 * Elements persist between renders; numeric attributes tween to their new values
 * (ease-out cubic). Honours prefers-reduced-motion.
 */
(function () {
  const NS = "http://www.w3.org/2000/svg";
  const reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const DUR = 520;
  const ease = t => 1 - Math.pow(1 - t, 3);

  function el(tag, attrs, parent) {
    const n = document.createElementNS(NS, tag);
    if (attrs) for (const [k, v] of Object.entries(attrs)) setA(n, k, v);
    if (parent) parent.appendChild(n);
    return n;
  }

  /* CSS variables only resolve reliably through style, not SVG presentation attributes. */
  const STYLE_KEYS = { fill: "fill", stroke: "stroke", "font-family": "fontFamily" };
  function setA(n, k, v) {
    if (STYLE_KEYS[k]) n.style[STYLE_KEYS[k]] = v;
    else n.setAttribute(k, v);
  }

  /* Tween numeric attributes. `from` defaults to the last value set through animate(). */
  function animate(node, to, opts = {}) {
    const dur = reduceMotion ? 0 : (opts.dur ?? DUR);
    const delay = reduceMotion ? 0 : (opts.delay || 0);
    node._v = node._v || {};
    const from = {};
    for (const k of Object.keys(to)) {
      from[k] = k in node._v ? node._v[k] : (opts.from && k in opts.from ? opts.from[k] : to[k]);
    }
    if (node._raf) cancelAnimationFrame(node._raf);
    const apply = e => {
      for (const k of Object.keys(to)) {
        const v = from[k] + (to[k] - from[k]) * e;
        node._v[k] = v;
        if (k === "text") node.textContent = opts.format ? opts.format(v) : v;
        else node.setAttribute(k, v);
      }
    };
    if (dur === 0) { apply(1); return; }
    const start = performance.now() + delay;
    const step = now => {
      const t = Math.min(1, Math.max(0, (now - start) / dur));
      apply(ease(t));
      if (t < 1) node._raf = requestAnimationFrame(step);
    };
    apply(0);
    node._raf = requestAnimationFrame(step);
  }

  /* Tween a number rendered as HTML text. */
  function tweenNumber(node, to, format, dur = DUR) {
    const from = node._n ?? to;
    node._n = to;
    if (node._raf) cancelAnimationFrame(node._raf);
    if (reduceMotion || from === to || !isFinite(from)) { node.textContent = format(to); return; }
    const start = performance.now();
    const step = now => {
      const t = Math.min(1, (now - start) / dur);
      // tween in log space for large swings so small numbers don't jump
      const v = from > 0 && to > 0 ? Math.exp(Math.log(from) + (Math.log(to) - Math.log(from)) * ease(t))
                                   : from + (to - from) * ease(t);
      node.textContent = format(v);
      if (t < 1) node._raf = requestAnimationFrame(step);
    };
    node._raf = requestAnimationFrame(step);
  }

  // ---------- Tooltip ----------
  const tip = document.createElement("div");
  tip.className = "tooltip"; tip.hidden = true; tip.setAttribute("role", "status");
  document.addEventListener("DOMContentLoaded", () => document.body.appendChild(tip));
  function showTip(html, evt) {
    tip.innerHTML = html; tip.hidden = false;
    const pad = 14, r = tip.getBoundingClientRect();
    let x = evt.clientX + pad, y = evt.clientY + pad;
    if (x + r.width > window.innerWidth - 8) x = evt.clientX - r.width - pad;
    if (y + r.height > window.innerHeight - 8) y = evt.clientY - r.height - pad;
    tip.style.left = Math.max(8, x) + "px"; tip.style.top = Math.max(8, y) + "px";
  }
  function hideTip() { tip.hidden = true; }
  function bindTip(node, html) {
    node.addEventListener("pointermove", e => showTip(typeof html === "function" ? html() : html, e));
    node.addEventListener("pointerleave", hideTip);
  }

  // ---------- Scales ----------
  function logScale(d0, d1, r0, r1) {
    const l0 = Math.log10(d0), l1 = Math.log10(d1);
    const f = v => r0 + (Math.log10(Math.max(v, d0)) - l0) / (l1 - l0) * (r1 - r0);
    f.ticks = () => {
      const out = [];
      for (let e = Math.round(l0); e <= Math.round(l1); e++) out.push(Math.pow(10, e));
      return out.length > 8 ? out.filter((_, i) => i % 2 === 0) : out;
    };
    return f;
  }
  function niceMax(v) {
    const e = Math.pow(10, Math.floor(Math.log10(v)));
    for (const m of [1, 1.5, 2, 2.5, 3, 4, 5, 6, 8, 10]) if (m * e >= v) return m * e;
    return 10 * e;
  }
  function linScale(d0, d1, r0, r1) {
    const f = v => r0 + (v - d0) / (d1 - d0) * (r1 - r0);
    f.ticks = () => {
      const step = niceMax(d1 / 5);
      const out = []; for (let v = 0; v <= d1 + 1e-9; v += step) out.push(v);
      return out;
    };
    return f;
  }
  function tickFmt(v) {
    if (v >= 1e6) return (v / 1e6).toLocaleString("en-US") + "M";
    if (v >= 1e3) return (v / 1e3).toLocaleString("en-US") + "k";
    return v.toLocaleString("en-US", { maximumFractionDigits: 3 });
  }
  const textWidth = (s, px = 12) => s.length * px * 0.55;

  /*
   * rowChart: horizontal bars or dots with optional range whiskers, year badges,
   * highlighted and indented (nested) rows.
   * rows: { key, label, value, lo, hi, year, mismatch, highlight, child, color, tip }
   * opts: { scale: "log"|"linear", mode: "bar"|"dot", format, axisLabel }
   */
  function rowChart(host, rows, opts) {
    const W = Math.max(300, host.clientWidth || 600);
    const narrow = W < 580;
    const labelW = narrow ? 0 : Math.min(300, W * 0.38);
    const yearW = 50, valW = 78;
    const x0 = narrow ? 4 : labelW + yearW + 6, x1 = W - valW;
    const rowH = narrow ? 46 : 30, top = 26;
    const H = top + rows.length * rowH + 6;

    const vals = rows.flatMap(r => [r.value, r.lo, r.hi]).filter(v => v > 0 && isFinite(v));
    const vmax = Math.max(...vals), vmin = Math.min(...vals);
    const scale = opts.scale === "log"
      ? logScale(Math.pow(10, Math.floor(Math.log10(vmin))), Math.pow(10, Math.ceil(Math.log10(vmax))), x0, x1)
      : linScale(0, niceMax(vmax), x0, x1);

    const sig = rows.map(r => r.key || r.label).join("|") + opts.scale + opts.mode + narrow;
    let st = host._chart;
    const rebuild = !st || st.sig !== sig;
    if (rebuild) {
      host.innerHTML = "";
      const svg = el("svg", { role: "img", "aria-label": opts.ariaLabel || "" }, host);
      st = host._chart = { sig, svg, axis: el("g", { class: "axis" }, svg), items: [] };
      rows.forEach((r, i) => {
        const g = el("g", { class: "rowg" }, svg);
        const item = {
          g,
          bg: el("rect", { class: "row-bg", x: 0, width: W, height: rowH, rx: 4 }, g),
          label: el("text", { class: "row-label" }, g),
          badgeBg: el("rect", { rx: 3, height: 16 }, g),
          badge: el("text", { "font-size": 11, "font-family": "var(--f-data)" }, g),
          whisk: el("line", { "stroke-width": 2, "stroke-linecap": "round" }, g),
          mark: el(opts.mode === "dot" ? "circle" : "rect", { class: "mark" }, g),
          val: el("text", { class: "val" }, g)
        };
        st.items.push(item);
      });
    }
    const svg = st.svg;
    svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    svg.setAttribute("height", H);

    // Axis (rebuilt each time; it is quiet chrome)
    st.axis.innerHTML = "";
    for (const t of scale.ticks()) {
      const x = scale(t);
      el("line", { class: "gridline", x1: x, x2: x, y1: top - 4, y2: H - 4 }, st.axis);
      const tx = el("text", { x, y: 12, "text-anchor": "middle" }, st.axis);
      tx.textContent = tickFmt(t);
    }
    if (opts.axisLabel) {
      const al = el("text", { x: W, y: 12, "text-anchor": "end" }, st.axis);
      al.textContent = opts.axisLabel;
    }

    rows.forEach((r, i) => {
      const it = st.items[i];
      const y = top + i * rowH;
      const barY = narrow ? y + 26 : y + rowH / 2;
      const color = r.color || (r.highlight ? "var(--accent)" : r.child ? "var(--muted)" : "var(--neutral-mark)");

      it.bg.setAttribute("y", y); it.bg.setAttribute("width", W);
      it.label.textContent = (r.child ? "↳ " : "") + r.label;
      it.label.setAttribute("class", "row-label" + (r.child ? " child" : "") + (r.highlight ? " hl" : ""));
      it.label.setAttribute("x", narrow ? 4 + (r.child ? 8 : 0) : (r.child ? 14 : 0));
      it.label.setAttribute("y", narrow ? y + 13 : y + rowH / 2 + 4.5);

      // year badge
      if (r.year != null) {
        const bx = narrow ? W - 46 : labelW + 2, by = narrow ? y + 2 : y + rowH / 2 - 8;
        it.badgeBg.setAttribute("x", bx); it.badgeBg.setAttribute("y", by); it.badgeBg.setAttribute("width", 42);
        setA(it.badgeBg, "fill", r.mismatch ? "var(--flag-wash)" : "var(--grid)");
        it.badge.setAttribute("x", bx + 21); it.badge.setAttribute("y", by + 12); it.badge.setAttribute("text-anchor", "middle");
        setA(it.badge, "fill", r.mismatch ? "var(--flag)" : "var(--ink-2)");
        it.badge.textContent = r.year;
        it.badgeBg.style.display = it.badge.style.display = "";
      } else { it.badgeBg.style.display = it.badge.style.display = "none"; }

      const delay = rebuild ? i * 30 : 0;
      const xv = scale(r.value);
      if (opts.mode === "dot") {
        it.mark.setAttribute("r", r.highlight ? 6 : 5);
        setA(it.mark, "fill", color);
        setA(it.mark, "stroke", "var(--surface)"); it.mark.setAttribute("stroke-width", 2);
        animate(it.mark, { cx: xv, cy: barY }, { delay, from: { cx: x0, cy: barY } });
      } else {
        const h = r.child ? 8 : 12;
        setA(it.mark, "fill", color); it.mark.setAttribute("rx", 2);
        animate(it.mark, { x: x0, y: barY - h / 2, width: Math.max(1, xv - x0), height: h },
          { delay, from: { x: x0, y: barY - h / 2, width: 0, height: h } });
      }
      if (r.lo != null && r.hi != null) {
        setA(it.whisk, "stroke", color); it.whisk.setAttribute("opacity", 0.55);
        it.whisk.style.display = "";
        animate(it.whisk, { x1: scale(r.lo), x2: scale(r.hi), y1: barY, y2: barY },
          { delay, from: { x1: xv, x2: xv, y1: barY, y2: barY } });
      } else it.whisk.style.display = "none";

      it.val.setAttribute("class", "val" + (r.highlight ? " hl" : ""));
      it.val.setAttribute("x", x1 + 8); it.val.setAttribute("y", barY + 4);
      it.val.textContent = opts.format(r.value);

      it.g.onpointermove = e => r.tip && showTip(r.tip, e);
      it.g.onpointerleave = hideTip;
    });
  }

  /*
   * stackedBar: one 100% bar of stage segments with 2px surface gaps.
   * segs: { key, label, value, color, tip }
   */
  function stackedBar(host, segs, opts = {}) {
    const W = Math.max(260, host.clientWidth || 600);
    const H = 30, barH = 22, gap = 2;
    const total = segs.reduce((a, s) => a + Math.max(0, s.value), 0) || 1;
    const sig = segs.map(s => s.key).join("|");
    let st = host._chart;
    if (!st || st.sig !== sig) {
      host.innerHTML = "";
      const svg = el("svg", { role: "img", "aria-label": opts.ariaLabel || "" }, host);
      const id = "clip" + Math.random().toString(36).slice(2);
      const cp = el("clipPath", { id }, el("defs", null, svg));
      const clipRect = el("rect", { x: 0, y: 4, height: barH, rx: 4 }, cp);
      const g = el("g", { "clip-path": `url(#${id})` }, svg);
      const lg = el("g", null, svg);
      st = host._chart = {
        sig, svg, clipRect, fresh: true,
        items: segs.map(() => ({ rect: el("rect", { y: 4, height: barH, class: "mark" }, g), text: el("text", { "font-size": 11.5, "font-weight": 600, "pointer-events": "none" }, lg) }))
      };
    }
    st.svg.setAttribute("viewBox", `0 0 ${W} ${H}`);
    st.svg.setAttribute("height", H);
    st.clipRect.setAttribute("width", W);
    const nonzero = segs.filter(s => s.value > 0).length;
    const usable = W - gap * Math.max(0, nonzero - 1);
    let x = 0;
    segs.forEach((s, i) => {
      const it = st.items[i];
      const w = Math.max(0, s.value) / total * usable;
      setA(it.rect, "fill", s.color);
      animate(it.rect, { x, width: w }, { from: { x: 0, width: 0 }, delay: st.fresh ? i * 40 : 0 });
      it.rect.onpointermove = e => showTip(s.tip, e);
      it.rect.onpointerleave = hideTip;
      const pct = s.value / total * 100;
      const txt = `${s.key} ${pct >= 10 ? pct.toFixed(0) : pct.toFixed(1)}%`;
      const fits = w > textWidth(txt, 11.5) + 12;
      it.text.textContent = txt;
      setA(it.text, "fill", s.labelInk || "#fff");
      it.text.setAttribute("opacity", fits ? 1 : 0);
      animate(it.text, { x: x + 7, y: 4 + barH / 2 + 4 }, { from: { x: 7, y: 4 + barH / 2 + 4 } });
      if (w > 0) x += w + gap;
    });
    st.fresh = false;
  }

  /*
   * evidenceStrip: where sources put a parameter, vs the chosen value and its low–high band.
   * cfg: { min, max, value, lo, hi, evidence: [{ value, label, source, partial }], format, srcName }
   */
  function evidenceStrip(host, cfg) {
    const W = Math.max(240, host.clientWidth || 320), H = 40, y = 18, pad = 8;
    const sx = v => pad + (Math.min(cfg.max, Math.max(cfg.min, v)) - cfg.min) / (cfg.max - cfg.min) * (W - 2 * pad);
    let st = host._chart;
    if (!st) {
      host.innerHTML = "";
      const svg = el("svg", { role: "img", "aria-label": "Source values compared with the chosen value" }, host);
      st = host._chart = {
        svg,
        axis: el("line", { class: "baseline" }, svg),
        band: el("rect", { y: y - 6, height: 12, rx: 6, fill: "var(--accent-wash)" }, svg),
        dots: el("g", null, svg),
        marker: el("line", { stroke: "var(--accent)", "stroke-width": 2, "stroke-linecap": "round" }, svg),
        minT: el("text", { class: "val", y: H - 2 }, svg),
        maxT: el("text", { class: "val", y: H - 2, "text-anchor": "end" }, svg)
      };
    }
    st.svg.setAttribute("viewBox", `0 0 ${W} ${H}`); st.svg.setAttribute("height", H);
    Object.entries({ x1: pad, x2: W - pad, y1: y, y2: y }).forEach(([k, v]) => st.axis.setAttribute(k, v));
    st.minT.setAttribute("x", pad); st.minT.textContent = cfg.format(cfg.min);
    st.maxT.setAttribute("x", W - pad); st.maxT.textContent = cfg.format(cfg.max);
    animate(st.band, { x: sx(Math.min(cfg.lo, cfg.hi)), width: Math.max(2, sx(Math.max(cfg.lo, cfg.hi)) - sx(Math.min(cfg.lo, cfg.hi))) });
    animate(st.marker, { x1: sx(cfg.value), x2: sx(cfg.value), y1: y - 10, y2: y + 10 });
    if (!st.dotsBuilt) {
      st.dotsBuilt = true;
      cfg.evidence.forEach(e => {
        const c = el("circle", {
          cx: sx(e.value), cy: y, r: 4.5,
          fill: e.partial ? "var(--surface)" : "var(--ink-2)",
          stroke: e.partial ? "var(--ink-2)" : "var(--surface)", "stroke-width": e.partial ? 1.5 : 2
        }, st.dots);
        bindTip(c, `<b>${cfg.format(e.value)}</b> · ${e.label}<br><span class="t-sub">${cfg.srcName(e.source)}${e.partial ? " · covers only part of the parameter" : ""}</span>`);
      });
    } else {
      [...st.dots.children].forEach((c, i) => c.setAttribute("cx", sx(cfg.evidence[i].value)));
    }
  }

  window.Charts = { rowChart, stackedBar, evidenceStrip, tweenNumber, animate, el, setA, showTip, hideTip, bindTip, reduceMotion };
})();
