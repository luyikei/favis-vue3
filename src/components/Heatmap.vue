<template>
  <svg ref="svg" width="100%" height="100%">
    <g ref="svgfield" :transform="svgGOffeset">
      <g ref="xaxis"></g>
      <g ref="yaxis"></g>
    </g>
  </svg>
  <div ref="legend" class="legenddiv pa-3"></div>
  <div ref="tooltip"></div>
</template>
<script>

import * as d3 from "d3";
import { Legend, faviscolorscheme, faviscolorscale } from "@/objs/d3colorlegend.js"
import { create, all } from 'mathjs'

const config = {}
const math = create(all, config)

import { CSVData } from '@/objs/CSVData.js';
import { Tooltip } from '@/objs/d3tooltip.js';

import { useCommonProps } from '@/objs/commonProps.js'

export default {
  props: ["ds", "heatmapProps", "commonProps"],
  emits: ['clicked', 'selectionChanged'],
  data() {
    const { selection, clicked, hover, dropIndices, nLimit, MEvent, MEventSource, varCond, factorCond } = useCommonProps();
    return {
      margin: { top: 150, right: 20, bottom: 40, left: 70 },
      height: 300,
      width: 800,

      size: 20,
      texthoverratio: 2,
      pos: {
        x: 0,
        y: 0
      },
      scale: 1,
      // codebook: {},

      // Current ds
      absDS: null,

      thres: 0,

      // 
      isAbs: true,
      isT: false,
      isThresholded: true,
      sortOnClick: true,
      resetSortingCount: 0,

      factorcolor: d3.scaleOrdinal(faviscolorscheme),
      tocolorfactor: true,

      selection,
      clicked,
      hover,
      dropIndices,
      nLimit,
      MEvent,
      MEventSource,
      varCond,
      factorCond,

      // Current Column and Row Order, matrix
      order: [],
      order_i: 0,
      rorder: [],
      rorder_i: 0,
      matrix: [],

      legend: null,
      tooltip: null,

      xScale: d3.scaleBand(),
      yScale: d3.scaleBand(),
      cScale: faviscolorscale,
    }
  },
  watch: {
    ds: function () {
      this.cds = this.ds;
      this.absDS = new CSVData(this.ds.csvData, true);
      this.updateGraph();
    },
    tocolorfactor: function () {
      this.reset();
    },
    isAbs: function () {
      this.reset();
    },
    isThresholded() {
      this.updateGraph();
    },
    isT: function () {
      this.reset();
    },
    resetSortingCount: function () {
      this.resetSorting();
    },
    size: function () {
      this.updateGraph();
    },
    order_i: function (v) {
      this.order = this.cds.orders[v];
      //this.rorder = this.cds.rsimorders[v];
      this.$store.commit("updateOrder", {
        var: !this.isT ? this.order : this.rorder,
        factor: !this.isT ? this.rorder : this.order
      });
      this.filterd();
      this.updateGraph();
    },
    rorder_i: function (v) {
      this.rorder = this.cds.rorders[v];
      //this.order = this.cds.simorders[v];
      this.$store.commit("updateOrder", {
        var: !this.isT ? this.order : this.rorder,
        factor: !this.isT ? this.rorder : this.order
      });
      this.filterd();
      this.updateGraph();
    },
    clicked: {
      handler(clicked) {
        if (this.clicked.sort && typeof this.clicked.var == "number") {
          if (!this.isT) this.rorder_i = this.clicked.var + 1;
          else this.order_i = this.clicked.var + 1;
        };
        if (this.clicked.sort && typeof this.clicked.factor == "number") {
          if (!this.isT) this.order_i = this.clicked.factor + 1;
          else this.rorder_i = this.clicked.factor + 1;
        };
        if (this.clicked.source != this.MEventSource.Heatmap) {
          if (typeof this.clicked.var == "number") {
            const candidate = this.xScale(this.clicked.var);
            const svgW = this.$refs.svgfield.parentNode.parentNode.clientWidth;
            //console.log(candidate + " " + svgW)
            if (-this.pos.x + this.margin.left + candidate > svgW || -this.pos.x + this.margin.left + candidate < 0) {
              if (!this.isT) this.pos.x = candidate;
            }
          } else if (typeof this.clicked.factor == "number") {
            if (this.isT) this.pos.x = this.yScale(this.clicked.factor);
          }
        }
        this.updateGraph();
      },
      deep: true
    },
    selection: {
      handler(selection) {
        this.updateGraph();
      },
      deep: true
    },
    hover: {
      handler(hover) {
        this.updateGraph();
      },
      deep: true
    },
    dropIndices() {
      this.filterd();
      this.updateGraph();
    },
    nLimit() {
      this.filterd();
      this.updateGraph();
    },
    heatmapProps: {
      handler(heatmapProps) {
        this.resetSortingCount = heatmapProps.resetSorting;
        this.scale = heatmapProps.scale;
        this.isAbs = heatmapProps.isAbs;
        this.isT = heatmapProps.isT;
        this.isThresholded = heatmapProps.isThresholded;
        this.sortOnClick = heatmapProps.sortOnClick;
        this.tocolorfactor = heatmapProps.tocolorfactor;

        if (this.legend) this.legend.threshold(this.isThresholded ? this.thres : -1);
      },
      deep: true
    },
    commonProps: {
      handler(commonProps) {
        this.thres = commonProps.thres;
        if (this.legend) this.legend.threshold(this.isThresholded ? this.thres : -1);
        this.updateGraph();
      },
      deep: true
    }
  },
  computed: {
    svgViewBox() {
      return `${this.pos.x}, ${this.pos.y}, ${this.svgWidth / this.scale}, ${this.svgHeight / this.scale}`
    },
    svgWidth() { return this.width + this.margin.left + this.margin.right },
    svgHeight() { return this.height + this.margin.top + this.margin.right },
    svgGOffeset() { return `scale(${this.scale}) translate(${-this.pos.x + this.margin.left / this.scale}, ${-this.pos.y + this.margin.top / this.scale})` }
  },
  methods: {
    colCond(d) { return !this.isT ? this.varCond(d) : this.factorCond(d) },
    rowCond(d) { return this.isT ? this.varCond(d) : this.factorCond(d) },

    reset() {
      this.cds = this.isAbs ? this.absDS : this.ds;

      if (this.isT) {
        this.cds = CSVData.transpose(this.cds);
      }
      this.order = this.cds.orders[0];
      this.rorder = this.cds.rorders[0];
      this.matrix = this.cds.matrix;
      this.order_i = 0;
      this.rorder_i = 0;
      this.filterd();
      this.updateGraph();
    },

    resetSorting() {
      this.order_i = 0;
      this.rorder_i = 0;
    },

    filterd() {
      const col = !this.isT ? "var" : "factor";
      const row = !this.isT ? "factor" : "var";
      this.order = this.cds.orders[this.order_i];
      this.rorder = this.cds.rorders[this.rorder_i];
      this.matrix = this.cds.matrix;
      if (this.dropIndices.var.length || this.dropIndices.factor.length) {
        this.order = this.order.filter(d => this.dropIndices[col].indexOf(d) == -1);
        this.rorder = this.rorder.filter(d => this.dropIndices[row].indexOf(d) == -1);
        this.matrix = this.matrix.filter(d => this.dropIndices[row].indexOf(d.y) == -1).map(row => (row.filter(d => this.dropIndices[col].indexOf(d.x) == -1)));
      }
      if (this.nLimit[row]) {
        this.matrix = this.matrix.filter((d, i) => this.rorder.indexOf(i) < this.nLimit[row]);
        this.rorder = this.rorder.filter((d, i) => i < this.nLimit[row]);
      }
      if (this.nLimit[col]) {
        this.matrix = this.matrix.map(row => (row.filter((d, i) => this.order.indexOf(i) < this.nLimit[col])));
        this.order = this.order.filter((d, i) => i < this.nLimit[col]);
      }
    },

    updateGraph() {
      console.log("HEATMAP: updateGraph");
      let svg = d3.select(this.$refs.svgfield);
      this.xScale.range([0, this.size * this.order.length]).domain(this.order);
      this.yScale.range([0, this.size * this.rorder.length]).domain(this.rorder);

      svg.selectAll(".matcolumn").data(this.order, d => d)
        .join(
          enter => enter
            .append("g")
            .attr("class", "matcolumn")
            .attr("transform", (d) => {
              return "translate(" + this.xScale(d) + ")rotate(-90)";
            })
            .call(g => g.append("line")
              .attr("x1", -this.width))
            .call(g => g.append("rect")
              .attr("class", "highlight")
              .attr("y", -1)
              .attr("x", -this.size * this.rorder.length + 1)
              .attr("width", this.size * this.rorder.length)
              .attr("stroke-width", 1)
              .attr("height", this.size).style("fill", "transparent"))
            .call(g => g.append("text")
              .attr("x", 6)
              .attr("y", this.size / 2)
              .attr("font-size", this.size)
              .attr("dy", ".32em")
              .attr("text-anchor", "start")
              .text((d) => this.cds.names[d]))
            .call(g => g.insert("rect", "text")
              .attr("class", "textrect"))
            .on("click", (e, d) => {
              if (!this.isT) {
                if (this.sortOnClick)
                  this.rorder_i = parseInt(d + 1);
                this.$store.commit("updateClicked", {
                  var: d,
                  factor: null,
                  sort: true,
                  source: this.MEventSource.Heatmap
                });
              } else {
                if (this.sortOnClick)
                  this.rorder_i = parseInt(d + 1);
                this.$store.commit("updateClicked", {
                  var: null,
                  factor: d,
                  sort: true,
                  source: this.MEventSource.Heatmap
                });
              }
              e.stopPropagation();
            }),
          update => update
            .attr("transform", (d) => "translate(" + this.xScale(d) + ")rotate(-90)")
            .call(g => g.selectAll("rect")
              .attr("x", -this.size * this.rorder.length + 1)
              .attr("width", this.size * this.rorder.length))
            .call(g => g.selectAll("text")
              .attr("y", this.size / 2)
              .attr("font-size", this.size)
              .text((d) => this.cds.names[d])),

          exit => exit.remove()
        );

      const colSelSet = !this.isT ? this.selection.var : this.selection.factor;
      svg.selectAll(".matcolumn").selectAll(".highlight").style("stroke", d => this.colCond(d) == this.MEvent.Clicked ? "red" : "transparent");
      svg.selectAll(".matcolumn").selectAll("text")
        .attr('font-size', (d, i) =>
          (this.colCond(d) == this.MEvent.Hovered || this.colCond(d) == this.MEvent.Clicked) ? this.size * this.texthoverratio : this.size
        );
      //.style('fill', (d, i) =>
      //  (this.colCond(d) == this.MEvent.Hovered) ? 'red' : (this.isT && this.tocolorfactor ? this.factorcolor(d + 1) : 'black')
      //)
      //.style('fill-opacity', (d, i) => colSelSet.size > 0 && this.colCond(d) != this.MEvent.Selected ? 0.1 : 1
      //);

      svg.selectAll(".matcolumn").each((d, i, nodes) => {
        const elem = d3.select(nodes[i]);
        let bbox = elem.select("text").node().getBBox();
        if (this.colCond(d) == this.MEvent.Hovered || this.colCond(d) == this.MEvent.Clicked) {
          elem.select(".textrect").attr("x", bbox.x)
            .attr("y", bbox.y)
            .attr("width", bbox.width)
            .attr("height", bbox.height)
            .style("fill", "#FFFFFF");
          elem.raise();
        } else {
          elem.select(".textrect").attr("x", bbox.x)
            .attr("y", bbox.y)
            .attr("width", 0)
            .attr("height", 0)
            .style("fill", "transparent");
        }
      });

      const createCells = (row, i, nodes) => {
        const rowElem = d3.select(nodes[i]);
        rowElem.selectAll(".cell")
          .data(row)
          .join("rect")
          .attr("class", "cell")
          .attr("x", (d) => {
            return this.xScale(d.x);
          })
          .attr("width", this.size - 2)
          .attr("height", this.size - 2)
          .style("fill", d => this.thres <= Math.abs(d.z) || !this.isThresholded ? this.cScale(d.z) : this.cScale(0))
          .style('fill-opacity', (d, i) => {
            const cond = this.colCond(d.x);
            if (cond == this.MEvent.Clicked) return 1;
            if (colSelSet.size > 0 && cond != this.MEvent.Selected) return 0.1;
            return 1;
          })
          .on("mouseover", (event) => this.tooltip.mouseover(event))
          .on("mousemove", (event, d) => {
            this.tooltip.mousemove(event, {
              var: !this.isT ? this.cds.names[d.x] : this.cds.row_names[d.y],
              factor: !this.isT ? this.cds.row_names[d.y] : this.cds.names[d.x],
              codebook: this.cds.codebook ? (!this.isT ? { ...{ "Loading": Math.round(d.z * 100) / 100 }, ...this.cds.codebook[this.cds.names[d.x]] } : { ...{ "Loading": Math.round(d.z * 100) / 100 }, ...this.cds.codebook[this.cds.row_names[d.y]], }) : { "Loading": Math.round(d.z * 100) / 100 }
            });
          })
          .on("mouseleave", (event) => this.tooltip.mouseleave(event));
      };

      svg.selectAll(".matrow")
        .data(this.matrix, d => d)
        .join(enter => enter.append("g")
          .attr("class", "matrow")
          .attr("transform", (d, i) => "translate(0," + this.yScale(i) + ")")
          .style('fill', (d, i) =>
            (this.rowCond(i) == this.MEvent.Selected) ? 'red' : (!this.isT && this.tocolorfactor ? this.factorcolor(i + 1) : 'black')
          )
          .on("click", (e, d) => {
            let [x, y] = d3.pointer(e);
            if (x < 0 || y < 0) return;
            if (!this.isT) {
              this.$store.commit("updateClicked", {
                var: this.order[Math.floor(x / this.size)],
                factor: d[0].y,
                source: this.MEventSource.Heatmap
              });
            } else {
              this.$store.commit("updateClicked", {
                var: d[0].y,
                factor: this.order[Math.floor(x / this.size)],
                source: this.MEventSource.Heatmap
              });
            }
            e.stopPropagation();
          })
          .call(g => g.append("line")
            .attr("x2", this.width))
          .call(g => g.append("rect")
            .attr("class", "highlight")
            .attr("y", -1)
            .attr("x", 0)
            .attr("width", this.size * this.order.length)
            .attr("stroke-width", 1)
            .style("stroke", (d, i) => d.length && (this.rowCond(d[0].y) == this.MEvent.Clicked) ? "red" : "transparent")
            .attr("height", this.size).style("fill", "transparent"))
          .call(g => g.append("text")
            .attr("x", -6)
            .attr("y", this.size / 2)
            .attr("font-size", this.size)
            .attr("dy", ".32em")
            .attr("text-anchor", "end")
            .text((d, i) => this.cds.row_names[i])
            .on("click", (e, d, i) => {
              if (!this.isT) {
                if (this.sortOnClick)
                  this.order_i = parseInt(d[0].y + 1);
                this.$store.commit("updateClicked", {
                  var: null,
                  factor: d[0].y,
                  sort: true,
                  source: this.MEventSource.Heatmap
                });
              } else {
                if (this.sortOnClick)
                  this.order_i = parseInt(d[0].y + 1);
                this.$store.commit("updateClicked", {
                  var: d[0].y,
                  factor: null,
                  sort: true,
                  source: this.MEventSource.Heatmap
                });
              }
              e.stopPropagation();
            }))
          .call(g => g.insert("rect", "text")
            .attr("class", "textrect"))
          .each(createCells),
          update => update
            .attr("transform", (d, i) => "translate(0," + this.yScale(i) + ")")
            .style('fill', (d, i) =>
              (this.rowCond(i) == this.MEvent.Selected) ? 'red' : (!this.isT && this.tocolorfactor ? this.factorcolor(i + 1) : 'black')
            )
            .call(g => g.selectAll("text")
              .attr("y", this.size / 2)
              .text((d, i) => this.cds.row_names[i])
              .attr("font-size", this.size))
            .each(createCells),
          exit => exit.remove());

      //const rowSelSet = this.isT ? this.selection.var : this.selection.factor;
      //svg.selectAll(".matrow").style('fill', (d, i) =>
      //  (this.rowCond(i) == this.MEvent.Hovered) ? 'red' : (!this.isT && this.tocolorfactor ? this.factorcolor(i + 1) : 'black')
      //)
      //  .style('opacity', (d, i) => rowSelSet.size > 0 && this.rowCond(i) != this.MEvent.Selected ? 0.1 : 1);


      svg.selectAll(".matrow").selectAll("text").attr('font-size', (d, i) =>
        (this.rowCond(d[0].y) == this.MEvent.Hovered || this.rowCond(d[0].y) == this.MEvent.Clicked) ? this.size * this.texthoverratio : this.size
      )


      svg.selectAll(".matrow").each((d, i, nodes) => {
        const elem = d3.select(nodes[i]);
        let bbox = elem.select("text").node().getBBox();
        if (this.rowCond(i) == this.MEvent.Hovered || this.rowCond(d[0].y) == this.MEvent.Clicked) {
          elem.select(".textrect").attr("x", bbox.x)
            .attr("y", bbox.y)
            .attr("width", bbox.width)
            .attr("height", bbox.height)
            .style("fill", "#FFFFFF");
          elem.raise();
        } else {
          elem.select(".textrect").attr("x", bbox.x)
            .attr("y", bbox.y)
            .attr("width", 0)
            .attr("height", 0)
            .style("fill", "transparent");
        }
      });

      svg.selectAll(".matrow").selectAll(".highlight")
        .style("stroke", (d, i) => d.length && (this.rowCond(d[0].y) == this.MEvent.Clicked) ? "red" : "transparent")
        .attr("width", this.size * this.order.length);

      svg.selectAll(".cell").style("fill", d => this.thres <= Math.abs(d.z) || !this.isThresholded ? this.cScale(d.z) : this.cScale(0));

    }
  },
  mounted() {
    // d3.csv("codebook.csv").then((data) => {
    //   this.codebook = data;
    // });
    this.absDS = CSVData.abs(this.ds);
    this.cds = this.isAbs ? this.absDS : this.ds;
    this.order = this.cds.orders[0];
    this.rorder = this.cds.rorders[0];
    this.matrix = this.cds.matrix;
    this.tooltip = new Tooltip(this.$refs.tooltip);
    this.factorcolor.domain(d3.range(this.cds.row_names.length));
    this.updateGraph();
    this.legend = new Legend(this.cScale, {
      width: 160,
      title: "Factor Loading",
      marginLeftText: 47,
    });
    this.$refs.legend.appendChild(this.legend.node());

    d3.select(this.$refs.svg)
      .attr("pointer-events", "all")
      .on("click", () => {
        const clicked = {
          var: null,
          factor: null,
        };
        this.$store.commit("updateClicked", clicked);
      })
      .call(d3.drag()
        .on("start", function () {
          d3.select(this).style("cursor", "grabbing");
        })
        .on("drag", (event) => {
          this.pos = {
            x: this.pos.x - event.dx / this.scale,
            y: this.pos.y - event.dy / this.scale
          };
        })
        .on("end", function () {
          d3.select(this).style("cursor", null);
        })
      );
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.stick {
  position: sticky;
  top: 10px;
}

.hm {
  white-space: nowrap;
  color: #333;
  font-family: "PT Serif", serif;
  margin: 1em auto 4em auto;
}

.hm .background {
  fill: #eee;
}

.hm line {
  stroke: #fff;
}

.hm text.active {
  fill: red;
}

.hm svg {
  font: 10px sans-serif;
}

.legenddiv {
  position: absolute;
  top: 20px;
  margin-left: 20px;
}
</style>
