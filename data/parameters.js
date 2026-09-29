/*
 * Model inputs. Each parameter carries:
 *   value      central default (may be overridden per scenario in `scenarios[..].defaults`)
 *   lowCase / highCase   the values used for the low- and high-impact envelope
 *                        (so for a lifetime, lowCase is the LONGER life)
 *   tier       reported | modelled | derived | estimate  (see methodology)
 *   sources    ids from data/sources.js
 *   rationale  how the number was chosen / derived, in plain words
 *   slider     present when the reader can change it on the page
 */
window.GENAI = window.GENAI || {};

window.GENAI.scenarios = {
  y2024: {
    label: "2024",
    note: "IEA estimate for 2024",
    dcTWh: 415,
    accelShare: 0.15,
    worldElecTWh: 30930,
    dcCo2Mt: 180,
    combustionCo2Mt: 35000,
    dcWaterGL: 560,
    trace: {
      dcTWh: "IEA 2025: ≈415 TWh in 2024.",
      accelShare: "IEA 2025 p.56: accelerated servers = 15% of total data-centre demand in 2024.",
      worldElecTWh: "OWID/Ember: 30,930 TWh world electricity demand 2024.",
      dcCo2Mt: "IEA 2025 p.245: ≈180 Mt indirect CO₂ 'today'.",
      dcWaterGL: "IEA 2025 Box 5.4: ≈560 billion L consumption (2023 value, used for 2024)."
    },
    sources: ["iea2025", "owidElec"],
    defaults: { ci: 434 }
  },
  y2025: {
    label: "2025",
    note: "IEA 2026 estimate for 2025",
    dcTWh: 485,
    accelShare: 0.193,
    worldElecTWh: 31772,
    dcCo2Mt: 210,
    combustionCo2Mt: 35000,
    dcWaterGL: 696,
    trace: {
      dcTWh: "IEA 2026: ≈485 TWh in 2025 (+17%).",
      accelShare: "IEA 2026: AI-focused data centres' electricity grew 50% in 2025. Applied to 2024 accelerated-server use: 62 TWh × 1.5 = 93 TWh; 93 / 485 = 19.3%.",
      worldElecTWh: "OWID/Ember: 31,772 TWh world electricity demand 2025.",
      dcCo2Mt: "485 TWh × 434 g/kWh (the IEA 2024 ratio 180 Mt / 415 TWh) ≈ 210 Mt.",
      dcWaterGL: "Log-linear interpolation between IEA 560 GL (2023) and 1,200 GL (2030): 560 × (1200/560)^(2/7) ≈ 696 GL."
    },
    sources: ["ieaKq2026", "iea2025", "owidElec"],
    defaults: { ci: 434 }
  },
  y2030: {
    label: "2030",
    note: "IEA 2026 Base Case projection",
    dcTWh: 950,
    accelShare: 0.295,
    worldElecTWh: 31700,
    dcCo2Mt: 350,
    combustionCo2Mt: 35000,
    dcWaterGL: 1200,
    trace: {
      dcTWh: "IEA 2026 Base Case: ≈950 TWh in 2030.",
      accelShare: "IEA 2026: AI-focused data centres more than triple from 2025 to 2030 (to ≈465 TWh). Applied to accelerated-server use: 93 TWh × 3 = 280 TWh; 280 / 950 = 29.5%.",
      worldElecTWh: "950 TWh is 'around 3%' of world demand (IEA 2026) → ≈31,700 TWh.",
      dcCo2Mt: "IEA 2025: data-centre emissions rise to ≈1% of ≈35,000 Mt combustion CO₂ in 2030 → ≈350 Mt.",
      dcWaterGL: "IEA 2025 Box 5.4: ≈1,200 billion L in 2030 (Base Case)."
    },
    sources: ["ieaKq2026", "iea2025"],
    defaults: { ci: 370 }
  }
};

