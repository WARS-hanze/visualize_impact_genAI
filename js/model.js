/*
 * GenAI life-cycle model. Pure functions: inputs in, numbers + derivation traces out.
 * Units: energy TWh · CO₂e Mt · water GL (= billion litres) · mass kt.
 * Works in the browser (window.GENAI) and in Node (module.exports) for tests.
 */
(function (root) {
  const G = root.GENAI = root.GENAI || {};

  G.stages = [
    { id: "A1", phase: "Embodied · hardware", label: "Raw materials & upstream supply",
      desc: "Mining and refining metals, purifying silicon, making wafers, chemicals and process gases." },
    { id: "A2", phase: "Embodied · hardware", label: "Chip & component manufacturing",
      desc: "GPU/TPU dies, HBM memory, CPUs, boards: fab electricity, fluorinated gases, ultra-pure water." },
    { id: "A3", phase: "Embodied · hardware", label: "Assembly & transport",
      desc: "Building servers and racks, and shipping them to the data centre." },
    { id: "B1", phase: "Embodied · facility", label: "Data-centre construction",
      desc: "Concrete, steel, power and cooling plant, amortised over the building's life." },
    { id: "C1", phase: "Operation", label: "Training",
      desc: "Electricity for training and experimenting with models (IT load only)." },
    { id: "C2", phase: "Operation", label: "Inference",
      desc: "Electricity for answering prompts and generating images (IT load only)." },
    { id: "C3", phase: "Operation", label: "Cooling & facility overhead",
      desc: "Cooling, power conversion and lighting (PUE − 1), plus on-site cooling water." },
    { id: "D1", phase: "End of life", label: "E-waste",
      desc: "Retired servers and accelerators. Mass is counted under materials; CO₂e and water are small and not modelled." }
  ];

  /* Resolve parameter values: defaults ← scenario defaults ← user overrides. */
  G.resolveParams = function (scenarioKey, overrides) {
    const sc = G.scenarios[scenarioKey];
    const out = {};
    for (const [k, p] of Object.entries(G.params)) out[k] = p.value;
    Object.assign(out, sc.defaults || {});
    Object.assign(out, overrides || {});
    return out;
  };

  const fmt = (x, d = 2) => {
    if (!isFinite(x)) return "–";
    const a = Math.abs(x);
    const digits = a >= 100 ? 0 : a >= 10 ? 1 : a >= 1 ? d : a >= 0.01 ? 3 : 4;
    return x.toLocaleString("en-US", { maximumFractionDigits: digits });
  };
  G.fmt = fmt;

  /*
   * mode: "amortised" (installed base ÷ lifetime, the usual LCA convention) or
   *       "buildout"  (what is actually manufactured / built this year in a growing fleet)
   */
  G.compute = function (scenarioKey, p, mode = "amortised") {
    const sc = G.scenarios[scenarioKey];
    const t = {}; // traces

    const accelTWh = sc.dcTWh * sc.accelShare;
    const itTWh = accelTWh * p.genaiShare;
    const facTWh = itTWh * p.pue;
    t.it = `${fmt(sc.dcTWh)} TWh all data centres × ${fmt(sc.accelShare * 100)}% on accelerated servers × ${fmt(p.genaiShare * 100)}% generative AI = ${fmt(itTWh)} TWh (IT load)`;

    // Hardware fleet
    const nAccel = itTWh * 1e9 / (p.accelKW * 8760);
    const g = p.accelGrowth;
    const retire = mode === "buildout" ? nAccel / (1 + g) / p.hwLife : nAccel / p.hwLife;
    const hwFlow = mode === "buildout" ? nAccel * g / (1 + g) + retire : retire;
    t.fleet = `${fmt(itTWh)} TWh ÷ (${fmt(p.accelKW)} kW × 8,760 h) ≈ ${fmt(nAccel / 1e6)} million accelerators in service`;
    t.hwFlow = mode === "buildout"
      ? `New units this year = fleet × ${fmt(g * 100)}% growth ÷ ${fmt(1 + g)} + replacements (fleet ÷ ${fmt(1 + g)} ÷ ${p.hwLife} yr) ≈ ${fmt(hwFlow / 1e6)} million`
      : `Amortised: ${fmt(nAccel / 1e6)} million ÷ ${p.hwLife}-year life ≈ ${fmt(hwFlow / 1e6)} million accelerators' worth per year`;

    // Facilities
    const capMW = facTWh * 1e6 / 8760 / p.loadFactor;
    const dcFlow = mode === "buildout"
      ? capMW * g / (1 + g) + capMW / (1 + g) / p.dcLife
      : capMW / p.dcLife;
    t.cap = `${fmt(facTWh)} TWh ÷ 8,760 h ÷ ${fmt(p.loadFactor * 100)}% load ≈ ${fmt(capMW / 1000)} GW of built capacity`;
    t.dcFlow = mode === "buildout"
      ? `New capacity this year ≈ ${fmt(dcFlow / 1000)} GW (growth + replacements)`
      : `Amortised: ${fmt(capMW / 1000)} GW ÷ ${p.dcLife} yr ≈ ${fmt(dcFlow / 1000)} GW per year`;

    // ---- Energy (operational electricity)
    const energy = {
      C1: itTWh * p.trainShare,
      C2: itTWh * (1 - p.trainShare),
      C3: itTWh * (p.pue - 1)
    };
    const et = {
      C1: `${t.it} × ${fmt(p.trainShare * 100)}% training = ${fmt(energy.C1)} TWh`,
      C2: `${fmt(itTWh)} TWh × ${fmt((1 - p.trainShare) * 100)}% inference = ${fmt(energy.C2)} TWh`,
      C3: `${fmt(itTWh)} TWh × (PUE ${fmt(p.pue)} − 1) = ${fmt(energy.C3)} TWh`
    };

    // ---- CO2e
    const hwCo2 = hwFlow * p.hwEmbodied / 1e9;
    const co2 = {
      A1: hwCo2 * p.rawShare,
      A2: hwCo2 * (1 - p.rawShare - p.assemblyShare),
      A3: hwCo2 * p.assemblyShare,
      B1: dcFlow * p.dcEmbodied / 1e6,
      C1: energy.C1 * p.ci / 1000,
      C2: energy.C2 * p.ci / 1000,
      C3: energy.C3 * p.ci / 1000
    };
    const hwTxt = `${t.hwFlow}; × ${fmt(p.hwEmbodied)} kg CO₂e each = ${fmt(hwCo2)} Mt`;
    const ct = {
      A1: `${t.fleet}. ${hwTxt}; × ${fmt(p.rawShare * 100)}% raw-material share = ${fmt(co2.A1)} Mt`,
      A2: `${hwTxt}; × ${fmt((1 - p.rawShare - p.assemblyShare) * 100)}% chip & component share = ${fmt(co2.A2)} Mt`,
      A3: `${hwTxt}; × ${fmt(p.assemblyShare * 100)}% assembly & transport = ${fmt(co2.A3)} Mt`,
      B1: `${t.cap}. ${t.dcFlow} × ${fmt(p.dcEmbodied)} t CO₂e/MW = ${fmt(co2.B1)} Mt`,
      C1: `${fmt(energy.C1)} TWh × ${fmt(p.ci)} g/kWh = ${fmt(co2.C1)} Mt`,
      C2: `${fmt(energy.C2)} TWh × ${fmt(p.ci)} g/kWh = ${fmt(co2.C2)} Mt`,
      C3: `${fmt(energy.C3)} TWh × ${fmt(p.ci)} g/kWh = ${fmt(co2.C3)} Mt`
    };

    // ---- Water (consumption)
    const hwWater = hwFlow * p.hwWater / 1e9;
    const onsite = itTWh * p.wue;
    const water = {
      A1: hwWater * (1 - p.upwShare),
      A2: hwWater * p.upwShare,
      C1: energy.C1 * p.ewif,
      C2: energy.C2 * p.ewif,
      C3: onsite + energy.C3 * p.ewif
    };
    const wt = {
      A1: `${t.hwFlow} × ${fmt(p.hwWater)} L = ${fmt(hwWater)} GL; × ${fmt((1 - p.upwShare) * 100)}% upstream = ${fmt(water.A1)} GL`,
      A2: `${fmt(hwWater)} GL manufacturing water × ${fmt(p.upwShare * 100)}% chip fabrication = ${fmt(water.A2)} GL`,
      C1: `${fmt(energy.C1)} TWh × ${fmt(p.ewif)} L/kWh at power plants = ${fmt(water.C1)} GL`,
      C2: `${fmt(energy.C2)} TWh × ${fmt(p.ewif)} L/kWh at power plants = ${fmt(water.C2)} GL`,
      C3: `On-site: ${fmt(itTWh)} TWh × ${fmt(p.wue)} L/kWh = ${fmt(onsite)} GL; plus overhead electricity ${fmt(energy.C3)} TWh × ${fmt(p.ewif)} L/kWh = ${fmt(energy.C3 * p.ewif)} GL`
    };
    const waterScope = {
      onsite,
      offsite: (energy.C1 + energy.C2 + energy.C3) * p.ewif,
      supply: hwWater
    };

    // ---- Materials
    const hwIntakeKt = hwFlow * p.hwMass / 1e6;
    const ewasteKt = retire * p.hwMass / 1e6;
    const copperKt = dcFlow * p.copperPerMW / 1000;
    const materials = {
      hwIntakeKt, ewasteKt, copperKt,
      ewasteRecycledKt: ewasteKt * p.recycledShare,
      ewasteOtherKt: ewasteKt * (1 - p.recycledShare)
    };
    const mt = {
      hwIntakeKt: `${t.hwFlow} × ${fmt(p.hwMass)} kg = ${fmt(hwIntakeKt)} kt of servers & accelerators`,
      ewasteKt: `${fmt(retire / 1e6)} million accelerators retired × ${fmt(p.hwMass)} kg = ${fmt(ewasteKt)} kt; ${fmt(p.recycledShare * 100)}% formally recycled at the global average rate`,
      copperKt: `${t.dcFlow} × ${fmt(p.copperPerMW)} t/MW = ${fmt(copperKt)} kt copper`
    };

    const sum = o => Object.values(o).reduce((a, b) => a + b, 0);
    return {
      scenario: scenarioKey, mode,
      derived: { accelTWh, itTWh, facTWh, nAccel, hwFlow, retire, capMW, dcFlow },
      energy: { stages: energy, total: sum(energy), traces: et },
      co2: { stages: co2, total: sum(co2), traces: ct, operational: co2.C1 + co2.C2 + co2.C3 },
      water: { stages: water, total: sum(water), traces: wt, scope: waterScope },
      materials: { ...materials, traces: mt },
      traces: t
    };
  };

  /*
   * Low/high envelope: every parameter the reader has not touched moves to its
   * low-impact (or high-impact) case at once. This is a deliberately wide bracket,
   * not a statistical confidence interval.
   */
  G.computeRange = function (scenarioKey, overrides, mode) {
    const lowP = {}, highP = {};
    for (const [k, p] of Object.entries(G.params)) {
      if (overrides && k in overrides) continue;
      lowP[k] = p.lowCase; highP[k] = p.highCase;
    }
    // Scenario-specific carbon intensity keeps its spread relative to the scenario default.
    const sc = G.scenarios[scenarioKey];
    if (!(overrides && "ci" in overrides) && sc.defaults && sc.defaults.ci) {
      lowP.ci = sc.defaults.ci * 250 / 434; highP.ci = sc.defaults.ci * 500 / 434;
    }
    const lo = G.compute(scenarioKey, G.resolveParams(scenarioKey, { ...overrides, ...lowP }), mode);
    const hi = G.compute(scenarioKey, G.resolveParams(scenarioKey, { ...overrides, ...highP }), mode);
    return { lo, hi };
  };

  if (typeof module !== "undefined") module.exports = G;
})(typeof window !== "undefined" ? window : globalThis);
