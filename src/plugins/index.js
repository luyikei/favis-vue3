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
      order: [],
      rorder: [],
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
      filtered: {
        var: null,
        factor: null
      }
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
    getROrder(state) {
      return state.rorder;
    },
    getFiltered(state) {
      return state.filtered;
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
    updateROrder (state, rorder) {
      state.rorder = rorder;
    },
    updateFiltered (state, filtered) {
      state.filtered = filtered;
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
