/* charts.js — minimal, dependency-free SVG chart primitives for the HMDA dashboard.
   Everything renders into an existing <svg viewBox="0 0 W H"> element. */

const SVGNS = "http://www.w3.org/2000/svg";

function svgEl(tag, attrs) {
  const el = document.createElementNS(SVGNS, tag);
  for (const k in attrs) el.setAttribute(k, attrs[k]);
  return el;
}

function clearSvg(svg) { while (svg.firstChild) svg.removeChild(svg.firstChild); }

function viewBoxSize(svg) {
  const vb = svg.viewBox.baseVal;
  return { w: vb.width, h: vb.height };
}

/* ---------------- shared tooltip ---------------- */
const Tooltip = (function () {
  let el = null;
  function ensure() {
    if (!el) {
      el = document.createElement("div");
      el.className = "chart-tooltip";
      document.body.appendChild(el);
    }
    return el;
  }
  return {
    show(html, evt) {
      const t = ensure();
      t.innerHTML = html;
      t.style.opacity = "1";
      this.move(evt);
    },
    move(evt) {
      const t = ensure();
      const x = evt.clientX, y = evt.clientY;
      const vw = window.innerWidth;
      t.style.left = (x + 14 > vw - 250 ? x - 250 : x + 14) + "px";
      t.style.top = (y + 14) + "px";
    },
    hide() { if (el) el.style.opacity = "0"; },
  };
})();

/* ---------------- scale helpers ---------------- */
function linearScale(domain, range) {
  const [d0, d1] = domain, [r0, r1] = range;
  const span = (d1 - d0) || 1;
  return (v) => r0 + ((v - d0) / span) * (r1 - r0);
}
function niceDomain(values, pad = 0.08) {
  let lo = Math.min(...values), hi = Math.max(...values);
  if (lo === hi) { lo -= 1; hi += 1; }
  const m = (hi - lo) * pad;
  return [lo - m, hi + m];
}

/* ================================================================
   Scatter plot — used for the cluster map & anomaly map.
   points: [{x,y, ...fields}]
   opts: { margin, xLabel, yLabel, colorFn(p)->css, radiusFn(p)->px,
           strokeFn(p)->css|null, tooltipFn(p)->html, layers:[{points, ...same as above, order}] }
================================================================= */
function scatterChart(svg, points, opts) {
  clearSvg(svg);
  const { w, h } = viewBoxSize(svg);
  const m = opts.margin || { l: 46, r: 18, t: 14, b: 40 };
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const xDom = niceDomain(xs), yDom = niceDomain(ys);
  const sx = linearScale(xDom, [m.l, w - m.r]);
  const sy = linearScale(yDom, [h - m.b, m.t]);

  // gridlines
  const grid = svgEl("g", { class: "grid" });
  [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
    const gx = m.l + t * (w - m.l - m.r);
    grid.appendChild(svgEl("line", { x1: gx, x2: gx, y1: m.t, y2: h - m.b, stroke: "var(--border)", "stroke-width": 1 }));
    const gy = m.t + t * (h - m.t - m.b);
    grid.appendChild(svgEl("line", { x1: m.l, x2: w - m.r, y1: gy, y2: gy, stroke: "var(--border)", "stroke-width": 1 }));
  });
  svg.appendChild(grid);

  // axis labels
  if (opts.xLabel) {
    const t = svgEl("text", { x: (m.l + w - m.r) / 2, y: h - 8, "text-anchor": "middle", "font-size": 10.5, fill: "var(--text-muted)" });
    t.textContent = opts.xLabel; svg.appendChild(t);
  }
  if (opts.yLabel) {
    const t = svgEl("text", { x: 12, y: (m.t + h - m.b) / 2, "text-anchor": "middle", "font-size": 10.5, fill: "var(--text-muted)",
      transform: `rotate(-90 12 ${(m.t + h - m.b) / 2})` });
    t.textContent = opts.yLabel; svg.appendChild(t);
  }

  const plotLayer = (pts, radiusFn, colorFn, strokeFn, opacity) => {
    const g = svgEl("g", {});
    pts.forEach((p) => {
      const c = svgEl("circle", {
        cx: sx(p.x), cy: sy(p.y), r: radiusFn(p),
        fill: colorFn(p), "fill-opacity": opacity != null ? opacity : 0.75,
        stroke: strokeFn ? strokeFn(p) : "none", "stroke-width": strokeFn ? 1.3 : 0,
      });
      if (opts.tooltipFn) {
        c.addEventListener("mousemove", (e) => Tooltip.show(opts.tooltipFn(p), e));
        c.addEventListener("mouseleave", () => Tooltip.hide());
      }
      g.appendChild(c);
    });
    svg.appendChild(g);
  };

  plotLayer(points, opts.radiusFn || (() => 3), opts.colorFn || (() => "var(--ink-500)"), opts.strokeFn, opts.opacity);
  (opts.layers || []).forEach((layer) => {
    plotLayer(layer.points, layer.radiusFn || opts.radiusFn || (() => 4), layer.colorFn, layer.strokeFn, layer.opacity);
  });

  // frame
  svg.appendChild(svgEl("rect", { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: "none", stroke: "var(--border-strong)", "stroke-width": 1 }));
}

