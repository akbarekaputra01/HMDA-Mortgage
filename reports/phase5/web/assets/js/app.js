/* app.js — HMDA Knowledge Discovery Dashboard: sections, filters, rendering. */

const D = DASHBOARD.raw;
const S = DASHBOARD.supplement;
const AD = DASHBOARD.addendum;

/* Corporate-blue-led categorical palette, kept distinguishable from a
   dark-neon lime/violet scheme by varying hue, not just lightness. */
const CLUSTER_PALETTE = ["#1878c4", "#3a5a78", "#92701c", "#8f2f2f"];
const CLUSTER_LABELS = {}; D.cluster_profiles.forEach((c) => (CLUSTER_LABELS[c.cluster] = c.name));
/* Segment names live in data.js as English text (baked in by the notebook export),
   so a language switch can't just re-read c.name -- translated by cluster index
   through i18n instead. segNameShort() matches the historic "before the ' / '"
   truncation used for compact chip labels. */
function segName(cluster) { return t(`seg.${cluster}.name`); }
function segNameShort(cluster) { return t(`seg.${cluster}.short`); }

function fmtInt(n) { return Math.round(n).toLocaleString("en-US"); }
function fmtPct(n, d = 1) { return n.toFixed(d) + "%"; }
function fmtUSD(n) { return "$" + Math.round(n).toLocaleString("en-US"); }

/* ================================================================
   Loading bar — a render can take noticeably long (the 100,000-point
   scatter maps take low single-digit seconds), and since it's synchronous
   JS blocking the main thread, the browser won't paint anything -- including
   the loading bar itself -- until the heavy work finishes, unless it's
   given a frame to paint first. Depth-counted in case renders ever nest.
================================================================= */
let loadingDepth = 0;
function showLoading() {
  loadingDepth++;
  const bar = document.getElementById("loading-bar");
  if (bar) bar.classList.add("active");
}
function hideLoading() {
  loadingDepth = Math.max(0, loadingDepth - 1);
  if (loadingDepth === 0) {
    const bar = document.getElementById("loading-bar");
    if (bar) bar.classList.remove("active");
  }
}
function withLoading(fn) {
  showLoading();
  requestAnimationFrame(() => requestAnimationFrame(async () => {
    try { await fn(); } finally { hideLoading(); }
  }));
}

/* ================================================================
   Lazy per-tab data chunks -- data.js only carries what Overview needs
   immediately at boot (~99KB). Everything only used by a single non-default
   tab (Phase 2's k-distance/dendrograms/3D PCA, Phase 3's rule scatter/network,
   Phase 4's anomaly tables, and the 100,000-row Parquet scatter table used by
   both Phase 2 and Phase 4) is a separate file, injected as a plain <script src>
   the first time that tab is opened -- and only once, cached after that. This
   works under file:// (unlike fetch(), which Chrome blocks for local files):
   a dynamically-created <script> element loads a local file exactly like the
   static ones in index.html do.
================================================================= */
const _scriptCache = {};
function loadScriptOnce(src) {
  if (_scriptCache[src]) return _scriptCache[src];
  _scriptCache[src] = new Promise((resolve, reject) => {
    const el = document.createElement("script");
    el.src = src;
    el.onload = () => resolve();
    el.onerror = () => reject(new Error(`failed to load ${src}`));
    document.head.appendChild(el);
  });
  return _scriptCache[src];
}
let _scatterLoaded = false, _phase2ExtraLoaded = false, _phase3ExtraLoaded = false, _phase4ExtraLoaded = false;
async function ensureScatterData() {
  if (_scatterLoaded) return;
  await loadScriptOnce("assets/js/vendor/hyparquet.min.js");
  await loadScriptOnce("assets/js/scatter_data.js");
  await loadScatterData();
  _scatterLoaded = true;
}
async function ensurePhase2Data() {
  await ensureScatterData();
  if (_phase2ExtraLoaded) return;
  await loadScriptOnce("assets/js/data-phase2-extra.js");
  Object.assign(DASHBOARD.addendum, DASHBOARD_PHASE2_EXTRA);
  _phase2ExtraLoaded = true;
}
async function ensurePhase3Data() {
  if (_phase3ExtraLoaded) return;
  await loadScriptOnce("assets/js/data-phase3-extra.js");
  Object.assign(DASHBOARD.raw, DASHBOARD_PHASE3_EXTRA);
  _phase3ExtraLoaded = true;
}
async function ensurePhase4Data() {
  await ensureScatterData();
  if (_phase4ExtraLoaded) return;
  await loadScriptOnce("assets/js/data-phase4-extra.js");
  DASHBOARD.supplement.phase4 = DASHBOARD_PHASE4_EXTRA.phase4;
  Object.assign(DASHBOARD.addendum, { isoforest_hist: DASHBOARD_PHASE4_EXTRA.isoforest_hist });
  _phase4ExtraLoaded = true;
}
const LAZY_DATA_LOADERS = { phase2: ensurePhase2Data, phase3: ensurePhase3Data, phase4: ensurePhase4Data };

/* ================================================================
   Token humanizer for association-rule item labels
================================================================= */
const PREFIX_LABELS = [
  ["derived_loan_product_type_", "tok.loanproduct", "product"],
  ["debt_to_income_ratio_", "tok.dti", "financial"],
  ["open_end_line_of_credit_", "tok.openend", "product"],
  ["denial_reason_1_", "tok.denialreason", "outcome"],
  ["derived_ethnicity_", "tok.ethnicityfield", "demographics"],
  ["derived_race_", "tok.racefield", "demographics"],
  ["derived_sex_", "tok.sexfield", "demographics"],
  ["applicant_age_", "tok.age", "demographics"],
  ["property_value_", "tok.propertyvalue", "financial"],
  ["interest_rate_", "tok.interestrate", "financial"],
  ["loan_purpose_", "tok.loanpurpose", "product"],
  ["loan_amount_", "tok.loanamount", "financial"],
  ["hoepa_status_", "tok.hoepa", "product"],
  ["state_code_", "tok.state", "geography"],
  ["action_taken_", "tok.outcome", "outcome"],
  ["income_", "tok.income", "financial"],
];
const GROUP_META = {
  demographics: { labelKey: "grp.demographics", color: "#8f2f2f" },
  financial: { labelKey: "grp.financial", color: "#1878c4" },
  product: { labelKey: "grp.product", color: "#3a5a78" },
  outcome: { labelKey: "grp.outcome", color: "#92701c" },
  geography: { labelKey: "grp.geography", color: "#5c6b80" },
};

function tokenMeta(token) {
  const tok = String(token);
  for (const [prefix, labelKey, kind] of PREFIX_LABELS) {
    if (tok.startsWith(prefix)) return { label: t(labelKey), kind, val: tok.slice(prefix.length) };
  }
  return { label: tok, kind: "outcome", val: "" };
}
function humanizeToken(token) {
  const m = tokenMeta(token);
  return m.val ? `${m.label} <b>${m.val}</b>` : `<b>${m.label}</b>`;
}
function shortToken(token) {
  const tok = String(token);
  for (const [prefix] of PREFIX_LABELS) if (tok.startsWith(prefix)) return tok.slice(prefix.length);
  return tok;
}
function tokenKind(token) { return tokenMeta(token).kind; }
function groupColor(group) {
  const kind = tokenKind(group + "_x");
  return (GROUP_META[kind] || {}).color || "#78859a";
}

const RULE_GROUP_KINDS = ["demographics", "financial", "product", "outcome", "geography"];

/* ================================================================
   Sections — horizontal numbered nav (no icon sidebar)
================================================================= */
const SECTIONS = [
  ["overview", "nav.overview"],
  ["phase1", "nav.phase1"],
  ["phase2", "nav.phase2"],
  ["phase3", "nav.phase3"],
  ["phase4", "nav.phase4"],
  ["phase5", "nav.phase5"],
];
/* [title, subtitle, owner, goal] -- owner/goal are shown in the phase-meta strip
   for phase1-phase5 only (matching the assignment's own phase framing verbatim). */
/* [titleKey, subKey, ownerKey|null, goalKey|null] -- resolved through t() in setTab(),
   not literal text, so a language switch re-labels the currently open tab too. */
const PAGE_META = {
  overview: ["meta.overview.title", "meta.overview.sub"],
  phase1: ["meta.phase1.title", "meta.phase1.sub", "meta.phase1.owner", "meta.phase1.goal"],
  phase2: ["meta.phase2.title", "meta.phase2.sub", "meta.phase2.owner", "meta.phase2.goal"],
  phase3: ["meta.phase3.title", "meta.phase3.sub", "meta.phase3.owner", "meta.phase3.goal"],
  phase4: ["meta.phase4.title", "meta.phase4.sub", "meta.phase4.owner", "meta.phase4.goal"],
  phase5: ["meta.phase5.title", "meta.phase5.sub", "meta.phase5.owner", "meta.phase5.goal"],
};

let activeTab = "overview";

function renderSectionNav() {
  const nav = document.getElementById("section-nav");
  nav.innerHTML = "";
  SECTIONS.forEach(([key, labelKey], i) => {
    const btn = document.createElement("button");
    btn.className = "section-item" + (key === activeTab ? " active" : "");
    btn.innerHTML = `<span>${t(labelKey)}</span>`;
    btn.addEventListener("click", () => setTab(key));
    nav.appendChild(btn);
  });
}

function setTab(key) {
  activeTab = key;
  renderSectionNav();
  const [titleKey, subKey, ownerKey, goalKey] = PAGE_META[key];
  document.getElementById("page-title").textContent = t(titleKey).replace(/&amp;/g, "&");
  document.getElementById("page-sub").innerHTML = t(subKey);
  const metaEl = document.getElementById("phase-meta");
  if (ownerKey) {
    metaEl.hidden = false;
    metaEl.innerHTML = `<span class="owner-tag">${t("meta.ownerlabel")} ${t(ownerKey)}</span><span class="goal-text">${t(goalKey)}</span>`;
  } else {
    metaEl.hidden = true;
  }
  document.querySelectorAll(".tab-panel").forEach((p) => (p.hidden = p.id !== "tab-" + key));
  withLoading(async () => {
    const ensureData = LAZY_DATA_LOADERS[key];
    if (ensureData) await ensureData();
    RENDERERS[key]();
  });
  window.scrollTo({ top: 0 });
}

/* ================================================================
   Stat strip (masthead) — inline ledger row, always visible
================================================================= */
function renderStatStrip() {
  const k = D.kpis;
  const items = [
    ["stat.applications", fmtInt(k.raw_rows)],
    ["stat.sample", fmtInt(k.sample_rows)],
    ["stat.segments", k.n_clusters],
    ["stat.rules", k.n_rules_documented],
    ["stat.maxlift", k.max_lift.toFixed(1) + "×"],
    ["stat.anomalies", fmtInt(k.n_anomalies_robust)],
  ];
  document.getElementById("stat-strip").innerHTML = items.map(([lk, v]) =>
    `<div class="stat-cell"><div class="l">${t(lk)}</div><div class="v">${v}</div></div>`).join("");
}

