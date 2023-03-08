// Copyright 2021, Observable Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/color-legend


import * as d3 from "d3";
import * as htl from "htl";

export let faviscolorscale = d3.scaleSequential().domain([-1, 1]).interpolator(d3.interpolateRdBu);
export let faviscolorscale2 = d3.scaleSequential().domain([-1, 1]).interpolator(d3.interpolatePRGn);

export let faviscolorscheme = [
  "#bab0ab",
  "#f28e2c",
  "#76b7b2",
  "#59a14f",
  "#edc949",
  "#af7aa1",
  "#ff9da7",
  "#9c755f"
];

export class Legend {
  constructor(color, {
    title,
    tickSize = 6,
    width = 320, 
    height = 44 + tickSize,
    marginTop = 18,
    marginRight = 0,
    marginBottom = 16 + tickSize,
    marginLeft = 0,
    marginLeftText = 0,
    ticks = width / 64,
    tickFormat,
    tickValues,
    svg = null
  } = {}) {
    this.color = color;
    this.title = title;
    this.tickSize = tickSize;
    this.width = width;
    this.height = height;
    this.marginTop = marginTop;
    this.marginRight = marginRight;
    this.marginBottom = marginBottom;
    this.marginLeft = marginLeft;
    this.ticks = ticks;
    this.tickFormat = tickFormat;
    this.tickValues = tickValues;
    this.svg = svg;

    if (!svg) {
      this.svg = svg = d3.create("svg")
          .attr("width", width)
          .attr("height", height)
          .attr("viewBox", [0, 0, width, height])
          .style("overflow", "visible")
          .style("display", "block");
    }
  
    this.tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;
  
    // Continuous
    if (color.interpolate) {
      const n = Math.min(color.domain().length, color.range().length);
  
      x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));
  
      this.image = svg.append("image")
          .attr("x", marginLeft)
          .attr("y", marginTop)
          .attr("width", width - marginLeft - marginRight)
          .attr("height", height - marginTop - marginBottom)
          .attr("preserveAspectRatio", "none")
          .attr("xlink:href", Legend.ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
    }
  
    // Sequential
    else if (color.interpolator) {
      x = Object.assign(color.copy()
          .interpolator(d3.interpolateRound(marginLeft, width - marginRight)),
          {range() { return [marginLeft, width - marginRight]; }});
  
      this.image = svg.append("image")
          .attr("class", "legendimage")
          .attr("x", marginLeft)
          .attr("y", marginTop)
          .attr("width", width - marginLeft - marginRight)
          .attr("height", height - marginTop - marginBottom)
          .attr("preserveAspectRatio", "none")
          .attr("xlink:href", Legend.ramp(color.interpolator()).toDataURL());
  
      // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
      if (!x.ticks) {
        if (tickValues === undefined) {
          const n = Math.round(ticks + 1);
          tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
        }
        if (typeof tickFormat !== "function") {
          tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
        }
      }
    }
  
    // Threshold
    else if (color.invertExtent) {
      const thresholds
          = color.thresholds ? color.thresholds() // scaleQuantize
          : color.quantiles ? color.quantiles() // scaleQuantile
          : color.domain(); // scaleThreshold
  
      const thresholdFormat
          = tickFormat === undefined ? d => d
          : typeof tickFormat === "string" ? d3.format(tickFormat)
          : tickFormat;
  
      x = d3.scaleLinear()
          .domain([-1, color.range().length - 1])
          .rangeRound([marginLeft, width - marginRight]);
  
      this.rects = svg.append("g").selectAll("rect");
      this.rects.data(color.range())
        .join("rect")
          .attr("x", (d, i) => x(i - 1))
          .attr("y", marginTop)
          .attr("width", (d, i) => x(i) - x(i - 1))
          .attr("height", height - marginTop - marginBottom)
          .attr("fill", d => d);
  
      tickValues = d3.range(thresholds.length);
      tickFormat = i => thresholdFormat(thresholds[i], i);
    }
  
    // Ordinal
    else {
      x = d3.scaleBand()
          .domain(color.domain())
          .rangeRound([marginLeft, width - marginRight]);
  
      this.rects = svg.append("g").selectAll("rect");
      this.rects.data(color.domain())
        .join("rect")
          .attr("x", x)
          .attr("y", marginTop)
          .attr("width", Math.max(0, x.bandwidth() - 1))
          .attr("height", height - marginTop - marginBottom)
          .attr("fill", color);
  
      this.tickAdjust = () => {};
    }
  


