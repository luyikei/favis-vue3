<template>
  <svg ref="svg" width="100%" height="100%" :viewBox="svgViewBox">
    <g ref="svgfield" :transform="svgGOffeset">
      <g class="hulls" ref="hulls"></g>
      <g class="links" ref="links"></g>
      <g class="nodes" ref="nodes"></g>
    </g>
  </svg>
  <div ref="legend" class="legenddiv pa-3"></div>
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

.legenddiv {
  position: absolute;
  width: 180px;
  top: 20px;
  left: 20px;
}

</style>

<script>
import * as d3 from "d3";
import {Legend, Swatches} from "@/objs/d3colorlegend.js"

export default {
  props: ["ds", "showControls", "networkProps", "commonProps"],
  emits: ['clicked', 'selectionChanged'],
  data() {
    return {
      width: 400,
      height: 400,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      x: 0,
      y: 0,
      scale: 1,
      link_color: false,
      link_opacity: 0.6,
      opacityisolated: 0.1,
      thres: 0.4,
      displayHull: true,
      selection: {
        selected: "",
        selectedPC: ""
      },
      color: d3.scaleOrdinal([
        "#f28e2c",
        "#76b7b2",
        "#59a14f",
        "#edc949",
        "#af7aa1",
        "#ff9da7",
        "#9c755f",
        "#bab0ab"
      ]),
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
                  this.selection.selectedPC = d["name"];
                  this.$emit('selectionChanged', this.selection);
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
    };
  },
  watch: {
    link_color: function () {
      this.updateGraph();
    },
    link_opacity: function () {
      this.updateGraph();
    },
    opacityisolated: function () {
      this.updateGraph();
    },
    thres: function () {
      this.updateGraph();
    },
    ds: function () {
      this.updateGraph();
    },
    networkProps:  {
      handler(networkProps){
        this.scale = networkProps.scale;
        this.opacityisolated = networkProps.opacityisolated;
        this.link_opacity = networkProps.link_opacity;
        this.link_color = networkProps.link_color;
        this.displayHull = networkProps.displayHull;
        this.selection.selected = networkProps.selected;
        this.selection.selectedPC = networkProps.selectedPC;
      },
      deep: true
    },
    commonProps: {
      handler(commonProps){
        this.thres = commonProps.thres;
        this.selection.selected = commonProps.selected;
        this.selection.selectedPC = commonProps.selectedPC;
      },
      deep: true
    }
  },
  computed: {
    svgViewBox() { return `${this.x + (this.svgWidth - this.svgWidth/this.scale) / 2},
    ${this.y + (this.svgWidth - this.svgWidth/this.scale) / 2}, 
    ${this.svgWidth/this.scale}, 
    ${this.svgHeight/this.scale}` },
    
    svgWidth() {
      return this.width + this.margin.left + this.margin.right;
    },
    svgHeight() {
      return this.height + this.margin.top + this.margin.bottom;
    },
    svgGOffeset() {
      return "translate(" + this.svgWidth / 2 + "," + this.svgHeight / 2 + ")";
    },
  },
  methods: {
    resizeHandler() {
    },
    networkPropsUpdated(networkProps) {
        this.scale = networkProps.scale;
        this.thres = networkProps.thres;
        this.link_opacity = networkProps.link_opacity;
        this.link_color = networkProps.link_color;
        this.displayHull = networkProps.displayHull;
        this.selection.selected = networkProps.selected;
        this.selection.selectedPC = networkProps.selectedPC;
    },
    updateGraph() {
      console.log("NETWORK: updateGraph");
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

      let groups = new Set();
      groups.add(0);
      let lnks = Array(this.ds.names.length).fill(0).map(() => Array(this.ds.names.length).fill(0));
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
                groups.add(i + 1);
            }
          }
        }
      }
    
      let domainlables = {};
      let domain = Array.from(groups);
      this.color.domain(domain);
      domainlables[0] = "Does not belong to any factor"
      for (let i = 1; i < domain.length; ++i) {
        domainlables[domain[i]] = this.ds.row_names[domain[i] - 1];
      }
      this.$refs.legend.innerHTML = "";
      this.$refs.legend.appendChild(
        Swatches(this.color, 
        {columns: "180px", domainlables: domainlables}));
        
      console.log(domainlables);
      console.log(groups);

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
        .attr("opacity", (d) => d.group == 0 ? this.opacityisolated : 1)
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
          this.$emit('clicked', {
            clickedVar: id,
            clickedPC: ""
          });
        })
        .on("mouseover", (_, d) => {
          this.selection.selected = d.id;
          this.$emit('selectionChanged', this.selection);
        })
        .call(drag(this.simulation))
        .append("title")
        .text(function (d) {
          return d.id;
        });
      node
        .attr("opacity", (d) => d.group == 0 ? this.opacityisolated : 1)
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
          this.selection.selectedPC = this.ds.row_names[d.group-1];
          this.$emit('selectionChanged', this.selection);
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
  },
  created() {
    window.addEventListener("resize", this.resizeHandler);
  },
  destroyed() {
    window.addEventListener("resize", this.resizeHandler);
  },
  mounted() {
    // this.updateGraph(); Through updated in CommonControls
  },
};
</script>
