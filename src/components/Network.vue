<template>
  <v-container fluid>
  <v-row no-gutters>
    <v-col md="9" ref="svgParent"  class="text-xs-center">
      <svg ref="svg" :width="svgWidth" :height="svgHeight" :viewBox="svgViewBox">
        <g ref="svgfield" :transform="svgGOffeset">
          <g class="hulls" ref="hulls">
          </g>
          <g class="links" ref="links"></g>
          <g class="nodes" ref="nodes"></g>
        </g>
      </svg>
    </v-col>
    <v-col md="3">
  <v-card
    class="mx-auto stick" v-if="showControls"
  >
    <v-card-title>Network</v-card-title>
    <v-card-text fluid>
    <v-row no-gutters>
    <v-col md="3" class="mr-3 text-right" >
      <div class="font-weight-regular">
        Variable: 
      </div>
    </v-col>
    <v-col md="7">
      <div class="font-weight-medium">
        {{ selected }}
      </div>
    </v-col>
    </v-row>
    <v-row no-gutters>
    <v-col md="3" class="mr-3 text-right">
      <div class="font-weight-regular">
        Factor:
      </div>
    </v-col>
    <v-col md="7">
      <div class="font-weight-medium">
        {{ selectedPC }}
      </div>
    </v-col>
    </v-row>
    </v-card-text>
    <v-divider class="mx-4"></v-divider>
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
        <v-slider
          v-model.number="thres"
          label="Threshold"
          min="0"
          max="1"
          step="0.01"
          :thumb-size="24"
          thumb-label="always"
          >
        </v-slider>
        <svg ref="svgcdf" :width="`${cdfProps.width + cdfProps.mx}`" :height="`${cdfProps.height + 2 * cdfProps.my}`" class="mb-4">
          <g ref="svgcdffield" :transform="`translate(${cdfProps.mx}, ${cdfProps.my})`" >
          </g>
        </svg>
        <v-slider
          v-model.number="link_opacity"
          label="Link Opacity"
          min="0.0"
          max="1.0"
          step="0.1"
          :thumb-size="24"
          thumb-label="always"
          >
        </v-slider>
        <v-checkbox
          v-model="link_color"
          label="Use Factor Color for Link"
        ></v-checkbox>
        <v-checkbox
          v-model="displayHull"
          label="Disply Convex Hull"
        ></v-checkbox>
    <span>Width:</span>
    <input v-model.number="width" @change="updateGraph" style="width: 50px;" >
    <span>Height:</span>
    <input v-model.number="height" @change="updateGraph" style="width: 50px;" >
    </v-card-text>
  </v-card>
    </v-col>
  </v-row> 
  </v-container>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.stick {
  position: sticky;
  top: 10px;
}
.links line {
  stroke: #999;
  stroke-opacity: 0.6;
}

.nodes circle {
  stroke: #fff;
  stroke-width: 1.5px;
  stroke-opacity: 1;
}
</style>

<script>
import * as d3 from "d3";

