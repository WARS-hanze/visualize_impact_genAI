/* Page wiring: state, controls, and rendering of every section. */
(function () {
  const G = window.GENAI, C = window.Charts;
  const $ = s => document.querySelector(s);
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

  const state = {
    scenario: "y2024", mode: "amortised", overrides: {},
    worldMetric: "co2", worldScale: "linear", ctxMetric: "co2", ctxScale: "linear", appsScale: "linear", storyWorld: "energy", theme: "system"
  };
  try { const t = localStorage.getItem("theme"); if (t) state.theme = t; } catch (e) {}

  // ---------- Formatting ----------
  const num = (v, maxFrac) => {
    if (v == null || !isFinite(v)) return "–";
    const a = Math.abs(v);
    const d = maxFrac != null ? maxFrac : a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? 2 : a >= 0.1 ? 2 : 3;
    return v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: 0 });
  };
  const sig = v => {           // 2–3 significant figures for headline numbers
    if (!isFinite(v)) return "–";
    const a = Math.abs(v);
    if (a >= 1000) return Math.round(v).toLocaleString("en-US");
    if (a >= 100) return v.toFixed(0);
    if (a >= 10) return v.toFixed(1);
    return v.toFixed(2);
  };
  const pct = v => (v >= 10 ? v.toFixed(0) : v >= 1 ? v.toFixed(1) : v.toFixed(2)) + "%";
  const pfmt = (key, v) => {
    const p = G.params[key];
    const x = v * p.scale;
    const s = x.toLocaleString("en-US", { maximumFractionDigits: p.digits });
    return p.unit === "%" ? s + "%" : s;
  };
  const scYear = () => +G.scenarios[state.scenario].label;
  const dcWaterYear = () => state.scenario === "y2024" ? 2023 : scYear();

  // ---------- Source helpers ----------
  const src = id => G.sources[id];
  const srcLink = id => `<a href="#src-${id}">${esc(src(id).short)}</a>${src(id).verified ? "" : "<sup>†</sup>"}`;
  const srcLinks = ids => (ids || []).map(srcLink).join(", ");
  const srcName = id => src(id) ? src(id).short : id;
  const coiOf = ids => (ids || []).map(id => src(id)).filter(s => s && s.coi);
  const tipSources = ids => {
    const coi = coiOf(ids);
    return `<div class="t-sub">${(ids || []).map(srcName).join(" · ")}</div>` +
      (coi.length ? `<div class="t-sub">Stake: ${esc(coi.map(s => s.coi).join(" "))}</div>` : "");
  };

  // ---------- Model ----------
  let R, RANGE, P;
  function run() {
    P = G.resolveParams(state.scenario, state.overrides);
    R = G.compute(state.scenario, P, state.mode);
    RANGE = G.computeRange(state.scenario, state.overrides, state.mode);
  }

  // ---------- Segmented controls ----------
  function placeThumb(seg) {
    const btn = seg.querySelector('button[aria-pressed="true"]');
    const thumb = seg.querySelector(".thumb");
    if (!btn || !thumb) return;
    thumb.style.width = btn.offsetWidth + "px";
    thumb.style.transform = `translateX(${btn.offsetLeft}px)`;
  }
  function initSegs() {
    document.querySelectorAll(".seg[data-group]").forEach(seg => {
      const thumb = document.createElement("span"); thumb.className = "thumb"; seg.prepend(thumb);
      const group = seg.dataset.group;
      seg.querySelectorAll("button").forEach(b => {
        b.setAttribute("aria-pressed", String(b.dataset.value === state[group]));
        b.addEventListener("click", () => {
          if (state[group] === b.dataset.value) return;
          state[group] = b.dataset.value;
          seg.querySelectorAll("button").forEach(x => x.setAttribute("aria-pressed", String(x === b)));
          placeThumb(seg);
          onChange(group);
        });
      });
      placeThumb(seg);
    });
  }

  function applyTheme() {
    const root = document.documentElement;
    if (state.theme === "system") delete root.dataset.theme; else root.dataset.theme = state.theme;
    try { state.theme === "system" ? localStorage.removeItem("theme") : localStorage.setItem("theme", state.theme); } catch (e) {}
  }

  function swap(id, fn) {       // cross-fade a panel when its content type changes
    const el = document.getElementById(id);
    if (!el || matchMedia("(prefers-reduced-motion: reduce)").matches) { fn(); return; }
    el.classList.add("out");
    setTimeout(() => { fn(); el.classList.remove("out"); }, 200);
  }

  function onChange(group) {
    if (group === "theme") { applyTheme(); return; }
    if (group === "worldMetric") { swap("world-wrap", renderWorld); return; }
    if (group === "worldScale") { renderWorld(); return; }
    if (group === "storyWorld") {
      swap("viz-world", () => { renderWorldStory(G.compute("y2024", G.resolveParams("y2024", {}), "amortised")); story.players.world.play(); });
      return;
    }
    if (group === "ctxMetric") { swap("ctx-wrap", renderContext); return; }
    if (group === "ctxScale") { renderContext(); return; }
    if (group === "appsScale") { renderApps(); return; }
    if (group === "scenario") {
      // scenario-specific defaults (carbon intensity) follow the year unless the reader set them
      syncSliders();
    }
    renderAll();
  }

  // ---------- Totals ----------
  const TILE_DEFS = [
    { key: "co2", label: "Greenhouse gases", unit: "Mt CO₂e", get: r => r.co2.total,
      compare: r => `≈ ${num(r.co2.total / 47.9, 1)} × New York City's emissions <span class="year">2024</span>` },
    { key: "water", label: "Water consumed", unit: "billion litres", get: r => r.water.total,
      compare: r => `≈ ${pct(r.water.total / G.scenarios[state.scenario].dcWaterGL * 100)} of all data-centre water <span class="year${dcWaterYear() !== scYear() ? " mismatch" : ""}">${dcWaterYear()}</span>` },
    { key: "energy", label: "Electricity", unit: "TWh", get: r => r.energy.total,
      compare: r => `≈ ${num(r.energy.total / 118.1, 2)} × the Netherlands' use <span class="year">2024</span>` },
    { key: "ewaste", label: "Hardware discarded", unit: "kilotonnes", get: r => r.materials.ewasteKt,
      compare: r => `≈ ${num(r.materials.ewasteKt / 2.3, 1)} × Bitcoin mining's hardware waste <span class="year">2024</span>` }
  ];
  function renderTiles() {
    const host = $("#tiles");
    if (!host.children.length) {
      host.innerHTML = TILE_DEFS.map(t => `
        <div class="tile" id="tile-${t.key}">
          <span class="label">${t.label}</span>
          <span class="value"><span class="v"></span><span class="unit">${t.unit}</span></span>
          <span class="range"></span>
          <span class="compare"></span>
        </div>`).join("");
    }
    TILE_DEFS.forEach(t => {
      const el = $(`#tile-${t.key}`);
      C.tweenNumber(el.querySelector(".v"), t.get(R), sig);
      el.querySelector(".range").textContent = `Range ${sig(t.get(RANGE.lo))} – ${sig(t.get(RANGE.hi))}`;
      el.querySelector(".compare").innerHTML = t.compare(R);
    });
    document.querySelectorAll('[data-bind="year"]').forEach(n => n.textContent = G.scenarios[state.scenario].label);
    $("#totals-caveat").innerHTML = `Every total scales with the share of AI hardware that serves generative AI (${pfmt("genaiShare", P.genaiShare)}), the least certain input <span class="chip conf-low">Low</span>. Ranges move all uncertain inputs to their extremes together. ${state.mode === "buildout" ? "Hardware and buildings are counted when built." : "Hardware and buildings are spread over their lifetimes."}`;
    $("#scenario-note").textContent = G.scenarios[state.scenario].note;
  }

  // ---------- Life cycle ----------
  const stageColor = id => `var(--s-${id})`;
  const LIGHT_FILLS = ["A3", "B1", "C3"];      // fills that need dark text
  function renderPhaseStrip() {
    const phases = [...new Set(G.stages.map(s => s.phase))];
    $("#phase-strip").innerHTML = phases.map(ph => `
      <div class="phase"><h3>${esc(ph)}</h3><ul>${G.stages.filter(s => s.phase === ph).map(s => `
        <li><span class="swatch" style="background:${stageColor(s.id)}"></span>
        <span><span class="code-tag">${s.id}</span><b>${esc(s.label)}</b><br>${esc(s.desc)}</span></li>`).join("")}
      </ul></div>`).join("");
  }
  const STACKS = [
    { key: "co2", label: "Greenhouse gases", unit: "Mt CO₂e" },
    { key: "water", label: "Water", unit: "billion L" },
    { key: "energy", label: "Electricity", unit: "TWh" }
  ];
  function renderStacks() {
    const host = $("#stack-rows");
    if (!host.children.length) {
      host.innerHTML = STACKS.map(s => `
        <div class="stack-row"><div class="rl"><b>${s.label}</b><span id="st-${s.key}-t"></span></div>
        <div class="chart" id="st-${s.key}"></div></div>`).join("") +
        `<div class="legend">${G.stages.filter(s => s.id !== "D1").map(s => `<span><span class="swatch" style="background:${stageColor(s.id)}"></span>${s.id} ${esc(s.label)}</span>`).join("")}</div>`;
    }
    STACKS.forEach(s => {
      const block = R[s.key];
      const segs = Object.entries(block.stages).map(([id, v]) => {
        const st = G.stages.find(x => x.id === id);
        return {
          key: id, label: st.label, value: v, color: stageColor(id),
          labelInk: LIGHT_FILLS.includes(id) ? "#111916" : "#ffffff",
          tip: `<b>${id} · ${esc(st.label)}</b><br>${num(v)} ${s.unit} · ${pct(v / block.total * 100)}`
        };
      });
      C.stackedBar($(`#st-${s.key}`), segs, { ariaLabel: `${s.label} by life-cycle stage` });
      $(`#st-${s.key}-t`).textContent = `${sig(block.total)} ${s.unit}`;
    });
  }

  function stageConfidence(metric, id) {
    const ins = (G.stageInputs[metric] || {})[id];
    if (!ins) return null;
    const order = { low: 0, medium: 1, high: 2 };
    return ins.map(G.confidence).sort((a, b) => order[a] - order[b])[0];
  }
  const chip = c => c ? `<span class="chip conf-${c}">${c}</span>` : "";

  function renderStageTable() {
    const table = $("#stage-table");
    const open = new Set([...table.querySelectorAll("details[open]")].map(d => d.dataset.id));
    const rows = G.stages.map(s => {
      const c = R.co2.stages[s.id], w = R.water.stages[s.id], e = R.energy.stages[s.id];
      const confs = ["co2", "water", "energy"].map(m => stageConfidence(m, s.id)).filter(Boolean);
      const order = { low: 0, medium: 1, high: 2 };
      const conf = confs.sort((a, b) => order[a] - order[b])[0];
      const traces = [
        R.co2.traces[s.id] && `<div><b>CO₂e</b> <code>${esc(R.co2.traces[s.id])}</code></div>`,
        R.water.traces[s.id] && `<div><b>Water</b> <code>${esc(R.water.traces[s.id])}</code></div>`,
        R.energy.traces[s.id] && `<div><b>Electricity</b> <code>${esc(R.energy.traces[s.id])}</code></div>`,
        s.id === "D1" && `<div><b>Materials</b> <code>${esc(R.materials.traces.ewasteKt)}</code></div>`,
        (G.stageInputs.co2[s.id] || G.stageInputs.water[s.id] || G.stageInputs.energy[s.id]) &&
          `<div class="muted">Inputs: ${[...new Set([...(G.stageInputs.co2[s.id] || []), ...(G.stageInputs.water[s.id] || []), ...(G.stageInputs.energy[s.id] || [])])]
            .map(k => `${esc(G.params[k].label)} ${chip(G.confidence(k))}`).join(" · ")}</div>`
      ].filter(Boolean).join("");
      const cell = (v, tot) => v == null ? `<td class="r muted">not modelled</td><td class="r"></td>` :
        `<td class="r">${num(v)}</td><td class="r muted">${pct(v / tot * 100)}</td>`;
      return `<tr>
        <td><span class="swatch" style="background:${stageColor(s.id)}"></span> <span class="code-tag">${s.id}</span>${esc(s.label)}
          <details class="trace" data-id="${s.id}" ${open.has(s.id) ? "open" : ""}><summary>How it's calculated</summary><div class="body">${traces}</div></details></td>
        ${cell(c, R.co2.total)}${cell(w, R.water.total)}${e == null ? `<td class="r muted">–</td>` : `<td class="r">${num(e)}</td>`}
        <td>${chip(conf)}</td></tr>`;
    }).join("");
    table.innerHTML = `<thead><tr><th>Stage</th><th class="r">CO₂e (Mt)</th><th class="r">share</th><th class="r">Water (bn L)</th><th class="r">share</th><th class="r">Electricity (TWh)</th><th>Confidence</th></tr></thead>
      <tbody>${rows}<tr class="total"><td>Total</td><td class="r">${num(R.co2.total)}</td><td></td><td class="r">${num(R.water.total)}</td><td></td><td class="r">${num(R.energy.total)}</td><td></td></tr></tbody>`;
  }

  function renderMaterials() {
    const m = R.materials, lo = RANGE.lo.materials, hi = RANGE.hi.materials;
    const rows = [
      { key: "in", label: state.mode === "buildout" ? "Servers & accelerators built" : "Servers & accelerators (per year of life)", value: m.hwIntakeKt, lo: lo.hwIntakeKt, hi: hi.hwIntakeKt, tip: `<b>${num(m.hwIntakeKt)} kt</b><br>${esc(m.traces.hwIntakeKt)}` },
      { key: "ew", label: "Retired → e-waste", value: m.ewasteKt, lo: lo.ewasteKt, hi: hi.ewasteKt, color: "var(--s-D1)", tip: `<b>${num(m.ewasteKt)} kt</b><br>${esc(m.traces.ewasteKt)}` },
      { key: "rc", label: "formally recycled (world average rate)", value: m.ewasteRecycledKt, child: true, tip: `<b>${num(m.ewasteRecycledKt)} kt</b> at the 22.3% global average (GEM 2024). Data-centre hardware is probably recycled more.` },
      { key: "cu", label: "Copper in facilities", value: m.copperKt, lo: lo.copperKt, hi: hi.copperKt, tip: `<b>${num(m.copperKt)} kt</b><br>${esc(m.traces.copperKt)}<br><span class="t-sub">27 t/MW is a single-site figure from a copper miner (unverified).</span>` }
    ];
    C.rowChart($("#materials-chart"), rows, { scale: "linear", mode: "bar", format: v => num(v), axisLabel: "kt" });
    // Scarcity-weighted split from the Mistral LCA (second-hand)
    const adp = $("#adp-chart");
    if (!adp.children.length) {
      const mk = (label, hw, en) => `<div class="stack-row"><div class="rl"><b>${label}</b></div><div class="chart" data-hw="${hw}" data-en="${en}"></div></div>`;
      adp.innerHTML = `<div class="stack-rows">${mk("Minerals (Sb-eq)", 61, 29)}${mk("CO₂e", 11, 85.5)}${mk("Water", 5, 91)}</div>
        <div class="legend" style="margin-top:.6rem"><span><span class="swatch" style="background:var(--s-A2)"></span>Server manufacturing & end of life</span><span><span class="swatch" style="background:var(--s-C1)"></span>Training & inference energy</span><span><span class="swatch" style="background:var(--neutral-mark)"></span>Other (buildings, network, devices)</span></div>`;
    }
    adp.querySelectorAll(".chart").forEach(el => {
      const hw = +el.dataset.hw, en = +el.dataset.en;
      C.stackedBar(el, [
        { key: "HW", value: hw, color: "var(--s-A2)", tip: `<b>Server manufacturing, transport & end of life</b> ${hw}%<br><span class="t-sub">Mistral LCA infographic</span>` },
        { key: "Use", value: en, color: "var(--s-C1)", tip: `<b>Training & inference</b> ${en}%` },
        { key: "Other", value: Math.max(0, 100 - hw - en), color: "var(--neutral-mark)", labelInk: "#111916", tip: `<b>Other</b> ${num(100 - hw - en)}%` }
      ]);
    });
  }

  // ---------- World by sector ----------
  function genaiFor(metric, r) {
    return {
      energy: { v: r.energy.total + 0, lo: RANGE.lo.energy.total, hi: RANGE.hi.energy.total, label: "Generative AI (incl. cooling)" },
      co2: { v: r.co2.operational, lo: RANGE.lo.co2.operational, hi: RANGE.hi.co2.operational, label: "Generative AI (electricity)" },
      water: { v: r.water.total, lo: RANGE.lo.water.total, hi: RANGE.hi.water.total, label: "Generative AI (consumption)" },
      ewaste: { v: r.materials.ewasteKt, lo: RANGE.lo.materials.ewasteKt, hi: RANGE.hi.materials.ewasteKt, label: "Generative AI hardware" }
    }[metric];
  }
  function dcFor(metric) {
    const sc = G.scenarios[state.scenario];
    return {
      energy: { v: sc.dcTWh, year: scYear(), label: "All data centres" },
      co2: { v: sc.dcCo2Mt, year: scYear(), label: "All data centres (electricity)" },
      water: { v: sc.dcWaterGL, year: dcWaterYear(), label: "All data centres (consumption)" }
    }[metric];
  }
  function renderWorld() {
    const m = state.worldMetric, S = G.sectors[m], y = scYear();
    const g = genaiFor(m, R), dc = dcFor(m);
    const rows = [];
    const sorted = [...S.rows].sort((a, b) => b.value - a.value);
    for (const r of sorted) {
      rows.push({ key: r.label, label: r.label + (r.unverified ? " †" : ""), value: r.value, year: S.year, mismatch: S.year !== y,
        tip: `<b>${esc(r.label)}</b><br>${num(r.value)} ${S.unit} · ${pct(r.value / sorted.reduce((a, b) => a + b.value, 0) * 100)} of world${r.unverified ? "<br>† second-hand figure" : ""}${tipSources(S.sources)}` });
      if (r.nest && dc) {
        rows.push({ key: "dc", label: dc.label, value: dc.v, child: true, year: dc.year, mismatch: dc.year !== y,
          tip: `<b>${dc.label}</b><br>${num(dc.v)} ${S.unit}<br>${esc(G.scenarios[state.scenario].trace[m === "energy" ? "dcTWh" : m === "co2" ? "dcCo2Mt" : "dcWaterGL"])}` });
        rows.push({ key: "genai", label: g.label, value: g.v, lo: g.lo, hi: g.hi, child: true, highlight: true, year: y,
          tip: `<b>${g.label}</b><br>${num(g.v)} ${S.unit} (range ${num(g.lo)}–${num(g.hi)})` });
      }
    }
    if (m === "ewaste") rows.push({ key: "genai", label: g.label, value: g.v, lo: g.lo, hi: g.hi, highlight: true, year: y, tip: `<b>${g.label}</b><br>${num(g.v)} kt per year` });
    $("#world-title").textContent = S.title;
    C.rowChart($("#world-chart"), rows, { scale: state.worldScale, mode: "bar", format: v => num(v), axisLabel: S.unit, ariaLabel: S.title });
    $("#world-caveat").textContent = S.caveat;
    const total = S.rows.reduce((a, b) => a + b.value, 0);
    $("#world-share").innerHTML = `Generative AI ≈ <b>${pct(g.v / total * 100)}</b> of the world total (range ${pct(g.lo / total * 100)}–${pct(g.hi / total * 100)}). GenAI figure: <span class="year">${y}</span>; world figure: <span class="year${S.year !== y ? " mismatch" : ""}">${S.year}</span>. Sources: ${srcLinks(S.sources)}.`;
  }

  // ---------- In context ----------
  const CTX_UNITS = { energy: "TWh", co2: "Mt CO₂e", water: "billion L", ewaste: "kt", copper: "kt" };
  function renderContext() {
    const m = state.ctxMetric, y = scYear(), unit = CTX_UNITS[m];
    const gv = {
      energy: [R.energy.total, RANGE.lo.energy.total, RANGE.hi.energy.total],
      co2: [R.co2.total, RANGE.lo.co2.total, RANGE.hi.co2.total],
      water: [R.water.total, RANGE.lo.water.total, RANGE.hi.water.total],
      ewaste: [R.materials.ewasteKt, RANGE.lo.materials.ewasteKt, RANGE.hi.materials.ewasteKt],
      copper: [R.materials.copperKt, RANGE.lo.materials.copperKt, RANGE.hi.materials.copperKt]
    }[m];
    const rows = [{ key: "genai", label: "Generative AI (this page's estimate)", value: gv[0], lo: gv[1], hi: gv[2], highlight: true, year: y,
      tip: `<b>Generative AI</b><br>${num(gv[0])} ${unit} (range ${num(gv[1])}–${num(gv[2])})<br><span class="t-sub">Whole life cycle, ${state.mode === "buildout" ? "built this year" : "spread over life"}</span>` }];
    const hidden = state.ctxScale === "linear" ? G.comparators[m].filter(c => c.worldTotal) : [];
    const comps = G.comparators[m].filter(c => !hidden.includes(c)).map(c => {
      if (c.dynamic === "dc") {
        const d = dcFor(m);
        return { ...c, value: d.v, year: d.year };
      }
      return c;
    }).sort((a, b) => b.value - a.value);
    for (const c of comps) {
      const flags = [c.unverified && "†", c.projection && "(projection)"].filter(Boolean).join(" ");
      rows.push({ key: c.label, label: c.label + (flags ? " " + flags : ""), value: c.value, lo: c.lo, hi: c.hi, year: c.year, mismatch: c.year !== y,
        color: c.estimate ? "var(--muted)" : undefined,
        tip: `<b>${esc(c.label)}</b><br>${num(c.value)} ${unit}${c.lo != null ? ` (range ${num(c.lo)}–${num(c.hi)})` : ""} · ${c.year}${c.note ? `<br>${esc(c.note)}` : ""}${c.unverified ? "<br>† second-hand, not checked against the primary source" : ""}${tipSources(c.sources)}` });
    }
    C.rowChart($("#ctx-chart"), rows, { scale: state.ctxScale, mode: "dot", format: v => num(v), axisLabel: unit, ariaLabel: "Comparison" });
    const used = [...new Set(comps.flatMap(c => c.sources))];
    $("#ctx-note").innerHTML = (hidden.length ? `<b>Not shown on the linear scale:</b> ${hidden.map(c => `${esc(c.label)} (${num(c.value)} ${unit}, ${c.year})`).join("; ")}. It would flatten every other bar; switch to log scale to include it. ` : "") + `† second-hand figure, not confirmed in the primary source. Grey dots are other researchers' estimates. Sources: ${srcLinks(used)}.`;
  }

  // ---------- Applications ----------
  function renderApps() {
    $("#apps-legend").innerHTML = `<span><span class="swatch" style="background:var(--accent)"></span>Generative tasks</span><span><span class="swatch" style="background:var(--neutral-mark)"></span>Non-generative tasks</span>`;
    const rows = G.applications.map(a => ({
      key: a.label, label: a.label, value: a.kWh, year: a.year, highlight: a.generative,
      color: a.generative ? "var(--accent)" : "var(--neutral-mark)",
      tip: `<b>${esc(a.label)}</b><br>${a.kWh} kWh per 1,000 requests (${num(a.kWh, 3)} Wh each)${a.note ? `<br>${esc(a.note)}` : ""}${tipSources(a.sources)}`
    }));
    C.rowChart($("#apps-chart"), rows, { scale: state.appsScale, mode: "bar", format: v => num(v, 3), axisLabel: "kWh/1k" });
  }

  // ---------- Assumptions ----------
  function paramCard(key, editable) {
    const p = G.params[key];
    const conf = G.confidence(key);
    const s = p.slider;
    return `<div class="assumption" id="card-${key}">
      <div class="top"><label for="in-${key}">${esc(p.label)}</label>
        <output id="out-${key}"></output></div>
      ${editable ? `<input type="range" id="in-${key}" min="${s.min}" max="${s.max}" step="${s.step}">` : ""}
      <div class="chart" id="ev-${key}"></div>
      <div class="meta">${chip(conf)} <span class="tier">${p.tier}${p.dated ? " · dated" : ""}</span></div>
      <p class="why">${esc(p.rationale)}</p>
      ${p.sources.length ? `<p class="srcs">Sources: ${srcLinks(p.sources)}</p>` : `<p class="srcs">No direct source.</p>`}
    </div>`;
  }
  function buildAssumptions() {
    $("#sliders").innerHTML = G.sliderOrder.map(k => paramCard(k, true)).join("");
    const fixed = Object.keys(G.params).filter(k => !G.sliderOrder.includes(k));
    $("#fixed").innerHTML = fixed.map(k => paramCard(k, false)).join("");
    G.sliderOrder.forEach(k => {
      const input = $(`#in-${k}`);
      input.addEventListener("input", () => {
        state.overrides[k] = +input.value;
        renderAll();
      });
    });
    $("#reset").addEventListener("click", () => { state.overrides = {}; syncSliders(); renderAll(); });
  }
  function syncSliders() {
    G.sliderOrder.forEach(k => { const v = G.resolveParams(state.scenario, state.overrides)[k]; $(`#in-${k}`).value = v; });
  }
  function renderAssumptions() {
    Object.keys(G.params).forEach(k => {
      const p = G.params[k], v = P[k];
      const out = $(`#out-${k}`);
      out.innerHTML = `${pfmt(k, v)}${p.unit && p.unit !== "%" ? `<small>${esc(p.unit)}</small>` : ""}`;
      $(`#card-${k}`).classList.toggle("touched", k in state.overrides);
      const ev = (G.evidence[k] || []);
      const vals = [v, p.lowCase, p.highCase, ...ev.map(e => e.value)];
      const min = p.slider ? p.slider.min : Math.min(...vals) * 0.8;
      let max = p.slider ? p.slider.max : Math.max(...vals) * 1.15 || 1;
      if (p.unit === "%" && max > 1) max = 1;
      let lo = p.lowCase, hi = p.highCase;
      if (k === "ci") { const d = G.scenarios[state.scenario].defaults.ci; lo = d * 250 / 434; hi = d * 500 / 434; }
      if (k in state.overrides) { lo = hi = v; }
      C.evidenceStrip($(`#ev-${k}`), {
        min, max, value: v, lo, hi,
        evidence: ev.map(e => ({ ...e, label: e.label + (e.verified === false ? " †" : "") })),
        format: x => pfmt(k, x), srcName
      });
    });
    $("#reset").hidden = Object.keys(state.overrides).length === 0;
  }

  // ---------- Cross-checks ----------
  function crossValue(ch) {
    const ov = { ...state.overrides };
    if (ch.allAI) ov.genaiShare = 1;
    const sc = ch.scenario || state.scenario;
    if (ch.metric === "copperBuild") {
      // All data-centre capacity in 2030, built-this-year accounting, all-DC growth rate 2025→2030.
      const s = G.scenarios.y2030, p = G.resolveParams("y2030", ov);
      const g = Math.pow(950 / 485, 1 / 5) - 1;
      const f = lf => {
        const cap = s.dcTWh * 1e6 / 8760 / lf;
        return (cap * g / (1 + g) + cap / (1 + g) / p.dcLife) * p.copperPerMW / 1000;
      };
      return { v: f(p.loadFactor), lo: f(0.85), hi: f(0.5) * 47 / 27, scenario: "y2030",
        trace: `950 TWh ÷ 8,760 h ÷ ${pct(p.loadFactor * 100)} load = ${num(s.dcTWh * 1e6 / 8760 / p.loadFactor / 1000)} GW; new capacity at ${pct(g * 100)}/yr growth + replacements × ${p.copperPerMW} t/MW` };
    }
    const r = G.compute(sc, G.resolveParams(sc, ov), state.mode);
    const rg = G.computeRange(sc, ov, state.mode);
    const pick = x => ({
      co2op: x.co2.operational,
      waterop: x.water.stages.C1 + x.water.stages.C2 + x.water.stages.C3,
      embodiedShare: (x.co2.total - x.co2.operational) / x.co2.total * 100,
      mfgWaterShare: (x.water.stages.A1 + x.water.stages.A2) / x.water.total * 100
    })[ch.metric];
    // Shares are ratios, which need not move monotonically between the low and high cases,
    // so the reported span always includes the central value.
    const v = pick(r), a = pick(rg.lo), b = pick(rg.hi);
    return { v, lo: Math.min(a, b, v), hi: Math.max(a, b, v), scenario: sc };
  }
  function renderCross() {
    const rows = G.crossChecks.map(ch => {
      const m = crossValue(ch);
      const overlap = m.hi >= ch.lo && m.lo <= ch.hi;
      const rel = overlap ? "Overlaps" : m.hi < ch.lo ? "Ours lower" : "Ours higher";
      const cls = overlap ? "conf-high" : (m.hi < ch.lo * 0.5 || m.lo > ch.hi * 2) ? "conf-low" : "conf-medium";
      const indep = ch.lo === ch.hi ? `${num(ch.lo)}` : `${num(ch.lo)}–${num(ch.hi)}`;
      return `<tr><td><b>${esc(ch.label)}</b>${ch.allAI ? `<div class="small muted">Our estimate recalculated with GenAI share = 100%, so it covers all AI</div>` : ""}${ch.note ? `<div class="small muted">${esc(ch.note)}</div>` : ""}${m.trace ? `<div class="small muted">${esc(m.trace)}</div>` : ""}</td>
        <td class="r">${num(m.v)} ${ch.unit}<div class="small muted">${num(m.lo)}–${num(m.hi)}</div></td>
        <td class="r">${indep} ${ch.unit}</td>
        <td><span class="chip ${cls}">${rel}</span></td>
        <td class="small">${srcLinks(ch.sources)}</td></tr>`;
    }).join("");
    $("#cross-table").innerHTML = `<thead><tr><th>Check</th><th class="r">This page's estimate</th><th class="r">Independent study</th><th>Agreement</th><th>Source</th></tr></thead><tbody>${rows}</tbody>`;
  }

  // ---------- Bibliography ----------
  function renderBib() {
    const used = new Set();
    Object.values(G.params).forEach(p => p.sources.forEach(s => used.add(s)));
    Object.values(G.evidence).forEach(es => es.forEach(e => used.add(e.source)));
    Object.values(G.scenarios).forEach(s => s.sources.forEach(x => used.add(x)));
    Object.values(G.comparators).forEach(cs => cs.forEach(c => c.sources.forEach(x => used.add(x))));
    Object.values(G.sectors).forEach(s => s.sources.forEach(x => used.add(x)));
    G.applications.forEach(a => a.sources.forEach(x => used.add(x)));
    G.crossChecks.forEach(c => c.sources.forEach(x => used.add(x)));
    const ids = Object.keys(G.sources).sort((a, b) => G.sources[a].short.localeCompare(G.sources[b].short));
    $("#bib").innerHTML = ids.map(id => {
      const s = G.sources[id];
      const status = s.verified ? `<span class="chip conf-high">Checked</span>` : s.where.some(w => typeof w === "string") ? `<span class="chip conf-medium">Partly checked</span>` : `<span class="chip conf-low">Second-hand</span>`;
      return `<li id="src-${id}">
        <div class="meta" style="display:flex;gap:.4rem;flex-wrap:wrap;align-items:center">${status}
          <span class="tier">${esc(s.type)}${s.peerReviewed ? " · peer-reviewed" : ""} · data ${esc(s.dataYear)} · published ${esc(s.published)}${s.version ? " · " + esc(s.version) : ""}${s.accessed ? " · checked " + esc(s.accessed) : ""}</span>
          ${used.has(id) ? "" : `<span class="tier">(not used)</span>`}</div>
        <span class="cit">${esc(s.citation)} <a href="${esc(s.url)}" target="_blank" rel="noopener">Link</a>${s.doi ? ` · <a href="https://doi.org/${esc(s.doi)}" target="_blank" rel="noopener">doi:${esc(s.doi)}</a>` : ""}</span>
        ${s.coi ? `<span><b>Stake in the result:</b> ${esc(s.coi)}</span>` : ""}
        ${s.note ? `<span class="muted">${esc(s.note)}</span>` : ""}
        <ul>${s.where.map(w => typeof w === "string" ? `<li>${esc(w)}</li>` : `<li>† ${esc(w.t)} <span class="muted">(via ${esc(w.via)}; not checked in the primary)</span></li>`).join("")}</ul>
      </li>`;
    }).join("");
  }

  // ---------- Export ----------
  function exportRows() {
    const out = [["metric", "stage", "central", "low", "high", "unit", "scenario", "accounting"]];
    const add = (metric, unit, block, lo, hi) => Object.keys(block.stages).forEach(id =>
      out.push([metric, id, block.stages[id], lo.stages[id], hi.stages[id], unit, state.scenario, state.mode]));
    add("co2e", "Mt", R.co2, RANGE.lo.co2, RANGE.hi.co2);
    add("water", "billion L", R.water, RANGE.lo.water, RANGE.hi.water);
    add("electricity", "TWh", R.energy, RANGE.lo.energy, RANGE.hi.energy);
    ["hwIntakeKt", "ewasteKt", "copperKt"].forEach(k => out.push(["materials", k, R.materials[k], RANGE.lo.materials[k], RANGE.hi.materials[k], "kt", state.scenario, state.mode]));
    Object.entries(P).forEach(([k, v]) => out.push(["input", k, v, "", "", G.params[k].unit, state.scenario, state.mode]));
    return out.map(r => r.map(x => typeof x === "number" ? +x.toPrecision(6) : `"${String(x).replace(/"/g, '""')}"`).join(",")).join("\n");
  }
  function initExport() {
    $("#dl-csv").addEventListener("click", () => {
      const blob = new Blob([exportRows()], { type: "text/csv" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob); a.download = `genai-footprint-${state.scenario}.csv`;
      document.body.appendChild(a); a.click(); a.remove();
    });
    $("#copy-json").addEventListener("click", async () => {
      const data = JSON.stringify({ scenario: state.scenario, accounting: state.mode, inputs: P, results: R, range: { low: RANGE.lo, high: RANGE.hi }, sources: G.sources }, null, 2);
      try { await navigator.clipboard.writeText(data); $("#copy-status").textContent = "Copied to clipboard."; }
      catch (e) { $("#copy-status").textContent = "Copy is blocked here. Use the CSV download instead."; }
    });
  }

  // ---------- Part 1: scroll story (fixed: 2024, default assumptions) ----------
  const comp = (m, label) => G.comparators[m].find(c => c.label === label);
  const ratioText = r => r >= 1.5 ? `${num(r, 1)}×` : `${Math.round(r * 100)}%`;
  const yb = (y, ref = 2024) => `<span class="year${y !== ref ? " mismatch" : ""}">${y}</span>`;
  const story = { players: {}, counts: {}, charts: {} };

  function foot(id, { range, srcs, more, moreLabel = "How we got this" }) {
    $(`#foot-${id}`).innerHTML = [range && `<span>${range}</span>`, `<span>Sources: ${srcLinks([...new Set(srcs)])}</span>`,
      `<a href="${more}">${moreLabel} →</a>`].filter(Boolean).join("");
  }
  function compareRows(m, genai, labels, unit) {
    const rows = [{ key: "genai", label: "Generative AI", value: genai.v, lo: genai.lo, hi: genai.hi, highlight: true, year: 2024,
      tip: `<b>Generative AI</b><br>${num(genai.v)} ${unit} (range ${num(genai.lo)}–${num(genai.hi)})` }];
    labels.forEach(([label, shown]) => {
      const c = comp(m, label);
      const v = c.dynamic === "dc" ? dcFor(m).v : c.value, y = c.dynamic === "dc" ? dcFor(m).year : c.year;
      rows.push({ key: label, label: shown || label, value: v, year: y, mismatch: y !== 2024,
        tip: `<b>${esc(label)}</b><br>${num(v)} ${unit} · ${y}${c.note ? `<br>${esc(c.note)}` : ""}${tipSources(c.sources)}` });
    });
    return rows;
  }

  function renderStory() {
    const saved = state.scenario; state.scenario = "y2024";          // dcFor() reads the scenario
    const r = G.compute("y2024", G.resolveParams("y2024", {}), "amortised");
    const rg = G.computeRange("y2024", {}, "amortised");
    const rng = k => [k(r), k(rg.lo), k(rg.hi)];

    // 1 · Electricity
    const nl = comp("energy", "Netherlands, whole country"), btc = comp("energy", "Bitcoin mining");
    const [e, elo, ehi] = rng(x => x.energy.total);
    story.counts.energy = e;
    $("#h-electricity").innerHTML = `About <em>${ratioText(e / nl.value)}</em> of the Netherlands' electricity use`;
    $("#body-electricity").textContent = `That is the power to run the servers and keep them cool. It is about ${ratioText(e / btc.value)} of what Bitcoin mining uses, and about ${pct(e / G.scenarios.y2024.dcTWh * 100)} of all data centres, which also run websites, video streaming and cloud storage.`;
    story.players.electricity = Pictos.iconGrid($("#viz-electricity"), { icon: "bulb", count: 10, filled: e / nl.value * 10, color: "var(--s-B1)", label: "Bulbs lit: share of the Netherlands' electricity" });
    $("#key-electricity").innerHTML = `Each bulb = one tenth of the Netherlands' yearly electricity (${num(nl.value / 10, 1)} TWh, ${nl.year}). Generative AI lights <b>${num(e / nl.value * 10, 1)}</b> of them.`;
    story.charts.electricity = () => C.rowChart($("#chart-electricity"), compareRows("energy", { v: e, lo: elo, hi: ehi },
      [["Netherlands, whole country", "The Netherlands"], ["Bitcoin mining"], ["All data centres"]], "TWh"), { scale: "linear", mode: "bar", format: v => num(v), axisLabel: "TWh" });
    foot("electricity", { range: `Range ${sig(elo)}–${sig(ehi)} TWh`, srcs: ["iea2025", ...nl.sources, ...btc.sources], more: "#lifecycle" });

    // 2 · Carbon
    const nyc = comp("co2", "New York City"), air = comp("co2", "Aviation, passenger flights (CO₂ only)");
    const [c, clo, chi] = rng(x => x.co2.total);
    story.counts.co2 = c;
    $("#h-carbon").innerHTML = `About <em>${ratioText(c / nyc.value)}</em> of New York City's yearly emissions`;
    $("#body-carbon").textContent = `Most of it comes from the power plants that supply the data centres; making the chips and buildings adds about ${pct((r.co2.total - r.co2.operational) / r.co2.total * 100)}. For comparison, it is about ${pct(c / air.value * 100)} of the CO₂ from all passenger flights.`;
    story.players.carbon = Pictos.skyline($("#viz-carbon"), { frac: Math.min(1, c / nyc.value), color: "var(--accent)", label: "Skyline filled to generative AI's share of New York City's emissions" });
    $("#key-carbon").innerHTML = `The skyline = New York City's emissions (${num(nyc.value)} Mt CO₂e, ${nyc.year}). The filled part = <b>generative AI</b>.`;
    story.charts.carbon = () => C.rowChart($("#chart-carbon"), compareRows("co2", { v: c, lo: clo, hi: chi },
      [["New York City"], ["Bitcoin mining"], ["Netherlands, territorial CO₂", "The Netherlands (CO₂)"], ["All data centres (electricity only)", "All data centres"]], "Mt CO₂e"),
      { scale: "linear", mode: "bar", format: v => num(v), axisLabel: "Mt" });
    foot("carbon", { range: `Range ${sig(clo)}–${sig(chi)} Mt`, srcs: [...nyc.sources, ...air.sources, "ccaf2025", "owidCo2", "iea2025"], more: "#lifecycle" });

    // Water
    const [w, wlo, whi] = rng(x => x.water.total);
    const POOL = 2.5e6;                                  // Olympic pool: 50 × 25 × 2 m minimum = 2,500 m³
    const pools = w * 1e9 / POOL;
    story.counts.water = w;
    const sc = r.water.scope;
    $("#h-water").innerHTML = `About <em>${num(Math.round(pools / 1000) * 1000, 0)}</em> Olympic swimming pools of water, used up every year`;
    $("#body-water").textContent = `This is water that is not returned: mostly evaporated. About ${pct(sc.offsite / w * 100)} evaporates at the power plants that make the electricity, taken from rivers, lakes and hydropower reservoirs. About ${pct(sc.onsite / w * 100)} evaporates in the data centres' own cooling towers, and that is often drinking-quality water: one large tech company reported that nearly 80% of its cooling water was potable. Making the chips adds a few percent. It equals about ${pct(w / G.scenarios.y2024.dcWaterGL * 100)} of the water used up by all data centres.`;
    story.players.water = Pictos.iconGrid($("#viz-water"), { icon: "pool", count: Math.ceil(pools / 1000), filled: pools / 1000, cols: 10, color: "var(--s-A1)", label: "Swimming pools: water used up by generative AI" });
    $("#key-water").innerHTML = `Each pool = <b>1,000</b> Olympic swimming pools (2.5 million litres each).`;
    story.charts.water = () => {
      const host = $("#chart-water");
      if (!host.querySelector(".stack-row")) host.innerHTML = `<div class="stack-row"><div class="rl"><b>Water we count</b><span>${sig(w)} billion L</span></div><div class="chart" id="water-split"></div></div>
        <div class="legend" style="margin-top:.6rem"><span><span class="swatch" style="background:var(--s-A2)"></span>Making chips & materials</span><span><span class="swatch" style="background:var(--s-A1)"></span>Power plants (rivers, lakes, reservoirs)</span><span><span class="swatch" style="background:var(--s-C3)"></span>Data-centre cooling (often drinking water)</span></div>
        <p class="small muted" style="margin-top:.5rem">Not counted: water for building the data centres and for the phones and laptops people use. Mistral's study put these at about 3% of its model's water.</p>`;
      C.stackedBar($("#water-split"), [
        { key: "Chips", value: sc.supply, color: "var(--s-A2)", tip: `<b>Making chips & materials</b><br>${num(sc.supply)} billion L · ${pct(sc.supply / w * 100)}` },
        { key: "Power plants", value: sc.offsite, color: "var(--s-A1)", tip: `<b>Power plants</b><br>${num(sc.offsite)} billion L · ${pct(sc.offsite / w * 100)}` },
        { key: "Cooling", value: sc.onsite, color: "var(--s-C3)", labelInk: "#111916", tip: `<b>Data-centre cooling</b><br>${num(sc.onsite)} billion L · ${pct(sc.onsite / w * 100)}` }
      ]);
    };
    foot("water", { range: `Range ${sig(wlo)}–${sig(whi)} billion L`, srcs: ["iea2025", "lbnl2024", "li2023", "tsmc2023", "mistral2025"], more: "#lifecycle" });

    // 4 · Hardware
    const ew = comp("ewaste", "All e-waste, world");
    const [h, hlo, hhi] = rng(x => x.materials.ewasteKt);
    const phonesM = h * 1e6 / 0.187 / 1e6;          // 187 g per iPhone 15 Pro (Wang et al.)
    story.counts.ewaste = h;
    $("#h-hardware").innerHTML = `The weight of <em>≈ ${num(phonesM, 0)} million</em> smartphones, thrown out every year`;
    $("#body-hardware").textContent = `AI servers are retired after about five years and become electronic waste. Worldwide, only about a fifth of e-waste is formally recycled. Making the chips also uses scarce metals: in Mistral's study, hardware caused 61% of the mineral depletion but only 11% of the CO₂.`;
    story.players.hardware = Pictos.iconGrid($("#viz-hardware"), { icon: "phone", count: Math.ceil(phonesM / 10), filled: phonesM / 10, color: "var(--ink-2)", mode: "drop", label: "Phones: weight of retired AI hardware" });
    $("#key-hardware").innerHTML = `Each phone = 10 million smartphones (187 g each). That is ${pct(h / ew.value * 100)} of the world's e-waste ${yb(ew.year)}.`;
    story.charts.hardware = () => C.rowChart($("#chart-hardware"), [
      { key: "genai", label: "Generative AI, retired hardware", value: h, lo: hlo, hi: hhi, highlight: true, year: 2024, tip: `<b>Generative AI</b><br>${num(h)} kt (range ${num(hlo)}–${num(hhi)})` },
      ...[["Bitcoin mining hardware"], ["LLM e-waste (independent study)", "Language-model servers (other study)"]].map(([l, shown]) => {
        const cc = comp("ewaste", l);
        return { key: l, label: shown || l, value: cc.value, year: cc.year, mismatch: cc.year !== 2024, tip: `<b>${esc(l)}</b><br>${num(cc.value)} kt · ${cc.year}${tipSources(cc.sources)}` };
      })], { scale: "linear", mode: "bar", format: v => num(v), axisLabel: "kt" });
    foot("hardware", { range: `Range ${sig(hlo)}–${sig(hhi)} thousand tonnes`, srcs: ["wang2024", "gem2024", "ccaf2025", "mistral2025"], more: "#lifecycle" });

    // 5 · One request
    const app = l => G.applications.find(a => a.label === l).kWh;
    const PHONE = 22;
    const gem = app("Gemini chat prompt (median, production)"), img = app("Image generation"), txt = app("Text generation");
    $("#h-prompt").innerHTML = `One text prompt: about <em>${pct(gem / PHONE * 100)}</em> of a phone charge. One image: about <em>${pct(img / PHONE * 100)}</em>.`;
    $("#body-prompt").textContent = "For a single request the amounts are tiny: a median Gemini text prompt uses less energy than nine seconds of television. The global total is large because billions of requests are made every day, and images, video and long “reasoning” answers cost much more than a short text.";
    story.players.prompt = Pictos.batteries($("#viz-prompt"), { color: "var(--accent)", label: "Phone batteries: energy per request", rows: [
      { label: "Generating text, small model (lab)", frac: txt / PHONE, valueText: pct(txt / PHONE * 100) },
      { label: "One Gemini chat prompt (median)", frac: gem / PHONE, valueText: pct(gem / PHONE * 100) },
      { label: "Generating one image (average model, lab)", frac: img / PHONE, valueText: pct(img / PHONE * 100) },
      { label: "Least efficient image model (lab)", frac: 0.5, valueText: "≈ 50%" }
    ] });
    $("#key-prompt").innerHTML = `A full battery = one smartphone charge (${PHONE} Wh).`;
    foot("prompt", { srcs: ["luccioni2024", "google2025"], more: "#apps", moreLabel: "More task types" });

    // 6 · Growth
    const byYear = ["y2024", "y2025", "y2030"].map(k => {
      const rr = G.compute(k, G.resolveParams(k, {}), "amortised"), gg = G.computeRange(k, {}, "amortised");
      return { k, y: +G.scenarios[k].label, v: rr.energy.total, lo: gg.lo.energy.total, hi: gg.hi.energy.total, note: G.scenarios[k].note };
    });
    const factor = byYear[2].v / byYear[0].v;
    story.counts.growth = factor;
    $("#h-growth").innerHTML = `Generative AI's electricity use could grow <em>${num(factor, 1)}-fold</em> between 2024 and 2030`;
    $("#body-growth").textContent = `Electricity for AI-focused data centres rose 50% in 2025 alone, and the IEA expects it to more than triple again by 2030. Even then, generative AI would use about ${pct(byYear[2].v / G.scenarios.y2030.worldElecTWh * 100)} of the world's electricity.`;
    story.charts.growth = () => C.rowChart($("#chart-growth"), byYear.map(b => ({ key: b.k, label: `${b.y}${b.y === 2030 ? " (projection)" : ""}`, value: b.v, lo: b.lo, hi: b.hi, highlight: true,
      tip: `<b>${b.y}</b><br>${num(b.v)} TWh (range ${num(b.lo)}–${num(b.hi)})<br><span class="t-sub">${esc(b.note)}</span>` })),
      { scale: "linear", mode: "bar", format: v => num(v), axisLabel: "TWh" });
    foot("growth", { srcs: ["ieaKq2026", "iea2025"], more: "#totals", moreLabel: "Try another year" });

    // The whole life cycle
    const tot = r.co2.total, st = r.co2.stages;
    const JOURNEY = [
      { id: "A1", lines: ["Mining &", "materials"], phase: "Make" },
      { id: "A2", lines: ["Chip", "factories"], phase: "Make" },
      { id: "A3", lines: ["Assembly &", "shipping"], phase: "Make" },
      { id: "B1", lines: ["Building", "data centres"], phase: "Build" },
      { id: "C1", lines: ["Training", "models"], phase: "Run" },
      { id: "C2", lines: ["Answering", "requests"], phase: "Run" },
      { id: "C3", lines: ["Cooling &", "overhead"], phase: "Run" },
      { id: "D1", lines: ["Thrown", "away"], phase: "Retire" }
    ].map(j => ({ ...j, color: `var(--s-${j.id})`, share: st[j.id] != null ? st[j.id] / tot : null,
      valueText: st[j.id] != null ? pct(st[j.id] / tot * 100) : `${sig(r.materials.ewasteKt)} kt` }));
    const infer = st.C2 / tot;
    $("#h-lifecycle").innerHTML = `It's not only <em>using</em> AI: we count the whole life cycle`;
    $("#body-lifecycle").textContent = `Before anyone types a prompt, metals are mined, chips are made, servers are shipped and data centres are built. Then models are trained, answer requests, and everything is cooled. After about five years the hardware is thrown away. Answering requests is the largest part, about ${pct(infer * 100)} of the carbon; the rest comes from the other stages.`;
    story.players.lifecycle = Pictos.journey($("#viz-lifecycle"), { stages: JOURNEY, label: "Life-cycle stages sized by share of CO₂e" });
    $("#key-lifecycle").innerHTML = `Circle area = share of generative AI's carbon footprint in 2024. The last stage is shown as waste in thousand tonnes, because its carbon is small and not modelled.`;
    const groups = [
      { key: "Making", label: "Making chips, servers & buildings", ids: ["A1", "A2", "A3", "B1"], color: "var(--s-A2)" },
      { key: "Training", label: "Training models", ids: ["C1"], color: "var(--s-C1)" },
      { key: "Answering", label: "Answering requests", ids: ["C2"], color: "var(--s-C2)" },
      { key: "Cooling", label: "Cooling & building overhead", ids: ["C3"], color: "var(--s-C3)", ink: "#111916" }
    ];
    story.charts.lifecycle = () => {
      const host = $("#chart-lifecycle");
      if (!host.querySelector(".stack-row")) host.innerHTML = [["co2", "Carbon"], ["water", "Water"]].map(([m, l]) =>
        `<div class="stack-row"><div class="rl"><b>${l}</b></div><div class="chart" id="ss-${m}"></div></div>`).join("") +
        `<div class="legend" style="margin-top:.6rem">${groups.map(g => `<span><span class="swatch" style="background:${g.color}"></span>${g.label}</span>`).join("")}</div>`;
      ["co2", "water"].forEach(m => {
        const t = r[m].total, unit = m === "co2" ? "Mt CO₂e" : "billion L";
        C.stackedBar($(`#ss-${m}`), groups.map(g => {
          const v = g.ids.reduce((a, id) => a + (r[m].stages[id] || 0), 0);
          return { key: g.key, value: v, color: g.color, labelInk: g.ink || "#ffffff", tip: `<b>${g.label}</b><br>${num(v)} ${unit} · ${pct(v / t * 100)}` };
        }));
      });
    };
    foot("lifecycle", { srcs: ["iea2025", "nvidiaH100pcf", "schneider2025", "dcLca2025", "wang2024"], more: "#lifecycle", moreLabel: "All eight stages, calculated" });

    // Compared with the world
    renderWorldStory(r);

    // 8 · Unknowns
    $("#range-note").innerHTML = `Because of these unknowns, the climate impact in 2024 could be anywhere from ${sig(clo)} to ${sig(chi)} million tonnes CO₂e, and water from ${sig(wlo)} to ${sig(whi)} billion litres.`;

    Object.values(story.charts).forEach(fn => fn());
    document.querySelectorAll("[data-count]").forEach(n => { n._n = story.counts[n.dataset.count]; n.textContent = countFmt(n.dataset.count, story.counts[n.dataset.count]); });
    state.scenario = saved;
  }

  function renderWorldStory(r) {
    const m = state.storyWorld;
    const SEG = ["var(--s-A1)", "var(--s-A2)", "var(--s-A3)", "var(--s-B1)", "var(--s-C3)", "var(--s-C2)"];
    const INK = { "var(--s-A3)": "#111916", "var(--s-B1)": "#111916", "var(--s-C3)": "#111916" };
    const sh = (v, t) => pct(v / t * 100);
    let levels, headline, body, srcs;
    if (m === "energy") {
      const S = G.sectors.energy, world = S.rows.reduce((a, b) => a + b.value, 0);
      const comm = S.rows.find(x => x.nest === "dc").value, dc = G.scenarios.y2024.dcTWh, gen = r.energy.total;
      levels = [
        { title: "World electricity use", note: `${num(world)} TWh · shares ${S.rows[0].unverified ? "2022 †" : ""}`,
          segs: S.rows.map((x, i) => ({ label: x.label.replace(" (rail, EVs)", "").replace(", fishing & other", ""), value: x.value, color: SEG[i], ink: INK[SEG[i]], focus: !!x.nest })) },
        { title: "Commercial & public services", note: `${num(comm)} TWh`,
          segs: [{ label: "Offices, shops, hospitals, schools…", value: comm - dc, color: "var(--neutral-mark)", ink: "#111916" },
                 { label: "Data centres", value: dc, color: "var(--muted)", focus: true, inline: false, callout: `All data centres: ${sh(dc, comm)}` }] },
        { title: "All data centres", note: `${num(dc)} TWh, 2024`,
          segs: [{ label: "Websites, streaming, cloud, other AI…", value: dc - gen, color: "var(--neutral-mark)", ink: "#111916" },
                 { label: "Generative AI", value: gen, color: "var(--accent)", callout: `Generative AI: ${sh(gen, dc)}` }] }
      ];
      headline = `Generative AI uses about <em>${pct(gen / world * 100)}</em> of the world's electricity`;
      body = `That is about 1 in every ${num(Math.round(world / gen / 10) * 10, 0)} kilowatt-hours. Factories use about ${sh(S.rows[0].value, world)}, homes ${sh(S.rows[1].value, world)}. All data centres together use about ${sh(dc, world)}, and generative AI is roughly a ninth of that.`;
      srcs = ["ieaElecSector", "ieaGer2025", "owidElec", "iea2025"];
    } else {
      const S = G.sectors.co2;
      const grp = [
        ["Electricity & heat", ["Electricity & heat"], true],
        ["Industry", ["Manufacturing & construction (energy)", "Industrial processes", "Fugitive emissions (oil, gas, coal)"]],
        ["Transport", ["Road, rail & domestic transport", "International aviation & shipping"]],
        ["Farming & land", ["Agriculture", "Land-use change & forestry (net)"]],
        ["Buildings", ["Buildings (heating, cooking)"]],
        ["Waste & other", ["Waste", "Other fuel combustion"]]
      ].map(([label, rows, focus]) => ({ label, value: rows.reduce((a, l) => a + S.rows.find(x => x.label === l).value, 0), focus: !!focus }));
      const world = grp.reduce((a, b) => a + b.value, 0), elec = grp[0].value, dc = G.scenarios.y2024.dcCo2Mt, gen = r.co2.operational;
      levels = [
        { title: "World greenhouse-gas emissions", note: `${num(world)} Mt CO₂e, 2023`,
          segs: grp.map((x, i) => ({ ...x, color: SEG[i], ink: INK[SEG[i]] })) },
        { title: "Electricity & heat", note: `${num(elec)} Mt, 2023`,
          segs: [{ label: "Everything else that uses electricity", value: elec - dc, color: "var(--neutral-mark)", ink: "#111916" },
                 { label: "Data centres", value: dc, color: "var(--muted)", focus: true, inline: false, callout: `All data centres: ${sh(dc, elec)}` }] },
        { title: "All data centres", note: `${num(dc)} Mt, 2024`,
          segs: [{ label: "Websites, streaming, cloud, other AI…", value: dc - gen, color: "var(--neutral-mark)", ink: "#111916" },
                 { label: "Generative AI", value: gen, color: "var(--accent)", callout: `Generative AI: ${sh(gen, dc)}` }] }
      ];
      headline = `Generative AI causes about <em>${pct(r.co2.total / world * 100)}</em> of the world's greenhouse-gas emissions`;
      body = `Electricity and heat cause about ${sh(elec, world)} of the world's emissions, industry ${sh(grp[1].value, world)}, transport ${sh(grp[2].value, world)} and farming ${sh(grp[3].value, world)}. All data centres together cause about ${sh(dc, world)}. Generative AI is small, but it is one of the fastest-growing parts.`;
      srcs = ["owidGhgSector", "iea2025"];
    }
    $("#h-world-story").innerHTML = headline;
    $("#body-world").textContent = body;
    story.players.world = Pictos.zoomCascade($("#viz-world"), { levels, label: "Zoom from the world total to generative AI" });
    const top = levels[0].segs, tt = top.reduce((a, x) => a + x.value, 0);
    $("#key-world").innerHTML = top.map(x => `<span><span class="swatch" style="background:${x.color}"></span>${esc(x.label)} ${sh(x.value, tt)}</span>`).join("");
    foot("world", { srcs, more: "#world", moreLabel: "Sector by sector, in detail" });
  }

  const countFmt = (key, v) => key === "growth" ? num(v, 1) : sig(v);
  function initStoryObserver() {
    const chapters = [...document.querySelectorAll(".chapter")];
    const dots = $("#chapter-dots");
    dots.innerHTML = chapters.map(ch => `<a href="#${ch.id}"><span>${esc(ch.dataset.chapter)}</span></a>`).join("");
    if (!("IntersectionObserver" in window)) return;
    const played = new Set();
    const replay = ch => {
      const id = ch.id.replace("ch-", "");
      if (played.has(id) || C.reduceMotion) return;
      played.add(id);
      story.players[id] && story.players[id].play();
      const count = ch.querySelector("[data-count]");
      if (count) { count._n = 0.001; C.tweenNumber(count, story.counts[count.dataset.count], v => countFmt(count.dataset.count, v), 1100); }
      ch.querySelectorAll(".chart").forEach(c => { c._chart = null; });
      story.charts[id] && story.charts[id]();
    };
    const io = new IntersectionObserver(entries => entries.forEach(en => { if (en.isIntersecting) replay(en.target); }), { threshold: 0.3 });
    chapters.forEach(ch => io.observe(ch));
    const links = [...dots.querySelectorAll("a")];
    const active = new IntersectionObserver(entries => entries.forEach(en => {
      if (!en.isIntersecting) return;
      links.forEach(a => a.setAttribute("aria-current", String(a.getAttribute("href") === "#" + en.target.id)));
    }), { rootMargin: "-45% 0px -45% 0px" });
    chapters.forEach(ch => active.observe(ch));
    const story_ = $("#intro");
    new IntersectionObserver(es => es.forEach(en => dots.classList.toggle("show", en.isIntersecting)), { threshold: 0 }).observe(story_);
  }

  // ---------- Orchestration ----------
  let raf = 0;
  function renderAll() {
    cancelAnimationFrame(raf);
    raf = requestAnimationFrame(() => {
      run();
      renderTiles(); renderStacks(); renderStageTable(); renderMaterials();
      renderWorld(); renderContext(); renderAssumptions(); renderCross();
    });
  }

  // Offline support when served over http(s); opening the file directly skips it.
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) {
    window.addEventListener("load", () => navigator.serviceWorker.register("sw.js").catch(() => {}));
  }

  document.addEventListener("DOMContentLoaded", () => {
    applyTheme();
    initSegs();
    renderPhaseStrip();
    buildAssumptions();
    syncSliders();
    renderBib();
    initExport();
    run();
    renderStory();
    initStoryObserver();
    renderAll();
    renderApps();
    let w = window.innerWidth;
    window.addEventListener("resize", () => {
      if (Math.abs(window.innerWidth - w) < 8) return;
      w = window.innerWidth;
      document.querySelectorAll(".seg").forEach(placeThumb);
      document.querySelectorAll(".chart").forEach(c => { c._chart = null; });
      renderStory(); renderAll(); renderApps();
      document.querySelectorAll("#adp-chart .chart").forEach(c => { c._chart = null; });
    });
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => document.querySelectorAll(".seg").forEach(placeThumb));
  });
})();