/* ================================================================
   Chip-filter helper
================================================================= */
function renderChips(container, options, activeSet, onToggle, tone) {
  container.innerHTML = "";
  container.classList.add("chip-row"); // display:flex + gap -- appendChild leaves zero whitespace between buttons otherwise
  options.forEach(([value, label]) => {
    const btn = document.createElement("button");
    btn.className = "chip" + (activeSet.has(value) ? " on" : "");
    if (tone) btn.dataset.tone = tone;
    btn.textContent = label;
    btn.addEventListener("click", () => {
      if (activeSet.has(value)) activeSet.delete(value); else activeSet.add(value);
      withLoading(onToggle);
    });
    container.appendChild(btn);
  });
}

/* ================================================================
   01 — Overview
================================================================= */
function renderOverview() {
  const k = D.kpis;
  renderExecSummary();
  renderPhaseHighlights();
  document.getElementById("ov-callout").innerHTML = `
    <p class="q">${t("ov.callout.q")}</p>
    <p class="a">${tf("ov.callout.a", { pct: `<b>${fmtPct(k.pct_anomalies_imputation_artifact, 1)}</b>` })}</p>`;

  hbarChart(document.getElementById("chart-action-taken"),
    Object.entries(D.action_taken_distribution).sort((a, b) => b[1] - a[1]).map(([label, value], i) => ({
      label, value, color: i === 0 ? "var(--ink-600)" : i === 1 ? "var(--red-600)" : i === 2 ? "var(--amber-600)" : "var(--text-muted)",
    })),
    { valueFmt: (v) => v.toFixed(1) + "%" });

  hbarChart(document.getElementById("chart-denial-reason"),
    Object.entries(D.denial_reason_distribution).sort((a, b) => b[1] - a[1]).map(([label, value]) => ({
      label, value, color: "var(--gold-600)",
    })),
    { valueFmt: (v) => v.toFixed(1) + "%" });

  renderAttrExplorer();

  const grid = document.getElementById("ov-kpi-cards");
  const cards = [
    ["16.08M", "ov.kpi.rawfile", "accent"],
    ["100,000", "ov.kpi.sample", ""],
    [k.dbscan_noise_pct + "%", "ov.kpi.dbscannoise", ""],
    [fmtInt(k.n_frequent_itemsets), "ov.kpi.itemsets", ""],
    [fmtInt(k.n_rules_filtered), "ov.kpi.nontrivial", "accent"],
    [k.max_lift + "×", "ov.kpi.maxlift", "accent"],
    [fmtInt(k.n_anomalies_all3), "ov.kpi.all3", "risk"],
    [fmtPct(k.pct_anomalies_imputation_artifact), "ov.kpi.artifact", "warn"],
  ];
  grid.innerHTML = cards.map(([v, lk, cls]) => `
    <div class="cluster-card" style="border-top-color:${cls === "risk" ? "var(--red-600)" : cls === "warn" ? "var(--amber-600)" : cls === "accent" ? "var(--ink-600)" : "var(--border-strong)"}">
      <div class="cc-meta" style="margin-bottom:6px">${t(lk)}</div>
      <div class="cc-name" style="font-size:27px">${v}</div>
    </div>`).join("");

  gaugeChart(document.getElementById("chart-artifact-gauge"), {
    min: 0, max: 100, value: k.pct_anomalies_imputation_artifact, color: "var(--amber-600)",
    valueFmt: (v) => v.toFixed(1) + "%",
  });
}

/* ================================================================
   Executive summary — plain-language front door. Reuses the SAME four
   findings shown in full (with evidence) on the Phase 5 tab -- this is
   a shorter restatement, not a separate set of claims.
================================================================= */
function renderExecSummary() {
  const k = D.kpis;
  document.getElementById("exec-summary-lede").innerHTML =
    tf("ov.exec.lede", { n: `<b>${fmtInt(k.raw_rows)}</b>` });
  document.getElementById("exec-summary-findings").innerHTML =
    `<ol class="rec-list" style="padding-left:20px">` + P5_FINDING_KEYS.map((fk) => `<li>${t(fk)}</li>`).join("") + `</ol>`;
  document.getElementById("exec-summary-jump").onclick = () => setTab("phase5");
}

/* ================================================================
   Overview — one real highlight per phase, each a jump link into that
   phase's full tab. Every number here already exists elsewhere on the
   dashboard; this just surfaces one representative result per phase.
================================================================= */
function renderPhaseHighlights() {
  const k = D.kpis;
  const topRule = [...RULES_26].sort((a, b) => b.lift - a.lift)[0];
  const purchasedCluster = D.cluster_profiles.find((c) => (S.phase2.cluster_outcomes[c.cluster] || {}).purchased_pct);
  const cards = [
    {
      key: "phase1", tag: t("hl.p1.tag"),
      stat: `${P1.feature_selection.retained.length} of ${P1.total_columns}`,
      label: t("hl.p1.label"),
    },
    {
      key: "phase2", tag: t("hl.p2.tag"),
      stat: purchasedCluster ? `${fmtPct(S.phase2.cluster_outcomes[purchasedCluster.cluster].demographics_missing_pct[0])}–${fmtPct(S.phase2.cluster_outcomes[purchasedCluster.cluster].demographics_missing_pct[1])}` : `${k.n_clusters} ${t("hl.p2.segmentsword")}`,
      label: purchasedCluster ? tf("hl.p2.label.a", { seg: segName(purchasedCluster.cluster) }) : t("hl.p2.label.b"),
    },
    {
      key: "phase3", tag: t("hl.p3.tag"),
      stat: `${topRule.lift.toFixed(1)}×`,
      label: tf("hl.p3.label", { a: humanizeItemset(topRule.antecedent), b: humanizeItemset(topRule.consequent) }),
    },
    {
      key: "phase4", tag: t("hl.p4.tag"),
      stat: fmtInt(k.n_anomalies_all3),
      label: tf("hl.p4.label", { pct: fmtPct(k.pct_anomalies_imputation_artifact, 1) }),
    },
    {
      key: "phase5", tag: t("hl.p5.tag"),
      stat: tf("hl.p5.stat", { n: P5_FINDING_KEYS.length }),
      label: tf("hl.p5.label", { n: P5_REC_KEYS.length }),
    },
  ];
  document.getElementById("ov-phase-highlights").innerHTML = cards.map((c) => `
    <div class="cluster-card" style="cursor:pointer" data-jump="${c.key}">
      <div class="cc-meta" style="margin-bottom:6px">${c.tag}</div>
      <div class="cc-name" style="font-size:26px;color:var(--ink-600)">${c.stat}</div>
      <div class="hint" style="margin:8px 0 0">${c.label}</div>
    </div>`).join("");
  document.querySelectorAll("#ov-phase-highlights [data-jump]").forEach((el) =>
    el.addEventListener("click", () => setTab(el.dataset.jump)));
}

/* ================================================================
   Full-population attribute explorer (Overview) — computed over all
   16,080,210 rows in Phase 1's streaming pass (pass1_stats.pkl), not the
   100K analysis sample used everywhere else on this dashboard.
================================================================= */
const ATTR_COLS = S.phase1.attribute_distributions;
const attrFilter = { col: "state_code", topN: 15 };
const ATTR_PALETTE = ["#1878c4", "#3a5a78", "#92701c", "#8f2f2f", "#5c6b80", "#4f6f96"];
/* A fixed slider range (smallest/largest value-count across ALL attributes, not
   just the selected one) instead of a per-attribute min/max -- switching to a
   low-cardinality attribute like Lien status (2 values) no longer has to shrink
   or disable the slider, it just clamps how many of its values are actually
   displayed (see Math.min(attrFilter.topN, maxN) below), same as dragging the
   slider past an attribute's own count already did. */
const ATTR_TOPN_BOUNDS = (() => {
  const counts = Object.values(ATTR_COLS.columns).map((c) => c.values.length);
  return { min: Math.min(...counts), max: Math.max(...counts) };
})();

function renderAttrChips() {
  renderChips(document.getElementById("attr-chips"),
    Object.keys(ATTR_COLS.columns).map((k) => [k, t(`attrexp.${k}`)]),
    new Set([attrFilter.col]),
    () => {}, null);
  // Single-select behavior: override the generic multi-toggle handler.
  document.querySelectorAll("#attr-chips .chip").forEach((btn, i) => {
    const key = Object.keys(ATTR_COLS.columns)[i];
    btn.onclick = () => {
      attrFilter.col = key;
      withLoading(() => renderAttrExplorer());
    };
  });
}

function renderAttrExplorer() {
  renderAttrChips();
  const col = ATTR_COLS.columns[attrFilter.col];
  const maxN = col.values.length;
  const slider = document.getElementById("attr-topn");
  slider.min = ATTR_TOPN_BOUNDS.min; slider.max = ATTR_TOPN_BOUNDS.max;
  slider.value = Math.min(Math.max(attrFilter.topN, ATTR_TOPN_BOUNDS.min), maxN);
  document.getElementById("attr-topn-readout").textContent = `${slider.value} of ${maxN}`;
  slider.oninput = () => {
    attrFilter.topN = +slider.value;
    document.getElementById("attr-topn-readout").textContent = `${Math.min(+slider.value, maxN)} of ${maxN}`;
    renderAttrExplorer();
  };
  const rows = col.values.slice(0, attrFilter.topN);
  // Scale the SVG's own height to the row count so 50+ states stay readable instead
  // of being squeezed into a fixed-height chart, and match its width to the actual
  // rendered width so bars/text render at true size on this full-width card.
  const svg = document.getElementById("chart-attr-explorer");
  const h = Math.max(150, rows.length * 25 + 20);
  const w = Math.round(svg.getBoundingClientRect().width) || 560;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  hbarChart(svg,
    rows.map((r, i) => ({ label: r.label, value: r.count, color: ATTR_PALETTE[i % ATTR_PALETTE.length] })),
    { valueFmt: (v) => fmtInt(v) + ` (${(v / ATTR_COLS.total_rows * 100).toFixed(1)}%)` });
}

/* ================================================================
   Phase 1 — Data Understanding & Preprocessing (full EDA)
   Every number here comes from data/checkpoints/pass1_stats.pkl, computed
   in one streaming pass over all 16,080,210 rows / 99 columns -- exact,
   not sampled.
================================================================= */
const P1 = S.phase1_eda;

function scaledBar(svg, rows, opts, rowH) {
  const h = Math.max(140, rows.length * (rowH || 20) + 20);
  // Match viewBox width to the SVG's actual rendered width so text/bars render at
  // their true intended size (a narrower fixed viewBox on a wide full-width card
  // stretches everything -- bars and text alike -- well past their intended size).
  const w = Math.round(svg.getBoundingClientRect().width) || 700;
  svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
  hbarChart(svg, rows, opts);
}

/* --- sub-tabs (Missing / Cardinality / Numeric stats) inside one card --- */
const P1_SUBTABS = [["missing", "p1.sub.missing"], ["cardinality", "p1.sub.cardinality"], ["numeric", "p1.sub.numeric"], ["continuous", "p1.sub.continuous"], ["entropy", "p1.sub.entropy"]];
let p1ActiveSub = "missing";
function renderP1Subtabs() {
  document.getElementById("p1-stats-subtabs").innerHTML = P1_SUBTABS.map(([k, lk]) =>
    `<button class="p1-subtab${k === p1ActiveSub ? " active" : ""}" data-k="${k}">${t(lk)}</button>`).join("");
  document.querySelectorAll(".p1-subtab").forEach((btn) => {
    btn.onclick = () => { p1ActiveSub = btn.dataset.k; renderP1Subtabs(); renderPhase1Stats(); };
  });
  ["missing", "cardinality", "numeric", "continuous", "entropy"].forEach((k) => {
    document.getElementById("p1-sub-" + k).hidden = k !== p1ActiveSub;
  });
}

