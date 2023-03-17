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
import { faviscolorscheme, faviscolorscale, Legend } from "@/objs/d3colorlegend.js"
import { Tooltip } from '@/objs/d3tooltip.js';
import { ParallelCoordinatesD3 } from '@/objs/d3ParallelCoordinates.js'
import { classicalElectronRadiusDependencies } from "mathjs";

import { useCommonProps } from '@/objs/commonProps.js'

export default {
  props: ["ds", "commonProps", "factorAxis", "isFactor"],
  emits: ['clicked', 'selectionChanged'],
  data() {
    const { clicked, selection, dropIndices, order, filterOrder } = useCommonProps();
    return {
      width: 0,
      height: 0,
      x: 0,
      y: 0,
      selection: selection,
      clicked: clicked,
      order: order,
      dropIndices,
      filterOrder,
      cScale: faviscolorscale,
    };
  },
  computed: {
    svgGOffeset() {
      return `translate(0, 0)`;
    },
  },
  methods: {
    resizeHandler(event) {
      if (this.d3PC) {
        this.width = this.$refs.svg.clientWidth;
        this.height = this.$refs.svg.clientHeight;
        this.d3PC.updateSize(this.width, this.height);
      };
    },
  },
  watch: {
    selection() {
      this.d3PC.onSelected(this.selection);
    },
    clicked() {
      this.d3PC.onClicked(this.clicked);
    },
    dropIndices() {
      if (this.isFactor) this.d3PC.updateFilter(this.dropIndices.var);
      else this.d3PC.updateFilter(this.dropIndices.factor);
    },
    order() {
      if (this.isFactor) this.d3PC.updateOrder(this.order.var);
      else this.d3PC.updateOrder(this.order.factor);
    },
  },
  created() {
    window.addEventListener('resize', this.resizeHandler);
  },
  destroyed() {
    window.removeEventListener('resize', this.resizeHandler);
  },
  mounted() {
    this.d3PC = new ParallelCoordinatesD3(
      d3.select(this.$refs.svgfield),
      this.factorAxis ? this.ds.tablet : this.ds.table,
      this.ds.names,
      this.ds.row_names, {
      width: 200,
      height: 100,
      label: this.factorAxis ? d => d.Factor : d => d.Variable,
      isFactor: this.isFactor,
      selectionChangedCb: (selection) => {
        if (this.isFactor) this.selection.factor = new Set(selection);
        else this.selection.var = new Set(selection);
        this.$store.commit("updateSelection", this.selection);
      }
    });
    this.tooltip = new Tooltip(this.$refs.tooltip);
    this.d3PC.path
      .on("mouseover", (event, d) => {
        this.tooltip.mouseover(event);
      })
      .on("mousemove", (event, d) => {
        if (this.isFactor)
          this.tooltip.mousemove(event, {
            var: null,
            factor: d.Factor,
            codebook: null
          });
        else
          this.tooltip.mousemove(event, {
            var: d.Variable,
            factor: null,
            codebook: null
          });
      })
      .on("mouseleave", (event) => this.tooltip.mouseleave(event));

    d3.select(this.$refs.svg)
      .attr("pointer-events", "all")
      .on("click", () => {
        this.selection.var.clear();
        this.selection.factor.clear();
        this.$store.commit("updateSelection", this.selection);
        this.$store.commit("updateClicked", {
          var: null,
          factor: null,
          sort: null
        });
        this.d3PC.clear();
      });
    this.resizeObserver = new ResizeObserver(this.resizeHandler);
    this.resizeObserver.observe(this.$refs.svg);
    this.resizeHandler();
  }
};
</script>
  