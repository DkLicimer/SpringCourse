/**
 * main.js
 *
 * Bootstraps Vuetify and other plugins then mounts the App`
 */


// Components
import App from './App.vue'

// Composables
import {createApp} from 'vue'
import {createPinia} from 'pinia'
// Plugins
import {registerPlugins} from '@/plugins'
import '@yasanchezz/vue-mask-email/dist/style.css';

const app = createApp(App)


registerPlugins(app)
const pinia = createPinia()
app.use(pinia)
app.mount('#app')
