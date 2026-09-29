/*
 * Source registry. Every number on the page points at one or more of these ids.
 *
 * Fields
 *   short, citation, url, doi, version
 *   type          agency | peer-reviewed | preprint | company | industry | dataset | press-release
 *   peerReviewed  independent of type (e.g. a company paper can be peer-reviewed)
 *   coi           the authors' or funders' stake in the result, or null
 *   dataYear      the year(s) the figures describe (≠ publication date)
 *   published     publication date
 *   note          representativeness / fitness-for-use caveats
 *   where[]       exact locations of the figures used. A string = checked in the primary
 *                 document. An object { t, verified:false, via } = taken second-hand and
 *                 NOT confirmed against the primary; the page marks these with †.
 *   verified      every figure used was matched against the primary document
 *   accessed      date of that check (null when nothing could be checked)
 *
 * Verification pass: 2026-09-29, in response to PEER_REVIEW.md.
 */
window.GENAI = window.GENAI || {};
window.GENAI.sources = {
  iea2025: {
    short: "IEA 2025",
    citation: "International Energy Agency (2025). Energy and AI. World Energy Outlook Special Report. CC BY 4.0.",
    url: "https://iea.blob.core.windows.net/assets/de9dea13-b07d-42c5-a398-d1b3ae17d866/EnergyandAI.pdf",
    type: "agency", peerReviewed: false, coi: null,
    dataYear: "2023–2024 (estimates); 2030 (projections)", published: "2025-04",
    verified: true, accessed: "2026-09-29",
    note: "AI electricity is modelled from server shipments; the IEA itself calls accelerated servers an imperfect proxy for AI.",
    where: [
      "p.55–56: “Accelerated servers accounted for 24% of server electricity demand and 15% of total data centre demand in 2024.”",
      "p.55: “There is no comprehensive data on the share of different kinds of workloads.”",
      "Ch.2: data centres ≈415 TWh (≈1.5% of world electricity) in 2024.",
      "p.61–62: global weighted-average PUE “decreasing from 1.41 to 1.29”. p.62–63: accelerated-server electricity grows 30%/yr (Base Case).",
      "p.38: “more than 10 MWh for manufacturing compared with more than 80 MWh for operation in a five-year lifetime.”",
      "p.241–242 (Box 5.4): “global water consumption for data centres is currently around 560 billion litres per year … around 1200 billion litres per year in 2030”; about two-thirds energy supply, one-quarter direct cooling, remainder chip manufacturing; “almost 90% of water consumption is associated with ultra-pure water production.”",
      "p.245: “Data centres account for around 180 Mt of indirect CO2 emissions today … 0.5% of combustion emissions … rising to 1% in the Base Case.”",
      "Ch.5: copper demand from data-centre capacity additions reaches “512 kilotonnes (kt) of copper” in 2030."
    ]
  },
  ieaKq2026: {
    short: "IEA 2026",
    citation: "International Energy Agency (2026). Key Questions on Energy and AI. CC BY 4.0.",
    url: "https://iea.blob.core.windows.net/assets/3179f7f8-01f6-4dd6-bffa-c9f7b73f1dc9/KeyQuestionsonEnergyandAI.pdf",
    type: "agency", peerReviewed: false, coi: null,
    dataYear: "2025 (estimate); 2030 (projection)", published: "2026-04-16",
    verified: true, accessed: "2026-09-29",
    note: "Update to IEA 2025. 'AI-focused data centres' is a facility-level category, not identical to the accelerated-server share in the 2025 report.",
    where: [
      "Executive summary: data-centre electricity demand “grew by 17% in 2025 … Electricity consumption from AI-focused data centres grew even faster, surging 50% in 2025.”",
      "Executive summary: “roughly doubling from 485 TWh in 2025 to 950 TWh in 2030, accounting for around 3% of global electricity demand.”",
      "p.25: AI-focused data centres' electricity “increases by more than threefold to 2030, reaching around 465 TWh by 2030.”",
      "Ch.1: best-in-class hyperscale PUE “approximately 1.1 to 1.2, compared with 1.5 to 1.7 in older or enterprise-operated sites.”"
    ]
  },
  lbnl2024: {
    short: "LBNL 2024",
    citation: "Shehabi, A. et al. (2024). 2024 United States Data Center Energy Usage Report. Lawrence Berkeley National Laboratory.",
    url: "https://eta-publications.lbl.gov/sites/default/files/2024-12/lbnl-2024-united-states-data-center-energy-usage-report_1.pdf",
    type: "agency", peerReviewed: false, coi: null,
    dataYear: "2023 (US)", published: "2024-12",
    verified: true, accessed: "2026-09-29",
    note: "US only. Independent, government-funded; used as a cross-check on IEA-derived and company figures.",
    where: [
      "Executive summary: US data centres “reaching 176 TWh by 2023, representing 4.4% of total U.S. electricity consumption.”",
      "p.19–20: AI servers operate at 70% of rated power (varied 60–80%); measured “8 H100 GPU nodes averaged 74% of manufacturer rated thermal design power”; a mixed GPU fleet averages ≈8 kW rated per 8-GPU server.",
      "Sec.4: “annual average PUE falls from 1.6 in 2014 to 1.4 in 2023”; 1.15–1.35 by 2028.",
      "Sec.5: direct water consumption “66-billion-liter total” in 2023.",
      "Sec.5: indirect water “national average of 4.52 L/kWh … along with 0.34 kg/kWh emissions.”"
    ]
  },
  uptime2025: {
    short: "Uptime Institute 2025",
    citation: "Uptime Institute (2025). Global Data Center Survey 2025.",
    url: "https://datacenter.uptimeinstitute.com/rs/711-RIA-145/images/2025.Annual.Survey.Report.pdf",
    type: "industry", peerReviewed: false, coi: null,
    dataYear: "2025", published: "2025",
    verified: true, accessed: "2026-09-29",
    note: "Self-selected operator survey, weighted towards enterprise and colocation sites; hyperscale AI halls are typically more efficient.",
    where: ["“In 2025, respondents’ annual PUE had a weighted average of 1.54.”"]
  },
  devriesgao2025: {
    short: "de Vries-Gao 2025",
    citation: "de Vries-Gao, A. (2025). The carbon and water footprints of data centers and what this could mean for artificial intelligence. Patterns 7 (January 2026).",
    url: "https://www.cell.com/patterns/fulltext/S2666-3899(25)00278-8",
    doi: "10.1016/j.patter.2025.101430",
    type: "peer-reviewed", peerReviewed: true,
    coi: "Author also runs Digiconomist, a long-standing critical tracker of the energy use of digital technologies. Supplies the high end of several ranges.",
    dataYear: "2023–2025", published: "2025-12-17",
    verified: true, accessed: "2026-09-29",
    note: "Single-author estimate with wide ranges. Covers all AI, not only generative AI. Checked in a full-text copy.",
    where: [
      "p.5: “AI systems could be responsible for 32.6–79.7 million tons of CO2 emissions in 2025”; water footprint “312.5–764.6 billion L” (abstract).",
      "p.5: US grids at Apple, Google and Meta data-centre locations have “carbon intensities ranging from 0.17 to 0.46 tCO2/MWh”; Apple, Google, Meta, Microsoft, Oracle and Tesla report 0.32–0.35 tCO2/MWh; Baidu 0.64 and Tencent 0.57.",
      "p.5: IEA carbon intensity of electricity generation for data centres in 2024: 395.65 gCO2/kWh.",
      "p.5: IEA 2023 data-centre water: 560 billion L, of which 373 billion L indirect, 140 billion L direct, and about 8% (47 billion L) hardware manufacturing; with 360 TWh and PUE 1.43 in 2023, “the implied WUE 0.56.”",
      "p.5: companies reporting both: 55.8 billion L direct water on 97.8 TWh, “a weighted average of 0.59 L per kWh.”",
      "p.6: US grid water intensities at those locations “ranging from 0.68 to 11.98 L/kWh.”"
    ]
  },
  mistral2025: {
    short: "Mistral / ADEME LCA 2025",
    citation: "Mistral AI, with Carbone 4, ADEME, Resilio & Hubblo (2025). Our contribution to a global environmental standard for AI (text and life-cycle infographic).",
    url: "https://mistral.ai/news/our-contribution-to-a-global-environmental-standard-for-ai",
    type: "company", peerReviewed: false,
    coi: "Self-assessment of the company's own model (method reviewed by ADEME and Carbone 4). Run on the low-carbon French grid.",
    dataYear: "mid-2023 to Jan 2025", published: "2025-07-22",
    verified: true, accessed: "2026-09-29",
    note: "The full LCA report is not public; the stage split is taken from Mistral's own infographic on the same page.",
    where: [
      "Training plus 18 months of use to January 2025: “20,4 ktCO₂e”, “281 000 m3 of water consumed”, “660 kg Sb eq.”",
      "One 400-token Le Chat response: “1.14 gCO₂e”, “45 mL of water”, “0.16 mg of Sb eq.”",
      "Infographic (GHG / water / materials): model conception <1% / <1% / <1%; data-centre construction <1% / <1% / 1.5%; hardware embodied impacts (server manufacturing, transport, end of life) 11% / 5% / 61%; model training & inference 85.5% / 91% / 29%; network traffic <1% / <1% / <1%; end-user equipment 3% / 2% / 7%."
    ]
  },
  nvidiaH100pcf: {
    short: "NVIDIA HGX H100 PCF",
    citation: "NVIDIA (2025). Product Carbon Footprint (PCF) Summary for NVIDIA HGX H100. ISO 14067, cradle-to-gate, critically reviewed; performed by WSP.",
    url: "https://images.nvidia.com/aem-dam/Solutions/documents/HGX-H100-PCF-Summary.pdf",
    type: "company", peerReviewed: false,
    coi: "Manufacturer's own product disclosure (third-party ISO review).",
    dataYear: "2024–2025", published: "2025",
    verified: true, accessed: "2026-09-29",
    note: "Covers the 8-GPU baseboard only; excludes the host server (CPUs, DRAM, storage, chassis).",
    where: [
      "p.3: “the carbon footprint from cradle-to-gate for one HGX H100 GPU baseboard is 1,312 kg CO2e” (≈164 kg per GPU).",
      "p.3: “materials and components, accounting for 91% … assembly process contributes 8.6% … transportation accounts for only 0.4%.” Memory 42%, ICs 25%, thermal 18%.",
      "p.1: baseboard weight 24 kg; typical power 5,600 W (8 GPUs, no host)."
    ]
  },
  schneider2025: {
    short: "Schneider et al. 2025",
    citation: "Schneider, I., Xu, H., Benecke, S., Patterson, D., Huang, K., Ranganathan, P. et al. (2025). Life-Cycle Emissions of AI Hardware: A Cradle-To-Grave Approach and Generational Trends.",
    url: "https://arxiv.org/abs/2502.01671v1", version: "arXiv v1",
    type: "preprint", peerReviewed: false,
    coi: "Google authors, assessing Google's own TPUs.",
    dataYear: "2023–2024", published: "2025-02-01",
    verified: true, accessed: "2026-09-29",
    note: "TPUs, whereas most of the GenAI fleet is NVIDIA GPUs.",
    where: [
      "Table 1: embodied CO₂e per machine 386 (v4i) to 1,101 (v5p) kg, of which data-centre construction 59–218 kg; hardware only ≈327–883 kg.",
      "“We use a lifespan of six years for AI machines.”",
      "Operational emissions “∼70%” of lifetime emissions with carbon-free-energy procurement (market-based), “∼90%” without (location-based)."
    ]
  },
  a100lca2025: {
    short: "Falk et al. 2025",
    citation: "Falk, S., Ekchajzer, D., Pirson, T., Lees-Perasso, E., Wattiez, A., Biber-Freudenberger, L. et al. (2025). More than Carbon: Cradle-to-Grave environmental impacts of GenAI training on the Nvidia A100 GPU.",
    url: "https://arxiv.org/abs/2509.00093v3", version: "arXiv v3",
    type: "preprint", peerReviewed: false, coi: null,
    dataYear: "2020s hardware", published: "2025-12-18",
    verified: true, accessed: "2026-09-29",
    where: [
      "“Our cradle-to-gate analysis of the Nvidia A100 GPU estimates 127.6 kg CO2 eq per GPU.”",
      "“The weight of each card is 1.5 kilograms.”",
      "Manufacturing dominates mineral & metal depletion (85%) and cancer toxicity (99%); use phase dominates climate change."
    ]
  },
  dgxh100: {
    short: "NVIDIA DGX H100 User Guide",
    citation: "NVIDIA. DGX H100/H200 User Guide: Introduction to the NVIDIA DGX H100 System (hardware specifications).",
    url: "https://docs.nvidia.com/dgx/dgxh100-user-guide/introduction-to-dgxh100.html",
    type: "company", peerReviewed: false, coi: "Manufacturer specification.",
    dataYear: "2023", published: "2023",
    verified: true, accessed: "2026-09-29",
    where: [
      "Specifications table: system power “10.2 kW max” for 8 H100 GPUs (≈1.3 kW per GPU including host).",
      "Specifications table: system weight “287.6 lbs (130.45 kg) max” (≈16 kg per GPU)."
    ]
  },
  dcLca2025: {
    short: "Vanderbauwhede & Wadenstein 2025",
    citation: "Vanderbauwhede, W. & Wadenstein, M. (2025). Life Cycle Analysis for Emissions of Scientific Computing Centres. Eur. Phys. J. C.",
    url: "https://arxiv.org/abs/2506.14365v2", doi: "10.1140/epjc/s10052-025-14650-8", version: "arXiv v2",
    type: "peer-reviewed", peerReviewed: true, coi: null,
    dataYear: "2021 facility model", published: "2025-08",
    verified: true, accessed: "2026-09-29",
    note: "Models scientific computing centres, not hyperscale AI campuses. No public hyperscale facility LCA was found; treat as indicative.",
    where: ["Facility infrastructure per MW: “1,829 tCO2e on construction, increasing to 2,400” after 20 years of maintenance and replacements."]
  },
  bhp2025: {
    short: "BHP 2025",
    citation: "BHP Insights (Jan 2025). Why AI tools and data centres are driving copper demand.",
    url: "https://www.bhp.com/news/bhp-insights/2025/01/why-ai-tools-and-data-centres-are-driving-copper-demand",
    type: "industry", peerReviewed: false,
    coi: "Copper-mining company; benefits from high copper-demand forecasts.",
    dataYear: "2024", published: "2025-01",
    verified: true, accessed: "2026-09-29",
    note: "Checked in a copy of the article. The 27 t/MW figure is itself second-hand (BHP cites Visual Capitalist, Oct 2023) and comes from a single Microsoft site (n = 1).",
    where: [
      "“A study of Microsoft’s US$500 million data centre facility in Chicago found it used 2,177 tonnes of copper, equivalent to 27 tonnes of copper for every megawatt (MW) of applied power.”",
      "“from around half a million tonnes a year of copper today, to around 3 million tonnes a year by 2050.”"
    ]
  },
  patterson2022: {
    short: "Patterson et al. 2022",
    citation: "Patterson, D., Gonzalez, J., Hölzle, U., Le, Q., Liang, C., Munguia, L.-M. et al. (2022). The Carbon Footprint of Machine Learning Training Will Plateau, Then Shrink. IEEE Computer 55(7).",
    url: "https://arxiv.org/abs/2204.05149v1", version: "arXiv v1",
    type: "peer-reviewed", peerReviewed: true,
    coi: "Google authors, reporting on Google's own fleet.",
    dataYear: "2019–2021", published: "2022-04",
    verified: true, accessed: "2026-09-29",
    note: "Pre-ChatGPT. IEEE Computer is a magazine with editorial review. No newer public training/inference split exists.",
    where: ["“Across all three years, about ⅗ of ML energy use is for inference and ⅖ for training.”"]
  },
  wu2022: {
    short: "Wu et al. 2022",
    citation: "Wu, C.-J., Raghavendra, R., Gupta, U., Acun, B., Ardalani, N., Maeng, K. et al. (2022). Sustainable AI: Environmental Implications, Challenges and Opportunities. MLSys 2022.",
    url: "https://arxiv.org/abs/2111.00364v2", version: "arXiv v2",
    type: "peer-reviewed", peerReviewed: true,
    coi: "Meta authors, reporting on Meta's own fleet.",
    dataYear: "2021", published: "2022",
    verified: true, accessed: "2026-09-29",
    note: "Pre-ChatGPT fleet dominated by recommendation models.",
    where: ["Fig. 3: “At Facebook, we observe a rough power capacity breakdown of 10:20:70” (experimentation : training : inference)."]
  },
  wang2024: {
    short: "Wang et al. 2024",
    citation: "Wang, P., Zhang, L.-Y., Tzachor, A. & Chen, W.-Q. (2024). E-waste challenges of generative artificial intelligence. Nature Computational Science 4, 818–823.",
    url: "https://www.nature.com/articles/s43588-024-00712-6", doi: "10.1038/s43588-024-00712-6",
    type: "peer-reviewed", peerReviewed: true, coi: null,
    dataYear: "2023–2030", published: "2024-10-28",
    verified: true, accessed: "2026-09-29",
    note: "Covers large language models only, and AI servers only (cooling and networking excluded). Checked in a full-text copy.",
    where: [
      "p.2: “potential for rapid growth of e-waste from 2.6 thousand tons (kt) yr−1 in 2023 to around 0.4–2.5 million tons (Mt) yr−1 in 2030.”",
      "p.2: 2030 e-waste “equivalent to discarding 2.1–13.3 billion units of the iPhone 15 Pro (187 g per unit)”.",
      "p.2: cumulative 2023–2030 e-waste “5.0 Mt, 3.0 Mt, 1.8 Mt and 1.2 Mt” in the aggressive, moderate, conservative and limited scenarios.",
      "Methods: “a 3 yr lifespan is selected on the basis of the historical general lifespan of computing devices”; benchmark server: Nvidia DGX H100.",
      "Abstract: circular strategies “could reduce e-waste generation by 16–86%.”"
    ]
  },
  luccioni2024: {
    short: "Luccioni et al. 2024",
    citation: "Luccioni, A.S., Jernite, Y. & Strubell, E. (2024). Power Hungry Processing: Watts Driving the Cost of AI Deployment? ACM FAccT '24.",
    url: "https://arxiv.org/abs/2311.16863v3", doi: "10.1145/3630106.3658542", version: "arXiv v3",
    type: "peer-reviewed", peerReviewed: true, coi: null,
    dataYear: "2023 (measurements)", published: "2024-06",
    verified: true, accessed: "2026-09-29",
    note: "88 small open models on A100 GPUs in a lab, not frontier models in production.",
    where: ["Table 2: mean energy per 1,000 inferences by task.", "p.4: “charging the average smartphone requires 0.022 kWh”; the least efficient image model uses “around half a charge per image generation.”"]
  },
  google2025: {
    short: "Elsworth et al. 2025",
    citation: "Elsworth, C., Huang, K., Patterson, D., Schneider, I., Sedivy, R., Goodman, S. et al. (2025). Measuring the environmental impact of delivering AI at Google Scale.",
    url: "https://arxiv.org/abs/2508.15734v1", version: "arXiv v1",
    type: "preprint", peerReviewed: false,
    coi: "Google authors, reporting on Google's own product. CO₂e is market-based.",
    dataYear: "May 2025", published: "2025-08-21",
    verified: true, accessed: "2026-09-29",
    note: "Median text prompt only; long reasoning, image and video requests cost more.",
    where: ["Abstract: the “median Gemini Apps text prompt uses less energy than watching nine seconds of television (0.24 Wh) and consumes the equivalent of five drops of water (0.26 mL)”; emissions per prompt are reported market-based."]
  },
  googleEnv2025: {
    short: "Google 2025",
    citation: "Google (2025). 2025 Environmental Report; Google Data Centers: Power usage effectiveness.",
    url: "https://datacenters.google/efficiency/",
    type: "company", peerReviewed: false,
    coi: "Self-reported by the operator.",
    dataYear: "2024", published: "2025",
    verified: true, accessed: "2026-09-29",
    note: "Best-in-class hyperscale fleet, not typical of the industry.",
    where: ["Fleet-wide trailing-twelve-month PUE 1.09 for 2024 (and 2025), compared on the same page against the Uptime 2025 average of 1.54."]
  },
  li2023: {
    short: "Li et al. 2025",
    citation: "Li, P., Yang, J., Islam, M.A. & Ren, S. (2025). Making AI Less “Thirsty”: Uncovering and Addressing the Secret Water Footprint of AI Models. Communications of the ACM (accepted).",
    url: "https://arxiv.org/abs/2304.03271v5", version: "arXiv v5",
    type: "peer-reviewed", peerReviewed: true, coi: null,
    dataYear: "2022–2023", published: "2025-03-26",
    verified: true, accessed: "2026-09-29",
    where: [
      "Sec.2: US national average water consumption for electricity “3.1 L/kWh”, cited from Reig et al. (WRI); Meta's self-reported scope-2 water “3.7 L/kWh” in 2023.",
      "Table: US average used in the paper — PUE 1.170, WUE 0.550 L/kWh, EWIF 3.142 L/kWh.",
      "On-site water “1 L/kWh for Google's annualized global on-site water efficiency.”",
      "Sec.1: one technology company's own data centres “consumed (i.e., evaporated) more than 23 billion liters of freshwater for on-site cooling in 2023, nearly 80% of which was potable water.”",
      "Sec.2: power-plant water covers thermoelectric cooling and “increased water evaporation rates from hydropower generation.”"
    ]
  },
  ccaf2025: {
    short: "Cambridge CCAF 2025",
    citation: "Neumueller, A., Pieters, G.C., Mohaddes, K., Rousseau, V. & Zhang, B.Z. (2025). Cambridge Digital Mining Industry Report. Cambridge Centre for Alternative Finance.",
    url: "https://www.jbs.cam.ac.uk/wp-content/uploads/2025/04/2025-04-cambridge-digital-mining-industry-report.pdf",
    type: "industry", peerReviewed: false,
    coi: "Energy mix is self-reported by surveyed mining firms.",
    dataYear: "2024 (annualised, June 2024)", published: "2025-04",
    verified: true, accessed: "2026-09-29",
    where: [
      "“Annualised electricity consumption associable with Bitcoin mining is estimated at 138 TWh.”",
      "“The estimated annual GHG emissions … are approximately 39.8 MtCO2e … a more nuanced analysis suggests a potential range of 32.9 to 37.6 MtCO2e.”",
      "Mining e-waste “approximated at about 2.3 kilotonnes.”"
    ]
  },
  devries2023btc: {
    short: "de Vries 2023",
    citation: "de Vries, A. (2023). Bitcoin's growing water footprint. Cell Reports Sustainability 1(1).",
    url: "https://www.sciencedirect.com/science/article/pii/S2949790623000046",
    type: "peer-reviewed", peerReviewed: true,
    coi: "Author runs Digiconomist, a long-standing critic of Bitcoin's energy use.",
    dataYear: "2021 (estimate); 2023 (projection)", published: "2023-11",
    verified: true, accessed: "2026-09-29",
    note: "The 2023 figure is a projection. Checked in a full-text copy.",
    where: [
      "Summary: water footprint rose “from 591.2 to 1,573.7 GL” between 2020 and 2021; for 2023 “the water footprint may equal 2,237 GL.”"
    ]
  },
  gem2024: {
    short: "Global E-waste Monitor 2024",
    citation: "Baldé, C.P. et al. (2024). The Global E-waste Monitor 2024. ITU & UNITAR.",
    url: "https://ewastemonitor.info/wp-content/uploads/2024/03/GEM_2024_18-03_web_page_per_page_web.pdf",
    type: "agency", peerReviewed: false, coi: null,
    dataYear: "2022", published: "2024-03",
    verified: true, accessed: "2026-09-29",
    where: [
      "Ch.3: “In 2022, the world produced 62 billion kg of e-waste … a global formally documented collection and recycling rate of 22.3 per cent.”",
      "Figure 4 (p.26), billion kg in 2022: small equipment 20.4; large equipment excl. PV 15.1; temperature exchange 13.3; screens & monitors 5.9; small IT & telecom 4.9; lamps 1.9; photovoltaic panels 0.6.",
      "Executive summary: the e-waste contained 31 billion kg of metals and 17 billion kg of plastics."
    ]
  },
  usgs2026cu: {
    short: "USGS MCS 2026",
    citation: "U.S. Geological Survey (2026). Mineral Commodity Summaries 2026: Copper.",
    url: "https://pubs.usgs.gov/periodicals/mcs2026/mcs2026.pdf",
    type: "agency", peerReviewed: false, coi: null,
    dataYear: "2024–2025", published: "2026-01",
    verified: true, accessed: "2026-09-29",
    where: ["Copper, world mine production “World total (rounded) 23,000” kt in 2024 and 23,000 kt in 2025 (estimate)."]
  },
  unep2025: {
    short: "UNEP EGR 2025",
    citation: "UNEP (2025). Emissions Gap Report 2025: Off Target.",
    url: "https://www.unep.org/resources/emissions-gap-report-2025",
    type: "agency", peerReviewed: false, coi: null,
    dataYear: "2024", published: "2025-11",
    verified: true, accessed: "2026-09-29",
    where: ["“emissions growing 2.3 per cent year-on-year to 57.7 gigatons of CO2 equivalent in 2024” (checked on co-author PBL's release page)."]
  },
  owidAviation: {
    short: "OWID / OECD aviation",
    citation: "Our World in Data, based on OECD (2025). Total annual CO₂ emissions from aviation.",
    url: "https://ourworldindata.org/grapher/annual-co-emissions-from-aviation",
    type: "dataset", peerReviewed: false, coi: null,
    dataYear: "2024", published: "OWID update 2025-03-11", version: "OECD (2025)",
    verified: true, accessed: "2026-09-29",
    note: "Commercial passenger flights only (domestic + international); excludes freight-only, military and private flights and non-CO₂ warming.",
    where: ["World: 766 Mt (2023), 830 Mt (2024)."]
  },
  owidCo2: {
    short: "OWID / Global Carbon Budget",
    citation: "Our World in Data, based on Global Carbon Budget (2025). Annual CO₂ emissions (excluding land-use change).",
    url: "https://ourworldindata.org/grapher/annual-co2-emissions-per-country",
    type: "dataset", peerReviewed: false, coi: null,
    dataYear: "2024", published: "OWID update 2025-11-13", version: "GCB 2025",
    verified: true, accessed: "2026-09-29",
    where: ["Netherlands: 114.8 Mt CO₂ (2024), territorial fossil and industry emissions."]
  },
  owidElec: {
    short: "OWID / Ember",
    citation: "Our World in Data, based on Ember (2026). Electricity demand.",
    url: "https://ourworldindata.org/grapher/electricity-demand",
    type: "dataset", peerReviewed: false, coi: null,
    dataYear: "2024–2025", published: "OWID update 2026-06-30", version: "Ember (2026)",
    verified: true, accessed: "2026-09-29",
    where: ["Netherlands 118.1 TWh (2024); Japan 1,016 TWh (2024); World 30,930 TWh (2024), 31,772 TWh (2025)."]
  },
  owidWaterSector: {
    short: "OWID / FAO AQUASTAT",
    citation: "Our World in Data, based on FAO AQUASTAT (2026). Agricultural, industrial and municipal water withdrawals.",
    url: "https://ourworldindata.org/grapher/agricultural-water-withdrawals",
    type: "dataset", peerReviewed: false, coi: null,
    dataYear: "2023", published: "OWID update 2026-08-07", version: "AQUASTAT (2026)",
    verified: true, accessed: "2026-09-29",
    note: "Withdrawals (water taken), not consumption (water not returned).",
    where: ["World 2023: agriculture 2,892 km³; industry 602 km³; municipal 537 km³."]
  },
  owidGhgSector: {
    short: "OWID / Climate Watch",
    citation: "Our World in Data, based on Climate Watch (2026). Greenhouse gas emissions by sector.",
    url: "https://ourworldindata.org/grapher/ghg-emissions-by-sector",
    type: "dataset", peerReviewed: false, coi: null,
    dataYear: "2023", published: "OWID update 2026-02-10", version: "Climate Watch (2026)",
    verified: true, accessed: "2026-09-29",
    note: "Land-use change and forestry is a net figure (emissions minus sinks), which is why it is small.",
    where: ["World 2023, Gt CO₂e: electricity & heat 17.01; transport 8.48; agriculture 6.24; manufacturing & construction 6.20; fugitive 3.43; buildings 3.20; industrial processes 3.17; waste 1.95; international aviation & shipping 1.22; other fuel combustion 0.60; land-use change & forestry (net) 0.47."]
  },
  nycGhg: {
    short: "NYC GHG Inventory",
    citation: "City of New York (2026). NYC Greenhouse Gas Emissions Inventory, citywide (GPC). NYC Open Data, dataset wq7q-htne.",
    url: "https://data.cityofnewyork.us/Environment/NYC-Greenhouse-Gas-Emissions-Inventory/wq7q-htne",
    type: "dataset", peerReviewed: false, coi: null,
    dataYear: "2024", published: "2025–2026",
    verified: true, accessed: "2026-09-29",
    where: ["Sum of all citywide (GPC) rows: 47.9 Mt CO₂e in 2024 (50.4 Mt in 2023)."]
  },
  unu2023: {
    short: "UNU-INWEH 2023",
    citation: "Bouhlel, Z., Köpke, J., Mina, M. & Smakhtin, V. (2023). Global Bottled Water Industry: A Review of Impacts and Trends. UNU-INWEH.",
    url: "https://unu.edu/inweh/article/global-bottled-water-industry-review-impacts-and-trends",
    type: "agency", peerReviewed: false, coi: null,
    dataYear: "≈2021 (not stated)", published: "2023-03-16",
    verified: true, accessed: "2026-09-29",
    where: ["“The current global bottled water sales are estimated at almost 270 billion US$ and 350 billion liters.”"]
  },
  tsmc2023: {
    short: "TSMC 2023",
    citation: "TSMC (2024). 2023 Sustainability Report: Water Stewardship and Key Indicators.",
    url: "https://esg.tsmc.com/en-US/file/public/e-all_2023.pdf",
    type: "company", peerReviewed: false, coi: "Self-reported by the manufacturer.",
    dataYear: "2023", published: "2024",
    verified: true, accessed: "2026-09-29",
    note: "Checked in a copy of the report. TSMC's 'unit water consumption' means tap water drawn (“Unit water consumption = unit tap water consumption”), i.e. closer to withdrawal. Consumption below is derived: drawn minus wastewater discharged.",
    where: [
      "Key indicators: water withdrawal 113.6 million metric tons in 2023 (natural water: Taiwan sites 92.5, subsidiaries 8.5); ultra-pure water usage 130.9.",
      "Water stewardship: “The wafer unit consumption was 176.4 liter per 12-inch equivalent wafer mask layer” in 2023 (140.9 in base year 2010).",
      "Wastewater chart: 68.56 (TSMC) + 7.47 (subsidiaries) million m³ in 2023; wafer-mask-unit wastewater 132.8 L per layer.",
      "Derived: consumption ≈ 176.4 − 132.8 ≈ 44 L per wafer mask layer; ≈ 101 − 76 = 25 million m³ in total."
    ]
  },
  ieaGer2025: {
    short: "IEA Global Energy Review 2025",
    citation: "International Energy Agency (2025). Global Energy Review 2025. CC BY 4.0.",
    url: "https://iea.blob.core.windows.net/assets/5b169aa1-bc88-4c96-b828-aaa50406ba80/GlobalEnergyReview2025.pdf",
    type: "agency", peerReviewed: false, coi: null,
    dataYear: "2023–2024", published: "2025-03",
    verified: true, accessed: "2026-09-29",
    note: "Gives growth by sector, not sector levels. Used only to cross-check the sector split: the implied 2023 levels (buildings ≈12,000 TWh, industry ≈11,000 TWh) put buildings at ≈1.1× industry, matching the 1.13× of the 2022 shares.",
    where: [
      "p.22: “Global electricity consumption in buildings increased by more than 600 TWh (5%) in 2024.”",
      "p.22: “The industry sector made up nearly 40% of total growth in electricity demand in 2024. Electricity use in industry grew by nearly 4%.”",
      "p.21–22: world electricity consumption grew by 1,080 TWh (+4.3%) in 2024; transport electricity grew by over 8%."
    ]
  },
  ieaElecSector: {
    short: "IEA via Statista",
    citation: "Statista, based on IEA World Energy Balances. World electricity final consumption share by sector, 2022.",
    url: "https://www.statista.com/statistics/859150/world-electricity-consumption-share-by-sector/",
    type: "dataset", peerReviewed: false, coi: null,
    dataYear: "2022", published: "2024",
    verified: false, accessed: null,
    note: "The IEA's own sector balances are not openly downloadable; this is the only open secondary route found. The buildings-to-industry ratio (1.13×) is corroborated by IEA Global Energy Review 2025 (≈1.1× in 2023).",
    where: [{ t: "Industry 42.2%, residential 26.8%, commercial & public services 21.1%, other incl. agriculture 8.1%, transport 1.8%.", verified: false, via: "Statista (paywalled summary)" }]
  }
};
