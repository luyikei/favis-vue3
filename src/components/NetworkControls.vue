<template>
  <v-sheet>
    <v-card-title>Network</v-card-title>
    <v-card-text>
      <v-slider v-model.number="networkProps.scale" min="0.25" max="4" step="0.01" label="Scale" :thumb-size="12"
        thumb-label hide-details="auto" class="pb-5">
      </v-slider>
      <v-slider v-model.number="networkProps.attractiveForce" min="1" max="10" step="0.1" label="Attractive Force"
        :thumb-size="12" thumb-label hide-details="auto" class="pb-5">
      </v-slider>
      <v-slider v-model.number="networkProps.repulsiveForce" min="0" max="100" step="0.1" label="Repulsive Force"
        :thumb-size="12" thumb-label hide-details="auto" class="pb-5">
      </v-slider>
      <v-slider v-model.number="networkProps.link_opacity" label="Link Opacity" min="0.0" max="1.0" step="0.1"
        :thumb-size="12" thumb-label hide-details="auto" class="pb-5">
      </v-slider>
      <v-select v-model="networkProps.node_color" :items="networkProps.node_color_items" filled label="Node Color"
        return-object></v-select>
      <v-select v-model="networkProps.link_color" :items="networkProps.link_color_items" filled label="Link Color"
        return-object></v-select>
      <v-slider v-model.number="networkProps.opacityisolated" min="0" max="1" step="0.01" label="Sole Node Op"
        :thumb-size="12" thumb-label hide-details="auto" class="pb-5">
      </v-slider>
      <v-checkbox v-model="networkProps.displayHull" label="Disply Convex Hull" hide-details="auto"></v-checkbox>
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
      networkProps: {
        scale: 1,
        opacityisolated: 0.1,
        link_opacity: 0.6,
        link_color: "Factor",
        link_color_items: ["Factor", "Mean of Two Factor Loadings", "Gray"],
        node_color: "Factor with Biggest Loading",
        node_color_items: ["Factor with Biggest Loading", "Number of Cross Loadings"],
        displayHull: true,
        attractiveForce: 10,
        repulsiveForce: 30,
      },
    }
  },
  watch: {
    networkProps: {
      handler(val) {
        this.$emit('updated', this.networkProps);
      },
      deep: true
    },
  },
  methods: {
  },
  mounted() {
    this.$emit('updated', this.networkProps);
  },
};
</script>
