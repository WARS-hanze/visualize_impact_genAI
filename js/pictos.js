/*
 * Animated pictograms for the scroll story. Each builder draws the final state
 * immediately (so the page is complete at rest) and returns { play } which
 * replays the animation from empty. Colours come from CSS tokens.
 */
(function () {
  const { el, setA, animate, reduceMotion } = window.Charts;
  let uid = 0;
  const svgRoot = (host, w, h, label) => {
    host.innerHTML = "";
    return el("svg", { viewBox: `0 0 ${w} ${h}`, role: "img", "aria-label": label || "" }, host);
  };

  // Icon outlines on a 40 × 60 grid.
  const ICONS = {
    bulb: g => {
      el("circle", { cx: 20, cy: 22, r: 14 }, g);
      el("rect", { x: 14, y: 35, width: 12, height: 9, rx: 1.5 }, g);
      el("rect", { x: 15.5, y: 46, width: 9, height: 4, rx: 1.5 }, g);
    },
    bottle: g => {
      el("rect", { x: 16, y: 3, width: 8, height: 5, rx: 1 }, g);
      el("path", { d: "M16 8 h8 v5 c6 2 8 5 8 10 v30 a4 4 0 0 1 -4 4 h-16 a4 4 0 0 1 -4 -4 v-30 c0 -5 2 -8 8 -10 z" }, g);
    },
    phone: g => {
      el("rect", { x: 9, y: 5, width: 22, height: 46, rx: 4 }, g);
    },
    pool: g => {
      el("rect", { x: 2, y: 4, width: 38, height: 24, rx: 3 }, g);
    }
  };
  // Vertical extent that the fill rises through, per icon.
  const BOXES = { pool: { top: 4, bottom: 28 } };
  const CELLS = { pool: { w: 46, h: 34 } };
  // Details drawn on top of filled icons so they read as objects, not bars.
  const DETAILS = {
    phone: g => {
      const scr = el("rect", { x: 11.5, y: 10, width: 17, height: 36, rx: 1.5 }, g); setA(scr, "fill", "var(--bg)"); scr.setAttribute("opacity", 0.9);
      const notch = el("rect", { x: 17, y: 6.8, width: 6, height: 1.6, rx: 0.8 }, g); setA(notch, "fill", "var(--bg)");
    },
    pool: g => {
      [11, 19].forEach(y => { const l = el("line", { x1: 5, x2: 37, y1: y, y2: y, "stroke-width": 1, "stroke-dasharray": "2 3" }, g); setA(l, "stroke", "var(--bg)"); l.setAttribute("opacity", 0.8); });
    },
    bulb: g => {
      const glint = el("path", { d: "M13 18 a8 8 0 0 1 6 -6", "stroke-width": 1.8, "stroke-linecap": "round" }, g);
      setA(glint, "fill", "none"); setA(glint, "stroke", "var(--bg)"); glint.setAttribute("opacity", 0.8);
    }
  };
  const ICON_BOX = { top: 3, bottom: 57 };

  /*
   * Grid of icons, `filled` of them coloured (fractional values fill the last icon partly).
   * mode "rise": colour rises from the bottom; mode "drop": icons drop in one by one.
   */
  function iconGrid(host, { icon, count, filled, color, cols = count, label, mode = "rise" }) {
    const cw = (CELLS[icon] || {}).w || 48, chh = (CELLS[icon] || {}).h || 66, rows = Math.ceil(count / cols);
    const BOX = BOXES[icon] || ICON_BOX;
    const svg = svgRoot(host, cols * cw, rows * chh, label);
    const items = [];
    for (let i = 0; i < count; i++) {
      const x = (i % cols) * cw + 4, y = Math.floor(i / cols) * chh + 3;
      const pos = el("g", { transform: `translate(${x} ${y})` }, svg);
      const g = el("g", null, pos);   // animated with CSS; its parent keeps the SVG position
      const id = "pc" + (++uid);
      const cp = el("clipPath", { id }, g); ICONS[icon](cp);
      const base = el("g", null, g); ICONS[icon](base);
      [...base.children].forEach(n => setA(n, "fill", "var(--grid)"));
      const f = Math.max(0, Math.min(1, filled - i));
      const h = BOX.bottom - BOX.top;
      const fill = el("rect", { x: 0, width: 42, y: BOX.bottom - f * h, height: f * h, "clip-path": `url(#${id})` }, g);
      setA(fill, "fill", color);
      if (DETAILS[icon] && f > 0) DETAILS[icon](el("g", null, g));
      const outline = el("g", null, g); ICONS[icon](outline);
      [...outline.children].forEach(n => { setA(n, "fill", "none"); setA(n, "stroke", "var(--muted)"); n.setAttribute("stroke-width", 1.5); });
      items.push({ g, fill, f, h, x, y });
    }
    return {
      play() {
        if (reduceMotion) return;
        items.forEach((it, i) => {
          if (mode === "drop") {
            it.g.style.transition = "none"; it.g.style.opacity = it.f > 0 ? 0 : 1;
            it.g.style.transform = it.f > 0 ? "translateY(-18px)" : "none";
            requestAnimationFrame(() => requestAnimationFrame(() => {
              it.g.style.transition = `opacity 420ms ease ${i * 140}ms, transform 520ms cubic-bezier(.2,.8,.2,1) ${i * 140}ms`;
              it.g.style.opacity = 1; it.g.style.transform = "none";
            }));
          } else {
            it.fill._v = { y: BOX.bottom, height: 0 };
            animate(it.fill, { y: BOX.bottom - it.f * it.h, height: it.f * it.h }, { dur: 700, delay: Math.min(i * 160, 2400 / count * i) });
          }
        });
      }
    };
  }

  /* A city skyline, filled left-to-right to `frac`. */
  function skyline(host, { frac, color, label }) {
    const W = 480, H = 170, base = 160;
    const svg = svgRoot(host, W, H, label);
    const heights = [70, 105, 60, 140, 90, 120, 55, 150, 100, 75, 130, 85, 110, 65, 95];
    const bw = W / heights.length;
    const draw = g => heights.forEach((h, i) => el("rect", { x: i * bw + 2, y: base - h, width: bw - 4, height: h, rx: 2 }, g));
    const id = "sk" + (++uid);
    const cp = el("clipPath", { id }, svg); draw(cp);
    const bg = el("g", null, svg); draw(bg); [...bg.children].forEach(n => setA(n, "fill", "var(--grid)"));
    const fill = el("rect", { x: 0, y: 0, height: base, width: frac * W, "clip-path": `url(#${id})` }, svg);
    setA(fill, "fill", color);
    // windows and a rooftop antenna, so the shapes read as buildings rather than bars
    const win = el("g", null, svg);
    heights.forEach((h, i) => {
      const x = i * bw + 2, w = bw - 4;
      for (let y = base - h + 8; y < base - 10; y += 14)
        for (let wx = x + 5; wx + 5 <= x + w - 4; wx += 9) {
          const r = el("rect", { x: wx, y, width: 4, height: 6, rx: 0.8 }, win); setA(r, "fill", "var(--bg)"); r.setAttribute("opacity", 0.55);
        }
    });
    const tallest = heights.indexOf(Math.max(...heights));
    const ant = el("line", { x1: tallest * bw + bw / 2, x2: tallest * bw + bw / 2, y1: base - heights[tallest] - 14, y2: base - heights[tallest], "stroke-width": 2 }, svg);
    setA(ant, "stroke", "var(--muted)");
    const edge = el("line", { x1: frac * W, x2: frac * W, y1: 4, y2: base, "stroke-width": 2 }, svg);
    setA(edge, "stroke", "var(--ink)");
    const ground = el("line", { x1: 0, x2: W, y1: base + 1, y2: base + 1, "stroke-width": 1 }, svg);
    setA(ground, "stroke", "var(--rule)");
    return {
      play() {
        if (reduceMotion) return;
        fill._v = { width: 0 }; edge._v = { x1: 0, x2: 0 };
        animate(fill, { width: frac * W }, { dur: 1400 });
        animate(edge, { x1: frac * W, x2: frac * W }, { dur: 1400 });
      }
    };
  }

  /* Phone batteries, one per row, filled to a share of a full charge. */
  function batteries(host, { rows, color, label }) {
    const W = 520, rowH = 64, bw = 330, bh = 30, x0 = 0;
    const svg = svgRoot(host, W, rows.length * rowH, label);
    const fills = [];
    rows.forEach((r, i) => {
      const y = i * rowH + 20;
      const t = el("text", { x: x0, y: y - 6, "font-size": 13 }, svg); t.textContent = r.label; setA(t, "fill", "var(--ink)");
      const shell = el("rect", { x: x0, y, width: bw, height: bh, rx: 6, "stroke-width": 1.5 }, svg);
      setA(shell, "fill", "var(--grid)"); setA(shell, "stroke", "var(--muted)");
      const cap = el("rect", { x: x0 + bw + 2, y: y + 9, width: 5, height: 12, rx: 1.5 }, svg); setA(cap, "fill", "var(--muted)");
      const w = Math.max(3, Math.min(1, r.frac) * (bw - 6));
      const fill = el("rect", { x: x0 + 3, y: y + 3, height: bh - 6, width: w, rx: 3 }, svg);
      setA(fill, "fill", r.color || color);
      const v = el("text", { x: x0 + bw + 18, y: y + 20, "font-size": 13, "font-family": "var(--f-data)" }, svg);
      v.textContent = r.valueText; setA(v, "fill", "var(--ink-2)");
      fills.push({ fill, w });
    });
    return {
      play() {
        if (reduceMotion) return;
        fills.forEach((f, i) => { f.fill._v = { width: 0 }; animate(f.fill, { width: f.w }, { dur: 900, delay: 200 + i * 250 }); });
      }
    };
  }


  /*
   * The life-cycle journey: stages as circles on one line, circle AREA proportional to the
   * stage's share of CO₂e. Horizontal on wide hosts, vertical on narrow ones.
   * stages: [{ id, lines: [..], phase, color, share (0–1 or null), valueText }]
   */
  function journey(host, { stages, label }) {
    const narrow = (host.clientWidth || 600) < 520;
    const maxR = narrow ? 22 : 30, minR = 5;
    const rOf = s => s.share == null ? 9 : Math.max(minR, Math.sqrt(s.share / 0.55) * maxR);
    const n = stages.length;
    let W, H, pos;
    if (!narrow) {
      W = 660; H = 190; const pad = 42, y = 82;
      pos = stages.map((_, i) => ({ x: pad + i * (W - 2 * pad) / (n - 1), y }));
    } else {
      W = 360; H = 40 + n * 58; const x = 34;
      pos = stages.map((_, i) => ({ x, y: 44 + i * 58 }));
    }
    const svg = svgRoot(host, W, H, label);
    // phase brackets
    const phases = [...new Set(stages.map(s => s.phase))];
    phases.forEach(ph => {
      const idx = stages.map((s, i) => s.phase === ph ? i : -1).filter(i => i >= 0);
      const a = pos[idx[0]], b = pos[idx[idx.length - 1]];
      if (!narrow) {
        const l = el("line", { x1: a.x - 18, x2: b.x + 18, y1: 24, y2: 24, "stroke-width": 1 }, svg); setA(l, "stroke", "var(--rule)");
        const t = el("text", { x: (a.x + b.x) / 2, y: 16, "text-anchor": "middle", "font-size": 12, "font-weight": 600, "letter-spacing": "0.04em" }, svg);
        t.textContent = ph.toUpperCase(); setA(t, "fill", "var(--muted)");
      } else {
        const t = el("text", { x: W - 4, y: a.y - 22, "text-anchor": "end", "font-size": 11, "font-weight": 600, "letter-spacing": "0.04em" }, svg);
        t.textContent = ph.toUpperCase(); setA(t, "fill", "var(--muted)");
      }
    });
    // connecting line
    const first = pos[0], last = pos[n - 1];
    const len = narrow ? last.y - first.y : last.x - first.x;
    const line = el("line", { x1: first.x, y1: first.y, x2: narrow ? first.x : last.x, y2: narrow ? last.y : first.y,
      "stroke-width": 2, "stroke-dasharray": len, "stroke-dashoffset": 0 }, svg);
    setA(line, "stroke", "var(--rule)");
    const nodes = stages.map((s, i) => {
      const p = pos[i], r = rOf(s);
      const g = el("g", null, svg);
      const c = el("circle", { cx: p.x, cy: p.y, r }, g);
      if (s.share == null) { setA(c, "fill", "var(--bg)"); setA(c, "stroke", s.color); c.setAttribute("stroke-width", 2.5); }
      else { setA(c, "fill", s.color); setA(c, "stroke", "var(--bg)"); c.setAttribute("stroke-width", 2); }
      const tx = narrow ? p.x + maxR + 12 : p.x, anchor = narrow ? "start" : "middle";
      const ty = narrow ? p.y - 2 : p.y + maxR + 20;
      const name = el("text", { x: tx, y: ty, "text-anchor": anchor, "font-size": 12.5 }, g);
      setA(name, "fill", "var(--ink)");
      (narrow ? [s.lines.join(" ")] : s.lines).forEach((ln, k) => {
        const ts = el("tspan", { x: tx, dy: k ? 15 : 0 }, name); ts.textContent = ln;
      });
      const v = el("text", { x: tx, y: narrow ? p.y + 14 : ty + (s.lines.length) * 15 + 3, "text-anchor": anchor, "font-size": 12, "font-weight": 700, "font-family": "var(--f-data)" }, g);
      v.textContent = s.valueText; setA(v, "fill", "var(--ink-2)");
      return { g, c, r };
    });
    return {
      play() {
        if (reduceMotion) return;
        line._v = { "stroke-dashoffset": len };
        animate(line, { "stroke-dashoffset": 0 }, { dur: 1800 });
        nodes.forEach((nd, i) => {
          nd.c._v = { r: 0 };
          animate(nd.c, { r: nd.r }, { dur: 600, delay: 150 + i * 220 });
          nd.g.style.transition = "none"; nd.g.style.opacity = 0.15;
          setTimeout(() => { nd.g.style.transition = "opacity 400ms ease"; nd.g.style.opacity = 1; }, 150 + i * 220);
        });
      }
    };
  }

  /*
   * Zoom cascade: each level is a 100% bar; the segment marked `focus` expands into the next level.
   * levels: [{ title, segs: [{ label, value, color, focus, ink }], note }]
   */
  function zoomCascade(host, { levels, format, label }) {
    const narrow = (host.clientWidth || 600) < 520;
    const W = narrow ? 360 : 560, barH = 28, titleH = 24, labelH = narrow ? 30 : 24, zoomH = narrow ? 40 : 50;
    const levelH = titleH + barH + labelH;
    const H = levels.length * levelH + (levels.length - 1) * zoomH;
    const svg = svgRoot(host, W, H, label);
    const parts = [];
    let prevFocus = null;
    levels.forEach((lv, li) => {
      const y0 = li * (levelH + zoomH);
      const total = lv.segs.reduce((a, s) => a + s.value, 0);
      const g = el("g", null, svg);
      const t = el("text", { x: 0, y: y0 + 15, "font-size": 13, "font-weight": 650 }, g); t.textContent = lv.title; setA(t, "fill", "var(--ink)");
      if (lv.note) { const nt = el("text", { x: W, y: y0 + 15, "text-anchor": "end", "font-size": 11.5 }, g); nt.textContent = lv.note; setA(nt, "fill", "var(--muted)"); }
      const by = y0 + titleH;
      const id = "zc" + (++uid);
      const cp = el("clipPath", { id }, g); el("rect", { x: 0, y: by, width: W, height: barH, rx: 4 }, cp);
      const bars = el("g", { "clip-path": `url(#${id})` }, g);
      let x = 0, focus = null;
      const segEls = [];
      lv.segs.forEach((sg, si) => {
        const w = sg.value / total * W;
        const r = el("rect", { x, y: by, width: Math.max(0, w - (si < lv.segs.length - 1 ? 2 : 0)), height: barH }, bars);
        setA(r, "fill", sg.color);
        segEls.push({ r, x, w });
        const tw = sg.label.length * 6.4 + 12;
        if (sg.inline !== false && w > tw) {
          const lt = el("text", { x: x + 7, y: by + 17, "font-size": 11.5, "font-weight": 600 }, g); lt.textContent = sg.label; setA(lt, "fill", sg.ink || "#ffffff");
        }
        if (sg.focus) focus = { x, w, y: by + barH, seg: sg };
        x += w;
      });
      // callout under the bar for the focus segment (and anything flagged `callout`)
      lv.segs.forEach((sg, si) => {
        if (!sg.callout) return;
        const e = segEls[si], cx = Math.min(W - 4, Math.max(4, e.x + e.w / 2));
        const anchor = cx > W * 0.7 ? "end" : cx < W * 0.3 ? "start" : "middle";
        const ct = el("text", { x: anchor === "end" ? W : anchor === "start" ? 0 : cx, y: by + barH + 16, "text-anchor": anchor, "font-size": 12, "font-weight": 650 }, g);
        ct.textContent = sg.callout; setA(ct, "fill", "var(--ink)");
      });
      // zoom trapezoid from the previous level's focus segment to this full bar
      let zoom = null;
      if (prevFocus) {
        const zt = y0 - zoomH + (labelH - 4), zb = y0 + titleH - 2;
        zoom = el("path", { d: `M${prevFocus.x} ${prevFocus.y} L${prevFocus.x + prevFocus.w} ${prevFocus.y} L${W} ${zb} L0 ${zb} Z` }, svg);
        setA(zoom, "fill", "var(--accent-wash)");
        svg.insertBefore(zoom, svg.firstChild);
      }
      parts.push({ g, bars, zoom, segEls });
      prevFocus = focus;
    });
    return {
      play() {
        if (reduceMotion) return;
        parts.forEach((p, i) => {
          const d = i * 900;
          [p.g, p.zoom].filter(Boolean).forEach(n => { n.style.transition = "none"; n.style.opacity = 0; });
          p.segEls.forEach(se => { se.r._v = { width: 0 }; });
          setTimeout(() => {
            [p.g, p.zoom].filter(Boolean).forEach(n => { n.style.transition = "opacity 500ms ease"; n.style.opacity = 1; });
            p.segEls.forEach((se, k) => animate(se.r, { width: Math.max(0, se.w - 2) }, { dur: 700, delay: k * 60 }));
          }, d);
        });
      }
    };
  }

  window.Pictos = { iconGrid, skyline, batteries, journey, zoomCascade };
})();