/* --- Missing values --- */
const missingFilter = { search: "", minPct: 0, mode: "pct" };
function renderMissing() {
  renderChips(document.getElementById("missing-mode-chips"), [["pct", t("chip.percentage")], ["count", t("chip.rowcount")]],
    new Set([missingFilter.mode]), () => {}, null);
  document.querySelectorAll("#missing-mode-chips .chip").forEach((btn, i) => {
    const key = ["pct", "count"][i];
    btn.onclick = () => { missingFilter.mode = key; renderMissing(); };
  });
  document.getElementById("missing-search").value = missingFilter.search;
  document.getElementById("missing-search").oninput = (e) => { missingFilter.search = e.target.value.trim().toLowerCase(); renderMissing(); };
  const slider = document.getElementById("missing-threshold");
  slider.value = missingFilter.minPct;
  document.getElementById("missing-threshold-readout").textContent = `≥ ${missingFilter.minPct}%`;
  slider.oninput = () => {
    missingFilter.minPct = +slider.value;
    document.getElementById("missing-threshold-readout").textContent = `≥ ${missingFilter.minPct}%`;
    renderMissing();
  };
  const rows = P1.missing.filter((r) => r.pct >= missingFilter.minPct && r.col.toLowerCase().includes(missingFilter.search));
  document.getElementById("missing-count").textContent = tf("count.ofcolumns", { a: rows.length, b: P1.missing.length });
  scaledBar(document.getElementById("chart-missing"),
    rows.map((r) => ({
      label: r.col, value: missingFilter.mode === "pct" ? r.pct : r.missing,
      color: r.pct > 75 ? "var(--red-600)" : r.pct > 25 ? "var(--amber-600)" : "var(--ink-500)",
    })),
    { valueFmt: (v) => (missingFilter.mode === "pct" ? v.toFixed(1) + "%" : fmtInt(v)) }, 16);
}

/* --- Cardinality --- */
const cardFilter = { search: "", type: new Set(["categorical", "continuous"]), sort: "desc" };
function renderCardinality() {
  renderChips(document.getElementById("card-type-chips"), [["categorical", t("chip.categorical")], ["continuous", t("chip.continuous")]],
    cardFilter.type, () => renderCardinality());
  renderChips(document.getElementById("card-sort-chips"), [["desc", t("chip.mostuniquefirst")], ["asc", t("chip.fewestuniquefirst")]],
    new Set([cardFilter.sort]), () => {}, null);
  document.querySelectorAll("#card-sort-chips .chip").forEach((btn, i) => {
    const key = ["desc", "asc"][i];
    btn.onclick = () => { cardFilter.sort = key; renderCardinality(); };
  });
  document.getElementById("card-search").value = cardFilter.search;
  document.getElementById("card-search").oninput = (e) => { cardFilter.search = e.target.value.trim().toLowerCase(); renderCardinality(); };

  let rows = P1.cardinality.filter((r) => cardFilter.type.has(r.type) && r.col.toLowerCase().includes(cardFilter.search));
  rows = rows.slice().sort((a, b) => (cardFilter.sort === "desc" ? b.unique - a.unique : a.unique - b.unique));
  document.getElementById("card-count").textContent = tf("count.ofcolumns", { a: rows.length, b: P1.cardinality.length });
  document.getElementById("card-table").innerHTML =
    `<tr><th>${t("th.column")}</th><th>${t("th.type")}</th><th>${t("th.uniquevalues")}</th></tr>` +
    rows.map((r) => `<tr><td>${r.col}</td><td><span class="badge">${r.type}</span></td><td class="num">${fmtInt(r.unique)}</td></tr>`).join("");
}

/* --- Numeric stats --- */
const numericFilter = { search: "" };
function renderNumericStats() {
  document.getElementById("numeric-search").value = numericFilter.search;
  document.getElementById("numeric-search").oninput = (e) => { numericFilter.search = e.target.value.trim().toLowerCase(); renderNumericStats(); };
  const rows = P1.numeric_stats.filter((r) => r.col.toLowerCase().includes(numericFilter.search));
  document.getElementById("numeric-count").textContent = tf("count.ofcolumns", { a: rows.length, b: P1.numeric_stats.length });
  document.getElementById("numeric-table").innerHTML =
    `<tr><th>${t("th.column")}</th><th>${t("th.count")}</th><th>${t("th.mean")}</th><th>${t("th.stddev")}</th><th>${t("th.sum")}</th></tr>` +
    rows.map((r) => `<tr><td>${r.col}</td><td class="num">${fmtInt(r.count)}</td><td class="num">${r.mean.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td><td class="num">${r.std.toLocaleString("en-US", { maximumFractionDigits: 2 })}</td><td class="num">${fmtInt(r.sum)}</td></tr>`).join("");
}

function renderPhase1Stats() {
  if (p1ActiveSub === "missing") renderMissing();
  else if (p1ActiveSub === "cardinality") renderCardinality();
  else if (p1ActiveSub === "numeric") renderNumericStats();
  else if (p1ActiveSub === "continuous") renderP1Continuous();
  else renderP1Entropy();
}

/* --- Continuous distribution + boxplot (Plot 2 + Plot 3) --- */
const CONT_LABELS = {
  loan_amount: "Loan amount ($)", income: "Income ($1,000s)", property_value: "Property value ($)",
  interest_rate: "Interest rate (%)", combined_loan_to_value_ratio: "Combined LTV (%)", rate_spread: "Rate spread (pp)",
  total_loan_costs: "Total loan costs ($)", origination_charges: "Origination charges ($)", discount_points: "Discount points ($)",
  lender_credits: "Lender credits ($)", loan_term: "Loan term (months)", intro_rate_period: "Intro rate period (months)",
  tract_population: "Tract population", tract_minority_population_percent: "Tract minority pop. (%)",
  ffiec_msa_md_median_family_income: "FFIEC MSA/MD median family income ($)", tract_to_msa_income_percentage: "Tract-to-MSA income (%)",
  tract_owner_occupied_units: "Tract owner-occupied units", tract_one_to_four_family_homes: "Tract 1-4 family homes",
  tract_median_age_of_housing_units: "Tract median housing age (yrs)", derived_msa_md: "MSA/MD code", county_code: "County code", census_tract: "Census tract code",
};
const contFilter = { col: "loan_amount" };
function renderP1Continuous() {
  const cols = Object.keys(P1.continuous_distributions);
  renderChips(document.getElementById("p1cont-chips"), cols.map((c) => [c, CONT_LABELS[c] || c]), new Set([contFilter.col]), () => {}, null);
  document.querySelectorAll("#p1cont-chips .chip").forEach((btn, i) => {
    const key = cols[i];
    btn.onclick = () => { contFilter.col = key; renderP1Continuous(); };
  });
  const d = P1.continuous_distributions[contFilter.col];
  const fmt = (v) => Math.abs(v) >= 1000 ? fmtInt(v) : v.toFixed(2);
  document.getElementById("p1cont-badge").textContent = `n = ${fmtInt(d.total_numeric)}${d.non_numeric_n ? tf("p1cont.excluded", { n: fmtInt(d.non_numeric_n) }) : ""}`;
  histogramChart(document.getElementById("chart-p1cont-hist"),
    { counts: d.hist_counts, lo: d.hist_lo, hi: d.hist_hi, binWidth: d.hist_bin_width }, { xFmt: fmt });
  document.getElementById("p1cont-hist-note").textContent =
    tf("p1cont.histnote", { a: fmtInt(d.hist_below_lo), b: fmtInt(d.hist_above_hi) });
  boxplotChart(document.getElementById("chart-p1cont-box"),
    { min: d.min, q1: d.q1, median: d.median, q3: d.q3, max: d.max, loFence: d.iqr_lo_fence, hiFence: d.iqr_hi_fence, belowN: d.iqr_below_n, aboveN: d.iqr_above_n },
    { xFmt: fmt });
  document.getElementById("p1cont-box-note").textContent =
    tf("p1cont.boxnote", { a: fmtInt(d.iqr_below_n), b: fmtInt(d.iqr_above_n) });
}

/* --- Feature entropy (all 99 raw columns, exact) --- */
const entropyFilter = { search: "", topN: 30, sort: "asc" };
function renderP1Entropy() {
  renderChips(document.getElementById("entropy-sort-chips"),
    [["asc", t("chip.entropylow")], ["desc", t("chip.entropyhigh")]],
    new Set([entropyFilter.sort]), () => {}, null);
  document.querySelectorAll("#entropy-sort-chips .chip").forEach((btn, i) => {
    const key = ["asc", "desc"][i];
    btn.onclick = () => { entropyFilter.sort = key; renderP1Entropy(); };
  });
  document.getElementById("entropy-search").value = entropyFilter.search;
  document.getElementById("entropy-search").oninput = (e) => { entropyFilter.search = e.target.value.trim().toLowerCase(); renderP1Entropy(); };
  const slider = document.getElementById("entropy-topn");
  slider.value = entropyFilter.topN;
  document.getElementById("entropy-topn-readout").textContent = entropyFilter.topN;
  slider.oninput = () => { entropyFilter.topN = +slider.value; document.getElementById("entropy-topn-readout").textContent = slider.value; renderP1Entropy(); };

  let rows = P1.entropy.filter((r) => r.col.toLowerCase().includes(entropyFilter.search));
  rows = rows.slice().sort((a, b) => entropyFilter.sort === "asc" ? a.entropy - b.entropy : b.entropy - a.entropy);
  document.getElementById("entropy-count").textContent = tf("count.matchingcolumns", { a: Math.min(rows.length, entropyFilter.topN), b: rows.length });
  rows = rows.slice(0, entropyFilter.topN);
  scaledBar(document.getElementById("chart-entropy"),
    rows.map((r) => ({
      label: r.col, value: r.entropy,
      color: r.entropy < 0.5 ? "var(--red-600)" : r.is_continuous ? "var(--ink-500)" : "var(--gold-600)",
    })),
    { valueFmt: (v) => v.toFixed(3) + " bits" }, 18);
}

/* Exact processed-dataset entropy (Phase 1, Task 4's real numbers) -- only the
   near-constant columns it actually dropped on, not all 65 processed columns. */
function renderEntropyProcessed() {
  const rows = Object.entries(AD.entropy_processed)
    .map(([col, e]) => ({ col, e }))
    .filter((r) => r.e < 0.5)
    .sort((a, b) => a.e - b.e);
  document.getElementById("entropy-processed-table").innerHTML =
    `<tr><th>${t("th.column.processed")}</th><th>${t("th.entropybits")}</th></tr>` +
    rows.map((r) => `<tr><td>${r.col}</td><td class="num">${r.e.toFixed(4)}</td></tr>`).join("");
}