/* ================================================================
   Bubble chart — a small-N scatter (segment/cluster summaries, not raw
   per-record data) where every point gets a permanent text label instead of
   hover-only, and circle area (not radius) scales with opts.sizeFn so bubble
   size reads proportionally. points: [{x, y, label, ...fields}].
   opts: { margin, xLabel, yLabel, sizeFn(p)->raw size metric, colorFn(p)->css,
           tooltipFn(p)->html, minR, maxR }
================================================================= */
function bubbleChart(svg, points, opts) {
  clearSvg(svg);
  const { w, h } = viewBoxSize(svg);
  const m = opts.margin || { l: 50, r: 18, t: 14, b: 40 };
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const xDom = niceDomain(xs, 0.22), yDom = niceDomain(ys, 0.28);
  const sx = linearScale(xDom, [m.l, w - m.r]);
  const sy = linearScale(yDom, [h - m.b, m.t]);
  const minR = opts.minR || 18, maxR = opts.maxR || 46;
  const sizes = points.map((p) => opts.sizeFn ? opts.sizeFn(p) : 1);
  const sMin = Math.min(...sizes), sMax = Math.max(...sizes);
  // area-proportional radius (not linear radius) so bubble SIZE reads correctly, not just radius
  const rFor = (s) => {
    const t = sMax === sMin ? 1 : (s - sMin) / (sMax - sMin);
    const areaMin = Math.PI * minR * minR, areaMax = Math.PI * maxR * maxR;
    return Math.sqrt((areaMin + t * (areaMax - areaMin)) / Math.PI);
  };

  // gridlines
  const grid = svgEl("g", { class: "grid" });
  [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
    const gx = m.l + t * (w - m.l - m.r);
    grid.appendChild(svgEl("line", { x1: gx, x2: gx, y1: m.t, y2: h - m.b, stroke: "var(--border)", "stroke-width": 1 }));
    const gy = m.t + t * (h - m.t - m.b);
    grid.appendChild(svgEl("line", { x1: m.l, x2: w - m.r, y1: gy, y2: gy, stroke: "var(--border)", "stroke-width": 1 }));
  });
  svg.appendChild(grid);

  if (opts.xLabel) {
    const t = svgEl("text", { x: (m.l + w - m.r) / 2, y: h - 8, "text-anchor": "middle", "font-size": 10.5, fill: "var(--text-muted)" });
    t.textContent = opts.xLabel; svg.appendChild(t);
  }
  if (opts.yLabel) {
    const t = svgEl("text", { x: 12, y: (m.t + h - m.b) / 2, "text-anchor": "middle", "font-size": 10.5, fill: "var(--text-muted)",
      transform: `rotate(-90 12 ${(m.t + h - m.b) / 2})` });
    t.textContent = opts.yLabel; svg.appendChild(t);
  }

  // A permanent full-length label per bubble (segment names can be 40+ chars)
  // has no safe place to sit without either colliding with a neighboring
  // bubble/label or overflowing the chart edge -- especially once two bubbles
  // land close together. A small fixed-size number inside each bubble, with
  // the real names in a legend below the chart, can't collide with anything.
  points.forEach((p, i) => {
    const cx = sx(p.x), cy = sy(p.y), r = rFor(sizes[i]);
    const g = svgEl("g", {});
    const circle = svgEl("circle", { cx, cy, r, fill: opts.colorFn ? opts.colorFn(p) : "var(--ink-500)", "fill-opacity": 0.85 });
    if (opts.tooltipFn) {
      circle.addEventListener("mousemove", (e) => Tooltip.show(opts.tooltipFn(p), e));
      circle.addEventListener("mouseleave", () => Tooltip.hide());
    }
    g.appendChild(circle);
    const num = svgEl("text", {
      x: cx, y: cy, "text-anchor": "middle", "dominant-baseline": "central", "font-size": Math.min(15, r * 0.6),
      "font-weight": 700, "font-family": "var(--font-mono)", fill: "#fff", "pointer-events": "none",
    });
    num.textContent = String(i + 1);
    g.appendChild(num);
    svg.appendChild(g);
  });

  svg.appendChild(svgEl("rect", { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: "none", stroke: "var(--border-strong)", "stroke-width": 1 }));
}

/* ================================================================
   Donut chart. data: [{label, value, color}]
================================================================= */
function donutChart(svg, data, opts) {
  clearSvg(svg);
  const { w, h } = viewBoxSize(svg);
  const cx = w * 0.32, cy = h / 2, rOuter = Math.min(w * 0.32, h * 0.42), rInner = rOuter * 0.6;
  const total = data.reduce((s, d) => s + d.value, 0) || 1;
  let angle = -Math.PI / 2;
  const g = svgEl("g", {});
  data.forEach((d) => {
    const frac = d.value / total;
    const a0 = angle, a1 = angle + frac * Math.PI * 2;
    angle = a1;
    const large = a1 - a0 > Math.PI ? 1 : 0;
    const x0 = cx + rOuter * Math.cos(a0), y0 = cy + rOuter * Math.sin(a0);
    const x1 = cx + rOuter * Math.cos(a1), y1 = cy + rOuter * Math.sin(a1);
    const xi1 = cx + rInner * Math.cos(a1), yi1 = cy + rInner * Math.sin(a1);
    const xi0 = cx + rInner * Math.cos(a0), yi0 = cy + rInner * Math.sin(a0);
    const path = svgEl("path", {
      d: `M ${x0} ${y0} A ${rOuter} ${rOuter} 0 ${large} 1 ${x1} ${y1} L ${xi1} ${yi1} A ${rInner} ${rInner} 0 ${large} 0 ${xi0} ${yi0} Z`,
      fill: d.color, stroke: "var(--surface)", "stroke-width": 2,
    });
    path.addEventListener("mousemove", (e) => Tooltip.show(`<b>${d.label}</b><br>${d.value.toFixed(1)}%`, e));
    path.addEventListener("mouseleave", () => Tooltip.hide());
    g.appendChild(path);
  });
  svg.appendChild(g);

  const lg = svgEl("g", { transform: `translate(${w * 0.62}, ${cy - data.length * 11})` });
  data.forEach((d, i) => {
    const row = svgEl("g", { transform: `translate(0, ${i * 22})` });
    row.appendChild(svgEl("rect", { x: 0, y: 0, width: 10, height: 10, rx: 2, fill: d.color }));
    const t = svgEl("text", { x: 16, y: 9, "font-size": 11, fill: "var(--text-secondary)" });
    t.textContent = `${d.label} — ${d.value.toFixed(1)}%`;
    row.appendChild(t);
    lg.appendChild(row);
  });
  svg.appendChild(lg);
}

