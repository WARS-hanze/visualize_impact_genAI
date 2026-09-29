/*
 * Reference points for the comparison views. Every entry states the year the figure
 * describes, so the page can flag comparisons across years. Figures are aligned to 2024
 * wherever a verified 2024 value exists.
 *   unverified: true  → taken second-hand, not confirmed in the primary (shown with †)
 *   projection: true  → the source projected this year's value rather than measuring it
 * Units: energy TWh/yr · co2 Mt CO₂e/yr · water billion litres/yr · ewaste kt/yr · copper kt/yr
 * `dynamic: "dc"` = taken from the selected scenario (all data centres that year).
 */
window.GENAI = window.GENAI || {};

window.GENAI.comparators = {
  energy: [
    { label: "All data centres", dynamic: "dc", sources: ["iea2025", "ieaKq2026"] },
    { label: "Bitcoin mining", value: 138, year: 2024, sources: ["ccaf2025"] },
    { label: "Netherlands, whole country", value: 118.1, year: 2024, sources: ["owidElec"] },
    { label: "Japan, whole country", value: 1016, year: 2024, sources: ["owidElec"] },
    { label: "World electricity", value: 30930, year: 2024, sources: ["owidElec"], worldTotal: true }
  ],
  co2: [
    { label: "All data centres (electricity only)", dynamic: "dc", sources: ["iea2025"] },
    { label: "Aviation, passenger flights (CO₂ only)", value: 830, year: 2024, sources: ["owidAviation"] },
    { label: "Netherlands, territorial CO₂", value: 114.8, year: 2024, sources: ["owidCo2"] },
    { label: "New York City", value: 47.9, year: 2024, sources: ["nycGhg"] },
    { label: "Bitcoin mining", value: 39.8, lo: 32.9, hi: 39.8, year: 2024, sources: ["ccaf2025"] },
    { label: "All AI systems (independent study)", value: 56.2, lo: 32.6, hi: 79.7, year: 2025, sources: ["devriesgao2025"], estimate: true, note: "Covers all AI, not only GenAI; operational only." },
    { label: "Global GHG emissions", value: 57700, year: 2024, sources: ["unep2025"], worldTotal: true }
  ],
  water: [
    { label: "All data centres (consumption)", dynamic: "dc", sources: ["iea2025"] },
    { label: "Bitcoin mining", value: 2237, year: 2023, sources: ["devries2023btc"], projection: true },
    { label: "All bottled water sold worldwide", value: 350, year: 2021, sources: ["unu2023"], note: "Volume comparison only: bottled water is drinking water, while most of generative AI's water evaporates at power plants. Year not stated in the source; about 2021." },
    { label: "All AI systems (independent study)", value: 538.6, lo: 312.5, hi: 764.6, year: 2025, sources: ["devriesgao2025"], estimate: true, note: "Covers all AI; uses higher grid water intensities." },
    { label: "Mistral Large 2, whole life cycle to Jan 2025", value: 0.281, year: 2025, sources: ["mistral2025"], note: "One model: training plus 18 months of use." }
  ],
  ewaste: [
    { label: "Bitcoin mining hardware", value: 2.3, year: 2024, sources: ["ccaf2025"] },
    { label: "LLM e-waste (independent study)", value: 2.6, year: 2023, sources: ["wang2024"], estimate: true },
    { label: "LLM e-waste, 2030 scenarios", value: 1450, lo: 400, hi: 2500, year: 2030, sources: ["wang2024"], estimate: true, projection: true, note: "Range across four scenarios (0.4–2.5 Mt per year); the dot marks the midpoint." },
    { label: "Small IT & telecom e-waste (phones, PCs…)", value: 4900, year: 2022, sources: ["gem2024"] },
    { label: "All e-waste, world", value: 62000, year: 2022, sources: ["gem2024"], worldTotal: true }
  ],
  copper: [
    { label: "All data centres, copper demand", value: 500, year: 2024, sources: ["bhp2025"], note: "BHP: “around half a million tonnes a year … today”." },
    { label: "Data-centre build-out, 2030 (IEA)", value: 512, year: 2030, sources: ["iea2025"], projection: true },
    { label: "World copper mine production", value: 23000, year: 2024, sources: ["usgs2026cu"], worldTotal: true }
  ]
};

/*
 * "Where the world's resources go": global totals split by sector.
 * GenAI is inserted by the page as a highlighted row (and, where it nests, as a child row).
 */