/* Exact 20x20 correlation matrix (Phase 1, Task 4) -- |r| is already
   non-negative from the notebook's own computation, so a single sequential
   heat scale (not diverging) is correct here. Most off-diagonal values sit
   in the 0-0.4 range with only a few pairs above 0.5, so heat() is called
   with a lower reference max (0.7, not 1.0) -- otherwise the common range
   compresses into visually-identical pale cells and only the diagonal
   stands out. Text color flips to white past the same reference point so
   numbers stay legible once the cell itself gets dark. */
function renderCorrelationMatrix() {
  const cm = AD.correlation_matrix;
  const cols = cm.columns;
  const short = (c) => (c.length > 18 ? c.slice(0, 16) + "…" : c);
  const REF_MAX = 0.7;
  let html = `<tr><th></th>${cols.map((c) => `<th title="${c}" style="writing-mode:vertical-rl;text-orientation:mixed;font-weight:600">${short(c)}</th>`).join("")}</tr>`;
  cm.matrix.forEach((row, i) => {
    html += `<tr><td class="row-label" title="${cols[i]}">${short(cols[i])}</td>` +
      row.map((v, j) => {
        const strong = v / REF_MAX > 0.72;
        return `<td class="matrix-cell" style="${heat(v, REF_MAX, "--ink-600")}${strong ? ";color:#fff" : ""}" title="${cols[i]} × ${cols[j]}: ${v.toFixed(3)}">${v.toFixed(2)}</td>`;
      }).join("") +
      `</tr>`;
  });
  document.getElementById("chart-correlation-matrix").innerHTML = html;
}

/* --- Categorical distribution explorer (Plot 1.5, generalized to 75 columns) --- */
const p1CatCols = Object.keys(P1.categorical_distributions).sort();
const p1CatFilter = { col: "derived_race", topN: 8, search: "" };
/* Fixed slider range (smallest/largest value-count across ALL 75 columns) instead
   of a per-column min/max -- see ATTR_TOPN_BOUNDS above for why. */
const P1CAT_TOPN_BOUNDS = (() => {
  const counts = Object.values(P1.categorical_distributions).map((v) => v.length);
  return { min: Math.min(...counts), max: Math.max(...counts) };
})();
function renderP1CatChips() {
  const q = p1CatFilter.search;
  const visible = p1CatCols.filter((c) => c.toLowerCase().includes(q));
  document.getElementById("p1cat-chips").innerHTML = visible.map((c) =>
    `<button class="chip${c === p1CatFilter.col ? " on" : ""}" data-c="${c}">${c}</button>`).join("") ||
    `<span class="hint" style="margin:0">${tf("p1cat.nomatch", { q })}</span>`;
  document.querySelectorAll("#p1cat-chips .chip").forEach((btn) => {
    btn.onclick = () => {
      p1CatFilter.col = btn.dataset.c;
      renderP1Cat();
    };
  });
}
function renderP1Cat() {
  document.getElementById("p1cat-search").value = p1CatFilter.search;
  document.getElementById("p1cat-search").oninput = (e) => { p1CatFilter.search = e.target.value.trim().toLowerCase(); renderP1CatChips(); };
  renderP1CatChips();
  const values = P1.categorical_distributions[p1CatFilter.col];
  const maxN = values.length;
  const slider = document.getElementById("p1cat-topn");
  slider.min = P1CAT_TOPN_BOUNDS.min; slider.max = P1CAT_TOPN_BOUNDS.max;
  slider.value = Math.min(Math.max(p1CatFilter.topN, P1CAT_TOPN_BOUNDS.min), maxN);
  document.getElementById("p1cat-topn-readout").textContent = `${slider.value} of ${maxN}`;
  slider.oninput = () => {
    p1CatFilter.topN = +slider.value;
    document.getElementById("p1cat-topn-readout").textContent = `${Math.min(+slider.value, maxN)} of ${maxN}`;
    renderP1Cat();
  };
  document.getElementById("p1cat-badge").textContent = tf("p1cat.badge", { n: P1.n_categorical, col: p1CatFilter.col });
  const rows = values.slice(0, p1CatFilter.topN);
  scaledBar(document.getElementById("chart-p1cat"),
    rows.map((r, i) => ({ label: r.label, value: r.count, color: ATTR_PALETTE[i % ATTR_PALETTE.length] })),
    { valueFmt: (v) => fmtInt(v) + ` (${(v / P1.total_rows * 100).toFixed(1)}%)` }, 24);
}

/* --- Feature selection outcome --- */
const fsFilter = { status: new Set(["retained", "redundant", "cleaning"]), search: "" };
const FS_META = {
  retained: { labelKey: "fs.retained", tone: "" },
  redundant: { labelKey: "fs.redundant", tone: "warn" },
  cleaning: { labelKey: "fs.cleaning", tone: "risk" },
};
function renderFeatureSelection() {
  renderChips(document.getElementById("fs-chips"),
    Object.entries(FS_META).map(([k, m]) => [k, t(m.labelKey)]), fsFilter.status, () => renderFeatureSelection());
  document.querySelectorAll("#fs-chips .chip").forEach((btn, i) => {
    const key = Object.keys(FS_META)[i];
    if (fsFilter.status.has(key)) btn.dataset.tone = FS_META[key].tone;
  });
  document.getElementById("fs-search").value = fsFilter.search;
  document.getElementById("fs-search").oninput = (e) => { fsFilter.search = e.target.value.trim().toLowerCase(); renderFeatureSelection(); };

  let rows = [];
  Object.entries(P1.feature_selection).forEach(([status, list]) => {
    if (fsFilter.status.has(status)) rows.push(...list.map((r) => ({ ...r, status })));
  });
  rows = rows.filter((r) => r.col.toLowerCase().includes(fsFilter.search)).sort((a, b) => a.col.localeCompare(b.col));
  document.getElementById("fs-count").textContent = tf("count.of99columns", { a: rows.length });
  document.getElementById("fs-table").innerHTML =
    `<tr><th>${t("th.column")}</th><th>${t("th.status")}</th><th>${t("th.reason")}</th></tr>` +
    rows.map((r) => `<tr><td>${r.col}</td><td><span class="badge" style="color:${r.status === "retained" ? "var(--ink-600)" : r.status === "redundant" ? "var(--amber-600)" : "var(--red-600)"}">${r.status}</span></td><td>${r.reason}</td></tr>`).join("");
}

function renderPhase1() {
  document.getElementById("p1-kpis").innerHTML = [
    [fmtInt(P1.total_rows), "p1kpi.rowsscanned"],
    [P1.total_columns, "p1kpi.columnsscanned"],
    [P1.n_categorical, "p1kpi.categorical"],
    [P1.n_continuous, "p1kpi.continuous"],
    [P1.feature_selection.cleaning.length, "p1kpi.droppedmissing", "risk"],
    [P1.feature_selection.redundant.length, "p1kpi.droppedentropy", "warn"],
    [P1.feature_selection.retained.length, "p1kpi.retained", "accent"],
  ].map(([v, lk, cls]) => `<div class="cluster-card" style="border-top-color:${cls === "risk" ? "var(--red-600)" : cls === "warn" ? "var(--amber-600)" : cls === "accent" ? "var(--ink-600)" : "var(--border-strong)"}"><div class="cc-meta" style="margin-bottom:6px">${t(lk)}</div><div class="cc-name" style="font-size:25px">${v}</div></div>`).join("");

  renderP1Subtabs();
  renderPhase1Stats();
  renderEntropyProcessed();
  renderCorrelationMatrix();
  renderP1Cat();
  renderFeatureSelection();
}

/* ================================================================
   02 — Segmentation (with real filters: cluster + outlier-signal toggles)
================================================================= */
/* Scatter data (x, y, cluster, dbscan-noise, anomaly votes, and the 3 individual
   detector flags for all 100,000 analysis-sample rows) is loaded from a Parquet
   file instead of JSON -- 100,000 rows x 8 columns as JSON was ~12.7MB even
   minified; as columnar/binary/snappy-compressed Parquet it's under 500KB.
   Populated asynchronously by loadScatterData() before the first render (see
   boot sequence at the bottom of this file) -- every renderer that reads
   SCATTER_ROWS/SEG_POINTS only ever runs after that has resolved. */
let SCATTER_ROWS = [];
let SEG_POINTS = [];
async function loadScatterData() {
  const bytes = Uint8Array.from(atob(SCATTER_PARQUET_B64), (c) => c.charCodeAt(0));
  const rows = await hyparquet.parquetReadObjects({ file: bytes.buffer });
  SCATTER_ROWS = rows.map((r, i) => ({
    x: r.x, y: r.y, cluster: r.cluster, noise: r.noise, votes: r.votes,
    iqr: r.iqr, z: r.z, iso: r.iso, idx: i,
    loan_amount: r.loan_amount, income: r.income, property_value: r.property_value, interest_rate: r.interest_rate,
  }));
  SEG_POINTS = SCATTER_ROWS;
}
/* Axes the Phase 4 anomaly map can plot -- "pc1"/"pc2" (the default) are the
   same PCA projection Phase 2's map uses; the other 4 are the actual raw
   feature values (reconstructed from the log1p/Z-score transforms), for
   plotting genuine variables instead of an abstract PCA axis. */
const ANOM_AXIS_FIELDS = {
  pc1: { key: "x", labelKey: "axis.pc1" }, pc2: { key: "y", labelKey: "axis.pc2" },
  loan_amount: { key: "loan_amount", labelKey: "axis.loanamount" },
  income: { key: "income", labelKey: "axis.income" },
  property_value: { key: "property_value", labelKey: "axis.propertyvalue" },
  interest_rate: { key: "interest_rate", labelKey: "axis.interestrate" },
};
const anomAxis = { x: "pc1", y: "pc2" };

/* Phase 2 is pure K-Means segmentation -- the only outlier signal that belongs
   here is DBSCAN's own noise set (also Phase 2's method). IQR/Z-score/Isolation
   Forest are Phase 4's detectors; overlaying them here too used to blur the two
   phases together. They still get cross-referenced against DBSCAN noise (see
   "DBSCAN density structure" below and Phase 4's own crossref table) -- just not
   as a second filter row on this map. */
const OUTLIER_DEFS = {
  dbscan: { labelKey: "outlier.dbscan", tone: "risk", swatch: "ring", color: "var(--red-600)",
    filter: (p) => p.noise, marker: { radiusFn: () => 5.5, colorFn: () => "rgba(0,0,0,0)", strokeFn: () => "var(--red-600)" } },
};

const segFilter = { clusters: new Set([0, 1, 2, 3]), outliers: new Set(["dbscan"]), flaggedOnly: false };
const FLAG_THRESHOLD = 30;
function isFlagged(c) { return c.income_imputed_pct > FLAG_THRESHOLD || c.property_value_imputed_pct > FLAG_THRESHOLD; }

