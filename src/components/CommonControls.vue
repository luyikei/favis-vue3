<template>
  <v-sheet>
    <v-card-title>Selection</v-card-title>
    <v-card-text fluid>
    <v-text-field
    v-model="commonProps.searchText"
      label="Search"
          hide-details="auto"
          class="pb-3 pt-3"
    ></v-text-field>
    <v-row no-gutters>
    <v-col md="4">
        Variable: 
    </v-col>
    <v-col md="8">
        {{ ds.names[commonProps.selectedVar] }}
    </v-col>
    </v-row>
    <v-row no-gutters>
    <v-col md="4">
        Factor:
    </v-col>
    <v-col md="8">
        {{ ds.row_names[commonProps.selectedFactor] }}
    </v-col>
    </v-row>
  </v-card-text>
    <v-card-title>Threshold</v-card-title>
    <v-card-text fluid>
      <svg v-if="cdfProps" ref="svgcdf" :width="`${cdfProps.width + cdfProps.ml + cdfProps.mr}`" :height="`${cdfProps.height + cdfProps.mt + cdfProps.mb}`"
      >
        <g ref="svgcdffield" :transform="`translate(${cdfProps.ml}, ${cdfProps.mt})`" >
        </g>
      </svg> 
      <v-slider
          v-model.number="commonProps.thres"
          min="0"
          :max="thres_max"
          step="0.01"
          :thumb-size="12"
          thumb-label
          hide-details="auto"
        >
      </v-slider>
  </v-card-text>
  </v-sheet>

</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
</style>

<script>
import * as d3 from "d3";

export default {
  props: ["ds", "selection", "clicked"],
  data() {
    return {
      commonProps: {
        clickedVar: null,
        clickedFactor: null,
        selectedVar: null,
        selectedFactor: null,
        searchText: "",
        thres: 1
      },
      thres_max: 1,
      cdfData: [],
      cdfProps: {
          width:  170,
          height: 150,
          ml: 30,
          mr: 15,
          mt: 30, 
          mb: 20,
      },
    }
  },
  watch: {
    commonProps: {
      handler(val){
        let gy = this.cdfData.find(v => v.x >= this.commonProps.thres).y;
        d3.select(this.$refs.svgcdffield).select(".thresholdLine")
          .datum([{x:this.commonProps.thres, y:0}, {x:this.commonProps.thres, y:gy}]).attr("d", this.cdfProps["line"]);
        d3.select(this.$refs.svgcdffield).select(".thresholdLineY")
          .datum([{x:0, y: gy}, {x:this.commonProps.thres, y: gy}]).attr("d", this.cdfProps["line"]);
        this.$emit('updated', this.commonProps);
      },
      deep: true
    },
    selection: {
      handler(selection){
        this.commonProps.selectedVar = selection.var;
        this.commonProps.selectedFactor = selection.factor;
      },
      deep: true
    },
    clicked: {
      handler(clicked){
        this.commonProps.clickedVar = clicked.var;
        this.commonProps.clickedFactor = clicked.factor;
      },
      deep: true
    },
  },
  methods: {
    updateCDFGraph() {
      let svg = d3.select(this.$refs.svgcdffield);
      let height = this.cdfProps.height;
      let width = this.cdfProps.width;
      let x = d3.scaleLinear()
          .range([0, width]);
      let y = d3.scaleLinear()
          .range([height, 0]);
      let xAxis = d3.axisBottom(x);
      let yAxis = d3.axisLeft(y);
      let line = d3.line()
          .x(function(d) { return x(d.x); })
          .y(function(d) { return y(d.y); });
      this.cdfProps["line"] = line;

      svg.call(d3
          .drag()
          .on("drag", (event) => {
            let thres = x.invert(event.x - this.cdfProps.ml);
            this.commonProps.thres = Math.max(0, thres);
          }))
      

      let data = this.cdfData;

      // scale the x and y axis according the the max and min values, could also keep 
      // track of min and max values in loop above. The .nice() will round the min and max values to
      // nice values
      x.domain(d3.extent(data, function(d) { return d.x; })).nice();
      y.domain(d3.extent(data, function(d) { return d.y; })).nice();

      svg.append("text")
        .attr("x", -this.cdfProps.ml+5) 
        .attr("y", -13) 
        .style("font-size", "10px") 
        .text("Cumulative Distribution of Factor Loadings") 
      
      svg.append("g")
            .attr("class", "x axis")
            .attr("transform", "translate(0," + height + ")")
            .call(xAxis);

      svg.append("g")
            .attr("class", "y axis")
            .call(yAxis);

      svg.append("path").datum(data)
        .attr("class", "line")
        .attr("d", line)
        .style("stroke", function() { return "#666666"; })
        .style("fill", "transparent");

      let gy = this.cdfData.find(v => v.x >= this.commonProps.thres).y;
      svg.append("path").datum([{x:this.commonProps.thres, y:0}, {x:this.commonProps.thres, y:gy}])
        .attr("class", "thresholdLine")
        .attr("d", line)
        .style("stroke", function() { return "#AAAAAA"; })
        .style("fill", "transparent");

      svg.append("path").datum([{x:0, y: gy}, {x:this.commonProps.thres, y: gy}])
        .attr("class", "thresholdLineY")
        .attr("d", line)
        .style("stroke", function() { return "#AAAAAA"; })
        .style("fill", "transparent");
      }
  },
  mounted() {
    let cdfTemp = [];
    for (let i = 0; i < this.ds.matrix.length; i++) {
      for (let j = 0; j < this.ds.matrix[i].length; j++) {
        cdfTemp.push(Math.abs(this.ds.matrix[i][j].z));
      }
    }
    cdfTemp.sort();
    this.thres_max = cdfTemp[cdfTemp.length - 1];
    this.commonProps.thres = this.thres_max / 4 * 3;
    for (let i = 0; i < cdfTemp.length; ++i) {
      this.cdfData.push({
        x: cdfTemp[i],
        y: (i + 1) / cdfTemp.length
      });
      this.cdfData.push({
        x: i < cdfTemp.length - 1 ? cdfTemp[i+1] : cdfTemp[i] + 0.1,
        y: (i + 1) / cdfTemp.length
      });
    }
    this.updateCDFGraph();
    this.$emit('updated', this.commonProps);
  },
};
</script>
