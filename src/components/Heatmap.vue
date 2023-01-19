<template>
  <svg ref="svg" width="100%" height="100%" :viewBox="svgViewBox" >
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
import {Legend, faviscolorscheme, faviscolorscale} from "@/objs/d3colorlegend.js"
import { create, all } from 'mathjs'

const config = { }
const math = create(all, config)

import {CSVData} from '@/objs/CSVData.js';
import {Tooltip} from '@/objs/d3tooltip.js';

export default {
  props: ["ds", "heatmapProps", "commonProps", "showControls"],
  emits: ['clicked', 'selectionChanged'],
  data() {
    return {
      margin: {top: 0, right: 20, bottom: 40, left: 70},
      height: 300,
      width: 800,

      size: 20,
      x: 0,
      y: 0,
      scale: 1,
      // codebook: {},

      // Current ds
      absDS: null,
      cds: {},

      thres: 0,

      // 
      isAbs: false,
      isT: false,
      isThresholded: true,
      sortOnClick: true,
      resetSortingCount: 0,

      factorcolor: d3.scaleOrdinal(faviscolorscheme),
      tocolorfactor: false,

      selection: {
        var: null,
        factor: null
      },
      clicked: {
        var: null,
        factor: null
      },

      // Current Column and Row Order, matrix
      order: [],
      order_i: 0,
      rorder: [],
      rorder_i: 0,
      matrix: [],

      searchText: "",

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
    tocolorfactor: function() {
      this.reset();
    },
    isAbs: function() {
      this.reset();
    },
    isT: function() {
      this.reset();
    },
    resetSortingCount: function() {
      this.resetSorting();
    },
    size: function () {
      this.updateGraph();
    },
    order_i: function (v) {
      this.order = this.cds.orders[v];
      this.filterd(this.searchText);
      this.updateGraph();
    },
    rorder_i: function (v) {
      this.rorder = this.cds.rorders[v];
      this.filterd(this.searchText);
      this.updateGraph();
    },
    searchText: function() {
      this.filterd(this.searchText);
      this.updateGraph();
    },
    clicked:  {
      handler(clicked){
        let svg = d3.select(this.$refs.svgfield);
        svg.selectAll(".matcolumn").call(g => g.selectAll("rect")
                      .style("stroke", d => d == this.clicked.var && !this.isT ? "red" : "transparent"));
        svg.selectAll(".matrow").call(g => g.selectAll(".highlight")
                      .style("stroke", (d,i) => d[0].y == this.clicked.var && this.isT ? "red" : "transparent"));
      },
      deep: true
    },
    heatmapProps:  {
      handler(heatmapProps){
        this.resetSortingCount = heatmapProps.resetSorting;
        this.scale = heatmapProps.scale;
        this.isAbs = heatmapProps.isAbs;
        this.isT = heatmapProps.isT;
        this.isThresholded = heatmapProps.isThresholded;
        this.sortOnClick = heatmapProps.sortOnClick;
        this.tocolorfactor = heatmapProps.tocolorfactor;

        if (this.legend) this.legend.threshold(this.isThresholded ? this.thres : -1);
        
        let svg = d3.select(this.$refs.svgfield);
        svg.selectAll(".cell").style("fill", d => this.thres <= Math.abs(d.z) || !this.isThresholded ? this.cScale(d.z) : this.cScale(0));
      },
      deep: true
    },
    commonProps: {
      handler(commonProps){
        this.selection.var = commonProps.selectedVar;
        this.selection.factor = commonProps.selectedFactor;
        this.clicked.var = commonProps.clickedVar;
        this.clicked.factor = commonProps.clickedFactor;
        this.searchText = commonProps.searchText;
        this.thres = commonProps.thres;

        if (this.legend) this.legend.threshold(this.isThresholded ? this.thres : -1);
        

        let svg = d3.select(this.$refs.svgfield);
        svg.selectAll(".matcolumn").selectAll("text")
                          .style('fill', (d, i) =>
                            (!this.isT && d == this.selection.var) ||
                            (this.isT && d == this.selection.factor) ? 'red' :  (this.isT && this.tocolorfactor ? this.factorcolor(d+1) : 'black')
                          );
        svg.selectAll(".matrow")
                          .style('fill', (d, i) =>
                            (!this.isT && i == this.selection.factor) ||
                            (this.isT && i == this.selection.var) ? 'red' :  (!this.isT && this.tocolorfactor ? this.factorcolor(i+1) : 'black')
                          );

        svg.selectAll(".cell").style("fill", d => this.thres <= Math.abs(d.z) || !this.isThresholded ? this.cScale(d.z) : this.cScale(0))
      },
      deep: true
    }
  },
  computed: {
    svgViewBox() { return `${this.x}, ${this.y}, ${this.svgWidth/this.scale}, ${this.svgHeight/this.scale}` },
    svgWidth() { return this.width + this.margin.left + this.margin.right },
    svgHeight() { return this.height + this.margin.top + this.margin.right },
    svgGOffeset() { return "translate(" + this.margin.left + "," + this.margin.top + ")" }
  },
  methods: {
    reset() {
      this.cds = this.isAbs ? this.absDS : this.ds;

      if (this.isT) {
        this.cds = CSVData.transpose(this.cds);
      }
      this.order = this.cds.orders[0];
      this.rorder = this.cds.rorders[0];
      this.matrix = this.cds.matrix;
      for (let i = 0; i < this.matrix.length; ++i) {
        for (let j = 0; j < this.matrix[i].length; ++j) {
          this.matrix[i][j].y = i;
          this.matrix[i][j].x = j;
        }      
      }
      this.order_i = 0;
      this.rorder_i = 0;
      this.updateGraph();
    },

    resetSorting() {
      this.order_i = 0;
      this.rorder_i = 0;
    },
    
    filterd(val) {
      if (val) {
        this.order = this.cds.orders[this.order_i].filter(d => this.cds.names[d].startsWith(val));
        this.matrix = this.cds.matrix.map(row => (val ? row.filter(d => this.cds.names[d.x].startsWith(val)): row) );
      } else {
        this.order = this.cds.orders[this.order_i];
        this.matrix = this.cds.matrix;
      }
    },

    updateGraph() {
      console.log("HEATMAP: updateGraph");
      let svg = d3.select(this.$refs.svgfield);
      let that = this;

      this.xScale.range([0, this.size * this.order.length]).domain(this.order);
      this.yScale.range([0, this.size * this.rorder.length]).domain(this.rorder);
      
      d3.select(this.$refs.svg)
          .attr("pointer-events", "all")
          .on("click", () => {
            this.clicked.var = null;
            this.clicked.factor = null;
          })
          .call(d3.drag()
            .on("start", () => {
              d3.select(that.$refs.svg).style("cursor", "grabbing");
            })
            .on("drag", (event) => {
              this.x -= event.dx/this.scale;
              this.y -= event.dy/this.scale;
            })
            .on("end", function() {
              d3.select(that.$refs.svg).style("cursor", null);
            })
          );

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
                      .attr("y", -1)
                      .attr("x", -this.size * this.rorder.length+1)
                      .attr("width", this.size * this.rorder.length)
                      .attr("stroke-width", 1)
                      .style("stroke", d => d == this.clicked.var && !this.isT ? "red" : "transparent")
                      .attr("height", this.size).style("fill", "transparent"))
                    .call(g => g.append("text")
                      .attr("x", 6)
                      .attr("y", this.size / 2)
                      .attr("font-size", this.size)
                      .attr("dy", ".32em")
                      .attr("text-anchor", "start")
                      .text((d) => this.cds.names[d]))
                      .style('fill', (d, i) =>
                            (!this.isT && d == this.selection.var) ||
                            (this.isT && d == this.selection.factor) ? 'red' :  (this.isT && this.tocolorfactor ? this.factorcolor(d+1) : 'black')
                          )
                      .on("click", (e, d) => {
                        if (this.sortOnClick)
                            this.rorder_i = parseInt(d + 1);
                        e.stopPropagation();
                      }),
          update => update
                      .attr("transform", (d) => "translate(" + this.xScale(d) + ")rotate(-90)")
                      .call(g => g.append("rect")
                        .style("stroke", d => d == this.clicked.var && !this.isT ? "red" : "transparent"))
                      .call(g => g.selectAll("text")
                        .attr("y", this.size / 2)
                        .attr("font-size", this.size)
                        .style('fill', (d, i) =>
                              (!this.isT && d == this.selection.var) ||
                              (this.isT && d == this.selection.factor) ? 'red' :  (this.isT && this.tocolorfactor ? this.factorcolor(d+1) : 'black')
                            )
                        .text((d) => this.cds.names[d])),

          exit => exit.remove()
      );

      let createCells = (row, rowElem) => {
        rowElem.selectAll(".cell")
            .data(row)
            .join("rect")
            .attr("class", "cell")
            .attr("x", (d) => {
              return this.xScale(d.x);
            })
            .attr("width", this.size-2)
            .attr("height", this.size-2)
            .style("fill", d => this.thres <= Math.abs(d.z) || !this.isThresholded? this.cScale(d.z) : this.cScale(0))
            .on("click", (e, d) =>{
              if (!this.isT) {
                this.clicked.var = d.x;
                this.clicked.factor = d.y;
              } else {
                this.clicked.var = d.y;
                this.clicked.factor = d.x;
              }
              this.$emit("clicked", this.clicked);
              e.stopPropagation();
            })
            .on("mouseover", (event) => this.tooltip.mouseover(event))
            .on("mousemove", (event, d) =>
            {
              this.tooltip.mousemove(event, {
                var: !this.isT ? this.cds.names[d.x] : this.cds.row_names[d.y],
                factor: !this.isT ? this.cds.row_names[d.y] : this.cds.names[d.x],
                codebook: !this.isT ? this.cds.codebook[this.cds.names[d.x]] : this.cds.codebook[this.cds.row_names[d.y]]
              });
            })
            .on("mouseleave", (event) => this.tooltip.mouseleave(event))
      }

      svg.selectAll(".matrow")
        .data(this.matrix, d => d)
        .join(enter => enter.append("g")
                .attr("class", "matrow")
                .attr("transform", (d, i) => "translate(0," + this.yScale(i) + ")")
                .style('fill', (d, i) =>
                  (!this.isT && i == this.selection.factor) ||
                  (this.isT && i == this.selection.var) ? 'red' :  (!this.isT && this.tocolorfactor ? this.factorcolor(i+1) : 'black')
                )
                .call(g => g.append("line")
                  .attr("x2", this.width))
                .call(g => g.append("rect")
                  .attr("class", "highlight")
                  .attr("y", -1)
                  .attr("x", 0)
                  .attr("width", this.size * this.order.length)
                  .attr("stroke-width", 1)
                  .style("stroke", (d,i) => d[0].y == this.clicked.var && this.isT ? "red" : "transparent")
                  .attr("height", this.size).style("fill", "transparent"))
                .call(g => g.append("text")
                  .attr("x", -6)
                  .attr("y", this.size / 2)
                  .attr("font-size", this.size)
                  .attr("dy", ".32em")
                  .attr("text-anchor", "end")
                  .text((d, i) => this.cds.row_names[i])
                  .on("click", (e, d) => {
                    if (this.sortOnClick)
                      this.order_i = parseInt(d[0].y + 1);
                  }))
                .each(function(v) {return createCells.bind(that)(v, d3.select(this))}),
              update => update
                          .attr("transform", (d, i) => "translate(0," + this.yScale(i) + ")")
                          .style('fill', (d, i) =>
                            (!this.isT && i == this.selection.factor) ||
                            (this.isT && i == this.selection.var) ? 'red' :  (!this.isT && this.tocolorfactor ? this.factorcolor(i+1) : 'black')
                          )
                          .call(g => g.selectAll(".highlight")
                            .style("stroke", (d,i) => d[0].y == this.clicked.var && this.isT ? "red" : "transparent"))
                          .call(g => g.selectAll("text")
                            .attr("y", this.size / 2)
                            .attr("font-size", this.size))
                            .each(function(v) {return createCells.bind(that)(v, d3.select(this))}),
              exit => exit.remove());
    }
  },
  mounted() {
    // d3.csv("codebook.csv").then((data) => {
    //   this.codebook = data;
    // });
    this.cds = this.ds;
    this.absDS = CSVData.abs(this.ds);
    this.order = this.ds.orders[0];
    this.rorder = this.ds.rorders[0];
    this.matrix = this.ds.matrix;
    this.tooltip = new Tooltip(this.$refs.tooltip);
    this.factorcolor.domain(d3.range(this.ds.row_names.length));
    this.updateGraph();
    this.legend = new Legend(this.cScale, {
      width: 160,
      title: "Factor Loading",
    });
    this.$refs.legend.appendChild(this.legend.node());
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