    let g = this.g = svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`);
    this.x = x;
    this.axis = d3.axisBottom(x)
      .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
      .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
      .tickSize(tickSize)
      .tickValues(tickValues);
    this.axis(g);
    this.tickAdjust(g);
    g.select(".domain").remove()
    this.text = g.append("text")
          .attr("x", marginLeft + marginLeftText)
          .attr("y", marginTop + marginBottom - height - 6)
          .attr("fill", "currentColor")
          .attr("text-anchor", "start")
          .attr("class", "title")
          .text(title);
  }

  threshold(val) {
    if (!this.thresline) {
      this.thresline = {}
      this.thresline.p = 
        this.g.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", 5)
          .style("stroke-width", 2)
          .style("stroke", "#E4C988")
          .style("fill", "none");
      this.thresline.ph = 
        this.g.append("line")
          .attr("x1", 0)
          .attr("y1", 3)
          .attr("x2", 0)
          .attr("y2", 3)
          .style("stroke-width", 1)
          .style("stroke", "#E4C988")
          .style("fill", "none");
      this.thresline.n = 
        this.g.append("line")
          .attr("x1", 0)
          .attr("y1", 0)
          .attr("x2", 0)
          .attr("y2", 5)
          .style("stroke-width", 2)
          .style("stroke", "#E4C988")
          .style("fill", "none");
      this.thresline.nh = 
        this.g.append("line")
          .attr("x1", 0)
          .attr("y1", 3)
          .attr("x2", 0)
          .attr("y2", 3)
          .style("stroke-width", 1)
          .style("stroke", "#E4C988")
          .style("fill", "none");
    }
    
    if (val == -1) {
      this.thresline.p 
        .style("stroke", "transparent");
      this.thresline.n 
        .style("stroke", "transparent");
      this.thresline.ph
        .style("stroke", "transparent");
      this.thresline.nh
        .style("stroke", "transparent");
    } else {
      this.thresline.p 
        .attr("x1", this.x(val))
        .attr("x2", this.x(val));
      this.thresline.ph
        .attr("x1", this.x(this.color.domain()[1]))
        .attr("x2", this.x(val));
      this.thresline.n 
        .attr("x1", this.x(-val))
        .attr("x2", this.x(-val));
      this.thresline.nh
        .attr("x1", this.x(-val))
        .attr("x2", this.x(this.color.domain()[0]));
    }
  }

  node() {
    return this.svg.node();
  }

  static ramp(color, n = 256) {
    const canvas = document.createElement("canvas");
    canvas.width = n;
    canvas.height = 1;
    const context = canvas.getContext("2d");
    for (let i = 0; i < n; ++i) {
      context.fillStyle = color(i / (n - 1));
      context.fillRect(i, 0, 1, 1);
    }
    return canvas;
  }
}

  // Copyright 2021, Observable Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/color-legend
export function Swatches(color, {
    columns = null,
    format,
    unknown: formatUnknown,
    swatchSize = 15,
    swatchWidth = swatchSize,
    swatchHeight = swatchSize,
    marginLeft = 0,
    domainlables = null
  } = {}) {
    const id = `-swatches-${Math.random().toString(16).slice(2)}`;
    const unknown = formatUnknown == null ? undefined : color.unknown();
    const unknowns = unknown == null || unknown === d3.scaleImplicit ? [] : [unknown];
    const domain = color.domain().concat(unknowns);
    if (format === undefined) format = x => x === unknown ? formatUnknown : x;
  
    function entity(character) {
      return `&#${character.charCodeAt(0).toString()};`;
    }
  
    if (columns !== null) return htl.html`<div style="display: flex; align-items: center; margin-left: ${+marginLeft}px; min-height: 33px; font: 10px sans-serif;">
    <style>
  
  .${id}-item {
    break-inside: avoid;
    display: flex;
    align-items: center;
    padding-bottom: 1px;
  }
  
  .${id}-label {
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    max-width: calc(100% - ${+swatchWidth}px - 0.5em);
  }
  
  .${id}-swatch {
    width: ${+swatchWidth}px;
    height: ${+swatchHeight}px;
    margin: 0 0.5em 0 0;
  }
  
    </style>
    <div style=${{width: "100%", columns}}>${domain.map(value => {
      const label = domainlables ? `${domainlables[value]}` : `${format(value)}`;
      return htl.html`<div class=${id}-item>
        <div class=${id}-swatch style=${{background: color(value)}}></div>
        <div class=${id}-label title=${label}>${label}</div>
      </div>`;
    })}
    </div>
  </div>`;
  
    return htl.html`<div style="display: flex; align-items: center; min-height: 33px; margin-left: ${+marginLeft}px; font: 10px sans-serif;">
    <style>
  
  .${id} {
    display: inline-flex;
    align-items: center;
    margin-right: 1em;
  }
  
  .${id}::before {
    content: "";
    width: ${+swatchWidth}px;
    height: ${+swatchHeight}px;
    margin-right: 0.5em;
    background: var(--color);
  }
  
    </style>
    <div>${domain.map(value => {
        const label = domainlables ? `${domainlables[value]}` : `${format(value)}`;
        return htl.html`<span class="${id}" style="--color: ${color(value)}">${label}</span>`
    })}</div>`;
  }