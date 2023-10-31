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
import { faviscolorscheme, faviscolorscale2, Legend } from "@/objs/d3colorlegend.js"
import { Tooltip } from '@/objs/d3tooltip.js';
import { PathDiagramD3, } from '@/objs/d3PathDiagram.js'
import { classicalElectronRadiusDependencies } from "mathjs";

import { useCommonProps } from '@/objs/commonProps.js'

export default {
  props: ["ds", "commonProps"],
  emits: ['clicked', 'selectionChanged'],
  data() {
    const { clicked } = useCommonProps();
    return {
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      thres: 0.4,
      clicked: clicked
    };
  },
  computed: {
    svgViewBox() {
      return `${this.x - this.svgWidth / 2},
      ${this.y - this.svgHeight / 2}, 
      ${this.svgWidth}, 
      ${this.svgHeight}`
    },
    svgWidth() {
      return 140;
    },
    svgHeight() {
      return 140;
    },
    svgGOffeset() {
      //return `translate(${-this.x + this.width / 2},${-this.y + this.height / 2})`;
      return `translate(${-this.x},${-this.y})`;
    },
  },
  methods: {
    resizeHandler(event) {
      this.height = this.$refs.svg.clientHeight;
      this.width = this.$refs.svg.clientWidth;
    }
  },
  watch: {
    clicked: {
      handler(clicked) {
      },
      deep: true
    },
    commonProps: {
      handler(commonProps) {
        this.thres = commonProps.thres;
        this.pathDiagram.updateThreshold(this.thres);
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
        this.$store.commit("updateClicked", {
          var: null,
          factor: null,
          sort: null
        });
      })
      .attr("pointer-events", "all").call(d3
        .drag()
        .on("start", () => {
          svg.style("cursor", "grabbing");
        })
        .on("drag", (event) => {
          this.x -= event.dx;
          this.y -= event.dy;
        })
        .on("end", function () {
          svg.style("cursor", null);
        }));
    const svg = d3.select(this.$refs.svgfield);
    this.pathDiagram = new PathDiagramD3(svg, this.ds.matrix,
      this.ds.names,
      this.ds.row_names);
    this.resizeObserver = new ResizeObserver(this.resizeHandler);
    this.resizeObserver.observe(this.$refs.svg);
    this.resizeHandler();
  }
};
</script>