window.GENAI.params = {
  genaiShare: {
    label: "Generative AI share of accelerated-server electricity",
    unit: "%", scale: 100, digits: 0,
    value: 0.6, lowCase: 0.4, highCase: 0.8,
    slider: { min: 0.2, max: 1, step: 0.05 },
    tier: "estimate",
    sources: ["iea2025", "ieaKq2026", "wu2022"],
    rationale: "No operator publishes this, and the IEA says there is no comprehensive data on workload shares. Accelerated (GPU/TPU) servers also run recommendation, vision and scientific workloads; before 2023 Meta's AI fleet mostly served recommendation models. Since 2023 most new accelerator capacity was bought for language and image models, and IEA 2026 reports AI-focused data centres grew 50% in 2025. We take 60% as the central value and 40–80% as the range. This is the least certain input, and it scales every result."
  },
  trainShare: {
    label: "Training share of GenAI compute",
    unit: "%", scale: 100, digits: 0,
    value: 0.3, lowCase: 0.3, highCase: 0.3,
    slider: { min: 0.05, max: 0.7, step: 0.05 },
    tier: "reported", dated: true,
    sources: ["patterson2022", "wu2022"],
    rationale: "Google: about ⅖ of ML energy for training, ⅗ for inference (2019–2021). Meta: power capacity 10:20:70 for experimentation, training and inference; experimentation counts as training here. Both are pre-ChatGPT and self-reported, and no newer public split exists. With chat use growing fast since 2023, 30% is the central value. This setting moves impact between stages; it does not change totals."
  },
  pue: {
    label: "Power usage effectiveness (PUE) of GenAI facilities",
    unit: "", scale: 1, digits: 2,
    value: 1.25, lowCase: 1.09, highCase: 1.54,
    slider: { min: 1.05, max: 1.8, step: 0.01 },
    tier: "reported",
    sources: ["googleEnv2025", "ieaKq2026", "lbnl2024", "iea2025", "uptime2025"],
    rationale: "Total facility energy ÷ IT energy. Best-in-class hyperscale: 1.09 (Google, self-reported) and 1.1–1.2 (IEA 2026). US average across all data centres: 1.4 in 2023, with hyperscale and colocation below that (LBNL). World average: 1.41 (IEA). Industry survey average: 1.54 (Uptime, mostly enterprise and colocation). GenAI runs mostly in hyperscale and large colocation sites, so the central value is 1.25. The range runs from the best reported fleet to the survey average."
  },
  ci: {
    label: "Grid carbon intensity",
    unit: "g CO₂e/kWh", scale: 1, digits: 0,
    value: 434, lowCase: 250, highCase: 500,
    slider: { min: 0, max: 800, step: 5 },
    tier: "derived",
    sources: ["iea2025", "lbnl2024", "devriesgao2025"],
    rationale: "Location-based (the physical grid mix; renewable-energy certificates are not subtracted). IEA: 180 Mt CO₂ ÷ 415 TWh = 434 g per kWh consumed for data centres worldwide in 2024; the IEA's intensity of generation for data centres is 396 g/kWh, and grid losses of about 9% bridge the two. ≈370 g/kWh implied for 2030. LBNL: 340 g/kWh for US data centres in 2023. Big US tech companies report 320–350 g/kWh; Baidu and Tencent 640 and 570. Company per-prompt figures (such as Google's 0.03 g) are market-based and therefore much lower."
  },
  wue: {
    label: "On-site water use (WUE)",
    unit: "L/kWh (IT)", scale: 1, digits: 2,
    value: 0.55, lowCase: 0.2, highCase: 1.0,
    slider: { min: 0, max: 2, step: 0.05 },
    tier: "reported",
    sources: ["iea2025", "devriesgao2025", "lbnl2024", "li2023"],
    rationale: "Water evaporated on site for cooling, per kWh of IT load. IEA 2023, as derived by de Vries-Gao: 140 billion L ÷ (360 TWh ÷ 1.43) = 0.56. LBNL-derived: 66 billion L ÷ (176 TWh ÷ 1.4) = 0.52 for the US. Microsoft US average used by Li et al.: 0.55. Large tech companies' weighted average: 0.59 per kWh of total use. Google global: about 1. Central value 0.55. (An earlier version divided 2023 water by 2024 electricity and got 0.48; corrected.) Closed-loop liquid cooling approaches zero."
  },
  ewif: {
    label: "Water intensity of electricity generation",
    unit: "L/kWh", scale: 1, digits: 2,
    value: 1.04, lowCase: 0.68, highCase: 4.5,
    slider: { min: 0, max: 5, step: 0.05 },
    tier: "derived",
    sources: ["iea2025", "devriesgao2025", "li2023", "lbnl2024"],
    rationale: "Water consumed off site by power plants and fuel supply. IEA 2023 world average for data centres: 373 billion L ÷ 360 TWh ≈ 1.04 L/kWh (an earlier version divided by 2024 electricity and got 0.9; corrected). US grids at hyperscale sites range from 0.68 to 11.98 L/kWh (de Vries-Gao; hydropower reservoirs drive the top). US figures are much higher: 3.1 (WRI, cited by Li et al.), 3.7 (Meta, self-reported) and 4.52 (LBNL, US data-centre locations). The global central value follows the IEA; the high end follows LBNL."
  },
  hwLife: {
    label: "Accelerator service life",
    unit: "years", scale: 1, digits: 0,
    value: 5, lowCase: 6, highCase: 4,
    slider: { min: 2, max: 8, step: 1 },
    tier: "reported",
    sources: ["iea2025", "schneider2025", "wang2024"],
    rationale: "IEA assumes 5 years of server operation; Google assumes 6 for TPUs; Wang et al. use 3 years for AI servers, based on the historical lifespan of computing devices. The central value is 5; the service-life slider goes down to 2."
  },
  accelKW: {
    label: "Average draw per accelerator, incl. its share of host server",
    unit: "kW", scale: 1, digits: 2,
    value: 0.8, lowCase: 1.1, highCase: 0.6,
    tier: "reported",
    sources: ["lbnl2024", "dgxh100", "nvidiaH100pcf"],
    rationale: "LBNL assumes AI servers run at 70% of rated power (60–80%), based on measured H100 nodes averaging 74%. Rated power per 8-GPU server is ≈8 kW for a mixed fleet and 10.2 kW for a DGX H100, giving 0.70–0.89 kW per GPU. A higher draw means fewer accelerators for the same energy, so it is the low-impact case for embodied impacts."
  },
  hwEmbodied: {
    label: "Embodied CO₂e per accelerator, incl. host-server share",
    unit: "kg CO₂e", scale: 1, digits: 0,
    value: 500, lowCase: 300, highCase: 900,
    tier: "reported",
    sources: ["nvidiaH100pcf", "schneider2025", "a100lca2025"],
    rationale: "Card or board only: 128 kg (A100 LCA) and 164 kg per GPU (NVIDIA H100 PCF). Including the host server but excluding data-centre construction: ≈327–883 kg per Google TPU machine. The host's CPUs, DRAM, storage and chassis add a few hundred kg per accelerator. Central value 500 kg. Construction is counted separately in stage B1."
  },
  rawShare: {
    label: "Share of hardware embodied CO₂e from raw materials & upstream supply",
    unit: "%", scale: 100, digits: 0,
    value: 0.15, lowCase: 0.15, highCase: 0.15,
    tier: "estimate",
    sources: ["nvidiaH100pcf", "iea2025"],
    rationale: "NVIDIA's PCF reports 'materials & components' as one block (91%). Chip-fab LCAs attribute most wafer emissions to fab electricity and fluorinated process gases, with upstream materials (silicon, chemicals, metals) a smaller part. We assign 15% to mining, refining and upstream supply. This only splits the hardware total between stages A1 and A2."
  },
  assemblyShare: {
    label: "Share of hardware embodied CO₂e from assembly & transport",
    unit: "%", scale: 100, digits: 1,
    value: 0.09, lowCase: 0.09, highCase: 0.09,
    tier: "reported",
    sources: ["nvidiaH100pcf"],
    rationale: "NVIDIA HGX H100 PCF: assembly 8.6% + transport 0.4%."
  },
  hwWater: {
    label: "Manufacturing water per accelerator, incl. host-server chips",
    unit: "L", scale: 1, digits: 0,
    value: 1000, lowCase: 500, highCase: 3700,
    tier: "estimate",
    sources: ["tsmc2023", "iea2025"],
    rationale: "Water consumed (not returned) in chip-making. TSMC 2023: 176.4 L drawn per 12-inch wafer mask layer, of which 132.8 L returns as wastewater, so ≈44 L is consumed. Assuming 60–80 mask layers for an advanced chip (our assumption) gives ≈2,600–3,500 L per wafer. One accelerator with its HBM stacks and share of host CPUs and DRAM takes roughly 0.2–0.5 wafer-equivalents (our assumption), or about 1,000 L. The high case counts all water drawn (≈3,700 L). IEA: almost 90% of manufacturing water is ultra-pure water."
  },
  hwMass: {
    label: "Hardware mass per accelerator, incl. host server",
    unit: "kg", scale: 1, digits: 0,
    value: 16, lowCase: 12, highCase: 25,
    tier: "estimate",
    sources: ["nvidiaH100pcf", "a100lca2025", "dgxh100"],
    rationale: "Verified parts: the 8-GPU H100 baseboard weighs 24 kg (3 kg per GPU) and an A100 card 1.5 kg. A full DGX H100 system weighs 130 kg at most (16 kg per GPU; NVIDIA user guide). Racks, switches and cabling would push this higher."
  },
  dcEmbodied: {
    label: "Embodied CO₂e of facility per MW of capacity",
    unit: "t CO₂e/MW", scale: 1, digits: 0,
    value: 1829, lowCase: 1000, highCase: 2400,
    tier: "reported",
    sources: ["dcLca2025"],
    rationale: "1,829 t CO₂e per MW at construction (building, power and cooling plant), 2,400 t including 20 years of replacements. This comes from a model of scientific computing centres; no public LCA of a hyperscale AI campus was found."
  },
  dcLife: {
    label: "Facility lifetime", unit: "years", scale: 1, digits: 0,
    value: 20, lowCase: 20, highCase: 20,
    tier: "reported", sources: ["schneider2025", "dcLca2025"],
    rationale: "Data-centre buildings are amortised over 20 years in both source studies."
  },
  loadFactor: {
    label: "Average load ÷ built capacity", unit: "%", scale: 100, digits: 0,
    value: 0.7, lowCase: 0.85, highCase: 0.5,
    tier: "estimate", sources: [],
    rationale: "Facilities are built for peak load plus redundancy. We assume average draw is 70% of capacity, within a 50–85% range. This converts TWh into MW of buildings."
  },
  copperPerMW: {
    label: "Copper per MW of data-centre capacity", unit: "t/MW", scale: 1, digits: 0,
    value: 27, lowCase: 27, highCase: 40,
    tier: "estimate", sources: ["bhp2025", "iea2025"],
    rationale: "27 t/MW from a single Microsoft site, reported by a copper miner that in turn cites Visual Capitalist. No sourced figure exists for liquid-cooled AI halls, which use more copper; the high case assumes +50% (40 t/MW). An earlier version cited 47 t/MW to BHP, but that figure is not in BHP's article and has been removed. The IEA's independent total (512 kt copper for 2030 build-out) is shown as a cross-check."
  },
  accelGrowth: {
    label: "Annual growth of accelerator fleet", unit: "%/yr", scale: 100, digits: 0,
    value: 0.3, lowCase: 0.3, highCase: 0.3,
    tier: "modelled", sources: ["iea2025", "ieaKq2026"],
    rationale: "IEA 2025 Base Case: accelerated-server electricity grows 30% per year (IEA 2026 saw 50% in 2025). Only used in 'built this year' accounting."
  },
  recycledShare: {
    label: "E-waste formally collected & recycled", unit: "%", scale: 100, digits: 1,
    value: 0.223, lowCase: 0.223, highCase: 0.223,
    tier: "reported", sources: ["gem2024"],
    rationale: "Global average for all e-waste (2022). Data-centre hardware goes through IT-asset-disposal channels and is probably recycled at a higher rate, but no global figure exists."
  },
  upwShare: {
    label: "Share of manufacturing water used in chip fabrication", unit: "%", scale: 100, digits: 0,
    value: 0.9, lowCase: 0.9, highCase: 0.9,
    tier: "reported", sources: ["iea2025"],
    rationale: "IEA: almost 90% of manufacturing-stage water is ultra-pure water for chip-making. The rest is allocated to upstream supply."
  }
};

