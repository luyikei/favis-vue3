<template>
  <v-app>
    <v-main>
      <MultipleViewCor3 v-if="tab.type == 'multiplecor3'" :ds="ds"></MultipleViewCor3>
    </v-main>
  </v-app>
</template>

<style scoped>
</style>

<script>

import MultipleViewCor4 from '@/views/MultipleViewCor4.vue';
import {BFIgeomin, APCAT} from '@/objs/Dataset.js';

export default {
  name: 'Home',

  components: {
    MultipleViewCor4
  },

  data: () => ({
    ds: BFIgeomin  
  }),

  methods: {
  }
};
</script>