/* ================================================================
   Gauge / speedometer — a single value on a 270°-sweep dial (min at bottom-left,
   max at bottom-right, gap at the bottom). opts: { min, max, value, unit,
   color, tickStep, valueFmt(v) }.
================================================================= */
function gaugeChart(svg, opts) {
  clearSvg(svg);
  const { w, h } = viewBoxSize(svg);
  const min = opts.min ?? 0, max = opts.max ?? 100;
  const value = Math.max(min, Math.min(max, opts.value));
  const cx = w / 2, cy = h * 0.62, r = Math.min(w, h * 1.35) * 0.4;
  const START = -135, END = 135; // degrees, 0 = straight up, clockwise
  const toXY = (deg, radius) => {
    const rad = (deg * Math.PI) / 180;
    return [cx + radius * Math.sin(rad), cy - radius * Math.cos(rad)];
  };
  const arcPath = (a0, a1, radius) => {
    const [x0, y0] = toXY(a0, radius), [x1, y1] = toXY(a1, radius);
    const large = a1 - a0 > 180 ? 1 : 0;
    return `M ${x0} ${y0} A ${radius} ${radius} 0 ${large} 1 ${x1} ${y1}`;
  };
  const strokeW = Math.max(8, r * 0.16);

  // background track
  svg.appendChild(svgEl("path", {
    d: arcPath(START, END, r), fill: "none", stroke: "var(--border)", "stroke-width": strokeW, "stroke-linecap": "round",
  }));
  // value arc
  const frac = (value - min) / ((max - min) || 1);
  const valueAngle = START + frac * (END - START);
  if (frac > 0) {
    svg.appendChild(svgEl("path", {
      d: arcPath(START, valueAngle, r), fill: "none", stroke: opts.color || "var(--ink-500)",
      "stroke-width": strokeW, "stroke-linecap": "round",
    }));
  }
  // tick labels around the dial
  const tickStep = opts.tickStep || (max - min) / 10;
  for (let v = min; v <= max + 1e-9; v += tickStep) {
    const a = START + ((v - min) / ((max - min) || 1)) * (END - START);
    const [tx, ty] = toXY(a, r + strokeW * 0.95 + 8);
    const t = svgEl("text", { x: tx, y: ty, "text-anchor": "middle", "dominant-baseline": "middle", "font-size": 10, "font-family": "var(--font-mono)", fill: "var(--text-muted)" });
    t.textContent = Math.round(v);
    svg.appendChild(t);
  }
  // centered value text -- dominant-baseline is required here: without it the
  // SVG default (alphabetic) baseline sits at y, so the glyphs themselves render
  // visibly above the dial's true center instead of straddling it.
  const big = svgEl("text", { x: cx, y: cy - r * 0.04, "text-anchor": "middle", "dominant-baseline": "central", "font-size": r * 0.42, "font-family": "var(--font-display)", "font-weight": 600, fill: "var(--text)" });
  big.textContent = opts.valueFmt ? opts.valueFmt(value) : value.toFixed(1) + (opts.unit || "");
  svg.appendChild(big);
  if (opts.subLabel) {
    const sub = svgEl("text", { x: cx, y: cy + r * 0.22, "text-anchor": "middle", "font-size": 11, "font-family": "var(--font-mono)", fill: "var(--text-muted)" });
    sub.textContent = opts.subLabel;
    svg.appendChild(sub);
  }
}

/* Measures label pixel widths with an offscreen canvas so bar-chart label
   columns never clip long text (font must match the SVG text style). */
let __measureCtx = null;
function measureTextWidth(text, font) {
  if (!__measureCtx) __measureCtx = document.createElement("canvas").getContext("2d");
  __measureCtx.font = font;
  return __measureCtx.measureText(text).width;
}

