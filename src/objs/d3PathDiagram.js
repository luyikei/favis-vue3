
import * as d3 from "d3";
import { faviscolorscheme, faviscolorscale } from "@/objs/d3colorlegend.js"

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/force-directed-graph
export class PathDiagramD3 {
  constructor(svg, matrix, vnames, fnames, {
  } = {}) {
    this.svg = svg;
    this.matrix = matrix;
    this.vnames = vnames;
    this.fnames = fnames;

    const nV = vnames.length;
    const nF = fnames.length;
    let rectSize = 10;
    let radiusSize = 10;

    let scaleV = d3.scaleBand()
      .domain(d3.range(nV))
      .range([50, 400]);

    let scaleF = d3.scaleBand()
      .domain(d3.range(nF))
      .range([50 + radiusSize, 400]);

    this.fSacle = d3.scaleOrdinal(faviscolorscheme).domain(d3.range(nF));

    let g = svg.append("g");



    let dat = matrix.flat()

    this.lines = g.selectAll('line')
      .data(dat)
      .join('line')
      .style("stroke", d => faviscolorscale(d.z))
      .style("stroke-width", 1)
      .attr("x1", 100 + rectSize / 2)
      .attr("y1", (d) => scaleV(d.x) + rectSize / 2)
      .attr("x2", 400)
      .attr("y2", (d) => scaleF(d.y));

    g.selectAll('circle')
      .data(d3.range(nF))
      .join('circle')
      .attr('cx', function (d, i) {
        return 400;
      })
      .attr('cy', function (d, i) {
        return scaleF(d);
      })
      .attr('r', 10)
      .style('fill', d => this.fSacle(d + 1));

    g.selectAll('rect')
      .data(d3.range(nV))
      .join('rect')
      .attr("y", (d, i) => scaleV(d))
      .attr("x", 100)
      .attr("width", rectSize)
      .attr("height", rectSize).style("fill", "orange")

  }

  updateThreshold(thres) {
    this.lines
      .style("stroke", d => (thres <= Math.abs(d.z)) ? faviscolorscale(d.z) : "transparent");
  }
}