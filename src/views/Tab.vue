<template>
  <v-container fluid class="d-flex flex-column pa-0" style="height: 100vh;">
  <v-toolbar color="white" :elevation="2" >
    <v-tabs
      v-model="curTab"
    >
      <v-tab
        v-for="tab in tabs"
        :key="tab.title"
      >
        {{tab.title}}
        <v-btn icon v-on:click="deleteTab(tab)" v-if="tab.type != 'home'" class="ml-2"><v-icon icon="mdi-close" x-small></v-icon></v-btn
          >
      </v-tab>

    </v-tabs>
  </v-toolbar>
    <v-window  v-model="curTab" class="flex-grow-1 flex-shrink-0 mt-1" ref="tabWindow" style="height: 100%;">
      <v-window-item
        v-for="tab in tabs"
        :key="tab.title" style="height: 100%;"
      >
        <Network v-if="tab.type == 'network'" :ds="tab.data" :showControls="true"></Network>
        <Heatmap v-if="tab.type == 'heatmap'" :ds="tab.data" :showControls="true"></Heatmap>
        <MultipleView v-if="tab.type == 'multiple'" :ds="tab.data"></MultipleView>
        <MultipleViewCor v-if="tab.type == 'multiplecor'" :ds="tab.data"></MultipleViewCor>
        <MultipleViewCor2 v-if="tab.type == 'multiplecor2'" :ds="tab.data"></MultipleViewCor2>
        <MultipleViewCor3 v-if="tab.type == 'multiplecor3'" :ds="tab.data"></MultipleViewCor3>
        <v-card-text v-if="tab.type == 'home'">{{tab.type}}</v-card-text>
      </v-window-item>
    </v-window>
  </v-container>
    <!-- <v-card-text class="text-center">
      <v-btn
        :disabled="!tabs"
        text
        v-on:click="deleteTab"
      >
        Remove Tab
      </v-btn>
      <v-divider
        class="mx-4"
        vertical
      ></v-divider>
      <v-btn
        text
        v-on:click="createTab"
      >
        Add Tab
      </v-btn>
    </v-card-text> -->
</template>

<style>
.vh-100 {
  height: 100vh;
}
</style>

<script>
import Network from '@/components/Network.vue';
import Heatmap from '@/components/Heatmap.vue';
import MultipleView from '@/components/MultipleView.vue';
import MultipleViewCor from '@/components/MultipleViewCor.vue';
import MultipleViewCor2 from '@/components/MultipleViewCor2.vue';
import MultipleViewCor3 from '@/components/MultipleViewCor4.vue';
import {Tab} from '@/objs/Tab.js';
import {BFIgeomin, APCAT} from '@/objs/Dataset.js';
import * as d3 from "d3";

export default {
    components: {
      Network,
      Heatmap,
      MultipleView,
      MultipleViewCor,
      MultipleViewCor2,
      MultipleViewCor3
    },
    data() {
        return {
        curTab: null,
        length: 10
        };
    },
    computed: {
      tabs () {
        return this.$store.state.tabs
      }
    },
    mounted() {
      //this.$store.commit('addDS', APCAT);
      //this.$store.commit('appendTab', Tab.Types.NETWORK);
      //this.$store.commit('appendTab', Tab.Types.HEATMAP);
      //this.$store.commit('appendTab', Tab.Types.MULTIPLE);
      //this.$store.commit('appendTab', Tab.Types.MULTIPLECOR2);
      //this.$store.commit('appendTab', Tab.Types.MULTIPLECOR3);
      this.$store.commit('addDS', BFIgeomin);
      //this.$store.commit('appendTab', Tab.Types.NETWORK);
      //this.$store.commit('appendTab', Tab.Types.HEATMAP);
      //this.$store.commit('appendTab', Tab.Types.MULTIPLE);
      this.$store.commit('appendTab', Tab.Types.MULTIPLECOR);
      this.$store.commit('appendTab', Tab.Types.MULTIPLECOR2);
      this.$store.commit('appendTab', Tab.Types.MULTIPLECOR3);
      console.log("TAB: mounted");
    },
    watch: {
      tabs() {
        console.log("TAB: tab change detected")
      }
    },
    methods: {
      deleteTab(value) {
        let index = this.tabs.indexOf(value);
        this.$store.commit('deleteTab', index);
      },
      createTab() {
        this.tabs.push(new Tab("test title", Tab.Types.DATA));
      }
    },
}
</script>