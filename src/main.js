import { createApp } from 'vue'
import App from './App.vue'

createApp(App).mount('#app')

if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((regs) => {
    for (const reg of regs) reg.unregister()
  })
}
