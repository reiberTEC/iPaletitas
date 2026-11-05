import './assets/main.css'
import './lib/tema'
import { escucharInstalacion, marcarModoApp } from './lib/app'

import { createApp } from 'vue'
import App from './App.vue'

marcarModoApp()
escucharInstalacion()

createApp(App).mount('#app')
