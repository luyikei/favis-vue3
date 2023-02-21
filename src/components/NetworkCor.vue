<template>
  <svg ref="svg" height="100%" width="100%">
    <g ref="svgfield" :transform="svgGOffeset">
    </g>
  </svg>
  <div ref="legend" class="legenddiv pa-3"></div>
  <div ref="tooltip"></div>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>

.legenddiv {
  position: absolute;
  /*top: calc((100vh - 65px) / 2 + 60px);*/
  top: 20px;
  left: 20px;
}
</style>

<script>
import * as d3 from "d3";
import {faviscolorscheme, faviscolorscale2, Legend} from "@/objs/d3colorlegend.js"
import {Tooltip} from '@/objs/d3tooltip.js';
import {NetworkD3,} from '@/objs/d3Network.js'
import { classicalElectronRadiusDependencies } from "mathjs";

export default {
  props: ["ds", "commonProps"],
  emits: ['clicked', 'selectionChanged'],
  data() {
    return {
      width: 0,
      height: 0,
      x:0,
      y:0,
      d3network: null,
      cScale: faviscolorscale2,
      clicked : {
        var: null,
        factor: null,
        sort: null,
      }
    };
  },
  computed: {
    svgViewBox() {
      return `${this.x - this.svgWidth/ 2},
      ${this.y - this.svgHeight / 2}, 
      ${this.svgWidth}, 
      ${this.svgHeight}`},
    svgWidth() {
      return 140;
    },
    svgHeight() {
      return 140;
    },
    svgGOffeset() {
      return `translate(${-this.x + this.width / 2},${-this.y + this.height / 2})`;
    },
  },
  methods: {
    resizeHandler(event) {
      this.height = this.$refs.svg.clientHeight;
      this.width = this.$refs.svg.clientWidth;
    }
  },
  watch: {
    commonProps: {
      handler(commonProps){
        this.clicked = {
          var: commonProps.clickedVar,
          factor: commonProps.clickedFactor,
          sort: commonProps.clickedSort
        };
        this.d3network.onClicked(this.clicked);
      },
      deep: true
    }
  },
  created() {
      window.addEventListener('resize', this.resizeHandler);
  },
  destroyed() {
      window.removeEventListener('resize', this.resizeHandler);
  },
  mounted() {
    d3.select(this.$refs.svg)
      .on('click', () => {
        this.clicked = {
          var: null,
          factor: null,
          sort: null
        };
        this.$emit('clicked', this.clicked);
      })
      .attr("pointer-events", "all").call(d3
      .drag()
      .on("start", () => {
        svg.style("cursor", "grabbing");
      })
      .on("drag", (event) => {
        console.log([this.x, this.y]);
        this.x -= event.dx;
        this.y -= event.dy;
      })
      .on("end", function() {
        svg.style("cursor", null);
      }));
    const svg = d3.select(this.$refs.svgfield);
    let graph = {};
    graph.nodes = [];
    this.ds.row_names.forEach((factor, i) =>{
      graph.nodes.push({id: i, group: i});
    });
    graph.links = [];
    for (let i = 0; i < this.ds.phi.length - 1; ++i) {
      for (let j = i + 1; j < this.ds.phi[i].length; ++j) {
        graph.links.push({
          source: i,
          target: j,
          value: this.ds.phi[i][j]
        });
      }
    }
    this.d3network = new NetworkD3(svg, graph, {
      nodeId: d => d.id,
      nodeGroup: d => d.group,
      nodeTitle: d => `${this.ds.row_names[d.group]}`,
      nodeStrokeWidth: 0,
      nodeClickedCb: (e, d, i) => {
        this.clicked = {
          var: null,
          factor: d.id,
          sort: null
        };
        this.$emit('clicked', this.clicked);
        e.stopPropagation();
      },
      linkStroke: d => this.cScale(d.value),
      linkStrokeWidth: l => Math.abs(l.value) * 30,
      linkStrength: d => {
        return Math.abs(this.ds.phi[d.source.id][d.target.id]);
      },
      colors: [
        "#76b7b2",
        "#59a14f",
        "#edc949",
        "#af7aa1",
        "#ff9da7",
        "#9c755f",
        "#bab0ab"
      ]
    });
    this.legend = new Legend(this.cScale, {
      width: 100,
      title: "Factor Correlation",
    });
    this.$refs.legend.appendChild(this.legend.node());
    this.tooltip = new Tooltip(this.$refs.tooltip);
    this.d3network.link
        .on("mouseover", (event, d) => {
          this.tooltip.mouseover(event);
        })
        .on("mousemove", (event, d) =>{
          this.tooltip.mousemove(event, {
            var: null,
            factor: `${this.ds.row_names[d.source.id]}, ${this.ds.row_names[d.target.id]}`,
            codebook: {"Correlation": this.ds.phi[d.source.id][d.target.id]}
          });
        })
        .on("mouseleave", (event) => this.tooltip.mouseleave(event));
    this.d3network.node
        .on("mouseover", (event, d) => {
          this.tooltip.mouseover(event);
        })
        .on("mousemove", (event, d) =>{
          this.tooltip.mousemove(event, {
            var: null,
            factor: this.ds.row_names[d.id],
            codebook: this.ds.codebook ? this.ds.codebook[d.id] : null
          });
        })
        .on("mouseleave", (event) => this.tooltip.mouseleave(event));
    this.resizeObserver = new ResizeObserver(this.resizeHandler);
    this.resizeObserver.observe(this.$refs.svg);
    this.resizeHandler();
  }
};
</script>
