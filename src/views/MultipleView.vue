<template>
  <v-row  no-gutters>
    <v-col md="5">
      <Network :ds="ds" :networkProps="networkProps" :commonProps="commonProps" @selectionChanged="selectionChanged"
      @clicked="clickedChanged"></Network>
    </v-col>
      <v-divider vertical></v-divider>
    <v-col md="5">
      <Heatmap :ds="ds" :heatmapProps="heatmapProps" :commonProps="commonProps" @clicked="clickedChanged"></Heatmap>
    </v-col>
      <v-divider vertical></v-divider>
    <v-col md="2" class="scrollable">
      <CommonControls :ds="ds" :selection="selection" :clicked="clicked" @updated="commonPropsUpdated"></CommonControls>
      <v-divider class="mx-4"></v-divider>
      <NetworkControls :ds="ds" @updated="networkPropsUpdated"></NetworkControls>
      <v-divider class="mx-4"></v-divider>
      <HeatmapControls :ds="ds" @updated="heatmapPropsUpdated"></HeatmapControls>
    </v-col>
  </v-row> 
</template>

<style>
body {
  overflow: hidden;
}
</style>

<style scoped>
.scrollable {
  height: calc(100vh - 65px);
  overflow-y: scroll;
  overflow-x: hidden;
  padding-right: 20px;
}
</style>


<script>
import CommonControls from '@/components/CommonControls.vue'
import NetworkControls from '@/components/NetworkControls.vue'
import HeatmapControls from '@/components/HeatmapControls.vue'
import Network from '@/components/Network.vue';
import Heatmap from '@/components/Heatmap.vue';
import * as d3 from "d3";

export default {
  props: ["ds"],
  components: {
      Network,
      Heatmap,
      NetworkControls,
      HeatmapControls,
      CommonControls
  },
  data() {
    return {
      networkProps: {},
      heatmapProps: {},
      commonProps: {},
      selection: {},
      clicked: {}
    }
  },
  methods: {
    networkPropsUpdated(networkProps) {
      this.networkProps = networkProps;
    },
    heatmapPropsUpdated(heatmapProps) {
      this.heatmapProps = heatmapProps;
    },
    selectionChanged(selection) {
      this.selection = selection;
    },
    clickedChanged(clicked) {
      this.clicked = clicked;
    },
    commonPropsUpdated(props) {
      this.commonProps = props;
    }
  },
  mounted() {
  },
};
</script>
