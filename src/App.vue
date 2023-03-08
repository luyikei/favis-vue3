<template>
  <v-app>
    <v-main>
      <MultipleViewCor5 :ds="ds"></MultipleViewCor5>
    </v-main>
  </v-app>
</template>

<style scoped>
</style>

<script>

import MultipleViewCor5 from '@/views/MultipleViewCor5.vue';
import {BFIgeomin, APCAT} from '@/objs/Dataset.js';

export default {
  name: 'Home',

  components: {
    MultipleViewCor5
  },

  data: () => ({
    ds: APCAT  
  }),

  methods: {
  }
};
</script>