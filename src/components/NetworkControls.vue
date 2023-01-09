<template>
  <v-card
  >
    <v-card-title>Network</v-card-title>
    <v-card-text fluid>
    <v-row no-gutters>
    <v-col md="4">
        Variable: 
    </v-col>
    <v-col md="8">
        {{ networkProps.selected }}
    </v-col>
    </v-row>
    <v-row no-gutters>
    <v-col md="4">
        Factor:
    </v-col>
    <v-col md="8">
        {{ networkProps.selectedPC }}
    </v-col>
    </v-row>
    </v-card-text>
    <v-divider class="mx-4"></v-divider>
    <v-card-text>
      <v-slider
        v-model.number="networkProps.scale"
        min="0.1"
        max="2"
        step="0.01"
        label="Scale"
        :thumb-size="12"
        thumb-label
        hide-details="auto"
        class="pb-5"
        >
      </v-slider>
      <v-slider
          v-model.number="networkProps.thres"
          min="0"
          :max="thres_max"
        label="Threshold"
          step="0.01"
          :thumb-size="12"
          thumb-label
          hide-details="auto"
        class="pb-5"
        >
      </v-slider>
        <v-slider
          v-model.number="networkProps.link_opacity"
          label="Link Opacity"
          min="0.0"
          max="1.0"
          step="0.1"
          :thumb-size="12"
          thumb-label
          hide-details="auto"
        class="pb-5"
          >
        </v-slider>
        <v-switch
          v-model="networkProps.link_color"
          label="Use Factor Color for Link"
          hide-details="auto"
        class="pb-2"
        ></v-switch>
        <v-switch
          v-model="networkProps.displayHull"
          label="Disply Convex Hull"
          hide-details="auto"
        ></v-switch >
    </v-card-text>
        <v-card-text>Cumulative Distribution of Factor Loadings</v-card-text>
        <svg v-if="cdfProps" ref="svgcdf" :width="`${cdfProps.width + cdfProps.ml + cdfProps.mr}`" :height="`${cdfProps.height + cdfProps.mt + cdfProps.mb}`" class="pl-2">
          <g ref="svgcdffield" :transform="`translate(${cdfProps.ml}, ${cdfProps.mt})`" >
          </g>
        </svg>
  </v-card>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.v-input .v-label {
    font-size: 5em;
}
</style>

<script>
import * as d3 from "d3";

export default {
  props: ["ds", "selection"],
  data() {
    return {
      networkProps: {
        scale: 1,
        thres: 1,
        link_opacity: 0.6,
        link_color: true,
        displayHull: true,
        selected: "",
        selectedPC: "",
      },
        thres_max: 1,
        cdfData: [],
        cdfProps: {
            width:  190,
            height: 150,
            ml: 30,
            mr: 15,
            mt: 5, 
            mb: 20,
        },
      }
  },
  watch: {
    networkProps: {
      handler(val){
        this.$emit('updated', this.networkProps);
        let gy = this.cdfData.find(v => v.x >= this.networkProps.thres).y;
        d3.select(this.$refs.svgcdffield).select(".thresholdLine")
          .datum([{x:this.networkProps.thres, y:0}, {x:this.networkProps.thres, y:gy}]).attr("d", this.cdfProps["line"]);
        d3.select(this.$refs.svgcdffield).select(".thresholdLineY")
          .datum([{x:0, y: gy}, {x:this.networkProps.thres, y: gy}]).attr("d", this.cdfProps["line"]);
        console.log(val);
      },
      deep: true
    },
    selection: {
      handler(val){
        this.networkProps.selected = val.selected;
        this.networkProps.selectedPC = val.selectedPC;
        console.log(val);
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
            this.networkProps.thres = thres;
          }))
      

      let data = this.cdfData;

      // scale the x and y axis according the the max and min values, could also keep 
      // track of min and max values in loop above. The .nice() will round the min and max values to
      // nice values
      x.domain(d3.extent(data, function(d) { return d.x; })).nice();
      y.domain(d3.extent(data, function(d) { return d.y; })).nice();
      
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

      let gy = this.cdfData.find(v => v.x >= this.networkProps.thres).y;
      svg.append("path").datum([{x:this.networkProps.thres, y:0}, {x:this.networkProps.thres, y:gy}])
        .attr("class", "thresholdLine")
        .attr("d", line)
        .style("stroke", function() { return "#AAAAAA"; })
        .style("fill", "transparent");

      svg.append("path").datum([{x:0, y: gy}, {x:this.networkProps.thres, y: gy}])
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
    this.networkProps.thres = this.thres_max / 4 * 3;
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
  },
};
</script>
