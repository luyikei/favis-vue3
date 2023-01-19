<template>
  <svg ref="svg" width="100%" height="100%" :viewBox="svgViewBox">
    <g ref="svgfield" :transform="svgGOffeset">
      <g class="hulls" ref="hulls"></g>
      <g class="links" ref="links"></g>
      <g class="nodes" ref="nodes"></g>
    </g>
  </svg>
  <div ref="legend" class="legenddiv pa-3"></div>
  <div ref="tooltip"></div>
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
import {faviscolorscheme, faviscolorscale, Swatches} from "@/objs/d3colorlegend.js"
import {Tooltip} from '@/objs/d3tooltip.js';

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
      clicked: {
        clickedVarI: -1,
        clickedVar: "",
        clickedPC: ""
      },
      attractiveForce: 10,
      repulsiveForce: 30,
      color: d3.scaleOrdinal(faviscolorscheme),
      cScale: faviscolorscale,

      tooltip: null,

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
            let domain = this.color.domain();
            let points = {};
            domain.forEach((num) => points[num] = []);
            for (let i = 0; i < dat.length; i++) {
              const point = dat[i];
              point.groups.forEach(num => {
                points[num].push([point.x, point.y]);
              });
            }
            points = Object.values(points);
            let pol = points.map(v => d3.polygonHull(v));
            for (let i = 0; i < pol.length; i++) {
              if (pol[i]) {
                pol[i]["factor"] = domain[i];
                pol[i]["name"] = (domain[i] ? this.ds.row_names[domain[i] - 1] : "None");
              }
            }
            pol = pol.filter(v => v && v.length > 2);
            let hulls = hull.selectAll("path").data(pol);
            hulls
              .enter()
              .append("path")
              .attr("d", function(d) {
                if (d.length) {
                  return "M" + d.join("L") + "Z"; 
                } else {
                  return null;
                }})
              .attr("fill", (d,i) => this.color(d["factor"]))
              .attr("stroke", (d,i) => this.color(d["factor"]))
              .attr("stroke-width", "2px")
              .attr("stroke-linejoin", "round")
              .attr("stroke-opacity", 0.3)
              .attr("opacity", 0.3)
              .on("mouseover", (event, d) => {
                this.selection.selectedPC = d["name"];
                this.$emit('selectionChanged', this.selection);
                this.tooltip.mouseover(event)
              })
              .on("mousemove", (event, d) =>{
                this.tooltip.mousemove(event, {
                  variable: "",
                  factor: d["name"]})
                })
              .on("mouseleave", (event) => this.tooltip.mouseleave(event))
              ;
            hulls
              .attr("d", function(d) {
                if (d.length) {
                  return "M" + d.join("L") + "Z"; 
                } else {
                  return null;
                }})
              .attr("fill", (d,i) => this.color(d["factor"]))
              .attr("stroke", (d,i) => this.color(d["factor"]));
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
    attractiveForce: function () {
      this.simulation.stop();
      let forceLink = this.simulation.force("link");
      if(!this.origStrength) this.origStrength = forceLink.strength();
      forceLink.strength((link) => this.attractiveForce / 10 * this.origStrength(link));
      this.simulation.alpha(1).restart();
    },
    repulsiveForce: function () {
      this.simulation.stop();
      let forceNode = this.simulation.force("charge");
      forceNode.strength(-this.repulsiveForce);
      this.simulation.alpha(1).restart();
    },
    clicked:  {
      handler(clicked){
        this.updateGraph();
      },
      deep: true
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
        this.attractiveForce = networkProps.attractiveForce;
        this.repulsiveForce = networkProps.repulsiveForce;
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
    svgViewBox() {
      return `${this.x + (this.svgWidth - this.svgWidth/this.scale) / 2},
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
      this.ds.names.forEach((element, i) => {
        graph["nodes"].push({
          i: i,
          id: element,
          linked: new Set(),
          groups: new Set(),
          group: 0,
          loading: 0,
        });
      });

      let groups = new Set();
      groups.add(0);
      let lnks = Array(this.ds.names.length).fill(0).map(() => Array(this.ds.names.length).fill(0));
      for (let i = 0; i < this.ds.matrix.length; i++) {
        for (let j = 0; j < this.ds.matrix[i].length - 1; j++) {
          const element1 = Math.abs(this.ds.matrix[i][j].z);
          if (element1 <= this.thres) continue;
          for (let k = j + 1; k < this.ds.matrix[i].length; k++) {
            const element2 = Math.abs(this.ds.matrix[i][k].z);
            if (
              !lnks[j][k]  &&
              element2 > this.thres
              ) {
                lnks[j][k] = i + 1;
                lnks[k][j] = i + 1;
                graph.nodes[j].groups.add(i + 1);
                graph.nodes[j].linked.add(this.ds.names[k]);
                graph.nodes[k].groups.add(i + 1);
                graph.nodes[k].linked.add(this.ds.names[j]);
                if (graph.nodes[j].loading < element1) {
                  graph.nodes[j].loading = element1;
                  graph.nodes[j].group = i + 1;
                }
                if (graph.nodes[k].loading < element2) {
                  graph.nodes[k].loading = element2;
                  graph.nodes[k].group = i + 1;
                }
                graph.links.push({
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
        Swatches(this.color, {columns: "180px", domainlables: domainlables}));

      let links = d3.select(this.$refs.links);
      let nodes = d3.select(this.$refs.nodes);
      let svg = d3.select(this.$refs.svg);

      svg
        .on("click", () => this.clicked = {})
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
      let nodestyle = node => {
        node
          .attr("r", d => this.clicked.clickedVar && this.clicked.clickedVar == d.id ? 7 : 5)
          .attr("stroke", (d) => {
            return this.clicked.clickedVar && (this.clicked.clickedVar == d.id || lnks[this.clicked.clickedVarI][d.i]) ? "black" : "transparent";
          })
          .attr("stroke-opacity", 1)
          .attr("opacity", (d) => {
            if (this.clicked.clickedVar && (this.clicked.clickedVar == d.id || lnks[this.clicked.clickedVarI][d.i])) return 1;
            if (d.group == 0) return this.opacityisolated;
            if (this.clicked.clickedVar) return 0.5;
            return 1;
          })
          .attr("fill",  (d) =>  this.color(d.group) );
        return node;
      };
      
      node
        .enter()
        .append("circle")
        .call(nodestyle)
        .on("click", (e, d) => {
          this.clicked = {
            clickedVarI: d.i,
            clickedVar: d.id,
            clickedPC: ""
          };
          this.$emit('clicked', this.clicked);
          e.stopPropagation();
        })
        .on("mouseover", (event, d) => {
          this.selection.selected = d.id;
          this.$emit('selectionChanged', this.selection);
          this.tooltip.mouseover(event)
        })
        .on("mousemove", (event, d) =>{
          this.tooltip.mousemove(event, {
            variable: d.id,
            factor: Array.from(d.groups).map(x=>this.ds.row_names[x-1]).join(', '),
            codebook: this.ds.codebook[d.id]
          })
        })
        .on("mouseleave", (event) => this.tooltip.mouseleave(event))
        .call(drag(this.simulation));
      node
        .call(nodestyle)
        .call(drag(this.simulation));
      node.exit().remove();

      let linkstyle = link => {
        link
          .attr("stroke", this.link_color ? d => this.color(d.group) : "#999")
          .attr("stroke-opacity", d => {
            if (this.clicked.clickedVar && d.source != this.clicked.clickedVar && d.target != this.clicked.clickedVar)
              return Math.min(0.1, this.link_opacity);
            if (this.clicked.clickedVar)
              return 1
            return this.link_opacity;
          })
          .attr("stroke-width", (d) => Math.sqrt(d.value));
        return link;
      };

      let link = links.selectAll("line").data(graph.links);
      link
        .enter()
        .append("line")
        .call(linkstyle)
        .on("mouseover", (event, d) => {
          this.selection.selectedPC = this.ds.row_names[d.group-1];
          this.$emit('selectionChanged', this.selection);
          this.tooltip.mouseover(event);
        })
        .on("mousemove", (event, d) => this.tooltip.mousemove(event, {
            variable: `${d.source.id} ${d.target.id}`,
            factor: this.ds.row_names[d.group-1]
        }))
        .on("mouseleave", (event) => this.tooltip.mouseleave(event));
      link
        .call(linkstyle);
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
  mounted() {
    this.tooltip = new Tooltip(this.$refs.tooltip);
    // this.updateGraph(); Through updated in CommonControls
  },
};
</script>
