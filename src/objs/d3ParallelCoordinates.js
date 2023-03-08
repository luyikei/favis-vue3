
import * as d3 from "d3";

import {faviscolorscheme, faviscolorscale} from "@/objs/d3colorlegend";

// Copyright 2021 Observable, Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/force-directed-graph
export class ParallelCoordinatesD3 {
  constructor(svg, data, vnames, fnames, {
    width,
    height,
    abs=true,
    isFactor=true,
    commonScale=true,
    onlyFirstAxis=true,
    margin = ({top: 50, right: 20, bottom: 30, left: 10}),
    brushWidth = 15,
    deselectedColor = "#eee",
    selectionChangedCb = (selected) => {},
    label = d => d.Factor,
    colors = d3.interpolateBrBG} = {}) {
    
    this.dataOrig = data;
    this.data = data;
    this.keys = Object.keys(this.data[0]).slice(1);
    this.order = d3.range(this.keys.length);
    this.orderedKeys = this.order.map(i => this.keys[i]);
    this.margin = margin;
    this.abs = abs;
    this.commonScale = commonScale;
    this.onlyFirstAxis = onlyFirstAxis;
    this.brushWidth = brushWidth;
    this.isFactor = isFactor;
    this.vnames = vnames;
    this.fnames = fnames;
    this.deselectedColor = deselectedColor;
    this.selectionChangedCb = selectionChangedCb;

    if (abs) {
      for (let i = 0; i < this.data.length; ++i) {
        for (let key of Object.keys(this.data[i])) {
          if (typeof this.data[i][key] == "number") this.data[i][key] = Math.abs(this.data[i][key]);
        }
      } 
    }

    const keyz = 'F1';
    this.x = d3.scalePoint(this.keys, [margin.left, width - margin.right]);
    //const y = new Map(Array.from(keys, key => [key, d3.scaleLinear(d3.extent(data, d => d[key]), [margin.top, height - margin.bottom])]));
    this.y = commonScale ? new Map(Array.from(this.keys, key => [key, d3.scaleLinear([abs ? 0 : -1 , 1], [height - margin.bottom, margin.top])])) : new Map(Array.from(this.keys, key => [key, d3.scaleLinear(d3.extent(data, d => d[key]), [margin.top, height - margin.bottom])]));
    //const z = d3.scaleSequential(y.get(keyz).domain().reverse(), colors);
    if (this.isFactor) {
      this.z = d3.scaleOrdinal(faviscolorscheme);
      this.z.domain(d3.range(0, data.length));
    } else {
      this.z = d3.scaleOrdinal(["#AAA"]);
      this.z.domain(d3.range(0, data.length));
    }
    this.line = d3.line()
      .defined(([, value]) => value != null)
      .y(([key, value]) => this.y.get(key)(value))
      .x(([key]) => this.x(key));
  
    this.path = svg.append("g")
        .attr("fill", "none")
        .attr("stroke-width", 1.5)
        .attr("stroke-opacity", 0.8)
      .selectAll("path")
      //.data(data.slice().sort((a, b) => d3.ascending(a[keyz], b[keyz]) ))
      .data(this.data)
      .join("path")
        .attr('pointer-events', 'visibleStroke')
        //.attr("stroke", d => z(d[keyz]))
        .attr("stroke", (d, i) => {
          return this.z(i+1);
        })
        .attr("d", d => this.line(d3.cross(this.keys, [d], (key, d) => [key, d[key]])) ) ;
  
    this.path.append("title")
        .text(label);
    const that = this;
  
    this.selections = new Map();
    this.selected = new Set();
    this.brush = d3.brushY()
        .extent([
          [-(brushWidth / 2), margin.top],
          [brushWidth / 2, Math.max(margin.top, height - margin.bottom)]
        ])
        .on("start brush end", ({selection}, key) => {
          if (selection) this.selected.add(key);
          else this.selected.delete(key);

          if (selection === null) this.selections.delete(key);
          else this.selections.set(key, selection.map(this.y.get(key).invert));
          const selected = [];
          this.path.each(function(d, i) {
            const sel = Array.from(that.selections);
            const active = sel.length && sel.every(([key, [a, b]]) => {
              const min = Math.min(a, b);
              const max = Math.max(a, b);
              return d[key] >= min && d[key] <= max;
            });
            d3.select(this).attr("stroke", active ? that.z(i+1) : deselectedColor);
            if (active) {
              d3.select(this).raise();
              selected.push(d);
            }
          });
          if (!selected.length && !this.selected.size) this.path.attr("stroke", (d,i) => that.z(i+1));
          this.selectionChangedCb(selected.map(x => this.isFactor ? this.fnames.indexOf(x.Factor) : this.vnames.indexOf(x.Variable)));
        });

    const naxis = this.orderedKeys.length;
    this.axisg = svg.append("g")
      .selectAll("g")
      .data(this.keys)
      .join("g")
        .attr("transform", d => `translate(${this.x(d)}, 0)`)
        .each(function(d, i) { 
          const axis = d3.axisRight(that.y.get(d));
          //if (onlyFirstAxis && i > 0) {
          //  axis.tickFormat(() => "");
          //};
          let elem = d3.select(this).call(axis);
          let opacity = 0;
          if (naxis < 21) opacity = 1;
          else if (i % Math.ceil(naxis / 5) == 0) opacity = 1;
          elem.attr("opacity", opacity);
          elem
            .on("mouseover", (event, d) => {
              elem.attr("opacity", 0.7);
            })
            .on("mouseleave", (event, d) => {
              if (!that.selected.has(d)) elem.attr("opacity", opacity);
            });
          return elem;
        })
        .call(g => g.append("text")
          .attr("x", 0)
          .attr("y", margin.top - 15)
          .attr("text-anchor", "start")
          .attr("fill", "currentColor")
          .attr("font-size", "10")
          .attr("font-family", "sans-serif")
          .text(d => d))
        .call(g => g.selectAll("text")
          .clone(true).lower()
          .attr("fill", "none")
          .attr("stroke-width", 5)
          .attr("stroke-linejoin", "round")
          .attr("stroke", "white"))
        .call(this.brush);
  }
  clear() {
    this.brush.clear(this.axisg);
    this.axisg.join("g").each(function(d, i) { 
      let elem = d3.select(this); 
      elem.attr("opacity", 0);
      return elem;
    });
  }
  onSelected(selected) {
    //if (!selected.var.size && !selected.factor.size) {
    //  this.path.attr("stroke", (d,i) => this.z(i+1));
    //  return;
    //}
    //this.path.attr("stroke", (d, i) => {
    //  const active = (!this.isFactor && selected.var.has(i)) || (this.isFactor && selected.factor.has(i));
    //  return active ? this.z(i+1) : this.deselectedColor;
    //});
  }
  onClicked(clicked) {
    const that = this;
    this.path.each(function(d, i) {
      const p = d3.select(this);
      if (!that.isFactor && typeof clicked.var == 'number') {
        const isClicked = that.vnames[clicked.var] == d.Variable;
        p.attr("stroke", isClicked ? that.z(i+1) : that.deselectedColor);
        if (isClicked) p.raise();
      } else if (that.isFactor && typeof clicked.factor == 'number') {
        const isClicked = that.fnames[clicked.factor] == d.Factor;
        p.attr("stroke", isClicked ? that.z(i+1) : that.deselectedColor);
        if (isClicked) p.raise();
      } else {
        if (!that.selected.size) p.attr("stroke", that.z(i+1));
      }
    });
  }
  update() {
    const that = this;
    this.x = d3.scalePoint(this.orderedKeys, [this.margin.left, this.width - this.margin.right]);
    this.y = this.commonScale ? new Map(Array.from(this.orderedKeys, key => [key, d3.scaleLinear([this.abs ? 0 : -1 , 1], [this.height - this.margin.bottom, this.margin.top])])) : new Map(Array.from(this.keys, key => [key, d3.scaleLinear(d3.extent(this.data, d => d[key]), [this.margin.top, this.height - this.margin.bottom])]));
    this.brush.extent([
      [-(this.brushWidth / 2), this.margin.top],
      [this.brushWidth / 2, Math.max(this.margin.top, this.height - this.margin.bottom)]
    ]);
    
    this.axisg.join("g")
        .each(function(d, i) { 
          const axis = d3.axisRight(that.y.get(d));
          if (that.onlyFirstAxis && i > 0) {
            axis.tickFormat(() => "");
          };
          const axisElem = d3.select(this).call(axis);
          axisElem.selectAll(".tick").selectAll("line").attr("x1", -6);
          return axisElem; 
        })
        .attr("transform", d => `translate(${this.x(d)}, 0)`)
        .call(this.brush);

    
    this.path.data(this.data)
      .join("path")
        //.attr("stroke", d => z(d[keyz]))
        .attr("stroke", (d, i) => {
          return this.z(i+1);
        })
        .attr("d", d => this.line(d3.cross(this.orderedKeys, [d], (key, d) => [key, d[key]])) );
  }
  updateSize(width, height) {
    this.width = width;
    this.height = height;
    this.update();
  }
  updateOrder(order) {
    const that = this;
    this.order = order;
    this.orderedKeys = order.map(i => this.keys[i]);
    this.update();
  }
}