/* Order in which sliders appear. The rest are shown in the assumptions table. */
window.GENAI.sliderOrder = ["genaiShare", "trainShare", "ci", "pue", "wue", "ewif", "hwLife"];

/*
 * Cross-referenced evidence: the values independent sources report for each input.
 * Drawn as a strip next to the chosen value and its low–high band, and used for the
 * confidence rating. `partial: true` marks a value that covers only part of what the
 * parameter means (e.g. a GPU card without its host server).
 */
window.GENAI.evidence = {
  genaiShare: [],
  trainShare: [
    { value: 0.40, source: "patterson2022", label: "Google 2019–21 (pre-ChatGPT)" },
    { value: 0.30, source: "wu2022", label: "Meta 2021, experimentation + training (pre-ChatGPT)" }
  ],
  pue: [
    { value: 1.09, source: "googleEnv2025", label: "Google fleet 2024" },
    { value: 1.15, source: "ieaKq2026", label: "IEA: best-in-class hyperscale 1.1–1.2" },
    { value: 1.29, source: "iea2025", label: "IEA world average 2030" },
    { value: 1.40, source: "lbnl2024", label: "US average, all data centres 2023" },
    { value: 1.41, source: "iea2025", label: "IEA world average 2024" },
    { value: 1.54, source: "uptime2025", label: "Uptime survey average 2025" }
  ],
  ci: [
    { value: 170, source: "devriesgao2025", label: "Cleanest US hyperscale grid" },
    { value: 320, source: "devriesgao2025", label: "Big US tech companies, reported (low)" },
    { value: 340, source: "lbnl2024", label: "US data centres 2023" },
    { value: 370, source: "iea2025", label: "IEA-implied world data centres 2030" },
    { value: 396, source: "devriesgao2025", label: "IEA intensity of generation for data centres 2024" },
    { value: 434, source: "iea2025", label: "IEA-implied world data centres 2024" },
    { value: 460, source: "devriesgao2025", label: "Dirtiest US hyperscale grid" },
    { value: 570, source: "devriesgao2025", label: "Tencent, reported" },
    { value: 640, source: "devriesgao2025", label: "Baidu, reported" }
  ],
  wue: [
    { value: 0.56, source: "devriesgao2025", label: "IEA 2023 world average (derived by de Vries-Gao)" },
    { value: 0.59, source: "devriesgao2025", label: "Big tech companies' weighted average (per total kWh)" },
    { value: 0.52, source: "lbnl2024", label: "LBNL-implied US average 2023" },
    { value: 0.55, source: "li2023", label: "Microsoft US average (used by Li et al.)" },
    { value: 1.0, source: "li2023", label: "Google global on-site" }
  ],
  ewif: [
    { value: 0.68, source: "devriesgao2025", label: "Lowest US hyperscale grid" },
    { value: 1.04, source: "iea2025", label: "IEA 2023 world average (373 GL ÷ 360 TWh)" },
    { value: 3.1, source: "li2023", label: "US average (WRI, cited by Li et al.)" },
    { value: 3.7, source: "li2023", label: "Meta fleet 2023, self-reported" },
    { value: 4.52, source: "lbnl2024", label: "US data-centre locations 2023" }
  ],
  hwLife: [
    { value: 5, source: "iea2025", label: "IEA server lifetime" },
    { value: 6, source: "schneider2025", label: "Google TPU lifetime" },
    { value: 3, source: "wang2024", label: "Wang et al. baseline" }
  ],
  accelKW: [
    { value: 0.70, source: "lbnl2024", label: "Mixed GPU fleet: 8 kW rated × 70% ÷ 8" },
    { value: 0.70, source: "nvidiaH100pcf", label: "H100 baseboard typical power ÷ 8 (no host)", partial: true },
    { value: 0.89, source: "lbnl2024", label: "DGX H100: 10.2 kW × 70% ÷ 8" },
    { value: 1.275, source: "dgxh100", label: "DGX H100 at maximum power, per GPU" }
  ],
  hwEmbodied: [
    { value: 128, source: "a100lca2025", label: "A100 card only", partial: true },
    { value: 164, source: "nvidiaH100pcf", label: "H100 board share, no host", partial: true },
    { value: 327, source: "schneider2025", label: "TPU v4i machine, excl. construction" },
    { value: 883, source: "schneider2025", label: "TPU v5p machine, excl. construction" }
  ],
  rawShare: [],
  assemblyShare: [{ value: 0.09, source: "nvidiaH100pcf", label: "HGX H100" }],
  hwWater: [
    { value: 3700, source: "tsmc2023", label: "All water drawn (≈12,300 L/wafer × 0.3)", partial: true }
  ],
  hwMass: [
    { value: 1.5, source: "a100lca2025", label: "A100 card only", partial: true },
    { value: 3, source: "nvidiaH100pcf", label: "H100 baseboard ÷ 8", partial: true },
    { value: 16.3, source: "dgxh100", label: "DGX H100 system ÷ 8" }
  ],
  dcEmbodied: [
    { value: 1829, source: "dcLca2025", label: "At construction" },
    { value: 2400, source: "dcLca2025", label: "Incl. 20 years of replacements" }
  ],
  dcLife: [
    { value: 20, source: "schneider2025", label: "Google amortisation" },
    { value: 20, source: "dcLca2025", label: "Science-centre LCA" }
  ],
  loadFactor: [],
  copperPerMW: [
    { value: 27, source: "bhp2025", label: "Microsoft Chicago (n = 1), via BHP" }
  ],
  accelGrowth: [
    { value: 0.30, source: "iea2025", label: "IEA 2025 Base Case" },
    { value: 0.50, source: "ieaKq2026", label: "AI-focused data centres, 2025 actual" }
  ],
  recycledShare: [{ value: 0.223, source: "gem2024", label: "All e-waste, world 2022" }],
  upwShare: [{ value: 0.90, source: "iea2025", label: "IEA" }]
};