function renderSegChips() {
  renderChips(document.getElementById("cluster-chips"),
    D.cluster_profiles.map((c) => [c.cluster, segNameShort(c.cluster)]),
    segFilter.clusters, () => renderSegmentation());
  renderChips(document.getElementById("outlier-chips"),
    Object.entries(OUTLIER_DEFS).map(([k, d]) => [k, t(d.labelKey)]),
    segFilter.outliers, () => renderSegmentation());
  document.querySelectorAll("#outlier-chips .chip").forEach((btn, i) => {
    const key = Object.keys(OUTLIER_DEFS)[i];
    if (segFilter.outliers.has(key)) btn.dataset.tone = OUTLIER_DEFS[key].tone;
  });
  const flagChip = document.getElementById("flagged-only-chip");
  flagChip.classList.toggle("on", segFilter.flaggedOnly);
  flagChip.onclick = () => { segFilter.flaggedOnly = !segFilter.flaggedOnly; withLoading(() => renderSegmentation()); };
  document.getElementById("seg-reset").onclick = () => {
    segFilter.clusters = new Set([0, 1, 2, 3]); segFilter.outliers = new Set(["dbscan"]); segFilter.flaggedOnly = false;
    withLoading(() => renderSegmentation());
  };
}

function renderSegmentBubbleChart() {
  // interest_rate_median is 4.78% for all 4 segments (it wasn't a segmentation
  // driver), so it can't tell the bubbles apart on an axis -- income and loan
  // amount both vary meaningfully across segments (74-124 vs 175K-275K).
  const rows = D.cluster_profiles.filter((c) => segFilter.clusters.has(c.cluster));
  bubbleChart(document.getElementById("chart-segment-bubble"),
    rows.map((c) => ({ x: c.income_median_reported, y: c.loan_amount_median, n: c.n, cluster: c.cluster })),
    {
      xLabel: t("cc.income"), yLabel: t("cc.loanamount"),
      sizeFn: (p) => p.n, colorFn: (p) => CLUSTER_PALETTE[p.cluster] || "#999",
      tooltipFn: (p) => `<b>${segName(p.cluster)}</b><br>${fmtInt(p.n)} applicants<br>${t("cc.income")}: ${fmtUSD(p.x * 1000)}<br>${t("cc.loanamount")}: ${fmtUSD(p.y)}`,
    });
  // Numbers on the bubbles (1, 2, 3...) match this legend, in the same order --
  // full segment names have no safe place to sit directly on the chart (see
  // bubbleChart's own comment on why).
  document.getElementById("segment-bubble-legend").innerHTML = rows.map((c, i) =>
    `<div class="legend-item"><span class="sw circle" style="background:${CLUSTER_PALETTE[c.cluster]}"></span><b class="num">${i + 1}</b> ${segName(c.cluster)}</div>`
  ).join("");
}
function renderSegmentation() {
  renderSegChips();
  renderSegmentBubbleChart();
  const shown = SEG_POINTS.filter((p) => !p.noise && segFilter.clusters.has(p.cluster));

  const layers = Object.entries(OUTLIER_DEFS)
    .filter(([key]) => segFilter.outliers.has(key))
    .map(([key, d]) => ({
      points: SEG_POINTS.filter(d.filter),
      radiusFn: d.marker.radiusFn, colorFn: d.marker.colorFn, strokeFn: d.marker.strokeFn, opacity: 1,
    }));

  scatterChart(document.getElementById("chart-cluster-map"), shown, {
    xLabel: `PC1 (${D.cluster_map.pc1_var}% var.)`, yLabel: `PC2 (${D.cluster_map.pc2_var}% var.)`,
    radiusFn: () => 3.2, opacity: 0.68,
    colorFn: (p) => CLUSTER_PALETTE[p.cluster] || "#999",
    tooltipFn: (p) => {
      const names = p.votes ? detectorNames(p.idx) : null;
      const which = names && names.length ? ` (${names.join(", ")})` : "";
      return `<b>${segName(p.cluster)}</b><br>PCA (${p.x.toFixed(2)}, ${p.y.toFixed(2)})${p.votes ? `<br>${tf("tt.anomalyvotes", { n: p.votes, which })}` : ""}`;
    },
    layers,
  });

  document.getElementById("seg-count").textContent = tf("count.pointsshown", { a: fmtInt(shown.length), b: fmtInt(SEG_POINTS.filter((p) => !p.noise).length) });

  const legend = document.getElementById("cluster-legend");
  legend.innerHTML = D.cluster_profiles.map((c) =>
    `<div class="legend-item legend-clickable" data-cluster="${c.cluster}"><span class="sw circle" style="background:${CLUSTER_PALETTE[c.cluster]}${segFilter.clusters.has(c.cluster) ? "" : ";opacity:.3"}"></span>${segName(c.cluster)}</div>`
  ).join("") + Object.entries(OUTLIER_DEFS).map(([key, d]) =>
    `<div class="legend-item legend-clickable" data-outlier="${key}"><span class="sw ${d.swatch}" style="${d.swatch === "ring" ? "color" : "background"}:${d.color}${segFilter.outliers.has(key) ? "" : ";opacity:.3"}"></span>${t(d.labelKey)}</div>`
  ).join("");
  // The legend doubles as a toggle -- same state as the chip rows above, just
  // clickable right on the chart too (no need to look away to filter).
  legend.querySelectorAll("[data-cluster]").forEach((el) => {
    el.onclick = () => {
      const cl = +el.dataset.cluster;
      if (segFilter.clusters.has(cl)) segFilter.clusters.delete(cl); else segFilter.clusters.add(cl);
      withLoading(() => renderSegmentation());
    };
  });
  legend.querySelectorAll("[data-outlier]").forEach((el) => {
    el.onclick = () => {
      const key = el.dataset.outlier;
      if (segFilter.outliers.has(key)) segFilter.outliers.delete(key); else segFilter.outliers.add(key);
      withLoading(() => renderSegmentation());
    };
  });

  const outcomes = S.phase2.cluster_outcomes;
  const grid = document.getElementById("cluster-cards");
  const cardRows = D.cluster_profiles.filter((c) => segFilter.clusters.has(c.cluster) && (!segFilter.flaggedOnly || isFlagged(c)));
  grid.innerHTML = cardRows.map((c) => {
    const o = outcomes[c.cluster];
    let flag = "";
    if (c.income_imputed_pct > 30) flag = `<div class="cc-flag">${tf("cc.flag.income", { pct: fmtPct(c.income_imputed_pct) })}</div>`;
    else if (c.property_value_imputed_pct > 30) flag = `<div class="cc-flag">${tf("cc.flag.property", { pct: fmtPct(c.property_value_imputed_pct) })}</div>`;
    let outcomeLine = "";
    if (o.originated_pct) outcomeLine = tf("cc.outcome.originated", { pct: fmtPct(o.originated_pct) });
    if (o.withdrawal_pct) outcomeLine = tf("cc.outcome.withdrawn", { pct: fmtPct(o.withdrawal_pct) });
    if (o.purchased_pct) outcomeLine = tf("cc.outcome.purchased", { pct: fmtPct(o.purchased_pct), a: o.demographics_missing_pct[0], b: o.demographics_missing_pct[1] });
    return `<div class="cluster-card" style="border-top-color:${CLUSTER_PALETTE[c.cluster]}">
      <div class="cc-name">${segName(c.cluster)}</div>
      <div class="cc-meta">${tf("cc.nsample", { n: fmtInt(c.n), pct: fmtPct(c.pct) })}</div>
      <div class="cc-stats">
        <div class="cc-stat"><div class="l">${t("cc.loanamount")}</div><div class="v">${fmtUSD(c.loan_amount_median)}</div></div>
        <div class="cc-stat"><div class="l">${t("cc.income")}</div><div class="v">${fmtUSD(c.income_median_reported * 1000)}</div></div>
        <div class="cc-stat"><div class="l">${t("cc.propertyvalue")}</div><div class="v">${fmtUSD(c.property_value_median_reported)}</div></div>
        <div class="cc-stat"><div class="l">${t("cc.interestrate")}</div><div class="v">${c.interest_rate_median}%</div></div>
      </div>
      <div class="hint" style="margin:10px 0 0">${outcomeLine}</div>
      ${flag}
    </div>`;
  }).join("") || `<p class="hint">${t("cc.noneselected")}</p>`;

  renderSignalMatrix();
  renderDominantAttributes();
  renderElbowSilhouette();
  renderKDistance();
  renderDendrograms();
  render3DPCA();
  const dbscanSvg = document.getElementById("chart-dbscan-split");
  const dbscanW = Math.round(dbscanSvg.getBoundingClientRect().width) || 1000;
  dbscanSvg.setAttribute("viewBox", `0 0 ${dbscanW} 220`);
  donutChart(dbscanSvg, [
    { label: t("dbscan.densemass"), value: 99.4, color: "var(--ink-500)" },
    { label: t("dbscan.noise"), value: 0.6, color: "var(--red-600)" },
  ]);
  document.getElementById("linkage-finding").innerHTML = t("p2.linkage.finding");
}

function renderElbowSilhouette() {
  const es = S.phase2.elbow_silhouette;
  dualLineChart(document.getElementById("chart-elbow-silhouette"),
    es.k_values.map((k) => `K=${k}`),
    { label: t("chart.inertia"), values: es.inertia, color: "var(--ink-500)", fmt: (v) => (v / 1e6).toFixed(2) + "M" },
    { label: t("chart.silhouette"), values: es.silhouette, color: "var(--amber-600)", fmt: (v) => v.toFixed(3) });
  document.getElementById("elbow-note").textContent = es.note;
}

/* --- Addendum exports: real k-distance curve, dendrograms, 3D PCA ---
   (reports/phase5/web/data/dashboard_kdist_dendrogram.json, merged into DASHBOARD.addendum) */
function renderKDistance() {
  const kd = AD.kdistance;
  const svg = document.getElementById("chart-kdistance");
  const w = Math.round(svg.getBoundingClientRect().width) || 560;
  svg.setAttribute("viewBox", `0 0 ${w} 260`);
  lineChart(svg, kd.curve.map((p) => ({ x: p.i, y: p.d })), {
    xLabel: t("kdist.xlabel"), yLabel: tf("kdist.ylabel", { n: kd.min_samples }),
    xFmt: (v) => fmtInt(v), yFmt: (v) => v.toFixed(1),
    thresholdY: kd.eps, thresholdLabel: `eps = ${kd.eps}`,
    markPoint: { x: kd.knee_index, y: kd.eps, label: t("kdist.knee") },
    tooltipFn: (p) => tf("kdist.tooltip", { i: fmtInt(p.x), pct: ((p.x / kd.n_points) * 100).toFixed(1), d: p.y.toFixed(3) }),
  });
}

function renderDendrograms() {
  dendrogramChart(document.getElementById("chart-dendro-ward"), AD.dendrogram_ward, { color: "var(--ink-500)" });
  dendrogramChart(document.getElementById("chart-dendro-average"), AD.dendrogram_average, { color: "var(--amber-600)" });
}

