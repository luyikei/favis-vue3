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
  import {faviscolorscheme, faviscolorscale, Legend} from "@/objs/d3colorlegend.js"
  import {Tooltip} from '@/objs/d3tooltip.js';
  import {ParallelCoordinatesD3} from '@/objs/d3ParallelCoordinates.js'
  import { classicalElectronRadiusDependencies } from "mathjs";
  
  export default {
    props: ["ds", "commonProps", "factorAxis", "isFactor"],
    emits: ['clicked', 'selectionChanged'],
    data() {
      return {
        width: 0,
        height: 0,
        x:0,
        y:0,
        clicked: {
          var: null,
          factor: null,
          sort: null
        },
        d3PC: null,
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
        this.width = this.$refs.svg.clientWidth;
        this.height = this.$refs.svg.clientHeight;
        if (this.d3PC) {
          this.d3PC.updateSize(this.width, this.height);
        };
      },
    },
  watch: {
    commonProps: {
      handler(commonProps){
        this.clicked = {
          var: commonProps.clickedVar,
          factor: commonProps.clickedFactor,
          sort: commonProps.clickedSort
        };
        this.d3PC.onClicked(this.clicked);
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
      this.d3PC = new ParallelCoordinatesD3(
        d3.select(this.$refs.svgfield),
      this.factorAxis ? this.ds.tablet : this.ds.table,
      this.ds.names,
      this.ds.row_names, {
        width: 200,
        height: 200,
        label: this.factorAxis ? d => d.Factor : d => d.Variable,
        isFactor: this.isFactor
      });
      this.resizeObserver = new ResizeObserver(this.resizeHandler);
      this.resizeObserver.observe(this.$refs.svg);
      this.resizeHandler();
    }
  };
  </script>
  