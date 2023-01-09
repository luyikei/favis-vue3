<template>
  <v-row no-gutters>
    <v-col md="5">
        <v-card><Network :ds="ds" :networkProps="networkProps" :showControls="false" @selectionChanged="selectionChanged"></Network></v-card>
    </v-col>
    <v-col md="5">
        <v-card><Heatmap :ds="ds" :showControls="false"></Heatmap></v-card>
    </v-col>
    <v-col md="2">
      <NetworkControls :ds="ds" :selection="selection" @updated="networkPropsUpdated"></NetworkControls>
    </v-col>
  </v-row> 
</template>


<script>
import NetworkControls from '@/components/NetworkControls.vue'
import Network from '@/components/Network.vue';
import Heatmap from '@/components/Heatmap.vue';
import * as d3 from "d3";

export default {
  props: ["ds"],
  components: {
      Network,
      Heatmap,
      NetworkControls
  },
  data() {
    return {
      networkProps: {},
      selection: {}
    }
  },
  methods: {
    networkPropsUpdated(networkProps) {
      this.networkProps = networkProps;
    },
    selectionChanged(selection) {
      this.selection = selection;
      console.log(this.selection);
    },
  },
  mounted() {
  },
};
</script>
