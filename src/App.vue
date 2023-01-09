<template>
  <v-app>
    <v-main>
      <Tab></Tab>
    </v-main>
  </v-app>
</template>

<script>
import Tab from '@/views/Tab.vue';

export default {
  name: 'App',

  components: {
    Tab
  },

  data: () => ({
    //
  }),
  methods: {
    createHeatMap() {
      console.log(this.$tabs);
      console.log("create heatmap")
    },
    createNetwork() {
      console.log("creating network")
    },
    createGraph() {
      console.log("creating graph")
    }

  }
};
</script>