/* ================================================================
   Horizontal bar chart. data: [{label, value, color}]  opts:{logScale, valueFmt}
================================================================= */
function hbarChart(svg, data, opts) {
  clearSvg(svg);
  opts = opts || {};
  const { w, h } = viewBoxSize(svg);
  const font = "11.5px 'JetBrains Mono', monospace";
  const autoWidth = Math.max(...data.map((d) => measureTextWidth(d.label, font))) + 26;
  const l = Math.min(Math.max(autoWidth, opts.labelWidth || 0), w * 0.5);
  const valueStrs = data.map((d) => (opts.valueFmt ? opts.valueFmt(d.value) : String(d.value)));
  const r = Math.max(...valueStrs.map((s) => measureTextWidth(s, font))) + 26;
  const m = { l, r, t: 8, b: 8 };
  const rowH = (h - m.t - m.b) / data.length;
  const maxV = Math.max(...data.map((d) => d.value)) || 1;
  const scale = opts.logScale
    ? (v) => (Math.log10(v + 1) / Math.log10(maxV + 1)) * (w - m.l - m.r)
    : (v) => (v / maxV) * (w - m.l - m.r);

  data.forEach((d, i) => {
    const y = m.t + i * rowH + rowH * 0.18;
    const bh = rowH * 0.64;
    const label = svgEl("text", { x: m.l - 10, y: y + bh / 2 + 4, "text-anchor": "end", "font-size": 11.5, fill: "var(--text-secondary)" });
    label.textContent = d.label;
    svg.appendChild(label);

    const bw = Math.max(2, scale(d.value));
    const rect = svgEl("rect", { x: m.l, y, width: bw, height: bh, rx: 4, fill: d.color || "var(--ink-500)" });
    rect.addEventListener("mousemove", (e) => Tooltip.show(`<b>${d.label}</b><br>${opts.valueFmt ? opts.valueFmt(d.value) : d.value}`, e));
    rect.addEventListener("mouseleave", () => Tooltip.hide());
    svg.appendChild(rect);

    const vt = svgEl("text", { x: m.l + bw + 8, y: y + bh / 2 + 4, "font-size": 11, fill: "var(--text)", "font-family": "var(--font-mono)" });
    vt.textContent = opts.valueFmt ? opts.valueFmt(d.value) : d.value;
    svg.appendChild(vt);
  });
}

/* ================================================================
   Dual-axis line chart — two series sharing a categorical x-axis,
   each on its own y-scale (e.g. inertia vs silhouette across K).
   xLabels: [string]  seriesA/seriesB: {label, values:[num], color}
================================================================= */
function dualLineChart(svg, xLabels, seriesA, seriesB, opts) {
  clearSvg(svg);
  opts = opts || {};
  const { w, h } = viewBoxSize(svg);
  const m = opts.margin || { l: 54, r: 54, t: 18, b: 34 };
  const n = xLabels.length;
  const sx = (i) => m.l + (n === 1 ? 0.5 : i / (n - 1)) * (w - m.l - m.r);
  const domA = niceDomain(seriesA.values, 0.15);
  const domB = niceDomain(seriesB.values, 0.15);
  const syA = linearScale(domA, [h - m.b, m.t]);
  const syB = linearScale(domB, [h - m.b, m.t]);

  const grid = svgEl("g", {});
  xLabels.forEach((_, i) => {
    grid.appendChild(svgEl("line", { x1: sx(i), x2: sx(i), y1: m.t, y2: h - m.b, stroke: "var(--border)", "stroke-width": 1 }));
  });
  svg.appendChild(grid);

  const drawSeries = (series, sy) => {
    const pts = series.values.map((v, i) => [sx(i), sy(v)]);
    const path = svgEl("path", {
      d: pts.map((p, i) => (i === 0 ? "M" : "L") + p[0].toFixed(1) + "," + p[1].toFixed(1)).join(" "),
      fill: "none", stroke: series.color, "stroke-width": 2,
    });
    svg.appendChild(path);
    pts.forEach(([px, py], i) => {
      const c = svgEl("circle", { cx: px, cy: py, r: 4, fill: series.color, stroke: "var(--surface)", "stroke-width": 1.5 });
      c.addEventListener("mousemove", (e) => Tooltip.show(`<b>${xLabels[i]}</b><br>${series.label}: ${series.fmt ? series.fmt(series.values[i]) : series.values[i]}`, e));
      c.addEventListener("mouseleave", () => Tooltip.hide());
      svg.appendChild(c);
    });
  };
  drawSeries(seriesA, syA);
  drawSeries(seriesB, syB);

  // x labels
  xLabels.forEach((lab, i) => {
    const t = svgEl("text", { x: sx(i), y: h - m.b + 18, "text-anchor": "middle", "font-size": 11, fill: "var(--text-muted)" });
    t.textContent = lab; svg.appendChild(t);
  });
  // left axis ticks (series A)
  [domA[0], (domA[0] + domA[1]) / 2, domA[1]].forEach((v) => {
    const t = svgEl("text", { x: m.l - 8, y: syA(v) + 4, "text-anchor": "end", "font-size": 10, fill: seriesA.color });
    t.textContent = seriesA.fmt ? seriesA.fmt(v) : v.toFixed(2); svg.appendChild(t);
  });
  // right axis ticks (series B)
  [domB[0], (domB[0] + domB[1]) / 2, domB[1]].forEach((v) => {
    const t = svgEl("text", { x: w - m.r + 8, y: syB(v) + 4, "text-anchor": "start", "font-size": 10, fill: seriesB.color });
    t.textContent = seriesB.fmt ? seriesB.fmt(v) : v.toFixed(2); svg.appendChild(t);
  });

  svg.appendChild(svgEl("rect", { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: "none", stroke: "var(--border-strong)", "stroke-width": 1 }));
}

