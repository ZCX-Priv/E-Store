import { createApp } from 'vue'
import { createPinia } from 'pinia'
import { MotionPlugin } from '@vueuse/motion'
import App from './App.vue'
import './styles/variables.css'
import './styles/base.css'
import './styles/animations.css'

// 创建应用实例并注册插件
const app = createApp(App)
app.use(createPinia())
app.use(MotionPlugin)
app.mount('#app')