window.GENAI.sectors = {
  energy: {
    title: "World electricity use by sector",
    unit: "TWh", year: 2024,
    caveat: "Sector shares are for 2022 (IEA, via Statista †), applied to 2024 world demand of 30,930 TWh (Ember). The IEA Global Energy Review 2025 corroborates the split: its growth figures imply buildings used about 1.1× as much as industry in 2023, against 1.13× here. Data centres sit inside commercial & public services.",
    sources: ["ieaElecSector", "ieaGer2025", "owidElec"],
    rows: [
      { label: "Industry", value: 30930 * 0.422, unverified: true },
      { label: "Residential", value: 30930 * 0.268, unverified: true },
      { label: "Commercial & public services", value: 30930 * 0.211, nest: "dc", unverified: true },
      { label: "Agriculture, fishing & other", value: 30930 * 0.081, unverified: true },
      { label: "Transport (rail, EVs)", value: 30930 * 0.018, unverified: true }
    ]
  },
  co2: {
    title: "World greenhouse-gas emissions by sector",
    unit: "Mt CO₂e", year: 2023,
    caveat: "Sectors are for 2023, the latest year in Climate Watch. Data-centre emissions are part of electricity & heat. Land use is a net figure (emissions minus sinks).",
    sources: ["owidGhgSector"],
    rows: [
      { label: "Electricity & heat", value: 17006, nest: "dc" },
      { label: "Road, rail & domestic transport", value: 8483 },
      { label: "Agriculture", value: 6241 },
      { label: "Manufacturing & construction (energy)", value: 6205 },
      { label: "Fugitive emissions (oil, gas, coal)", value: 3432 },
      { label: "Buildings (heating, cooking)", value: 3202 },
      { label: "Industrial processes", value: 3173 },
      { label: "Waste", value: 1949 },
      { label: "International aviation & shipping", value: 1224 },
      { label: "Other fuel combustion", value: 604 },
      { label: "Land-use change & forestry (net)", value: 467 }
    ]
  },
  water: {
    title: "World freshwater withdrawals by sector",
    unit: "billion L", year: 2023,
    caveat: "Sector values are withdrawals (water taken). Data-centre and GenAI values are consumption (water not returned), which is smaller than withdrawal, so their bars understate their share of withdrawals.",
    sources: ["owidWaterSector"],
    rows: [
      { label: "Agriculture (irrigation, livestock)", value: 2891786 },
      { label: "Industry (incl. power-plant cooling)", value: 601538, nest: "dc" },
      { label: "Municipal (households, services)", value: 536723 }
    ]
  },
  ewaste: {
    title: "World e-waste by product category",
    unit: "kt", year: 2022,
    caveat: "GenAI hardware retired each year is compared with all e-waste generated in 2022, the latest global count.",
    sources: ["gem2024"],
    rows: [
      { label: "Small equipment (toys, microwaves, vapes…)", value: 20400 },
      { label: "Large equipment (washing machines, copiers…)", value: 15100 },
      { label: "Temperature exchange (fridges, air-con, heat pumps)", value: 13300 },
      { label: "Screens & monitors", value: 5900 },
      { label: "Small IT & telecom (phones, PCs, routers)", value: 4900 },
      { label: "Lamps", value: 1900 },
      { label: "Solar panels", value: 600 }
    ]
  }
};

/* Energy per 1,000 requests by task type. Not shares: no one publishes GenAI's split by application. */
window.GENAI.applications = [
  { label: "Text classification", kWh: 0.002, generative: false, sources: ["luccioni2024"], year: 2023 },
  { label: "Extractive question answering", kWh: 0.003, generative: false, sources: ["luccioni2024"], year: 2023 },
  { label: "Image classification", kWh: 0.007, generative: false, sources: ["luccioni2024"], year: 2023 },
  { label: "Object detection", kWh: 0.038, generative: false, sources: ["luccioni2024"], year: 2023 },
  { label: "Text generation", kWh: 0.047, generative: true, sources: ["luccioni2024"], year: 2023 },
  { label: "Summarisation", kWh: 0.049, generative: true, sources: ["luccioni2024"], year: 2023 },
  { label: "Image captioning", kWh: 0.063, generative: true, sources: ["luccioni2024"], year: 2023 },
  { label: "Gemini chat prompt (median, production)", kWh: 0.24, generative: true, sources: ["google2025"], year: 2025, note: "Includes idle capacity and data-centre overhead; the lab benchmarks do not. Self-reported by Google." },
  { label: "Image generation", kWh: 2.907, generative: true, sources: ["luccioni2024"], year: 2023 }
];

/* Independent estimates the model is checked against (method section). */
window.GENAI.crossChecks = [
  { id: "co2AllAI", label: "CO₂ from all AI, 2025 (operational)", scenario: "y2025", allAI: true, metric: "co2op",
    lo: 32.6, hi: 79.7, unit: "Mt", sources: ["devriesgao2025"] },
  { id: "waterAllAI", label: "Water from all AI, 2025 (operational)", scenario: "y2025", allAI: true, metric: "waterop",
    lo: 312.5, hi: 764.6, unit: "billion L", sources: ["devriesgao2025"] },
  { id: "embodiedShare", label: "Hardware share of life-cycle CO₂e", metric: "embodiedShare",
    lo: 10, hi: 11, unit: "%", sources: ["schneider2025", "mistral2025"],
    note: "Google TPUs, location-based: operational ≈90%, so embodied ≈10%. Mistral: hardware 11% on the low-carbon French grid, which inflates the embodied share." },
  { id: "mfgWaterShare", label: "Manufacturing share of water", metric: "mfgWaterShare",
    lo: 5, hi: 8, unit: "%", sources: ["mistral2025", "iea2025"],
    note: "Mistral: hardware 5% of water. IEA: chip manufacturing ≈8% of all data-centre water (the remainder after two-thirds energy and one-quarter cooling)." },
  { id: "copper2030", label: "Data-centre copper, 2030 build-out", scenario: "y2030", metric: "copperBuild", allDC: true,
    lo: 512, hi: 512, unit: "kt", sources: ["iea2025"],
    note: "IEA figure covers all data-centre capacity additions; our estimate is recalculated for all data-centre capacity in 2030 with 'built this year' accounting." }
];