/* ================================================================
   Histogram — bar chart along a continuous axis, for real value-count
   bins (not a category list). data: {counts:[n], lo, hi, binWidth,
   belowLo, aboveHi}. opts: {color, xFmt}
================================================================= */
function histogramChart(svg, data, opts) {
  clearSvg(svg);
  opts = opts || {};
  const { w, h } = viewBoxSize(svg);
  const m = { l: 52, r: 14, t: 14, b: 34 };
  const counts = data.counts;
  const n = counts.length;
  const maxV = Math.max(...counts, 1);
  const sy = linearScale([0, maxV], [h - m.b, m.t]);
  const barW = (w - m.l - m.r) / n;

  const grid = svgEl("g", {});
  [0, 0.5, 1].forEach((t) => {
    const gy = m.t + t * (h - m.t - m.b);
    grid.appendChild(svgEl("line", { x1: m.l, x2: w - m.r, y1: gy, y2: gy, stroke: "var(--border)", "stroke-width": 1 }));
  });
  svg.appendChild(grid);

  counts.forEach((c, i) => {
    const x = m.l + i * barW;
    const y = sy(c);
    const rect = svgEl("rect", { x: x + 0.5, y, width: Math.max(0.5, barW - 1), height: (h - m.b) - y, fill: opts.color || "var(--ink-500)" });
    const binLo = data.lo + i * data.binWidth, binHi = data.lo + (i + 1) * data.binWidth;
    rect.addEventListener("mousemove", (e) => Tooltip.show(
      `${opts.xFmt ? opts.xFmt(binLo) : binLo.toFixed(0)} – ${opts.xFmt ? opts.xFmt(binHi) : binHi.toFixed(0)}<br><b>${fmtIntSafe(c)}</b> records`, e));
    rect.addEventListener("mouseleave", () => Tooltip.hide());
    svg.appendChild(rect);
  });

  [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
    const v = data.lo + t * (data.hi - data.lo);
    const t1 = svgEl("text", { x: m.l + t * (w - m.l - m.r), y: h - m.b + 16, "text-anchor": "middle", "font-size": 10, fill: "var(--text-muted)" });
    t1.textContent = opts.xFmt ? opts.xFmt(v) : v.toFixed(0); svg.appendChild(t1);
  });
  [0, 0.5, 1].forEach((t) => {
    const t1 = svgEl("text", { x: m.l - 8, y: sy(t * maxV) + 3, "text-anchor": "end", "font-size": 10, fill: "var(--text-muted)" });
    t1.textContent = fmtIntSafe(Math.round(t * maxV)); svg.appendChild(t1);
  });
  svg.appendChild(svgEl("rect", { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: "none", stroke: "var(--border-strong)", "stroke-width": 1 }));
}
function fmtIntSafe(n) { return Math.round(n).toLocaleString("en-US"); }

/* ================================================================
   Boxplot — a single horizontal box-and-whisker from exact quartiles.
   stats: {min, q1, median, q3, max, loFence, hiFence, belowN, aboveN}
================================================================= */
function boxplotChart(svg, stats, opts) {
  clearSvg(svg);
  opts = opts || {};
  const { w, h } = viewBoxSize(svg);
  const m = { l: 60, r: 60, t: 20, b: 30 };
  const lo = Math.max(stats.loFence, stats.min);
  const hi = Math.min(stats.hiFence, stats.max);
  const pad = (hi - lo) * 0.08 || 1;
  const dom = [lo - pad, hi + pad];
  const sx = linearScale(dom, [m.l, w - m.r]);
  const midY = h / 2;
  const boxH = Math.min(60, h * 0.4);

  // whisker line
  svg.appendChild(svgEl("line", { x1: sx(lo), x2: sx(hi), y1: midY, y2: midY, stroke: "var(--text-muted)", "stroke-width": 1.4 }));
  [lo, hi].forEach((v) => {
    svg.appendChild(svgEl("line", { x1: sx(v), x2: sx(v), y1: midY - boxH / 4, y2: midY + boxH / 4, stroke: "var(--text-muted)", "stroke-width": 1.4 }));
  });
  // box (Q1-Q3)
  const boxX = sx(stats.q1), boxW = Math.max(2, sx(stats.q3) - sx(stats.q1));
  const box = svgEl("rect", { x: boxX, y: midY - boxH / 2, width: boxW, height: boxH, fill: "var(--ink-100)", stroke: "var(--ink-600)", "stroke-width": 1.6, rx: 2 });
  svg.appendChild(box);
  // median
  svg.appendChild(svgEl("line", { x1: sx(stats.median), x2: sx(stats.median), y1: midY - boxH / 2, y2: midY + boxH / 2, stroke: "var(--ink-600)", "stroke-width": 2.4 }));

  // Q1/Q3 labels flare outward from the box edges and the median sits on its
  // own row below -- avoids the three labels overlapping when the box is narrow.
  const fmt = opts.xFmt || ((v) => v.toFixed(0));
  const rowY = midY + boxH / 2 + 18;
  const q1t = svgEl("text", { x: sx(stats.q1) - 5, y: rowY, "text-anchor": "end", "font-size": 10, fill: "var(--text-secondary)" });
  q1t.textContent = "Q1 " + fmt(stats.q1); svg.appendChild(q1t);
  const q3t = svgEl("text", { x: sx(stats.q3) + 5, y: rowY, "text-anchor": "start", "font-size": 10, fill: "var(--text-secondary)" });
  q3t.textContent = "Q3 " + fmt(stats.q3); svg.appendChild(q3t);
  const medt = svgEl("text", { x: sx(stats.median), y: rowY + 15, "text-anchor": "middle", "font-size": 10.5, "font-weight": 700, fill: "var(--ink-600)" });
  medt.textContent = "median " + fmt(stats.median); svg.appendChild(medt);

  const t1 = svgEl("text", { x: sx(lo), y: midY - boxH / 2 - 10, "text-anchor": "middle", "font-size": 10, fill: "var(--text-muted)" });
  t1.textContent = "fence " + fmt(lo); svg.appendChild(t1);
  const t2 = svgEl("text", { x: sx(hi), y: midY - boxH / 2 - 10, "text-anchor": "middle", "font-size": 10, fill: "var(--text-muted)" });
  t2.textContent = "fence " + fmt(hi); svg.appendChild(t2);
}

