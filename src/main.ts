import './assets/styles/base.css'

import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'
import { usePwaUpdate } from '@/composables/usePwaUpdate'

const app = createApp(App)

app.use(createPinia())
app.use(router)

app.mount('#app')

// Register PWA service worker — auto-updates and reloads when new version is deployed
usePwaUpdate()
