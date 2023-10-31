<template>
  <svg ref="svg" width="100%" height="100%">
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
import { faviscolorscheme, faviscolorscale, Swatches } from "@/objs/d3colorlegend.js"
import { Tooltip } from '@/objs/d3tooltip.js';

import { useCommonProps } from '@/objs/commonProps.js'

export default {
  props: ["ds", "networkProps", "commonProps"],
  data() {
    const { selection, clicked, hover, dropIndices, varCond, factorCond, MEvent, MEventSource } = useCommonProps();
    return {
      width: 0,
      height: 0,
      margin: { top: 20, right: 20, bottom: 20, left: 20 },
      x: 0,
      y: 0,
      scale: 1,
      link_color: "Factor",
      node_color: "Factor with Biggest Loading",
      link_opacity: 0.6,
      opacityisolated: 0.1,
      thres: 0.4,
      displayHull: true,
      selection,
      clicked,
      hover,
      dropIndices,
      varCond,
      factorCond,
      MEvent,
      MEventSource,
      attractiveForce: 10,
      repulsiveForce: 30,
      color: d3.scaleOrdinal(faviscolorscheme),
      cScale: faviscolorscale,

      tooltip: null,
    };
  },
  watch: {
    node_color: function () {
      this.updateGraph();
    },
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
      if (!this.origStrength) this.origStrength = forceLink.strength();
      forceLink.strength((link) => this.attractiveForce / 10 * this.origStrength(link));
      this.simulation.alpha(1).restart();
    },
    repulsiveForce: function () {
      this.simulation.stop();
      let forceNode = this.simulation.force("charge");
      forceNode.strength(-this.repulsiveForce);
      this.simulation.alpha(1).restart();
    },
    clicked: {
      handler(clicked) {
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
    dropIndices: {
      handler(hover) {
        this.updateGraph();
      },
      deep: true
    },
    networkProps: {
      handler(networkProps) {
        this.scale = networkProps.scale;
        this.opacityisolated = networkProps.opacityisolated;
        this.link_opacity = networkProps.link_opacity;
        this.node_color = networkProps.node_color;
        this.link_color = networkProps.link_color;
        this.displayHull = networkProps.displayHull;
        this.attractiveForce = networkProps.attractiveForce;
        this.repulsiveForce = networkProps.repulsiveForce;
      },
      deep: true
    },
    commonProps: {
      handler(commonProps) {
        this.thres = commonProps.thres;
      },
      deep: true
    }
  },
  computed: {
    svgViewBox() {
      return `${this.x + (this.svgWidth - this.svgWidth / this.scale) / 2},
      ${this.y + (this.svgWidth - this.svgWidth / this.scale) / 2}, 
      ${this.svgWidth / this.scale}, 
      ${this.svgHeight / this.scale}`
    },
    svgWidth() {
      return this.width;
    },
    svgHeight() {
      return this.height;
    },
    svgGOffeset() {
      return `scale(${this.scale}) translate(${-this.x + this.width / 2 / this.scale},${-this.y + this.height / 2 / this.scale})`;
    },
  },
  methods: {
    networkPropsUpdated(networkProps) {
      this.scale = networkProps.scale;
      this.thres = networkProps.thres;
      this.link_opacity = networkProps.link_opacity;
      this.link_color = networkProps.link_color;
      this.displayHull = networkProps.displayHull;
    },
    updateGraph() {
      console.log("NETWORK: updateGraph");
      this.simulation.stop();
      let graph = {};
      graph["nodes"] = [];
      graph["links"] = [];
      graph.nodedict = {};
      this.ds.names.forEach((element, i) => {
        if (!this.dropIndices.var.length || this.dropIndices.var.indexOf(i) == -1) {
          graph.nodedict[i] = graph.nodes.length;
          graph["nodes"].push({
            i: i,
            id: element,
            groups: new Set(),
            group: 0,
            loading: 0,
          });
        }
      });

      let groups = new Set();
      groups.add(0);
      let lnks = Array(graph.nodes.length).fill(0).map(() => Array(graph.nodes.length).fill(0));
      let glinkind = Array(graph.nodes.length).fill(0).map(() => Array(graph.nodes.length).fill(0));
      for (let i = 0; i < this.ds.matrix.length; i++) {
        for (let j = 0; j < graph.nodes.length - 1; j++) {
          const element1 = Math.abs(this.ds.matrix[i][graph.nodes[j].i].z);
          if (element1 < this.thres) continue;
          for (let k = j + 1; k < graph.nodes.length; k++) {
            const element2 = Math.abs(this.ds.matrix[i][graph.nodes[k].i].z);
            if (
              element2 >= this.thres
            ) {
              if (lnks[k][j] == 0) {
                glinkind[j][k] = graph.links.length;
                glinkind[k][j] = graph.links.length;
                graph.links.push({
                  source: graph.nodes[j].id,
                  target: graph.nodes[k].id,
                  value: (element1 + element2) / 2,
                  group: i + 1
                });
              } else {
                if (graph.nodes[j].loading + graph.nodes[k].loading < element1 + element2) {
                  graph.links[glinkind[j][k]].value = (element1 + element2) / 2;
                  graph.links[glinkind[j][k]].group = i + 1;
                }
              }
              lnks[j][k] = i + 1;
              lnks[k][j] = i + 1;
              graph.nodes[j].groups.add(i + 1);
              graph.nodes[k].groups.add(i + 1);
              if (graph.nodes[j].loading < element1) {
                graph.nodes[j].loading = element1;
                graph.nodes[j].group = i + 1;
              }
              if (graph.nodes[k].loading < element2) {
                graph.nodes[k].loading = element2;
                graph.nodes[k].group = i + 1;
              }
              groups.add(i + 1);
            }
          }
        }
      }

      if (this.node_color == "Factor with Biggest Loading") {
        let domainlables = {};
        let domain = Array.from(groups);
        this.color = d3.scaleOrdinal(faviscolorscheme);
        this.color.domain(domain);
        domainlables[0] = "N/A";
        for (let i = 1; i < domain.length; ++i) {
          domainlables[domain[i]] = this.ds.row_names[domain[i] - 1];
        }
        this.$refs.legend.innerHTML = "";
        this.$refs.legend.appendChild(
          Swatches(this.color, { columns: "180px", domainlables: domainlables }));
      } else {
        let ngroup = 0;
        graph.nodes.forEach((element, i) => {
          element.ngroup = element.groups.size;
          ngroup = Math.max(ngroup, element.ngroup);
        });
        let domainlables = {};
        let domain = d3.range(ngroup + 1);
        this.color = d3.scaleOrdinal(faviscolorscheme);
        this.color.domain(domain);
        for (let i = 0; i < domain.length; ++i) {
          domainlables[domain[i]] = `${domain[i]}`;
        }
        if (domain[0] == 0)
          domainlables[0] = "N/A"
        this.$refs.legend.innerHTML = "";
        this.$refs.legend.appendChild(
          Swatches(this.color, { columns: "180px", domainlables: domainlables }));
      }

      let links = d3.select(this.$refs.links);
      let nodes = d3.select(this.$refs.nodes);
      let svg = d3.select(this.$refs.svg);

      svg
        .on("click", () => {
          const clicked = {
            source: this.MEventSource.Network,
            var: undefined,
            factor: undefined
          };
          this.$store.commit("updateClicked", clicked);
          this.$store.commit("updateHover", {
            source: this.MEventSource.Network,
            var: undefined,
            factor: undefined
          });
        })
        .attr("pointer-events", "all").call(d3
          .drag()
          .on("start", () => {
            svg.style("cursor", "grabbing");
          })
          .on("drag", (event) => {
            this.x -= event.dx / this.scale;
            this.y -= event.dy / this.scale;
          })
          .on("end", function () {
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
      const nodestyle = node => {
        node
          .attr("r", d => this.varCond(d.i) == this.MEvent.Clicked ? 7 : 5)
          .attr("stroke", (d) => {
            const cond = this.varCond(d.i);
            if (typeof this.clicked.var == "number")
              return (cond == this.MEvent.Clicked || lnks[graph.nodedict[this.clicked.var]][graph.nodedict[d.i]]) ? "black" : "transparent";
            return (cond == this.MEvent.Selected || cond == this.MEvent.Hovered) ? "black" : "transparent";
          })
          .attr("stroke-opacity", 1)
          .attr("opacity", (d) => {
            const cond = this.varCond(d.i);
            if (typeof this.clicked.var == "number" && (cond == this.MEvent.Clicked || lnks[graph.nodedict[this.clicked.var]][graph.nodedict[d.i]])) return 1;
            if (cond == this.MEvent.Selected || cond == this.MEvent.Hovered) return 1;
            if (d.group == 0) return this.opacityisolated;
            if (typeof this.clicked.var == "number") return 0.5;
            return 1;
          })
          .attr("fill", (d) => this.node_color == "Factor with Biggest Loading" ? this.color(d.group) : this.color(d.ngroup));
        return node;
      };

      node
        .enter()
        .append("circle")
        .call(nodestyle)
        .on("click", (e, d) => {
          const clicked = {
            source: this.MEventSource.Network,
            var: d.i,
            factor: null,
            sort: null
          };
          this.$store.commit("updateClicked", clicked);
          e.stopPropagation();
        })
        .on("mouseover", (event, d) => {
          this.$store.commit("updateHover", {
            source: this.MEventSource.Network,
            var: d.i,
            factor: undefined
          });
          this.tooltip.mouseover(event);
        })
        .on("mousemove", (event, d) => {
          this.tooltip.mousemove(event, {
            source: this.MEventSource.Network,
            var: d.id,
            factor: Array.from(d.groups).map(x => this.ds.row_names[x - 1]).join(', '),
            codebook: this.ds.codebook ? this.ds.codebook[d.id] : null
          })
        })
        .on("mouseleave", (event, d) => {
          this.$store.commit("updateHover", {
            source: this.MEventSource.Network,
            var: undefined,
            factor: undefined
          });
          this.tooltip.mouseleave(event);
        })
        .call(drag(this.simulation));
      node
        .call(nodestyle)
        .call(drag(this.simulation));
      node.exit().remove();

      let linkstyle = link => {
        link
          .attr("stroke", this.link_color == "Factor" ? d => this.color(d.group) : (this.link_color == "Mean of Two Factor Loadings" ? d => this.cScale(d.value) : "#999"))
          .attr("stroke-opacity", d => {
            if (this.clicked.var && d.source != this.ds.names[this.clicked.var] && d.target != this.ds.names[this.clicked.var])
              return Math.min(0.1, this.link_opacity);
            if (this.clicked.var)
              return 1
            return this.link_opacity;
          })
          .attr("stroke-width", (d) => {
            //console.log(d.value);
            return 1;
          });
        return link;
      };

      let link = links.selectAll("line").data(graph.links);
      link
        .enter()
        .append("line")
        .call(linkstyle)
        .on("click", (e, d) => {
          const clicked = {
            source: this.MEventSource.Network,
            var: null,
            factor: d.group - 1,
            sort: null
          };
          this.$store.commit("updateClicked", clicked);
          e.stopPropagation();
        })
        .on("mouseover", (event, d) => {
          this.$store.commit("updateHover", {
            source: this.MEventSource.Network,
            var: undefined,
            factor: d.group - 1
          });
          this.tooltip.mouseover(event);
        })
        .on("mousemove", (event, d) => this.tooltip.mousemove(event, {
          source: this.MEventSource.Network,
          var: `${d.source.id} ${d.target.id}`,
          factor: this.ds.row_names[d.group - 1]
        }))
        .on("mouseleave", (event, d) => {
          this.$store.commit("updateHover", {
            source: this.MEventSource.Network,
            var: undefined,
            factor: undefined
          });
          this.tooltip.mouseleave(event);
        });
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
    resizeHandler(event) {
      this.height = this.$refs.svg.clientHeight;
      this.width = this.$refs.svg.clientWidth;
    },
  },
  created() {
    window.addEventListener('resize', this.resizeHandler);
  },
  destroyed() {
    window.removeEventListener('resize', this.resizeHandler);
  },
  mounted() {
    this.simulation = d3
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
            .attr("d", function (d) {
              if (d.length) {
                return "M" + d.join("L") + "Z";
              } else {
                return null;
              }
            })
            .attr("fill", (d, i) => this.color(d["factor"]))
            .attr("stroke", (d, i) => this.color(d["factor"]))
            .attr("stroke-width", "2px")
            .attr("stroke-linejoin", "round")
            .attr("stroke-opacity", 0.3)
            .attr("opacity", 0.3)
            .on("click", (e, d) => {
              const clicked = {
                source: this.MEventSource.Network,
                var: null,
                factor: d["factor"] - 1,
                sort: null
              };
              this.$store.commit("updateClicked", clicked);
              e.stopPropagation();
            })
            .on("mouseover", (event, d) => {
              this.$store.commit("updateHover", {
                source: this.MEventSource.Network,
                var: undefined,
                factor: d["factor"] - 1
              });
              this.tooltip.mouseover(event);
              event.stopPropagation();
            })
            .on("mousemove", (event, d) => {
              this.tooltip.mousemove(event, {
                source: this.MEventSource.Network,
                var: "",
                factor: d["name"]
              })
            })
            .on("mouseleave", (event, d) => {
              this.$store.commit("updateHover", {
                source: this.MEventSource.Network,
                var: undefined,
                factor: undefined
              });
              this.tooltip.mouseleave(event)
            })
            ;
          hulls
            .attr("d", function (d) {
              if (d.length) {
                return "M" + d.join("L") + "Z";
              } else {
                return null;
              }
            })
            .attr("fill", (d, i) => this.color(d["factor"]))
            .attr("stroke", (d, i) => this.color(d["factor"]));
          hulls.exit().remove();
        } else {
          let hulls = hull.selectAll("path").data([]);
          hulls.exit().remove();
        }
      });
    this.tooltip = new Tooltip(this.$refs.tooltip);
    // this.updateGraph(); Through updated in CommonControls
    this.resizeObserver = new ResizeObserver(this.resizeHandler);
    this.resizeObserver.observe(this.$refs.svg);
    this.resizeHandler();
  },
};
</script>