/* ================================================================
   Force-directed network graph (tiny, self-contained; no d3 dependency).
   nodes: [{id, group}]  edges: [{source, target, lift, confidence}]
================================================================= */
function computeForceLayout(nodes, edges, w, h, iterations) {
  const pos = {};
  const n = nodes.length;
  nodes.forEach((node, i) => {
    const a = (i / n) * Math.PI * 2;
    pos[node.id] = { x: w / 2 + Math.cos(a) * (w * 0.32), y: h / 2 + Math.sin(a) * (h * 0.36), vx: 0, vy: 0 };
  });
  const degree = {}; nodes.forEach((nd) => (degree[nd.id] = 0));
  edges.forEach((e) => { degree[e.source] = (degree[e.source] || 0) + 1; degree[e.target] = (degree[e.target] || 0) + 1; });
  const mx = 78, my = 46;

  for (let it = 0; it < iterations; it++) {
    // repulsion
    for (let i = 0; i < n; i++) {
      for (let j = i + 1; j < n; j++) {
        const a = pos[nodes[i].id], b = pos[nodes[j].id];
        let dx = a.x - b.x, dy = a.y - b.y;
        let dist2 = dx * dx + dy * dy || 0.01;
        const force = 4200 / dist2;
        const dist = Math.sqrt(dist2);
        dx /= dist; dy /= dist;
        a.vx += dx * force; a.vy += dy * force;
        b.vx -= dx * force; b.vy -= dy * force;
      }
    }
    // spring attraction along edges
    edges.forEach((e) => {
      const a = pos[e.source], b = pos[e.target];
      if (!a || !b) return;
      const dx = b.x - a.x, dy = b.y - a.y;
      const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
      const target = 132;
      const force = (dist - target) * 0.018;
      const ux = dx / dist, uy = dy / dist;
      a.vx += ux * force; a.vy += uy * force;
      b.vx -= ux * force; b.vy -= uy * force;
    });
    // center pull + integrate
    nodes.forEach((nd) => {
      const p = pos[nd.id];
      p.vx += (w / 2 - p.x) * 0.0026;
      p.vy += (h / 2 - p.y) * 0.0026;
      p.vx *= 0.82; p.vy *= 0.82;
      p.x += p.vx; p.y += p.vy;
      p.x = Math.max(mx, Math.min(w - mx, p.x));
      p.y = Math.max(my, Math.min(h - my, p.y));
    });
  }
  return { pos, degree };
}

function networkGraph(svg, nodes, edges, opts) {
  clearSvg(svg);
  const { w, h } = viewBoxSize(svg);
  const { pos, degree } = computeForceLayout(nodes, edges, w, h, opts.iterations || 260);
  const maxLift = Math.max(...edges.map((e) => e.lift), 1);

  const dim = opts.dimFn || (() => false);

  const edgeLayer = svgEl("g", {});
  edges.forEach((e) => {
    const a = pos[e.source], b = pos[e.target];
    if (!a || !b) return;
    const faded = dim({ id: e.source }) || dim({ id: e.target });
    const strokeW = 0.6 + (e.lift / maxLift) * 3.2;
    const line = svgEl("line", {
      x1: a.x, y1: a.y, x2: b.x, y2: b.y,
      stroke: "var(--ink-500)", "stroke-opacity": faded ? 0.06 : 0.22 + (e.lift / maxLift) * 0.4, "stroke-width": strokeW,
    });
    line.addEventListener("mousemove", (ev) =>
      Tooltip.show(`<b>${opts.humanize(e.source)}</b> &rarr; <b>${opts.humanize(e.target)}</b><br>lift ${e.lift.toFixed(2)}&times; · confidence ${(e.confidence * 100).toFixed(0)}%`, ev)
    );
    line.addEventListener("mouseleave", () => Tooltip.hide());
    edgeLayer.appendChild(line);
  });
  svg.appendChild(edgeLayer);

  // Only label the highest-degree nodes to keep 22-node/88-edge graph legible.
  const degreeRank = nodes.map((nd) => degree[nd.id]).sort((a, b) => b - a);
  const labelThreshold = degreeRank[Math.min(9, degreeRank.length - 1)];

  const nodeLayer = svgEl("g", {});
  const labelLayer = svgEl("g", {});
  nodes.forEach((nd) => {
    const p = pos[nd.id];
    const faded = dim(nd);
    const r = 5 + Math.sqrt(degree[nd.id] || 1) * 2.6;
    const c = svgEl("circle", { cx: p.x, cy: p.y, r, fill: opts.colorFn(nd), "fill-opacity": faded ? 0.18 : 1, stroke: "var(--surface)", "stroke-width": 1.6 });
    c.addEventListener("mousemove", (ev) => Tooltip.show(`<b>${opts.humanize(nd.id)}</b><br>${nd.group.replace(/_/g, " ")} · ${degree[nd.id]} links`, ev));
    c.addEventListener("mouseleave", () => Tooltip.hide());
    nodeLayer.appendChild(c);

    if ((degree[nd.id] >= labelThreshold || opts.labelAll) && !faded) {
      const label = opts.shortLabel ? opts.shortLabel(nd.id) : nd.id;
      const anchor = p.x < w * 0.18 ? "start" : p.x > w * 0.82 ? "end" : "middle";
      const ly = p.y - r - 6;
      const t = svgEl("text", {
        x: p.x, y: ly, "text-anchor": anchor, "font-size": 9.5, fill: "var(--text)",
        stroke: "var(--surface)", "stroke-width": 3, "paint-order": "stroke", "font-weight": 500,
      });
      t.textContent = label;
      labelLayer.appendChild(t);
    }
  });
  svg.appendChild(nodeLayer);
  svg.appendChild(labelLayer);
}