export default {
  props: ["ds", "showControls", "networkProps"],
  data() {
    return {
      height: 800,
      width: 800,
      x: 0,
      y: 0,
      scale: 1,
      link_color: false,
      displayHull: true,
      selected: "",
      selectedPC: "",
      cdfData: [],
      cdfProps: {
        width:  250,
        height: 180,
        mx: 30,
        my: 20,
      },
      color: d3.scaleOrdinal(d3.schemeTableau10),
      simulation: d3
        .forceSimulation()
        .force(
          "link",
          d3.forceLink().id(function (d) {
            return d.id;
          })
        )
        .force("charge", d3.forceManyBody())
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .on("tick", () => {
          let links = d3.select(this.$refs.links);
          let nodes = d3.select(this.$refs.nodes);
          let hull = d3.select(this.$refs.hulls);
          links
            .selectAll("line")
            .attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);
          nodes
            .selectAll("circle")
            .attr("cx", (d) => d.x)
            .attr("cy", (d) => d.y);
            if (this.displayHull) {
              let dat = nodes.selectAll("circle").data();
              let maxg = Math.max(...dat.map(v => v.group));
              let points =  Array.from({length: maxg + 1}, () => []);
              for (let i = 0; i < dat.length; i++) {
                const point = dat[i];
                point.groups.forEach(num => {
                  points[num].push([point.x, point.y]);
                });
              }
              let pol = points.map(v => d3.polygonHull(v));
              pol = pol.map( v => v ? {data: v} : {data: []});
              for (let i = 0; i < pol.length; i++) {
                pol[i]["name"] = (i ? this.ds.row_names[i - 1] : "None");
              }
              let hulls = hull.selectAll("path").data(pol);
              hulls
                .enter()
                .append("path")
                .attr("d", function(d) {
                  if (d.data.length) {
                    return "M" + d.data.join("L") + "Z"; 
                  } else {
                    return null;
                  }})
                .attr("fill", (d,i) => this.color(i))
                .attr("stroke", (d,i) => this.color(i))
                .attr("stroke-width", "2px")
                .attr("stroke-linejoin", "round")
                .attr("stroke-opacity", 0.3)
                .attr("opacity", 0.3)
                .on("mouseover", (_, d) => {
                  this.selectedPC = d["name"];
                  this.$emit('selectionChanged', {
                    "selected": this.selected,
                    "selectedPC": this.selectedPC,
                  });
                })
                ;
              hulls
                .attr("d", function(d) {
                  if (d.data.length) {
                    return "M" + d.data.join("L") + "Z"; 
                  } else {
                    return null;
                  }});
              hulls.exit().remove();
          } else {
              let hulls = hull.selectAll("path").data([]);
              hulls.exit().remove();
          }
        }),
      link_opacity: 0.6,
      thres: 0.4,
      margin: { top: 20, right: 20, bottom: 40, left: 40 },
    };
  },
  watch: {
    link_color: function () {
      this.updateGraph();
    },
    link_opacity: function () {
      this.updateGraph();
    },
    thres: function () {
      this.updateGraph();
      let gy = this.cdfData.find(v => v.x >= this.thres).y;
      d3.select(this.$refs.svgcdffield).select(".thresholdLine")
        .datum([{x:this.thres, y:0}, {x:this.thres, y:gy}]).attr("d", this.cdfProps["line"]);
      d3.select(this.$refs.svgcdffield).select(".thresholdLineY")
        .datum([{x:0, y: gy}, {x:this.thres, y: gy}]).attr("d", this.cdfProps["line"]);
    },
    ds: function () {
      this.updateGraph();
    },
    width: function () {
      this.updateGraph();
    },
    height: function () {
      this.updateGraph();
    },
    networkProps:  {
      handler(val){
        this.scale = val.scale;
        this.thres = val.thres;
        this.link_opacity = val.link_opacity;
        this.link_color = val.link_color;
        this.displayHull = val.displayHull;
        this.selected = val.selected;
        this.selectedPC = val.selectedPC;
      },
      deep: true
    }
  },
  computed: {
    svgViewBox() { return `${this.x + (this.svgWidth - this.svgWidth/this.scale) / 2}, ${this.y + (this.svgWidth - this.svgWidth/this.scale) / 2}, ${this.svgWidth/this.scale}, ${this.svgHeight/this.scale}` },
    
    svgWidth() {
      return this.width + this.margin.left + this.margin.right;
    },
    svgHeight() {
      return this.height + this.margin.top + this.margin.right;
    },
    svgGOffeset() {
      return "translate(" + this.svgWidth / 2 + "," + this.svgHeight / 2 + ")";
    },
  },
  methods: {
    resizeHandler() {
      console.log("resized");
    },
    updateGraph() {
      this.simulation.stop();
      let graph = {};
      graph["nodes"] = [];
      graph["links"] = [];
      this.ds.names.forEach((element) => {
        graph["nodes"].push({
          id: element,
          groups: new Set(),
          group: 0,
        });
      });

      let lnks = Array(this.ds.names.length)
        .fill(0)
              .map(() => Array(this.ds.names.length).fill(0));
            for (let i = 0; i < this.ds.matrix.length; i++) {
              for (let j = 0; j < this.ds.matrix[i].length - 1; j++) {
                const element1 = this.ds.matrix[i][j].z;
                if (Math.abs(element1) <= this.thres) continue;
                for (let k = j + 1; k < this.ds.matrix[i].length; k++) {
                  const element2 = this.ds.matrix[i][k].z;
                  if (
                    !lnks[j][k]  &&
              Math.abs(element2) > this.thres
            ) {
              lnks[j][k] = i + 1;
              graph["nodes"][j]["group"] = i + 1;
              graph["nodes"][k]["group"] = i + 1;
              graph["nodes"][j]["groups"].add(i + 1);
              graph["nodes"][k]["groups"].add(i + 1);
              graph["links"].push({
                source: this.ds.names[j],
                target: this.ds.names[k],
                value: 1,
                group: i + 1
              });
            }
          }
        }
      }

      let links = d3.select(this.$refs.links);
      let nodes = d3.select(this.$refs.nodes);
      let svg = d3.select(this.$refs.svg);
      
      svg
          .attr("pointer-events", "all").call(d3
          .drag()
          .on("start", () => {
            svg.style("cursor", "grabbing");
          })
          .on("drag", (event) => {
            this.x -= event.dx/this.scale;
            this.y -= event.dy/this.scale;
          })
          .on("end", function() {
            svg.style("cursor", null);
          }));

      const old = new Map(
        nodes
          .selectAll("circle")
          .data()
          .map((d) => [d.id, d])
      );
      graph.nodes = graph.nodes.map((d) =>
        Object.assign(old.get(d.id) || {}, d)
      );
      graph.links = graph.links.map((d) => Object.assign({}, d));

      let node = nodes.selectAll("circle").data(graph.nodes, (d) => d.id);
      node
        .enter()
        .append("circle")
        .attr("r", 5)
        .attr("fill",  (d) => {
          return this.color(d.group);
        })
        .on("click", (e, d) => {
          let id = d.id;
          nodes.selectAll("circle").attr("stroke", "transparent");
          d3.select(e.target)
            .attr("stroke", "#000")
            .attr("stroke-opacity", this.link_opacity);
          links
            .selectAll("line")
            .attr("stroke", this.link_color ? d => this.color(d.group) : "#999")
            .each(function (d) {
              if (d.source.id === id || d.target.id === id) {
                d3.select(this)
                  .attr("stroke", "#000")
                  .attr("stroke-opacity", 1);
              }
            });
        })
        .on("mouseover", (_, d) => {
          this.selected = d.id;
          this.$emit('selectionChanged', {
            "selected": this.selected,
            "selectedPC": this.selectedPC,
          });
        })
        .call(drag(this.simulation))
        .append("title")
        .text(function (d) {
          return d.id;
        });
      node
        .attr("fill", (d) => {
          return this.color(d.group);
        })
        .call(drag(this.simulation));
      node.exit().remove();

      let link = links.selectAll("line").data(graph.links);
      link
        .enter()
        .append("line")
        .attr("stroke", this.link_color ? d => this.color(d.group) : "#999")
        .attr("stroke-opacity", this.link_opacity)
        .attr("stroke-width", function (d) {
          return Math.sqrt(d.value);
        })
        .on("mouseover", (_, d) => {
          this.selectedPC = this.ds.row_names[d.group-1];
          this.$emit('selectionChanged', {
            "selected": this.selected,
            "selectedPC": this.selectedPC,
          });
        });
      link
        .attr("stroke", this.link_color ? d => this.color(d.group) : "#999")
        .attr("stroke-opacity", this.link_opacity)
        .attr("stroke-width", function (d) {
          return Math.sqrt(d.value);
        });
      link.exit().remove();

      this.simulation.nodes(graph.nodes);

      this.simulation.force("link").links(graph.links);
      this.simulation.alpha(1).restart();

      function drag(simulation) {
        function dragstarted(event) {
          if (!event.active) simulation.alphaTarget(0.3).restart();
          event.subject.fx = event.subject.x;
          event.subject.fy = event.subject.y;
        }

        function dragged(event) {
          event.subject.fx = event.x;
          event.subject.fy = event.y;
        }

        function dragended(event) {
          if (!event.active) simulation.alphaTarget(0);
          event.subject.fx = null;
          event.subject.fy = null;
        }

        return d3
          .drag()
          .on("start", dragstarted)
          .on("drag", dragged)
          .on("end", dragended);
      }
    },
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
            let thres = x.invert(event.x - this.cdfProps.mx);
            this.thres = thres;
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

      let gy = this.cdfData.find(v => v.x >= this.thres).y;
      svg.append("path").datum([{x:this.thres, y:0}, {x:this.thres, y:gy}])
        .attr("class", "thresholdLine")
        .attr("d", line)
        .style("stroke", function() { return "#AAAAAA"; })
        .style("fill", "transparent");

      svg.append("path").datum([{x:0, y: gy}, {x:this.thres, y: gy}])
        .attr("class", "thresholdLineY")
        .attr("d", line)
        .style("stroke", function() { return "#AAAAAA"; })
        .style("fill", "transparent");
      }
  },
  created() {
    window.addEventListener("resize", this.resizeHandler);
  },
  destroyed() {
    window.addEventListener("resize", this.resizeHandler);
  },
  mounted() {
    let cdfTemp = [];
    for (let i = 0; i < this.ds.matrix.length; i++) {
      for (let j = 0; j < this.ds.matrix[i].length; j++) {
        cdfTemp.push(Math.abs(this.ds.matrix[i][j].z));
      }
    }
    cdfTemp.sort();
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
    this.updateGraph();
    this.updateCDFGraph();
  },
};
</script>
