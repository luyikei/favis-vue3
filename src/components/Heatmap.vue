<template>
  <v-container fluid>
  <v-row no-gutters>
    <v-col md="9" ref="svgParent"  class="text-xs-center hm">
    <svg ref="svg" :width="svgWidth" :height="svgHeight" :viewBox="svgViewBox" >
      <g ref="svgfield" :transform="svgGOffeset">
        <g ref="xaxis"></g>
        <g ref="yaxis"></g>
      </g>
    </svg>
    </v-col>
    <v-col md="3" class="stick">
    <v-card
      class="mx-auto stick"
      v-if="showControls"
    >
    <v-card-title>Heatmap</v-card-title>
    <v-card-text>
        <v-slider
          v-model.number="scale"
          label="Scale"
          min="0.1"
          max="2"
          step="0.01"
          :thumb-size="24"
          thumb-label="always"
          >
        </v-slider>
    <v-btn
      block
      outlined
      color="indigo"
      v-on:click="resetSorting"
      depressed
      class="mb-4"  
    >
    Reset Sorting
    </v-btn>
    
    <v-checkbox
      v-model="isAbs"
      label="Use Absolute Values"
    ></v-checkbox>
    <v-checkbox
      v-model="isT"
      label="Transposed"
    ></v-checkbox>
        <v-text-field
        v-model="searchText"
          label="Search"
        ></v-text-field>
    </v-card-text>
    </v-card>
    </v-col>
  </v-row> 
  </v-container>
</template>
<script>

import * as d3 from "d3";

import {CSVData} from '@/objs/CSVData.js';

export default {
  props: ["ds", "showControls"],
  data() {
    return {
      margin: {top: 300, right: 20, bottom: 40, left: 70},
      height: 800,
      width: 800,

      size: 15,
      x: 0,
      y: 0,
      scale: 1,
      // codebook: {},

      // Current ds
      absDS: null,
      cds: {},

      // 
      isAbs: false,
      isT: false,

      // Current Column and Row Order, matrix
      order: [],
      order_i: 0,
      rorder: [],
      rorder_i: 0,
      matrix: [],

      searchText: "",

      xScale: d3.scaleBand(),
      yScale: d3.scaleBand(),
      cScale: d3.scaleSequential().domain([-1, 1]).interpolator(d3.interpolateRdBu),
    }
  },
  watch: {
    ds: function () {
      this.cds = this.ds;
      this.absDS = new CSVData(this.ds.csvData, true);
      this.updateGraph();
    },
    isAbs: function() {
      this.reset();
    },
    isT: function() {
      this.reset();
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
    }
  },
  computed: {
    svgViewBox() { return `${this.x}, ${this.y}, ${this.svgWidth/this.scale}, ${this.svgHeight/this.scale}` },
    svgWidth() { return this.width + this.margin.left + this.margin.right },
    svgHeight() { return this.height + this.margin.top + this.margin.right },
    svgGOffeset() { return "translate(" + this.margin.left + "," + this.margin.top + ")" },
  },
  methods: {
    reset() {
      this.cds = this.isAbs ? this.absDS : this.ds;
      if (this.isT) {
        let newds = {
          orders: this.cds.rorders,
          rorders: this.cds.orders,
          csvData: this.cds.csvData,
          names: this.cds.row_names,
          row_names: this.cds.names,
        };

        let newMat = d3.transpose(this.cds.matrix);
        newds["matrix"] = newMat;

        this.cds = newds;
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
          .attr("pointer-events", "all").call(d3
          .drag()
          .on("start", () => {
            d3.select(that.$refs.svg).style("cursor", "grabbing");
          })
          .on("drag", (event) => {
            this.x -= event.dx/this.scale;
            this.y -= event.dy/this.scale;
          })
          .on("end", function() {
            d3.select(that.$refs.svg).style("cursor", null);
          }));

      let createCells = function (row) {
        d3.select(this).selectAll(".cell")
            .data(row)
            .join("rect")
            .attr("class", "cell")
            .attr("x", (d) => {
              return that.xScale(d.x);
            })
            .attr("width", that.size)
            .attr("height", that.size)
            .style("fill", d => that.cScale(d.z))
      }

      svg.selectAll(".matcolumn").data(this.order, d => d)
        .join(
          enter => enter
                    .append("g")
                    .attr("class", "matcolumn")
                    .attr("transform", (d) =>{
                        return "translate(" + this.xScale(d) + ")rotate(-90)";
                        })
                    .call(g => g.append("line")
                      .attr("x1", -this.width))
                    .call(g => g.append("text")
                      .attr("x", 6)
                      .attr("y", this.size / 2)
                      .attr("font-size", this.size)
                      .attr("dy", ".32em")
                      .attr("text-anchor", "start")
                      .text((d) => this.cds.names[d]))
                      .on("click", (_, d) => {
                        this.rorder_i = parseInt(d + 1);
                      }),
          update => update
                      .attr("transform", (d) => "translate(" + this.xScale(d) + ")rotate(-90)")
                      .call(g => g.selectAll("text")
                        .attr("y", this.size / 2)
                        .attr("font-size", this.size)
                        .text((d) => this.cds.names[d])),

          exit => exit.remove()
      );

      svg.selectAll(".matrow")
        .data(this.matrix, d => d)
        .join(enter => enter.append("g")
                .attr("class", "matrow")
                .attr("transform", (d, i) => "translate(0," + this.yScale(i) + ")")
                .call(g => g.append("line")
                  .attr("x2", this.width))
                .call(g => g.append("text")
                  .attr("x", -6)
                  .attr("y", this.size / 2)
                  .attr("font-size", this.size)
                  .attr("dy", ".32em")
                  .attr("text-anchor", "end")
                  .text((d, i) => this.cds.row_names[i])
                  .on("click", (_, d) => {
                    this.order_i = parseInt(d[0].y + 1);
                  }))
                .each(createCells),
              update => update
                          .attr("transform", (d, i) => "translate(0," + this.yScale(i) + ")")
                          .call(g => g.selectAll("text")
                            .attr("y", this.size / 2)
                            .attr("font-size", this.size))
                            .each(createCells),
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
    this.updateGraph();
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
</style>