/* ================================================================
   Line chart — single continuous series (e.g. a sorted k-distance curve).
   points: [{x,y}], already sorted by x. opts: { xLabel, yLabel, xFmt, yFmt,
   color, thresholdY, thresholdLabel, markPoint:{x,y,label}, tooltipFn }
================================================================= */
function lineChart(svg, points, opts) {
  clearSvg(svg);
  opts = opts || {};
  const { w, h } = viewBoxSize(svg);
  const m = opts.margin || { l: 54, r: 18, t: 14, b: 34 };
  const xs = points.map((p) => p.x), ys = points.map((p) => p.y);
  const xDom = [Math.min(...xs), Math.max(...xs)];
  const yDom = niceDomain(ys, 0.08);
  const sx = linearScale(xDom, [m.l, w - m.r]);
  const sy = linearScale(yDom, [h - m.b, m.t]);

  const grid = svgEl("g", {});
  [0, 0.25, 0.5, 0.75, 1].forEach((t) => {
    const gy = m.t + t * (h - m.t - m.b);
    grid.appendChild(svgEl("line", { x1: m.l, x2: w - m.r, y1: gy, y2: gy, stroke: "var(--border)", "stroke-width": 1 }));
  });
  svg.appendChild(grid);

  if (opts.thresholdY != null) {
    const ty = sy(opts.thresholdY);
    svg.appendChild(svgEl("line", { x1: m.l, x2: w - m.r, y1: ty, y2: ty, stroke: "var(--red-600)", "stroke-width": 1.3, "stroke-dasharray": "5,4" }));
    if (opts.thresholdLabel) {
      // Clamp so the label never sits on top of / above the plot's own border.
      const ly = Math.max(m.t + 9, Math.min(h - m.b - 3, ty - 5));
      const t = svgEl("text", { x: w - m.r - 4, y: ly, "text-anchor": "end", "font-size": 10, fill: "var(--red-600)" });
      t.textContent = opts.thresholdLabel; svg.appendChild(t);
    }
  }

  const path = svgEl("path", {
    d: points.map((p, i) => (i === 0 ? "M" : "L") + sx(p.x).toFixed(1) + "," + sy(p.y).toFixed(1)).join(" "),
    fill: "none", stroke: opts.color || "var(--ink-500)", "stroke-width": 1.8,
  });
  svg.appendChild(path);

  // Invisible hover strip resolving to the nearest curve point -- a discrete
  // circle per vertex would be too dense to hover reliably on a 2,000-point curve.
  if (opts.tooltipFn) {
    const hitArea = svgEl("rect", { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: "transparent" });
    hitArea.addEventListener("mousemove", (e) => {
      const rect = svg.getBoundingClientRect();
      const px = ((e.clientX - rect.left) / rect.width) * w;
      const xv = xDom[0] + ((px - m.l) / (w - m.l - m.r)) * (xDom[1] - xDom[0]);
      let nearest = points[0], bd = Infinity;
      for (const p of points) { const d = Math.abs(p.x - xv); if (d < bd) { bd = d; nearest = p; } }
      Tooltip.show(opts.tooltipFn(nearest), e);
    });
    hitArea.addEventListener("mouseleave", () => Tooltip.hide());
    svg.appendChild(hitArea);
  }

  if (opts.markPoint) {
    const mx = sx(opts.markPoint.x), my = sy(opts.markPoint.y);
    svg.appendChild(svgEl("line", { x1: mx, x2: mx, y1: m.t, y2: h - m.b, stroke: "var(--amber-600)", "stroke-width": 1.2, "stroke-dasharray": "3,3" }));
    svg.appendChild(svgEl("circle", { cx: mx, cy: my, r: 5, fill: "var(--amber-600)", stroke: "var(--surface)", "stroke-width": 1.5 }));
    if (opts.markPoint.label) {
      // Clamp vertically so the label never pokes above the plot's own border,
      // and flip to the left of the marker when it's too close to the right edge.
      const ly = Math.max(m.t + 9, Math.min(h - m.b - 3, my - 8));
      const nearRightEdge = mx > w - m.r - 60;
      const t = svgEl("text", {
        x: nearRightEdge ? mx - 6 : mx + 6, y: ly, "text-anchor": nearRightEdge ? "end" : "start",
        "font-size": 10.5, "font-weight": 600, fill: "var(--amber-600)",
      });
      t.textContent = opts.markPoint.label; svg.appendChild(t);
    }
  }

  [xDom[0], (xDom[0] + xDom[1]) / 2, xDom[1]].forEach((v) => {
    const t = svgEl("text", { x: sx(v), y: h - m.b + 16, "text-anchor": "middle", "font-size": 10, fill: "var(--text-muted)" });
    t.textContent = opts.xFmt ? opts.xFmt(v) : v.toFixed(0); svg.appendChild(t);
  });
  [yDom[0], (yDom[0] + yDom[1]) / 2, yDom[1]].forEach((v) => {
    const t = svgEl("text", { x: m.l - 8, y: sy(v) + 3, "text-anchor": "end", "font-size": 10, fill: "var(--text-muted)" });
    t.textContent = opts.yFmt ? opts.yFmt(v) : v.toFixed(1); svg.appendChild(t);
  });
  if (opts.xLabel) {
    const t = svgEl("text", { x: (m.l + w - m.r) / 2, y: h - 4, "text-anchor": "middle", "font-size": 10.5, fill: "var(--text-muted)" });
    t.textContent = opts.xLabel; svg.appendChild(t);
  }
  if (opts.yLabel) {
    const t = svgEl("text", { x: 12, y: (m.t + h - m.b) / 2, "text-anchor": "middle", "font-size": 10.5, fill: "var(--text-muted)",
      transform: `rotate(-90 12 ${(m.t + h - m.b) / 2})` });
    t.textContent = opts.yLabel; svg.appendChild(t);
  }

  svg.appendChild(svgEl("rect", { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: "none", stroke: "var(--border-strong)", "stroke-width": 1 }));
}

