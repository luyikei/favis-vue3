<template>
  <v-row  no-gutters style="height: 100%;">
    <v-col md="10" class="d-flex flex-column" style="height: calc(100vh); ">
      <div class="d-flex flex-row" style="flex: 2 1 auto; width: 100%;">
        <div style="flex: 3 0 0; position: relative;">
          <div class="viewtitle" style="position: absolute; top: 0; left: 0;">Network</div>
          <Network :ds="ds" :networkProps="networkProps" :commonProps="commonProps"></Network>
        </div>
        <v-divider vertical></v-divider>
        <div v-if="ds.phi" style="flex: 1 0 0; position: relative;">
          <div class="viewtitle" style="position: absolute; top: 0; left: 0;">Factor Correlation</div>
        <NetworkCor :ds="ds" :commonProps="commonProps"></NetworkCor>
        </div>
        <v-divider vertical></v-divider>
        <div style="flex: 3 0 0; position: relative;">
          <div class="viewtitle" style="position: absolute; top: 0; left: 0;">Heatmap</div>
        <Heatmap :ds="ds" :heatmapProps="heatmapProps" :commonProps="commonProps"></Heatmap>
        </div>
      </div>
      <v-divider ></v-divider>
      <div style="flex: 1 1 auto; width: 100%;" class="d-flex flex-row" >
        <div style="flex: 1 1 auto; position: relative;">
        <div class="viewtitle" style="position: absolute; top: 0; left: 0;">Parallel Coordinates: Variables</div>
        <ParallelCoordinates :ds="ds" :factorAxis="true" :isFactor="false" :commonProps="commonProps"></ParallelCoordinates></div>
        <v-divider vertical></v-divider>
        <div style="flex: 1 1 auto; position: relative;">
        <div class="viewtitle" style="position: absolute; top: 0; left: 0;">Parallel Coordinates: Factors</div>
        <ParallelCoordinates :ds="ds" :factorAxis="false" :isFactor="true" :commonProps="commonProps"></ParallelCoordinates></div>
      </div>
      <v-divider ></v-divider>
      <div style="flex-shrink: 1;">
        <Table :ds="ds" :commonProps="commonProps"></Table>
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
  height: calc(100vh);
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
import ParallelCoordinates from '@/components/ParallelCoordinates.vue';
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
      Table,
      ParallelCoordinates
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
      this.$store.commit("updateSelection", selection);
    },
    clickedChanged(clicked) {
      this.$store.commit("updateClicked", clicked);
    },
    commonPropsUpdated(props) {
      this.commonProps = props;
    }
  },
  mounted() {
  },
};
</script>
