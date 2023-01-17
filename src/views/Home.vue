<template>
  <v-app>
    <v-main>
      <Tab></Tab>
    </v-main>
  </v-app>
</template>

<style scoped>
</style>

<script>
import Tab from '@/views/Tab.vue';

export default {
  name: 'Home',

  components: {
    Tab
  },

  data: () => ({
    //
  }),
  methods: {
    createHeatMap() {
    },
    createNetwork() {
    },
    createGraph() {
    }

  }
};
</script>