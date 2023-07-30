/**
 * plugins/index.js
 *
 * Automatically included in `./src/main.js`
 */

// Plugins
import { loadFonts } from './webfontloader'
import vuetify from './vuetify'
import router from '../router'
import { createStore } from 'vuex'

import {Tab} from '@/objs/Tab.js';

// Create a new store instance.
const store = createStore({
  state () {
    return {
      currentds: 0,
      dss: [],
      order: {
        var: undefined,
        factor: undefined
      },
      hover: {
        var: undefined,
        factor: undefined
      },
      selection: {
        var: new Set(),
        factor: new Set()
      },
      clicked: {
        var: null,
        factor: null,
        sort: null
      },
      dropIndices: {
        var: new Set(),
        factor: new Set()
      },
      nLimit: {
        var: undefined,
        factor: undefined
      },
    }
  },
  getters: {
    getHover(state) {
      return state.hover;
    },
    getSelection(state) {
      return state.selection;
    },
    getClicked(state) {
      return state.clicked;
    },
    getOrder(state) {
      return state.order;
    },
    getDropIndices(state) {
      return state.dropIndices;
    },
    getNLimit(state) {
      return state.nLimit;
    }
  },
  mutations: {
    addDS (state, ds) {
      state.dss.push(ds);
    },
    updateHover (state, hover) {
      state.hover = hover;
    },
    updateSelection (state, selection) {
      state.selection = selection;
    },
    updateClicked (state, clicked) {
      state.clicked = clicked;
    },
    updateOrder (state, order) {
      state.order = order;
    },
    updateDropIndices (state, dropIndices) {
      state.dropIndices = dropIndices;
    },
    updateNLimit (state, nLimit) {
      state.nLimit = nLimit;
    }
  }
})

export function registerPlugins (app) {
  loadFonts()
  app
    .use(vuetify)
    .use(router)
    .use(store)
}