/*
 * Confidence from tier + number of independent, full-scope sources.
 *   high   : reported/modelled and ≥2 distinct, verified sources that cover the full parameter
 *   medium : one full-scope source, a derived value, or only self-interested or dated sources
 *   low    : expert estimate, or no direct source
 */
window.GENAI.confidence = function (key) {
  const p = window.GENAI.params[key];
  const ev = (window.GENAI.evidence[key] || []).filter(e => !e.partial && e.verified !== false);
  const distinct = new Set(ev.map(e => e.source)).size;
  if (p.tier === "estimate" || ev.length === 0) return "low";
  const allCoi = ev.every(e => window.GENAI.sources[e.source].coi);
  if ((p.tier === "reported" || p.tier === "modelled") && distinct >= 2 && !allCoi && !p.dated) return "high";
  return "medium";
};

/* Which inputs drive each stage; a stage is only as confident as its weakest input.
 * The GenAI share of accelerated servers scales every stage equally, so it is left out
 * here and flagged once for the totals instead. */
window.GENAI.stageInputs = {
  energy: { C1: ["trainShare"], C2: ["trainShare"], C3: ["pue"] },
  co2: {
    A1: ["accelKW", "hwLife", "hwEmbodied", "rawShare"],
    A2: ["accelKW", "hwLife", "hwEmbodied", "rawShare"],
    A3: ["accelKW", "hwLife", "hwEmbodied", "assemblyShare"],
    B1: ["pue", "loadFactor", "dcEmbodied", "dcLife"],
    C1: ["trainShare", "ci"], C2: ["trainShare", "ci"], C3: ["pue", "ci"]
  },
  water: {
    A1: ["accelKW", "hwLife", "hwWater", "upwShare"],
    A2: ["accelKW", "hwLife", "hwWater", "upwShare"],
    C1: ["trainShare", "ewif"], C2: ["trainShare", "ewif"],
    C3: ["pue", "wue", "ewif"]
  }
};
