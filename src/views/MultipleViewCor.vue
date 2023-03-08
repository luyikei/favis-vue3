<template>
  <v-row  no-gutters style="height: 100%;">
    <v-col md="5" class="d-flex flex-column" style="height: calc(100vh - 65px);">
      <div style="flex:  1 0 auto;">
      <div class="viewtitle">Graph View</div>
      <Network :ds="ds" :networkProps="networkProps" :commonProps="commonProps" @selectionChanged="selectionChanged"
      @clicked="clickedChanged"></Network>
      </div>
      <v-divider></v-divider>
      <div style="flex:  1 0 auto; position: relative;">
      <div class="viewtitle">Factor Correlations View</div>
      <NetworkCor :ds="ds" :commonProps="commonProps" @selectionChanged="selectionChanged"
      @clicked="clickedChanged"></NetworkCor>
      </div>
    </v-col>
      <v-divider vertical></v-divider>
    <v-col md="5" class="d-flex flex-column" style="height: 100%;">
      <div class="flex-grow-0"><Table :ds="ds"></Table></div>
      <v-divider></v-divider>
      <div class="flex-grow-1" style="position: relative;">
        <div class="viewtitle">Heatmap View</div>
        <Heatmap :ds="ds" :heatmapProps="heatmapProps" :commonProps="commonProps" @clicked="clickedChanged"></Heatmap>
      </div>
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

.viewtitle {
  font-size: small;
}
</style>


<script>
import CommonControls from '@/components/CommonControls.vue'
import NetworkControls from '@/components/NetworkControls.vue'
import HeatmapControls from '@/components/HeatmapControls.vue'
import Network from '@/components/Network.vue';
import NetworkCor from '@/components/NetworkCor.vue';
import Table from '@/components/Table.vue';
import Heatmap from '@/components/Heatmap.vue';
import * as d3 from "d3";

export default {
  props: ["ds"],
  components: {
      Network,
      NetworkCor,
      Heatmap,
      NetworkControls,
      HeatmapControls,
      CommonControls,
      Table
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
