<template>
  <v-sheet>
  <v-card-title>Heatmap</v-card-title>
  <v-card-text>
      <v-slider
        v-model.number="heatmapProps.scale"
        label="Scale"
        min="0.25"
        max="4"
        step="0.01"
        :thumb-size="24"
        thumb-label="always"
        >
      </v-slider>
  <v-btn
    block
    outlined
    color="indigo"
    v-on:click="resetSorting"
    depressed
    class="mb-4"  
  >
  Reset Sorting
  </v-btn>
  
  <v-checkbox
    v-model="heatmapProps.isAbs"
    label="Use Absolute Values"
  ></v-checkbox>
  <v-checkbox
    v-model="heatmapProps.isT"
    label="Transposed"
  ></v-checkbox>
  <v-checkbox
    v-model="heatmapProps.isThresholded"
    label="Threshold"
  ></v-checkbox>
  <v-checkbox
    v-model="heatmapProps.tocolorfactor"
    label="Factor Color"
  ></v-checkbox>
  <v-checkbox
    v-model="heatmapProps.sortOnClick"
    label="Sort on Click"
  ></v-checkbox>
  </v-card-text>
  </v-sheet>
</template>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
.v-input .v-label {
    font-size: 5em;
}
</style>

<script>
import * as d3 from "d3";

export default {
  props: ["ds"],
  data() {
    return {
      heatmapProps: {
        scale: 1,
        isAbs: false,
        isT: false,
        tocolorfactor: false,
        isThresholded: true,
        sortOnClick: true,
        searchText: "",
        resetSorting: 0,
      },
        thres_max: 1
      }
  },
  watch: {
    heatmapProps: {
      handler(val){
        this.$emit('updated', this.heatmapProps);
      },
      deep: true
    },
  },
  mounted(){
    this.$emit('updated', this.heatmapProps);
  },
  methods: {
    resetSorting() {
      this.heatmapProps.resetSorting += 1
      this.$emit('updated', this.heatmapProps);
    }
  },
};
</script>
