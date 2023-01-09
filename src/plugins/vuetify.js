/**
 * plugins/vuetify.js
 *
 * Framework documentation: https://vuetifyjs.com`
 */

// Styles
import '@mdi/font/css/materialdesignicons.css'
import 'vuetify/styles'

// Composables
import { createVuetify } from 'vuetify'

import * as components from 'vuetify/components'
import * as directives from 'vuetify/directives'
import colors from "vuetify/lib/util/colors"

// https://vuetifyjs.com/en/introduction/why-vuetify/#feature-guides
export default createVuetify({
  components,
  directives,
  theme: {
		light: true,
		dark: false,

		themes: {
			light: {
				primary: "#0C2340", //
				secondary: "#5AABBC", //
				accent: "#D39F10",
				error: colors.red,
				info: colors.grey,
				success: colors.green,
				warning: colors.yellow,
				background: colors.white,
			},
			dark: {
				primary: "#0C2340", //
				secondary: "#5AABBC", //
				accent: "#ae9142",
				error: colors.red,
				info: colors.grey,
				success: colors.green,
				warning: colors.yellow,
				background: colors.white,
			}
		},
    options: {
        customProperties: true
    },
		iconfont: "md",
		icons: {
			iconfont: "md"
		}
  },
})
