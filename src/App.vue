<template>
  <v-app>
    <v-main>
      <MultipleViewCor6 :ds="ds"></MultipleViewCor6>
    </v-main>
  </v-app>
</template>

<style scoped></style>

<script>

import MultipleViewCor6 from '@/views/MultipleViewCor6.vue';
import { BFIgeomin, APCAT } from '@/objs/Dataset.js';

export default {
  name: 'Home',

  components: {
    MultipleViewCor6
  },

  data: () => ({
    ds: BFIgeomin
  }),

  methods: {
  }
};
</script>