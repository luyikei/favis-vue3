<template>
  <v-sheet>
    <v-card-title>Network</v-card-title>
    <v-card-text>
      <v-slider
        v-model.number="networkProps.scale"
        min="0.25"
        max="4"
        step="0.01"
        label="Scale"
        :thumb-size="12"
        thumb-label
        hide-details="auto"
        class="pb-5"
        >
      </v-slider>
      <v-slider
        v-model.number="networkProps.link_opacity"
        label="Link Opacity"
        min="0.0"
        max="1.0"
        step="0.1"
        :thumb-size="12"
        thumb-label
        hide-details="auto"
      class="pb-5"
        >
      </v-slider>
      <v-slider
        v-model.number="networkProps.opacityisolated"
        min="0"
        max="1"
        step="0.01"
        label="Opacity for IN"
        :thumb-size="12"
        thumb-label
        hide-details="auto"
        class="pb-5"
        >
      </v-slider>
      <v-checkbox
        v-model="networkProps.link_color"
        label="Use Factor Color for Link"
        hide-details="auto"
      class="pb-2"
      ></v-checkbox>
      <v-checkbox
        v-model="networkProps.displayHull"
        label="Disply Convex Hull"
        hide-details="auto"
      ></v-checkbox >
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
        link_color: false,
        displayHull: true,
        selected: "",
        selectedPC: "",
      },
      }
  },
  watch: {
    networkProps: {
      handler(val){
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