function render3DPCA() {
  const pv = AD.pca_3d.pc_variance_pct;
  document.getElementById("pca3d-badge").textContent =
    `PC1 ${pv[0]}% · PC2 ${pv[1]}% · PC3 ${pv[2]}% (${(pv[0] + pv[1] + pv[2]).toFixed(1)}% total)`;
  const pts = AD.pca_3d.points;
  const grid = document.getElementById("pca3d-grid");
  const pairs = [
    ["x", "y", `PC1 (${pv[0]}%)`, `PC2 (${pv[1]}%)`],
    ["x", "z", `PC1 (${pv[0]}%)`, `PC3 (${pv[2]}%)`],
    ["y", "z", `PC2 (${pv[1]}%)`, `PC3 (${pv[2]}%)`],
  ];
  grid.innerHTML = pairs.map((_, i) => `<div><svg id="chart-pca3d-${i}" width="100%" viewBox="0 0 320 260" preserveAspectRatio="xMidYMid meet"></svg></div>`).join("");
  pairs.forEach(([xk, yk, xLabel, yLabel], i) => {
    scatterChart(document.getElementById(`chart-pca3d-${i}`),
      pts.map((p) => ({ x: p[xk], y: p[yk], cluster: p.cluster })),
      { xLabel, yLabel, radiusFn: () => 2.6, opacity: 0.6, colorFn: (p) => CLUSTER_PALETTE[p.cluster] || "#999",
        tooltipFn: (p) => `<b>${segName(p.cluster)}</b>` });
  });
}

const DOM_ATTR_COLS = [
  ["derived_race_top", "attr.race"], ["derived_sex_top", "attr.sex"], ["derived_ethnicity_top", "attr.ethnicity"],
  ["loan_purpose_top", "attr.loanpurpose"], ["action_taken_top", "attr.outcome"], ["state_code_top", "attr.state"],
  ["derived_loan_product_type_top", "attr.loanproduct"],
];
/* Which DOM_ATTR_COLS columns are shown -- all 7 by default. Lets the table
   narrow down to just the columns someone cares about (e.g. only Race +
   Ethnicity) instead of always showing all 7 side by side. */
const domAttrFilter = new Set(DOM_ATTR_COLS.map(([k]) => k));
function renderDomAttrChips() {
  renderChips(document.getElementById("dom-attr-chips"), DOM_ATTR_COLS.map(([k, lk]) => [k, t(lk)]),
    domAttrFilter, () => renderDominantAttributes());
}
function renderDominantAttributes() {
  renderDomAttrChips();
  const rows = D.cluster_profiles.filter((c) => segFilter.clusters.has(c.cluster) && (!segFilter.flaggedOnly || isFlagged(c)));
  const attrs = S.phase2.dominant_attributes;
  const cols = DOM_ATTR_COLS.filter(([k]) => domAttrFilter.has(k));
  document.getElementById("dominant-attr-table").innerHTML =
    `<tr><th>${t("th.segment")}</th>${cols.map(([, lk]) => `<th>${t(lk)}</th>`).join("")}</tr>` +
    rows.map((c) => {
      const a = attrs[c.cluster];
      return `<tr><td style="border-left:3px solid ${CLUSTER_PALETTE[c.cluster]}">${segName(c.cluster)}</td>${cols.map(([k]) => `<td>${a[k]}</td>`).join("")}</tr>`;
    }).join("") || `<tr><td>${t("domattr.nonselected")}</td></tr>`;
}

function heat(value, max, hueVar) {
  const t = Math.max(0, Math.min(1, value / max));
  return `background: color-mix(in srgb, var(${hueVar}) ${Math.round(t * 65)}%, var(--surface));`;
}
function renderSignalMatrix() {
  const rows = D.cluster_profiles.filter((c) => segFilter.clusters.has(c.cluster) && (!segFilter.flaggedOnly || isFlagged(c)));
  if (!rows.length) { document.getElementById("signal-matrix").innerHTML = `<tr><td class="row-label">${t("signal.nomatch")}</td></tr>`; return; }
  const maxIncomeImp = Math.max(...D.cluster_profiles.map((r) => r.income_imputed_pct), 1);
  const maxPropImp = Math.max(...D.cluster_profiles.map((r) => r.property_value_imputed_pct), 1);
  const maxLoan = Math.max(...D.cluster_profiles.map((r) => r.loan_amount_median), 1);
  let html = `<tr><th>${t("th.segment")}</th><th>${t("signal.n")}</th><th>${t("signal.loanamount")}</th><th>${t("signal.income")}</th><th>${t("signal.incomeimputed")}</th><th>${t("signal.propimputed")}</th></tr>`;
  rows.forEach((c) => {
    html += `<tr>
      <td class="row-label">${segName(c.cluster)}</td>
      <td class="matrix-cell">${fmtInt(c.n)}</td>
      <td class="matrix-cell" style="${heat(c.loan_amount_median, maxLoan, "--teal-600")}">${fmtUSD(c.loan_amount_median)}</td>
      <td class="matrix-cell">${fmtUSD(c.income_median_reported * 1000)}</td>
      <td class="matrix-cell" style="${heat(c.income_imputed_pct, maxIncomeImp, "--red-600")}">${fmtPct(c.income_imputed_pct)}</td>
      <td class="matrix-cell" style="${heat(c.property_value_imputed_pct, maxPropImp, "--amber-600")}">${fmtPct(c.property_value_imputed_pct)}</td>
    </tr>`;
  });
  document.getElementById("signal-matrix").innerHTML = html;
}

/* ================================================================
   03 — Rules (lift + confidence + attribute-group + text filters)
================================================================= */
/* minConf defaults to 0.4, not the more typical 0.5: one of the 26 documented rules
   (the DTI -> denial-reason rule mined on the denied-only subset, confidence 0.4438)
   was legitimately included by Phase 3 under a separate, lower threshold for that
   subset -- 0.5 as a default would silently hide it, showing "25 of 26" on first load. */
const rulesFilter = { minLift: 1, minConf: 0.4, groups: new Set(RULE_GROUP_KINDS), text: "", features: new Set() };

/* The 26 fully documented rules -- real antecedent/consequent ITEMSETS (not
   decomposed pairs), with real support/confidence/lift from the notebook's
   own Apriori output: 10 outcome rules + 8 other high-lift co-occurrence
   rules + 8 denial-reason rules (mined on the denied-applications subset
   only) = 26, matching the "rules documented" KPI exactly. */
const RULES_26 = S.phase3.rules_documented;

/* All 22 rule-network node ids, sorted by how often they appear (most-connected
   first) so the highest-value "filter to exactly this feature" chips lead. */
const GROUP_TAG = {
  derived_sex: "sex", applicant_age: "age", derived_race: "race", derived_ethnicity: "ethnicity",
  action_taken: "outcome", derived_loan_product_type: "product", income: "income",
  property_value: "property", loan_amount: "loan amt", interest_rate: "rate",
  debt_to_income_ratio: "DTI", hoepa_status: "HOEPA", open_end_line_of_credit: "open-end",
  loan_purpose: "purpose", state_code: "state", denial_reason_1: "denial",
};
function featureChipLabel(node) { return `${GROUP_TAG[node.group] || node.group}: ${shortToken(node.id)}`; }
/* D.rule_network is part of the lazy Phase 3 data chunk (see ensurePhase3Data),
   so this can't be a top-level const computed at script-parse time like before
   -- it's computed once on first use instead, always after Phase 3's data has
   already been loaded (every caller is inside a Phase 3 render function). */
let _allFeatureNodes = null;
function getAllFeatureNodes() {
  if (_allFeatureNodes) return _allFeatureNodes;
  const deg = {};
  D.rule_network.edges.forEach((e) => { deg[e.source] = (deg[e.source] || 0) + 1; deg[e.target] = (deg[e.target] || 0) + 1; });
  _allFeatureNodes = D.rule_network.nodes.slice().sort((a, b) => (deg[b.id] || 0) - (deg[a.id] || 0));
  return _allFeatureNodes;
}

function ruleMatches26(r) {
  if (r.lift < rulesFilter.minLift || r.confidence < rulesFilter.minConf) return false;
  const allTokens = [...r.antecedent, ...r.consequent];
  if (!allTokens.some((t) => rulesFilter.groups.has(tokenKind(t)))) return false;
  if (rulesFilter.features.size && !allTokens.some((t) => rulesFilter.features.has(t))) return false;
  if (rulesFilter.text) {
    const hay = allTokens.map(shortToken).join(" ").toLowerCase();
    if (!hay.includes(rulesFilter.text)) return false;
  }
  return true;
}

/* Sentence-form narrative for a multi-item antecedent/consequent, e.g.
   "Applications where A and B are also disproportionately likely to have C." */
function humanizeItemset(tokens) {
  const parts = tokens.map(humanizeToken);
  if (parts.length === 1) return parts[0];
  if (parts.length === 2) return `${parts[0]} and ${parts[1]}`;
  return parts.slice(0, -1).join(", ") + ", and " + parts[parts.length - 1];
}

/* ================================================================
   Evidence + Action per rule -- grounded in the analysis actually run
   (Overview's cross-method triangulation, Phase 4's DTI cross-checks).
   Every one of the 26 documented rules falls into one of these three
   already-verified pattern families (see rule.category), so there's no
   generic filler case.
================================================================= */
const RULE_EA = {
  purchased: { evidenceKey: "ea.purchased.evidence", actionKey: "ea.purchased.action" },
  withdrawn: { evidenceKey: "ea.withdrawn.evidence", actionKey: "ea.withdrawn.action" },
  denial: { evidenceKey: "ea.denial.evidence", actionKey: "ea.denial.action" },
};
function classifyRule(r) {
  const ea = RULE_EA[r.category];
  if (ea) return { evidence: t(ea.evidenceKey), action: t(ea.actionKey) };
  return {
    evidence: tf("ea.default.evidence", { lift: r.lift.toFixed(1), conf: (r.confidence * 100).toFixed(0) }),
    action: t("ea.default.action"),
  };
}

const REC_COLS = ["state_code", "applicant_age", "derived_loan_product_type", "derived_race", "derived_sex",
  "derived_ethnicity", "income", "property_value", "debt_to_income_ratio", "action_taken", "denial_reason_1"];
const REC_LABELS = { state_code: "rec.state", applicant_age: "rec.age", derived_loan_product_type: "rec.product",
  derived_race: "rec.race", derived_sex: "rec.sex", derived_ethnicity: "rec.ethnicity", income: "rec.income", property_value: "rec.propertyvalue",
  debt_to_income_ratio: "rec.dti", action_taken: "rec.outcome", denial_reason_1: "rec.denialreason" };
function exampleTable(examples) {
  return `<div class="ex-wrap"><table class="data-table ex-table">
    <tr>${REC_COLS.map((c) => `<th>${t(REC_LABELS[c])}</th>`).join("")}</tr>
    ${examples.map((row) => `<tr>${REC_COLS.map((c) => `<td>${row[c]}</td>`).join("")}</tr>`).join("")}
  </table></div>`;
}

function renderRuleFilterChips() {
  renderChips(document.getElementById("group-chips"),
    RULE_GROUP_KINDS.map((k) => [k, t(GROUP_META[k].labelKey)]),
    rulesFilter.groups, () => renderRules(false));
  renderChips(document.getElementById("feature-chips"),
    getAllFeatureNodes().map((n) => [n.id, featureChipLabel(n)]),
    rulesFilter.features, () => renderRules(false));
}

