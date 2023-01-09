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
        dss: [],
        tabs: [new Tab("Getting Started", "test", Tab.Types.HOME)]
    }
  },
  mutations: {
    addDS (state, ds) {
      state.dss.push(ds);
    },
    appendTab (state, type) {
      state.tabs.push(new Tab(type.toUpperCase(), state.dss.slice(-1)[0], type));
    },
    deleteTab (state, index) {
      state.tabs.splice(index, 1);
    },
  }
})

export function registerPlugins (app) {
  loadFonts()
  app
    .use(vuetify)
    .use(router)
    .use(store)
}