/* ================================================================
   Dendrogram — draws scipy's icoord/dcoord U-shaped link coordinates
   verbatim (the literal data matplotlib would plot, not a re-derivation).
   ddata: {icoord:[[x1..x4]], dcoord:[[d1..d4]]}. Distance axis points up
   (root at top, leaves at the bottom), matching the notebook's own plot.
================================================================= */
function dendrogramChart(svg, ddata, opts) {
  clearSvg(svg);
  opts = opts || {};
  const { w, h } = viewBoxSize(svg);
  const showPermanentLabels = !!(ddata.ivl && ddata.ivl.length);
  // Leaf tick marks need more bottom margin than the link tree itself --
  // rotated permanent labels need more still.
  const m = opts.margin || { l: 22, r: 18, t: 14, b: showPermanentLabels ? 62 : 26 };
  const allX = ddata.icoord.flat(), allD = ddata.dcoord.flat();
  const xDom = [Math.min(...allX), Math.max(...allX)];
  const dMax = Math.max(...allD) || 1;
  const sx = linearScale(xDom, [m.l, w - m.r]);
  const sy = (d) => m.t + (1 - d / dMax) * (h - m.t - m.b);
  const plotBottom = m.t + (h - m.t - m.b);

  ddata.icoord.forEach((xs, i) => {
    const ds = ddata.dcoord[i];
    const pts = xs.map((x, j) => `${sx(x).toFixed(1)},${sy(ds[j]).toFixed(1)}`);
    const path = svgEl("path", { d: "M " + pts.join(" L "), fill: "none", stroke: opts.color || "var(--ink-500)", "stroke-width": 1.3 });
    const mergeDist = Math.max(...ds);
    path.addEventListener("mousemove", (e) => Tooltip.show(`merge distance <b>${mergeDist.toFixed(1)}</b>`, e));
    path.addEventListener("mouseleave", () => Tooltip.hide());
    svg.appendChild(path);
  });

  // Leaf labels (scipy's `ivl`, from truncate_mode='level'): "(N)" = N original
  // points folded into this truncated leaf, a bare number = a single untouched
  // point's original index. Every leaf gets one, rotated -90 (straight up) so
  // its footprint is just the font's line-height, not its (variable, up to
  // 6-char) string length -- unlike a diagonal label, it never drifts sideways
  // over a neighboring tick. Font size is solved for the available px/leaf so
  // dense charts (e.g. 63 leaves) shrink just enough to avoid overlap instead
  // of dropping labels.
  if (ddata.ivl && ddata.ivl.length) {
    const n = ddata.ivl.length;
    const leafX = (i) => xDom[0] + i * ((xDom[1] - xDom[0]) / Math.max(1, n - 1));
    const plotW = w - m.l - m.r;
    const pxPerLeaf = n > 1 ? plotW / (n - 1) : plotW;
    // A rotated mono-digit label's horizontal footprint is close to its own
    // font-size; back off 35% from the exact px/leaf so adjacent labels keep
    // a hairline of clearance instead of touching edge-to-edge.
    const fontSize = Math.max(5, Math.min(9.5, pxPerLeaf * 0.65));
    const leafLayer = svgEl("g", {});
    ddata.ivl.forEach((label, i) => {
      const lx = sx(leafX(i));
      const isSingle = !label.startsWith("(");
      leafLayer.appendChild(svgEl("line", {
        x1: lx, x2: lx, y1: plotBottom, y2: plotBottom + 6,
        stroke: isSingle ? (opts.color || "var(--ink-500)") : "var(--text-muted)", "stroke-width": isSingle ? 1.6 : 1,
      }));
      // text-anchor "end": the pivot is the string's near end, right at the
      // tick, and -90 swings the rest of the string DOWN into the margin
      // (away from the plot above) instead of up into the link tree.
      const txt = svgEl("text", {
        x: lx, y: plotBottom + 9, "font-size": fontSize, "font-weight": 600, fill: "var(--text-secondary)",
        "text-anchor": "end", transform: `rotate(-90 ${lx} ${plotBottom + 9})`,
      });
      txt.textContent = label;
      leafLayer.appendChild(txt);
      const hit = svgEl("rect", { x: lx - 3.5, y: plotBottom - 4, width: 7, height: 12, fill: "transparent" });
      hit.addEventListener("mousemove", (e) => Tooltip.show(
        isSingle ? `single record, original index <b>${label}</b>` : `<b>${label}</b> records merged into this leaf`, e));
      hit.addEventListener("mouseleave", () => Tooltip.hide());
      leafLayer.appendChild(hit);
    });
    svg.appendChild(leafLayer);
    const capt = svgEl("text", { x: (m.l + w - m.r) / 2, y: h - 4, "text-anchor": "middle", "font-size": 10, fill: "var(--text-muted)" });
    capt.textContent = `${n} leaves — label = records merged into that leaf`;
    svg.appendChild(capt);
  }

  svg.appendChild(svgEl("rect", { x: m.l, y: m.t, width: w - m.l - m.r, height: h - m.t - m.b, fill: "none", stroke: "var(--border-strong)", "stroke-width": 1 }));
}