function renderRuleList() {
  const list = document.getElementById("rules-list");
  const filtered = RULES_26.filter(ruleMatches26).sort((a, b) => b.lift - a.lift);
  document.getElementById("rules-count").textContent = tf("rules.matchcount", { a: filtered.length, b: RULES_26.length });
  if (!filtered.length) { list.innerHTML = `<p class="hint">${t("rules.nomatch")}</p>`; return; }
  list.innerHTML = filtered.map((r, i) => {
    const { evidence, action } = classifyRule(r);
    return `
    <div class="rule-card">
      <div class="rule-head"><span class="rule-no">${tf("rules.ruleno", { n: i + 1 })}</span><span class="rule-lift">${tf("rules.liftbadge", { n: r.lift.toFixed(2) })}</span></div>
      <p class="rule-narr">${tf("rules.narrative", { a: humanizeItemset(r.antecedent), b: humanizeItemset(r.consequent) })}</p>
      <div class="rule-meter"><div class="rule-meter-fill" style="width:${Math.max(4, r.confidence * 100).toFixed(0)}%"></div></div>
      <div class="rule-meta">${tf("rules.meta", { sup: (r.support * 100).toFixed(1), conf: (r.confidence * 100).toFixed(0), lift: r.lift.toFixed(1) })}</div>
      <div class="rule-ea">
        <div class="rule-ea-row"><span class="rule-ea-tag">${t("rules.evidence")}</span><span>${evidence}</span></div>
        <div class="rule-ea-row"><span class="rule-ea-tag action">${t("rules.action")}</span><span>${action}</span></div>
        ${r.examples ? `<div class="rule-ea-row"><span class="rule-ea-tag ex">${t("rules.example")}</span><span>${t("rules.exampleintro")}</span></div>${exampleTable(r.examples)}` : ""}
      </div>
    </div>`;
  }).join("");
}

function renderRules(fullInit = true) {
  if (fullInit) {
    const k = D.kpis;
    document.getElementById("rules-summary").textContent =
      tf("rules.summary", {
        itemsets: fmtInt(S.phase3.itemsets_total), total: fmtInt(S.phase3.rules_total_lift_conf),
        nontrivial: fmtInt(S.phase3.rules_nontrivial), documented: k.n_rules_documented, nodes: D.rule_network.nodes.length,
      });
    renderItemsetSizeChart();
    renderSupportHistogram();

    const maxLift = Math.max(...D.rules_scatter.map((r) => r.lift));
    const rulePoints = D.rules_scatter.map((r) => ({ x: r.support, y: r.confidence, lift: r.lift }));
    scatterChart(document.getElementById("chart-rules-scatter"), rulePoints, {
      xLabel: t("axis.support"), yLabel: t("axis.confidence"),
      radiusFn: (p) => 2 + (p.lift / maxLift) * 5,
      colorFn: (p) => `hsl(${210 + (p.lift / maxLift) * 150}, 55%, 42%)`, // blue -> violet -> red as lift rises; never crosses green
      opacity: 0.55,
      tooltipFn: (p) => tf("rules.scattertooltip", { sup: (p.support * 100).toFixed(1), conf: (p.confidence * 100).toFixed(1), lift: p.lift.toFixed(2) }),
    });

    const slider = document.getElementById("lift-slider");
    slider.min = 1; slider.max = D.kpis.max_lift.toFixed(1); slider.step = 0.1; slider.value = 1;
    slider.oninput = () => {
      rulesFilter.minLift = +slider.value;
      document.getElementById("lift-readout").textContent = "≥ " + rulesFilter.minLift.toFixed(1) + "×";
      renderRules(false);
    };
    const confSlider = document.getElementById("conf-slider");
    confSlider.oninput = () => {
      rulesFilter.minConf = (+confSlider.value) / 100;
      document.getElementById("conf-readout").textContent = "≥ " + confSlider.value + "%";
      renderRules(false);
    };
    document.getElementById("rule-search").oninput = (e) => {
      rulesFilter.text = e.target.value.trim().toLowerCase();
      renderRules(false);
    };
    document.getElementById("rules-reset").onclick = () => {
      rulesFilter.minLift = 1; rulesFilter.minConf = 0.4; rulesFilter.groups = new Set(RULE_GROUP_KINDS); rulesFilter.text = ""; rulesFilter.features = new Set();
      slider.value = 1; confSlider.value = 40;
      document.getElementById("lift-readout").textContent = "≥ 1.0×";
      document.getElementById("conf-readout").textContent = "≥ 40%";
      document.getElementById("rule-search").value = "";
      withLoading(() => renderRules(false));
    };
    renderRuleFilterChips();
  } else {
    renderRuleFilterChips();
  }

  const filteredRules = RULES_26.filter(ruleMatches26);
  const activeIds = new Set();
  filteredRules.forEach((r) => [...r.antecedent, ...r.consequent].forEach((t) => activeIds.add(t)));
  document.getElementById("rule-network-badge").textContent = tf("rules.networkbadge", { a: activeIds.size || D.rule_network.nodes.length, b: D.rule_network.nodes.length });
  networkGraph(document.getElementById("chart-rule-network"), D.rule_network.nodes, D.rule_network.edges, {
    colorFn: (n) => groupColor(n.group),
    humanize: (id) => humanizeToken(id).replace(/<\/?b>/g, ""), shortLabel: shortToken,
    dimFn: (n) => activeIds.size > 0 && !activeIds.has(n.id),
  });

  renderRuleList();
}

/* ================================================================
   04 — Anomalies (tier + case-kind filters)
================================================================= */
const anomFilter = { tiers: new Set([0, 1, 2, 3]), cases: new Set(["risk", "rare", "err"]), methods: new Set(["iqr", "z", "iso"]) };
/* A not-flagged point (votes === 0) has no detector to match against, so the method
   filter only applies to points that at least one detector actually fired on --
   inclusion/exclusion of unflagged points is entirely the tier filter's job. */
function pointMatchesMethod(p) {
  if (p.votes === 0) return true;
  return (p.iqr && anomFilter.methods.has("iqr")) || (p.z && anomFilter.methods.has("z")) || (p.iso && anomFilter.methods.has("iso"));
}

function renderAnomChips() {
  renderChips(document.getElementById("tier-chips"), [
    [3, t("tier.3")], [2, t("tier.2")], [1, t("tier.1")], [0, t("tier.0")],
  ], anomFilter.tiers, () => renderAnomalies(false), null);
  renderChips(document.getElementById("method-chips"), [
    ["iqr", "IQR"], ["z", "Z-score"], ["iso", "Isolation Forest"],
  ], anomFilter.methods, () => renderAnomalies(false));
  renderChips(document.getElementById("case-chips"), [
    ["risk", t("case.risk")], ["rare", t("case.rare")], ["err", t("case.err")],
  ], anomFilter.cases, () => renderAnomalies(false));
  document.getElementById("anom-reset").onclick = () => {
    anomFilter.tiers = new Set([0, 1, 2, 3]); anomFilter.cases = new Set(["risk", "rare", "err"]);
    anomFilter.methods = new Set(["iqr", "z", "iso"]);
    withLoading(() => renderAnomalies(false));
  };
}

/* Which detector(s) flagged a given sampled point -- each SCATTER_ROWS entry
   already carries its own iqr/z/iso flags (not just the 0-3 vote count), so
   this is a direct lookup by row index, no separate join needed. */
function detectorNames(idx) {
  const p = SCATTER_ROWS[idx];
  if (!p) return null;
  return namesFromFlags(p);
}
function namesFromFlags(f) {
  const names = [];
  if (f.iqr) names.push("IQR");
  if (f.z) names.push("Z-score");
  if (f.iso) names.push("Isolation Forest");
  return names;
}
function detectorLabel(f) { return f ? namesFromFlags(f).join(", ") || t("detector.none") : t("detector.unknown"); }
function detectorAbbrev(f) {
  if (!f) return "";
  return [f.iqr && "IQR", f.z && "Z", f.iso && "ISO"].filter(Boolean).join("+");
}

function renderAxisSelectors() {
  const xSel = document.getElementById("anom-axis-x"), ySel = document.getElementById("anom-axis-y");
  if (!xSel || !ySel) return;
  const opts = Object.entries(ANOM_AXIS_FIELDS).map(([k, d]) => `<option value="${k}">${t(d.labelKey)}</option>`).join("");
  xSel.innerHTML = opts; ySel.innerHTML = opts;
  xSel.value = anomAxis.x; ySel.value = anomAxis.y;
  xSel.onchange = () => { anomAxis.x = xSel.value; withLoading(() => renderAnomalies(false)); };
  ySel.onchange = () => { anomAxis.y = ySel.value; withLoading(() => renderAnomalies(false)); };
}
function axisValueFmt(axisKey, v) {
  if (axisKey === "loan_amount" || axisKey === "income" || axisKey === "property_value") return fmtUSD(v);
  if (axisKey === "interest_rate") return v.toFixed(2) + "%";
  return v.toFixed(2);
}
function renderAnomalies(fullInit = true) {
  renderAnomChips();
  renderAxisSelectors();
  const k = D.kpis;
  const xF = ANOM_AXIS_FIELDS[anomAxis.x], yF = ANOM_AXIS_FIELDS[anomAxis.y];
  const pts = SCATTER_ROWS.filter((p) => anomFilter.tiers.has(p.votes) && pointMatchesMethod(p))
    .map((p) => ({ ...p, x: p[xF.key], y: p[yF.key] }));
  document.getElementById("anom-count").textContent = tf("anom.count", { a: fmtInt(pts.length), b: fmtInt(SCATTER_ROWS.length) });
  const voteColor = (v) => (v >= 3 ? "var(--red-600)" : v === 2 ? "var(--amber-600)" : v === 1 ? "#78859a" : "#bfcbd8");
  scatterChart(document.getElementById("chart-anomaly-map"), pts, {
    xLabel: t(xF.labelKey), yLabel: t(yF.labelKey),
    radiusFn: (p) => (p.votes >= 3 ? 6.5 : p.votes === 2 ? 5 : p.votes === 1 ? 3.2 : 2.4),
    colorFn: (p) => voteColor(p.votes), opacity: 0.75,
    tooltipFn: (p) => {
      const names = detectorNames(p.idx);
      const which = names && names.length ? tf("anom.flaggedby", { names: names.join(", ") }) : "";
      const axesLine = `<br>${t(xF.labelKey)}: <b>${axisValueFmt(anomAxis.x, p.x)}</b> · ${t(yF.labelKey)}: <b>${axisValueFmt(anomAxis.y, p.y)}</b>`;
      return tf("anom.tooltip", { n: p.votes, robust: p.votes >= 2 ? ` <b>${t("anom.robust")}</b>` : "", which }) + axesLine;
    },
  });

  if (fullInit) {
    document.getElementById("anomaly-kpis").innerHTML = [
      [fmtInt(S.phase4.iqr_flagged_n), tf("anom.kpi.iqr", { pct: S.phase4.iqr_flagged_pct })],
      [fmtInt(S.phase4.zscore_flagged_n), tf("anom.kpi.zscore", { pct: S.phase4.zscore_flagged_pct })],
      [fmtInt(S.phase4.isoforest_flagged_n), tf("anom.kpi.isoforest", { pct: S.phase4.isoforest_flagged_pct })],
      [fmtInt(k.n_anomalies_robust), t("anom.kpi.robust")],
      [fmtInt(k.n_anomalies_all3), t("anom.kpi.all3")],
      [fmtPct(k.pct_anomalies_imputation_artifact), t("anom.kpi.imputationartifact")],
    ].map(([v, l]) => `<div class="cluster-card" style="border-top-color:var(--border-strong)"><div class="cc-meta" style="margin-bottom:6px">${l}</div><div class="cc-name" style="font-size:25px">${v}</div></div>`).join("");

    document.getElementById("iqr-table").innerHTML =
      `<tr><th>${t("th.variable")}</th><th>${t("th.fencelow")}</th><th>${t("th.fencehigh")}</th><th>${t("th.iqrflagged")}</th><th>${t("th.zscoreflagged")}</th></tr>` +
      S.phase4.iqr_by_variable.map((r) => `<tr><td>${r.variable}</td><td class="num">${r.lower.toLocaleString("en-US")}</td><td class="num">${r.upper.toLocaleString("en-US")}</td><td class="num">${fmtInt(r.iqr_flagged)}</td><td class="num">${fmtInt(r.zscore_flagged)}</td></tr>`).join("");

    document.getElementById("dbscan-crossref-table").innerHTML =
      `<tr><th>${t("th.method")}</th><th>${t("th.flagged")}</th><th>${t("th.alsodbscannoise")}</th><th>${t("th.vsbaseline")}</th></tr>` +
      S.phase4.dbscan_crossref_by_method.map((r) => `<tr><td>${r.method}</td><td class="num">${fmtInt(r.flagged)}</td><td class="num">${r.dbscan_noise_pct}%</td><td class="num">${(r.dbscan_noise_pct / S.phase4.dbscan_baseline_noise_pct).toFixed(1)}×</td></tr>`).join("");

    document.getElementById("pairwise-overlap-table").innerHTML =
      `<tr><th>${t("th.methoda")}</th><th>${t("th.methodb")}</th><th>${t("th.both")}</th><th>${t("th.either")}</th><th>${t("th.jaccard")}</th></tr>` +
      S.phase4.pairwise_overlap.map((r) => `<tr><td>${r.method_a}</td><td>${r.method_b}</td><td class="num">${fmtInt(r.both)}</td><td class="num">${fmtInt(r.either)}</td><td class="num">${r.jaccard.toFixed(3)}</td></tr>`).join("");

    document.getElementById("top15-table").innerHTML =
      `<tr><th>${t("th.record")}</th><th>${t("th.loan")}</th><th>${t("th.property")}</th><th>${t("th.income")}</th><th>${t("th.rate")}</th><th>${t("th.segment")}</th><th>${t("th.flaggedby")}</th><th>${t("th.isoscore")}</th><th>${t("th.state")}</th><th>${t("th.race")}</th><th>${t("th.outcome")}</th></tr>` +
      S.phase4.top15_anomalies.map((r) => `<tr>
        <td>#${r.id}</td><td class="num">${fmtUSD(r.loan_amount)}</td><td class="num">${fmtUSD(r.property_value)}</td>
        <td class="num">${fmtUSD(r.income * 1000)}</td><td class="num">${r.interest_rate.toFixed(2)}%</td>
        <td style="border-left:3px solid ${CLUSTER_PALETTE[r.cluster]}">${segName(r.cluster)}</td>
        <td class="num" title="${detectorLabel(r.detector_flags)}">${r.votes}/3 · ${detectorAbbrev(r.detector_flags)}</td>
        <td class="num">${r.iso_score}</td><td>${r.state_code}</td><td>${r.derived_race}</td><td>${r.action_taken}</td>
      </tr>`).join("");

    renderAnomalyEnrichmentChart();
    renderIsoforestHistogram();
  }

  // Exact counts over the full 100,000-row analysis sample.
  const votes = S.phase4.vote_distribution_full;
  hbarChart(document.getElementById("chart-tier"), [
    { label: t("tier.3"), value: votes["3"], color: anomFilter.tiers.has(3) ? "var(--red-600)" : "#dbe2ea" },
    { label: t("tier.2"), value: votes["2"], color: anomFilter.tiers.has(2) ? "var(--amber-600)" : "#dbe2ea" },
    { label: t("tier.1"), value: votes["1"], color: anomFilter.tiers.has(1) ? "#78859a" : "#dbe2ea" },
    { label: t("tier.0"), value: votes["0"], color: anomFilter.tiers.has(0) ? "#bfcbd8" : "#dbe2ea" },
  ], { valueFmt: (v) => tf("tier.recordsfmt", { n: fmtInt(v) }), logScale: true });

  document.getElementById("anomaly-cases").innerHTML = S.phase4.cases.map((c) => {
    const r = c.record;
    return `
    <div class="case ${c.kind}" ${anomFilter.cases.has(c.kind) ? "" : "hidden"}>
      <div class="case-tag">${tf("case.recordtag", { id: c.id.replace("idx-", ""), n: r.votes, which: detectorLabel(r.detector_flags) })}</div>
      <div class="case-title">${t(`case.${c.id}.tag`)}</div>
      <div class="case-record">
        <div><span>${t("case.loan")}</span>${fmtUSD(r.loan_amount)}</div>
        <div><span>${t("case.property")}</span>${fmtUSD(r.property_value)}</div>
        <div><span>${t("case.income")}</span>${fmtUSD(r.income * 1000)}</div>
        <div><span>${t("case.state")}</span>${r.state_code}</div>
        <div><span>${t("case.outcome")}</span>${r.action_taken}</div>
        <div><span>${t("case.isoscore")}</span>${r.iso_score}</div>
      </div>
      <div class="case-body">${t(`case.${c.id}.detail`)}</div>
    </div>`;
  }).join("");
}

/* ================================================================
   Phase 5 — Visualization & Knowledge Presentation (synthesis)
   Content mirrors reports/phase5/knowledge_discovery_report.md -- the four
   findings and the recommendations are the same ones documented there,
   not new claims invented for this tab.
================================================================= */
const P5_FINDING_KEYS = ["p5.finding.1", "p5.finding.2", "p5.finding.3", "p5.finding.4"];
/* Every finding gets exactly one recommendation (#1-#4, in finding order) so
   the list is never confusing to trace -- plus two extra action items (#5,
   #6) for patterns from Phase 3's rules and Phase 4's case review that never
   became a headline "finding" in their own right. Tagging each rec with
   where it comes from keeps that traceable at a glance. */
const P5_REC_KEYS = [
  { key: "p5.rec.1", sourceKey: "p5.rec.src.finding1" },
  { key: "p5.rec.5", sourceKey: "p5.rec.src.finding2" },
  { key: "p5.rec.2", sourceKey: "p5.rec.src.finding3" },
  { key: "p5.rec.6", sourceKey: "p5.rec.src.finding4" },
  { key: "p5.rec.3", sourceKey: "p5.rec.src.phase3denial" },
  { key: "p5.rec.4", sourceKey: "p5.rec.src.phase4case" },
];
function renderPhase5() {
  document.getElementById("p5-callout").innerHTML = `
    <p class="q">${t("p5.callout.q")}</p>
    <p class="a">${t("p5.callout.a")}</p>`;
  document.getElementById("p5-findings").innerHTML = P5_FINDING_KEYS.map((k, i) =>
    `<div class="finding"><div class="fn">${i + 1}</div><div class="ft">${t(k)}</div></div>`).join("");
  document.getElementById("p5-recs").innerHTML = P5_REC_KEYS.map(({ key, sourceKey }) =>
    `<li><span class="rec-source">${t(sourceKey)}</span> ${t(key)}</li>`).join("");
}

/* ================================================================
   Real-data replacements for what used to be static reference images --
   both computed from numbers already sitting in the supplement data,
   just never charted before.
================================================================= */
function renderItemsetSizeChart() {
  const p3 = S.phase3;
  hbarChart(document.getElementById("chart-itemset-size"), [
    { label: t("itemset.singles"), value: p3.itemsets_singles, color: "var(--ink-500)" },
    { label: t("itemset.pairs"), value: p3.itemsets_pairs, color: "var(--ink-600)" },
    { label: t("itemset.triples"), value: p3.itemsets_triples, color: "var(--gold-600)" },
    { label: t("itemset.quadruples"), value: p3.itemsets_quadruples, color: "var(--red-600)" },
  ], { valueFmt: (v) => tf("itemset.valuefmt", { n: fmtInt(v) }) });
}

function renderSupportHistogram() {
  const supports = D.rules_scatter.map((r) => r.support);
  const lo = Math.min(...supports), hi = Math.max(...supports);
  const nbins = 20;
  const width = (hi - lo) / nbins || 1;
  const counts = new Array(nbins).fill(0);
  supports.forEach((s) => {
    const idx = Math.min(nbins - 1, Math.floor((s - lo) / width));
    counts[idx]++;
  });
  histogramChart(document.getElementById("chart-support-hist"),
    { counts, lo, hi, binWidth: width },
    { color: "var(--gold-600)", xFmt: (v) => (v * 100).toFixed(0) + "%" });
}

function renderAnomalyEnrichmentChart() {
  const enrich = S.phase4.isoforest_cluster_enrichment;
  const rows = Object.entries(enrich)
    .map(([cl, mult]) => ({ label: segName(+cl) || `Cluster ${cl}`, value: mult, color: mult >= 1 ? "var(--red-600)" : "var(--ink-500)" }))
    .sort((a, b) => b.value - a.value);
  hbarChart(document.getElementById("chart-anomaly-enrichment"), rows, { valueFmt: (v) => v.toFixed(2) + "×" });
}

/* Real continuous Isolation Forest scores (reports/phase5/web/data/dashboard_remaining_visuals.json,
   pre-binned in Python to match this app's existing histogram data convention). */
function renderIsoforestHistogram() {
  const h = AD.isoforest_hist;
  histogramChart(document.getElementById("chart-isoforest-hist"),
    { counts: h.counts, lo: h.lo, hi: h.hi, binWidth: h.bin_width },
    { xFmt: (v) => v.toFixed(2), color: "var(--red-600)" });
}

const RENDERERS = {
  overview: renderOverview, phase1: renderPhase1, phase2: renderSegmentation,
  phase3: () => renderRules(true), phase4: () => renderAnomalies(true), phase5: renderPhase5,
};

/* ================================================================
   Theme toggle
================================================================= */
function initTheme() {
  const btn = document.getElementById("theme-btn");
  const stored = localStorage.getItem("hmda-theme");
  if (stored) document.documentElement.setAttribute("data-theme", stored);
  btn.addEventListener("click", () => {
    const cur = document.documentElement.getAttribute("data-theme") ||
      (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
    const next = cur === "dark" ? "light" : "dark";
    document.documentElement.setAttribute("data-theme", next);
    localStorage.setItem("hmda-theme", next);
  });
}

function initLang() {
  document.querySelectorAll(".lang-seg").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.dataset.lang));
  });
  syncLangToggle();
}
function syncLangToggle() {
  document.querySelectorAll(".lang-seg").forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.lang === CURRENT_LANG);
  });
}

/* ================================================================
   Boot
================================================================= */
document.addEventListener("DOMContentLoaded", () => {
  initTheme();
  initLang();
  applyStaticI18n();
  renderStatStrip();
  renderSectionNav();
  // Overview needs none of the lazy per-tab chunks (scatter Parquet, Phase 2/3/4
  // extras), so it's the only tab that can render on the very first frame.
  setTab("overview");
  window.addEventListener("resize", () => RENDERERS[activeTab]());
});
